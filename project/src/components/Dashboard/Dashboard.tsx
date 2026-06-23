
import { useMemo } from 'react';
import { Header } from '../Layout/Header';
import { StatCard } from './StatCard';
import { RecentPayments } from './RecentPayments';
import { PaymentChart } from './PaymentChart';
import { LocationBreakdown } from './LocationBreakdown';
import { MembersMap } from './MembersMap';
import { Home, Users, UserCheck, DollarSign, Clock } from 'lucide-react';
import { Household, FamilyMember, DuesPayment } from '../../types';
import { useDashboardStats, useFamilyMembers, useDuesPayments } from '../../hooks/useSupabase';

interface DashboardProps {
  households: Household[];
  onMenuClick: () => void;
  // members/payments are now fetched internally – kept optional for backward compat
  members?: FamilyMember[];
  payments?: DuesPayment[];
}

export function Dashboard({ households, onMenuClick }: DashboardProps) {
  const { stats } = useDashboardStats();
  
  const last6MonthsStart = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 5);
    return d.toISOString().slice(0, 7);
  }, []);

  // Fetch only members with coordinates for the map
  const { members } = useFamilyMembers(undefined, true);
  // Fetch only payments from the last 6 months for the chart/recent list
  const { payments } = useDuesPayments(undefined, undefined, undefined, last6MonthsStart);

  return (
    <div className="flex-1 bg-gray-50 min-h-0 overflow-auto">
      <Header title="Dashboard" subtitle="Welcome to TROPA Members Management System" onMenuClick={onMenuClick} />
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <StatCard title="Total Households" value={stats.totalHouseholds || households.length} icon={Home} color="blue" />
          <StatCard title="Total Members" value={stats.totalMembers} icon={Users} color="green" />
          <StatCard title="Active Members" value={stats.activeMembers} icon={UserCheck} color="teal" />
          <StatCard title="Monthly Collection" value={`₱${stats.monthlyCollection.toLocaleString()}`} icon={DollarSign} color="purple" />
          <StatCard title="Pending Dues" value={stats.pendingDues} icon={Clock} color="orange" />
        </div>
        <div className="mb-6 lg:mb-8">
          <MembersMap members={members} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <RecentPayments payments={payments} members={members} />
          <LocationBreakdown households={households} />
        </div>
        <PaymentChart payments={payments} />
      </div>
    </div>
  );
}
