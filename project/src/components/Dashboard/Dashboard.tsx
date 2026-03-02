
import { Header } from '../Layout/Header';
import { StatCard } from './StatCard';
import { RecentPayments } from './RecentPayments';
import { PaymentChart } from './PaymentChart';
import { LocationBreakdown } from './LocationBreakdown';
import { MembersMap } from './MembersMap';
import { Home, Users, UserCheck, DollarSign, Clock } from 'lucide-react';
import { Household, FamilyMember, DuesPayment } from '../../types';


interface DashboardProps {
  households: Household[];
  members: FamilyMember[];
  payments: DuesPayment[];
  onMenuClick: () => void;
}

export function Dashboard({ households, members, payments, onMenuClick }: DashboardProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyCollection = payments
    .filter(p => p.status === 'completed' && p.payment_month === currentMonth)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // Assuming pending dues might just be sum of all pending amounts for simplicity
  const pendingDues = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="flex-1 bg-gray-50 min-h-0 overflow-auto">
      <Header title="Dashboard" subtitle="Welcome to TROPA Members Management System" onMenuClick={onMenuClick} />
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <StatCard title="Total Households" value={households.length} icon={Home} color="blue" />
          <StatCard title="Total Members" value={members.length} icon={Users} color="green" />
          <StatCard title="Active Members" value={members.filter(m => m.is_cooperative_member).length} icon={UserCheck} color="teal" />
          <StatCard title="Monthly Collection" value={`\u20B1${monthlyCollection}`} icon={DollarSign} color="purple" />
          <StatCard title="Pending Dues" value={pendingDues} icon={Clock} color="orange" />
        </div>
        <div className="mb-6 lg:mb-8">
          <MembersMap members={members} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <RecentPayments payments={payments} members={members} />
          <LocationBreakdown households={households} members={members} />
        </div>
        <PaymentChart payments={payments} />
      </div>
    </div>
  );
}
