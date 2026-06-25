import React, { useState } from 'react';
import { FamilyMember, Household, Voter } from '../../types';
import { X, Save, Plus, Trash2, Search, UserCheck } from 'lucide-react';
import { supabaseHelpers } from '../../lib/supabase';

interface BulkAddMemberFormProps {
    household?: Household;
    isOpen: boolean;
    onClose: () => void;
    onSave: (members: Partial<FamilyMember>[]) => Promise<void>;
}

interface MemberRow {
    id: string; // client-side temp id for rendering
    lastname: string;
    firstname: string;
    middlename: string;
    contact_number: string;
    birthdate: string;
    membership_date: string;
    sector: FamilyMember['sector'];
    year_level?: string;
    is_voter?: boolean;
    voter_barangay?: string;
    voter_id?: number;
    phic_member?: boolean;
    phic_no?: string;
}

const generateTempId = () => Math.random().toString(36).substr(2, 9);

const createEmptyRow = (householdLastname?: string): MemberRow => ({
    id: generateTempId(),
    lastname: householdLastname || '',
    firstname: '',
    middlename: '',
    contact_number: '',
    birthdate: '',
    membership_date: new Date().toISOString().split('T')[0],
    sector: 'General',
    year_level: '',
    is_voter: false,
    voter_barangay: '',
    voter_id: undefined,
    phic_member: false,
    phic_no: '',
});

