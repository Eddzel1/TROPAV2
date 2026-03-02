import { DuesPayment, FamilyMember, Household } from '../../types';
import { Edit, Trash2, CreditCard, Calendar, User, Receipt } from 'lucide-react';
import { formatDate, formatCurrency } from '../../lib/utils';

interface PaymentTableProps {
  payments: DuesPayment[];
  members: FamilyMember[];
  households: Household[];
  onEdit: (payment: DuesPayment) => void;
  onDelete: (id: string) => void;
}

const statusColors = { completed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700' };
const methodColors = { 'Cash': 'bg-gray-100 text-gray-700', 'Bank Transfer': 'bg-blue-100 text-blue-700', 'GCash': 'bg-green-100 text-green-700', 'PayMaya': 'bg-purple-100 text-purple-700', 'Check': 'bg-orange-100 text-orange-700' };

export function PaymentTable({ payments, members, households, onEdit, onDelete }: PaymentTableProps) {
  const getMemberName = (memberId: string) => { const member = members.find(m => m.id === memberId); if (!member) return 'Unknown Member'; return `${member.firstname} ${member.lastname}`; };
  const getHouseholdName = (householdId: string) => { const household = households.find(h => h.id === householdId); return household?.household_name || 'Unknown Household'; };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Member</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Amount</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Payment Details</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Method</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Status</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-teal-600" /></div><div><p className="font-medium text-gray-900">{getMemberName(payment.member_id)}</p><p className="text-sm text-gray-500">{getHouseholdName(payment.household_id)}</p></div></div></td>
                <td className="p-4"><p className="text-lg font-semibold text-gray-900">{formatCurrency(payment.amount)}</p><p className="text-sm text-gray-500">{payment.payment_month}{payment.months_covered && payment.months_covered > 1 && <span className="ml-1 text-teal-600 font-medium">({payment.months_covered} months)</span>}</p></td>
                <td className="p-4"><div className="flex items-center gap-2 text-sm text-gray-600 mb-1"><Calendar className="w-4 h-4" /><span>{formatDate(payment.payment_date)}</span></div>{payment.reference_number && (<div className="flex items-center gap-2 text-sm text-gray-600"><Receipt className="w-4 h-4" /><span>{payment.reference_number}</span></div>)}</td>
                <td className="p-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${methodColors[payment.payment_method]}`}>{payment.payment_method}</span></td>
                <td className="p-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[payment.status]}`}>{payment.status}</span></td>
                <td className="p-4"><div className="flex items-center gap-2"><button onClick={() => onEdit(payment)} className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button><button onClick={() => onDelete(payment.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payments.length === 0 && (<div className="text-center py-12"><CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No payments recorded</p></div>)}
    </div>
  );
}
