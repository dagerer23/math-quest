# 去除前端与小程序所有 Emoji 图标 — 设计文档

- 日期：2026-06-19
- 范围：Web 前端（`src/`）+ Taro 小程序/H5（`platform-taro/src/`）
- 目标：移除两端正文中所有彩色 emoji 与充当图标的 Unicode 符号，统一替换为 Lucide 线条图标，两端图标体系一致。

## 1. 背景与现状

### 1.1 Web 端（`src/`，React + Vite + shadcn/ui）
- 图标主力已是 `lucide-react@^0.451.0`（31 个文件在用），覆盖导航/状态栏/按钮/表单/管理后台。
- 头像走 `@dicebear` 本地生成；shadcn `ui/avatar.tsx` 闲置。
- emoji 共 18 文件、约 127 处，分散在：成就/目标/年级 `icon` 字段（数据层）、题库 `illustration` 配图、空状态大图、toast、装饰 emoji 雨、`✓✗★☆` 等功能符号、代码注释。

### 1.2 Taro 端（`platform-taro/src/`，Taro 4 + React + UnoCSS）
- `package.json` **未安装任何图标库**，无内联 SVG。
- 唯一"图标组件"是 `components/ui/Controls.tsx` 的 `emojiMap`（21 个语义键）+ `EmojiIcon`，本质是渲染 emoji 字符的 `<Text>`。
- tabBar 用 10 个 PNG（`assets/tab-*.png`）；头像用 15 个 DiceBear 预生成 PNG（`utils/avatar.ts`）。
- emoji 散落约 221 处：资源胶囊、入口、空状态、奖励、按钮文案、toast、tab 标签、段位映射等。

### 1.3 平台约束（关键）
- **微信小程序（weapp）不支持内联 `<svg>` 标签**，也**不允许动态加载外部字体**，因此 `@iconify/react`（渲染内联 SVG）与 iconfont 字体方案在 weapp 不可靠，只能走 `<Image>` 渲染 SVG。
- **`Taro.showToast` 的 `title` 只支持纯文本**，无法渲染 Lucide 图标；其内嵌 emoji 只能删除（可配合内置 `success/none` icon）。

## 2. 方案选型

| 方案 | Web | Taro weapp | 权衡 |
|---|---|---|---|
| **A. Lucide 统一（选定）** | 已有 `lucide-react` | 新增 `lucide-taro-react`（Image 渲染，原生兼容 weapp） | 两端同名同风格、API 一致、迁移最低 |
| B. 两端都用 Iconify | `@iconify/react` | 需自封 Image+SVG-data-URI 层 | 图标更多，但 weapp 兼容需额外封装，Web 端 lucide 已用 31 文件要大改 |
| C. Taro 用 taroify/taro-icons | lucide | @taroify/icons | 两端图标体系分裂、风格不一致 |

**选定方案 A**：两端统一 Lucide，同时消除 Iconify 在小程序的兼容性难题。题库配图也用 Lucide（其 `food-beverage` 分类已覆盖 Apple/Candy/Banana 等物体图标）。

## 3. 架构设计

### 3.1 图标体系
- **单一图标源：Lucide**。Web 继续用 `lucide-react`；Taro 新增 `lucide-taro-react`，API 与 lucide-react 一致（`<Trophy size={24} color="#f00" />`），基于 `@tarojs/components/Image` 渲染 SVG，weapp 原生兼容。
- **风险兜底**：`lucide-taro-react` 为社区小包，若构建/渲染异常，改用自研薄封装——从 `lucide-static` 取 SVG 源码，经 Taro `Image` + `data:image/svg+xml` 渲染。调用方 API 不变，零改动。
- **语义图标注册表**：两端各维护一份 `iconRegistry: Record<SemanticKey, LucideIconName>`，键名两端一致，作为数据驱动场景（成就/目标/题目配图）的单一映射源。Web 与 Taro 各建一份（两仓库源码独立），但键名与 Lucide icon-name 完全对齐。

