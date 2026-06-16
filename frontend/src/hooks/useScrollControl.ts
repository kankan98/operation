import { useRef, useState, useCallback, useEffect } from 'react';

interface UseScrollControlReturn {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  showScrollButton: boolean;
  hasNewMessage: boolean;
  /** 用户是否主动向上滚动（距离底部 >200px），用于暂停自动滚动 */
  userScrolledUp: boolean;
  scrollToBottom: () => void;
  handleScroll: () => void;
  markAsRead: () => void;
  /** 标记有新消息到达（用于显示徽章） */
  setNewMessageArrived: () => void;
  nearBottomRef: React.MutableRefObject<boolean>;
}

/**
 * 滚动控制 Hook - 管理聊天界面的滚动行为和用户意图检测
 *
 * 功能：
 * - 距离检测：计算与底部的距离，控制滚动按钮显示
 * - 用户意图检测：通过滚动距离识别用户是否在查看历史消息
 * - 滞后逻辑（Hysteresis）：防止在阈值附近的滚动抖动
 *   - 距离 >200px 时设置 userScrolledUp = true（暂停自动滚动）
 *   - 距离 <120px 时清除 userScrolledUp = false（恢复自动滚动）
 * - 性能优化：使用 requestAnimationFrame 节流滚动事件处理
 * - 移动端键盘适配：监听 VisualViewport 变化，调整滚动行为
 *
 * 阈值说明：
 * - 200px：用户意图阈值（超过此距离认为用户在查看历史）
 * - 120px：自动滚动恢复阈值（低于此距离恢复自动滚动）
 * - 80px 死区：防止在阈值附近的滚动抖动
 */
export function useScrollControl(): UseScrollControlReturn {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  /** 用户是否主动向上滚动（用于暂停自动滚动） */
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  /** 用于 RAF 节流的标识 */
  const scrollRafRef = useRef<number | null>(null);
  /** 上次滚动位置，用于检测滚动方向 */
  const lastScrollTopRef = useRef(0);
  /** 是否接近底部（距离 <120px） */
  const nearBottomRef = useRef(true);

  /**
   * 滚动到底部
   * 清除"有新消息"标志和"用户向上滚动"标志，恢复自动滚动行为
   */
  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
    setHasNewMessage(false);
    // 用户手动点击滚动按钮，清除"用户向上滚动"标志，恢复自动滚动
    setUserScrolledUp(false);
  }, []);

  /**
   * 滚动事件处理器
   * 使用 requestAnimationFrame 节流，计算距离并更新状态
   */
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;

      const currentScrollTop = el.scrollTop;
      const distanceFromBottom = el.scrollHeight - currentScrollTop - el.clientHeight;

      // 距离阈值：
      // - >200px：显示滚动按钮，设置 userScrolledUp = true
      // - <120px：隐藏滚动按钮，清除 userScrolledUp = false，清除新消息徽章
      const isNearBottom = distanceFromBottom < 120;
      const isFarFromBottom = distanceFromBottom > 200;

      // 更新 nearBottom ref（用于自动滚动判断）
      nearBottomRef.current = isNearBottom;

      // 显示/隐藏滚动按钮
      setShowScrollButton(isFarFromBottom);

      // 用户意图检测 - 使用滞后逻辑防止抖动
      if (isFarFromBottom) {
        // 距离 >200px，用户在查看历史，暂停自动滚动
        setUserScrolledUp(true);
      } else if (isNearBottom) {
        // 距离 <120px，用户回到底部，恢复自动滚动，清除新消息徽章
        setUserScrolledUp(false);
        setHasNewMessage(false);
      }

      // 更新上次滚动位置（用于方向检测）
      lastScrollTopRef.current = currentScrollTop;
    });
  }, []);

  /**
   * 标记消息已读（清除新消息徽章）
   */
  const markAsRead = useCallback(() => {
    setHasNewMessage(false);
  }, []);

  /**
   * 新消息到达通知
   * 仅在用户向上滚动时（距离 >200px）设置徽章，避免在底部时显示
   */
  const setNewMessageArrived = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // 只有当用户距离底部 >200px 时才显示徽章
    if (distanceFromBottom > 200) {
      setHasNewMessage(true);
    }
  }, []);

  /**
   * 移动端键盘适配 - 监听 VisualViewport 变化
   * 当键盘弹出/收起时，调整滚动位置保持输入框可见
   */
  useEffect(() => {
    // 检查浏览器是否支持 VisualViewport API
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const visualViewport = window.visualViewport;
    let previousHeight = visualViewport.height;

    const handleViewportResize = () => {
      const currentHeight = visualViewport.height;
      const heightDifference = previousHeight - currentHeight;

      // 键盘弹出（viewport 高度减小）
      if (heightDifference > 100 && scrollRef.current) {
        // 保持当前滚动位置相对于底部不变
        // 这样输入框始终可见，不会被键盘遮挡
        const el = scrollRef.current;
        const currentDistanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

        // 等待下一帧后调整滚动位置
        requestAnimationFrame(() => {
          if (el && el.scrollHeight > 0) {
            const newScrollTop = el.scrollHeight - el.clientHeight - currentDistanceFromBottom;
            el.scrollTop = Math.max(0, newScrollTop);
          }
        });
      }

      previousHeight = currentHeight;
    };

    visualViewport.addEventListener('resize', handleViewportResize);

    return () => {
      visualViewport.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  return {
    scrollRef,
    showScrollButton,
    hasNewMessage,
    userScrolledUp,
    scrollToBottom,
    handleScroll,
    markAsRead,
    setNewMessageArrived,
    nearBottomRef,
  };
}
