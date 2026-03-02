import { FamilyMember } from '../../types';
import { Edit, Trash2, User, Phone, MapPin, Calendar, Shield } from 'lucide-react';

interface MemberTableProps {
  members: FamilyMember[];
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
}

const sectorColors: Record<string, string> = { 'Youth': 'bg-blue-100 text-blue-700', 'Student': 'bg-indigo-100 text-indigo-800', 'College Student': 'bg-indigo-100 text-indigo-800', 'PWD': 'bg-purple-100 text-purple-700', 'Senior Citizen': 'bg-orange-100 text-orange-700', 'LGBTQ+': 'bg-pink-100 text-pink-700', 'Indigenous People': 'bg-green-100 text-green-700', 'Solo Parent': 'bg-yellow-100 text-yellow-700', 'General': 'bg-gray-100 text-gray-700' };

export function MemberTable({ members, onEdit, onDelete }: MemberTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Mobile Card View */}
      <div className="block lg:hidden">
        {members.map((member) => (
          <div key={member.id} className="border-b border-gray-100 p-4 last:border-b-0">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">{member.profile_picture_url ? (<img src={member.profile_picture_url} alt={`${member.firstname} ${member.lastname}`} className="w-full h-full object-cover" />) : (<User className="w-6 h-6 text-teal-600" />)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{member.firstname} {member.middlename && `${member.middlename} `}{member.lastname}{member.extension && ` ${member.extension}`}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      {member.is_household_leader && (<div className="flex items-center gap-1"><Shield className="w-3 h-3" /><span>Leader</span></div>)}
                      {member.age && (<div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{member.age}y</span></div>)}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{member.lgu}, {member.barangay}</span></div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.sector?.split(',').map(s => s.trim()).filter(Boolean).map(sector => (
                        <span key={sector} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${sectorColors[sector] || 'bg-gray-100 text-gray-700'}`}>{sector}</span>
                      ))}
                      {member.is_cooperative_member && <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Member</span>}
                      {member.is_voter && <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Voter</span>}
                    </div>
                    {member.contact_number && <div className="flex items-center gap-2 mt-2 text-sm text-gray-600"><Phone className="w-3 h-3" /><a href={`tel:${member.contact_number}`} className="text-teal-600">{member.contact_number}</a></div>}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => onEdit(member)} className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(member.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {members.length === 0 && (<div className="text-center py-12"><User className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No members found</p></div>)}
      </div>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="text-left p-4 text-sm font-semibold text-gray-900">Member</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Location</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Sector</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Status</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Contact</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th></tr></thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">{member.profile_picture_url ? <img src={member.profile_picture_url} alt={`${member.firstname} ${member.lastname}`} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-teal-600" />}</div><div><p className="font-medium text-gray-900">{member.firstname} {member.middlename && `${member.middlename} `}{member.lastname}{member.extension && ` ${member.extension}`}</p><div className="flex items-center gap-2 text-sm text-gray-500">{member.is_household_leader && <div className="flex items-center gap-1"><Shield className="w-3 h-3" /><span>Leader</span></div>}{member.age && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{member.age} years old</span></div>}</div></div></div></td>
                <td className="p-4"><div className="flex items-center gap-2 text-sm text-gray-600"><MapPin className="w-4 h-4" /><div><p>{member.lgu}</p><p className="text-xs">{member.barangay}, {member.purok}</p></div></div></td>
                <td className="p-4"><div className="flex flex-wrap gap-1">{member.sector?.split(',').map(s => s.trim()).filter(Boolean).map(sector => (<span key={sector} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${sectorColors[sector] || 'bg-gray-100 text-gray-700'}`}>{sector}</span>))}</div></td>
                <td className="p-4"><div className="space-y-1"><div className="flex items-center gap-2"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${member.is_cooperative_member ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{member.is_cooperative_member ? 'Member' : 'Non-member'}</span></div>{member.is_voter && <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Voter</span>}</div></td>
                <td className="p-4">{member.contact_number ? <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4" />{member.contact_number}</div> : <span className="text-sm text-gray-400">No contact</span>}</td>
                <td className="p-4"><div className="flex items-center gap-2"><button onClick={() => onEdit(member)} className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button><button onClick={() => onDelete(member.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {members.length === 0 && (<div className="text-center py-12"><User className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No members found</p></div>)}
      </div>
    </div>
  );
}
