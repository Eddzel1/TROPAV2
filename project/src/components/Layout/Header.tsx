import React from 'react';
import { Bell, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function Header({ title, subtitle, onMenuClick }: HeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-100 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 mt-1 text-sm lg:text-base">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </div>
  );
}
