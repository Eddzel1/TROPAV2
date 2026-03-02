import React, { useState } from 'react';
import { User } from '../../types';
import { X, Save, Eye, EyeOff } from 'lucide-react';

interface UserFormProps { user?: User; isOpen: boolean; onClose: () => void; onSave: (user: Partial<User>) => void; }

const availablePermissions = [
  { id: 'all', label: 'All Permissions', description: 'Full system access' },
  { id: 'view_dashboard', label: 'View Dashboard', description: 'Access to dashboard statistics' },
  { id: 'manage_households', label: 'Manage Households', description: 'Add, edit, delete households' },
  { id: 'view_households', label: 'View Households', description: 'View household information' },
  { id: 'manage_members', label: 'Manage Members', description: 'Add, edit, delete members' },
  { id: 'view_members', label: 'View Members', description: 'View member information' },
  { id: 'dues_collection', label: 'Dues Collection', description: 'Record and manage payments' },
  { id: 'view_reports', label: 'View Reports', description: 'Access to reports and analytics' },
  { id: 'manage_locations', label: 'Manage Locations', description: 'Add, edit locations' },
  { id: 'user_management', label: 'User Management', description: 'Manage system users' },
];

export function UserForm({ user, isOpen, onClose, onSave }: UserFormProps) {
  const [formData, setFormData] = useState({ email: user?.email || '', firstname: user?.firstname || '', lastname: user?.lastname || '', role: (user?.role || 'user') as 'admin' | 'user' | 'collector', status: (user?.status || 'active') as 'active' | 'inactive', permissions: user?.permissions || [], password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const getRolePermissions = (role: string) => { switch (role) { case 'admin': return ['all']; case 'collector': return ['view_dashboard', 'view_households', 'view_members', 'dues_collection', 'view_reports']; default: return ['view_dashboard', 'view_reports']; } };

  const handleRoleChange = (role: 'admin' | 'user' | 'collector') => { setFormData({ ...formData, role, permissions: getRolePermissions(role) }); };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (permissionId === 'all') { setFormData({ ...formData, permissions: checked ? ['all'] : [] }); }
    else { const newPermissions = checked ? [...formData.permissions.filter(p => p !== 'all'), permissionId] : formData.permissions.filter(p => p !== permissionId); setFormData({ ...formData, permissions: newPermissions }); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = formData.password ? formData : (() => { const { password, ...rest } = formData; return rest; })();
    onSave(userData); onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{user ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label><input type="text" required value={formData.firstname} onChange={e=>setFormData({...formData,firstname:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Enter first name" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label><input type="text" required value={formData.lastname} onChange={e=>setFormData({...formData,lastname:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Enter last name" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label><input type="email" required value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${!user?'border-gray-300':'border-gray-200 bg-gray-50'}`} disabled={!!user} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Password {user ? '' : '*'}</label><div className="relative"><input type={showPassword?'text':'password'} required={!user} value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})} className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder={user?'Leave blank to keep current password':'Enter password'} /><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Role *</label><select value={formData.role} onChange={e=>handleRoleChange(e.target.value as 'admin'|'user'|'collector')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"><option value="user">User</option><option value="collector">Collector</option><option value="admin">Admin</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Status</label><select value={formData.status} onChange={e=>setFormData({...formData,status:e.target.value as 'active'|'inactive'})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label><div className="space-y-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">{availablePermissions.map(permission=>(<div key={permission.id} className="flex items-start gap-3"><input type="checkbox" id={permission.id} checked={formData.permissions.includes(permission.id)||formData.permissions.includes('all')} onChange={e=>handlePermissionChange(permission.id,e.target.checked)} disabled={formData.permissions.includes('all')&&permission.id!=='all'} className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500" /><div className="flex-1"><label htmlFor={permission.id} className="text-sm font-medium text-gray-900 cursor-pointer">{permission.label}</label><p className="text-xs text-gray-500">{permission.description}</p></div></div>))}</div></div>
          <div className="flex gap-3 pt-4"><button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button><button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"><Save className="w-4 h-4" />{user?'Update User':'Create User'}</button></div>
        </form>
      </div>
    </div>
  );
}
