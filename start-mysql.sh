#!/bin/bash
# MySQL 服务启动/停止脚本
# 用法: ./start-mysql.sh [start|stop|status|restart]

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASEDIR="$PROJECT_DIR/mysql/server"
DATADIR="$PROJECT_DIR/mysql/data"
LOGDIR="$PROJECT_DIR/mysql/log"
PIDFILE="$PROJECT_DIR/mysql/mysql.pid"

mkdir -p "$LOGDIR"

case "${1:-start}" in
  start)
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
      echo "MySQL 已在运行 (PID: $(cat "$PIDFILE"))"
      exit 0
    fi
    echo "启动 MySQL..."
    nohup "$BASEDIR/bin/mysqld" \
      --basedir="$BASEDIR" \
      --datadir="$DATADIR" \
      --socket="$DATADIR/mysql.sock" \
      --lc-messages-dir="$BASEDIR/share" \
      --port=3306 \
      --bind-address=127.0.0.1 \
      --mysqlx=0 \
      > "$LOGDIR/mysql.log" 2>&1 &
    echo $! > "$PIDFILE"
    sleep 3
    echo "MySQL 已启动 (PID: $(cat "$PIDFILE"), 端口: 3306)"
    ;;
  stop)
    if [ -f "$PIDFILE" ]; then
      PID=$(cat "$PIDFILE")
      if kill -0 "$PID" 2>/dev/null; then
        echo "停止 MySQL (PID: $PID)..."
        kill "$PID"
        sleep 2
        if kill -0 "$PID" 2>/dev/null; then
          echo "强制停止..."
          kill -9 "$PID"
        fi
        echo "MySQL 已停止"
      else
        echo "PID $PID 不存在，清理 pid 文件"
      fi
      rm -f "$PIDFILE"
    else
      echo "未找到 pid 文件，MySQL 可能未启动"
    fi
    ;;
  status)
    if [ -f "$PIDFILE" ] && kill -0 $(cat "$PIDFILE") 2>/dev/null; then
      echo "MySQL 运行中 (PID: $(cat "$PIDFILE"), 端口: 3306)"
      "$BASEDIR/bin/mysql" -u root -h 127.0.0.1 -P 3306 -e "SELECT VERSION() AS version;" 2>&1
    else
      echo "MySQL 未运行"
      exit 1
    fi
    ;;
  restart)
    $0 stop
    sleep 1
    $0 start
    ;;
  *)
    echo "用法: $0 [start|stop|status|restart]"
    exit 1
    ;;
esac
