import { useState } from 'react';
import { Header } from '../Layout/Header';
import { UserTable } from './UserTable';
import { UserForm } from './UserForm';
import { LocationTable } from '../Locations/LocationTable';
import { LocationForm } from '../Locations/LocationForm';
import { User, Location, ContributionRate } from '../../types';
import { Plus, Search, Shield, Users, MapPin, Building, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface SettingsProps {
  users: User[];
  locations: Location[];
  contributionRates: ContributionRate[];
  onCreateContributionRate: (amount: number, effectiveFrom: string, notes?: string) => Promise<ContributionRate>;
  onCreateUser: (user: Omit<User, 'id' | 'created_date' | 'updated_date'>) => Promise<User>;
  onUpdateUser: (id: string, updates: Partial<User>) => Promise<User>;
  onDeleteUser: (id: string) => Promise<void>;
  onCreateLocation: (location: Omit<Location, 'id' | 'created_date' | 'updated_date'>) => Promise<Location>;
  onUpdateLocation: (id: string, updates: Partial<Location>) => Promise<Location>;
  onDeleteLocation: (id: string) => Promise<void>;
  onMenuClick: () => void;
}

export function Settings({
  users, locations, contributionRates, onCreateContributionRate,
  onCreateUser, onUpdateUser, onDeleteUser,
  onCreateLocation, onUpdateLocation, onDeleteLocation,
  onMenuClick
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState('users');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [editingLocation, setEditingLocation] = useState<Location | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [filterLGU, setFilterLGU] = useState('');

  // Contribution rate form state
  const [rateAmount, setRateAmount] = useState('');
  const [rateFrom, setRateFrom] = useState('');
  const [rateNotes, setRateNotes] = useState('');
  const [rateSaving, setRateSaving] = useState(false);
  const [rateError, setRateError] = useState('');
  const [rateSuccess, setRateSuccess] = useState('');

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

  const handleAddRate = async () => {
    setRateError('');
    setRateSuccess('');
    const amt = parseFloat(rateAmount);
    if (!rateAmount || isNaN(amt) || amt <= 0) { setRateError('Please enter a valid positive amount.'); return; }
    if (!rateFrom) { setRateError('Please select an effective date.'); return; }
    // Warn if same date already exists
    const existing = contributionRates.find(r =>
      new Date(r.effective_from).toISOString().slice(0, 10) === rateFrom
    );
    if (existing) { setRateError(`A rate already exists effective ${rateFrom}. Use a different date.`); return; }
    try {
      setRateSaving(true);
      await onCreateContributionRate(amt, rateFrom, rateNotes || undefined);
      setRateSuccess(`Rate ₱${amt} effective ${rateFrom} saved successfully.`);
      setRateAmount('');
      setRateFrom('');
      setRateNotes('');
    } catch {
      setRateError('Failed to save rate. You may not have admin permissions.');
    } finally {
      setRateSaving(false);
    }
  };

  const roleStats = { admin: users.filter(u => u.role === 'admin').length, collector: users.filter(u => u.role === 'collector').length, user: users.filter(u => u.role === 'user').length };
  const uniqueLGUs = [...new Set(locations.map(l => l.lgu))];

  // Current rate = last entry by effective_from
  const sortedRates = [...contributionRates].sort(
    (a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime()
  );
  const currentRate = sortedRates[0];

  return (
    <div className="flex-1 bg-gray-50 min-h-0 overflow-auto">
      <Header title="Settings" subtitle="Manage system users, locations, and contribution rates" onMenuClick={onMenuClick} />
      <div className="p-6">
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}><Users className="w-4 h-4 inline mr-2" />User Management</button>
          <button onClick={() => setActiveTab('locations')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'locations' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}><MapPin className="w-4 h-4 inline mr-2" />Location Management</button>
          <button onClick={() => setActiveTab('rates')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'rates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}><TrendingUp className="w-4 h-4 inline mr-2" />Contribution Rate</button>
        </div>

        {/* ── User tab ── */}
        {activeTab === 'users' && (<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total Users</p><p className="text-2xl font-bold text-gray-900">{users.length}</p></div><div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Administrators</p><p className="text-2xl font-bold text-gray-900">{roleStats.admin}</p></div><div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"><Shield className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Collectors</p><p className="text-2xl font-bold text-gray-900">{roleStats.collector}</p></div><div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Regular Users</p><p className="text-2xl font-bold text-gray-900">{roleStats.user}</p></div><div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div></div></div>
        </div>)}

        {/* ── Location tab ── */}
        {activeTab === 'locations' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total LGUs</p><p className="text-2xl font-bold text-gray-900">{uniqueLGUs.length}</p></div><div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><Building className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total Barangays</p><p className="text-2xl font-bold text-gray-900">{locations.length}</p></div><div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center"><MapPin className="w-6 h-6 text-white" /></div></div></div>
        </div>)}

        {/* ── Contribution Rate tab ── */}
        {activeTab === 'rates' && (
          <div className="space-y-6">
            {/* Current rate card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-6">
              <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-7 h-7 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Current Monthly Contribution</p>
                <p className="text-3xl font-bold text-teal-700">
                  ₱{currentRate ? currentRate.amount.toFixed(2) : '50.00'}
                  <span className="text-sm font-normal text-gray-400 ml-2">per member / month</span>
                </p>
                {currentRate && (
                  <p className="text-xs text-gray-400 mt-1">
                    Effective from {new Date(currentRate.effective_from).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {currentRate.notes && ` · ${currentRate.notes}`}
                  </p>
                )}
              </div>
            </div>

            {/* Add new rate form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Set New Rate</h3>
              <p className="text-sm text-gray-500 mb-4">
                Adding a new rate creates a new history entry. The old rate is preserved for all months before the new effective date — existing balances are not affected.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">New Amount (₱)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={rateAmount}
                    onChange={e => setRateAmount(e.target.value)}
                    placeholder="e.g. 75"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Effective From (1st of month)</label>
                  <input
                    type="date"
                    value={rateFrom}
                    onChange={e => setRateFrom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes (optional)</label>
                  <input
                    type="text"
                    value={rateNotes}
                    onChange={e => setRateNotes(e.target.value)}
                    placeholder="e.g. Annual increase"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
              {rateError && (
                <div className="flex items-center gap-2 text-red-600 text-sm mb-3 bg-red-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{rateError}
                </div>
              )}
              {rateSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm mb-3 bg-green-50 rounded-lg p-3">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />{rateSuccess}
                </div>
              )}
              <button
                onClick={handleAddRate}
                disabled={rateSaving}
                className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                {rateSaving ? 'Saving…' : 'Add Rate'}
              </button>
            </div>

            {/* Rate history table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-800">Rate History</h3>
                <p className="text-xs text-gray-400">Oldest rates shown first. Rates are never deleted — only new entries are added.</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Effective From</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Set By</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedRates.map((r, idx) => (
                    <tr key={r.id} className={idx === 0 ? 'bg-teal-50' : ''}>
                      <td className="px-6 py-3 font-medium">
                        {new Date(r.effective_from).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </td>
                      <td className="px-6 py-3 font-bold text-teal-700">₱{Number(r.amount).toFixed(2)}</td>
                      <td className="px-6 py-3 text-gray-500">{r.notes || '—'}</td>
                      <td className="px-6 py-3 text-gray-500">{r.created_by}</td>
                      <td className="px-6 py-3">
                        {idx === 0
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700"><CheckCircle className="w-3 h-3" />Current</span>
                          : <span className="text-xs text-gray-400">Historical</span>
                        }
                      </td>
                    </tr>
                  ))}
                  {contributionRates.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No rates configured yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
