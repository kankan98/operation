# 环境配置管理

> **TL;DR**: 开发用 .env 文件，生产用环境变量或密钥管理服务。配置验证在启动时执行。敏感信息不提交 Git。

## 环境分离

- **development**: .env（不提交）
- **production**: 环境变量 / AWS Secrets Manager

## 配置验证

```typescript
// config/index.ts
export function validateConfig() {
  const required = ['DATABASE_PATH', 'AI_PROVIDER'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing: ${missing.join(', ')}`);
  }
}
```

## 密钥管理

生产环境使用：
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
