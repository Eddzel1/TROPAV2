import { useState } from 'react';
import { Header } from '../Layout/Header';
import { HouseholdTable } from './HouseholdTable';
import { HouseholdView } from './HouseholdView';
import { Household, FamilyMember } from '../../types';
import { Search, Info } from 'lucide-react';
import { BulkAddMemberForm } from '../Members/BulkAddMemberForm';
import { Location } from '../../types';

interface HouseholdsProps {
  households: Household[];
  members: FamilyMember[];
  locations: Location[];
  onCreateMember: (member: Omit<FamilyMember, 'id' | 'created_date' | 'updated_date'>) => Promise<FamilyMember>;
  onUpdateHousehold: (id: string, updates: Partial<Household>) => Promise<Household>;
  onDeleteHousehold: (id: string) => Promise<void>;
  onMenuClick: () => void;
}

export function Households({ households, members, onCreateMember, onDeleteHousehold, onMenuClick }: HouseholdsProps) {
  const [viewingHousehold, setViewingHousehold] = useState<Household | undefined>();
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [addMemberHousehold, setAddMemberHousehold] = useState<Household | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLGU, setFilterLGU] = useState('');

  const filteredHouseholds = households.filter(household => {
    const matchesSearch = household.household_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      household.lgu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      household.barangay.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterLGU || household.lgu === filterLGU;
    return matchesSearch && matchesFilter;
  });

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

  const uniqueLGUs = [...new Set(households.map(h => h.lgu))];

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
          <select value={filterLGU} onChange={(e) => setFilterLGU(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option value="">All LGUs</option>
            {uniqueLGUs.map(lgu => (<option key={lgu} value={lgu}>{lgu}</option>))}
          </select>
        </div>
        <HouseholdTable households={filteredHouseholds} members={members} onView={setViewingHousehold} onDelete={handleDelete} onAddMember={handleAddMember} />
      </div>
      {viewingHousehold && (
        <HouseholdView household={viewingHousehold} members={members.filter(m => m.household_id === viewingHousehold.id)}
          isOpen={!!viewingHousehold} onClose={() => setViewingHousehold(undefined)} onAddMember={() => { setViewingHousehold(undefined); handleAddMember(viewingHousehold); }} />
      )}

      {addMemberHousehold && (
        <BulkAddMemberForm
          household={addMemberHousehold}
          isOpen={isAddMemberOpen}
          onClose={() => { setIsAddMemberOpen(false); setAddMemberHousehold(undefined); }}
          onSave={handleSaveBulkMembers}
        />
      )}
    </div>
  );
}
