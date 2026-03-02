import React from 'react';
import { DuesPayment, FamilyMember } from '../../types';
import { Calendar, User, CreditCard } from 'lucide-react';

interface RecentPaymentsProps {
  payments: DuesPayment[];
  members: FamilyMember[];
}

export function RecentPayments({ payments, members }: RecentPaymentsProps) {
  const getMemberName = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return 'Unknown Member';
    return `${member.firstname} ${member.lastname}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
      </div>
      <div className="space-y-4">
        {payments.slice(0, 5).map((payment) => (
          <div key={payment.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{getMemberName(payment.member_id)}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {payment.payment_date.toLocaleDateString()}
                </div>
                <span className="text-teal-600 font-medium">{payment.payment_method}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">₱{payment.amount}</p>
              <p className="text-xs text-gray-500 capitalize">{payment.status}</p>
            </div>
          </div>
        ))}
      </div>
      {payments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No recent payments</p>
        </div>
      )}
    </div>
  );
}
