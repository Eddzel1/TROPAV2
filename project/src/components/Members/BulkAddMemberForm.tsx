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
    sector: FamilyMember['sector'];
    year_level?: string;
    is_voter?: boolean;
}

const generateTempId = () => Math.random().toString(36).substr(2, 9);

const createEmptyRow = (householdLastname?: string): MemberRow => ({
    id: generateTempId(),
    lastname: householdLastname || '',
    firstname: '',
    middlename: '',
    contact_number: '',
    birthdate: '',
    sector: 'General',
    year_level: '',
    is_voter: false,
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
    const [voterQuery, setVoterQuery] = useState('');
    const [voterResults, setVoterResults] = useState<Voter[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Using local search fields (similar to MemberForm)
    const [searchLastname, setSearchLastname] = useState(true);
    const [searchFirstname, setSearchFirstname] = useState(true);
    const [searchMiddlename, setSearchMiddlename] = useState(false);
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
        setVoterQuery(row?.lastname || '');
        setVoterResults([]);
        setSearchModalOpen(true);
    };

    const runSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (voterQuery.trim().length < 2) return;

        setIsSearching(true);
        try {
            const fields: ('lastname' | 'firstname' | 'middlename')[] = [];
            if (searchLastname) fields.push('lastname');
            if (searchFirstname) fields.push('firstname');
            if (searchMiddlename) fields.push('middlename');
            if (fields.length === 0) fields.push('lastname');

            const results = await supabaseHelpers.searchVoters(
                voterQuery.trim(),
                voterLgu || undefined,
                voterBarangay || undefined,
                fields
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
                lastname: r.lastname,
                firstname: r.firstname,
                middlename: r.middlename,
                contact_number: r.contact_number,
                birth_date: r.birthdate ? new Date(r.birthdate) : undefined,
                age: r.birthdate ? Math.floor((Date.now() - new Date(r.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : undefined,
                sector: r.sector,
                year_level: r.sector === 'Student' ? r.year_level : undefined,
                is_voter: r.is_voter || false,
                is_household_leader: false,
                is_cooperative_member: true,
                membership_date: new Date(),
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
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="pb-3 px-2 text-sm font-semibold text-gray-600 w-[15%]">Last Name *</th>
                                        <th className="pb-3 px-2 text-sm font-semibold text-gray-600 w-[20%]">First Name *</th>
                                        <th className="pb-3 px-2 text-sm font-semibold text-gray-600 w-[15%]">Middle Name</th>
                                        <th className="pb-3 px-2 text-sm font-semibold text-gray-600 w-[15%]">Contact No.</th>
                                        <th className="pb-3 px-2 text-sm font-semibold text-gray-600 w-[15%]">Birthday</th>
                                        <th className="pb-3 px-2 text-sm font-semibold text-gray-600 w-[15%]">Sector</th>
                                        <th className="pb-3 px-2 text-sm font-semibold text-gray-600 w-[10%] text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id} className="border-t border-gray-100">
                                            <td className="p-2 align-top">
                                                <input
                                                    type="text"
                                                    value={row.lastname}
                                                    onChange={e => handleChange(row.id, 'lastname', e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                    placeholder="Last Name"
                                                />
                                            </td>
                                            <td className="p-2 align-top">
                                                <input
                                                    type="text"
                                                    value={row.firstname}
                                                    onChange={e => handleChange(row.id, 'firstname', e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                    placeholder="First Name"
                                                />
                                            </td>
                                            <td className="p-2 align-top">
                                                <input
                                                    type="text"
                                                    value={row.middlename}
                                                    onChange={e => handleChange(row.id, 'middlename', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                    placeholder="Middle Name"
                                                />
                                            </td>
                                            <td className="p-2 align-top">
                                                <input
                                                    type="tel"
                                                    value={row.contact_number}
                                                    onChange={e => handleChange(row.id, 'contact_number', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                    placeholder="09XX-XXX-XXXX"
                                                />
                                            </td>
                                            <td className="p-2 align-top">
                                                <input
                                                    type="date"
                                                    value={row.birthdate}
                                                    onChange={e => handleChange(row.id, 'birthdate', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-sans"
                                                />
                                            </td>
                                            <td className="p-2 align-top">
                                                <div className="flex flex-col gap-2">
                                                    <select
                                                        value={row.sector}
                                                        onChange={e => handleChange(row.id, 'sector', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                    >
                                                        <option value="General">General</option>
                                                        <option value="Youth">Youth</option>
                                                        <option value="Student">Student</option>
                                                        <option value="PWD">PWD</option>
                                                        <option value="Senior Citizen">Senior Citizen</option>
                                                        <option value="LGBTQ+">LGBTQ+</option>
                                                        <option value="Indigenous People">Indigenous People</option>
                                                        <option value="Solo Parent">Solo Parent</option>
                                                    </select>
                                                    {row.sector === 'Student' && (
                                                        <select
                                                            value={row.year_level || ''}
                                                            onChange={e => handleChange(row.id, 'year_level', e.target.value)}
                                                            required
                                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                                        >
                                                            <option value="">Select Level</option>
                                                            <option value="Elementary">Elementary</option>
                                                            <option value="High School">High School</option>
                                                            <option value="College">College</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-2 text-center whitespace-nowrap align-top">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSearchVoter(row.id)}
                                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors mr-1"
                                                    title="Search Voter Record"
                                                >
                                                    <Search className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveRow(row.id)}
                                                    disabled={rows.length === 1}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:text-gray-400 disabled:hover:bg-transparent"
                                                    title="Remove row"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                            <form onSubmit={runSearch} className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={voterQuery}
                                    onChange={(e) => setVoterQuery(e.target.value)}
                                    placeholder="Search name..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={isSearching || voterQuery.length < 2}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Search className="w-4 h-4" />
                                    {isSearching ? 'Searching...' : 'Search'}
                                </button>
                            </form>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={searchLastname} onChange={e => setSearchLastname(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                                    Last Name
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={searchFirstname} onChange={e => setSearchFirstname(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                                    First Name
                                </label>
                                <label className="flex items-center gap-2">
                                    <input type="checkbox" checked={searchMiddlename} onChange={e => setSearchMiddlename(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                                    Middle Name
                                </label>
                            </div>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {voterResults.length === 0 && !isSearching && voterQuery.length >= 2 && (
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
