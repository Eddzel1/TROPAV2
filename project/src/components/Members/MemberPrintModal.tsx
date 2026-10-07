import { useState, useMemo, useEffect } from 'react';
import { Household } from '../../types';
import { X, Printer, Filter, Users, Loader2 } from 'lucide-react';
import { useFamilyMembers } from '../../hooks/useSupabase';
import { printMemberList, MemberPrintFormat } from './MemberListPrint';

interface MemberPrintModalProps {
  households: Household[];
  onClose: () => void;
}

const normalizePurok = (raw: string) =>
  raw.replace(/^purok\s+/i, '').replace(/-\s+/g, '-').trim().toUpperCase();

export function MemberPrintModal({ households, onClose }: MemberPrintModalProps) {
  const { members, loading } = useFamilyMembers();

  const [selectedLGU,      setSelectedLGU]      = useState('all');
  const [selectedBarangay, setSelectedBarangay] = useState('all');
  const [selectedPurok,    setSelectedPurok]    = useState('all');
  const [specificEnabled,  setSpecificEnabled]  = useState(false);
  const [selectedIds,      setSelectedIds]      = useState<Set<string>>(new Set());
  const [search,           setSearch]           = useState('');
  const [leadersOnly,      setLeadersOnly]      = useState(false);

  const lguOptions = useMemo(() =>
    Array.from(new Set(households.map(h => h.lgu).filter(Boolean))).sort(), [households]);

  const barangayOptions = useMemo(() =>
    Array.from(new Set(households
      .filter(h => selectedLGU === 'all' || h.lgu === selectedLGU)
      .map(h => h.barangay).filter(Boolean))).sort(),
    [households, selectedLGU]);

  const purokOptions = useMemo(() => {
    if (selectedBarangay === 'all') return [];
    const map = new Map<string, string>();
    households.forEach(h => {
      if ((selectedLGU === 'all' || h.lgu === selectedLGU) && h.barangay === selectedBarangay && h.purok) {
        const n = normalizePurok(h.purok);
        if (!map.has(n)) map.set(n, h.purok);
      }
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [households, selectedLGU, selectedBarangay]);

  const locationHouseholds = useMemo(() => households.filter(h =>
    (selectedLGU      === 'all' || h.lgu      === selectedLGU) &&
    (selectedBarangay === 'all' || h.barangay === selectedBarangay) &&
    (selectedPurok    === 'all' || h.purok    === selectedPurok)
  ), [households, selectedLGU, selectedBarangay, selectedPurok]);

  useEffect(() => { setSelectedIds(new Set()); setSearch(''); }, [locationHouseholds]);

  const finalHouseholds = useMemo(() =>
    specificEnabled ? locationHouseholds.filter(h => selectedIds.has(h.id)) : locationHouseholds,
    [locationHouseholds, specificEnabled, selectedIds]);

  const filteredMembers = useMemo(() => {
    const ids = new Set(finalHouseholds.map(h => h.id));
    return members.filter(m => m.household_id && ids.has(m.household_id) && (!leadersOnly || m.is_household_leader));
  }, [members, finalHouseholds, leadersOnly]);

  const hhWithMembers = new Set(filteredMembers.map(m => m.household_id)).size;

  const filterLabel = [
    selectedLGU      !== 'all' ? selectedLGU : null,
    selectedBarangay !== 'all' ? selectedBarangay : null,
    selectedPurok    !== 'all' ? `Purok ${normalizePurok(selectedPurok)}` : null,
  ].filter(Boolean).join(' · ') || 'All';

  const handlePrint = (format: MemberPrintFormat) => {
    printMemberList({ households: finalHouseholds, members: filteredMembers, filterLabel, format, leadersOnly,
      lgu: selectedLGU === 'all' ? 'All LGUs' : selectedLGU,
      barangay: selectedBarangay === 'all' ? 'All Barangays' : selectedBarangay });
    onClose();
  };

  const selectCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white';
  const visibleHH = locationHouseholds.filter(h => h.household_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Print Member List</h2>
              <p className="text-xs text-gray-500">Filter by location before printing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4" /> Location Filter
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">LGU</label>
            <select value={selectedLGU} onChange={e => { setSelectedLGU(e.target.value); setSelectedBarangay('all'); setSelectedPurok('all'); }} className={selectCls}>
              <option value="all">All LGUs</option>
              {lguOptions.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Barangay</label>
            <select value={selectedBarangay} onChange={e => { setSelectedBarangay(e.target.value); setSelectedPurok('all'); }} className={selectCls} disabled={barangayOptions.length === 0}>
              <option value="all">All Barangays</option>
              {barangayOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {selectedBarangay !== 'all' && purokOptions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Purok <span className="ml-1 text-gray-400 font-normal">(optional)</span>
              </label>
              <select value={selectedPurok} onChange={e => setSelectedPurok(e.target.value)} className={selectCls}>
                <option value="all">All Puroks</option>
                {purokOptions.map(([label, orig]) => <option key={orig} value={orig}>Purok {label}</option>)}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
            <input type="checkbox" checked={leadersOnly} onChange={e => setLeadersOnly(e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4" />
            Household Leaders Only
          </label>

          {locationHouseholds.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" checked={specificEnabled} onChange={e => setSpecificEnabled(e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4" />
                Select Specific Households Only
              </label>
              {specificEnabled && (
                <div className="mt-2 flex flex-col gap-2">
                  <input type="text" placeholder="Search household..." value={search} onChange={e => setSearch(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white" />
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-1">
                    {visibleHH.map(h => (
                      <label key={h.id} className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-100 p-1.5 rounded cursor-pointer">
                        <input type="checkbox" checked={selectedIds.has(h.id)} onChange={e => {
                          const s = new Set(selectedIds);
                          if (e.target.checked) s.add(h.id); else s.delete(h.id);
                          setSelectedIds(s);
                        }} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4" />
                        {h.household_name}
                      </label>
                    ))}
                    {visibleHH.length === 0 && <p className="text-xs text-gray-500 text-center py-2">No households match your search.</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 grid grid-cols-2 gap-3 text-center">
            {loading ? (
              <div className="col-span-2 flex items-center justify-center gap-2 text-sm text-teal-700 py-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading members…
              </div>
            ) : (
              <>
                <div><p className="text-lg font-bold text-teal-700">{hhWithMembers}</p><p className="text-xs text-teal-600">Households</p></div>
                <div><p className="text-lg font-bold text-teal-700">{filteredMembers.length}</p><p className="text-xs text-teal-600">{leadersOnly ? 'Leaders' : 'Members'}</p></div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={() => handlePrint('details')}
            disabled={loading || filteredMembers.length === 0}
            className="px-4 py-2 text-sm text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium rounded-lg transition-colors"
          >
            Member Details
          </button>
          <button
            onClick={() => handlePrint('treasurer')}
            disabled={loading || filteredMembers.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" /> Treasurer's Copy
          </button>
        </div>
      </div>
    </div>
  );
}
