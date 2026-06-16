# OpenAPI扩展 - Chat UI Redesign

本文档定义了Chat UI重构新增的API端点和Schema，需要合并到主openapi.json中。

## 新增Schema定义

将以下Schema添加到 `components.schemas`：

```json
{
  "TaskOverview": {
    "type": "object",
    "properties": {
      "id": {
        "type": "string",
        "description": "任务ID"
      },
      "sessionId": {
        "type": "string",
        "description": "所属会话ID"
      },
      "taskName": {
        "type": "string",
        "description": "任务名称",
        "maxLength": 200
      },
      "status": {
        "type": "string",
        "enum": ["pending", "in_progress", "completed", "failed", "cancelled"],
        "description": "任务状态"
      },
      "startTime": {
        "type": "number",
        "description": "开始时间戳（毫秒）"
      },
      "endTime": {
        "type": "number",
        "nullable": true,
        "description": "结束时间戳（毫秒）"
      },
      "relatedProducts": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "关联产品ASIN列表"
      },
      "platform": {
        "type": "string",
        "description": "平台标识",
        "enum": ["amazon", "shopify", "ebay", "walmart"]
      },
      "metadata": {
        "type": "object",
        "description": "扩展元数据",
        "additionalProperties": true
      },
      "createdAt": {
        "type": "number",
        "description": "创建时间戳"
      },
      "updatedAt": {
        "type": "number",
        "description": "更新时间戳"
      }
    },
    "required": ["id", "sessionId", "taskName", "status", "startTime", "createdAt", "updatedAt"]
  },
  
  "UpdateSessionRequest": {
    "type": "object",
    "properties": {
      "isPinned": {
        "type": "boolean",
        "description": "是否置顶"
      },
      "title": {
        "type": "string",
        "maxLength": 200,
        "description": "会话标题"
      },
      "tags": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "maxItems": 10,
        "description": "标签数组"
      },
      "lastMessagePreview": {
        "type": "string",
        "maxLength": 100,
        "description": "最后消息预览"
      }
    }
  },
  
  "CreateTaskRequest": {
    "type": "object",
    "properties": {
      "sessionId": {
        "type": "string",
        "description": "会话ID"
      },
      "taskName": {
        "type": "string",
        "maxLength": 200,
        "minLength": 1,
        "description": "任务名称"
      },
      "status": {
        "type": "string",
        "enum": ["pending", "in_progress", "completed", "failed", "cancelled"],
        "default": "pending",
        "description": "初始状态"
      },
      "startTime": {
        "type": "number",
        "description": "开始时间戳（可选，默认当前时间）"
      },
      "relatedProducts": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "关联产品ASIN"
      },
      "platform": {
        "type": "string",
        "enum": ["amazon", "shopify", "ebay", "walmart"],
        "description": "平台标识"
      },
      "metadata": {
        "type": "object",
        "description": "扩展元数据",
        "additionalProperties": true
      }
    },
    "required": ["sessionId", "taskName"]
  },
  
  "UpdateTaskRequest": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["pending", "in_progress", "completed", "failed", "cancelled"],
        "description": "更新后的状态"
      },
      "endTime": {
        "type": "number",
        "description": "结束时间戳"
      },
      "taskName": {
        "type": "string",
        "maxLength": 200,
        "description": "任务名称"
      },
      "relatedProducts": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "关联产品"
      },
      "platform": {
        "type": "string",
        "enum": ["amazon", "shopify", "ebay", "walmart"],
        "description": "平台标识"
      },
      "metadata": {
        "type": "object",
        "description": "扩展元数据（合并更新）",
        "additionalProperties": true
      }
    }
  },
  
  "TaskListResponse": {
    "type": "object",
    "properties": {
      "tasks": {
        "type": "array",
        "items": {
          "$ref": "#/components/schemas/TaskOverview"
        }
      },
      "total": {
        "type": "integer",
        "description": "总任务数"
      },
      "limit": {
        "type": "integer",
        "description": "当前限制数"
      },
      "offset": {
        "type": "integer",
        "description": "当前偏移量"
      }
    },
    "required": ["tasks", "total", "limit", "offset"]
  },
  
  "ErrorResponse": {
    "type": "object",
    "properties": {
      "error": {
        "type": "object",
        "properties": {
          "message": {
            "type": "string",
            "description": "错误消息"
          },
          "code": {
            "type": "string",
            "description": "错误代码"
          },
          "details": {
            "type": "object",
            "description": "错误详情",
            "additionalProperties": true
          }
        },
        "required": ["message", "code"]
      }
    },
    "required": ["error"]
  }
}
```

## ChatSession Schema扩展

在现有的 `ChatSession` schema中添加以下字段：

```json
{
  "isPinned": {
    "type": "boolean",
    "default": false,
    "description": "是否置顶"
  },
  "tags": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "标签数组"
  },
  "lastMessagePreview": {
    "type": "string",
    "nullable": true,
    "description": "最后消息预览"
  },
  "unreadCount": {
    "type": "integer",
    "default": 0,
    "description": "未读消息数"
  }
}
```

## 新增API端点

将以下paths添加到 `paths`：

