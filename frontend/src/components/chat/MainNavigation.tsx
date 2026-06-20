/**
 * MainNavigation - 主导航组件
 *
 * 实现左侧主导航栏，包含品牌区、导航项、用户区
 * 设计风格：简洁、优雅、专业
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  AlertTriangle,
  MessageSquare,
  Settings,
  Menu,
  X,
  User,
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: '仪表盘',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    id: 'products',
    label: '商品',
    icon: Package,
    path: '/products',
  },
  {
    id: 'alerts',
    label: '预警',
    icon: AlertTriangle,
    path: '/alerts',
  },
  {
    id: 'assistant',
    label: '智能助手',
    icon: MessageSquare,
    path: '/chat',
  },
  {
    id: 'settings',
    label: '设置',
    icon: Settings,
    path: '/settings',
  },
];

export const MainNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 判断是否为当前激活路径
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // 处理导航点击
  const handleNavigate = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false); // 移动端点击后关闭菜单
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
        aria-label="Toggle navigation menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-gray-700" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700" />
        )}
      </button>

      {/* Navigation Sidebar */}
      <nav
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-[208px] bg-white border-r border-gray-200
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* 品牌区 */}
        <div className="px-5 py-6 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            {/* Logo - 使用紫色圆形作为品牌标识 */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">AI</span>
            </div>

            {/* 品牌名称 */}
            <div className="flex flex-col">
              <h1 className="text-base font-semibold text-gray-900 leading-tight">
                AI 运营助手
              </h1>
              <p className="text-xs text-gray-500 leading-tight">
                智能电商管理
              </p>
            </div>
          </div>
        </div>

        {/* 导航项列表 */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-sm font-medium transition-all duration-150
                  ${
                    active
                      ? 'bg-purple-50 text-purple-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon
                  className={`
                    w-5 h-5 transition-colors
                    ${active ? 'text-purple-600' : 'text-gray-500'}
                  `}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* 用户区 */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-gray-700 hover:bg-gray-50 transition-colors duration-150"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900">用户</span>
              <span className="text-xs text-gray-500">查看资料</span>
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};
