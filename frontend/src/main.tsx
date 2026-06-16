import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import './index.css'
import './i18n'
import App from './App.tsx'

// 开发环境导入测试工具
if (import.meta.env.DEV) {
  import('./test-sse').then(({ testSSE }) => {
    (window as Record<string, unknown>).testSSE = testSSE;
    console.log('💡 SSE 测试工具已加载，在控制台运行: await testSSE()');
  });
}

// Apply persisted theme before first paint to avoid a flash of the wrong mode.
const storedTheme = localStorage.getItem('theme')
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
