
import { Household, FamilyMember } from '../../types';
import { X, Home, MapPin, Users, UserCheck, Phone, Calendar, Shield, User, UserPlus, Edit } from 'lucide-react';
import { formatDate } from '../../lib/utils';

interface HouseholdViewProps {
  household: Household;
  members: FamilyMember[];
  isOpen: boolean;
  onClose: () => void;
  onAddMember: () => void;
  onEdit: () => void;
}

const sectorColors: Record<string, string> = {
  'Youth': 'bg-blue-100 text-blue-700',
  'PWD': 'bg-purple-100 text-purple-700',
  'Senior Citizen': 'bg-orange-100 text-orange-700',
  'LGBTQ+': 'bg-pink-100 text-pink-700',
  'Indigenous People': 'bg-green-100 text-green-700',
  'Solo Parent': 'bg-yellow-100 text-yellow-700',
  'General': 'bg-gray-100 text-gray-700'
};

export function HouseholdView({ household, members, isOpen, onClose, onAddMember, onEdit }: HouseholdViewProps) {
  if (!isOpen) return null;
  const householdLeader = members.find(m => m.is_household_leader);
  const cooperativeMembers = members.filter(m => m.is_cooperative_member);
  const voters = members.filter(m => m.is_voter);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center"><Home className="w-6 h-6 text-teal-600" /></div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{household.household_name}</h2>
              <p className="text-sm text-gray-500">Household Details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Home className="w-5 h-5" />Household Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Household Name</label><p className="text-gray-900">{household.household_name}</p></div>
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${household.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{household.status}</span>
              </div>
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                <div className="flex items-center gap-2 text-gray-900"><MapPin className="w-4 h-4" /><span>{household.lgu}, {household.barangay}, {household.purok}</span></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-600 mb-1">Created Date</label><p className="text-gray-900">{formatDate(household.created_date)}</p></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4"><div className="flex items-center gap-3"><Users className="w-8 h-8 text-blue-600" /><div><p className="text-2xl font-bold text-blue-900">{members.length}</p><p className="text-sm text-blue-600">Total Members</p></div></div></div>
            <div className="bg-green-50 rounded-lg p-4"><div className="flex items-center gap-3"><UserCheck className="w-8 h-8 text-green-600" /><div><p className="text-2xl font-bold text-green-900">{cooperativeMembers.length}</p><p className="text-sm text-green-600">TROPA Members</p></div></div></div>
            <div className="bg-purple-50 rounded-lg p-4"><div className="flex items-center gap-3"><Shield className="w-8 h-8 text-purple-600" /><div><p className="text-2xl font-bold text-purple-900">{householdLeader ? 1 : 0}</p><p className="text-sm text-purple-600">Household Leader</p></div></div></div>
            <div className="bg-orange-50 rounded-lg p-4"><div className="flex items-center gap-3"><Calendar className="w-8 h-8 text-orange-600" /><div><p className="text-2xl font-bold text-orange-900">{voters.length}</p><p className="text-sm text-orange-600">Registered Voters</p></div></div></div>
          </div>
          {householdLeader && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2"><Shield className="w-5 h-5" />Household Leader</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                  {householdLeader.profile_picture_url ? <img src={householdLeader.profile_picture_url} alt="leader" className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{householdLeader.firstname} {householdLeader.middlename && `${householdLeader.middlename} `}{householdLeader.lastname} {householdLeader.extension && householdLeader.extension}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    {householdLeader.contact_number && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{householdLeader.contact_number}</div>}
                    {householdLeader.age && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{householdLeader.age} years old</div>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex flex-wrap gap-1">{(householdLeader.sector || 'General').split(',').map(s => s.trim()).filter(Boolean).map(sector => (<span key={sector} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${sectorColors[sector] || 'bg-gray-100 text-gray-700'}`}>{sector}</span>))}</div>
                  {householdLeader.is_cooperative_member && <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">TROPA Member</span>}
                  {householdLeader.is_voter && <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Voter</span>}
                </div>
              </div>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users className="w-5 h-5" />Family Members ({members.filter(m => !m.is_household_leader).length})</h3>
            <div className="space-y-3">
              {members.filter(member => !member.is_household_leader).map((member) => (
                <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                      {member.profile_picture_url ? <img src={member.profile_picture_url} alt="member" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-teal-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member.firstname} {member.middlename && `${member.middlename} `}{member.lastname} {member.extension && member.extension}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        {member.contact_number && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{member.contact_number}</div>}
                        {member.age && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{member.age} years old</div>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex flex-wrap gap-1">{(member.sector || 'General').split(',').map(s => s.trim()).filter(Boolean).map(sector => (<span key={sector} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${sectorColors[sector] || 'bg-gray-100 text-gray-700'}`}>{sector}</span>))}</div>
                      {member.is_cooperative_member && <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">TROPA Member</span>}
                      {member.is_voter && <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Voter</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {members.filter(m => !m.is_household_leader).length === 0 && (
              <div className="text-center py-8 text-gray-500"><Users className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No other family members</p></div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onEdit} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2">
              <Edit className="w-4 h-4" /> Edit Household
            </button>
            <button onClick={onAddMember} className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add Member
            </button>
            <button onClick={onClose} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
