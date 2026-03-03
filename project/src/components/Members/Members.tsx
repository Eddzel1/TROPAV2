import React from 'react';
import { Header } from '../Layout/Header';
import { MemberTable } from './MemberTable';
// TS server force refresh
import { MemberForm } from './MemberForm';
import { FamilyMember, Household, Location } from '../../types';
import { Plus, Search, Users, UserCheck, Shield, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface MembersProps {
  members: FamilyMember[];
  households: Household[];
  locations: Location[];
  onCreateMember: (member: Omit<FamilyMember, 'id' | 'created_date' | 'updated_date'>) => Promise<FamilyMember>;
  onUpdateMember: (id: string, updates: Partial<FamilyMember>) => Promise<FamilyMember>;
  onDeleteMember: (id: string) => Promise<void>;
  onMenuClick: () => void;
}

export function Members({ members, households, locations, onCreateMember, onUpdateMember, onDeleteMember, onMenuClick }: MembersProps) {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingMember, setEditingMember] = React.useState<FamilyMember | undefined>();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterSector, setFilterSector] = React.useState('');
  const [filterHousehold, setFilterHousehold] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  const filteredMembers = members.filter(member => {
    const fullName = `${member.firstname} ${member.middlename || ''} ${member.lastname}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      member.contact_number?.includes(searchTerm) ||
      member.lgu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.barangay.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = !filterSector || (member.sector || 'General').split(',').map(s => s.trim()).filter(Boolean).includes(filterSector);
    const matchesHousehold = !filterHousehold || member.household_id === filterHousehold;
    const matchesStatus = !filterStatus ||
      (filterStatus === 'member' && member.is_cooperative_member) ||
      (filterStatus === 'non-member' && !member.is_cooperative_member) ||
      (filterStatus === 'leader' && member.is_household_leader) ||
      (filterStatus === 'voter' && member.is_voter);
    return matchesSearch && matchesSector && matchesHousehold && matchesStatus;
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSector, filterHousehold, filterStatus]);

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
    const member = members.find(m => m.id === id);
    if (member?.is_household_leader) {
      const householdMembers = members.filter(m => m.household_id === member.household_id);
      if (householdMembers.length > 1) {
        const confirmDelete = window.confirm('This member is a household leader. Are you sure you want to continue?');
        if (!confirmDelete) return;
      }
    }
    if (window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      try { await onDeleteMember(id); }
      catch (error) { alert('Failed to delete member. Please try again.'); }
    }
  };

  const handleSave = async (memberData: Partial<FamilyMember>) => {
    try {
      if (editingMember) { await onUpdateMember(editingMember.id, memberData); }
      else { await onCreateMember(memberData as Omit<FamilyMember, 'id' | 'created_date' | 'updated_date'>); }
      setEditingMember(undefined);
      setIsFormOpen(false);
      alert('Member saved successfully!');
    } catch (error) { alert('Failed to save member. Please try again.'); }
  };

  const totalMembers = members.length;
  const cooperativeMembers = members.filter(m => m.is_cooperative_member).length;
  const householdLeaders = members.filter(m => m.is_household_leader).length;
  const registeredVoters = members.filter(m => m.is_voter).length;
  const uniqueSectors = [...new Set(members.flatMap(m => (m.sector || 'General').split(',').map(s => s.trim()).filter(Boolean)))].sort();
  const uniqueHouseholds = households.map(h => ({ id: h.id, name: h.household_name }));

  return (
    <div className="flex-1 bg-gray-50 min-h-0 overflow-auto">
      <Header title="Members" subtitle="Manage family members and cooperative membership" onMenuClick={onMenuClick} />
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total Members</p><p className="text-2xl font-bold text-gray-900">{totalMembers}</p></div><div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Cooperative Members</p><p className="text-2xl font-bold text-gray-900">{cooperativeMembers}</p><p className="text-xs text-gray-500">{totalMembers > 0 ? Math.round((cooperativeMembers / totalMembers) * 100) : 0}% of total</p></div><div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"><UserCheck className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Household Leaders</p><p className="text-2xl font-bold text-gray-900">{householdLeaders}</p></div><div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Registered Voters</p><p className="text-2xl font-bold text-gray-900">{registeredVoters}</p><p className="text-xs text-gray-500">{totalMembers > 0 ? Math.round((registeredVoters / totalMembers) * 100) : 0}% of total</p></div><div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center"><Calendar className="w-6 h-6 text-white" /></div></div></div>
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
        <div className="mb-4"><p className="text-sm lg:text-base text-gray-600">Showing {filteredMembers.length} matching out of {totalMembers} total members</p></div>
        <MemberTable members={paginatedMembers} onEdit={handleEdit} onDelete={handleDelete} />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> of <span className="font-medium">{filteredMembers.length}</span> members
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
