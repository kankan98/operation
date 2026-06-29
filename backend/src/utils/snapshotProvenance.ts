import { AcquisitionProvider, PriceSnapshotSource } from '../types';

// 把采集 provider 映射成快照来源标签（用于价格快照 provenance）
export function snapshotSourceFromProvider(
  provider: AcquisitionProvider
): PriceSnapshotSource {
  switch (provider) {
    case 'amazon-browser':
      return 'browser';
    case 'ebay-browse':
      return 'ebay-browse';
    case 'rainforest':
      return 'rainforest';
    case 'keepa':
      return 'keepa';
    case 'cache':
      return 'cache';
    default:
      return 'unknown';
  }
}

export type ProvenanceTrust = 'high' | 'medium' | 'low' | 'unknown';

export interface SnapshotProvenance {
  source: PriceSnapshotSource;
  ageMs: number;
  stale: boolean;
  trust: ProvenanceTrust;
  // 面向用户的中文说明，UI/Chat 可直接展示
  label: string;
}

// 不同来源的默认新鲜度阈值（超过即视为可能过时，需复核）
const STALE_THRESHOLD_MS: Record<PriceSnapshotSource, number> = {
  // 手填数据更新慢、用户心里有数，给较宽的 7 天窗口
  manual: 7 * 24 * 60 * 60 * 1000,
  // 第三方/官方数据源 24 小时
  rainforest: 24 * 60 * 60 * 1000,
  keepa: 24 * 60 * 60 * 1000,
  'ebay-browse': 24 * 60 * 60 * 1000,
  // 浏览器抓取可信度本就偏低，给较短 12 小时窗口
  browser: 12 * 60 * 60 * 1000,
  // 缓存与未知始终视为低可信
  cache: 6 * 60 * 60 * 1000,
  unknown: 0,
};

const SOURCE_LABEL: Record<PriceSnapshotSource, string> = {
  manual: '手动录入',
  browser: '按需浏览器抓取',
  cache: '缓存兜底',
  keepa: 'Keepa 数据源',
  rainforest: 'Rainforest 数据源',
  'ebay-browse': 'eBay Browse API',
  unknown: '来源未知',
};

// 根据来源 + 时间戳推导可信度与展示文案，绝不让过时/未知数据伪装成已验证事实
export function deriveProvenance(
  source: PriceSnapshotSource,
  timestamp: number,
  now: number = Date.now()
): SnapshotProvenance {
  const ageMs = Math.max(0, now - timestamp);
  const threshold = STALE_THRESHOLD_MS[source] ?? 0;
  const stale = threshold === 0 ? source === 'unknown' : ageMs > threshold;

  let trust: ProvenanceTrust;
  if (source === 'unknown') {
    trust = 'unknown';
  } else if (source === 'cache') {
    trust = 'low';
  } else if (source === 'browser') {
    trust = stale ? 'low' : 'medium';
  } else if (source === 'manual') {
    trust = stale ? 'low' : 'high';
  } else {
    // rainforest / keepa / ebay-browse
    trust = stale ? 'medium' : 'high';
  }

  const sourceLabel = SOURCE_LABEL[source] ?? SOURCE_LABEL.unknown;
  const label = stale
    ? `${sourceLabel}（可能已过时，建议复核）`
    : sourceLabel;

  return { source, ageMs, stale, trust, label };
}
