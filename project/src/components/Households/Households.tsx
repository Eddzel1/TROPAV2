import { useState, useEffect } from 'react';
import { Header } from '../Layout/Header';
import { HouseholdTable } from './HouseholdTable';
import { HouseholdView } from './HouseholdView';
import { HouseholdForm } from './HouseholdForm';
import { Household, FamilyMember, Location } from '../../types';
import { Search, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { BulkAddMemberForm } from '../Members/BulkAddMemberForm';

interface HouseholdsProps {
  households: Household[];
  members: FamilyMember[];
  locations: Location[];
  onCreateMember: (member: Omit<FamilyMember, 'id' | 'created_date' | 'updated_date'>) => Promise<FamilyMember>;
  onUpdateHousehold: (id: string, updates: Partial<Household>) => Promise<Household>;
  onDeleteHousehold: (id: string) => Promise<void>;
  onMenuClick: () => void;
}

export function Households({ households, members, locations, onCreateMember, onDeleteHousehold, onUpdateHousehold, onMenuClick }: HouseholdsProps) {
  const [viewingHousehold, setViewingHousehold] = useState<Household | undefined>();
  const [editingHousehold, setEditingHousehold] = useState<Household | undefined>();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [addMemberHousehold, setAddMemberHousehold] = useState<Household | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLGU, setFilterLGU] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('');
  const [sortField, setSortField] = useState<keyof Household>('household_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredHouseholds = households.filter(household => {
    const matchesSearch = household.household_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      household.lgu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      household.barangay.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLGU = !filterLGU || household.lgu === filterLGU;
    const matchesBarangay = !filterBarangay || household.barangay === filterBarangay;
    return matchesSearch && matchesLGU && matchesBarangay;
  }).sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(filteredHouseholds.length / itemsPerPage);
  const paginatedHouseholds = filteredHouseholds.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this household?')) {
      try { await onDeleteHousehold(id); }
      catch (error) { alert('Failed to delete household. Please try again.'); }
    }
  };

  const handleAddMember = (household: Household) => {
    setAddMemberHousehold(household);
    setIsAddMemberOpen(true);
  };

  const handleSaveBulkMembers = async (membersToSave: Partial<FamilyMember>[]) => {
    try {
      await Promise.all(membersToSave.map(memberData =>
        onCreateMember(memberData as Omit<FamilyMember, 'id' | 'created_date' | 'updated_date'>)
      ));
      setIsAddMemberOpen(false);
      setAddMemberHousehold(undefined);
      alert('Members added to household successfully!');
    } catch (error) {
      console.error('Failed to save bulk members:', error);
      alert('Failed to save some members. Please try again.');
    }
  };

  const uniqueLGUs = [...new Set(households.map(h => h.lgu))].sort();
  const formBarangays = locations
    .filter(l => !filterLGU || l.lgu === filterLGU)
    .map(l => l.barangay)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();

  const handleSort = (field: keyof Household) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterLGU, filterBarangay]);

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Households" subtitle="View and manage registered households" onMenuClick={onMenuClick} />
      <div className="p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">How to Add New Households</h3>
              <p className="text-sm text-blue-700">Households are automatically created when you add a new member and designate them as a "Household Leader" in the Members section. Go to <strong>Members &rarr; Add Member</strong> and check the "Household Leader" option to create a new household.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search households..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full" />
          </div>
          <div className="flex gap-4">
            <select value={filterLGU} onChange={(e) => { setFilterLGU(e.target.value); setFilterBarangay(''); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-[150px]">
              <option value="">All LGUs</option>
              {uniqueLGUs.map(lgu => (<option key={lgu} value={lgu}>{lgu}</option>))}
            </select>
            <select
              value={filterBarangay}
              onChange={(e) => setFilterBarangay(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-[150px]"
            >
              <option value="">All Barangays</option>
              {formBarangays.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
        <HouseholdTable
          households={paginatedHouseholds}
          members={members}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          onView={setViewingHousehold}
          onEdit={setEditingHousehold}
          onDelete={handleDelete}
          onAddMember={handleAddMember}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredHouseholds.length)}</span> of <span className="font-medium">{filteredHouseholds.length}</span> households
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === page
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
      {viewingHousehold && (
        <HouseholdView household={viewingHousehold} members={members.filter(m => m.household_id === viewingHousehold.id)}
          isOpen={!!viewingHousehold} onClose={() => setViewingHousehold(undefined)} onAddMember={() => { setViewingHousehold(undefined); handleAddMember(viewingHousehold); }} onEdit={() => { setViewingHousehold(undefined); setEditingHousehold(viewingHousehold); }} />
      )}

      {addMemberHousehold && (
        <BulkAddMemberForm
          household={addMemberHousehold}
          isOpen={isAddMemberOpen}
          onClose={() => { setIsAddMemberOpen(false); setAddMemberHousehold(undefined); }}
          onSave={handleSaveBulkMembers}
        />
      )}

      {editingHousehold && (
        <HouseholdForm
          household={editingHousehold}
          locations={locations}
          isOpen={!!editingHousehold}
          onClose={() => setEditingHousehold(undefined)}
          onSave={onUpdateHousehold}
        />
      )}
    </div>
  );
}
