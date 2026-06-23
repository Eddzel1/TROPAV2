import { useState, useEffect } from 'react';
import { supabase, supabaseHelpers } from '../lib/supabase';
import { Database } from '../types/database';
import { Household, FamilyMember, DuesPayment, User, Location, ContributionRate, Purok, Officer } from '../types';

type Tables = Database['public']['Tables'];

export function transformHousehold(row: any): Household {
    return {
        id: row.id,
        household_name: row.household_name,
        lgu: row.lgu,
        barangay: row.barangay,
        purok: row.purok,
        purok_id: row.purok_id || undefined,
        household_leader_id: row.household_leader_id || undefined,
        total_members: row.total_members || 0,
        active_members: row.active_members || 0,
        status: row.status as 'active' | 'inactive',
        house_picture_url: row.house_picture_url || undefined,
        house_picture_path: row.house_picture_path || undefined,
        created_date: new Date(row.created_date),
        updated_date: new Date(row.updated_date),
        created_by: row.created_by
    };
}

export function transformFamilyMember(row: any): FamilyMember {
    return {
        id: row.id,
        household_id: row.household_id,
        lastname: row.lastname,
        firstname: row.firstname,
        middlename: row.middlename || undefined,
        extension: row.extension || undefined,
        lgu: row.lgu,
        barangay: row.barangay,
        purok: row.purok,
        purok_id: row.purok_id || undefined,
        sector: row.sector || '',
        is_voter: row.is_voter,
        contact_number: row.contact_number || undefined,
        is_household_leader: row.is_household_leader,
        is_cooperative_member: row.is_cooperative_member,
        membership_date: row.membership_date ? new Date(row.membership_date) : undefined,
        birth_date: row.birth_date ? new Date(row.birth_date) : undefined,
        age: row.age || undefined,
        latitude: row.latitude || undefined,
        longitude: row.longitude || undefined,
        religion: row.religion || undefined,
        school: row.school || undefined,
        year_level: row.year_level || undefined,
        profile_picture_url: row.profile_picture_url || undefined,
        profile_picture_path: row.profile_picture_path || undefined,
        created_date: new Date(row.created_date),
        updated_date: new Date(row.updated_date),
        created_by: row.created_by
    };
}

export function transformDuesPayment(row: any): DuesPayment {
    return {
        id: row.id,
        member_id: row.member_id,
        household_id: row.household_id,
        amount: row.amount,
        payment_month: row.payment_month,
        payment_for_month: row.payment_for_month || '',
        payment_end_month: row.payment_end_month || '',
        months_covered: row.months_covered || 1,
        payment_date: new Date(row.payment_date),
        payment_method: row.payment_method as DuesPayment['payment_method'],
        reference_number: row.reference_number || undefined,
        collected_by: row.collected_by,
        notes: row.notes || undefined,
        status: row.status as DuesPayment['status'],
        created_date: new Date(row.created_date || ''),
        updated_date: new Date(row.updated_date || ''),
        created_by: row.created_by || '',
        member: row.member ? {
            firstname: row.member.firstname,
            lastname: row.member.lastname
        } : undefined,
        household: row.household ? {
            household_name: row.household.household_name
        } : undefined
    };
}

export function transformUser(row: any): User {
    return {
        id: row.id,
        email: row.email,
        firstname: row.firstname,
        lastname: row.lastname,
        role: row.role as User['role'],
        status: row.status as User['status'],
        last_login: row.last_login ? new Date(row.last_login) : undefined,
        permissions: row.permissions || [],
        created_date: new Date(row.created_date || ''),
        updated_date: new Date(row.updated_date || '')
    };
}

