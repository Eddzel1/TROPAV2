import { BarChart3 } from 'lucide-react';
import { DuesPayment } from '../../types';

interface PaymentChartProps {
  payments: DuesPayment[];
}

export function PaymentChart({ payments }: PaymentChartProps) {
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  }).reverse();

  const monthLabels = last6Months.map(m => {
    const d = new Date(m + '-01');
    return d.toLocaleDateString('default', { month: 'short', year: 'numeric' });
  });

  const data = last6Months.map(month => {
    return payments
      .filter(p => p.status === 'completed' && p.payment_month === month)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  });

  const maxValue = Math.max(...data, 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900">Payment Collections (Last 6 Months)</h3>
      </div>
      <div className="space-y-4">
        {monthLabels.map((month, index) => (
          <div key={month} className="flex items-center gap-4">
            <div className="w-20 text-sm text-gray-600">{month}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-3 relative">
              <div className="bg-teal-500 h-3 rounded-full transition-all duration-300" style={{ width: `${(data[index] / maxValue) * 100}%` }}></div>
            </div>
            <div className="w-12 text-right text-sm font-medium text-gray-900">₱{data[index]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
