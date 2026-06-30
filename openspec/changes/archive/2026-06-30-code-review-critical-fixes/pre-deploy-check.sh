#!/bin/bash

# Code Review Critical Fixes - 部署助手脚本
# 用于快速执行部署前的检查和测试

set -e  # 遇到错误立即退出

echo "================================================"
echo "Code Review Critical Fixes - 部署前检查"
echo "================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_pass() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_fail() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

check_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 1. TypeScript 编译检查
echo "1. 检查 TypeScript 编译..."
cd backend
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    check_fail "后端 TypeScript 编译失败"
else
    check_pass "后端 TypeScript 编译通过"
fi

cd ../frontend
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    check_fail "前端 TypeScript 编译失败"
else
    check_pass "前端 TypeScript 编译通过"
fi

cd ..

# 2. 检查调试代码
echo ""
echo "2. 检查调试代码残留..."
if grep -rn "console\.log" backend/src/routes/chat.ts backend/src/services/chatService.ts frontend/src/pages/Chat.tsx 2>/dev/null | grep -v "//"; then
    check_warn "发现 console.log 残留（可能不影响）"
else
    check_pass "无 console.log 残留"
fi

# 3. 运行单元测试
echo ""
echo "3. 运行单元测试..."
cd backend
if npm test src/services/__tests__/*.test.ts 2>&1 | grep -q "FAIL"; then
    check_fail "单元测试失败"
else
    check_pass "单元测试通过"
fi

cd ..

# 4. 检查修改的文件
echo ""
echo "4. 验证关键文件修改..."
files=(
    "backend/src/routes/chat.ts"
    "backend/src/services/chatService.ts"
    "backend/src/services/agentTools.ts"
    "backend/src/services/productCache.ts"
    "backend/src/services/productService.ts"
    "frontend/src/pages/Chat.tsx"
    "frontend/src/hooks/useChatSSE.ts"
    "frontend/src/stores/chatStore.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file 存在"
    else
        check_fail "$file 不存在"
    fi
done

# 5. 检查测试文件
echo ""
echo "5. 验证测试文件..."
test_files=(
    "backend/src/services/__tests__/productCache.test.ts"
    "backend/src/services/__tests__/requestDeduplication.test.ts"
    "backend/src/services/__tests__/productTypeContract.test.ts"
    "frontend/e2e/chat-streaming.spec.ts"
    "frontend/e2e/request-deduplication.spec.ts"
    "frontend/e2e/connection-interruption.spec.ts"
    "backend/src/scripts/smoke-test.js"
)

for file in "${test_files[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file 存在"
    else
        check_warn "$file 不存在（可能已删除）"
    fi
done

# 6. 统计任务完成情况
echo ""
echo "6. 任务完成统计..."
cd openspec/changes/code-review-critical-fixes
completed=$(grep -c "^\- \[x\]" tasks.md)
pending=$(grep -c "^\- \[ \]" tasks.md)
total=$((completed + pending))
percentage=$((completed * 100 / total))

echo "已完成: $completed/$total ($percentage%)"
if [ $percentage -ge 60 ]; then
    check_pass "任务完成率达标 (≥60%)"
else
    check_warn "任务完成率偏低 (<60%)"
fi

cd ../../..

# 总结
echo ""
echo "================================================"
echo "检查完成！"
echo "================================================"
echo ""
echo "下一步建议："
echo "1. 手动启动服务并测试核心功能"
echo "2. 运行: node backend/src/scripts/smoke-test.js"
echo "3. 运行: cd frontend && npx playwright test"
echo "4. 查看部署检查清单: openspec/changes/code-review-critical-fixes/DEPLOYMENT_CHECKLIST.md"
echo ""
