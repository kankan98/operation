#!/usr/bin/env node
/**
 * SSE 并发压测脚本（任务 12.1：~100 并发 SSE 连接；任务 12.5：首字内容延迟）
 *
 * 针对 `GET /api/chat/sessions/:id/stream?content=<urlencoded>` 接口，
 * 同时建立 N 个并发 SSE 连接（每个使用 :id=new 自动创建会话），
 * 对每个连接测量：
 *   - TTFB（time-to-first-byte）：从发起请求到收到首个响应字节（通常是 `:ok` 心跳）
 *   - TTFC（time-to-first-content-delta）：从发起请求到收到第一个 `content_delta` 事件
 *   - 总耗时：从发起请求到收到 `message_complete`（或 `error_occurred`）
 *
 * 仅依赖 Node 内置 `http` / `https` 模块，无需安装额外依赖。
 *
 * 重要前提：
 *   - 后端必须已启动（pnpm --filter backend dev），监听 BASE_URL。
 *   - backend/.env 必须配置有效的 LLM API Key（APP_ANTHROPIC_API_KEY 或
 *     APP_OPENAI_API_KEY），否则不会产生真实 content_delta，TTFC 将记为失败。
 *   - 本脚本会真实消耗 LLM API 额度，请谨慎设置 CONCURRENCY。
 *
 * 环境变量：
 *   BASE_URL     默认 http://localhost:3001
 *   CONCURRENCY  并发连接数，默认 100
 *   MESSAGE      发送的用户消息内容，默认一个简短问候（控制 token 消耗）
 *   SESSION_ID   会话 ID，默认 new（每个连接都会新建会话）
 *   TIMEOUT_MS   单连接超时（毫秒），默认 120000
 *   RAMP_MS      连接启动的总爬坡时长（毫秒），默认 0（全部同时发起）。
 *                设为 >0 可在该时间窗口内均匀分散发起连接，避免瞬时风暴。
 *
 * 运行：
 *   node backend/load-tests/sse-concurrency.mjs
 *   CONCURRENCY=100 node backend/load-tests/sse-concurrency.mjs
 *   CONCURRENCY=20 RAMP_MS=5000 node backend/load-tests/sse-concurrency.mjs
 */

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const CONCURRENCY = Number(process.env.CONCURRENCY || 100);
const MESSAGE = process.env.MESSAGE || '你好，请用一句话简单介绍一下你自己。';
const SESSION_ID = process.env.SESSION_ID || 'new';
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 120000);
const RAMP_MS = Number(process.env.RAMP_MS || 0);

const target = new URL(
  `/api/chat/sessions/${encodeURIComponent(SESSION_ID)}/stream?content=${encodeURIComponent(MESSAGE)}`,
  BASE_URL
);
const transport = target.protocol === 'https:' ? https : http;

/**
 * 建立单个 SSE 连接并测量延迟指标。
 * @param {number} index 连接编号（用于日志）
 * @returns {Promise<object>} 单连接结果
 */
function runOneConnection(index) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const result = {
      index,
      ok: false,
      ttfbMs: null, // 首字节
      ttfcMs: null, // 首个 content_delta
      totalMs: null, // 直到 message_complete / error_occurred
      statusCode: null,
      contentDeltaCount: 0,
      error: null,
      terminal: null, // message_complete | error_occurred | aborted
    };

    let buffer = '';
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      result.totalMs = Date.now() - startedAt;
      try {
        req.destroy();
      } catch {
        /* ignore */
      }
      resolve(result);
    };

    const req = transport.request(
      target,
      {
        method: 'GET',
        headers: { accept: 'text/event-stream' },
      },
      (res) => {
        result.statusCode = res.statusCode;
        res.setEncoding('utf8');

        if (res.statusCode !== 200) {
          result.error = `HTTP ${res.statusCode}`;
          // 读取少量响应体用于诊断后结束
          res.on('data', () => {});
          res.on('end', finish);
          return;
        }

        res.on('data', (chunk) => {
          // 首字节时间
          if (result.ttfbMs === null) {
            result.ttfbMs = Date.now() - startedAt;
          }

          buffer += chunk;

          // 按 SSE 事件分隔符（空行）切分
          let sepIndex;
          while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
            const rawEvent = buffer.slice(0, sepIndex);
            buffer = buffer.slice(sepIndex + 2);
            handleRawEvent(rawEvent);
          }
        });

        res.on('end', finish);
        res.on('error', (err) => {
          if (!result.error) result.error = err.message;
          finish();
        });
      }
    );

    /**
     * 处理一个完整 SSE 事件块（可能是注释心跳或 data 行）。
     */
    function handleRawEvent(rawEvent) {
      // 注释 / 心跳（以 ':' 开头），例如 ':ok' 或 ': heartbeat'
      const lines = rawEvent.split('\n');
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const jsonStr = line.slice(5).trim();
        if (!jsonStr) continue;
        let event;
        try {
          event = JSON.parse(jsonStr);
        } catch {
          continue;
        }

        if (event.type === 'content_delta') {
          result.contentDeltaCount += 1;
          if (result.ttfcMs === null) {
            result.ttfcMs = Date.now() - startedAt;
          }
        } else if (event.type === 'message_complete') {
          result.ok = true;
          result.terminal = 'message_complete';
          finish();
          return;
        } else if (event.type === 'error_occurred') {
          result.ok = false;
          result.terminal = 'error_occurred';
          result.error =
            event.error && event.error.message ? event.error.message : 'error_occurred';
          finish();
          return;
        }
      }
    }

    req.setTimeout(TIMEOUT_MS, () => {
      if (!result.error) result.error = `timeout after ${TIMEOUT_MS}ms`;
      result.terminal = result.terminal || 'aborted';
      finish();
    });

    req.on('error', (err) => {
      if (!result.error) result.error = err.message;
      finish();
    });

    req.end();
  });
}

