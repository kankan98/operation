/**
 * TaskSummaryBlock - 任务摘要引用块
 *
 * 用于消息中突出显示任务摘要信息
 * 特点：浅紫色渐变背景、左上角Sparkle图标、10px圆角
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

interface TaskSummaryBlockProps {
  title?: string;
  content: string;
  className?: string;
}

export const TaskSummaryBlock: React.FC<TaskSummaryBlockProps> = ({
  title,
  content,
  className = '',
}) => {
  return (
    <div
      className={`
        my-4 p-[14px_16px] rounded-[10px]
        bg-gradient-to-r from-[#f4f1ff] to-[#faf9ff]
        text-[#37304f]
        ${className}
      `}
    >
      {/* 左上角图标和标题 */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-[#6e54ee] flex-shrink-0" />
        {title && (
          <h4 className="text-[13px] font-bold text-[#6e54ee]">
            {title}
          </h4>
        )}
      </div>

      {/* 正文内容 */}
      <div className="text-[13px] leading-[1.6] whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};

// 默认标题版本
export const TaskSummary: React.FC<Omit<TaskSummaryBlockProps, 'title'> & { title?: string }> = ({
  title = '任务摘要',
  content,
  className,
}) => {
  return <TaskSummaryBlock title={title} content={content} className={className} />;
};
