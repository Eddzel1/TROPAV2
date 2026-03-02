import React from 'react';
import { User } from '../../types';
import { Edit, Trash2, Shield, User as UserIcon, Clock } from 'lucide-react';
import { formatDate } from '../../lib/utils';

interface UserTableProps { users: User[]; onEdit: (user: User) => void; onDelete: (id: string) => void; }

const roleColors = { admin: 'bg-red-100 text-red-700', collector: 'bg-blue-100 text-blue-700', user: 'bg-gray-100 text-gray-700' };
const roleIcons = { admin: Shield, collector: UserIcon, user: UserIcon };

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="text-left p-4 text-sm font-semibold text-gray-900">User</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Role</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Status</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Last Login</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Created</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th></tr></thead>
          <tbody>
            {users.map((user) => {
              const RoleIcon = roleIcons[user.role];
              return (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center"><UserIcon className="w-5 h-5 text-teal-600" /></div><div><p className="font-medium text-gray-900">{user.firstname} {user.lastname}</p><p className="text-sm text-gray-500">{user.email}</p></div></div></td>
                  <td className="p-4"><div className="flex items-center gap-2"><RoleIcon className="w-4 h-4" /><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>{user.role}</span></div></td>
                  <td className="p-4"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>{user.status}</span></td>
                  <td className="p-4"><div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="w-4 h-4" />{user.last_login ? formatDate(user.last_login) : 'Never'}</div></td>
                  <td className="p-4"><p className="text-sm text-gray-600">{formatDate(user.created_date)}</p></td>
                  <td className="p-4"><div className="flex items-center gap-2"><button onClick={()=>onEdit(user)} className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button><button onClick={()=>onDelete(user.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" disabled={user.role==='admin'&&users.filter(u=>u.role==='admin').length===1}><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (<div className="text-center py-12"><UserIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No users found</p></div>)}
    </div>
  );
}
