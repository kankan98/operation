# 备份和恢复

> **TL;DR**: SQLite 数据库每日备份。保留 30 天。恢复：停止服务 → 替换数据库文件 → 重启。

## 自动备份

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d)
cp data/ecommerce.db backups/ecommerce_$DATE.db
```

Cron:
```
0 2 * * * /path/to/backup.sh
```

## 手动备份

```bash
cp data/ecommerce.db data/ecommerce_backup.db
```

## 恢复

```bash
# 1. 停止服务
pm2 stop ecommerce-api

# 2. 恢复数据库
cp backups/ecommerce_20240614.db data/ecommerce.db

# 3. 重启服务
pm2 restart ecommerce-api
```