### 3.2 语义图标注册表（核心映射）

| SemanticKey | Lucide icon-name | 覆盖的原 emoji |
|---|---|---|
| trophy | trophy | 🏆 |
| fire | flame | 🔥 |
| heart | heart | ❤️ ❤ 💔 |
| heartOutline | heart | 🤍（用 `fill="none"`） |
| coin | coins | 🪙 |
| diamond | gem | 💎 |
| star | star | ⭐ ★ |
| starOutline | star | ☆（`fill="none"`） |
| lock | lock | 🔒 |
| goal | target | 🎯 |
| book | book-open | 📚 📖 |
| home | house | 🏠 |
| user | user | 👤 🧑 |
| users | users | 👥 |
| check | check | ✓ ✅ |
| checkCircle | circle-check | ✅（圆形对勾） |
| x | x | ✗ ✕ |
| xCircle | circle-x | ❌ |
| arrowRight | arrow-right | ➡️ → |
| arrowLeft | arrow-left | ⬅️ ← |
| plus | plus | ➕ |
| minus | minus | ➖ |
| gift | gift | 🎁 |
| calendar | calendar | 📅 |
| clock | clock | 🕒 🕛 🕞 ⏱️ |
| alarm | alarm-clock | ⏰ |
| question | help-circle | ❓ |
| warning | alert-triangle | ⚠️ |
| chart | bar-chart-3 | 📊 |
| pencil | pencil | ✏️ |
| trash | trash-2 | 🗑️ |
| refresh | rotate-cw | 🔄 |
| settings | settings | ⚙️ |
| soundOn | volume-2 | 🔊 |
| soundOff | volume-x | 🔇 |
| vibrateOn | vibrate | 📳 |
| vibrateOff | vibrate-off | 📴 |
| download | download | 📥 |
| logout | log-out | 🚪 |
| edit | pencil | ✏️ |
| crown | crown | 👑 |
| sparkles | sparkles | ✨ 🌟 |
| lightning | zap | ⚡ |
| construction | construction | 🚧 |
| search | search | 🔍 |
| gamepad | gamepad-2 | 🎮 |
| calendarDays | calendar-days | 📅 |
| hourglass | hourglass | ⏳ |
| clipboard | clipboard-list | 📋 |
| ruler | ruler | 📏 |
| scale | scale | ⚖️ |
| triangle | triangle | 🔺 △ |
| square | square | ⬛ □ |
| circle | circle | ○ |
| package | package | 📦 |
| car | car | 🚗 |
| bird | bird | 🐦 |
| banknote | banknote | 💵 💰 |
| apple | apple | 🍎 |
| candy | candy | 🍬 |
| banana | banana | 🍌 |
| balloon | （取最近似） | 🎈 |
| pie | pie-chart（取最近似） | 🥧 |
| pizza | （取最近似） | 🍕 |
| milk | glass-water（取最近似） | 🥛 |
| ribbon | （取最近似） | 🎀 |
| panda | （取最近似/补充） | 🐼 |
| hotdog | （取最近似/补充） | 🌭 |
| dragon | （取最近似/补充） | 🐲 |
| sword | swords | ⚔️ |
| rocket | rocket | 🚀 |
| brain | brain | 🧠 |
| palette | palette | 🎨 |
| muscle | dumbbell（取最近似） | 💪 |
| backpack | backpack | 🎒 |
| memo | notebook-pen | 📝 📓 |
| party | party-popper | 🎉 |
| flower | flower-2 | 🌸 |
| globe | globe-2 | 🌄/🌍 |
| shield | shield | 🛡️ |
| gem-medal | medal | 🥉/💠/🔷（段位） |