```json
{
  "/api/chat/sessions/{id}": {
    "patch": {
      "summary": "更新会话属性",
      "description": "更新会话的置顶状态、标签、标题等属性",
      "tags": ["Chat"],
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string"
          },
          "description": "会话ID"
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/UpdateSessionRequest"
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "更新成功",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ChatSession"
              }
            }
          }
        },
        "400": {
          "description": "请求参数验证失败",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "example": {
                "error": {
                  "message": "Validation failed",
                  "code": "VALIDATION_ERROR",
                  "details": {
                    "title": "Title must be less than 200 characters"
                  }
                }
              }
            }
          }
        },
        "404": {
          "description": "会话不存在",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "example": {
                "error": {
                  "message": "Session not found",
                  "code": "SESSION_NOT_FOUND"
                }
              }
            }
          }
        },
        "403": {
          "description": "无权限访问",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    }
  },
  
  "/api/tasks/{sessionId}": {
    "get": {
      "summary": "获取会话任务列表",
      "description": "获取指定会话的所有任务，按创建时间降序排列",
      "tags": ["Tasks"],
      "parameters": [
        {
          "name": "sessionId",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string"
          },
          "description": "会话ID"
        },
        {
          "name": "limit",
          "in": "query",
          "schema": {
            "type": "integer",
            "default": 50,
            "maximum": 100
          },
          "description": "返回数量限制"
        },
        {
          "name": "offset",
          "in": "query",
          "schema": {
            "type": "integer",
            "default": 0
          },
          "description": "偏移量，用于分页"
        },
        {
          "name": "status",
          "in": "query",
          "schema": {
            "type": "string",
            "enum": ["pending", "in_progress", "completed", "failed", "cancelled"]
          },
          "description": "按状态过滤"
        }
      ],
      "responses": {
        "200": {
          "description": "任务列表",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TaskListResponse"
              },
              "example": {
                "tasks": [
                  {
                    "id": "task_xyz789",
                    "sessionId": "sess_abc123",
                    "taskName": "分析销售趋势",
                    "status": "in_progress",
                    "startTime": 1704067200000,
                    "endTime": null,
                    "relatedProducts": ["B0D1234567"],
                    "platform": "amazon",
                    "metadata": {
                      "progress": 65
                    },
                    "createdAt": 1704067200000,
                    "updatedAt": 1704067800000
                  }
                ],
                "total": 1,
                "limit": 50,
                "offset": 0
              }
            }
          }
        },
        "404": {
          "description": "会话不存在",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        },
        "403": {
          "description": "无权限访问",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    }
  },
  
  "/api/tasks": {
    "post": {
      "summary": "创建新任务",
      "description": "创建一个新的任务记录",
      "tags": ["Tasks"],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/CreateTaskRequest"
            },
            "example": {
              "sessionId": "sess_abc123",
              "taskName": "分析销售趋势",
              "status": "pending",
              "relatedProducts": ["B0D1234567"],
              "platform": "amazon",
              "metadata": {
                "source": "user_request",
                "priority": "high"
              }
            }
          }
        }
      },
      "responses": {
        "201": {
          "description": "任务创建成功",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TaskOverview"
              }
            }
          }
        },
        "400": {
          "description": "请求参数验证失败",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "example": {
                "error": {
                  "message": "Validation failed",
                  "code": "VALIDATION_ERROR",
                  "details": {
                    "sessionId": "Session ID is required",
                    "taskName": "Task name cannot be empty"
                  }
                }
              }
            }
          }
        },
        "404": {
          "description": "会话不存在",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    }
  },
  
  "/api/tasks/{id}": {
    "patch": {
      "summary": "更新任务状态",
      "description": "更新任务的状态、进度等信息",
      "tags": ["Tasks"],
      "parameters": [
        {
          "name": "id",
          "in": "path",
          "required": true,
          "schema": {
            "type": "string"
          },
          "description": "任务ID"
        }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/UpdateTaskRequest"
            },
            "example": {
              "status": "completed",
              "endTime": 1704070800000,
              "metadata": {
                "progress": 100,
                "result": "分析完成，发现3个关键趋势"
              }
            }
          }
        }
      },
      "responses": {
        "200": {
          "description": "更新成功",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TaskOverview"
              }
            }
          }
        },
        "400": {
          "description": "非法状态转换",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              },
              "example": {
                "error": {
                  "message": "Invalid status value",
                  "code": "INVALID_STATUS",
                  "details": {
                    "status": "Status must be one of: pending, in_progress, completed, failed, cancelled"
                  }
                }
              }
            }
          }
        },
        "404": {
          "description": "任务不存在",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/ErrorResponse"
              }
            }
          }
        }
      }
    }
  }
}
```

## 新增Tags

将以下tags添加到顶层配置：

```json
{
  "tags": [
    {
      "name": "Tasks",
      "description": "任务管理相关API"
    }
  ]
}
```

## 合并指令

将上述内容合并到 `backend/tests/fixtures/openapi.json`：

1. 在 `components.schemas` 中添加新的Schema定义
2. 扩展现有的 `ChatSession` schema，添加新字段
3. 在 `paths` 中添加新的API端点
4. 在顶层 `tags` 数组中添加 "Tasks" tag
5. 更新 `info.version` 为 "2.0.0"
6. 更新 `info.description` 为 "AI运营系统 API 文档 - 包含价格监控、聊天和任务管理功能"
