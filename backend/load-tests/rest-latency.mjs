#!/usr/bin/env node
/**
 * REST 列表接口压测脚本（任务 12.4：产品列表 p95 延迟）
 *
 * 使用 autocannon 对 `GET /api/products` 进行固定时长 / 固定连接数的压测，
 * 输出延迟分布（avg / p50 / p90 / p95 / p99 / max）、吞吐量与错误统计。
 *
 * 依赖：autocannon（已加入 backend/package.json devDependencies）。
 *       运行前需先执行 `pnpm install`（本脚手架交付时不自动安装）。
 *
 * 环境变量：
 *   BASE_URL      默认 http://localhost:3001
 *   CONCURRENCY   并发连接数，默认 50
 *   DURATION      压测时长（秒），默认 20
 *   PRODUCTS_PATH 被测路径，默认 /api/products?page=1&limit=20
 *
 * 运行：
 *   node backend/load-tests/rest-latency.mjs
 *   CONCURRENCY=100 DURATION=30 node backend/load-tests/rest-latency.mjs
 */

import autocannon from 'autocannon';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const CONCURRENCY = Number(process.env.CONCURRENCY || 50);
const DURATION = Number(process.env.DURATION || 20);
const PRODUCTS_PATH = process.env.PRODUCTS_PATH || '/api/products?page=1&limit=20';

const url = `${BASE_URL}${PRODUCTS_PATH}`;

console.log('================ REST 列表接口压测（任务 12.4）================');
console.log(`目标 URL   : ${url}`);
console.log(`并发连接数 : ${CONCURRENCY}`);
console.log(`压测时长   : ${DURATION}s`);
console.log('==============================================================\n');

const instance = autocannon(
  {
    url,
    connections: CONCURRENCY,
    duration: DURATION,
    headers: { accept: 'application/json' },
  },
  (err, result) => {
    if (err) {
      console.error('压测执行失败：', err);
      process.exit(1);
    }

    const lat = result.latency; // 毫秒
    console.log('\n==================== 压测结果 ====================');
    console.log(`总请求数   : ${result.requests.total}`);
    console.log(`平均吞吐量 : ${result.requests.average.toFixed(2)} req/s`);
    console.log(`非 2xx 响应: ${result.non2xx}`);
    console.log(`错误数     : ${result.errors}`);
    console.log(`超时数     : ${result.timeouts}`);
    console.log('---------------- 延迟分布（ms）-----------------');
    console.log(`avg : ${lat.average}`);
    console.log(`p50 : ${lat.p50}`);
    console.log(`p90 : ${lat.p90}`);
    console.log(`p95 : ${lat.p95}`);
    console.log(`p99 : ${lat.p99}`);
    console.log(`max : ${lat.max}`);
    console.log('=================================================');

    // 以机器可读的 JSON 形式额外输出一行，便于记录到基线表
    console.log(
      '\nMETRICS_JSON ' +
        JSON.stringify({
          metric: 'rest_products_p95',
          url,
          concurrency: CONCURRENCY,
          durationSec: DURATION,
          totalRequests: result.requests.total,
          throughputAvg: result.requests.average,
          non2xx: result.non2xx,
          errors: result.errors,
          timeouts: result.timeouts,
          latencyMs: {
            avg: lat.average,
            p50: lat.p50,
            p90: lat.p90,
            p95: lat.p95,
            p99: lat.p99,
            max: lat.max,
          },
        })
    );
  }
);

// 实时进度条
autocannon.track(instance, { renderProgressBar: true, renderResultsTable: false });
