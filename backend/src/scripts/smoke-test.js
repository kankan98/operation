#!/usr/bin/env node

/**
 * Task 11.1-11.5: 冒烟测试脚本
 *
 * 快速验证关键路径是否正常工作
 * 目标运行时间: < 2 分钟
 */

const http = require('http');
const https = require('https');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

// ANSI 颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ ${message}`, colors.blue);
}

// HTTP 请求辅助函数
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// 测试用例
const testContext = { sessionId: null };

const tests = [
  {
    name: '前端服务健康检查',
    async run() {
      const res = await request(FRONTEND_URL);
      if (res.status === 200) {
        success('前端服务运行正常');
        return true;
      }
      error(`前端服务响应异常: ${res.status}`);
      return false;
    }
  },

  {
    name: '后端服务健康检查',
    async run() {
      const res = await request(`${BACKEND_URL}/health`);
      if (res.status === 200) {
        success('后端服务运行正常');
        return true;
      }
      error(`后端服务响应异常: ${res.status}`);
      return false;
    }
  },

  {
    name: '创建会话',
    async run() {
      const res = await request(`${BACKEND_URL}/api/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Smoke Test Session' }),
      });

      if (res.status === 201) {
        const data = JSON.parse(res.data);
        // 响应直接是 session 对象，不是 { session: {...} }
        if (data.id) {
          success(`会话创建成功: ${data.id}`);
          testContext.sessionId = data.id;
          return true;
        }
      }
      error(`会话创建失败: ${res.status} - ${res.data}`);
      return false;
    }
  },

  {
    name: 'SSE 流式消息 (简单消息)',
    async run() {
      if (!testContext.sessionId) {
        error('缺少 sessionId，跳过测试');
        return false;
      }

      // 注意：此测试需要真实的 AI API 调用，可能耗时较长
      // 在冒烟测试中，我们只验证连接建立，不等待完整响应
      return new Promise((resolve) => {
        const content = encodeURIComponent('你好');
        const url = `${BACKEND_URL}/api/chat/sessions/${testContext.sessionId}/stream?content=${content}`;

        const req = http.get(url, (res) => {
          if (res.statusCode !== 200) {
            error(`SSE 连接失败: ${res.statusCode}`);
            resolve(false);
            return;
          }

          let receivedData = false;

          const timeout = setTimeout(() => {
            if (!receivedData) {
              // 5 秒内没收到数据，但连接建立成功也算通过
              success('SSE 连接建立成功（未等待完整响应）');
              req.destroy();
              resolve(true);
            }
          }, 5000);

          res.on('data', (chunk) => {
            if (!receivedData) {
              receivedData = true;
              clearTimeout(timeout);
              success('SSE 流式消息正常（收到数据）');
              req.destroy();
              resolve(true);
            }
          });

          res.on('error', (err) => {
            clearTimeout(timeout);
            error(`SSE 连接错误: ${err.message}`);
            resolve(false);
          });
        });

        req.on('error', (err) => {
          error(`请求失败: ${err.message}`);
          resolve(false);
        });
      });
    }
  },

  {
    name: '获取产品列表',
    async run() {
      const res = await request(`${BACKEND_URL}/api/products?limit=10`);
      if (res.status === 200) {
        const data = JSON.parse(res.data);
        success(`获取产品列表成功 (${data.data?.length || 0} 个产品)`);
        return true;
      }
      error(`获取产品列表失败: ${res.status}`);
      return false;
    }
  },
];

// 运行所有测试
async function runSmokeTests() {
  info('开始运行冒烟测试...\n');

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      info(`运行测试: ${test.name}`);
      const result = await test.run();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      error(`测试异常: ${test.name} - ${err.message}`);
      failed++;
    }
    console.log(''); // 空行
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('='.repeat(50));
  log(`\n测试完成！`, colors.blue);
  log(`总计: ${tests.length} 个测试`, colors.blue);
  success(`通过: ${passed}`);
  if (failed > 0) {
    error(`失败: ${failed}`);
  }
  log(`耗时: ${duration}s`, colors.blue);

  if (duration > 120) {
    log(`⚠ 警告: 冒烟测试耗时超过 2 分钟`, colors.yellow);
  }

  process.exit(failed > 0 ? 1 : 0);
}

// 执行
runSmokeTests().catch((err) => {
  error(`致命错误: ${err.message}`);
  process.exit(1);
});
