import Database from 'better-sqlite3';
import { performance } from 'perf_hooks';

const DB_PATH = './data/ecommerce-test.db';

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function createTestDatabase(productCount: number) {
  console.log(`\n📦 创建测试数据库 (${productCount.toLocaleString()} 条产品)...`);

  const db = new Database(DB_PATH);

  // 创建表
  db.exec(`
    DROP TABLE IF EXISTS products;

    CREATE TABLE products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      product_url TEXT NOT NULL UNIQUE,
      platform TEXT NOT NULL,
      category TEXT,
      is_monitoring INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // 批量插入数据
  const insert = db.prepare(`
    INSERT INTO products (id, title, product_url, platform, category, is_monitoring, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((products: any[]) => {
    for (const product of products) {
      insert.run(product);
    }
  });

  const batchSize = 1000;
  const platforms = ['amazon', 'ebay'];
  const categories = ['Electronics', 'Books', 'Clothing', 'Home', 'Sports'];

  for (let batch = 0; batch < Math.ceil(productCount / batchSize); batch++) {
    const products = [];
    const start = batch * batchSize;
    const end = Math.min(start + batchSize, productCount);

    for (let i = start; i < end; i++) {
      const platform = platforms[i % platforms.length];
      products.push([
        `prod-${i}`,
        `Test Product ${i}`,
        `https://${platform}.com/product/${i}`,
        platform,
        categories[i % categories.length],
        i % 3 === 0 ? 1 : 0, // 约 1/3 监控中
        Date.now() - i * 1000,
        Date.now() - i * 1000,
      ]);
    }

    insertMany(products);
  }

  console.log('✓ 测试数据创建完成\n');

  return db;
}

function runPerformanceTest(db: Database.Database, withIndex: boolean) {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`🧪 性能测试 - ${withIndex ? '有索引' : '无索引'}`);
  console.log('═'.repeat(80));

  if (withIndex) {
    console.log('正在创建索引...');
    db.exec(`
      CREATE INDEX idx_products_platform ON products(platform);
      CREATE INDEX idx_products_is_monitoring ON products(is_monitoring);
      CREATE INDEX idx_products_platform_is_monitoring ON products(platform, is_monitoring);
    `);
    console.log('✓ 索引创建完成\n');
  }

  const tests = [
    {
      name: '全表扫描',
      query: 'SELECT * FROM products',
      params: [],
    },
    {
      name: '按平台过滤 (50%数据)',
      query: 'SELECT * FROM products WHERE platform = ?',
      params: ['amazon'],
    },
    {
      name: '按监控状态过滤 (33%数据)',
      query: 'SELECT * FROM products WHERE is_monitoring = ?',
      params: [1],
    },
    {
      name: '复合过滤 (平台+监控)',
      query: 'SELECT * FROM products WHERE platform = ? AND is_monitoring = ?',
      params: ['amazon', 1],
    },
    {
      name: '聚合统计',
      query: 'SELECT platform, COUNT(*) as count FROM products GROUP BY platform',
      params: [],
    },
  ];

  const results: any[] = [];

  for (const test of tests) {
    const times: number[] = [];
    const iterations = 10;

    // 预热
    db.prepare(test.query).all(...test.params);

    // 测试
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      db.prepare(test.query).all(...test.params);
      times.push(performance.now() - start);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

    results.push({
      name: test.name,
      avgTime,
    });

    console.log(`${test.name.padEnd(30)} ${formatTime(avgTime).padStart(10)}`);
  }

  return results;
}

function compareResults(noIndexResults: any[], indexedResults: any[]) {
  console.log('\n═'.repeat(80));
  console.log('📊 性能对比总结');
  console.log('═'.repeat(80));

  console.log(
    `${'测试场景'.padEnd(30)} ${'无索引'.padStart(12)} ${'有索引'.padStart(12)} ${'提升'.padStart(12)}`
  );
  console.log('─'.repeat(80));

  for (let i = 0; i < noIndexResults.length; i++) {
    const noIndex = noIndexResults[i];
    const indexed = indexedResults[i];
    const improvement = noIndex.avgTime / indexed.avgTime;

    const improvementStr =
      improvement > 1 ? `${improvement.toFixed(1)}x 更快` : '相当';

    console.log(
      `${noIndex.name.padEnd(30)} ${formatTime(noIndex.avgTime).padStart(12)} ${formatTime(indexed.avgTime).padStart(12)} ${improvementStr.padStart(12)}`
    );
  }

  console.log('═'.repeat(80));
}

async function main() {
  const productCounts = [1000, 10000, 50000];

  for (const count of productCounts) {
    console.log('\n\n');
    console.log('█'.repeat(80));
    console.log(`  数据集大小: ${count.toLocaleString()} 条产品`);
    console.log('█'.repeat(80));

    // 测试无索引
    const db1 = createTestDatabase(count);
    const noIndexResults = runPerformanceTest(db1, false);
    db1.close();

    // 测试有索引
    const db2 = createTestDatabase(count);
    const indexedResults = runPerformanceTest(db2, true);
    db2.close();

    // 对比结果
    compareResults(noIndexResults, indexedResults);
  }

  console.log('\n\n💡 总结:');
  console.log('─'.repeat(80));
  console.log('索引在以下场景显著提升性能:');
  console.log('  • 大数据集 (>10,000 条) 的过滤查询');
  console.log('  • WHERE 条件使用索引列 (platform, is_monitoring)');
  console.log('  • 复合条件查询受益最大');
  console.log('');
  console.log('索引影响较小的场景:');
  console.log('  • 小数据集 (<1,000 条)');
  console.log('  • 全表扫描或聚合查询');
  console.log('─'.repeat(80));
}

main().catch(console.error);
