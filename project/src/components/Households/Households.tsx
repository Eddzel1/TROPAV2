import { useState, useEffect } from 'react';
import { Header } from '../Layout/Header';
import { HouseholdTable } from './HouseholdTable';
import { HouseholdView } from './HouseholdView';
import { HouseholdForm } from './HouseholdForm';
import { Household, FamilyMember, Location } from '../../types';
import { Search, Info, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { BulkAddMemberForm } from '../Members/BulkAddMemberForm';

interface HouseholdsProps {
  households: Household[];
  members: FamilyMember[];
  locations: Location[];
  onCreateMember: (member: Omit<FamilyMember, 'id' | 'created_date' | 'updated_date'>) => Promise<FamilyMember>;
  onUpdateHousehold: (id: string, updates: Partial<Household>) => Promise<Household>;
  onDeleteHousehold: (id: string) => Promise<void>;
  onDeleteMember: (id: string) => Promise<void>;
  onMenuClick: () => void;
}

export function Households({ households, members, locations, onCreateMember, onDeleteHousehold, onDeleteMember, onUpdateHousehold, onMenuClick }: HouseholdsProps) {
  const [viewingHousehold, setViewingHousehold] = useState<Household | undefined>();
  const [editingHousehold, setEditingHousehold] = useState<Household | undefined>();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [addMemberHousehold, setAddMemberHousehold] = useState<Household | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLGU, setFilterLGU] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('');
  const [filterPuroks, setFilterPuroks] = useState<string[]>([]);
  const [purokSearch, setPurokSearch] = useState('');
  const [isPurokDropdownOpen, setIsPurokDropdownOpen] = useState(false);
  const [sortField, setSortField] = useState<keyof Household>('household_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkPurok, setBulkPurok] = useState('');
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);
  const itemsPerPage = 8;

  const filteredHouseholds = households.filter(household => {
    const matchesSearch = household.household_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      household.lgu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      household.barangay.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLGU = !filterLGU || household.lgu === filterLGU;
    const matchesBarangay = !filterBarangay || household.barangay === filterBarangay;
    const matchesPurok = filterPuroks.length === 0 || filterPuroks.includes(household.purok);
    return matchesSearch && matchesLGU && matchesBarangay && matchesPurok;
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

  const handleToggleFilterPurok = (purok: string) => {
    setFilterPuroks(prev => prev.includes(purok) ? prev.filter(p => p !== purok) : [...prev, purok]);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newIds = [...new Set([...selectedIds, ...paginatedHouseholds.map(h => h.id)])];
      setSelectedIds(newIds);
    } else {
      setSelectedIds(prev => prev.filter(id => !paginatedHouseholds.some(h => h.id === id)));
    }
  };

  const handleBulkUpdatePurok = async () => {
    if (!bulkPurok.trim() || selectedIds.length === 0) return;
    setIsUpdatingBulk(true);
    try {
      await Promise.all(selectedIds.map(id => {
        const household = households.find(h => h.id === id);
        if (household) {
          return onUpdateHousehold(id, { ...household, purok: bulkPurok });
        }
      }));
      setSelectedIds([]);
      setBulkPurok('');
      alert('Successfully updated purok for selected households!');
    } catch (error) {
      console.error('Failed to update bulk purok:', error);
      alert('Failed to update some households. Please try again.');
    } finally {
      setIsUpdatingBulk(false);
    }
  };

  const uniqueLGUs = [...new Set(households.map(h => h.lgu))].sort();
  const formBarangays = locations
    .filter(l => !filterLGU || l.lgu === filterLGU)
    .map(l => l.barangay)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();

  const formPuroks = households
    .filter(h => (!filterLGU || h.lgu === filterLGU) && (!filterBarangay || h.barangay === filterBarangay))
    .map(h => h.purok)
    .filter((value, index, self) => value && self.indexOf(value) === index)
    .sort();

  const filteredFormPuroks = formPuroks.filter(p => p.toLowerCase().includes(purokSearch.toLowerCase()));

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
  }, [searchTerm, filterLGU, filterBarangay, filterPuroks]);

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

  return (
    <div className="flex-1 bg-gray-50 min-h-0 overflow-auto">
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
          <div className="flex flex-wrap gap-4">
            <select value={filterLGU} onChange={(e) => { setFilterLGU(e.target.value); setFilterBarangay(''); setFilterPuroks([]); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-[150px]">
              <option value="">All LGUs</option>
              {uniqueLGUs.map(lgu => (<option key={lgu} value={lgu}>{lgu}</option>))}
            </select>
            <select
              value={filterBarangay}
              onChange={(e) => { setFilterBarangay(e.target.value); setFilterPuroks([]); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-w-[150px]"
            >
              <option value="">All Barangays</option>
              {formBarangays.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <div className="relative">
              <button
                onClick={() => setIsPurokDropdownOpen(!isPurokDropdownOpen)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-56 bg-white text-left flex items-center justify-between"
              >
                <span className="truncate mr-2 text-sm">
                  {filterPuroks.length === 0 ? 'All Puroks' : `${filterPuroks.length} Purok${filterPuroks.length > 1 ? 's' : ''} Selected`}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </button>
              
              {isPurokDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsPurokDropdownOpen(false)}></div>
                  <div className="absolute z-20 top-full left-0 mt-1 w-full min-w-[240px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 flex flex-col">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search purok..."
                          value={purokSearch}
                          onChange={(e) => setPurokSearch(e.target.value)}
                          className="pl-8 pr-2 py-1.5 w-full text-sm border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                    </div>
                    <div className="p-2 flex flex-col gap-1 overflow-y-auto">
                      {filteredFormPuroks.map(p => (
                        <label key={p} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            checked={filterPuroks.includes(p)}
                            onChange={() => handleToggleFilterPurok(p)}
                            className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                          <span className="truncate">{p}</span>
                        </label>
                      ))}
                      {filteredFormPuroks.length === 0 && (
                        <div className="p-2 text-sm text-gray-500 text-center">No puroks found</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-teal-800 font-medium">{selectedIds.length} household{selectedIds.length > 1 ? 's' : ''} selected</span>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input 
                type="text" 
                placeholder="New Purok..." 
                value={bulkPurok} 
                onChange={e => setBulkPurok(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm w-full sm:w-auto min-w-[200px]"
              />
              <button 
                onClick={handleBulkUpdatePurok}
                disabled={isUpdatingBulk || !bulkPurok.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors whitespace-nowrap"
              >
                {isUpdatingBulk ? 'Updating...' : 'Update Purok'}
              </button>
            </div>
          </div>
        )}

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
          selectedIds={selectedIds}
          onToggleSelection={handleToggleSelection}
          onSelectAll={handleSelectAll}
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
      {viewingHousehold && (
        <HouseholdView household={viewingHousehold} members={members.filter(m => m.household_id === viewingHousehold.id)}
          isOpen={!!viewingHousehold} onClose={() => setViewingHousehold(undefined)} onAddMember={() => { setViewingHousehold(undefined); handleAddMember(viewingHousehold); }} onEdit={() => { setViewingHousehold(undefined); setEditingHousehold(viewingHousehold); }} onDeleteMember={onDeleteMember} />
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
