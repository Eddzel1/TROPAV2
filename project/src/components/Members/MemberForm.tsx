import React, { useState, useEffect, useRef } from 'react';
import { FamilyMember, Household, Location, Voter } from '../../types';
import { X, Save, Search, UserCheck, Info } from 'lucide-react';
import { supabaseHelpers } from '../../lib/supabase';

interface MemberFormProps {
    member?: FamilyMember;
    households: Household[];
    locations: Location[];
    isOpen: boolean;
    onClose: () => void;
    onSave: (memberData: Partial<FamilyMember>) => void;
    preSelectedHousehold?: Household;
}

const emptyForm: Partial<FamilyMember> & { household_name?: string } = {
    firstname: '',
    lastname: '',
    middlename: '',
    extension: '',
    household_id: '',
    household_name: '',
    lgu: '',
    barangay: '',
    purok: '',
    sector: 'General',
    is_voter: false,
    is_household_leader: false,
    is_cooperative_member: true,
};

export function MemberForm({ member, households, locations, isOpen, onClose, onSave, preSelectedHousehold }: MemberFormProps) {
    const [formData, setFormData] = useState<Partial<FamilyMember> & { household_name?: string }>(emptyForm);

    // ── Voter search state ──
    const [voterLastName, setVoterLastName] = useState('');
    const [voterFirstName, setVoterFirstName] = useState('');
    const [voterMiddleName, setVoterMiddleName] = useState('');

    const [voterResults, setVoterResults] = useState<Voter[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
    const [searchSkipped, setSearchSkipped] = useState(false);

    // Background match indicator state
    const [possibleMatches, setPossibleMatches] = useState<Voter[]>([]);

    // LGU / Barangay filter for voter search
    const [voterLgu, setVoterLgu] = useState('VALENCIA CITY');
    const [voterBarangay, setVoterBarangay] = useState('');

    // Refs so debounced callback always reads latest values
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const voterLastNameRef = useRef(voterLastName);
    const voterFirstNameRef = useRef(voterFirstName);
    const voterMiddleNameRef = useRef(voterMiddleName);
    const voterBarangayRef = useRef(voterBarangay);
    const [isAddAnother, setIsAddAnother] = useState(false);

    // Keep refs in sync with state
    useEffect(() => { voterLastNameRef.current = voterLastName; }, [voterLastName]);
    useEffect(() => { voterFirstNameRef.current = voterFirstName; }, [voterFirstName]);
    useEffect(() => { voterMiddleNameRef.current = voterMiddleName; }, [voterMiddleName]);
    useEffect(() => { voterBarangayRef.current = voterBarangay; }, [voterBarangay]);

    const isAddMode = !member;

    // Reset form & voter search whenever isOpen or member changes
    useEffect(() => {
        if (member) {
            setFormData(member);
        } else if (preSelectedHousehold) {
            setFormData({
                ...emptyForm,
                household_id: preSelectedHousehold.id,
                household_name: preSelectedHousehold.household_name,
                lgu: preSelectedHousehold.lgu,
                barangay: preSelectedHousehold.barangay,
                purok: preSelectedHousehold.purok,
                is_household_leader: false
            });
        } else {
            setFormData(emptyForm);
        }
        setVoterLastName('');
        setVoterFirstName('');
        setVoterMiddleName('');
        setVoterResults([]);
        setSelectedVoter(null);
        setSearchSkipped(false);
        setSearchError('');
        setVoterLgu('VALENCIA CITY');
        setVoterBarangay('');
        setPossibleMatches([]);
    }, [member, isOpen]);

    // ── Search runner — uses refs so it's always fresh ──
    const runSearch = (lname: string, fname: string, mname: string, lgu: string, barangay: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (lname.trim().length < 2 && fname.trim().length < 2 && mname.trim().length < 2) {
            setVoterResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await supabaseHelpers.searchVoters(
                    lname.trim(),
                    fname.trim(),
                    mname.trim(),
                    lgu || undefined,
                    barangay || undefined
                );
                setVoterResults(results as Voter[]);
                if (results.length === 0) setSearchError('No voter record found.');
                else setSearchError('');
            } catch (err) {
                console.error('Voter search error:', err);
                const pgErr = err as { message?: string; details?: string; hint?: string; code?: string };
                const msg = pgErr?.message || (err instanceof Error ? err.message : 'Unknown error — check browser console');
                setSearchError(`Search failed: ${msg}`);
                setVoterResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 400);
    };

    // ── Background match checking ──
    useEffect(() => {
        if (!isAddMode || selectedVoter || !searchSkipped) {
            setPossibleMatches([]);
            return;
        }

        const ln = (formData.lastname || '').trim();
        const fn = (formData.firstname || '').trim();
        const mn = (formData.middlename || '').trim();

        if (ln.length < 2 || fn.length < 2) {
            setPossibleMatches([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                // Check anywhere in database, regardless of LGU/Barangay filter
                const results = await supabaseHelpers.searchVoters(ln, fn, mn, undefined, undefined);
                setPossibleMatches(results as Voter[]);
            } catch (err) {
                console.error("Match check error", err);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [formData.lastname, formData.firstname, formData.middlename, isAddMode, selectedVoter, searchSkipped]);

    // ── All hooks must be above this line ──
    if (!isOpen) return null;

    // ── Event handlers (plain functions, no hooks) ──
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave = { ...formData, is_cooperative_member: true };
            await onSave(dataToSave);
            if (isAddAnother) {
                // Reset form but retain household and location info
                setFormData({
                    ...emptyForm,
                    household_id: formData.household_id,
                    household_name: formData.household_name,
                    lgu: formData.lgu,
                    barangay: formData.barangay,
                    purok: formData.purok,
                    is_household_leader: false
                });
                setVoterLastName('');
                setVoterFirstName('');
                setVoterMiddleName('');
                setVoterResults([]);
                setSelectedVoter(null);
                setSearchSkipped(false);
                setSearchError('');
                setPossibleMatches([]);
            }
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev) => {
                const newData = { ...prev, [name]: checked };
                if (name === 'is_household_leader' && checked && !prev.household_name && prev.lastname) {
                    const parts = [prev.firstname, prev.middlename].filter(Boolean).join(' ');
                    newData.household_name = `${prev.lastname}, ${parts} FAMILY`.trim();
                    newData.household_id = '';
                }
                return newData;
            });
        } else {
            let finalValue = value;
            if (name === 'contact_number') {
                let cleaned = value.replace(/\D/g, '');
                if (cleaned.length > 4 && cleaned.length <= 7) {
                    cleaned = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
                } else if (cleaned.length > 7) {
                    cleaned = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
                }
                finalValue = cleaned;
            }
            setFormData((prev) => ({ ...prev, [name]: finalValue }));
        }
    };

    const handleVoterNameChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'lastname' | 'firstname' | 'middlename') => {
        const val = e.target.value;
        setSearchError('');

        // Optimistic state updates
        let lname = voterLastNameRef.current;
        let fname = voterFirstNameRef.current;
        let mname = voterMiddleNameRef.current;

        if (field === 'lastname') {
            setVoterLastName(val);
            lname = val;
        }
        if (field === 'firstname') {
            setVoterFirstName(val);
            fname = val;
        }
        if (field === 'middlename') {
            setVoterMiddleName(val);
            mname = val;
        }

        runSearch(lname, fname, mname, voterLgu, voterBarangayRef.current);
    };

    const handleVoterLguChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setVoterLgu(e.target.value);
        setVoterBarangay('');
        voterBarangayRef.current = '';
        setSearchError('');
        if (voterLastNameRef.current.trim().length >= 2 || voterFirstNameRef.current.trim().length >= 2 || voterMiddleNameRef.current.trim().length >= 2) {
            runSearch(voterLastNameRef.current, voterFirstNameRef.current, voterMiddleNameRef.current, e.target.value, '');
        }
    };

    const handleVoterBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const b = e.target.value;
        setVoterBarangay(b);
        voterBarangayRef.current = b;
        setSearchError('');
        runSearch(voterLastNameRef.current, voterFirstNameRef.current, voterMiddleNameRef.current, voterLgu, b);
    };

    const handleSelectVoter = (voter: Voter) => {
        setSelectedVoter(voter);
        setVoterLastName('');
        setVoterFirstName('');
        setVoterMiddleName('');
        setVoterResults([]);

        setFormData((prev) => ({
            ...prev,
            firstname: voter.firstname || '',
            lastname: voter.lastname || '',
            middlename: voter.middlename || '',
            extension: voter.ext || '',
            barangay: prev.barangay || voter.brgy || '',
            purok: prev.purok || voter.purok || '',
            lgu: prev.lgu || voter.lgu || '',
            is_voter: true,
            listing_status: voter.status || '',
        }));
    };

    const handleSkipSearch = () => {
        setSearchSkipped(true);
    };

    const handleClearVoter = () => {
        setSelectedVoter(null);
        setFormData(emptyForm);
    };

    const sectorOptions = ['General', 'Youth', 'Student', 'Senior Citizen', 'PWD', 'LGBTQ+', 'Solo Parent', 'Indigenous People'];

    const handleSectorToggle = (sectorName: string, checked: boolean) => {
        setFormData(prev => {
            const currentSectors = prev.sector ? prev.sector.split(',').map(s => s.trim()).filter(Boolean) : [];
            let newSectors = [...currentSectors];

            if (checked) {
                if (sectorName === 'General') {
                    newSectors = ['General'];
                } else {
                    newSectors = newSectors.filter(s => s !== 'General');
                    if (!newSectors.includes(sectorName)) newSectors.push(sectorName);
                }
            } else {
                newSectors = newSectors.filter(s => s !== sectorName);
                if (newSectors.length === 0) newSectors = ['General'];
            }
            return { ...prev, sector: newSectors.join(', ') };
        });
    };

    // ── Computed values ──
    const lgus = Array.from(new Set(locations.map(l => l.lgu))).sort();
    const barangays = locations
        .filter(l => !voterLgu || l.lgu === voterLgu)
        .map(l => l.barangay)
        .sort();
    const formBarangays = locations
        .filter(l => !formData.lgu || l.lgu === formData.lgu)
        .map(l => l.barangay);
    const formLgus = Array.from(new Set(locations.map(l => l.lgu)));

    const showVoterSearch = isAddMode && !selectedVoter && !searchSkipped;
    const showForm = isAddMode ? (selectedVoter !== null || searchSkipped) : true;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl my-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {member ? 'Edit Member' : 'Add New Member'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* ── VOTER SEARCH STEP ── */}
                {showVoterSearch && (
                    <div className="p-6">
                        <div className="mb-4">
                            <h3 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-2">
                                <Search className="w-4 h-4 text-teal-600" />
                                Find Voter Record
                            </h3>
                            <p className="text-sm text-gray-500">
                                Filter by location and search by name, or skip to fill the form manually.
                            </p>
                        </div>

                        {/* LGU + Barangay filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">LGU</label>
                                <select
                                    value={voterLgu}
                                    onChange={handleVoterLguChange}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                                >
                                    <option value="">All LGUs</option>
                                    {lgus.map(lgu => (
                                        <option key={lgu} value={lgu}>{lgu}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Barangay</label>
                                <select
                                    value={voterBarangay}
                                    onChange={handleVoterBarangayChange}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                                >
                                    <option value="">All Barangays</option>
                                    {barangays.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Name search inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search last name..."
                                        value={voterLastName}
                                        onChange={(e) => handleVoterNameChange(e, 'lastname')}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search first name..."
                                        value={voterFirstName}
                                        onChange={(e) => handleVoterNameChange(e, 'firstname')}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Middle Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Search middle name..."
                                        value={voterMiddleName}
                                        onChange={(e) => handleVoterNameChange(e, 'middlename')}
                                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Search Results Table */}
                        {isSearching ? (
                            <div className="mt-4 flex justify-center py-4">
                                <span className="text-sm text-teal-600 animate-pulse">Searching voter records...</span>
                            </div>
                        ) : voterResults.length > 0 ? (
                            <div className="mt-4 overflow-x-auto border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                                <table className="w-full text-left border-collapse min-w-max">
                                    <thead className="sticky top-0 bg-gray-50 text-xs font-medium text-gray-500 uppercase z-10">
                                        <tr>
                                            <th className="px-4 py-3 border-b border-gray-200">Last Name</th>
                                            <th className="px-4 py-3 border-b border-gray-200">First Name</th>
                                            <th className="px-4 py-3 border-b border-gray-200">Middle Name</th>
                                            <th className="px-4 py-3 border-b border-gray-200">LGU</th>
                                            <th className="px-4 py-3 border-b border-gray-200">Brgy</th>
                                            <th className="px-4 py-3 border-b border-gray-200">Status</th>
                                            <th className="px-4 py-3 border-b border-gray-200 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {voterResults.map((voter) => (
                                            <tr key={voter.id} className="hover:bg-teal-50 transition-colors group">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-100">{voter.lastname}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">{voter.firstname}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">{voter.middlename || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100">{voter.lgu || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100">{voter.brgy || '-'}</td>
                                                <td className="px-4 py-3 border-b border-gray-100">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${voter.status?.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {voter.status || 'Unknown'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center border-b border-gray-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectVoter(voter)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white rounded-md text-xs font-medium transition-colors border border-teal-100 hover:border-teal-600"
                                                    >
                                                        <UserCheck className="w-3.5 h-3.5" />
                                                        Select
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}

                        {(searchError && (voterLastName.trim().length >= 2 || voterFirstName.trim().length >= 2 || voterMiddleName.trim().length >= 2) && !isSearching) && (
                            <p className="mt-2 text-sm text-amber-600">{searchError}</p>
                        )}

                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={handleSkipSearch}
                                className="text-sm text-gray-500 hover:text-teal-600 underline underline-offset-2 transition-colors"
                            >
                                Skip — fill the form manually
                            </button>
                        </div>
                    </div>
                )}

                {/* ── SELECTED VOTER BADGE ── */}
                {isAddMode && selectedVoter && (
                    <div className="px-6 pt-4">
                        <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5">
                            <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-teal-800 truncate">
                                    Voter found: {selectedVoter.lastname}, {selectedVoter.firstname}
                                    {selectedVoter.middlename ? ` ${selectedVoter.middlename}` : ''}
                                </p>
                                <p className="text-xs text-teal-600">Details pre-filled — review and complete remaining fields.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearVoter}
                                className="text-teal-400 hover:text-teal-600 ml-2 shrink-0"
                                title="Remove and start over"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ── MEMBER FORM ── */}
                {showForm && (
                    <form onSubmit={handleFormSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Personal Information */}
                            <div className="space-y-4 md:col-span-2">
                                {possibleMatches.length > 0 && showForm && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-blue-900">Possible voter match found!</h4>
                                            <p className="text-sm text-blue-700 mt-1">
                                                We found {possibleMatches.length} {possibleMatches.length === 1 ? 'record' : 'records'} matching "{formData.firstname} {formData.lastname}".
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchSkipped(false);
                                                setVoterLastName(formData.lastname || '');
                                                voterLastNameRef.current = formData.lastname || '';
                                                setVoterFirstName(formData.firstname || '');
                                                voterFirstNameRef.current = formData.firstname || '';
                                                setVoterMiddleName(formData.middlename || '');
                                                voterMiddleNameRef.current = formData.middlename || '';
                                                runSearch(formData.lastname || '', formData.firstname || '', formData.middlename || '', voterLgu, voterBarangay);
                                            }}
                                            className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors shrink-0 whitespace-nowrap"
                                        >
                                            Review Matches
                                        </button>
                                    </div>
                                )}
                                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Personal Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            name="lastname"
                                            required
                                            value={formData.lastname || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            name="firstname"
                                            required
                                            value={formData.firstname || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                                        <input
                                            type="text"
                                            name="middlename"
                                            value={formData.middlename || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                        <input
                                            type="text"
                                            name="contact_number"
                                            value={formData.contact_number || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Birthday *</label>
                                        <input
                                            type="date"
                                            name="birth_date"
                                            required
                                            value={formData.birth_date
                                                ? (formData.birth_date instanceof Date
                                                    ? formData.birth_date.toISOString().split('T')[0]
                                                    : String(formData.birth_date).split('T')[0])
                                                : ''}
                                            onChange={(e) =>
                                                setFormData(prev => ({
                                                    ...prev,
                                                    birth_date: e.target.value ? new Date(e.target.value) : undefined,
                                                    age: e.target.value
                                                        ? Math.floor((Date.now() - new Date(e.target.value).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                                                        : prev.age,
                                                }))
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className={(formData.sector || '').includes('Student') ? 'md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3' : 'md:col-span-2'}>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Sector *</label>
                                            <div className="flex flex-wrap gap-3">
                                                {sectorOptions.map(option => (
                                                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.sector || 'General').split(',').map(s => s.trim()).includes(option)}
                                                            onChange={(e) => handleSectorToggle(option, e.target.checked)}
                                                            className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                                        />
                                                        <span className="text-sm text-gray-700">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        {(formData.sector || '').includes('Student') && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Level *</label>
                                                <select
                                                    name="year_level"
                                                    required
                                                    value={formData.year_level || ''}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                                >
                                                    <option value="">Select Level</option>
                                                    <option value="Elementary">Elementary</option>
                                                    <option value="High School">High School</option>
                                                    <option value="College">College</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Household & Location */}
                            <div className="space-y-4 md:col-span-2">
                                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Household &amp; Location</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formData.is_household_leader && !member ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">New Household Name *</label>
                                            <input
                                                type="text"
                                                name="household_name"
                                                required
                                                value={formData.household_name || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                                placeholder="e.g., Smith Family"
                                            />
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Household *</label>
                                            <select
                                                name="household_id"
                                                required={!formData.is_household_leader}
                                                value={formData.household_id || ''}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                            >
                                                <option value="">Select Household</option>
                                                {households.map(h => (
                                                    <option key={h.id} value={h.id}>{h.household_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">LGU *</label>
                                        <select
                                            name="lgu"
                                            required
                                            value={formData.lgu || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="">Select LGU</option>
                                            {formLgus.map(lgu => (
                                                <option key={lgu} value={lgu}>{lgu}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                                        <select
                                            name="barangay"
                                            required
                                            value={formData.barangay || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                        >
                                            <option value="">Select Barangay</option>
                                            {formBarangays.map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Purok *</label>
                                        <input
                                            type="text"
                                            name="purok"
                                            required
                                            value={formData.purok || ''}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status & Qualifications */}
                            <div className="space-y-4 md:col-span-2 mb-4">
                                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Status &amp; Qualifications</h3>

                                {/* Listing Status */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Listing Status
                                            {selectedVoter && (
                                                <span className="ml-2 text-xs font-normal text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                                                    From voter record
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="text"
                                            name="listing_status"
                                            value={formData.listing_status || ''}
                                            readOnly
                                            placeholder="Auto-filled from voter record"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="is_household_leader"
                                            checked={formData.is_household_leader || false}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Household Leader</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="is_voter"
                                            checked={formData.is_voter || false}
                                            onChange={handleInputChange}
                                            className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Registered Voter</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            {!member && (
                                <button
                                    type="submit"
                                    onClick={() => setIsAddAnother(true)}
                                    className="px-6 py-2 bg-blue-600 border border-transparent rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center gap-2 font-medium"
                                >
                                    <Save className="w-5 h-5" />
                                    Save & Add Another
                                </button>
                            )}
                            <button
                                type="submit"
                                onClick={() => setIsAddAnother(false)}
                                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors flex items-center gap-2 font-medium"
                            >
                                <Save className="w-5 h-5" />
                                {member ? 'Update Member' : 'Save Member'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
