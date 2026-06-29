import Database from 'better-sqlite3';
import { performance } from 'perf_hooks';

const DB_PATH = './data/ecommerce.db';

interface TestResult {
  testName: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  iterations: number;
}

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function checkIndexes(db: Database.Database) {
  console.log('\n📊 当前索引状态:');
  console.log('─'.repeat(60));

  const indexes = db.prepare(`
    SELECT name, sql
    FROM sqlite_master
    WHERE type = 'index'
    AND tbl_name = 'products'
    AND name NOT LIKE 'sqlite_%'
  `).all();

  if (indexes.length === 0) {
    console.log('⚠️  未发现任何索引（除主键外）');
  } else {
    indexes.forEach((idx: any) => {
      console.log(`✓ ${idx.name}`);
      if (idx.sql) {
        console.log(`  ${idx.sql}`);
      }
    });
  }
  console.log('─'.repeat(60));
}

function getTableStats(db: Database.Database) {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN platform = 'amazon' THEN 1 END) as amazon_count,
      COUNT(CASE WHEN platform = 'ebay' THEN 1 END) as ebay_count,
      COUNT(CASE WHEN is_monitoring = 1 THEN 1 END) as monitoring_count
    FROM products
  `).get() as any;

  console.log('\n📈 数据统计:');
  console.log('─'.repeat(60));
  console.log(`总产品数: ${stats.total}`);
  console.log(`Amazon 产品: ${stats.amazon_count}`);
  console.log(`eBay 产品: ${stats.ebay_count}`);
  console.log(`监控中产品: ${stats.monitoring_count}`);
  console.log('─'.repeat(60));

  return stats;
}

function runQuery(db: Database.Database, query: string, params: any[] = []): number {
  const start = performance.now();
  db.prepare(query).all(...params);
  const end = performance.now();
  return end - start;
}

function runTest(
  db: Database.Database,
  testName: string,
  query: string,
  params: any[] = [],
  iterations: number = 100
): TestResult {
  const times: number[] = [];

  // 预热
  runQuery(db, query, params);

  // 执行测试
  for (let i = 0; i < iterations; i++) {
    times.push(runQuery(db, query, params));
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  return {
    testName,
    avgTime,
    minTime,
    maxTime,
    iterations,
  };
}

function printResults(results: TestResult[]) {
  console.log('\n🚀 性能测试结果:');
  console.log('═'.repeat(80));
  console.log(
    `${'测试场景'.padEnd(40)} ${'平均'.padStart(10)} ${'最小'.padStart(10)} ${'最大'.padStart(10)}`
  );
  console.log('─'.repeat(80));

  results.forEach((result) => {
    console.log(
      `${result.testName.padEnd(40)} ${formatTime(result.avgTime).padStart(10)} ${formatTime(result.minTime).padStart(10)} ${formatTime(result.maxTime).padStart(10)}`
    );
  });

  console.log('═'.repeat(80));
  console.log(`每个测试运行 ${results[0]?.iterations || 0} 次迭代\n`);
}

function analyzeQueryPlan(db: Database.Database, query: string, params: any[] = []) {
  console.log('\n🔍 查询计划分析:');
  console.log('─'.repeat(60));

  const plan = db.prepare(`EXPLAIN QUERY PLAN ${query}`).all(...params);
  plan.forEach((row: any) => {
    console.log(`${' '.repeat(row.id * 2)}${row.detail}`);
  });

  console.log('─'.repeat(60));
}

async function main() {
  console.log('\n🧪 产品查询性能测试');
  console.log('═'.repeat(80));

  const db = new Database(DB_PATH, { readonly: true });

  try {
    // 1. 检查索引
    checkIndexes(db);

    // 2. 获取数据统计
    const stats = getTableStats(db);

    if (stats.total === 0) {
      console.log('\n⚠️  警告: 数据库中没有产品数据，无法进行性能测试');
      return;
    }

    // 3. 定义测试用例
    const tests = [
      {
        name: 'Q1: 全表扫描 (SELECT * FROM products)',
        query: 'SELECT * FROM products',
        params: [],
      },
      {
        name: 'Q2: 按平台过滤 (platform = amazon)',
        query: 'SELECT * FROM products WHERE platform = ?',
        params: ['amazon'],
      },
      {
        name: 'Q3: 按监控状态过滤 (is_monitoring = 1)',
        query: 'SELECT * FROM products WHERE is_monitoring = ?',
        params: [1],
      },
      {
        name: 'Q4: 复合过滤 (platform + is_monitoring)',
        query: 'SELECT * FROM products WHERE platform = ? AND is_monitoring = ?',
        params: ['amazon', 1],
      },
      {
        name: 'Q5: 带排序 (ORDER BY created_at DESC)',
        query: 'SELECT * FROM products ORDER BY created_at DESC LIMIT 20',
        params: [],
      },
      {
        name: 'Q6: 聚合查询 (COUNT by platform)',
        query: 'SELECT platform, COUNT(*) FROM products GROUP BY platform',
        params: [],
      },
    ];

    // 4. 执行性能测试
    const results: TestResult[] = [];

    for (const test of tests) {
      const result = runTest(db, test.name, test.query, test.params);
      results.push(result);
    }

    // 5. 打印结果
    printResults(results);

    // 6. 分析关键查询的执行计划
    console.log('\n📋 关键查询执行计划:');
    analyzeQueryPlan(
      db,
      'SELECT * FROM products WHERE platform = ? AND is_monitoring = ?',
      ['amazon', 1]
    );

    // 7. 性能建议
    console.log('\n💡 性能优化建议:');
    console.log('─'.repeat(60));

    const hasIndexes = db.prepare(`
      SELECT COUNT(*) as count
      FROM sqlite_master
      WHERE type = 'index'
      AND tbl_name = 'products'
      AND name LIKE 'idx_products_%'
    `).get() as any;

    if (hasIndexes.count === 0) {
      console.log('⚠️  建议执行迁移 008-products-query-optimization.sql');
      console.log('   预期改进: 按平台/监控状态过滤的查询速度提升 5-10x');
    } else {
      console.log('✓ 索引已创建，查询性能已优化');

      // 计算优化效果
      const fullScan = results.find(r => r.testName.includes('Q1:'));
      const indexed = results.find(r => r.testName.includes('Q4:'));

      if (fullScan && indexed) {
        const improvement = fullScan.avgTime / indexed.avgTime;
        if (improvement > 2) {
          console.log(`✓ 索引效果显著: 复合查询比全表扫描快 ${improvement.toFixed(1)}x`);
        } else {
          console.log(`ℹ️  索引效果: ${improvement.toFixed(1)}x (数据量较小时差异不明显)`);
        }
      }
    }

    console.log('─'.repeat(60));

  } finally {
    db.close();
  }
}

main().catch(console.error);
