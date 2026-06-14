import { useRef, useState, useCallback } from 'react';

interface UseScrollControlReturn {
  scrollRef: React.RefObject<HTMLDivElement>;
  showScrollButton: boolean;
  hasNewMessage: boolean;
  scrollToBottom: () => void;
  handleScroll: () => void;
  markAsRead: () => void;
  nearBottomRef: React.MutableRefObject<boolean>;
}

export function useScrollControl(): UseScrollControlReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const scrollRafRef = useRef<number | null>(null);
  const nearBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
    setHasNewMessage(false);
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const isNearBottom = distanceFromBottom < 120;
      nearBottomRef.current = isNearBottom;
      setShowScrollButton(distanceFromBottom > 200);
      if (isNearBottom) {
        setHasNewMessage(false);
      }
    });
  }, []);

  const markAsRead = useCallback(() => {
    setHasNewMessage(false);
  }, []);

  return {
    scrollRef,
    showScrollButton,
    hasNewMessage,
    scrollToBottom,
    handleScroll,
    markAsRead,
    nearBottomRef,
  };
}
