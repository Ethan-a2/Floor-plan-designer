#!/usr/bin/env bash
# 运行所有测试。依赖: node + 自动 npm install jsdom (首次)
#
# 用法:
#   bash tests/run.sh               # 跑所有
#   bash tests/run.sh test_measure  # 只跑某一个 (前缀匹配)
#
# 退出码: 0=全绿, 1=有失败

set -e
cd "$(dirname "$0")/.."

# 确保 jsdom 可用
if ! node -e "require('jsdom')" 2>/dev/null; then
    echo "[run] 安装 jsdom (一次性)..."
    npm install --no-save --no-audit --no-fund --silent jsdom >/dev/null 2>&1 || {
        echo "[run] jsdom 安装失败"
        exit 2
    }
fi

# 过滤参数
FILTER="${1:-}"

# 所有测试文件 (按推荐顺序: 冒烟 → 功能)
FILES=(
    "test_smoke.js"
    "test_bg_image.js"
    "test_keyboard.js"
    "test_measure.js"
    "test_rect_window.js"
)

TOTAL=0
FAILED=0
FAILED_FILES=()
START=$(date +%s)

for f in "${FILES[@]}"; do
    # 过滤
    if [[ -n "$FILTER" && "$f" != *"$FILTER"* ]]; then
        continue
    fi
    TOTAL=$((TOTAL + 1))
    if node "tests/$f"; then
        :
    else
        FAILED=$((FAILED + 1))
        FAILED_FILES+=("$f")
    fi
done

END=$(date +%s)
ELAPSED=$((END - START))

echo ""
echo "============================================="
if [[ $FAILED -eq 0 ]]; then
    echo "✅ 所有 $TOTAL 个测试文件通过 (耗时 ${ELAPSED}s)"
    exit 0
else
    echo "❌ $FAILED/$TOTAL 个测试文件失败 (耗时 ${ELAPSED}s)"
    for ff in "${FAILED_FILES[@]}"; do
        echo "   - $ff"
    done
    exit 1
fi
