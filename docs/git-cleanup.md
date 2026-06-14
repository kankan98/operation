# Git 仓库清理 - 移除不该提交的文件

## 检查结果

✅ **已检查项目**
- Playwright 产物（test-results, playwright-report）
- 构建产物（node_modules, dist, build）
- 环境文件（.env）
- 临时文件（.log, .swp, .DS_Store）
- 数据库文件（.db）

---

## 发现的问题

### ❌ 不该提交的文件

在 `frontend/` 目录下发现两个测试截图：

```
frontend/chat-success.png      (72 KB)
frontend/chat-tool-test.png    (72 KB)
```

这些是 Playwright 测试生成的截图，不应该提交到 Git。

---

## 解决方案

### 1. 从 Git 中移除

```bash
git rm frontend/chat-success.png
git rm frontend/chat-tool-test.png
```

✅ **已执行**

---

### 2. 更新 .gitignore

添加规则忽略 frontend 根目录下的图片文件：

```gitignore
# Test screenshots (Playwright generates these)
frontend/*.png
frontend/*.jpg
frontend/*.jpeg
!frontend/src/**/*.png      # 但保留 src 下的资源图片
!frontend/public/**/*.png   # 但保留 public 下的静态图片
```

**工作原理：**
1. `frontend/*.png` - 忽略 frontend 根目录下的所有 PNG
2. `!frontend/src/**/*.png` - 但不忽略 src 子目录下的（双星号匹配任意深度）
3. `!frontend/public/**/*.png` - 但不忽略 public 子目录下的

✅ **已添加**

---

## 完整的 .gitignore (Playwright 部分)

```gitignore
# Test coverage
coverage/
.nyc_output/

# Playwright
.playwright-cli/
frontend/.playwright-cli/
frontend/test-results/
frontend/playwright-report/
**/test-results/
**/playwright-report/
playwright/.cache/

# Playwright browsers (usually installed globally, but just in case)
**/ms-playwright/

# Test screenshots (Playwright generates these)
frontend/*.png
frontend/*.jpg
frontend/*.jpeg
!frontend/src/**/*.png
!frontend/public/**/*.png
```

---

## 验证

### 允许提交的图片

✅ **会提交：**
```
frontend/src/assets/hero.png          # 源码资源
frontend/public/favicon.png           # 公共静态资源
frontend/src/components/icons/*.svg   # 组件图标
```

### 不允许提交的图片

❌ **会忽略：**
```
frontend/chat-test.png                 # 测试截图
frontend/screenshot-*.png              # 截图文件
frontend/debug.jpg                     # 调试图片
```

---

## 提交更改

现在需要提交这些更改：

```bash
git add .gitignore
git add frontend/  # 包含删除的文件
git commit -m "chore: remove test screenshots and update .gitignore"
```

---

## 预防未来问题

### Playwright 配置

确保 `frontend/playwright.config.ts` 中输出目录配置正确：

```typescript
export default defineConfig({
  outputDir: './test-results',          // ✅ 输出到 test-results
  
  reporter: [
    ['html', { outputFolder: './playwright-report' }]  // ✅ 报告到 playwright-report
  ],
  
  use: {
    screenshot: 'only-on-failure',       // ✅ 只在失败时截图
    video: 'retain-on-failure',          // ✅ 只保留失败视频
  },
});
```

### 建议

1. **测试截图统一放到 test-results/**
   ```typescript
   // 自定义截图路径
   await page.screenshot({ 
     path: 'test-results/my-screenshot.png' 
   });
   ```

2. **不要在根目录生成文件**
   ```typescript
   // ❌ 不好
   await page.screenshot({ path: 'screenshot.png' });
   
   // ✅ 好
   await page.screenshot({ path: 'test-results/screenshot.png' });
   ```

3. **定期清理**
   ```bash
   cd frontend
   npm run test:clean  # 清理测试产物
   ```

---

## 其他检查结果

### ✅ 正常提交的文件

| 文件 | 大小 | 说明 |
|------|------|------|
| `package-lock.json` | 0.27 MB | 依赖锁定文件（正常）|
| `pnpm-lock.yaml` | 0.16 MB | pnpm 锁定文件（正常）|
| `src/assets/hero.png` | 0.01 MB | 源码资源（正常）|
| `public/favicon.svg` | 0.01 MB | 网站图标（正常）|

### ✅ 没有发现的问题

- ❌ `node_modules/` - 不存在
- ❌ `dist/` 或 `build/` - 不存在
- ❌ `.env` - 不存在（只有 .env.example，正常）
- ❌ `*.log` - 不存在
- ❌ `.DS_Store` - 不存在
- ❌ `*.db` - 不存在

---

## 总结

✅ **已完成：**
1. 从 Git 中移除测试截图（2 个文件）
2. 更新 .gitignore 忽略 frontend 根目录图片
3. 保留 src/ 和 public/ 下的资源图片
4. 配置 Playwright 输出到专门目录

✅ **效果：**
- 仓库只包含源代码和必要资源
- 测试产物不会被提交
- 防止未来误提交截图

📝 **下一步：**
```bash
git commit -m "chore: remove test screenshots and update .gitignore"
```