// Format contact number as 09XX-XXX-XXXX
const formatContactNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7, 11)}`;
};

export function BulkAddMemberForm({ household, isOpen, onClose, onSave }: BulkAddMemberFormProps) {
    // Determine the likely last name from the household name
    const householdLastname = household?.household_name?.split(',')[0]?.trim();

    const [rows, setRows] = useState<MemberRow[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Voter Search Modal State
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [activeRowId, setActiveRowId] = useState<string | null>(null);
    const [voterLastName, setVoterLastName] = useState('');
    const [voterFirstName, setVoterFirstName] = useState('');
    const [voterMiddleName, setVoterMiddleName] = useState('');
    const [voterResults, setVoterResults] = useState<Voter[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [voterLgu] = useState('VALENCIA CITY');
    const [voterBarangay] = useState('');

    // Initialize with 3 empty rows when opened
    React.useEffect(() => {
        if (isOpen) {
            setRows([
                createEmptyRow(householdLastname),
                createEmptyRow(householdLastname),
                createEmptyRow(householdLastname),
            ]);
        }
    }, [isOpen, householdLastname]);

    if (!isOpen || !household) return null;

    const handleAddRow = () => {
        setRows([...rows, createEmptyRow(householdLastname)]);
    };

    const handleRemoveRow = (id: string) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const handleChange = (id: string, field: keyof MemberRow, value: string) => {
        setRows(rows.map(row => {
            if (row.id !== id) return row;

            if (field === 'phic_member') {
                return { ...row, phic_member: value === 'true', phic_no: value === 'false' ? '' : row.phic_no };
            }

            let finalValue = value;
            if (field === 'contact_number') {
                const cleaned = value.replace(/\D/g, '');
                if (cleaned.length > 11) return row; // Don't allow > 11 digits
                finalValue = formatContactNumber(value);
            }

            return { ...row, [field]: finalValue };
        }));
    };

    const handleSearchVoter = (id: string) => {
        setActiveRowId(id);
        const row = rows.find(r => r.id === id);
        // Pre-fill query with lastname if available
        setVoterLastName(row?.lastname || '');
        setVoterFirstName(row?.firstname || '');
        setVoterMiddleName(row?.middlename || '');
        setVoterResults([]);
        setSearchModalOpen(true);
    };

    const runSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (voterLastName.trim().length < 2 && voterFirstName.trim().length < 2 && voterMiddleName.trim().length < 2) return;

        setIsSearching(true);
        try {
            const results = await supabaseHelpers.searchVoters(
                voterLastName.trim(),
                voterFirstName.trim(),
                voterMiddleName.trim(),
                voterLgu || undefined,
                voterBarangay || undefined
            );
            setVoterResults(results as Voter[]);
        } catch (err) {
            console.error('Voter search error:', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectVoter = (voter: Voter) => {
        if (!activeRowId) return;

        setRows(rows.map(row => {
            if (row.id !== activeRowId) return row;
            return {
                ...row,
                firstname: voter.firstname || row.firstname,
                lastname: voter.lastname || row.lastname,
                middlename: voter.middlename || row.middlename,
                is_voter: true,
                voter_barangay: voter.brgy || '',
                voter_id: voter.id || undefined,
            };
        }));

        setSearchModalOpen(false);
        setActiveRowId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Filter out clearly empty rows (at least firstname and lastname required)
            const validRows = rows.filter(r => r.lastname.trim() !== '' && r.firstname.trim() !== '');

            if (validRows.length === 0) {
                alert('Please fill in at least one member with a First Name and Last Name.');
                setIsSaving(false);
                return;
            }

            const membersToSave: Partial<FamilyMember>[] = validRows.map(r => ({
                household_id: household.id,
                lgu: household.lgu,
                barangay: household.barangay,
                purok: household.purok,
                purok_id: household.purok_id,
                lastname: r.lastname,
                firstname: r.firstname,
                middlename: r.middlename,
                contact_number: r.contact_number,
                birth_date: r.birthdate ? new Date(r.birthdate) : undefined,
                age: r.birthdate ? Math.floor((Date.now() - new Date(r.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
                sector: r.sector,
                year_level: r.sector === 'Student' ? r.year_level : undefined,
                is_voter: r.is_voter || false,
                voter_barangay: r.voter_barangay || '',
                voter_id: r.voter_id || undefined,
                is_household_leader: false,
                is_cooperative_member: true,
                membership_date: r.membership_date ? new Date(r.membership_date) : new Date(),
                phic_member: r.phic_member || false,
                phic_no: r.phic_no || '',
            }));

            await onSave(membersToSave);
            onClose();
        } catch (error) {
            console.error('Failed to save bulk members:', error);
            alert('Failed to save some members. Please check console.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Bulk Add Members</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Adding to Household: <span className="font-semibold text-teal-700">{household.household_name}</span> ({household.lgu}, {household.barangay})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form id="bulk-add-form" onSubmit={handleSubmit}>
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                            {rows.map((row, index) => (
                                <div key={row.id} className="p-4 bg-white border border-gray-200 rounded-xl relative hover:border-teal-200 transition-colors shadow-sm">
                                    {/* Header with Row Indicator & Actions */}
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                                        <span className="text-sm font-bold text-teal-800 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-full">
                                            Member #{index + 1}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleSearchVoter(row.id)}
                                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                                                title="Search Voter Record"
                                            >
                                                <Search className="w-3.5 h-3.5" />
                                                Search Voter
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRow(row.id)}
                                                disabled={rows.length === 1}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-45"
                                                title="Remove row"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Fields Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                        {/* Last Name */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Last Name *</label>
                                            <input
                                                type="text"
                                                value={row.lastname}
                                                onChange={e => handleChange(row.id, 'lastname', e.target.value)}
                                                required
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                                placeholder="Last Name"
                                            />
                                        </div>
                                        {/* First Name */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">First Name *</label>
                                            <input
                                                type="text"
                                                value={row.firstname}
                                                onChange={e => handleChange(row.id, 'firstname', e.target.value)}
                                                required
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                                placeholder="First Name"
                                            />
                                        </div>
                                        {/* Middle Name */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Middle Name</label>
                                            <input
                                                type="text"
                                                value={row.middlename}
                                                onChange={e => handleChange(row.id, 'middlename', e.target.value)}
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                                placeholder="Middle Name"
                                            />
                                        </div>
                                        {/* Contact Number */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Contact No.</label>
                                            <input
                                                type="tel"
                                                value={row.contact_number}
                                                onChange={e => handleChange(row.id, 'contact_number', e.target.value)}
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                                placeholder="09XX-XXX-XXXX"
                                            />
                                        </div>

                                        {/* Birthday */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Birthday *</label>
                                            <input
                                                type="date"
                                                value={row.birthdate}
                                                onChange={e => handleChange(row.id, 'birthdate', e.target.value)}
                                                required
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-sans"
                                            />
                                        </div>
                                        {/* Membership Date */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Membership Date *</label>
                                            <input
                                                type="date"
                                                value={row.membership_date || ''}
                                                onChange={e => handleChange(row.id, 'membership_date', e.target.value)}
                                                required
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 font-sans"
                                            />
                                        </div>
                                        {/* Sector */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Sector</label>
                                            <div className="flex flex-col gap-1 relative">
                                                <details className="group relative">
                                                    <summary className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg cursor-pointer list-none flex justify-between items-center bg-white">
                                                        <span className="truncate">{row.sector || 'General'}</span>
                                                        <span className="text-gray-400 text-xs ml-1">▼</span>
                                                    </summary>
                                                    <div className="absolute z-[60] w-full min-w-[11rem] bg-white border border-gray-200 shadow-xl p-2 rounded-lg mt-1 left-0 max-h-48 overflow-y-auto">
                                                        {['General', 'Youth', 'Student', 'PWD', 'Senior Citizen', 'LGBTQ+', 'Indigenous People', 'Solo Parent'].map(option => (
                                                            <label key={option} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 cursor-pointer text-sm rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(row.sector || 'General').split(',').map(s => s.trim()).includes(option)}
                                                                    onChange={e => {
                                                                        const currentSectors = row.sector ? row.sector.split(',').map(s => s.trim()).filter(Boolean) : [];
                                                                        let newSectors = [...currentSectors];
                                                                        if (e.target.checked) {
                                                                            if (option === 'General') newSectors = ['General'];
                                                                            else {
                                                                                newSectors = newSectors.filter(s => s !== 'General');
                                                                                if (!newSectors.includes(option)) newSectors.push(option);
                                                                            }
                                                                        } else {
                                                                            newSectors = newSectors.filter(s => s !== option);
                                                                            if (newSectors.length === 0) newSectors = ['General'];
                                                                        }
                                                                        handleChange(row.id, 'sector', newSectors.join(', '));
                                                                    }}
                                                                    className="w-3.5 h-3.5 text-teal-600 rounded border-gray-300"
                                                                />
                                                                <span className="text-gray-700">{option}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </details>
                                                {(row.sector || '').includes('Student') && (
                                                    <select
                                                        value={row.year_level || ''}
                                                        onChange={e => handleChange(row.id, 'year_level', e.target.value)}
                                                        required
                                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                                    >
                                                        <option value="">Select Level</option>
                                                        <option value="Elementary">Elementary</option>
                                                        <option value="High School">High School</option>
                                                        <option value="College">College</option>
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                        {/* PHIC */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1 font-sans">PhilHealth (PHIC)</label>
                                            <div className="flex flex-col gap-1">
                                                <label className="flex items-center gap-1.5 cursor-pointer text-sm h-[38px]">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!row.phic_member}
                                                        onChange={e => handleChange(row.id, 'phic_member', e.target.checked ? 'true' : 'false')}
                                                        className="w-3.5 h-3.5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                                    />
                                                    <span className="text-xs font-medium text-gray-700 whitespace-nowrap">PHIC Member</span>
                                                </label>
                                                {row.phic_member && (
                                                    <input
                                                        type="text"
                                                        value={row.phic_no || ''}
                                                        onChange={e => handleChange(row.id, 'phic_no', e.target.value)}
                                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                                        placeholder="PHIC No."
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex justify-start">
                            <button
                                type="button"
                                onClick={handleAddRow}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Row
                            </button>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="bulk-add-form"
                        disabled={isSaving}
                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {isSaving ? 'Saving...' : 'Save All Members'}
                    </button>
                </div>
            </div>

            {/* Voter Search Modal */}
            {searchModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Search Voter Record</h3>
                            <button onClick={() => setSearchModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <form onSubmit={runSearch} className="flex flex-col gap-3 mb-1">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <input
                                        type="text"
                                        value={voterLastName}
                                        onChange={(e) => setVoterLastName(e.target.value)}
                                        placeholder="Last name..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 whitespace-nowrap text-sm"
                                        autoFocus
                                    />
                                    <input
                                        type="text"
                                        value={voterFirstName}
                                        onChange={(e) => setVoterFirstName(e.target.value)}
                                        placeholder="First name..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 whitespace-nowrap text-sm"
                                    />
                                    <input
                                        type="text"
                                        value={voterMiddleName}
                                        onChange={(e) => setVoterMiddleName(e.target.value)}
                                        placeholder="Middle name..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 whitespace-nowrap text-sm"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSearching || (voterLastName.length < 2 && voterFirstName.length < 2 && voterMiddleName.length < 2)}
                                        className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                                    >
                                        <Search className="w-4 h-4" />
                                        {isSearching ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {voterResults.length === 0 && !isSearching && (voterLastName.length >= 2 || voterFirstName.length >= 2) && (
                                <div className="text-center text-gray-500 py-8">No records found. Try adjusting your search.</div>
                            )}
                            {voterResults.length > 0 && (
                                <ul className="divide-y divide-gray-100">
                                    {voterResults.map(voter => (
                                        <li key={voter.id}>
                                            <button
                                                onClick={() => handleSelectVoter(voter)}
                                                className="w-full text-left p-3 hover:bg-teal-50 focus:bg-teal-50 rounded-lg transition-colors flex items-center justify-between group"
                                            >
                                                <div>
                                                    <div className="font-semibold text-gray-900 group-hover:text-teal-700">
                                                        {voter.lastname}, {voter.firstname} {voter.middlename}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                        {voter.lgu}, {voter.brgy} {voter.precinct ? `• Prec: ${voter.precinct}` : ''}
                                                    </div>
                                                </div>
                                                <UserCheck className="w-5 h-5 text-gray-400 group-hover:text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
