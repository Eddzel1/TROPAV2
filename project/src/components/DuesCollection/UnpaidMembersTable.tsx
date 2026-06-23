import { useState } from 'react';
import { FamilyMember, Household, DuesPayment } from '../../types';
import { User, AlertCircle, CreditCard, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ITEMS_PER_PAGE = 15;

export function UnpaidMembersTable({ members, households, payments, filterMonth, filterLGU, filterBarangay, onPay }: UnpaidMembersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const currentMonth = filterMonth || new Date().toISOString().slice(0, 7);
  const unpaidMembers = members.filter(m => m.is_cooperative_member).filter(member => {
    const household = households.find(h => h.id === member.household_id);
    if (filterLGU && household?.lgu !== filterLGU) return false;
    if (filterBarangay && household?.barangay !== filterBarangay) return false;
    const memberPayments = payments.filter(p => p.member_id === member.id);
    const outstanding = getOutstandingMonths(member.membership_date, memberPayments, currentMonth);
    return outstanding.includes(currentMonth);
  });

  const totalPages = Math.ceil(unpaidMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = unpaidMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 whenever filters change
  // (handled by key prop on the component in parent)
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Scroll to top of table
      document.getElementById('unpaid-table-top')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const getHouseholdName = (householdId: string) => { const household = households.find(h => h.id === householdId); return household?.household_name || 'Unknown Household'; };
  const getHouseholdLocation = (householdId: string) => { const household = households.find(h => h.id === householdId); return household ? `${household.barangay}, ${household.lgu}` : ''; };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" id="unpaid-table-top">
      <div className="p-4 border-b border-gray-100 bg-amber-50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Showing {unpaidMembers.length} unpaid members for {formatMonthName(currentMonth)}</span>
            {filterLGU && <span className="text-sm border-l border-amber-200 pl-2 ml-2">LGU: {filterLGU}</span>}
            {filterBarangay && <span className="text-sm border-l border-amber-200 pl-2 ml-2">Brgy: {filterBarangay}</span>}
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-amber-700 font-medium bg-amber-100 px-2 py-1 rounded-full">
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
        <p className="text-sm text-amber-600 mt-1 ml-7">Potential Collection: <span className="font-bold">{formatCurrency(unpaidMembers.length * 50)}</span></p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr><th className="text-left p-4 text-sm font-semibold text-gray-900">Member</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Location</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Contact</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Status</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Action</th></tr>
          </thead>
          <tbody>
            {paginatedMembers.map((member) => (
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

      {unpaidMembers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><DollarSign className="w-6 h-6 text-green-600" /></div>
          <p className="text-gray-900 font-medium">All Clear!</p>
          <p className="text-gray-500">No unpaid members found for {formatMonthName(currentMonth)}</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, unpaidMembers.length)}</span> of <span className="font-medium">{unpaidMembers.length}</span> unpaid members
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                <button
                  key={`${page}-${index}`}
                  onClick={() => typeof page === 'number' ? handlePageChange(page) : null}
                  disabled={page === '...'}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === '...'
                      ? 'cursor-default text-gray-500'
                      : currentPage === page
                        ? 'bg-teal-600 text-white border border-teal-600'
                        : 'border border-gray-300 text-gray-700 hover:bg-white'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
