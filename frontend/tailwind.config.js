/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy color (保留30天以支持旧代码)
        'accent-purple': '#8B5CF6',
        'legacy-purple': '#8B5CF6',

        // Brand colors - 新紫色系统
        primary: {
          DEFAULT: '#6e54ee',
          hover: '#5f46df',
          active: '#523cc8',
          soft: '#f4f1ff',
          softer: '#f8f6ff',
          border: '#a891ff',
          ring: 'rgba(110, 84, 238, 0.18)',
        },

        // Base colors
        page: '#fcfcfd',
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#fafafa',
          muted: '#f7f7fb',
        },
        panel: '#ffffff',

        // Text colors
        text: {
          DEFAULT: '#111827',
          secondary: '#4b5563',
          muted: '#7b8494',
          faint: '#a0a7b6',
          'on-primary': '#ffffff',
        },

        // Border colors
        border: {
          DEFAULT: '#e7e8ee',
          soft: '#eff0f4',
          strong: '#d8dbe5',
        },

        // Semantic colors
        success: {
          DEFAULT: '#22c55e',
          soft: '#ecfdf3',
          border: '#86efac',
        },
        warning: {
          DEFAULT: '#f59e0b',
          soft: '#fff7ed',
        },
        danger: {
          DEFAULT: '#ef4444',
          soft: '#fef2f2',
        },
        info: {
          DEFAULT: '#3b82f6',
          soft: '#eff6ff',
        },
      },

      // Box shadows
      boxShadow: {
        xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
        sm: '0 4px 10px rgba(15, 23, 42, 0.05)',
        md: '0 12px 28px rgba(15, 23, 42, 0.08)',
        primary: '0 8px 20px rgba(110, 84, 238, 0.24)',
      },

      // Spacing (8pt grid system)
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },

      // Border radius
      borderRadius: {
        xs: '6px',
        sm: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        full: '999px',
      },

      // Font family
      fontFamily: {
        sans: [
          'Inter',
          'PingFang SC',
          'Microsoft YaHei',
          'Noto Sans SC',
          'system-ui',
          'sans-serif',
        ],
      },

      // Font sizes
      fontSize: {
        '2xs': '11px',
        xs: '12px',
        sm: '13px',
        base: '14px',
        md: '15px',
        lg: '16px',
        xl: '18px',
      },

      // Line heights
      lineHeight: {
        tight: '1.25',
        normal: '1.55',
        relaxed: '1.7',
      },

      // Animation
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
}
