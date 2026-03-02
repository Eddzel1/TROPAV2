import { useState } from 'react';
import { Header } from '../Layout/Header';
import { PaymentTable } from './PaymentTable';
import { PaymentForm } from './PaymentForm';
import { UnpaidMembersTable } from './UnpaidMembersTable';
import { DuesPayment, FamilyMember, Household } from '../../types';
import { Plus, Search, CreditCard, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { getOutstandingMonths } from '../../lib/utils';

interface DuesCollectionProps {
  payments: DuesPayment[];
  members: FamilyMember[];
  households: Household[];
  onCreatePayment: (payment: Omit<DuesPayment, 'id' | 'created_date' | 'updated_date'>) => Promise<DuesPayment>;
  onUpdatePayment: (id: string, updates: Partial<DuesPayment>) => Promise<DuesPayment>;
  onDeletePayment: (id: string) => Promise<void>;
  onMenuClick: () => void;
}

type ViewMode = 'payments' | 'unpaid';

export function DuesCollection({ payments, members, households, onCreatePayment, onUpdatePayment, onDeletePayment, onMenuClick }: DuesCollectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<DuesPayment | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('payments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterLGU, setFilterLGU] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('');
  const [preSelectedMemberId, setPreSelectedMemberId] = useState<string>('');

  const displayPayments = payments.filter(payment => {
    const member = members.find(m => m.id === payment.member_id);
    const household = households.find(h => h.id === payment.household_id);
    const memberName = member ? `${member.firstname} ${member.lastname}`.toLowerCase() : '';
    const householdName = household ? household.household_name.toLowerCase() : '';
    const matchesSearch = memberName.includes(searchTerm.toLowerCase()) || householdName.includes(searchTerm.toLowerCase()) || payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = !filterMonth || payment.payment_month === filterMonth;
    const matchesStatus = !filterStatus || payment.status === filterStatus;
    const matchesMethod = !filterMethod || payment.payment_method === filterMethod;
    return matchesSearch && matchesMonth && matchesStatus && matchesMethod;
  });

  const handleEdit = (payment: DuesPayment) => { setEditingPayment(payment); setPreSelectedMemberId(''); setIsFormOpen(true); };
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment record?')) {
      try { await onDeletePayment(id); } catch (error) { alert('Failed to delete payment. Please try again.'); }
    }
  };
  const handleSave = async (paymentData: Partial<DuesPayment>) => {
    try {
      if (editingPayment) { await onUpdatePayment(editingPayment.id, paymentData); }
      else { await onCreatePayment(paymentData as Omit<DuesPayment, 'id' | 'created_date' | 'updated_date'>); }
      setEditingPayment(undefined); setPreSelectedMemberId('');
    } catch (error) { alert('Failed to save payment.'); }
  };
  const handlePayMember = (memberId: string) => { setPreSelectedMemberId(memberId); setEditingPayment(undefined); setIsFormOpen(true); };

  const totalPayments = payments.length;
  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const currentMonthISO = new Date().toISOString().slice(0, 7);
  const monthlyCollection = completedPayments.filter(p => p.payment_month === currentMonthISO).reduce((sum, p) => sum + p.amount, 0);
  const cooperativeMembers = members.filter(m => m.is_cooperative_member);
  const outstandingMembers = cooperativeMembers.filter(member => {
    const memberPayments = payments.filter(p => p.member_id === member.id);
    const outstanding = getOutstandingMonths(member.membership_date, memberPayments, currentMonthISO);
    return outstanding.length > 0;
  }).length;
  const uniqueMonths = [...new Set(payments.map(p => p.payment_month))].sort().reverse();
  if (!uniqueMonths.includes(currentMonthISO)) uniqueMonths.unshift(currentMonthISO);
  const uniqueMethods = [...new Set(payments.map(p => p.payment_method))];
  const uniqueLGUs = [...new Set(households.map(h => h.lgu).filter(Boolean))].sort();
  const uniqueBarangays = [...new Set(households.map(h => h.barangay).filter(Boolean))].sort();

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Dues Collection" subtitle="Record and manage membership dues payments" onMenuClick={onMenuClick} />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total Payments</p><p className="text-2xl font-bold text-gray-900">{totalPayments}</p></div><div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center"><CreditCard className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total Collection</p><p className="text-2xl font-bold text-gray-900">₱{totalAmount.toLocaleString()}</p></div><div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"><DollarSign className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">This Month</p><p className="text-2xl font-bold text-gray-900">₱{monthlyCollection.toLocaleString()}</p><p className="text-xs text-gray-500">{currentMonthISO}</p></div><div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><Calendar className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Outstanding Members</p><p className="text-2xl font-bold text-gray-900">{outstandingMembers}</p></div><div className={`w-12 h-12 ${outstandingMembers > 0 ? 'bg-amber-500' : 'bg-green-500'} rounded-full flex items-center justify-center`}><AlertCircle className="w-6 h-6 text-white" /></div></div></div>
        </div>
        <div className="flex justify-center mb-6">
          <div className="bg-white p-1 rounded-lg border border-gray-200 flex shadow-sm">
            <button onClick={() => setViewMode('payments')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'payments' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Payment History</button>
            <button onClick={() => setViewMode('unpaid')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'unpaid' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Unpaid Members</button>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search by member, household, or ref..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full" disabled={viewMode === 'unpaid'} /></div>
          <div className="flex flex-wrap gap-2">
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"><option value="">All Months</option>{uniqueMonths.map(month => (<option key={month} value={month}>{new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</option>))}</select>
            {viewMode === 'payments' && (<><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg"><option value="">All Status</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option></select><select value={filterMethod} onChange={(e) => setFilterMethod(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg"><option value="">All Methods</option>{uniqueMethods.map(method => (<option key={method} value={method}>{method}</option>))}</select></>)}
            {viewMode === 'unpaid' && (<><select value={filterLGU} onChange={(e) => setFilterLGU(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg"><option value="">All LGUs</option>{uniqueLGUs.map(lgu => (<option key={lgu} value={lgu}>{lgu}</option>))}</select><select value={filterBarangay} onChange={(e) => setFilterBarangay(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg"><option value="">All Barangays</option>{uniqueBarangays.map(gy => (<option key={gy} value={gy}>{gy}</option>))}</select></>)}
            <button onClick={() => { setPreSelectedMemberId(''); setEditingPayment(undefined); setIsFormOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"><Plus className="w-4 h-4" />Record Payment</button>
          </div>
        </div>
        {viewMode === 'payments' ? <PaymentTable payments={displayPayments} members={members} households={households} onEdit={handleEdit} onDelete={handleDelete} /> : <UnpaidMembersTable members={members} households={households} payments={payments} filterMonth={filterMonth} filterLGU={filterLGU} filterBarangay={filterBarangay} onPay={handlePayMember} />}
      </div>
      <PaymentForm payment={editingPayment} members={members} households={households} payments={payments} isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingPayment(undefined); setPreSelectedMemberId(''); }} onSave={handleSave} preSelectedMemberId={preSelectedMemberId} />
    </div>
  );
}
