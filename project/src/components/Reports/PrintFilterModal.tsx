import { useState, useMemo } from 'react';
import { Household, FamilyMember, DuesPayment, ContributionRate } from '../../types';
import { X, Printer, Filter, Home, Users } from 'lucide-react';
import { printHouseholdRoster } from './HouseholdRosterPrint';
import { printPaymentLedger, printTreasurerSheet } from './PaymentLedgerPrint';

type PrintMode = 'roster' | 'ledger';

interface PrintFilterModalProps {
  mode: PrintMode;
  households: Household[];
  members: FamilyMember[];
  payments: DuesPayment[];
  contributionRates: ContributionRate[];
  onClose: () => void;
}

export function PrintFilterModal({ mode, households, members, payments, contributionRates, onClose }: PrintFilterModalProps) {
  const [selectedLGU,      setSelectedLGU]      = useState<string>('all');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('all');
  const [selectedPurok,    setSelectedPurok]    = useState<string>('all');

  // Unique LGUs
  const lguOptions = useMemo(() => {
    const set = new Set<string>();
    households.forEach((h) => { if (h.lgu) set.add(h.lgu); });
    return Array.from(set).sort();
  }, [households]);

  // Barangays filtered by LGU
  const barangayOptions = useMemo(() => {
    const set = new Set<string>();
    households.forEach((h) => {
      if ((selectedLGU === 'all' || h.lgu === selectedLGU) && h.barangay) {
        set.add(h.barangay);
      }
    });
    return Array.from(set).sort();
  }, [households, selectedLGU]);

  // Strip any remaining "Purok " prefix from stored values (safety net before DB cleanup)
  const normalizePurok = (raw: string) =>
    raw.replace(/^purok\s+/i, '').replace(/-\s+/g, '-').trim().toUpperCase();

  // Puroks — only show after a barangay is selected (ledger only)
  const purokOptions = useMemo(() => {
    if (selectedBarangay === 'all') return [];
    const map = new Map<string, string>(); // normalized → original
    households.forEach((h) => {
      if (
        (selectedLGU === 'all' || h.lgu === selectedLGU) &&
        h.barangay === selectedBarangay &&
        h.purok
      ) {
        const norm = normalizePurok(h.purok);
        if (!map.has(norm)) map.set(norm, h.purok);
      }
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [households, selectedLGU, selectedBarangay]);

  const handleLGUChange = (lgu: string) => {
    setSelectedLGU(lgu);
    setSelectedBarangay('all');
    setSelectedPurok('all');
  };

  const handleBarangayChange = (barangay: string) => {
    setSelectedBarangay(barangay);
    setSelectedPurok('all');
  };

  // Filtered households
  const filteredHouseholds = useMemo(() =>
    households.filter((h) => {
      if (selectedLGU      !== 'all' && h.lgu      !== selectedLGU)      return false;
      if (selectedBarangay !== 'all' && h.barangay !== selectedBarangay) return false;
      if (selectedPurok    !== 'all' && h.purok    !== selectedPurok)    return false;
      return true;
    }),
    [households, selectedLGU, selectedBarangay, selectedPurok]
  );

  const filteredMembers = useMemo(() =>
    members.filter((m) => filteredHouseholds.some((h) => h.id === m.household_id)),
    [members, filteredHouseholds]
  );

  const coopCount = filteredMembers.filter((m) => m.is_cooperative_member).length;

  const handlePrint = () => {
    if (mode === 'roster') {
      printHouseholdRoster({ households: filteredHouseholds, members: filteredMembers });
    } else {
      printPaymentLedger({
        households: filteredHouseholds,
        members: filteredMembers,
        payments,
        contributionRates,
        filterLabel: buildFilterLabel(),
      });
    }
    onClose();
  };

  const handleTreasurerPrint = () => {
    printTreasurerSheet({
      households: filteredHouseholds,
      members: filteredMembers,
      filterLabel: buildFilterLabel(),
    });
    onClose();
  };

  function buildFilterLabel() {
    return [
      selectedLGU      !== 'all' ? selectedLGU      : null,
      selectedBarangay !== 'all' ? selectedBarangay : null,
      selectedPurok    !== 'all' ? `Purok ${selectedPurok}` : null,
    ].filter(Boolean).join(' · ') || 'All';
  }

  const title = mode === 'roster' ? 'Print Household Roster' : 'Print Payment Ledger';
  const icon  = mode === 'roster'
    ? <Home  className="w-5 h-5 text-teal-600" />
    : <Users className="w-5 h-5 text-teal-600" />;

  const showPurok = mode === 'ledger' && selectedBarangay !== 'all' && purokOptions.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">Filter by location before printing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1 text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4" />
            Location Filter
          </div>

          {/* LGU */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">LGU</label>
            <select
              value={selectedLGU}
              onChange={(e) => handleLGUChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="all">All LGUs</option>
              {lguOptions.map((lgu) => (
                <option key={lgu} value={lgu}>{lgu}</option>
              ))}
            </select>
          </div>

          {/* Barangay */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Barangay</label>
            <select
              value={selectedBarangay}
              onChange={(e) => handleBarangayChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
              disabled={barangayOptions.length === 0}
            >
              <option value="all">All Barangays</option>
              {barangayOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Purok — ledger only, visible after barangay is picked */}
          {showPurok && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Purok
                <span className="ml-1 text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={selectedPurok}
                onChange={(e) => setSelectedPurok(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
              >
                <option value="all">All Puroks</option>
                {purokOptions.map(([label, orig]) => (
                  <option key={orig} value={orig}>Purok {label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Preview counts */}
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 grid grid-cols-3 gap-3 text-center mt-2">
            <div>
              <p className="text-lg font-bold text-teal-700">{filteredHouseholds.length}</p>
              <p className="text-xs text-teal-600">Households</p>
            </div>
            <div>
              <p className="text-lg font-bold text-teal-700">{filteredMembers.length}</p>
              <p className="text-xs text-teal-600">Members</p>
            </div>
            <div>
              <p className="text-lg font-bold text-teal-700">{coopCount}</p>
              <p className="text-xs text-teal-600">TROPA Members</p>
            </div>
          </div>

          {filteredHouseholds.length === 0 && (
            <p className="text-sm text-amber-600 text-center bg-amber-50 rounded-lg py-2">
              No data matches the selected filters.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {mode === 'ledger' && (
            <button
              onClick={handleTreasurerPrint}
              disabled={filteredHouseholds.length === 0}
              className="px-4 py-2 text-sm text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed font-medium rounded-lg transition-colors"
            >
              Treasurer Sheet
            </button>
          )}
          <button
            onClick={handlePrint}
            disabled={filteredHouseholds.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print {mode === 'ledger' ? 'Ledger' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
