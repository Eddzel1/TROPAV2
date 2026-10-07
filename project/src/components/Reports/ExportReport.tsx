import { useState } from 'react';
import { Household, FamilyMember, Location } from '../../types';
import { Download, FileText, Users, MapPin, Check } from 'lucide-react';

interface ExportReportProps { households: Household[]; members: FamilyMember[]; locations: Location[]; }

export function ExportReport({ households, members, locations }: ExportReportProps) {
  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const exportOptions = [
    { id: 'households', title: 'Households Report', description: 'Complete household information including location and member counts', icon: Users, count: households.length },
    { id: 'members', title: 'Members Report', description: 'Detailed member information including demographics and membership status', icon: Users, count: members.length },
    { id: 'cooperative-members', title: 'TROPA Members Only', description: 'Only members who are part of the cooperative', icon: Users, count: members.filter(m => m.is_cooperative_member).length },
    { id: 'locations', title: 'Locations Report', description: 'List of all LGUs and barangays in the system', icon: MapPin, count: locations.length },
    { id: 'summary', title: 'Summary Report', description: 'Statistical summary of all data', icon: FileText, count: 1 },
  ];

  const handleExportToggle = (exportId: string) => { setSelectedExports(prev => prev.includes(exportId) ? prev.filter(id => id !== exportId) : [...prev, exportId]); };

  const generateCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [headers.join(','), ...data.map(row => headers.map(header => { const value = row[header]; if (value instanceof Date) return `"${value.toISOString().split('T')[0]}"`; if (typeof value === 'object' && value !== null) return `"${JSON.stringify(value).replace(/"/g, '""')}"`; if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) return `"${value.replace(/"/g, '""')}"`; return value || ''; }).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${filename}.csv`; link.click();
  };
  const generateJSON = (data: unknown[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${filename}.json`; link.click();
  };
  const exportData = (data: Record<string, unknown>[], filename: string) => { if (exportFormat === 'csv') { generateCSV(data, filename); } else { generateJSON(data, filename); } };

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Pre-compute maps for O(1) lookups
    const householdsMap = new Map<string, Household>();
    households.forEach(h => householdsMap.set(h.id, h));
    
    const membersMap = new Map<string, FamilyMember>();
    members.forEach(m => membersMap.set(m.id, m));
    
    selectedExports.forEach(exportId => {
      switch (exportId) {
        case 'households': exportData(households.map(h => {
          const hMembers = members.filter(m => m.household_id === h.id);
          return { household_name: h.household_name, lgu: h.lgu, barangay: h.barangay, purok: h.purok, total_members: hMembers.length, active_members: hMembers.filter(m => m.is_cooperative_member).length, status: h.status, created_date: h.created_date };
        }), `households-${timestamp}`); break;
        case 'members': exportData(members.map(m => { const hh = m.household_id ? householdsMap.get(m.household_id) : undefined; return { lastname: m.lastname, firstname: m.firstname, middlename: m.middlename || '', extension: m.extension || '', household: hh?.household_name || '', lgu: m.lgu, barangay: m.barangay, purok: m.purok, sector: m.sector, age: m.age || '', birth_date: m.birth_date || '', contact_number: m.contact_number || '', is_voter: m.is_voter ? 'Yes' : 'No', voter_barangay: m.voter_barangay || '', is_cooperative_member: m.is_cooperative_member ? 'Yes' : 'No', is_household_leader: m.is_household_leader ? 'Yes' : 'No', membership_date: m.membership_date || '', created_date: m.created_date }; }), `members-${timestamp}`); break;
        case 'cooperative-members': exportData(members.filter(m => m.is_cooperative_member).map(m => { const hh = m.household_id ? householdsMap.get(m.household_id) : undefined; return { lastname: m.lastname, firstname: m.firstname, middlename: m.middlename || '', extension: m.extension || '', household: hh?.household_name || '', lgu: m.lgu, barangay: m.barangay, purok: m.purok, sector: m.sector, age: m.age || '', contact_number: m.contact_number || '', voter_barangay: m.voter_barangay || '', membership_date: m.membership_date || '', is_household_leader: m.is_household_leader ? 'Yes' : 'No' }; }), `tropa-members-${timestamp}`); break;

        case 'locations': exportData(locations.map(l => ({ lgu: l.lgu, barangay: l.barangay, created_date: l.created_date, created_by: l.created_by })), `locations-${timestamp}`); break;
        case 'summary': exportData([{ report_date: new Date().toISOString().split('T')[0], total_households: households.length, active_households: households.filter(h => h.status === 'active').length, total_members: members.length, cooperative_members: members.filter(m => m.is_cooperative_member).length, registered_voters: members.filter(m => m.is_voter).length, household_leaders: members.filter(m => m.is_household_leader).length, total_lgus: new Set(locations.map(l => l.lgu)).size, total_barangays: locations.length, active_lgus: new Set(households.map(h => h.lgu)).size, active_barangays: new Set(households.map(h => `${h.lgu}-${h.barangay}`)).size }], `summary-${timestamp}`); break;
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Download className="w-5 h-5" />Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{exportOptions.map(option => { const Icon = option.icon; const isSelected = selectedExports.includes(option.id); return (<div key={option.id} onClick={() => handleExportToggle(option.id)} className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}><div className="flex items-start gap-3"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-teal-500' : 'bg-gray-100'}`}>{isSelected ? <Check className="w-5 h-5 text-white" /> : <Icon className="w-5 h-5 text-gray-600" />}</div><div className="flex-1"><h4 className="font-semibold text-gray-900 mb-1">{option.title}</h4><p className="text-sm text-gray-600 mb-2">{option.description}</p><p className="text-xs text-gray-500">{option.count} records</p></div></div></div>); })}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Settings</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label><div className="flex gap-4"><label className="flex items-center"><input type="radio" value="csv" checked={exportFormat === 'csv'} onChange={e => setExportFormat(e.target.value as 'csv')} className="mr-2" />CSV (Excel compatible)</label><label className="flex items-center"><input type="radio" value="json" checked={exportFormat === 'json'} onChange={e => setExportFormat(e.target.value as 'json')} className="mr-2" />JSON (Developer friendly)</label></div></div>
        </div>
      </div>
      {selectedExports.length > 0 && (<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"><h3 className="text-lg font-semibold text-gray-900 mb-4">Export Summary</h3><div className="space-y-2 mb-4"><p className="text-sm text-gray-600"><strong>Selected Reports:</strong> {selectedExports.length}</p><p className="text-sm text-gray-600"><strong>Format:</strong> {exportFormat.toUpperCase()}</p></div><div className="flex flex-wrap gap-2 mb-4">{selectedExports.map(id => { const opt = exportOptions.find(o => o.id === id); return (<span key={id} className="inline-flex px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-full">{opt?.title}</span>); })}</div><button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"><Download className="w-5 h-5" />Export Selected Reports</button></div>)}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4"><h4 className="font-semibold text-blue-900 mb-2">Export Instructions</h4><ul className="text-sm text-blue-700 space-y-1"><li>• Select one or more reports to export</li><li>• Choose your preferred format (CSV for Excel, JSON for developers)</li><li>• Click "Export Selected Reports" to download all selected files</li><li>• Files will be downloaded with timestamps in the filename</li></ul></div>
    </div>
  );
}
