// 手动功能测试脚本
const http = require('http');

console.log('=== 手动功能测试开始 ===\n');

const sessionId = 'ef25207f-b945-46ab-afeb-282490b7c93c';
const testResults = [];

function log(test, status, details) {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏳';
  console.log(`${icon} ${test}`);
  if (details) console.log(`   ${details}`);
  testResults.push({ test, status, details });
}

// 测试 1: SSE 连接建立
log('测试 1: SSE 连接建立', 'running');

const url = `http://localhost:3001/api/chat/sessions/${sessionId}/stream?content=${encodeURIComponent('你好')}`;

const req = http.get(url, (res) => {
  if (res.statusCode !== 200) {
    log('测试 1: SSE 连接建立', 'fail', `状态码: ${res.statusCode}`);
    process.exit(1);
  }

  log('测试 1: SSE 连接建立', 'pass', '连接成功，状态码 200');

  let eventCount = 0;
  let hasMessageStart = false;
  let hasContentDelta = false;
  let hasHeartbeat = false;
  let startTime = Date.now();

  // 测试 2: 接收 SSE 事件
  log('测试 2: 接收 SSE 事件', 'running');

  res.on('data', (chunk) => {
    const lines = chunk.toString().split('\n');

    for (const line of lines) {
      // 检测心跳
      if (line.trim() === ': heartbeat') {
        hasHeartbeat = true;
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        log('测试 3: 心跳机制', 'pass', `收到心跳 (${elapsed}s)`);
      }

      // 解析事件
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.substring(6));
          eventCount++;

          if (event.type === 'message_start') {
            hasMessageStart = true;
            log('测试 2: 接收 SSE 事件', 'pass', `message_start (ID: ${event.messageId})`);
          }

          if (event.type === 'content_delta') {
            hasContentDelta = true;
            log('测试 2: 接收 SSE 事件', 'pass', `content_delta: "${event.delta}"`);
          }

          if (event.type === 'message_complete') {
            log('测试 2: 接收 SSE 事件', 'pass', `message_complete (${eventCount} 个事件)`);

            // 测试完成
            console.log('\n=== 测试结果汇总 ===');
            const passed = testResults.filter(r => r.status === 'pass').length;
            const failed = testResults.filter(r => r.status === 'fail').length;
            console.log(`✅ 通过: ${passed}`);
            console.log(`❌ 失败: ${failed}`);

            req.destroy();
            process.exit(failed > 0 ? 1 : 0);
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  });

  // 5 秒后如果没有心跳，可能需要更长时间
  setTimeout(() => {
    if (!hasHeartbeat) {
      log('测试 3: 心跳机制', 'running', '等待心跳（15 秒间隔）...');
    }
  }, 5000);

  // 20 秒超时
  setTimeout(() => {
    console.log('\n⚠️  测试超时（20 秒）');
    console.log(`收到 ${eventCount} 个事件`);
    req.destroy();
    process.exit(1);
  }, 20000);

  res.on('error', (err) => {
    log('测试 1: SSE 连接建立', 'fail', `连接错误: ${err.message}`);
    process.exit(1);
  });
});

req.on('error', (err) => {
  log('测试 1: SSE 连接建立', 'fail', `请求失败: ${err.message}`);
  process.exit(1);
});
