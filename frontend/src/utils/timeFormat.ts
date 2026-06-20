/**
 * 时间格式化工具函数
 * 提供相对时间和绝对时间的格式化
 */

/**
 * 格式化为相对时间（"刚刚"、"5分钟前"、"3小时前"等）
 * @param date - 日期对象或ISO字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;

  // 计算时间差（毫秒）
  const diffMs = now.getTime() - target.getTime();

  // 如果是未来时间，返回绝对时间
  if (diffMs < 0) {
    return formatAbsoluteTime(target);
  }

  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // 刚刚（60秒内）
  if (diffSeconds < 60) {
    return '刚刚';
  }

  // N分钟前（60分钟内）
  if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  }

  // N小时前（24小时内）
  if (diffHours < 24) {
    return `${diffHours}小时前`;
  }

  // N天前（7天内）
  if (diffDays < 7) {
    return `${diffDays}天前`;
  }

  // 超过7天，返回绝对时间
  return formatAbsoluteTime(target);
}

/**
 * 格式化为绝对时间（"2024-01-15 14:30"）
 * @param date - 日期对象或ISO字符串
 * @returns 绝对时间字符串
 */
export function formatAbsoluteTime(date: Date | string): string {
  const target = typeof date === 'string' ? new Date(date) : date;

  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  const hours = String(target.getHours()).padStart(2, '0');
  const minutes = String(target.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化为短时间（"14:30" 或 "01-15 14:30"）
 * @param date - 日期对象或ISO字符串
 * @param showDate - 是否显示日期部分
 * @returns 短时间字符串
 */
export function formatShortTime(date: Date | string, showDate = false): string {
  const target = typeof date === 'string' ? new Date(date) : date;

  const hours = String(target.getHours()).padStart(2, '0');
  const minutes = String(target.getMinutes()).padStart(2, '0');

  if (!showDate) {
    return `${hours}:${minutes}`;
  }

  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');

  return `${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化持续时间（将秒数转为"2分30秒"或"1小时15分"）
 * @param seconds - 秒数
 * @returns 持续时间字符串
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) {
    return '0秒';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}小时`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}分`);
  }

  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}秒`);
  }

  return parts.join('');
}

/**
 * 格式化为毫秒（用于工具执行耗时）
 * @param milliseconds - 毫秒数
 * @returns 格式化字符串
 */
export function formatMilliseconds(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${Math.round(milliseconds)}ms`;
  }

  const seconds = milliseconds / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }

  return formatDuration(Math.floor(seconds));
}

/**
 * 判断是否为今天
 */
export function isToday(date: Date | string): boolean {
  const target = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  return (
    target.getDate() === today.getDate() &&
    target.getMonth() === today.getMonth() &&
    target.getFullYear() === today.getFullYear()
  );
}

/**
 * 智能时间格式化（根据时间远近自动选择格式）
 * - 今天：相对时间（"5分钟前"）
 * - 昨天：显示"昨天 14:30"
 * - 本周：显示"周三 14:30"
 * - 更早：显示"01-15 14:30"
 */
export function formatSmartTime(date: Date | string | number): string {
  const target = typeof date === 'string'
    ? new Date(date)
    : typeof date === 'number'
    ? new Date(date)
    : date;
  const now = new Date();

  // 今天：使用相对时间
  if (isToday(target)) {
    return formatRelativeTime(target);
  }

  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const hours = String(target.getHours()).padStart(2, '0');
  const minutes = String(target.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  // 昨天
  if (diffDays === 1) {
    return `昨天 ${timeStr}`;
  }

  // 本周内（7天内）
  if (diffDays < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[target.getDay()];
    return `${weekday} ${timeStr}`;
  }

  // 更早：显示日期
  return formatShortTime(target, true);
}
