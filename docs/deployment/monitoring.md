# 监控和日志

> **TL;DR**: 使用 pino 结构化日志。日志级别：ERROR/WARN/INFO/DEBUG。监控 API 响应时间、错误率、CPU/内存。

## 日志级别

- **ERROR**: 需要立即处理的错误
- **WARN**: 潜在问题
- **INFO**: 重要事件
- **DEBUG**: 调试信息（生产关闭）

## 日志格式

```json
{
  "level": "info",
  "time": 1234567890,
  "msg": "Request completed",
  "method": "GET",
  "url": "/api/products",
  "status": 200,
  "duration": 45
}
```

## 监控指标

- API 响应时间（p50, p95, p99）
- 错误率
- 请求量
- 数据库查询时间
