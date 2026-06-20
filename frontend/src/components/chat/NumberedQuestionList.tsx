/**
 * NumberedQuestionList - 编号问题列表
 *
 * 使用16x16px紫色方块作为序号标记的问题列表
 * 特点：紫色序号方块、问题标题加粗、补充说明常规字重
 */

import React from 'react';

export interface QuestionItem {
  question: string;
  description?: string;
}

interface NumberedQuestionListProps {
  questions: QuestionItem[];
  className?: string;
}

export const NumberedQuestionList: React.FC<NumberedQuestionListProps> = ({
  questions,
  className = '',
}) => {
  return (
    <div className={`grid gap-2 my-4 ${className}`}>
      {questions.map((item, index) => (
        <div key={index} className="flex gap-3">
          {/* 序号方块 - 16x16px 紫色方块 */}
          <div
            className="
              w-4 h-4 rounded-[4px] bg-[#6e54ee] flex-shrink-0
              flex items-center justify-center
              text-white text-[11px] font-bold leading-none mt-0.5
            "
          >
            {index + 1}
          </div>

          {/* 问题内容 */}
          <div className="flex-1 min-w-0 text-sm leading-[1.55]">
            {/* 问题标题 - 加粗 */}
            <span className="font-semibold text-[#111827]">
              {item.question}
            </span>

            {/* 补充说明 - 常规字重 */}
            {item.description && (
              <span className="text-[#4b5563] ml-1">
                {item.description}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// 从字符串数组创建问题列表的辅助函数
export const NumberedList: React.FC<{
  items: string[];
  className?: string;
}> = ({ items, className }) => {
  const questions = items.map((item) => ({ question: item }));
  return <NumberedQuestionList questions={questions} className={className} />;
};
