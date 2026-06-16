import { Plus } from 'lucide-react';

interface NewChatButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * NewChatButton — AI Native 新对话按钮
 *
 * Design Philosophy:
 * - Calm Intelligence: 平静但充满能量的 Agent Purple 渐变
 * - Subtle Glow: 微妙的光效暗示智能的激活
 * - Fluid Motion: 200ms ease-out 过渡，营造流畅感
 * - Inviting: Plus 图标的旋转动画增加互动性
 *
 * Specifications:
 * - 圆角: 12px
 * - 间距: 16px padding (8pt grid)
 * - 动画: 200ms ease-out
 * - Agent Purple: #8B5CF6
 */
export function NewChatButton({ onClick, disabled = false }: NewChatButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative w-full overflow-hidden rounded-[12px] px-4 py-3
                 bg-gradient-to-r from-accent-purple to-accent-purple/90
                 hover:from-accent-purple hover:to-accent-purple
                 active:scale-[0.98]
                 transition-all duration-200 ease-out
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                 shadow-sm hover:shadow-md"
      aria-label="创建新对话"
    >
      {/* Glow Effect Layer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100
                      transition-opacity duration-200 ease-out">
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
        <div className="absolute inset-[-50%] bg-white/10 blur-xl animate-pulse-slow" />
      </div>

      {/* Content Layer */}
      <div className="relative flex items-center justify-center gap-2">
        {/* Plus Icon with Rotation Animation */}
        <Plus
          className="w-5 h-5 text-white transition-transform duration-200 ease-out
                     group-hover:rotate-90"
          strokeWidth={2.5}
        />

        {/* Button Text */}
        <span className="text-[15px] font-semibold text-white tracking-tight">
          新对话
        </span>
      </div>

      {/* Bottom Shine Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r
                      from-transparent via-white/30 to-transparent opacity-50" />
    </button>
  );
}
