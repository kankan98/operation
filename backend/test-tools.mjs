// 测试工具执行
import { executeToolWithParams } from './src/services/agentTools.js';

console.log('Testing queryDatabase...');
const result1 = await executeToolWithParams('queryDatabase', {});
console.log('queryDatabase result:', JSON.stringify(result1, null, 2));

console.log('\nTesting getMarketInsights...');
const result2 = await executeToolWithParams('getMarketInsights', {});
console.log('getMarketInsights result:', JSON.stringify(result2, null, 2));
