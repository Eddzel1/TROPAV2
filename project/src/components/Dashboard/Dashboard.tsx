import { Header } from '../Layout/Header';
import { StatCard } from './StatCard';
import { BarangayStats } from './BarangayStats';
import { Home, Users, UserCheck, Activity, ArrowDown, ArrowUp } from 'lucide-react';
import { Household } from '../../types';
import { useDashboardStats } from '../../hooks/useSupabase';

interface DashboardProps {
  households: Household[];
  onMenuClick: () => void;
}

export function Dashboard({ households, onMenuClick }: DashboardProps) {
  const { stats } = useDashboardStats();

  // Calculate Avg, Min, Max members per household
  const householdMembers = households
    .filter(h => h.status === 'active')
    .map(h => h.total_members || 0);
  
  const avgMembers = householdMembers.length > 0 
    ? (householdMembers.reduce((a, b) => a + b, 0) / householdMembers.length).toFixed(1) 
    : '0';
  const minMembers = householdMembers.length > 0 ? Math.min(...householdMembers) : 0;
  const maxMembers = householdMembers.length > 0 ? Math.max(...householdMembers) : 0;

  return (
    <div className="flex-1 bg-gray-50 min-h-0 overflow-auto">
      <Header title="Dashboard" subtitle="Welcome to TROPA Members Management System" onMenuClick={onMenuClick} />
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <StatCard title="Total Households" value={stats.totalHouseholds || households.length} icon={Home} color="blue" />
          <StatCard title="Total Members" value={stats.totalMembers} icon={Users} color="green" />
          <StatCard title="Active Members" value={stats.activeMembers} icon={UserCheck} color="teal" />
          <StatCard title="Avg Members/Household" value={avgMembers} icon={Activity} color="purple" />
          <StatCard title="Min Members/Household" value={minMembers} icon={ArrowDown} color="orange" />
          <StatCard title="Max Members/Household" value={maxMembers} icon={ArrowUp} color="indigo" />
        </div>
        <div className="mb-6 lg:mb-8">
          <BarangayStats households={households} />
        </div>
      </div>
    </div>
  );
}
