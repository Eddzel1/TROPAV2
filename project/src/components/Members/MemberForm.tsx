import React, { useState, useEffect, useRef } from 'react';
import { FamilyMember, Household, Location, Voter } from '../../types';
import { X, Save, Search, UserCheck, ChevronRight } from 'lucide-react';
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
    const [voterQuery, setVoterQuery] = useState('');
    const [voterResults, setVoterResults] = useState<Voter[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
    const [searchSkipped, setSearchSkipped] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const listItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Search field toggle checkboxes
    const [searchLastname, setSearchLastname] = useState(true);
    const [searchFirstname, setSearchFirstname] = useState(true);
    const [searchMiddlename, setSearchMiddlename] = useState(false);

    // LGU / Barangay filter for voter search
    const [voterLgu, setVoterLgu] = useState('VALENCIA CITY');
    const [voterBarangay, setVoterBarangay] = useState('');

    // Refs so debounced callback always reads latest values
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const voterQueryRef = useRef(voterQuery);
    const voterBarangayRef = useRef(voterBarangay);
    const searchFieldsRef = useRef<('lastname' | 'firstname' | 'middlename')[]>(['lastname', 'firstname']);
    const [isAddAnother, setIsAddAnother] = useState(false);

    // Keep refs in sync with state
    useEffect(() => { voterQueryRef.current = voterQuery; }, [voterQuery]);
    useEffect(() => { voterBarangayRef.current = voterBarangay; }, [voterBarangay]);
    useEffect(() => {
        const fields: ('lastname' | 'firstname' | 'middlename')[] = [];
        if (searchLastname) fields.push('lastname');
        if (searchFirstname) fields.push('firstname');
        if (searchMiddlename) fields.push('middlename');
        searchFieldsRef.current = fields.length > 0 ? fields : ['lastname'];
    }, [searchLastname, searchFirstname, searchMiddlename]);

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
        setVoterQuery('');
        setVoterResults([]);
        setSelectedVoter(null);
        setSearchSkipped(false);
        setShowDropdown(false);
        setHighlightedIndex(-1);
        setSearchError('');
        setVoterLgu('VALENCIA CITY');
        setVoterBarangay('');
        setSearchLastname(true);
        setSearchFirstname(true);
        setSearchMiddlename(false);
        searchFieldsRef.current = ['lastname', 'firstname'];
    }, [member, isOpen]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Search runner — uses refs so it's always fresh ──
    const runSearch = (query: string, lgu: string, barangay: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (query.trim().length < 2) {
            setVoterResults([]);
            setShowDropdown(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await supabaseHelpers.searchVoters(
                    query.trim(),
                    lgu || undefined,
                    barangay || undefined,
                    searchFieldsRef.current
                );
                setVoterResults(results as Voter[]);
                setShowDropdown(results.length > 0);
                setHighlightedIndex(-1);
                if (results.length === 0) setSearchError('No voter record found.');
                else setSearchError('');
            } catch (err) {
                console.error('Voter search error:', err);
                const pgErr = err as { message?: string; details?: string; hint?: string; code?: string };
                const msg = pgErr?.message || (err instanceof Error ? err.message : 'Unknown error — check browser console');
                setSearchError(`Search failed: ${msg}`);
                setVoterResults([]);
                setShowDropdown(false);
            } finally {
                setIsSearching(false);
            }
        }, 400);
    };

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
                setVoterQuery('');
                setVoterResults([]);
                setSelectedVoter(null);
                setSearchSkipped(false);
                setShowDropdown(false);
                setHighlightedIndex(-1);
                setSearchError('');
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

    const handleVoterQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setVoterQuery(q);
        setSearchError('');
        runSearch(q, voterLgu, voterBarangayRef.current);
    };

    const handleVoterLguChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setVoterLgu(e.target.value);
        setVoterBarangay('');
        voterBarangayRef.current = '';
        setSearchError('');
        if (voterQueryRef.current.trim().length >= 2) {
            runSearch(voterQueryRef.current, e.target.value, '');
        }
    };

    const handleVoterBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const b = e.target.value;
        setVoterBarangay(b);
        voterBarangayRef.current = b;
        setSearchError('');
        runSearch(voterQueryRef.current, voterLgu, b);
    };

    const handleSelectVoter = (voter: Voter) => {
        setSelectedVoter(voter);
        setShowDropdown(false);
        setVoterQuery('');
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
        setShowDropdown(false);
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-auto">

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

                        {/* Search-by field checkboxes */}
                        <div className="flex items-center gap-4 mb-3">
                            <span className="text-xs font-medium text-gray-500 shrink-0">Search by:</span>
                            {([
                                { label: 'Last Name', checked: searchLastname, setter: setSearchLastname, field: 'lastname' },
                                { label: 'First Name', checked: searchFirstname, setter: setSearchFirstname, field: 'firstname' },
                                { label: 'Middle Name', checked: searchMiddlename, setter: setSearchMiddlename, field: 'middlename' },
                            ] as const).map(({ label, checked, setter }) => (
                                <label key={label} className="flex items-center gap-1.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                            setter(e.target.checked);
                                            // Re-run search immediately with updated fields
                                            if (voterQueryRef.current.trim().length >= 2) {
                                                // Build updated fields inline since state hasn't updated yet
                                                const ln = label === 'Last Name' ? e.target.checked : searchLastname;
                                                const fn = label === 'First Name' ? e.target.checked : searchFirstname;
                                                const mn = label === 'Middle Name' ? e.target.checked : searchMiddlename;
                                                const fields: ('lastname' | 'firstname' | 'middlename')[] = [];
                                                if (ln) fields.push('lastname');
                                                if (fn) fields.push('firstname');
                                                if (mn) fields.push('middlename');
                                                searchFieldsRef.current = fields.length > 0 ? fields : ['lastname'];
                                                runSearch(voterQueryRef.current, voterLgu, voterBarangayRef.current);
                                            }
                                        }}
                                        className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                    />
                                    <span className="text-xs text-gray-700">{label}</span>
                                </label>
                            ))}
                        </div>

                        {/* Name search input */}
                        <div className="relative" ref={dropdownRef}>†
                            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 bg-white">
                                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Type a name to search voters…"
                                    value={voterQuery}
                                    onChange={handleVoterQueryChange}
                                    onKeyDown={(e) => {
                                        if (!showDropdown || voterResults.length === 0) return;
                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            const next = (highlightedIndex + 1) % voterResults.length;
                                            setHighlightedIndex(next);
                                            listItemRefs.current[next]?.scrollIntoView({ block: 'nearest' });
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            const prev = highlightedIndex <= 0 ? voterResults.length - 1 : highlightedIndex - 1;
                                            setHighlightedIndex(prev);
                                            listItemRefs.current[prev]?.scrollIntoView({ block: 'nearest' });
                                        } else if (e.key === 'Enter' && highlightedIndex >= 0) {
                                            e.preventDefault();
                                            handleSelectVoter(voterResults[highlightedIndex]);
                                            setHighlightedIndex(-1);
                                        } else if (e.key === 'Escape') {
                                            setShowDropdown(false);
                                            setHighlightedIndex(-1);
                                        }
                                    }}
                                    className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
                                    autoFocus
                                />
                                {isSearching && (
                                    <span className="text-xs text-teal-600 animate-pulse shrink-0">Searching…</span>
                                )}
                            </div>

                            {/* Results dropdown */}
                            {showDropdown && voterResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                    {voterResults.map((voter, idx) => (
                                        <button
                                            key={voter.id}
                                            ref={el => { listItemRefs.current[idx] = el; }}
                                            type="button"
                                            onClick={() => handleSelectVoter(voter)}
                                            onMouseEnter={() => setHighlightedIndex(idx)}
                                            className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between group border-b border-gray-50 last:border-b-0 ${idx === highlightedIndex
                                                ? 'bg-teal-500 text-white'
                                                : 'hover:bg-teal-50'
                                                }`}
                                        >
                                            <div>
                                                <p className={`text-sm font-medium ${idx === highlightedIndex ? 'text-white' : 'text-gray-800'}`}>
                                                    {voter.lastname}, {voter.firstname}
                                                    {voter.middlename ? ` ${voter.middlename}` : ''}
                                                    {voter.ext ? ` ${voter.ext}` : ''}
                                                </p>
                                                <p className={`text-xs mt-0.5 ${idx === highlightedIndex ? 'text-teal-100' : 'text-gray-500'}`}>
                                                    {[voter.purok, voter.brgy].filter(Boolean).join(', ') || 'No address info'}
                                                </p>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 transition-colors ${idx === highlightedIndex ? 'text-white' : 'text-gray-300 group-hover:text-teal-500'}`} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {searchError && voterQuery.trim().length >= 2 && !isSearching && (
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
