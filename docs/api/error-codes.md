# 错误码定义

> **TL;DR**: HTTP 标准状态码。错误响应格式：{status, error, message, details?}。400 验证错误、404 未找到、500 服务器错误。

## 错误响应格式

```json
{
  "status": 400,
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": {
    "field": "price",
    "constraint": "must be positive"
  }
}
```

## 常见状态码

| 状态码 | 错误类型 | 说明 |
|--------|---------|------|
| 400 | ValidationError | 请求参数验证失败 |
| 401 | UnauthorizedError | 未认证（当前未实现） |
| 403 | ForbiddenError | 无权限（当前未实现） |
| 404 | NotFoundError | 资源不存在 |
| 409 | ConflictError | 资源冲突（如重复） |
| 500 | InternalServerError | 服务器内部错误 |
| 503 | ServiceUnavailable | 外部服务不可用 |