/**
 * 计算百分位（升序数组，p 取 0~100）。
 */
function percentile(sortedAsc, p) {
  if (sortedAsc.length === 0) return null;
  const rank = (p / 100) * (sortedAsc.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sortedAsc[lo];
  const frac = rank - lo;
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * frac;
}

function summarize(label, values) {
  const arr = values.filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (arr.length === 0) {
    return { label, count: 0, min: null, avg: null, p50: null, p95: null, max: null };
  }
  const sum = arr.reduce((a, b) => a + b, 0);
  return {
    label,
    count: arr.length,
    min: Math.round(arr[0]),
    avg: Math.round(sum / arr.length),
    p50: Math.round(percentile(arr, 50)),
    p95: Math.round(percentile(arr, 95)),
    max: Math.round(arr[arr.length - 1]),
  };
}

function printSummary(s) {
  if (s.count === 0) {
    console.log(`${s.label.padEnd(28)} 无有效样本`);
    return;
  }
  console.log(
    `${s.label.padEnd(28)} n=${String(s.count).padStart(4)}  ` +
      `min=${String(s.min).padStart(7)}  avg=${String(s.avg).padStart(7)}  ` +
      `p50=${String(s.p50).padStart(7)}  p95=${String(s.p95).padStart(7)}  ` +
      `max=${String(s.max).padStart(7)}  (ms)`
  );
}

async function main() {
  console.log('============ SSE 并发压测（任务 12.1 / 12.5）============');
  console.log(`目标 URL   : ${target.href}`);
  console.log(`并发连接数 : ${CONCURRENCY}`);
  console.log(`消息内容   : ${MESSAGE}`);
  console.log(`单连接超时 : ${TIMEOUT_MS}ms`);
  console.log(`爬坡时长   : ${RAMP_MS}ms`);
  console.log('========================================================\n');
  console.log('提示：该脚本会真实调用后端 LLM，消耗 API 额度。\n');

  const wallStart = Date.now();
  const tasks = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    if (RAMP_MS > 0 && CONCURRENCY > 1) {
      const delay = (RAMP_MS / (CONCURRENCY - 1)) * i;
      tasks.push(
        new Promise((resolve) =>
          setTimeout(() => resolve(runOneConnection(i)), delay)
        ).then((p) => p)
      );
    } else {
      tasks.push(runOneConnection(i));
    }
  }

  const results = await Promise.all(tasks);
  const wallMs = Date.now() - wallStart;

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  const ttfb = summarize('TTFB（首字节）', results.map((r) => r.ttfbMs));
  const ttfc = summarize('TTFC（首个 content_delta）', succeeded.map((r) => r.ttfcMs));
  const total = summarize('总耗时（至 message_complete）', succeeded.map((r) => r.totalMs));

  console.log('\n==================== 压测结果 ====================');
  console.log(`总连接数   : ${results.length}`);
  console.log(`成功       : ${succeeded.length}`);
  console.log(`失败       : ${failed.length}`);
  console.log(`墙钟总耗时 : ${wallMs}ms`);
  console.log('---------------- 延迟分布 ----------------');
  printSummary(ttfb);
  printSummary(ttfc);
  printSummary(total);

  if (failed.length > 0) {
    console.log('\n---------------- 失败明细（最多 10 条）----------------');
    const sample = failed.slice(0, 10);
    for (const f of sample) {
      console.log(
        `  #${f.index} status=${f.statusCode ?? '-'} terminal=${f.terminal ?? '-'} error=${f.error ?? '-'}`
      );
    }
    if (failed.length > 10) {
      console.log(`  ... 其余 ${failed.length - 10} 条失败已省略`);
    }
  }
  console.log('=================================================');

  // 机器可读输出，便于记录基线
  console.log(
    '\nMETRICS_JSON ' +
      JSON.stringify({
        metric: 'sse_concurrency',
        url: target.href,
        concurrency: CONCURRENCY,
        connections: results.length,
        succeeded: succeeded.length,
        failed: failed.length,
        wallMs,
        ttfbMs: { min: ttfb.min, avg: ttfb.avg, p50: ttfb.p50, p95: ttfb.p95, max: ttfb.max },
        ttfcMs: { min: ttfc.min, avg: ttfc.avg, p50: ttfc.p50, p95: ttfc.p95, max: ttfc.max },
        totalMs: { min: total.min, avg: total.avg, p50: total.p50, p95: total.p95, max: total.max },
      })
  );

  // 若全部失败则以非零退出码结束，便于 CI 检测
  if (succeeded.length === 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('脚本异常：', err);
  process.exit(1);
});
