import { useState } from 'react';
import { Header } from '../Layout/Header';
import { UserTable } from './UserTable';
import { UserForm } from './UserForm';
import { LocationTable } from '../Locations/LocationTable';
import { LocationForm } from '../Locations/LocationForm';
import { User, Location } from '../../types';
import { Plus, Search, Shield, Users, MapPin, Building } from 'lucide-react';

interface SettingsProps {
  users: User[]; locations: Location[];
  onCreateUser: (user: Omit<User, 'id' | 'created_date' | 'updated_date'>) => Promise<User>;
  onUpdateUser: (id: string, updates: Partial<User>) => Promise<User>;
  onDeleteUser: (id: string) => Promise<void>;
  onCreateLocation: (location: Omit<Location, 'id' | 'created_date' | 'updated_date'>) => Promise<Location>;
  onUpdateLocation: (id: string, updates: Partial<Location>) => Promise<Location>;
  onDeleteLocation: (id: string) => Promise<void>;
  onMenuClick: () => void;
}

export function Settings({ users, locations, onCreateUser, onUpdateUser, onDeleteUser, onCreateLocation, onUpdateLocation, onDeleteLocation, onMenuClick }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('users');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [editingLocation, setEditingLocation] = useState<Location | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [filterLGU, setFilterLGU] = useState('');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) || user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (!filterRole || user.role === filterRole);
  });
  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.lgu.toLowerCase().includes(locationSearchTerm.toLowerCase()) || location.barangay.toLowerCase().includes(locationSearchTerm.toLowerCase());
    return matchesSearch && (!filterLGU || location.lgu === filterLGU);
  });

  const handleEdit = (user: User) => { setEditingUser(user); setIsFormOpen(true); };
  const handleDelete = async (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    if (userToDelete?.role === 'admin' && users.filter(u => u.role === 'admin').length === 1) { alert('Cannot delete the last admin user.'); return; }
    if (window.confirm('Are you sure you want to delete this user?')) { try { await onDeleteUser(id); } catch { alert('Failed to delete user.'); } }
  };
  const handleEditLocation = (location: Location) => { setEditingLocation(location); setIsFormOpen(true); };
  const handleDeleteLocation = async (id: string) => { if (window.confirm('Are you sure you want to delete this location?')) { try { await onDeleteLocation(id); } catch { alert('Failed to delete location.'); } } };
  const handleSaveLocation = async (locationData: Partial<Location>) => { try { if (editingLocation) { await onUpdateLocation(editingLocation.id, locationData); } else { await onCreateLocation(locationData as Omit<Location, 'id' | 'created_date' | 'updated_date'>); } setEditingLocation(undefined); } catch { alert('Failed to save location.'); } };
  const handleSave = async (userData: Partial<User>) => { try { if (editingUser) { await onUpdateUser(editingUser.id, userData); } else { await onCreateUser(userData as Omit<User, 'id' | 'created_date' | 'updated_date'>); } setEditingUser(undefined); } catch { alert('Failed to save user.'); } };

  const roleStats = { admin: users.filter(u => u.role === 'admin').length, collector: users.filter(u => u.role === 'collector').length, user: users.filter(u => u.role === 'user').length };
  const uniqueLGUs = [...new Set(locations.map(l => l.lgu))];

  return (
    <div className="flex-1 bg-gray-50 min-h-0 overflow-auto">
      <Header title="Settings" subtitle="Manage system users and administrators" onMenuClick={onMenuClick} />
      <div className="p-6">
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}><Users className="w-4 h-4 inline mr-2" />User Management</button>
          <button onClick={() => setActiveTab('locations')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'locations' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}><MapPin className="w-4 h-4 inline mr-2" />Location Management</button>
        </div>
        {activeTab === 'users' && (<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total Users</p><p className="text-2xl font-bold text-gray-900">{users.length}</p></div><div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Administrators</p><p className="text-2xl font-bold text-gray-900">{roleStats.admin}</p></div><div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Collectors</p><p className="text-2xl font-bold text-gray-900">{roleStats.collector}</p></div><div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Regular Users</p><p className="text-2xl font-bold text-gray-900">{roleStats.user}</p></div><div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div></div></div>
        </div>)}
        {activeTab === 'locations' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total LGUs</p><p className="text-2xl font-bold text-gray-900">{uniqueLGUs.length}</p></div><div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><Building className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total Barangays</p><p className="text-2xl font-bold text-gray-900">{locations.length}</p></div><div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center"><MapPin className="w-6 h-6 text-white" /></div></div></div>
        </div>)}
        {activeTab === 'users' && (<div className="flex flex-col sm:flex-row gap-4 mb-6"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 w-full" /></div><select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"><option value="">All Roles</option><option value="admin">Admin</option><option value="collector">Collector</option><option value="user">User</option></select><button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"><Plus className="w-4 h-4" />Add User</button></div>)}
        {activeTab === 'locations' && (<div className="flex flex-col sm:flex-row gap-4 mb-6"><div className="flex-1 relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search locations..." value={locationSearchTerm} onChange={e => setLocationSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 w-full" /></div><select value={filterLGU} onChange={e => setFilterLGU(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"><option value="">All LGUs</option>{uniqueLGUs.map(lgu => (<option key={lgu} value={lgu}>{lgu}</option>))}</select><button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"><Plus className="w-4 h-4" />Add Location</button></div>)}
        {activeTab === 'users' && <UserTable users={filteredUsers} onEdit={handleEdit} onDelete={handleDelete} />}
        {activeTab === 'locations' && <LocationTable locations={filteredLocations} onEdit={handleEditLocation} onDelete={handleDeleteLocation} />}
      </div>
      {activeTab === 'users' && <UserForm user={editingUser} isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingUser(undefined); }} onSave={handleSave} />}
      {activeTab === 'locations' && <LocationForm location={editingLocation} isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditingLocation(undefined); }} onSave={handleSaveLocation} />}
    </div>
  );
}
