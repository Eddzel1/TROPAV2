import { useState, useMemo } from 'react';
import { Header } from '../Layout/Header';
import { MembershipReport } from './MembershipReport';
import { PaymentReport } from './PaymentReport';
import { LocationReport } from './LocationReport';
import { SectorReport } from './SectorReport';
import { ExportReport } from './ExportReport';
import { Household, FamilyMember, DuesPayment, Location, ContributionRate } from '../../types';
import { Users, CreditCard, MapPin, PieChart, Download, Calendar, TrendingUp } from 'lucide-react';

interface ReportsProps {
  households: Household[];
  members: FamilyMember[];
  payments: DuesPayment[];
  locations: Location[];
  contributionRates: ContributionRate[];
  onMenuClick: () => void;
}

export function Reports({ households, members, payments, locations, contributionRates, onMenuClick }: ReportsProps) {
  const [activeTab, setActiveTab] = useState('membership');
  const [dateRange, setDateRange] = useState({ startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] });

  const filteredPayments = useMemo(() => payments.filter(payment => {
    const paymentDate = new Date(payment.payment_date);
    return paymentDate >= new Date(dateRange.startDate) && paymentDate <= new Date(dateRange.endDate);
  }), [payments, dateRange]);

  const summaryStats = useMemo(() => {
    const totalHouseholds = households.length;
    const totalMembers = members.length;
    const cooperativeMembers = members.filter(m => m.is_cooperative_member).length;
    const totalPayments = filteredPayments.length;
    const totalRevenue = filteredPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    const averagePayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;
    return { totalHouseholds, totalMembers, cooperativeMembers, totalPayments, totalRevenue, averagePayment, membershipRate: totalMembers > 0 ? (cooperativeMembers / totalMembers) * 100 : 0 };
  }, [households, members, filteredPayments]);

  const tabs = [
    { id: 'membership', label: 'Membership', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'sectors', label: 'Sectors', icon: PieChart },
    { id: 'export', label: 'Export', icon: Download }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'membership': return <MembershipReport households={households} members={members} payments={payments} summaryStats={summaryStats} contributionRates={contributionRates} />;
      case 'payments': return <PaymentReport payments={filteredPayments} members={members} households={households} summaryStats={summaryStats} contributionRates={contributionRates} />;
      case 'locations': return <LocationReport households={households} members={members} locations={locations} />;
      case 'sectors': return <SectorReport members={members} households={households} />;
      case 'export': return <ExportReport households={households} members={members} payments={filteredPayments} locations={locations} />;
      default: return <MembershipReport households={households} members={members} payments={payments} summaryStats={summaryStats} contributionRates={contributionRates} />;
    }
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-0 overflow-auto">
      <Header title="Reports & Analytics" subtitle="Comprehensive data analysis and reporting" onMenuClick={onMenuClick} />
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total Households</p><p className="text-2xl font-bold text-gray-900">{summaryStats.totalHouseholds}</p></div><div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">TROPA Members</p><p className="text-2xl font-bold text-gray-900">{summaryStats.cooperativeMembers}</p><p className="text-xs text-gray-500">{summaryStats.membershipRate.toFixed(1)}% membership rate</p></div><div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p><p className="text-2xl font-bold text-gray-900">₱{summaryStats.totalRevenue.toLocaleString()}</p><p className="text-xs text-gray-500">{summaryStats.totalPayments} payments</p></div><div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center"><CreditCard className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Avg Payment</p><p className="text-2xl font-bold text-gray-900">₱{summaryStats.averagePayment.toFixed(0)}</p></div><div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center"><TrendingUp className="w-6 h-6 text-white" /></div></div></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6 mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-gray-600" /><span className="text-sm font-medium text-gray-700">Date Range:</span></div>
            <div className="flex flex-col sm:flex-row gap-2"><input type="date" value={dateRange.startDate} onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" /><span className="text-gray-500 self-center">to</span><input type="date" value={dateRange.endDate} onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm" /></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-6 lg:mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map((tab) => { const Icon = tab.icon; return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}><Icon className="w-4 h-4" /><span className="hidden sm:inline">{tab.label}</span></button>); })}
        </div>
        {renderActiveTab()}
      </div>
    </div>
  );
}
