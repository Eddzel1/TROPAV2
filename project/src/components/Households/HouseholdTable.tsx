import { Household, FamilyMember } from '../../types';
import { Trash2, Users, MapPin, Eye, UserPlus } from 'lucide-react';

interface HouseholdTableProps {
  households: Household[];
  members: FamilyMember[];
  onView: (household: Household) => void;
  onDelete: (id: string) => void;
  onAddMember: (household: Household) => void;
}

export function HouseholdTable({ households, members, onView, onDelete, onAddMember }: HouseholdTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Household Name</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Location</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Members</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Status</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {households.map((household) => (
              <tr key={household.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-teal-600" />
                    </div>
                    <p className="font-medium text-gray-900">{household.household_name}</p>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <div>
                      <p>{household.lgu}</p>
                      <p className="text-xs">{household.barangay}, {household.purok}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{members.filter(m => m.household_id === household.id).length} total</p>
                    <p className="text-green-600">{members.filter(m => m.household_id === household.id && m.is_cooperative_member).length} active</p>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${household.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {household.status}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onAddMember(household)} className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" title="Add Member">
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button onClick={() => onView(household)} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(household.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {households.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No households found</p>
        </div>
      )}
    </div>
  );
}
