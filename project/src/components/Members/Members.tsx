import React from 'react';
import { Header } from '../Layout/Header';
import { MemberTable } from './MemberTable';
// TS server force refresh
import { MemberForm } from './MemberForm';
import { FamilyMember, Household, Location } from '../../types';
import { Plus, Search, Users, UserCheck, Shield, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFamilyMembersPaginated, useDashboardStats } from '../../hooks/useSupabase';
import { supabaseHelpers } from '../../lib/supabase';

interface MembersProps {
  members: FamilyMember[];
  households: Household[];
  locations: Location[];
  onCreateMember: (member: Omit<FamilyMember, 'id' | 'created_date' | 'updated_date'>) => Promise<FamilyMember>;
  onUpdateMember: (id: string, updates: Partial<FamilyMember>) => Promise<FamilyMember>;
  onDeleteMember: (id: string) => Promise<void>;
  onMenuClick: () => void;
}

export function Members({ households, locations, onMenuClick }: Omit<MembersProps, 'members' | 'onCreateMember' | 'onUpdateMember' | 'onDeleteMember'>) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<FamilyMember | undefined>();
  const [filterHousehold, setFilterHousehold] = React.useState('');

  const { stats } = useDashboardStats();

  const {
    members: paginatedMembers,
    count: filteredCount,
    page: currentPage,
    setPage: setCurrentPage,
    limit: itemsPerPage,
    searchTerm,
    setSearchTerm,
    filterSector,
    setFilterSector,
    filterStatus,
    setFilterStatus,
    refetch: refetchPaginated
  } = useFamilyMembersPaginated(filterHousehold || undefined);

  const totalPages = Math.ceil(filteredCount / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
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

  const handleEdit = (member: FamilyMember) => { setEditingMember(member); setIsFormOpen(true); };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      try { await supabaseHelpers.deleteFamilyMember(id); refetchPaginated(); }
      catch (error) { alert('Failed to delete member. Please try again.'); }
    }
  };

  const handleSave = async (memberData: Partial<FamilyMember>) => {
    try {
      const payload = {
        ...memberData,
        membership_date: (memberData as any).membership_date?.toISOString?.() ?? memberData.membership_date,
        birth_date: (memberData as any).birth_date?.toISOString?.() ?? memberData.birth_date
      };
      if (editingMember) {
        await supabaseHelpers.updateFamilyMember(editingMember.id, payload as any);
      } else {
        await supabaseHelpers.createFamilyMember(payload as any);
      }
      setEditingMember(undefined);
      setIsFormOpen(false);
      refetchPaginated();
      alert('Member saved successfully!');
    } catch (error) { alert('Failed to save member. Please try again.'); }
  };

  const uniqueSectors = [...new Set(paginatedMembers.flatMap(m => (m.sector || 'General').split(',').map(s => s.trim()).filter(Boolean)))].sort();
  const uniqueHouseholds = households.map(h => ({ id: h.id, name: h.household_name }));

  return (
    <div className="flex-1 bg-gray-50 min-h-0 overflow-auto">
      <Header title="Members" subtitle="Manage family members and cooperative membership" onMenuClick={onMenuClick} />
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total Members</p><p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p></div><div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Cooperative Members</p><p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p><p className="text-xs text-gray-500">{stats.totalMembers > 0 ? Math.round((stats.activeMembers / stats.totalMembers) * 100) : 0}% of total</p></div><div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"><UserCheck className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Household Leaders</p><p className="text-2xl font-bold text-gray-900">{stats.totalLeaders}</p></div><div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Registered Voters</p><p className="text-2xl font-bold text-gray-900">{stats.totalVoters}</p><p className="text-xs text-gray-500">{stats.totalMembers > 0 ? Math.round((stats.totalVoters / stats.totalMembers) * 100) : 0}% of total</p></div><div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center"><Calendar className="w-6 h-6 text-white" /></div></div></div>
        </div>
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search members by name, contact, or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full text-base lg:text-sm" /></div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select value={filterSector} onChange={(e) => setFilterSector(e.target.value)} className="px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base lg:text-sm"><option value="">All Sectors</option>{uniqueSectors.map(sector => (<option key={sector} value={sector}>{sector}</option>))}</select>
            <select value={filterHousehold} onChange={(e) => setFilterHousehold(e.target.value)} className="px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base lg:text-sm"><option value="">All Households</option>{uniqueHouseholds.map(household => (<option key={household.id} value={household.id}>{household.name}</option>))}</select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-3 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base lg:text-sm"><option value="">All Status</option><option value="member">Cooperative Members</option><option value="non-member">Non-members</option><option value="leader">Household Leaders</option><option value="voter">Registered Voters</option></select>
            <button onClick={() => setIsFormOpen(true)} className="flex items-center justify-center gap-2 px-4 py-3 lg:py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg transition-colors touch-manipulation text-base lg:text-sm font-medium"><Plus className="w-4 h-4" />Add Member</button>
          </div>
        </div>
        <div className="mb-4"><p className="text-sm lg:text-base text-gray-600">Showing {filteredCount} matching out of {stats.totalMembers} total members</p></div>
        <MemberTable members={paginatedMembers} onEdit={handleEdit} onDelete={async (id) => { await handleDelete(id); refetchPaginated(); }} />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredCount)}</span> of <span className="font-medium">{filteredCount}</span> members
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  <button
                    key={`${page}-${index}`}
                    onClick={() => typeof page === 'number' ? setCurrentPage(page) : null}
                    disabled={page === '...'}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === '...'
                        ? 'cursor-default text-gray-500'
                        : currentPage === page
                          ? 'bg-teal-600 text-white border border-teal-600'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      <MemberForm member={editingMember} households={households} locations={locations} isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingMember(undefined); }} onSave={handleSave} />
    </div>
  );
}
