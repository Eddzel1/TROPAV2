import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'teal' | 'purple' | 'orange';
  trend?: { value: number; isPositive: boolean; };
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

export function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">{value}</p>
          {trend && (
            <div className={`text-xs lg:text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </div>
          )}
        </div>
        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