// Custom hook for households
export function useHouseholds() {
    const [households, setHouseholds] = useState<Household[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHouseholds = async () => {
        try {
            setLoading(true);
            console.log('Fetching households...');
            const data = await supabaseHelpers.getHouseholds();
            console.log('Raw households data from Supabase:', data);
            // Transform Supabase data to application types
            const transformedData: Household[] = data.map(transformHousehold);
            console.log('Transformed households data:', transformedData);
            setHouseholds(transformedData);
            setError(null);
        } catch (err) {
            console.error('Error fetching households:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const createHousehold = async (household: Omit<Tables['households']['Insert'], 'id' | 'created_date' | 'updated_date'>) => {
        try {
            console.log('Creating new household:', household);
            const newHousehold = await supabaseHelpers.createHousehold(household);
            console.log('Created household:', newHousehold);
            // Transform the new household data
            const transformedHousehold = transformHousehold(newHousehold);
            setHouseholds(prev => [transformedHousehold, ...prev]);
            return newHousehold;
        } catch (err) {
            console.error('Error creating household:', err);
            setError(err instanceof Error ? err.message : 'Failed to create household');
            throw err;
        }
    };

    const updateHousehold = async (id: string, updates: Tables['households']['Update']) => {
        try {
            console.log('Updating household:', id, updates);
            const updatedHousehold = await supabaseHelpers.updateHousehold(id, updates);
            console.log('Updated household:', updatedHousehold);
            // Transform the updated household data
            const transformedHousehold = transformHousehold(updatedHousehold);
            setHouseholds(prev => prev.map(h => h.id === id ? transformedHousehold : h));
            return updatedHousehold;
        } catch (err) {
            console.error('Error updating household:', err);
            setError(err instanceof Error ? err.message : 'Failed to update household');
            throw err;
        }
    };

    const deleteHousehold = async (id: string) => {
        try {
            console.log('Deleting household:', id);
            await supabaseHelpers.deleteHousehold(id);
            setHouseholds(prev => prev.filter(h => h.id !== id));
            console.log('Household deleted successfully');
        } catch (err) {
            console.error('Error deleting household:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete household');
            throw err;
        }
    };

    useEffect(() => {
        fetchHouseholds();
    }, []);

    return {
        households,
        loading,
        error,
        refetch: fetchHouseholds,
        createHousehold,
        updateHousehold,
        deleteHousehold
    };
}

// Custom hook for family members
export function useFamilyMembers(householdId?: string, hasCoordinatesOnly?: boolean) {
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            console.log('Fetching family members...');
            const data = await supabaseHelpers.getFamilyMembers(householdId, hasCoordinatesOnly);
            console.log('Raw family members data from Supabase:', data);
            // Transform Supabase data to application types
            const transformedData: FamilyMember[] = data.map(transformFamilyMember);
            console.log('Transformed family members data:', transformedData);
            setMembers(transformedData);
            setError(null);
        } catch (err) {
            console.error('Error fetching family members:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const createMember = async (member: Omit<Tables['family_members']['Insert'], 'id' | 'created_date' | 'updated_date'>) => {
        try {
            console.log('Creating new member:', member);

            // Extract pending profile image and house image if exists
            const pendingProfileImage = (member as any).pendingProfileImage as File | undefined;
            const { household_name, ...memberDataWithoutImage } = member as any;
            delete (memberDataWithoutImage as any).pendingProfileImage;
            delete (memberDataWithoutImage as any).pendingHouseImage;

            // If this is a household leader without a household_id, create the household first
            let householdId = memberDataWithoutImage.household_id;
            if (memberDataWithoutImage.is_household_leader && !memberDataWithoutImage.household_id && household_name) {
                console.log('Creating new household for leader:', household_name);
                const newHousehold = await supabaseHelpers.createHousehold({
                    household_name: household_name,
                    lgu: memberDataWithoutImage.lgu,
                    barangay: memberDataWithoutImage.barangay,
                    purok: memberDataWithoutImage.purok,
                    status: 'active'
                });
                householdId = newHousehold.id;
            }

            // Insert member with household_id
            const memberToCreate = {
                ...memberDataWithoutImage,
                household_id: householdId
            };
            const finalMemberData = await supabaseHelpers.createFamilyMember(memberToCreate);
            console.log('Created member:', finalMemberData);

            // Handle Profile Image Upload if exists
            if (pendingProfileImage) {
                try {
                    console.log('Uploading profile image for new member:', finalMemberData.id);
                    const uploadResult = await supabaseHelpers.uploadProfilePicture(pendingProfileImage, finalMemberData.id);
                    const updatedWithImage = await supabaseHelpers.updateFamilyMember(finalMemberData.id, {
                        profile_picture_url: uploadResult.url,
                        profile_picture_path: uploadResult.path
                    });
                    finalMemberData.profile_picture_url = updatedWithImage.profile_picture_url;
                    finalMemberData.profile_picture_path = updatedWithImage.profile_picture_path;
                } catch (error) {
                    console.error('Failed to upload profile image for new member:', error);
                    // Don't fail the entire operation, just log the error
                }
            }

            // Transform the new member data
            const transformedMember = transformFamilyMember(finalMemberData);
            setMembers(prev => [transformedMember, ...prev]);
            return finalMemberData;
        } catch (err) {
            console.error('Error creating member:', err);
            setError(err instanceof Error ? err.message : 'Failed to create member');
            throw err;
        }
    };

    const updateMember = async (id: string, updates: Tables['family_members']['Update']) => {
        try {
            console.log('Updating member:', id, updates);
            // Remove household_name from updates as it's not part of the family_members schema
            const { household_name, ...memberUpdates } = updates as any;
            const updatedMember = await supabaseHelpers.updateFamilyMember(id, memberUpdates);
            console.log('Updated member:', updatedMember);
            // Transform the updated member data
            const transformedMember = transformFamilyMember(updatedMember);
            setMembers(prev => prev.map(m => m.id === id ? transformedMember : m));
            return updatedMember;
        } catch (err) {
            console.error('Error updating member:', err);
            setError(err instanceof Error ? err.message : 'Failed to update member');
            throw err;
        }
    };

    const deleteMember = async (id: string) => {
        try {
            console.log('Deleting member:', id);

            // Get member data to check for profile picture
            const member = members.find(m => m.id === id);
            if (member?.profile_picture_path) {
                try {
                    await supabaseHelpers.deleteProfilePicture(member.profile_picture_path);
                    console.log('Profile picture deleted for member:', id);
                } catch (error) {
                    console.warn('Failed to delete profile picture for member:', id, error);
                }
            }

            await supabaseHelpers.deleteFamilyMember(id);
            setMembers(prev => prev.filter(m => m.id !== id));
            console.log('Member deleted successfully');
        } catch (err) {
            console.error('Error deleting member:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete member');
            throw err;
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [householdId, hasCoordinatesOnly]);

    return {
        members,
        loading,
        error,
        refetch: fetchMembers,
        createMember,
        updateMember,
        deleteMember
    };
}

// Custom hook for dues payments
export function useDuesPayments(memberId?: string, householdId?: string, limit?: number, sinceMonth?: string) {
    const [payments, setPayments] = useState<DuesPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const data = await supabaseHelpers.getDuesPayments(memberId, householdId, limit, sinceMonth);
            // Transform Supabase data to application types
            const transformedData: DuesPayment[] = data.map(transformDuesPayment);
            setPayments(transformedData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const createPayment = async (payment: Omit<Tables['dues_payments']['Insert'], 'id' | 'created_date' | 'updated_date'>) => {
        try {
            console.log('Creating new payment:', payment);
            const newPayment = await supabaseHelpers.createDuesPayment(payment);
            console.log('Created payment:', newPayment);
            // Transform the new payment data
            const transformedPayment: DuesPayment = transformDuesPayment(newPayment);
            setPayments(prev => [transformedPayment, ...prev]);
            return newPayment;
        } catch (err) {
            console.error('Error creating payment:', err);
            setError(err instanceof Error ? err.message : 'Failed to create payment');
            throw err;
        }
    };

    const updatePayment = async (id: string, updates: Tables['dues_payments']['Update']) => {
        try {
            console.log('Updating payment:', id, updates);
            const updatedPayment = await supabaseHelpers.updateDuesPayment(id, updates);
            console.log('Updated payment:', updatedPayment);
            // Transform the updated payment data
            const transformedPayment: DuesPayment = transformDuesPayment(updatedPayment);
            setPayments(prev => prev.map(p => p.id === id ? transformedPayment : p));
            return updatedPayment;
        } catch (err) {
            console.error('Error updating payment:', err);
            setError(err instanceof Error ? err.message : 'Failed to update payment');
            throw err;
        }
    };

    const deletePayment = async (id: string) => {
        try {
            console.log('Deleting payment:', id);
            await supabaseHelpers.deleteDuesPayment(id);
            setPayments(prev => prev.filter(p => p.id !== id));
            console.log('Payment deleted successfully');
        } catch (err) {
            console.error('Error deleting payment:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete payment');
            throw err;
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [memberId, householdId, limit, sinceMonth]);

    return {
        payments,
        loading,
        error,
        refetch: fetchPayments,
        createPayment,
        updatePayment,
        deletePayment
    };
}

// Custom hook for users
export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await supabaseHelpers.getUsers();
            // Transform Supabase data to application types
            const transformedData: User[] = data.map(transformUser);
            setUsers(transformedData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const createUser = async (user: Omit<Tables['users']['Insert'], 'id' | 'created_date' | 'updated_date'>) => {
        try {
            console.log('useSupabase: Creating user:', user);
            const newUser = await supabaseHelpers.createUser(user);
            console.log('useSupabase: User created successfully:', newUser);

            // Transform the new user data
            const transformedUser: User = transformUser(newUser);

            setUsers(prev => [transformedUser, ...prev]);
            return newUser;
        } catch (err) {
            console.error('useSupabase: Error creating user:', err);
            setError(err instanceof Error ? err.message : 'Failed to create user');
            throw err;
        }
    };

    const updateUser = async (id: string, updates: Tables['users']['Update']) => {
        try {
            const updatedUser = await supabaseHelpers.updateUser(id, updates);
            // Transform the updated user data
            const transformedUser: User = transformUser(updatedUser);
            setUsers(prev => prev.map(u => u.id === id ? transformedUser : u));
            return updatedUser;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update user');
            throw err;
        }
    };

    const deleteUser = async (id: string) => {
        try {
            await supabaseHelpers.deleteUser(id);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete user');
            throw err;
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return {
        users,
        loading,
        error,
        refetch: fetchUsers,
        createUser,
        updateUser,
        deleteUser
    };
}

// Custom hook for locations
export function useLocations() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLocations = async () => {
        try {
            setLoading(true);
            const data = await supabaseHelpers.getLocations();
            // Transform Supabase data to application types
            const transformedData: Location[] = data.map(row => ({
                id: row.id,
                lgu: row.lgu,
                barangay: row.barangay,
                created_date: new Date(row.created_date || ''),
                updated_date: new Date(row.updated_date || ''),
                created_by: row.created_by || ''
            }));
            setLocations(transformedData);
            setError(null);
        } catch (err) {
            console.error('Error fetching locations:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const createLocation = async (location: Omit<Tables['locations']['Insert'], 'id' | 'created_date' | 'updated_date'>) => {
        try {
            const newLocation = await supabaseHelpers.createLocation(location);
            const transformedLocation: Location = {
                id: newLocation.id,
                lgu: newLocation.lgu,
                barangay: newLocation.barangay,
                created_date: new Date(newLocation.created_date || ''),
                updated_date: new Date(newLocation.updated_date || ''),
                created_by: newLocation.created_by || ''
            };
            setLocations(prev => [transformedLocation, ...prev]);
            return newLocation;
        } catch (err) {
            console.error('Error creating location:', err);
            setError(err instanceof Error ? err.message : 'Failed to create location');
            throw err;
        }
    };

    const updateLocation = async (id: string, updates: Tables['locations']['Update']) => {
        try {
            const updatedLocation = await supabaseHelpers.updateLocation(id, updates);
            const transformedLocation: Location = {
                id: updatedLocation.id,
                lgu: updatedLocation.lgu,
                barangay: updatedLocation.barangay,
                created_date: new Date(updatedLocation.created_date || ''),
                updated_date: new Date(updatedLocation.updated_date || ''),
                created_by: updatedLocation.created_by || ''
            };
            setLocations(prev => prev.map(l => l.id === id ? transformedLocation : l));
            return updatedLocation;
        } catch (err) {
            console.error('Error updating location:', err);
            setError(err instanceof Error ? err.message : 'Failed to update location');
            throw err;
        }
    };

    const deleteLocation = async (id: string) => {
        try {
            await supabaseHelpers.deleteLocation(id);
            setLocations(prev => prev.filter(l => l.id !== id));
        } catch (err) {
            console.error('Error deleting location:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete location');
            throw err;
        }
    };

    useEffect(() => {
        fetchLocations();
    }, []);

    return {
        locations,
        loading,
        error,
        refetch: fetchLocations,
        createLocation,
        updateLocation,
        deleteLocation
    };
}

// Custom hook for dashboard statistics
export function useDashboardStats() {
    const [stats, setStats] = useState({
        totalHouseholds: 0,
        totalMembers: 0,
        activeMembers: 0,
        totalLeaders: 0,
        totalVoters: 0,
        monthlyCollection: 0,
        pendingDues: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await supabaseHelpers.getDashboardStats();
            setStats(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return {
        stats,
        loading,
        error,
        refetch: fetchStats
    };
}

// Custom hook for current authenticated user profile
export function useAuthProfile() {
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchProfile = async (session: any) => {
            if (!session?.user?.email) {
                if (mounted) {
                    setProfile(null);
                    setLoading(false);
                }
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', session.user.email)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching user profile:', error);
                }

                if (mounted && data) {
                    setProfile({
                        id: data.id,
                        email: data.email,
                        firstname: data.firstname,
                        lastname: data.lastname,
                        role: data.role as 'admin' | 'user' | 'collector',
                        status: data.status as 'active' | 'inactive',
                        last_login: data.last_login ? new Date(data.last_login) : undefined,
                        permissions: data.permissions || [],
                        created_date: new Date(data.created_date || ''),
                        updated_date: new Date(data.updated_date || '')
                    });
                }
            } catch (err) {
                console.error('Failed to fetch user profile:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        // Initial fetch
        supabase.auth.getSession().then(({ data: { session } }) => {
            fetchProfile(session);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            fetchProfile(session);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return { profile, loading };
}

// Custom hook for contribution rates
// Note: Uses (supabase as any) because the contribution_rates table isn't in the
// generated types yet. Run the SQL migration then regenerate types to fix.
export function useContributionRates() {
    const [rates, setRates] = useState<ContributionRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRates = async () => {
        try {
            setLoading(true);
            const { data, error: sbError } = await (supabase as any)
                .from('contribution_rates')
                .select('*')
                .order('effective_from', { ascending: true });
            if (sbError) throw sbError;
            const transformed: ContributionRate[] = ((data as any[]) || []).map((r: any) => ({
                id: r.id as string,
                amount: Number(r.amount),
                effective_from: new Date(r.effective_from),
                notes: r.notes || undefined,
                created_by: r.created_by as string,
                created_at: new Date(r.created_at),
            }));
            setRates(transformed);
            setError(null);
        } catch (err) {
            console.error('Error fetching contribution rates:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const createRate = async (amount: number, effectiveFrom: string, notes?: string): Promise<ContributionRate> => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const createdBy = session?.user?.email || 'unknown';
            const { data, error: sbError } = await (supabase as any)
                .from('contribution_rates')
                .insert({ amount, effective_from: effectiveFrom, notes: notes || null, created_by: createdBy })
                .select()
                .single();
            if (sbError) throw sbError;
            const row = data as any;
            const transformed: ContributionRate = {
                id: row.id as string,
                amount: Number(row.amount),
                effective_from: new Date(row.effective_from),
                notes: row.notes || undefined,
                created_by: row.created_by as string,
                created_at: new Date(row.created_at),
            };
            setRates(prev => [...prev, transformed].sort(
                (a, b) => a.effective_from.getTime() - b.effective_from.getTime()
            ));
            return transformed;
        } catch (err) {
            console.error('Error creating contribution rate:', err);
            throw err;
        }
    };

    useEffect(() => { fetchRates(); }, []);

    return { rates, loading, error, refetch: fetchRates, createRate };
}

export function useDuesPaymentsPaginated(
    members: FamilyMember[],
    households: Household[]
) {
    const [payments, setPayments] = useState<DuesPayment[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterMethod, setFilterMethod] = useState('');

    const fetchPaginatedPayments = async () => {
        try {
            setLoading(true);

            // Resolve member and household IDs for searching
            const matchingMemberIds = searchTerm
                ? members
                      .filter(m => `${m.firstname} ${m.lastname}`.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(m => m.id)
                      .slice(0, 100)
                : [];

            const matchingHouseholdIds = searchTerm
                ? households
                      .filter(h => h.household_name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(h => h.id)
                      .slice(0, 100)
                : [];

            const { data, count: totalCount } = await supabaseHelpers.getDuesPaymentsPaginated({
                page,
                limit,
                searchTerm,
                month: filterMonth,
                status: filterStatus,
                method: filterMethod,
                matchingMemberIds,
                matchingHouseholdIds
            });

            const transformedData: DuesPayment[] = data.map(transformDuesPayment);

            setPayments(transformedData);
            setCount(totalCount);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Reset page to 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [searchTerm, filterMonth, filterStatus, filterMethod]);

    useEffect(() => {
        fetchPaginatedPayments();
    }, [page, limit, searchTerm, filterMonth, filterStatus, filterMethod]);

    return {
        payments,
        count,
        loading,
        error,
        page,
        setPage,
        limit,
        setLimit,
        searchTerm,
        setSearchTerm,
        filterMonth,
        setFilterMonth,
        filterStatus,
        setFilterStatus,
        filterMethod,
        setFilterMethod,
        refetch: fetchPaginatedPayments
    };
}

export function useDuesStats() {
    const [stats, setStats] = useState({
        totalPayments: 0,
        totalCollection: 0,
        monthlyCollection: 0,
        outstandingMembers: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await supabaseHelpers.getDuesCollectionStats();
            setStats(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return {
        stats,
        loading,
        error,
        refetch: fetchStats
    };
}

export function useDuesPaymentsMetadata(memberIds?: string[]) {
    const [metadata, setMetadata] = useState<{
        id: string;
        amount: number;
        status: string;
        payment_month: string;
        member_id: string;
        payment_for_month: string;
        payment_end_month: string;
        payment_method: string;
    }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMetadata = async () => {
        try {
            setLoading(true);
            const data = await supabaseHelpers.getDuesPaymentsMetadata(memberIds);
            setMetadata(data as any);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const memberIdsKey = memberIds ? memberIds.join(',') : '';

    useEffect(() => {
        fetchMetadata();
    }, [memberIdsKey]);

    return {
        metadata,
        loading,
        error,
        refetch: fetchMetadata
    };
}

// Paginated hook for households
export function useHouseholdsPaginated() {
    const [households, setHouseholds] = useState<Household[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const limit = 8;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLGU, setFilterLGU] = useState('');
    const [filterBarangay, setFilterBarangay] = useState('');
    const [filterPuroks, setFilterPuroks] = useState<string[]>([]);
    const [sortField, setSortField] = useState<keyof Household>('household_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const fetchHouseholds = async () => {
        try {
            setLoading(true);
            const { data, count: totalCount } = await supabaseHelpers.getHouseholdsPaginated({
                page,
                limit,
                searchTerm,
                filterLGU,
                filterBarangay,
                filterPuroks,
                sortField: sortField as string,
                sortDirection
            });

            const transformedData: Household[] = data.map(transformHousehold);

            setHouseholds(transformedData);
            setCount(totalCount);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHouseholds();
    }, [page, limit, searchTerm, filterLGU, filterBarangay, filterPuroks, sortField, sortDirection]);

    return {
        households,
        count,
        loading,
        error,
        page,
        setPage,
        limit,
        searchTerm,
        setSearchTerm,
        filterLGU,
        setFilterLGU,
        filterBarangay,
        setFilterBarangay,
        filterPuroks,
        setFilterPuroks,
        sortField,
        setSortField,
        sortDirection,
        setSortDirection,
        refetch: fetchHouseholds
    };
}

// Paginated hook for family members
export function useFamilyMembersPaginated(householdId?: string) {
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const limit = 8;
    const [searchTerm, setSearchTerm] = useState('');
    const [searchLastname, setSearchLastname] = useState('');
    const [searchFirstname, setSearchFirstname] = useState('');
    const [searchMiddlename, setSearchMiddlename] = useState('');
    const [filterSector, setFilterSector] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterLgu, setFilterLgu] = useState('');
    const [filterBarangay, setFilterBarangay] = useState('');

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const { data, count: totalCount } = await supabaseHelpers.getFamilyMembersPaginated({
                page,
                limit,
                searchTerm,
                searchLastname,
                searchFirstname,
                searchMiddlename,
                householdId,
                filterSector,
                filterStatus,
                filterLgu,
                filterBarangay
            });

            const transformedData: FamilyMember[] = data.map(transformFamilyMember);

            setMembers(transformedData);
            setCount(totalCount);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [page, limit, searchTerm, searchLastname, searchFirstname, searchMiddlename, householdId, filterSector, filterStatus, filterLgu, filterBarangay]);

    return {
        members,
        count,
        loading,
        error,
        page,
        setPage,
        limit,
        searchTerm,
        setSearchTerm,
        searchLastname,
        setSearchLastname,
        searchFirstname,
        setSearchFirstname,
        searchMiddlename,
        setSearchMiddlename,
        filterSector,
        setFilterSector,
        filterStatus,
        setFilterStatus,
        filterLgu,
        setFilterLgu,
        filterBarangay,
        setFilterBarangay,
        refetch: fetchMembers
    };
}



export function transformPurok(row: any): Purok {
    return {
        id: row.id,
        location_id: row.location_id,
        name: row.name,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at)
    };
}

export function transformOfficer(row: any): Officer {
    return {
        id: row.id,
        level: row.level as Officer['level'],
        location_id: row.location_id,
        purok_id: row.purok_id || undefined,
        position: row.position as Officer['position'],
        member_id: row.member_id,
        created_at: new Date(row.created_at),
        updated_at: new Date(row.updated_at),
        member: row.member ? {
            firstname: row.member.firstname,
            lastname: row.member.lastname,
            contact_number: row.member.contact_number || undefined,
            profile_picture_url: row.member.profile_picture_url || undefined
        } : undefined
    };
}

export function usePuroks(locationId?: string) {
    const [puroks, setPuroks] = useState<Purok[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPuroks = async () => {
        try {
            setLoading(true);
            const data = await supabaseHelpers.getPuroks(locationId);
            setPuroks(data.map(transformPurok));
            setError(null);
        } catch (err) {
            console.error('Error fetching puroks:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPuroks();
    }, [locationId]);

    const createPurok = async (name: string, locId: string) => {
        try {
            const data = await supabaseHelpers.createPurok({ location_id: locId, name });
            const newPurok = transformPurok(data);
            setPuroks(prev => [...prev, newPurok].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })));
            return newPurok;
        } catch (err) {
            console.error('Error creating purok:', err);
            throw err;
        }
    };

    const updatePurok = async (id: string, name: string) => {
        try {
            const data = await supabaseHelpers.updatePurok(id, { name });
            const updated = transformPurok(data);
            setPuroks(prev => prev.map(p => p.id === id ? updated : p).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })));
            return updated;
        } catch (err) {
            console.error('Error updating purok:', err);
            throw err;
        }
    };

    const deletePurok = async (id: string) => {
        try {
            await supabaseHelpers.deletePurok(id);
            setPuroks(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Error deleting purok:', err);
            throw err;
        }
    };

    return {
        puroks,
        loading,
        error,
        createPurok,
        updatePurok,
        deletePurok,
        refetch: fetchPuroks
    };
}

export function useOfficers(locationId?: string, purokId?: string) {
    const [officers, setOfficers] = useState<Officer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOfficers = async () => {
        if (!locationId) {
            setOfficers([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await supabaseHelpers.getOfficers(locationId, purokId);
            setOfficers(data.map(transformOfficer));
            setError(null);
        } catch (err) {
            console.error('Error fetching officers:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOfficers();
    }, [locationId, purokId]);

    const assignOfficer = async (officerData: Omit<Database['public']['Tables']['officers']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
        try {
            await supabaseHelpers.assignOfficer(officerData);
            await fetchOfficers();
        } catch (err) {
            console.error('Error assigning officer:', err);
            throw err;
        }
    };

    const removeOfficer = async (id: string) => {
        try {
            await supabaseHelpers.removeOfficer(id);
            setOfficers(prev => prev.filter(o => o.id !== id));
        } catch (err) {
            console.error('Error removing officer:', err);
            throw err;
        }
    };

    return {
        officers,
        loading,
        error,
        assignOfficer,
        removeOfficer,
        refetch: fetchOfficers
    };
}