> 说明：标注「（取最近似）」的为 Lucide 无精确对应的物体，实施时取最近似 Lucide 图标；若语义不可接受，针对该单个图标从 `lucide-static` 或自绘 SVG 补充，不引入第二套图标库。
>
> **数据存储约定**：成就 `icon`、目标/年级 `icon`、题目 `illustration` 等数据字段统一存 **SemanticKey**（本表第一列），渲染时由 `resolveIcon(key)` 经 `iconRegistry` 映射到 Lucide 组件。

### 3.3 数据层迁移
- **成就 `icon`**：`src/data/achievements.ts` 与 `platform-taro/src/data/achievements.ts` 中 emoji → SemanticKey（如 `'⚔️'→'sword'`、`'🪙'→'coin'`、`'💎'→'diamond'`、`'🐲'→'dragon'`）。纯前端，后端不下发。
- **每日目标模板 / onboarding 年级与目标 `emoji`/`icon`**：两端数据文件 emoji → SemanticKey。
- **题目 `illustration`**：两端 `data/questionBank.ts` 种子文件 emoji → SemanticKey；后端 `content.ts` 从种子入库，需**重新播种 DB**。两端渲染层把 `illustration` 当 SemanticKey 解析（经 `iconRegistry`/`resolveIcon`）。

### 3.4 文案内嵌 emoji
- toast `title`、按钮文案、标题前缀中的 emoji 字符**一律删除**。
- 视觉补偿：在能放图标的场景，于文案前以 Lucide 图标元素补一个图标（如「再来一局」前加 `refresh`）。
- `Taro.showToast` title 仅删 emoji，不补图标（平台限制）。

### 3.5 默认头像 emoji 字符串
- `🧒/🤓/😊` 等不再作为 emoji 渲染；无头像时用 Lucide `user` 兜底，种子机制保留（dicebear/PNG 仍优先）。

### 3.6 代码注释 emoji
- `themes.ts` 等 `🌊🌸💜🧑` 注释顺手清理，非阻塞、不强制。

## 4. 实施分期

1. **基建**：Taro 装 `lucide-taro-react`；两端建 `iconRegistry` + `Icon`/`resolveIcon`；在 1 个页验证 weapp 渲染。
2. **数据层迁移**：成就/目标/年级/题目配图 emoji→icon-name；重新播种 DB。
3. **Taro 中枢替换**：`Controls.tsx` 的 `emojiMap`/`EmojiIcon` → `iconRegistry` + Lucide `<Icon>`，跑通关键页。
4. **逐页 UI 清扫**：Web 18 文件 + Taro 各页，按页替换并回归。
5. **Unicode 符号 & 文案内嵌 emoji 清理**。
6. **验证**：lint/typecheck + webapp-testing 界面回归。

## 5. 验证与成功标准

- 全仓 `src/`、`platform-taro/src/` 正文中不再出现彩色 emoji 字符（注释可选保留）。
- 两端图标风格统一为 Lucide 线条图标，同名同义。
- `npm run lint` 通过；`npm run build`（Web）与 `npm run build:weapp`（Taro）通过。
- webapp-testing 回归确认关键页（首页/对战/结果/排行榜/错题/我的/每日目标/统计/成就/测评）无破图、无错位。

## 6. 风险与对策

| 风险 | 对策 |
|---|---|
| `lucide-taro-react` 社区包不稳定 | 先试；异常则切自研 Image+SVG 封装，API 不变 |
| 少数物体图标 Lucide 无对应 | 取最近似；不可接受则单图标自绘 SVG 补充 |
| 题目配图 DB 旧数据残留 | 重新播种；后端清理对应缓存 |
| Taro.showToast 无法渲染图标 | title 仅删 emoji，用内置 success/none icon |
| 迁移面广导致回归 | 分期 + 逐页回归，先基建后清扫 |

## 7. 不在本次范围

- 后端业务逻辑改动（仅因种子变化重新播种）。
- 头像生成方案更换（dicebear/PNG 保留）。
- tabBar PNG 图标更换（已是图片资源，非 emoji）。
