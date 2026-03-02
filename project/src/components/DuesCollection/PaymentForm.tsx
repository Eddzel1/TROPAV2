import React, { useState } from 'react';
import { DuesPayment, FamilyMember, Household } from '../../types';
import { X, Save, CreditCard, Calendar, User, DollarSign, Search, Check, AlertCircle } from 'lucide-react';
import { getOutstandingMonths, generateMonthRange } from '../../lib/utils';

interface PaymentFormProps {
  payment?: DuesPayment;
  members: FamilyMember[];
  households: Household[];
  payments?: DuesPayment[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (payment: Partial<DuesPayment>) => void;
  preSelectedMemberId?: string;
}

const paymentMethods = ['Cash', 'Bank Transfer', 'GCash', 'PayMaya', 'Check'];

export function PaymentForm({ payment, members, households, payments = [], isOpen, onClose, onSave, preSelectedMemberId }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    member_id: payment?.member_id || preSelectedMemberId || '',
    household_id: payment?.household_id || '',
    member_search: '',
    show_member_dropdown: false,
    selected_member_index: -1,
    amount: payment?.amount?.toString() || '50',
    payment_month: payment?.payment_month || new Date().toISOString().slice(0, 7),
    months_covered: payment?.months_covered?.toString() || '1',
    payment_date: payment?.payment_date ? payment.payment_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    payment_method: payment?.payment_method || 'Cash',
    reference_number: payment?.reference_number || '',
    notes: payment?.notes || '',
    status: payment?.status || 'completed',
  });
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && preSelectedMemberId && !payment) {
      const member = members.find(m => m.id === preSelectedMemberId);
      if (member) {
        const household = households.find(h => h.id === member.household_id);
        setFormData(prev => ({ ...prev, member_id: preSelectedMemberId, household_id: member.household_id, member_search: `${member.firstname} ${member.lastname} - ${household?.household_name || 'Unknown Household'}`, show_member_dropdown: false }));
      }
    }
  }, [isOpen, preSelectedMemberId, payment, members, households]);

  const filteredMembers = members.filter(m => m.is_cooperative_member).filter(member => {
    if (!formData.member_search) return true;
    const household = households.find(h => h.id === member.household_id);
    const fullName = `${member.firstname} ${member.lastname}`.toLowerCase();
    const householdName = household?.household_name.toLowerCase() || '';
    const searchTerm = formData.member_search.toLowerCase();
    return fullName.includes(searchTerm) || householdName.includes(searchTerm) || member.contact_number?.includes(searchTerm);
  }).slice(0, 10);

  const handleMemberChange = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      const household = households.find(h => h.id === member.household_id);
      setFormData(prev => ({ ...prev, member_id: memberId, household_id: member.household_id, member_search: `${member.firstname} ${member.lastname} - ${household?.household_name || 'Unknown Household'}`, show_member_dropdown: false, selected_member_index: -1 }));
      setError(null);
    }
  };

  const handleMemberSearchChange = (value: string) => {
    setFormData(prev => ({ ...prev, member_search: value, show_member_dropdown: value.length > 0, member_id: '', household_id: '', selected_member_index: -1 }));
  };

  const calculateEndMonth = (startMonth: string, monthsCovered: number): string => {
    const [year, month] = startMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + monthsCovered - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatMonthName = (monthStr: string): string => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getPaymentPeriodDisplay = (): string => {
    const startMonth = formData.payment_month;
    const monthsCovered = parseInt(formData.months_covered);
    if (monthsCovered === 1) return formatMonthName(startMonth);
    const endMonth = calculateEndMonth(startMonth, monthsCovered);
    return `${formatMonthName(startMonth)} - ${formatMonthName(endMonth)}`;
  };

  const resetForm = () => {
    setFormData({ member_id: '', household_id: '', member_search: '', show_member_dropdown: false, selected_member_index: -1, amount: '50', payment_month: new Date().toISOString().slice(0, 7), months_covered: '1', payment_date: new Date().toISOString().split('T')[0], payment_method: 'Cash', reference_number: '', notes: '', status: 'completed' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const monthsCovered = parseInt(formData.months_covered);
    const startMonth = formData.payment_month;
    const endMonth = calculateEndMonth(startMonth, monthsCovered);
    const newPaymentMonths = generateMonthRange(startMonth, endMonth);
    const existingPaymentMonths = new Set<string>();
    payments.filter(p => p.member_id === formData.member_id && p.status === 'completed' && p.id !== payment?.id).forEach(p => {
      if (p.payment_for_month && p.payment_end_month) { const months = generateMonthRange(p.payment_for_month, p.payment_end_month); months.forEach(m => existingPaymentMonths.add(m)); }
    });
    const duplicates = newPaymentMonths.filter(m => existingPaymentMonths.has(m));
    if (duplicates.length > 0) { setError(`Payment for ${duplicates.map(m => formatMonthName(m)).join(', ')} already exists.`); return; }
    const paymentData = { member_id: formData.member_id, household_id: formData.household_id, amount: parseFloat(formData.amount), months_covered: monthsCovered, payment_for_month: startMonth, payment_end_month: endMonth, payment_month: getPaymentPeriodDisplay(), payment_date: new Date(formData.payment_date), payment_method: formData.payment_method, reference_number: formData.reference_number || undefined, notes: formData.notes || undefined, status: formData.status, collected_by: 'current_user', created_by: 'current_user' };
    onSave(paymentData); resetForm(); onClose();
  };

  const handleClose = () => { resetForm(); onClose(); };
  const selectedMember = members.find(m => m.id === formData.member_id);
  const selectedHousehold = households.find(h => h.id === formData.household_id);
  const memberPayments = selectedMember ? payments.filter(p => p.member_id === selectedMember.id) : [];
  const outstandingMonths = selectedMember ? getOutstandingMonths(selectedMember.membership_date, memberPayments) : [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center"><CreditCard className="w-5 h-5 text-teal-600" /></div><h2 className="text-xl font-bold text-gray-900">{payment ? 'Edit Payment' : 'Record New Payment'}</h2></div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3"><AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><div><p className="font-medium">Duplicate Payment</p><p className="text-sm">{error}</p></div></div>)}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Member *</label>
            <div className="relative">
              <div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" required={!formData.member_id} value={formData.member_search} onChange={(e) => handleMemberSearchChange(e.target.value)} onFocus={() => setFormData(prev => ({ ...prev, show_member_dropdown: prev.member_search.length > 0 }))} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Search member..." />{formData.member_id && <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />}</div>
              {formData.show_member_dropdown && filteredMembers.length > 0 && (<div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">{filteredMembers.map((member, index) => { const household = households.find(h => h.id === member.household_id); return (<button key={member.id} type="button" onClick={() => handleMemberChange(member.id)} className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 ${index === formData.selected_member_index ? 'bg-teal-100' : 'hover:bg-gray-50'}`}><div className="flex items-center gap-3"><div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-teal-600" /></div><div><p className="font-medium text-gray-900">{member.firstname} {member.lastname}</p><p className="text-sm text-gray-500">{household?.household_name || 'Unknown'}</p></div></div></button>); })}</div>)}
            </div>
          </div>
          {selectedMember && selectedHousehold && (
            <>
              <div className="bg-blue-50 rounded-lg p-4"><div className="flex items-center gap-3"><User className="w-5 h-5 text-blue-600" /><div><p className="font-medium text-blue-900">{selectedMember.firstname} {selectedMember.lastname}</p><p className="text-sm text-blue-700">{selectedHousehold.household_name} • {selectedHousehold.lgu}, {selectedHousehold.barangay}</p></div></div></div>
              {outstandingMonths.length > 0 && (<div className="bg-amber-50 rounded-lg p-4 border border-amber-200"><div className="flex items-start gap-3"><AlertCircle className="w-5 h-5 text-amber-600" /><div><p className="font-medium text-amber-900 mb-1">Outstanding Dues: {outstandingMonths.length} months</p><div className="flex flex-wrap gap-1">{outstandingMonths.slice(0, 6).map(month => (<span key={month} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded">{formatMonthName(month)}</span>))}{outstandingMonths.length > 6 && <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded">+{outstandingMonths.length - 6} more</span>}</div></div></div></div>)}
            </>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Amount (₱) *</label><div className="relative"><DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="number" required min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="50.00" /></div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label><select required value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as DuesPayment['payment_method'] })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">{paymentMethods.map(method => (<option key={method} value={method}>{method}</option>))}</select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Starting Month *</label><input type="month" required value={formData.payment_month} onChange={(e) => { setFormData({ ...formData, payment_month: e.target.value }); setError(null); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Number of Months *</label><select required value={formData.months_covered} onChange={(e) => { setFormData({ ...formData, months_covered: e.target.value }); setError(null); }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">{[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (<option key={num} value={num}>{num} {num === 1 ? 'Month' : 'Months'}</option>))}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Payment Date *</label><input type="date" required value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" /></div>
          {formData.payment_method !== 'Cash' && (<div><label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label><input type="text" value={formData.reference_number} onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Enter reference number" /></div>)}
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as DuesPayment['status'] })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"><option value="completed">Completed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Add any additional notes..." /></div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"><Save className="w-4 h-4" />{payment ? 'Update Payment' : 'Record Payment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
