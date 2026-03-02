import { useState } from 'react';
import { Header } from '../Layout/Header';
import { LocationTable } from './LocationTable';
import { LocationForm } from './LocationForm';
import { Location } from '../../types';
import { Plus, Search, MapPin, Building } from 'lucide-react';

interface LocationsProps { locations: Location[]; onCreateLocation: (location: Omit<Location, 'id' | 'created_date' | 'updated_date'>) => Promise<Location>; onUpdateLocation: (id: string, updates: Partial<Location>) => Promise<Location>; onDeleteLocation: (id: string) => Promise<void>; }

export function Locations({ locations, onCreateLocation, onUpdateLocation, onDeleteLocation }: LocationsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLGU, setFilterLGU] = useState('');

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.lgu.toLowerCase().includes(searchTerm.toLowerCase()) || location.barangay.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (!filterLGU || location.lgu === filterLGU);
  });

  const handleEdit = (location: Location) => { setEditingLocation(location); setIsFormOpen(true); };
  const handleDelete = async (id: string) => { if (window.confirm('Are you sure you want to delete this location?')) { try { await onDeleteLocation(id); } catch { alert('Failed to delete location.'); } } };
  const handleSave = async (locationData: Partial<Location>) => { try { if (editingLocation) { await onUpdateLocation(editingLocation.id, locationData); } else { await onCreateLocation(locationData as Omit<Location, 'id' | 'created_date' | 'updated_date'>); } setEditingLocation(undefined); } catch { alert('Failed to save location.'); } };

  const uniqueLGUs = [...new Set(locations.map(l => l.lgu))];

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Locations" subtitle="Manage LGUs and Barangays for household registration" />
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total LGUs</p><p className="text-2xl font-bold text-gray-900">{uniqueLGUs.length}</p></div><div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><Building className="w-6 h-6 text-white" /></div></div></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-600 mb-1">Total Barangays</p><p className="text-2xl font-bold text-gray-900">{locations.length}</p></div><div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center"><MapPin className="w-6 h-6 text-white" /></div></div></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search locations..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 w-full" /></div>
          <select value={filterLGU} onChange={e=>setFilterLGU(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"><option value="">All LGUs</option>{uniqueLGUs.map(lgu=>(<option key={lgu} value={lgu}>{lgu}</option>))}</select>
          <button onClick={()=>setIsFormOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"><Plus className="w-4 h-4" />Add Location</button>
        </div>
        <LocationTable locations={filteredLocations} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
      <LocationForm location={editingLocation} isOpen={isFormOpen} onClose={()=>{setIsFormOpen(false);setEditingLocation(undefined);}} onSave={handleSave} />
    </div>
  );
}
