import React from 'react';
import { Location } from '../../types';
import { Edit, Trash2, MapPin } from 'lucide-react';
import { formatDate } from '../../lib/utils';

interface LocationTableProps { locations: Location[]; onEdit: (location: Location) => void; onDelete: (id: string) => void; }

export function LocationTable({ locations, onEdit, onDelete }: LocationTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100"><tr><th className="text-left p-4 text-sm font-semibold text-gray-900">LGU</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Barangay</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Created Date</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Created By</th><th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th></tr></thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center"><MapPin className="w-5 h-5 text-teal-600" /></div><p className="font-medium text-gray-900">{location.lgu}</p></div></td>
                <td className="p-4"><p className="text-gray-900">{location.barangay}</p></td>
                <td className="p-4"><p className="text-sm text-gray-600">{formatDate(location.created_date)}</p></td>
                <td className="p-4"><p className="text-sm text-gray-600">{location.created_by}</p></td>
                <td className="p-4"><div className="flex items-center gap-2"><button onClick={()=>onEdit(location)} className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button><button onClick={()=>onDelete(location.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {locations.length === 0 && (<div className="text-center py-12"><MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" /><p className="text-gray-500">No locations found</p></div>)}
    </div>
  );
}
