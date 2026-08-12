// import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: 'blue' | 'green' | 'teal' | 'purple' | 'orange' | 'indigo' | 'pink';
  trend?: { value: number; isPositive: boolean; };
}

const colorStyles = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-600', border: 'border-blue-100' },
  green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-600', border: 'border-green-100' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', icon: 'text-teal-600', border: 'border-teal-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-600', border: 'border-purple-100' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-600', border: 'border-orange-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-600', border: 'border-indigo-100' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', icon: 'text-pink-600', border: 'border-pink-100' },
};

export function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const styles = colorStyles[color];
  
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:p-6 transition-all duration-200 hover:shadow-md hover:border-gray-200 hover:-translate-y-1 relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 w-24 h-24 ${styles.bg} rounded-bl-full -mr-4 -mt-4 opacity-50 transition-transform group-hover:scale-110`} />
      
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className={`w-12 h-12 rounded-xl ${styles.bg} ${styles.border} border flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${styles.icon}`} />
        </div>
        <p className="text-sm font-medium text-gray-500 leading-tight flex-1">{title}</p>
      </div>
      
      <div className="relative z-10">
        <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
        {trend && (
          <div className={`mt-2 text-xs lg:text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}% from last month
          </div>
        )}
      </div>
    </div>
  );
}
