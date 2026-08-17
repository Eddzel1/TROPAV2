import { useState, useEffect } from 'react';
import { Search, Users, Home, MapPin, User, Shield, Calendar, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { FamilyMember, Household, Location } from '../../types';
import { transformFamilyMember, transformHousehold } from '../../hooks/useSupabase';
import { Header } from '../Layout/Header';

const sectorColors: Record<string, string> = { 'Youth': 'bg-blue-100 text-blue-700', 'Student': 'bg-indigo-100 text-indigo-800', 'College Student': 'bg-indigo-100 text-indigo-800', 'PWD': 'bg-purple-100 text-purple-700', 'Senior Citizen': 'bg-orange-100 text-orange-700', 'LGBTQ+': 'bg-pink-100 text-pink-700', 'Indigenous People': 'bg-green-100 text-green-700', 'Solo Parent': 'bg-yellow-100 text-yellow-700', 'General': 'bg-gray-100 text-gray-700' };

export function PublicSearch() {
  const [searchType, setSearchType] = useState<'households' | 'members'>('members');
  
  // Household search state
  const [householdName, setHouseholdName] = useState('');
  
  // Member search state
  const [lastname, setLastname] = useState('');
  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');

  // Location filters
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLgu, setSelectedLgu] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');

  const [debouncedHouseholdName, setDebouncedHouseholdName] = useState('');
  const [debouncedLastname, setDebouncedLastname] = useState('');
  const [debouncedFirstname, setDebouncedFirstname] = useState('');
  const [debouncedMiddlename, setDebouncedMiddlename] = useState('');

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state for viewing household members
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const handleViewMembers = async (household: Household) => {
    setSelectedHousehold(household);
    setLoadingMembers(true);
    setHouseholdMembers([]);
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('household_id', household.id);
      
      if (error) throw error;
      setHouseholdMembers((data || []).map(transformFamilyMember));
    } catch (err) {
      console.error('Error fetching household members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    const fetchLocations = async () => {
      const { data, error } = await supabase.from('locations').select('*');
      if (!error && data) {
        setLocations(data.map(row => ({
          id: row.id,
          lgu: row.lgu,
          barangay: row.barangay,
          created_date: new Date(row.created_date || ''),
          updated_date: new Date(row.updated_date || ''),
          created_by: row.created_by || ''
        })));
      }
    };
    fetchLocations();
  }, []);

  const uniqueLgus = Array.from(new Set(locations.map(l => l.lgu))).sort();
  const availableBarangays = locations
    .filter(l => !selectedLgu || l.lgu === selectedLgu)
    .map(l => l.barangay)
    .sort();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHouseholdName(householdName.trim());
      setDebouncedLastname(lastname.trim());
      setDebouncedFirstname(firstname.trim());
      setDebouncedMiddlename(middlename.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [householdName, lastname, firstname, middlename]);

  useEffect(() => {
    const search = async () => {
      if (searchType === 'households') {
        if (!debouncedHouseholdName && !selectedLgu && !selectedBarangay) {
          setHouseholds([]);
          return;
        }

        setLoading(true);
        setError(null);
        try {
          let query = supabase.from('households').select('*');
          
          if (debouncedHouseholdName) {
            query = query.ilike('household_name', `%${debouncedHouseholdName}%`);
          }
          if (selectedLgu) {
            query = query.eq('lgu', selectedLgu);
          }
          if (selectedBarangay) {
            query = query.eq('barangay', selectedBarangay);
          }

          const { data, error } = await query.limit(50);

          if (error) throw error;
          setHouseholds((data || []).map(transformHousehold));
        } catch (err: any) {
          console.error('Search error:', err);
          setError('An error occurred while searching households. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        const hasValidInput = debouncedLastname || debouncedFirstname || debouncedMiddlename || selectedLgu || selectedBarangay;
        
        if (!hasValidInput) {
          setMembers([]);
          return;
        }

        setLoading(true);
        setError(null);
        try {
          let query = supabase
            .from('family_members')
            .select(`*, household:households!family_members_household_id_fkey(household_name, lgu, barangay, purok)`);

          if (debouncedLastname) query = query.ilike('lastname', `%${debouncedLastname}%`);
          if (debouncedFirstname) query = query.ilike('firstname', `%${debouncedFirstname}%`);
          if (debouncedMiddlename) query = query.ilike('middlename', `%${debouncedMiddlename}%`);
          if (selectedLgu) query = query.eq('lgu', selectedLgu);
          if (selectedBarangay) query = query.eq('barangay', selectedBarangay);

          const { data, error } = await query.limit(50);

          if (error) throw error;
          setMembers((data || []).map(transformFamilyMember));
        } catch (err: any) {
          console.error('Search error:', err);
          setError('An error occurred while searching members. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    search();
  }, [searchType, debouncedHouseholdName, debouncedLastname, debouncedFirstname, debouncedMiddlename, selectedLgu, selectedBarangay]);

  const handleSearchTypeChange = (type: 'households' | 'members') => {
    setSearchType(type);
    setMembers([]);
    setHouseholds([]);
  };

  return (
    <div className="flex-1 bg-gray-50 min-h-screen overflow-auto">
      <Header title="Public Directory Search" subtitle="Search for households or members in the directory" />
      
      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
        {/* Search Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-6 pb-6 border-b border-gray-100 mb-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="radio" 
                className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                checked={searchType === 'members'}
                onChange={() => handleSearchTypeChange('members')}
              />
              <span className="text-gray-900 font-medium">Search Members</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="radio" 
                className="text-teal-600 focus:ring-teal-500 h-4 w-4"
                checked={searchType === 'households'}
                onChange={() => handleSearchTypeChange('households')}
              />
              <span className="text-gray-900 font-medium">Search Households</span>
            </label>
          </div>

          <div className="flex flex-col gap-4 mb-4">
            {/* Location Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                className="pl-3 pr-10 py-3 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full text-base lg:text-sm"
                value={selectedLgu}
                onChange={(e) => {
                  setSelectedLgu(e.target.value);
                  setSelectedBarangay('');
                }}
              >
                <option value="">All LGUs</option>
                {uniqueLgus.map(lgu => (
                  <option key={lgu} value={lgu}>{lgu}</option>
                ))}
              </select>
              <select
                className="pl-3 pr-10 py-3 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full text-base lg:text-sm"
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
              >
                <option value="">All Barangays</option>
                {availableBarangays.map(brgy => (
                  <option key={brgy} value={brgy}>{brgy}</option>
                ))}
              </select>
            </div>

            {/* Name Search Inputs */}
            {searchType === 'members' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    className="pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full text-base lg:text-sm"
                    placeholder="Last Name"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    className="pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full text-base lg:text-sm"
                    placeholder="First Name"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    className="pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full text-base lg:text-sm"
                    placeholder="Middle Name"
                    value={middlename}
                    onChange={(e) => setMiddlename(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  className="pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full text-base lg:text-sm"
                  placeholder="Search Household Name..."
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        )}

        {!loading && searchType === 'members' && members.length === 0 && (debouncedLastname || debouncedFirstname || debouncedMiddlename || selectedLgu || selectedBarangay) && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No members found matching your criteria.</p>
          </div>
        )}

        {!loading && searchType === 'households' && households.length === 0 && (debouncedHouseholdName || selectedLgu || selectedBarangay) && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <Home className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No households found matching your criteria.</p>
          </div>
        )}

        {!loading && searchType === 'members' && members.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Member</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Location</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Sector</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden">
                            {member.profile_picture_url ? <img src={member.profile_picture_url} alt={`${member.firstname} ${member.lastname}`} className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-teal-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.firstname} {member.middlename && `${member.middlename} `}{member.lastname}{member.extension && ` ${member.extension}`}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {member.is_household_leader && <div className="flex items-center gap-1"><Shield className="w-3 h-3" /><span>Leader</span></div>}
                              {member.age && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{member.age} years old</span></div>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <div>
                            <p>{member.lgu}</p>
                            <p className="text-xs">{member.barangay}, {member.purok}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {member.sector?.split(',').map(s => s.trim()).filter(Boolean).map(sector => (
                            <span key={sector} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${sectorColors[sector] || 'bg-gray-100 text-gray-700'}`}>{sector}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${member.is_cooperative_member ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                              {member.is_cooperative_member ? 'Member' : 'Non-member'}
                            </span>
                          </div>
                          {member.is_voter && <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Voter</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        {member.contact_number ? <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4" />{member.contact_number}</div> : <span className="text-sm text-gray-400">No contact</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="block lg:hidden">
              {members.map((member) => (
                <div key={member.id} className="border-b border-gray-100 p-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {member.profile_picture_url ? (<img src={member.profile_picture_url} alt={`${member.firstname} ${member.lastname}`} className="w-full h-full object-cover" />) : (<User className="w-6 h-6 text-teal-600" />)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{member.firstname} {member.middlename && `${member.middlename} `}{member.lastname}{member.extension && ` ${member.extension}`}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        {member.is_household_leader && (<div className="flex items-center gap-1"><Shield className="w-3 h-3" /><span>Leader</span></div>)}
                        {member.age && (<div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{member.age}y</span></div>)}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {member.lgu}, {member.barangay}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.sector?.split(',').map(s => s.trim()).filter(Boolean).map(sector => (
                          <span key={sector} className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${sectorColors[sector] || 'bg-gray-100 text-gray-700'}`}>{sector}</span>
                        ))}
                        {member.is_cooperative_member && <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Member</span>}
                        {member.is_voter && <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Voter</span>}
                      </div>
                      {member.contact_number && <div className="flex items-center gap-2 mt-2 text-sm text-gray-600"><Phone className="w-3 h-3" /><a href={`tel:${member.contact_number}`} className="text-teal-600">{member.contact_number}</a></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && searchType === 'households' && households.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Household Name</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Location</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-900">Members</th>
                  </tr>
                </thead>
                <tbody>
                  {households.map((household) => (
                    <tr key={household.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <Home className="w-5 h-5 text-teal-600" />
                          </div>
                          <p className="font-medium text-gray-900">{household.household_name}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <div>
                            <p>{household.lgu}</p>
                            <p className="text-xs">{household.barangay}, {household.purok}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {household.total_members} Members
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleViewMembers(household)}
                          className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-md text-sm font-medium transition-colors"
                        >
                          View Members
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="block lg:hidden">
              {households.map((household) => (
                <div key={household.id} className="border-b border-gray-100 p-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Home className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{household.household_name}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{household.lgu}, {household.barangay}, {household.purok}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {household.total_members} Members
                        </span>
                        <button
                          onClick={() => handleViewMembers(household)}
                          className="px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-md text-sm font-medium transition-colors"
                        >
                          View Members
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Household Members Modal */}
      {selectedHousehold && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <Home className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedHousehold.household_name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedHousehold.lgu}, {selectedHousehold.barangay}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedHousehold(null)} 
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {loadingMembers ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                </div>
              ) : householdMembers.length > 0 ? (
                <div className="space-y-4">
                  {householdMembers.map((member) => (
                    <div key={member.id} className="bg-gray-50 rounded-lg p-4 flex items-start gap-4">
                      <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {member.profile_picture_url ? (
                          <img src={member.profile_picture_url} alt="member" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-teal-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <p className="font-medium text-gray-900">
                            {member.firstname} {member.middlename && `${member.middlename} `}{member.lastname} {member.extension && member.extension}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {member.is_household_leader && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700 uppercase tracking-wider">
                                <Shield className="w-3 h-3" /> Leader
                              </span>
                            )}
                            {member.is_cooperative_member && (
                              <span className="inline-flex px-2 py-1 text-[10px] font-medium rounded-full bg-green-100 text-green-700 uppercase tracking-wider">
                                Member
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-2">
                          {member.age && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" /> {member.age} yrs
                            </div>
                          )}
                          {member.contact_number && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" /> {member.contact_number}
                            </div>
                          )}
                        </div>
                        {member.sector && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {member.sector.split(',').map(s => s.trim()).filter(Boolean).map(sector => (
                              <span key={sector} className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${sectorColors[sector] || 'bg-gray-200 text-gray-700'}`}>
                                {sector}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No members found for this household.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end flex-shrink-0 rounded-b-xl">
              <button 
                onClick={() => setSelectedHousehold(null)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
