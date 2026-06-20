/**
 * CheckList - 勾选清单
 *
 * 用于消息中显示任务清单或步骤列表
 * 特点：绿色勾选图标、灰色未勾选图标、已完成项删除线
 */

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export interface CheckListItem {
  text: string;
  checked: boolean;
}

interface CheckListProps {
  items: CheckListItem[];
  className?: string;
}

export const CheckList: React.FC<CheckListProps> = ({
  items,
  className = '',
}) => {
  return (
    <div className={`space-y-2 my-4 ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2.5">
          {/* 勾选/未勾选图标 - 16px */}
          {item.checked ? (
            <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
          ) : (
            <Circle className="w-4 h-4 text-[#d1d5db] flex-shrink-0 mt-0.5" />
          )}

          {/* 清单文字 */}
          <span
            className={`
              text-[13px] leading-[1.6]
              ${item.checked
                ? 'text-[#9ca3af] line-through'
                : 'text-[#374151]'
              }
            `}
          >
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
};

// 从字符串数组创建未勾选清单的辅助函数
export const UncheckedList: React.FC<{
  items: string[];
  className?: string;
}> = ({ items, className }) => {
  const checkListItems = items.map((text) => ({ text, checked: false }));
  return <CheckList items={checkListItems} className={className} />;
};

// 交互式勾选清单（带onChange回调）
interface InteractiveCheckListProps {
  items: CheckListItem[];
  onChange?: (index: number, checked: boolean) => void;
  className?: string;
}

export const InteractiveCheckList: React.FC<InteractiveCheckListProps> = ({
  items,
  onChange,
  className = '',
}) => {
  return (
    <div className={`space-y-2 my-4 ${className}`}>
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => onChange?.(index, !item.checked)}
          className="flex items-start gap-2.5 w-full text-left hover:bg-gray-50
            rounded px-2 py-1 -mx-2 transition-colors"
        >
          {/* 勾选/未勾选图标 */}
          {item.checked ? (
            <CheckCircle2 className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
          ) : (
            <Circle className="w-4 h-4 text-[#d1d5db] flex-shrink-0 mt-0.5" />
          )}

          {/* 清单文字 */}
          <span
            className={`
              text-[13px] leading-[1.6]
              ${item.checked
                ? 'text-[#9ca3af] line-through'
                : 'text-[#374151]'
              }
            `}
          >
            {item.text}
          </span>
        </button>
      ))}
    </div>
  );
};
