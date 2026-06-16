#!/usr/bin/env node

/**
 * 合并 OpenAPI 扩展到主 openapi.json
 * 用于 Chat UI Redesign v2 项目
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文件路径
const openapiPath = path.resolve(__dirname, '../tests/fixtures/openapi.json');
const backupPath = path.resolve(__dirname, '../tests/fixtures/openapi.json.backup');

console.log('📦 开始合并 OpenAPI 扩展...\n');

// 1. 读取现有的 openapi.json
let openapi;
try {
  const content = fs.readFileSync(openapiPath, 'utf8');
  openapi = JSON.parse(content);
  console.log('✅ 已读取现有 openapi.json');
  console.log(`   当前版本: ${openapi.info.version}`);
  console.log(`   现有 schemas: ${Object.keys(openapi.components.schemas).length}`);
  console.log(`   现有 paths: ${Object.keys(openapi.paths).length}\n`);
} catch (error) {
  console.error('❌ 读取 openapi.json 失败:', error.message);
  process.exit(1);
}

// 2. 备份原文件
try {
  fs.copyFileSync(openapiPath, backupPath);
  console.log('✅ 已备份原文件到 openapi.json.backup\n');
} catch (error) {
  console.error('❌ 备份文件失败:', error.message);
  process.exit(1);
}

// 3. 新增 Schema 定义
const newSchemas = {
  TaskOverview: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: '任务ID',
      },
      sessionId: {
        type: 'string',
        description: '所属会话ID',
      },
      taskName: {
        type: 'string',
        description: '任务名称',
        maxLength: 200,
      },
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
        description: '任务状态',
      },
      startTime: {
        type: 'number',
        description: '开始时间戳（毫秒）',
      },
      endTime: {
        type: 'number',
        nullable: true,
        description: '结束时间戳（毫秒）',
      },
      relatedProducts: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: '关联产品ASIN列表',
      },
      platform: {
        type: 'string',
        description: '平台标识',
        enum: ['amazon', 'shopify', 'ebay', 'walmart'],
      },
      metadata: {
        type: 'object',
        description: '扩展元数据',
        additionalProperties: true,
      },
      createdAt: {
        type: 'number',
        description: '创建时间戳',
      },
      updatedAt: {
        type: 'number',
        description: '更新时间戳',
      },
    },
    required: ['id', 'sessionId', 'taskName', 'status', 'startTime', 'createdAt', 'updatedAt'],
  },
  UpdateSessionRequest: {
    type: 'object',
    properties: {
      isPinned: {
        type: 'boolean',
        description: '是否置顶',
      },
      title: {
        type: 'string',
        maxLength: 200,
        description: '会话标题',
      },
      tags: {
        type: 'array',
        items: {
          type: 'string',
        },
        maxItems: 10,
        description: '标签数组',
      },
      lastMessagePreview: {
        type: 'string',
        maxLength: 100,
        description: '最后消息预览',
      },
    },
  },
  CreateTaskRequest: {
    type: 'object',
    properties: {
      sessionId: {
        type: 'string',
        description: '会话ID',
      },
      taskName: {
        type: 'string',
        maxLength: 200,
        minLength: 1,
        description: '任务名称',
      },
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
        default: 'pending',
        description: '初始状态',
      },
      startTime: {
        type: 'number',
        description: '开始时间戳（可选，默认当前时间）',
      },
      relatedProducts: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: '关联产品ASIN',
      },
      platform: {
        type: 'string',
        enum: ['amazon', 'shopify', 'ebay', 'walmart'],
        description: '平台标识',
      },
      metadata: {
        type: 'object',
        description: '扩展元数据',
        additionalProperties: true,
      },
    },
    required: ['sessionId', 'taskName'],
  },
  UpdateTaskRequest: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
        description: '更新后的状态',
      },
      endTime: {
        type: 'number',
        description: '结束时间戳',
      },
      taskName: {
        type: 'string',
        maxLength: 200,
        description: '任务名称',
      },
      relatedProducts: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: '关联产品',
      },
      platform: {
        type: 'string',
        enum: ['amazon', 'shopify', 'ebay', 'walmart'],
        description: '平台标识',
      },
      metadata: {
        type: 'object',
        description: '扩展元数据（合并更新）',
        additionalProperties: true,
      },
    },
  },
  TaskListResponse: {
    type: 'object',
    properties: {
      tasks: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/TaskOverview',
        },
      },
      total: {
        type: 'integer',
        description: '总任务数',
      },
      limit: {
        type: 'integer',
        description: '当前限制数',
      },
      offset: {
        type: 'integer',
        description: '当前偏移量',
      },
    },
    required: ['tasks', 'total', 'limit', 'offset'],
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      error: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: '错误消息',
          },
          code: {
            type: 'string',
            description: '错误代码',
          },
          details: {
            type: 'object',
            description: '错误详情',
            additionalProperties: true,
          },
        },
        required: ['message', 'code'],
      },
    },
    required: ['error'],
  },
};

// 4. 扩展 ChatSession Schema
const chatSessionExtension = {
  isPinned: {
    type: 'boolean',
    default: false,
    description: '是否置顶',
  },
  tags: {
    type: 'array',
    items: {
      type: 'string',
    },
    description: '标签数组',
  },
  lastMessagePreview: {
    type: 'string',
    nullable: true,
    description: '最后消息预览',
  },
  unreadCount: {
    type: 'integer',
    default: 0,
    description: '未读消息数',
  },
};

// 5. 新增 API 路径
const newPaths = {
  '/api/chat/sessions/{id}': {
    patch: {
      summary: '更新会话属性',
      description: '更新会话的置顶状态、标签、标题等属性',
      tags: ['Chat'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: '会话ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateSessionRequest',
            },
          },
        },
      },
      responses: {
        '200': {
          description: '更新成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ChatSession',
              },
            },
          },
        },
        '400': {
          description: '请求参数验证失败',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        '404': {
          description: '会话不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        '403': {
          description: '无权限访问',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
  '/api/tasks/{sessionId}': {
    get: {
      summary: '获取会话任务列表',
      description: '获取指定会话的所有任务，按创建时间降序排列',
      tags: ['Tasks'],
      parameters: [
        {
          name: 'sessionId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: '会话ID',
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            default: 50,
            maximum: 100,
          },
          description: '返回数量限制',
        },
        {
          name: 'offset',
          in: 'query',
          schema: {
            type: 'integer',
            default: 0,
          },
          description: '偏移量，用于分页',
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
          },
          description: '按状态过滤',
        },
      ],
      responses: {
        '200': {
          description: '任务列表',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaskListResponse',
              },
            },
          },
        },
        '404': {
          description: '会话不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        '403': {
          description: '无权限访问',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
  '/api/tasks': {
    post: {
      summary: '创建新任务',
      description: '创建一个新的任务记录',
      tags: ['Tasks'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateTaskRequest',
            },
          },
        },
      },
      responses: {
        '201': {
          description: '任务创建成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaskOverview',
              },
            },
          },
        },
        '400': {
          description: '请求参数验证失败',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        '404': {
          description: '会话不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
  '/api/tasks/{id}': {
    patch: {
      summary: '更新任务状态',
      description: '更新任务的状态、进度等信息',
      tags: ['Tasks'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
          description: '任务ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateTaskRequest',
            },
          },
        },
      },
      responses: {
        '200': {
          description: '更新成功',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaskOverview',
              },
            },
          },
        },
        '400': {
          description: '非法状态转换',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        '404': {
          description: '任务不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
};

// 6. 执行合并
console.log('🔧 开始合并...\n');

// 合并新的 schemas
Object.entries(newSchemas).forEach(([name, schema]) => {
  if (openapi.components.schemas[name]) {
    console.log(`⚠️  Schema "${name}" 已存在，跳过`);
  } else {
    openapi.components.schemas[name] = schema;
    console.log(`✅ 添加 Schema: ${name}`);
  }
});

// 扩展 ChatSession schema
if (openapi.components.schemas.ChatSession) {
  Object.entries(chatSessionExtension).forEach(([key, value]) => {
    if (openapi.components.schemas.ChatSession.properties[key]) {
      console.log(`⚠️  ChatSession.${key} 已存在，跳过`);
    } else {
      openapi.components.schemas.ChatSession.properties[key] = value;
      console.log(`✅ 扩展 ChatSession: ${key}`);
    }
  });
} else {
  console.error('❌ ChatSession schema 不存在！');
}

// 合并新的 paths
Object.entries(newPaths).forEach(([path, methods]) => {
  if (openapi.paths[path]) {
    console.log(`⚠️  Path "${path}" 已存在，跳过`);
  } else {
    openapi.paths[path] = methods;
    console.log(`✅ 添加 Path: ${path}`);
  }
});

// 添加 Tags
if (!openapi.tags) {
  openapi.tags = [];
}

const newTags = [
  {
    name: 'Tasks',
    description: '任务管理相关API',
  },
];

newTags.forEach((tag) => {
  const exists = openapi.tags.some((t) => t.name === tag.name);
  if (exists) {
    console.log(`⚠️  Tag "${tag.name}" 已存在，跳过`);
  } else {
    openapi.tags.push(tag);
    console.log(`✅ 添加 Tag: ${tag.name}`);
  }
});

// 更新版本号和描述
openapi.info.version = '2.0.0';
openapi.info.description = 'AI运营系统 API 文档 - 包含价格监控、聊天和任务管理功能';
console.log('\n✅ 更新版本号到 2.0.0');
console.log('✅ 更新描述信息\n');

// 7. 保存合并后的文件
try {
  fs.writeFileSync(openapiPath, JSON.stringify(openapi, null, 2), 'utf8');
  console.log('✅ 已保存合并后的 openapi.json\n');
  console.log('📊 合并结果:');
  console.log(`   版本: ${openapi.info.version}`);
  console.log(`   Schemas: ${Object.keys(openapi.components.schemas).length}`);
  console.log(`   Paths: ${Object.keys(openapi.paths).length}`);
  console.log(`   Tags: ${openapi.tags.length}\n`);
  console.log('✅ OpenAPI 扩展合并完成！');
  console.log(`💡 备份文件: ${backupPath}`);
} catch (error) {
  console.error('❌ 保存文件失败:', error.message);
  // 恢复备份
  try {
    fs.copyFileSync(backupPath, openapiPath);
    console.log('✅ 已从备份恢复原文件');
  } catch (restoreError) {
    console.error('❌ 恢复备份失败:', restoreError.message);
  }
  process.exit(1);
}
