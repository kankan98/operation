/**
 * EnhancedCodeBlock - 增强的代码块组件
 *
 * 特点：语法高亮、复制按钮、语言标签、行号（可选）
 * 样式：#f7f7fb背景、10px圆角、细边框
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface EnhancedCodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export const EnhancedCodeBlock: React.FC<EnhancedCodeBlockProps> = ({
  code,
  language,
  showLineNumbers = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  // 复制代码到剪贴板
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 分割代码为行
  const lines = code.split('\n');
  const shouldShowLineNumbers = showLineNumbers || lines.length > 10;

  return (
    <div
      className={`
        relative my-4 rounded-[10px] bg-[#f7f7fb] border border-[#e7e8ee]
        overflow-hidden
        ${className}
      `}
    >
      {/* 顶部栏：语言标签 + 复制按钮 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#e7e8ee]">
        {/* 语言标签 */}
        {language && (
          <span className="text-[11px] text-[#7b8494] font-medium uppercase">
            {language}
          </span>
        )}
        <div className="flex-1" />

        {/* 复制按钮 */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium
            text-[#7b8494] hover:text-[#6e54ee] rounded-md
            hover:bg-white/60 transition-colors"
          title="复制代码"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="text-green-600">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      {/* 代码内容 */}
      <div className="overflow-x-auto">
        <div className="flex">
          {/* 行号（可选） */}
          {shouldShowLineNumbers && (
            <div className="flex flex-col py-4 px-3 text-[12px] font-mono text-[#9ca3af] select-none border-r border-[#e7e8ee] bg-[#fafafa]">
              {lines.map((_, index) => (
                <div key={index} className="leading-[1.7] text-right">
                  {index + 1}
                </div>
              ))}
            </div>
          )}

          {/* 代码文本 */}
          <pre className="flex-1 p-4 text-[13px] font-mono leading-[1.7] text-[#111827] overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

// 简化版（内联代码）
export const InlineCode: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <code
      className={`
        px-1.5 py-0.5 rounded text-[12px] font-mono
        bg-[#f7f7fb] text-[#6e54ee] border border-[#e7e8ee]
        ${className}
      `}
    >
      {children}
    </code>
  );
};
