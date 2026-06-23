import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { usePuroks, useOfficers } from '../../hooks/useSupabase';
import { Location, Officer } from '../../types';
import { MapPin, Users, User, Plus, Trash2, Edit2, Search, Check, X, Shield, UserCheck } from 'lucide-react';


interface OrganizationTabProps {
  locations: Location[];
}

interface MemberCandidate {
  id: string;
  firstname: string;
  lastname: string;
  contact_number?: string;
  profile_picture_url?: string;
  is_cooperative_member: boolean;
  purok?: string;
}

export function OrganizationTab({ locations }: OrganizationTabProps) {
  const [selectedLgu, setSelectedLgu] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Active Purok being expanded for TROPA officers
  const [expandedPurokId, setExpandedPurokId] = useState<string | null>(null);

  // Modal State for assigning an officer
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{
    level: 'barangay' | 'purok';
    locationId: string;
    purokId?: string;
    position: 'President' | 'Vice President' | 'Secretary' | 'Treasurer' | 'Auditor' | 'Board Member';
  } | null>(null);

  const [candidates, setCandidates] = useState<MemberCandidate[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Purok renaming/adding state
  const [newPurokName, setNewPurokName] = useState('');
  const [editingPurokId, setEditingPurokId] = useState<string | null>(null);
  const [editingPurokName, setEditingPurokName] = useState('');

  // Get LGUs and Barangays
  const lgus = Array.from(new Set(locations.map(l => l.lgu))).sort();
  const barangays = locations
    .filter(l => !selectedLgu || l.lgu === selectedLgu)
    .map(l => l.barangay)
    .sort();

  // Find exact location record when LGU & Barangay change
  useEffect(() => {
    if (selectedLgu && selectedBarangay) {
      const loc = locations.find(
        l => l.lgu.toUpperCase() === selectedLgu.toUpperCase() &&
             l.barangay.toUpperCase() === selectedBarangay.toUpperCase()
      );
      setSelectedLocation(loc || null);
    } else {
      setSelectedLocation(null);
      setExpandedPurokId(null);
    }
  }, [selectedLgu, selectedBarangay, locations]);

  const {
    puroks,
    createPurok,
    updatePurok,
    deletePurok,
    // refetch: refetchPuroks
  } = usePuroks(selectedLocation?.id);

  const {
    officers: barangayOfficers,
    assignOfficer: assignBarangayOfficer,
    removeOfficer: removeBarangayOfficer
  } = useOfficers(selectedLocation?.id);

  // Fetch Purok level Officers (TROPA) for the expanded Purok
  const {
    officers: purokOfficers,
    assignOfficer: assignPurokOfficer,
    removeOfficer: removePurokOfficer
  } = useOfficers(selectedLocation?.id, expandedPurokId || undefined);

  // Load Candidates when the Assign Modal opens
  useEffect(() => {
    if (!isAssignModalOpen || !assignTarget) return;

    const fetchCandidates = async () => {
      setLoadingCandidates(true);
      try {
        let query = supabase.from('family_members').select('id, firstname, lastname, contact_number, profile_picture_url, is_cooperative_member, purok');

        if (assignTarget.level === 'purok' && assignTarget.purokId) {
          // Scope candidate members to this purok
          query = query.eq('purok_id', assignTarget.purokId);
        } else {
          // Scope candidate members to this barangay
          query = query.eq('lgu', selectedLgu).eq('barangay', selectedBarangay);
        }

        const { data, error } = await query.order('lastname', { ascending: true });
        if (error) throw error;

        setCandidates((data || []).map(d => ({
          id: d.id,
          firstname: d.firstname,
          lastname: d.lastname,
          contact_number: d.contact_number || undefined,
          profile_picture_url: d.profile_picture_url || undefined,
          is_cooperative_member: !!d.is_cooperative_member,
          purok: d.purok
        })));
      } catch (err) {
        console.error('Error fetching officer candidates:', err);
      } finally {
        setLoadingCandidates(false);
      }
    };

    fetchCandidates();
  }, [isAssignModalOpen, assignTarget, selectedLgu, selectedBarangay]);

  // Handle assigning an officer
  const handleAssignSelect = async (memberId: string) => {
    if (!assignTarget) return;

    try {
      const payload = {
        level: assignTarget.level,
        location_id: assignTarget.locationId,
        purok_id: assignTarget.purokId || null,
        position: assignTarget.position,
        member_id: memberId
      };

      if (assignTarget.level === 'purok') {
        await assignPurokOfficer(payload);
      } else {
        await assignBarangayOfficer(payload);
      }

      setIsAssignModalOpen(false);
      setAssignTarget(null);
      setCandidateSearch('');
    } catch (err) {
      alert('Failed to assign officer. Please try again.');
      console.error(err);
    }
  };

  const handleAddPurok = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation || !newPurokName.trim()) return;

    try {
      await createPurok(newPurokName.trim(), selectedLocation.id);
      setNewPurokName('');
    } catch (err: any) {
      if (err.code === '23505') {
        alert('A Purok with this name already exists in this Barangay.');
      } else {
        alert('Failed to add Purok.');
      }
    }
  };

  const handleSavePurokRename = async (purokId: string) => {
    if (!editingPurokName.trim()) return;
    try {
      await updatePurok(purokId, editingPurokName.trim());
      setEditingPurokId(null);
      setEditingPurokName('');
    } catch (err: any) {
      if (err.code === '23505') {
        alert('A Purok with this name already exists in this Barangay.');
      } else {
        alert('Failed to rename Purok.');
      }
    }
  };

  const handleDeletePurokClick = async (purokId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete Purok "${name}"? All associated TROPA officers will also be deleted.`)) {
      try {
        await deletePurok(purokId);
        if (expandedPurokId === purokId) {
          setExpandedPurokId(null);
        }
      } catch (err) {
        alert('Failed to delete Purok.');
      }
    }
  };

  // Group Barangay officers by position
  const getBarangayOfficer = (pos: string) => barangayOfficers.find(o => o.position === pos);
  const getBarangayBoardMembers = () => barangayOfficers.filter(o => o.position === 'Board Member');

  // Group Purok officers by position
  const getPurokOfficer = (pos: string) => purokOfficers.find(o => o.position === pos);
  const getPurokBoardMembers = () => purokOfficers.filter(o => o.position === 'Board Member');

  // Filtered candidate list for selection modal
  const filteredCandidates = candidates.filter(c => {
    const name = `${c.firstname} ${c.lastname}`.toLowerCase();
    return name.includes(candidateSearch.toLowerCase());
  });

  const renderOfficerCard = (
    label: string,
    _position: 'President' | 'Vice President' | 'Secretary' | 'Treasurer' | 'Auditor',
    currentOfficer?: Officer,
    onAssignClick?: () => void,
    onRemoveClick?: (id: string) => void
  ) => {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between h-36 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full uppercase tracking-wider">{label}</span>
          {currentOfficer && onRemoveClick && (
            <button
              onClick={() => onRemoveClick(currentOfficer.id)}
              className="text-xs text-red-500 hover:text-red-700 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
        {currentOfficer ? (
          <div className="flex items-center gap-3 mt-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {currentOfficer.member?.profile_picture_url ? (
                <img src={currentOfficer.member.profile_picture_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-teal-600" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {currentOfficer.member?.firstname} {currentOfficer.member?.lastname}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {currentOfficer.member?.contact_number || 'No contact number'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-center flex-1">
            <button
              onClick={onAssignClick}
              className="text-xs font-medium text-gray-500 hover:text-teal-600 flex items-center gap-1.5 py-1.5 px-3 border border-dashed border-gray-300 rounded-lg hover:border-teal-500 w-full justify-center transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Assign {label}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Location Filter Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-teal-600" /> Select Location to Manage Officers
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">LGU</label>
            <select
              value={selectedLgu}
              onChange={e => {
                setSelectedLgu(e.target.value);
                setSelectedBarangay('');
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select LGU</option>
              {lgus.map(lgu => (
                <option key={lgu} value={lgu}>{lgu}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Barangay</label>
            <select
              value={selectedBarangay}
              disabled={!selectedLgu}
              onChange={e => setSelectedBarangay(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">Select Barangay</option>
              {barangays.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedLocation ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Area: Barangay TOPA Officers & Purok TROPA Officers */}
          <div className="lg:col-span-2 space-y-6">
            {/* Barangay TOPA Officers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-teal-600" /> TOPA Barangay Federation Officers
                  </h3>
                  <p className="text-xs text-gray-500">Federation officers representing the entire Barangay</p>
                </div>
              </div>

              {/* Grid of core officers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {renderOfficerCard(
                  'President',
                  'President',
                  getBarangayOfficer('President'),
                  () => {
                    setAssignTarget({ level: 'barangay', locationId: selectedLocation.id, position: 'President' });
                    setIsAssignModalOpen(true);
                  },
                  removeBarangayOfficer
                )}
                {renderOfficerCard(
                  'Vice President',
                  'Vice President',
                  getBarangayOfficer('Vice President'),
                  () => {
                    setAssignTarget({ level: 'barangay', locationId: selectedLocation.id, position: 'Vice President' });
                    setIsAssignModalOpen(true);
                  },
                  removeBarangayOfficer
                )}
                {renderOfficerCard(
                  'Secretary',
                  'Secretary',
                  getBarangayOfficer('Secretary'),
                  () => {
                    setAssignTarget({ level: 'barangay', locationId: selectedLocation.id, position: 'Secretary' });
                    setIsAssignModalOpen(true);
                  },
                  removeBarangayOfficer
                )}
                {renderOfficerCard(
                  'Treasurer',
                  'Treasurer',
                  getBarangayOfficer('Treasurer'),
                  () => {
                    setAssignTarget({ level: 'barangay', locationId: selectedLocation.id, position: 'Treasurer' });
                    setIsAssignModalOpen(true);
                  },
                  removeBarangayOfficer
                )}
                {renderOfficerCard(
                  'Auditor',
                  'Auditor',
                  getBarangayOfficer('Auditor'),
                  () => {
                    setAssignTarget({ level: 'barangay', locationId: selectedLocation.id, position: 'Auditor' });
                    setIsAssignModalOpen(true);
                  },
                  removeBarangayOfficer
                )}
              </div>

              {/* Board Members */}
              <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Board Members</span>
                  <button
                    onClick={() => {
                      setAssignTarget({ level: 'barangay', locationId: selectedLocation.id, position: 'Board Member' });
                      setIsAssignModalOpen(true);
                    }}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Board Member
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {getBarangayBoardMembers().map(bm => (
                    <div key={bm.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                          {bm.member?.profile_picture_url ? (
                            <img src={bm.member.profile_picture_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-4 h-4 text-teal-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {bm.member?.firstname} {bm.member?.lastname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {bm.member?.contact_number || 'No contact number'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeBarangayOfficer(bm.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {getBarangayBoardMembers().length === 0 && (
                    <div className="sm:col-span-2 text-center py-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-xs text-gray-500">
                      No board members assigned yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TROPA Purok Officers Details (if a Purok is expanded) */}
            {expandedPurokId && (
              (() => {
                const activePurok = puroks.find(p => p.id === expandedPurokId);
                if (!activePurok) return null;

                return (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <Users className="w-5 h-5 text-teal-600" /> TROPA Officers for Purok {activePurok.name}
                        </h3>
                        <p className="text-xs text-gray-500">Officers managing this specific Purok</p>
                      </div>
                      <button
                        onClick={() => setExpandedPurokId(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Grid of core officers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderOfficerCard(
                        'President',
                        'President',
                        getPurokOfficer('President'),
                        () => {
                          setAssignTarget({ level: 'purok', locationId: selectedLocation.id, purokId: activePurok.id, position: 'President' });
                          setIsAssignModalOpen(true);
                        },
                        removePurokOfficer
                      )}
                      {renderOfficerCard(
                        'Vice President',
                        'Vice President',
                        getPurokOfficer('Vice President'),
                        () => {
                          setAssignTarget({ level: 'purok', locationId: selectedLocation.id, purokId: activePurok.id, position: 'Vice President' });
                          setIsAssignModalOpen(true);
                        },
                        removePurokOfficer
                      )}
                      {renderOfficerCard(
                        'Secretary',
                        'Secretary',
                        getPurokOfficer('Secretary'),
                        () => {
                          setAssignTarget({ level: 'purok', locationId: selectedLocation.id, purokId: activePurok.id, position: 'Secretary' });
                          setIsAssignModalOpen(true);
                        },
                        removePurokOfficer
                      )}
                      {renderOfficerCard(
                        'Treasurer',
                        'Treasurer',
                        getPurokOfficer('Treasurer'),
                        () => {
                          setAssignTarget({ level: 'purok', locationId: selectedLocation.id, purokId: activePurok.id, position: 'Treasurer' });
                          setIsAssignModalOpen(true);
                        },
                        removePurokOfficer
                      )}
                      {renderOfficerCard(
                        'Auditor',
                        'Auditor',
                        getPurokOfficer('Auditor'),
                        () => {
                          setAssignTarget({ level: 'purok', locationId: selectedLocation.id, purokId: activePurok.id, position: 'Auditor' });
                          setIsAssignModalOpen(true);
                        },
                        removePurokOfficer
                      )}
                    </div>

                    {/* Board Members */}
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700">Board Members</span>
                        <button
                          onClick={() => {
                            setAssignTarget({ level: 'purok', locationId: selectedLocation.id, purokId: activePurok.id, position: 'Board Member' });
                            setIsAssignModalOpen(true);
                          }}
                          className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Board Member
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {getPurokBoardMembers().map(bm => (
                          <div key={bm.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                                {bm.member?.profile_picture_url ? (
                                  <img src={bm.member.profile_picture_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-teal-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">
                                  {bm.member?.firstname} {bm.member?.lastname}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {bm.member?.contact_number || 'No contact number'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removePurokOfficer(bm.id)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {getPurokBoardMembers().length === 0 && (
                          <div className="sm:col-span-2 text-center py-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-xs text-gray-500">
                            No board members assigned yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>

          {/* Sidebar Area: Purok List Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col max-h-[80vh]">
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" /> Puroks list
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-normal">Add and manage Puroks under {selectedBarangay}</p>

            {/* Add Purok Form */}
            <form onSubmit={handleAddPurok} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPurokName}
                onChange={e => setNewPurokName(e.target.value)}
                placeholder="e.g. Purok 1"
                required
                className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            {/* Puroks List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {puroks.map(purok => (
                <div
                  key={purok.id}
                  className={`border rounded-lg p-2 transition-all ${
                    expandedPurokId === purok.id
                      ? 'border-teal-500 bg-teal-50/30 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {editingPurokId === purok.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editingPurokName}
                        onChange={e => setEditingPurokName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-2 py-0.5 text-xs focus:ring-1 focus:ring-teal-500"
                      />
                      <button
                        onClick={() => handleSavePurokRename(purok.id)}
                        className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingPurokId(null)}
                        className="p-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setExpandedPurokId(expandedPurokId === purok.id ? null : purok.id)}
                        className="flex-1 text-left font-semibold text-gray-800 text-sm hover:text-teal-600 truncate mr-2"
                      >
                        {purok.name}
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingPurokId(purok.id);
                            setEditingPurokName(purok.name);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                          title="Rename Purok"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeletePurokClick(purok.id, purok.name)}
                          className="p-1 text-red-400 hover:text-red-600 rounded"
                          title="Delete Purok"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {puroks.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
                  No Puroks configured for this Barangay.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Please select an LGU and Barangay to manage the Puroks and Officers.</p>
        </div>
      )}

      {/* Member Assignment Search Modal */}
      {isAssignModalOpen && assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">
                  Assign {assignTarget.position}
                </h3>
                <p className="text-xs text-gray-400">
                  {assignTarget.level === 'purok'
                    ? `Scope: Members in Purok ${puroks.find(p => p.id === assignTarget.purokId)?.name}`
                    : `Scope: Members in Barangay ${selectedBarangay}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setAssignTarget(null);
                  setCandidateSearch('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={candidateSearch}
                  onChange={e => setCandidateSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Members List */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {loadingCandidates ? (
                  <div className="text-center py-8 text-sm text-gray-500">Loading candidates...</div>
                ) : filteredCandidates.map(member => (
                  <button
                    key={member.id}
                    onClick={() => handleAssignSelect(member.id)}
                    className="w-full text-left p-2.5 rounded-lg border border-gray-100 hover:border-teal-500 hover:bg-teal-50/20 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {member.profile_picture_url ? (
                          <img src={member.profile_picture_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-teal-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {member.lastname}, {member.firstname}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {member.purok ? `Purok ${member.purok}` : 'No Purok'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.is_cooperative_member && (
                        <span className="text-[9px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full flex items-center gap-0.5" title="Cooperative Member">
                          <UserCheck className="w-2.5 h-2.5" /> Coop
                        </span>
                      )}
                      <span className="text-xs text-teal-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                    </div>
                  </button>
                ))}

                {!loadingCandidates && filteredCandidates.length === 0 && (
                  <div className="text-center py-8 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
                    No eligible members found.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
