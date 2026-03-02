import React, { useState } from 'react';
import { Location } from '../../types';
import { X, Save, MapPin } from 'lucide-react';

interface LocationFormProps { location?: Location; isOpen: boolean; onClose: () => void; onSave: (location: Partial<Location>) => void; }

export function LocationForm({ location, isOpen, onClose, onSave }: LocationFormProps) {
  const [formData, setFormData] = useState({ lgu: location?.lgu || '', barangay: location?.barangay || '' });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); onClose(); };
  const handleClose = () => { setFormData({ lgu: location?.lgu || '', barangay: location?.barangay || '' }); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3"><div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center"><MapPin className="w-5 h-5 text-teal-600" /></div><h2 className="text-xl font-bold text-gray-900">{location ? 'Edit Location' : 'Add New Location'}</h2></div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">LGU (Local Government Unit) *</label><input type="text" required value={formData.lgu} onChange={e=>setFormData({...formData,lgu:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g., Valencia City, Malaybalay City" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Barangay *</label><input type="text" required value={formData.barangay} onChange={e=>setFormData({...formData,barangay:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g., Poblacion, San Carlos" /></div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={handleClose} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"><Save className="w-4 h-4" />{location ? 'Update Location' : 'Add Location'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
