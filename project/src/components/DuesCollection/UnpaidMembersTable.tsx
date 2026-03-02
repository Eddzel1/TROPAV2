import React from 'react';
import { FamilyMember, Household, DuesPayment } from '../../types';
import { User, AlertCircle, CreditCard, DollarSign } from 'lucide-react';
import { getOutstandingMonths, formatMonthName, formatCurrency } from '../../lib/utils';

interface UnpaidMembersTableProps {
  members: FamilyMember[];
  households: Household[];
  payments: DuesPayment[];
  filterMonth: string;
  filterLGU: string;
  filterBarangay: string;
  onPay: (memberId: string) => void;
}

export function UnpaidMembersTable({ members, households, payments, filterMonth, filterLGU, filterBarangay, onPay }: UnpaidMembersTableProps) {
  const currentMonth = filterMonth || new Date().toISOString().slice(0, 7);
  const unpaidMembers = members.filter(m => m.is_cooperative_member).filter(member => {
    const household = households.find(h => h.id === member.household_id);
    if (filterLGU && household?.lgu !== filterLGU) return false;
    if (filterBarangay && household?.barangay !== filterBarangay) return false;
    const memberPayments = payments.filter(p => p.member_id === member.id);
    const outstanding = getOutstandingMonths(member.membership_date, memberPayments, currentMonth);
    return outstanding.includes(currentMonth);
  });

  const getHouseholdName = (householdId: string) => { const household = households.find(h => h.id === householdId); return household?.household_name || 'Unknown Household'; };
  const getHouseholdLocation = (householdId: string) => { const household = households.find(h => h.id === householdId); return household ? `${household.barangay}, ${household.lgu}` : ''; };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-amber-50">
        <div className="flex items-center gap-2 text-amber-800"><AlertCircle className="w-5 h-5" /><span className="font-medium">Showing {unpaidMembers.length} unpaid members for {formatMonthName(currentMonth)}</span>{filterLGU && <span className="text-sm border-l border-amber-200 pl-2 ml-2">LGU: {filterLGU}</span>}{filterBarangay && <span className="text-sm border-l border-amber-200 pl-2 ml-2">Brgy: {filterBarangay}</span>}</div>
        <p className="text-sm text-amber-600 mt-1 ml-7">Potential Collection: <span className="font-bold">{formatCurrency(unpaidMembers.length * 50)}</span></p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr><th className="text-left p-4 text-sm font-semibold text-gray-900">Member</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Location</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Contact</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Status</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Action</th></tr>
          </thead>
          <tbody>
            {unpaidMembers.map((member) => (
              <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-amber-600" /></div><div><p className="font-medium text-gray-900">{member.firstname} {member.lastname}</p><p className="text-sm text-gray-500">{getHouseholdName(member.household_id)}</p></div></div></td>
                <td className="p-4"><p className="text-sm text-gray-700">{getHouseholdLocation(member.household_id)}</p></td>
                <td className="p-4"><p className="text-sm text-gray-500">{member.contact_number || '-'}</p></td>
                <td className="p-4"><span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><AlertCircle className="w-3.5 h-3.5" />Unpaid</span></td>
                <td className="p-4"><button onClick={() => onPay(member.id)} className="flex items-center gap-2 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg transition-colors"><CreditCard className="w-3.5 h-3.5" />Pay Now</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {unpaidMembers.length === 0 && (<div className="text-center py-12"><div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><DollarSign className="w-6 h-6 text-green-600" /></div><p className="text-gray-900 font-medium">All Clear!</p><p className="text-gray-500">No unpaid members found for {formatMonthName(currentMonth)}</p></div>)}
    </div>
  );
}
