# 地图关卡逻辑重新设计

> 日期：2026-06-20
> 状态：已确认，待实现

## 一、背景与目标

### 1.1 现状

当前地图关卡为**固定 6 关/年级**（L1-L5 + L6_BOSS），共 72 关。关卡元数据存于 `t_level` 表，题目通过 `level_id` 外键关联关卡。出题算法 `generateQuestions`（[server/services/content.ts](file:///Users/wangzeming/duoinguo/math-quest/server/services/content.ts) 第 601-742 行）按知识点掌握度分配题数（权重 3/2/1），再按掌握度偏好选难度范围。

**现有问题**：
- 关卡数固定，无法反映题库中知识点的实际数量与变化
- 出题权重是硬切三档（<0.3 / <0.7 / 其他）的范围筛选，非真正的加权抽取
- 无错题重做机制，错题本仅展示不重做
- 难度无法根据用户实时表现自适应

### 1.2 目标

1. **动态关卡**：地图关卡按题库中每个知识点动态生成一关 + 1 个 BOSS 关，关卡数 = 知识点数 + 1
2. **难度权重自适应**：每关开始时根据用户长期掌握度 + 上一关连击信号，按三档加权抽取不同难度题目
3. **错题递增间隔重做**：做错的题按递增间隔（2/5/10/15 关）到期插入当前关重做，答对 2 次移出
4. **后台可配置**：权重系数、间隔参数、每关题数等均可在后台管理配置

### 1.3 设计决策汇总

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 数据模型方案 | 方案 B：物化关卡 + 自动同步 | level_id 稳定，不随改名断裂；多邻国同款 |
| 关卡 id 格式 | `g{grade}-L{序号}` | 稳定、不随知识点改名变化 |
| 旧关卡数据 | 直接覆盖迁移 | 用户确认 |
| 关卡划分粒度 | 按知识点生成 | 每个知识点一关 |
| BOSS 关 | 保留 | 混合所有知识点、高难度 |
| 权重模型 | 三档加权 + 连击即时触发档位 | 多邻国模式，反馈快 |
| 连击作用时机 | 每关开始时根据上一关连击出题 | 改动小，性价比高 |
| 权重系数 | 后台可配置 | 用户要求 |
| 错题间隔 | 递增（2/5/10/15 关） | 类 Anki |
| 错题答对移出 | 答对 2 次才移出 | 更严格 |
| 错题到期插入 | 到期就插入，+1~2 题 | 不替换当关题 |
| 跨年级错题 | 暂不处理（无切换年级入口） | 后续支持切换时从头开始 |
| BOSS 关解锁 | 完成所有知识点关 | 用户确认 |
| t_session 历史记录 | 保留不动 | level_id 变化不影响历史数据 |

---

## 二、数据模型与迁移

### 2.1 t_level 表（结构不变，数据重建）

表结构复用现有字段，无 DDL 变更：

| 字段 | 新含义 |
|------|--------|
| `id` | `g{grade}-L{序号}`（如 g1-L1, g1-L2...），BOSS = `g{grade}-BOSS` |
| `grade` | 年级 |
| `chapter` | 知识点名称（如"5以内加法"）|
| `is_boss` | BOSS 关 = 1，其他 = 0 |
| `sort_order` | 按该知识点 avg(difficulty_score) 升序赋值，BOSS 固定 999 |
| `unit_id` | 保留，可选 |

### 2.2 t_question 表（无结构变更）

`difficulty_score`（1-10）已存在，无需改表。仅 `level_id` 数据需重新指向新关卡。

### 2.3 t_mistake 表（新增 4 列）

新增 `due_level_offset`、`repetition`、`last_level_sort`、`correct_count` 四个字段，支撑间隔重复与答对计数。完整 DDL 见 [4.5 节](#45-t_mistake-最终新增字段)。

### 2.4 关卡自动同步（新增 `syncLevelsFromQuestions`）

**触发时机**：①后端启动时 ②管理后台新增/导入题目后 ③手动调 `POST /api/content/sync-levels`

**同步逻辑**：
```
syncLevelsFromQuestions():
  1. 扫描 t_question，按 (grade, knowledge_point) 分组
  2. 每组算 avg(difficulty_score)，按升序赋 sort_order（avg 相同时按知识点名排序保证稳定）
  3. 为每个 (grade, knowledge_point) upsert t_level 行：
     id = g{grade}-L{sort_order}, chapter = knowledge_point, is_boss = 0
  4. 为每个 grade upsert BOSS 关：id = g{grade}-BOSS, is_boss = 1, sort_order = 999
  5. 批量 update t_question.level_id 指向新关卡 id
  6. 清除 Redis 缓存（content:grade:*, content:level:*）
```

### 2.5 数据迁移脚本 `scripts/migrate-levels-to-knowledge.ts`

一次性迁移，执行顺序：
1. 调用 `syncLevelsFromQuestions()` 重建 t_level + 更新 t_question.level_id
2. 删除旧 t_level 行（g{grade}-L1~L6_BOSS 共 72 行，已被新行覆盖）
3. **t_session 保留不动**（历史记录，level_id 变化不影响新逻辑）
4. **t_mistake 清空**（因 level_id 变化，旧错题关联失效，重新基于新 level_id 积累）
5. 清 Redis 缓存

---

## 三、三档加权 + 连击即时触发出题算法

### 3.1 档位判定（双信号融合）

每个知识点有两个信号决定出题档位：

| 信号 | 来源 | 说明 |
|------|------|------|
| 长期掌握度 `mastery` | `userMastery[kp]`（0-1）| 跨会话积累，`updateMastery` 维护 |
| 即时连击 `combo` | 上一关结束时的连击数 | 跨关延续，首关传 0 |

**档位判定逻辑**（即时信号优先）：
```
判定档位(kp, mastery, lastCombo):
  // 长期信号
  longTier = mastery < 0.3 ? 'struggle' : mastery < 0.7 ? 'normal' : 'master'
  // 即时信号（上一关连击）
  if lastCombo >= 5: instantTier = 'master'      // 连对5题→升档
  elif lastCombo <= 1 and mastery < 0.7: instantTier = 'struggle'  // 连对少→降档
  else: instantTier = longTier
  // 取即时信号
  tier = instantTier
```

### 3.2 三档权重系数（后台可配）

难度分档：`difficulty_score` 1-3 简单、4-7 中等、8-10 困难。

| 档位 | 简单(1-3) | 中等(4-7) | 困难(8-10) | 默认说明 |
|------|----------|----------|-----------|---------|
| struggle 挣扎 | 5 | 3 | 1 | 大量简单题巩固 |
| normal 正常 | 2 | 5 | 3 | 中等题为主 |
| master 精通 | 1 | 3 | 5 | 偏困难题挑战 |

抽取方式：按权重**加权随机**（非硬筛），保证题序有波动、不可预测。

### 3.3 出题流程（改造 `generateQuestions`）

```
generateQuestions(levelId, userMastery, recentQuestionIds, lastCombo, userId):
  level = getLevelDetail(levelId)
  allQ = level.questions

  // BOSS 关：保留原逻辑（混合所有知识点、偏好高难度）
  if level.isBoss:
    return bossLogic(allQ, recentQuestionIds)  // 不变

  // 普通关（单知识点）
  kp = level.knowledgePoints[0]
  mastery = userMastery[kp] ?? 0
  tier = 判定档位(kp, mastery, lastCombo)
  weights = readConfig('question.weight.' + tier)  // {easy, mid, hard}

  // 按难度分桶
  easy = allQ.filter(q => ds(q) 1-3)
  mid  = allQ.filter(q => ds(q) 4-7)
  hard = allQ.filter(q => ds(q) 8-10)

  // 按权重分配题数
  total = readConfig('question.total.max')  // 默认 10
  total = min(max(readConfig('question.total.min'), allQ.length), total)
  sum = weights.easy + weights.mid + weights.hard
  nEasy = round(total * weights.easy / sum)
  nMid  = round(total * weights.mid  / sum)
  nHard = round(total * weights.hard / sum)
  // 修正舍入使总和 = total

  // 各桶内过滤 recentQuestionIds 后随机抽取
  selected = [sample(easy, nEasy), sample(mid, nMid), sample(hard, nHard)]

  // 插入到期错题
  selected = insertDueMistakes(selected, userId, level.sortOrder)

  return shuffle(selected)
```

### 3.4 连击信号传递

- 前端 `Home.tsx` 的 `enterLevel` 调 `generateQuestions` 时，`lastCombo` 传**上一关结束时的 comboMax**（从 `useSessionStore` 或 `useUserStore` 读取），首关传 0
- 答题过程中 `Battle.tsx` 不重新请求题目（题目一次性生成），连击即时触发实际作用于**下一关的出题**

---

## 四、错题递增间隔重做机制

### 4.1 递增间隔算法（类 Anki）

做错时计算下次到期关卡偏移：

| repetition | 间隔（关） | 说明 |
|-----------|-----------|------|
| 0（首次错）| 2 | 隔 2 关重做 |
| 1（重做又错）| 5 | 隔 5 关再插 |
| 2（又错）| 10 | 隔 10 关 |
| 3+（屡错）| 15 | 封顶 15 关 |

间隔参数后台可配（`mistake.interval.r0` ~ `r3`）。

### 4.2 做错时记录

```
onMistake(userId, questionId, currentLevelSortOrder):
  existing = 查 t_mistake WHERE user_id=? AND question_id=?
  if existing:
    repetition = existing.repetition + 1
  else:
    repetition = 0
  interval = readConfig('mistake.interval.r' + min(repetition, 3))
  due_level_offset = currentLevelSortOrder + interval
  upsert t_mistake:
    due_level_offset, repetition, last_level_sort = currentLevelSortOrder
```

### 4.3 到期插入逻辑

`generateQuestions` 出题时，按权重抽完题后查询到期错题并追加：

```
insertDueMistakes(selected, userId, currentLevelSortOrder):
  maxInsert = readConfig('mistake.max_per_level')  // 默认 2
  dueMistakes = SELECT m.question_id FROM t_mistake m
    JOIN t_question q ON q.id = m.question_id
    WHERE m.user_id = ?
      AND m.due_level_offset <= ?  -- 当前关卡 sort_order
      AND m.question_id NOT IN (selected 的题 id)
    ORDER BY m.due_level_offset ASC
    LIMIT maxInsert

  if dueMistakes.length > 0:
    selected.push(...dueMistakes)  // 追加，总题数 +1~2
  return selected
```

**关键决策**：
- 到期错题是**追加**（总题数 +1~2），不替换已抽好的题
- 每关最多插 2 道到期错题（可配），避免错题堆积时一关全是复习
- 跨年级暂不处理（无切换年级入口）

### 4.4 答对错题的处理（答对 2 次才移出）

```
onCorrectMistake(userId, questionId):
  mistake = 查 t_mistake WHERE user_id=? AND question_id=?
  if mistake exists:
    correctCount = mistake.correct_count ?? 0  // 需新增字段或复用
    correctCount += 1
    threshold = readConfig('mistake.correct_to_remove')  // 默认 2
    if correctCount >= threshold:
      DELETE FROM t_mistake WHERE id = mistake.id  // 移出错题本
    else:
      UPDATE t_mistake SET correct_count = correctCount  // 累计答对次数
```

> **t_mistake 需新增字段** `correct_count TINYINT NOT NULL DEFAULT 0`（累计答对次数）。

### 4.5 t_mistake 最终新增字段

```sql
ALTER TABLE t_mistake
  ADD COLUMN due_level_offset INT DEFAULT NULL,
  ADD COLUMN repetition TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN last_level_sort INT DEFAULT NULL,
  ADD COLUMN correct_count TINYINT NOT NULL DEFAULT 0;
```

---

## 五、前端地图与解锁链路适配

### 5.1 地图渲染

`Home.tsx` 调 `getLevelsByGrade(grade)` 拿关卡列表，渲染逻辑无需大改：
- 后端返回的 `levels` 数组长度从固定 6 变为"N 个知识点关 + 1 个 BOSS 关"
- `getZigzagPositions(count)` 已支持任意数量节点
- `LevelNode` 的"当前关卡"判断逻辑不变

### 5.2 解锁链路适配（[useUserStore.ts](file:///Users/wangzeming/duoinguo/math-quest/src/store/useUserStore.ts)）

```
registerSession 后:
  if 当前关是最后一个知识点关（sortOrder 最大且非 BOSS）:
    解锁 BOSS 关
  elif 当前关是 BOSS 关:
    // 暂不处理（无切换年级入口）
  else:
    解锁 sortOrder+1 的下一知识点关
```

初始解锁仍为 `g{grade}-L1`。

### 5.3 Battle.tsx 适配

- `enterLevel` 调 `generateQuestions` 时增加传参 `lastCombo`、`userId`
- 答题结束 `registerSession` 补充：记录本关 `comboMax` 供下一关出题用
- 答错的题调 `POST /api/content/on-mistake`，传入当前关卡 sortOrder
- 答对的题若是错题，调 `POST /api/content/on-correct-mistake`

### 5.4 错题本页面

本次**不强制改错题本页面**，仅确保后端数据正确写入。错题本页面适配列为后续任务。

---

## 六、后台管理配置

### 6.1 配置项（写入 `t_system_config`）

| key | 默认值 | 说明 |
|-----|--------|------|
| `question.weight.struggle.easy` | 5 | 挣扎档-简单题权重 |
| `question.weight.struggle.mid` | 3 | 挣扎档-中等题权重 |
| `question.weight.struggle.hard` | 1 | 挣扎档-困难题权重 |
| `question.weight.normal.easy` | 2 | 正常档-简单题权重 |
| `question.weight.normal.mid` | 5 | 正常档-中等题权重 |
| `question.weight.normal.hard` | 3 | 正常档-困难题权重 |
| `question.weight.master.easy` | 1 | 精通档-简单题权重 |
| `question.weight.master.mid` | 3 | 精通档-中等题权重 |
| `question.weight.master.hard` | 5 | 精通档-困难题权重 |
| `question.total.min` | 8 | 每关最少出题数 |
| `question.total.max` | 10 | 每关最多出题数 |
| `mistake.interval.r0` | 2 | 首次错间隔 |
| `mistake.interval.r1` | 5 | 重做又错间隔 |
| `mistake.interval.r2` | 10 | 屡错间隔 |
| `mistake.interval.r3` | 15 | 封顶间隔 |
| `mistake.max_per_level` | 2 | 每关最多插入到期错题数 |
| `mistake.correct_to_remove` | 2 | 答对几次移出错题本 |

### 6.2 后台页面

`/admin/config` 页面新增"出题策略"和"错题重做"两个配置分组，支持修改上述参数。

---

## 七、接口变更

| 接口 | 方法 | 变更 |
|------|------|------|
| `POST /api/content/generate-questions` | 改造 | 请求体增加 `lastCombo`、`userId`；响应不变 |
| `POST /api/content/on-mistake` | 新增 | 答错时调用，记录错题 + 计算到期偏移 |
| `POST /api/content/on-correct-mistake` | 新增 | 答对错题时调用，累计答对次数，达阈值移出 |
| `POST /api/content/sync-levels` | 新增（管理端） | 手动触发关卡自动同步 |
| `GET /api/content/configs` | 改造 | 返回新增的出题策略配置项 |

---

## 八、测试验证

复用 webapp-testing 三层验证：

### 8.1 数据库层
- 验证 `t_level` 行数 = 各年级知识点数 + 1（BOSS）
- 每关 `question_cnt >= 1`
- `sort_order` 按知识点 avg(difficulty_score) 升序正确
- `t_mistake` 新增字段存在

### 8.2 API 层
- `GET /grade/:g` 返回动态关卡数（非固定 6）
- `generate-questions` 带不同 `lastCombo`/`mastery` 返回不同难度分布
- `on-mistake` → `generate-questions`（隔 N 关后）→ 验证错题插入
- `on-correct-mistake` 答对 2 次后验证错题移出

### 8.3 UI 层
- 地图渲染动态关卡数，关卡数与题库知识点数一致
- 进关卡出题，难度分布符合权重
- 错题重做链路：答错 → 隔几关后错题出现 → 答对 2 次后不再出现

---

## 九、实施顺序

1. 数据模型：t_mistake 新增字段 + 迁移脚本
2. 后端：`syncLevelsFromQuestions` + 改造 `generateQuestions` + 错题逻辑 + 新接口
3. 后台配置：`t_system_config` 新增配置项 + `/admin/config` 页面
4. 前端：`enterLevel` 传参 + `Battle.tsx` 答题后调接口 + 解锁链路
5. 迁移：执行 `migrate-levels-to-knowledge.ts`
6. 测试：三层验证

---

## 服务地址

- 前端预览：http://localhost:5173
- 后端服务：http://localhost:3001
- 后台管理：http://localhost:5173/admin/login （admin / admin123）
