
import { DuesPayment, Household, FamilyMember } from '../../types';
import { Users, UserCheck, Shield, Calendar, TrendingUp, PieChart } from 'lucide-react';
import { getOutstandingMonths } from '../../lib/utils';

interface MembershipReportProps {
  households: Household[];
  members: FamilyMember[];
  payments: DuesPayment[];
  summaryStats: { totalHouseholds: number; totalMembers: number; cooperativeMembers: number; membershipRate: number; };
}

export function MembershipReport({ households, members, payments, summaryStats }: MembershipReportProps) {
  const ageGroups = members.reduce((acc, member) => {
    if (!member.age) return acc;
    let group = 'Unknown';
    if (member.age < 18) group = 'Under 18'; else if (member.age < 30) group = '18-29'; else if (member.age < 45) group = '30-44'; else if (member.age < 60) group = '45-59'; else group = '60+';
    acc[group] = (acc[group] || 0) + 1; return acc;
  }, {} as Record<string, number>);
  const sectorDistribution = members.reduce((acc, member) => {
    const sectors = member.sector ? member.sector.split(',').map(s => s.trim()).filter(Boolean) : ['General'];
    sectors.forEach(sector => {
      acc[sector] = (acc[sector] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  const householdSizes = households.reduce((acc, household) => {
    const size = members.filter(m => m.household_id === household.id).length; let group = 'Unknown';
    if (size === 1) group = '1 member'; else if (size <= 3) group = '2-3 members'; else if (size <= 5) group = '4-5 members'; else group = '6+ members';
    acc[group] = (acc[group] || 0) + 1; return acc;
  }, {} as Record<string, number>);
  const voters = members.filter(m => m.is_voter).length;
  const votingRate = members.length > 0 ? (voters / members.length) * 100 : 0;
  const householdLeaders = members.filter(m => m.is_household_leader).length;
  const currentMonthISO = new Date().toISOString().slice(0, 7);
  const unpaidMembersList = members.filter(m => m.is_cooperative_member).filter(member => {
    const memberPayments = payments.filter(p => p.member_id === member.id);
    const outstanding = getOutstandingMonths(member.membership_date, memberPayments, currentMonthISO);
    return outstanding.includes(currentMonthISO);
  });
  const unpaidCount = unpaidMembersList.length;
  const unpaidByLGU = unpaidMembersList.reduce((acc, member) => {
    const household = households.find(h => h.id === member.household_id);
    const lgu = household?.lgu || 'Unknown'; acc[lgu] = (acc[lgu] || 0) + 1; return acc;
  }, {} as Record<string, number>);
  const unpaidLGUCount = Object.keys(unpaidByLGU).length;

  const sectorColors: Record<string, string> = { 'General': 'bg-gray-500', 'Youth': 'bg-blue-500', 'PWD': 'bg-purple-500', 'Senior Citizen': 'bg-orange-500', 'LGBTQ+': 'bg-pink-500', 'Indigenous People': 'bg-green-500', 'Solo Parent': 'bg-yellow-500' };
  const ageOrder = ['Under 18', '18-29', '30-44', '45-59', '60+', 'Unknown'];
  const sizeOrder = ['1 member', '2-3 members', '4-5 members', '6+ members', 'Unknown'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5" />Membership Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center"><div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3"><Users className="w-8 h-8 text-blue-600" /></div><p className="text-2xl font-bold text-gray-900">{summaryStats.totalMembers}</p><p className="text-sm text-gray-600">Total Members</p></div>
          <div className="text-center"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><UserCheck className="w-8 h-8 text-green-600" /></div><p className="text-2xl font-bold text-gray-900">{summaryStats.cooperativeMembers}</p><p className="text-sm text-gray-600">TROPA Members</p><p className="text-xs text-green-600 font-medium">{summaryStats.membershipRate.toFixed(1)}% of total</p></div>
          <div className="text-center"><div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3"><Shield className="w-8 h-8 text-purple-600" /></div><p className="text-2xl font-bold text-gray-900">{householdLeaders}</p><p className="text-sm text-gray-600">Household Leaders</p></div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" />Age Distribution</h3>
        <div className="space-y-3">{Object.entries(ageGroups).sort(([a], [b]) => ageOrder.indexOf(a) - ageOrder.indexOf(b)).map(([group, count]) => { const pct = (count / members.length) * 100; return (<div key={group} className="flex items-center gap-4"><div className="w-20 text-sm text-gray-600">{group}</div><div className="flex-1 bg-gray-100 rounded-full h-3"><div className="bg-blue-500 h-3 rounded-full" style={{ width: `${pct}%` }}></div></div><div className="w-24 text-right text-sm font-medium text-gray-900">{count} ({pct.toFixed(1)}%)</div></div>); })}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5" />Sector Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{Object.entries(sectorDistribution).sort(([, a], [, b]) => b - a).map(([sector, count]) => { const pct = (count / members.length) * 100; return (<div key={sector} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><div className={`w-4 h-4 rounded-full ${sectorColors[sector] || 'bg-gray-400'}`}></div><div className="flex-1"><p className="font-medium text-gray-900">{sector}</p><p className="text-sm text-gray-600">{count} members ({pct.toFixed(1)}%)</p></div></div>); })}</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 className="text-lg font-semibold text-gray-900 mb-4">Household Size Distribution</h3><div className="space-y-3">{Object.entries(householdSizes).sort(([a], [b]) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b)).map(([size, count]) => { const pct = (count / households.length) * 100; return (<div key={size} className="flex items-center gap-4"><div className="w-24 text-sm text-gray-600">{size}</div><div className="flex-1 bg-gray-100 rounded-full h-2"><div className="bg-teal-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div></div><div className="w-8 text-right text-sm font-medium text-gray-900">{count}</div></div>); })}</div></div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 className="text-lg font-semibold text-gray-900 mb-4">Voting Statistics</h3><div className="space-y-4"><div className="text-center"><div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3"><span className="text-2xl font-bold text-blue-600">{votingRate.toFixed(0)}%</span></div><p className="text-lg font-semibold text-gray-900">Voting Rate</p><p className="text-sm text-gray-600">{voters} out of {members.length} members</p></div><div className="bg-gray-50 rounded-lg p-4"><div className="flex justify-between items-center mb-2"><span className="text-sm text-gray-600">Registered Voters</span><span className="text-sm font-medium text-gray-900">{voters}</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Non-Voters</span><span className="text-sm font-medium text-gray-900">{members.length - voters}</span></div></div></div></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5" />Unpaid Dues Summary (Current Month)</h3>
        <div className="grid grid-cols-2 gap-4 mb-6"><div className="bg-amber-100 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-amber-900">{unpaidCount}</p><p className="text-xs text-amber-800">Unpaid Members</p></div><div className="bg-green-100 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-green-900">{unpaidLGUCount}</p><p className="text-xs text-green-800">Unpaid from diff. LGUs</p></div></div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Unpaid Members by LGU</h4>
        <div className="space-y-3">{Object.entries(unpaidByLGU).sort(([, a], [, b]) => b - a).slice(0, 5).map(([lgu, count]) => (<div key={lgu} className="flex items-center justify-between"><span className="text-sm text-gray-600">{lgu || 'Unknown LGU'}</span><div className="flex items-center gap-2"><div className="w-32 bg-gray-100 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(count / unpaidCount) * 100}%` }}></div></div><span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span></div></div>))}</div>
      </div>
    </div>
  );
}
