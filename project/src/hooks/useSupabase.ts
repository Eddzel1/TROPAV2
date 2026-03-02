import { useState, useEffect } from 'react';
import { supabaseHelpers } from '../lib/supabase';
import { Database } from '../types/database';
import { Household, FamilyMember, DuesPayment, User, Location } from '../types';

type Tables = Database['public']['Tables'];

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
            const transformedData: Household[] = data.map(row => ({
                id: row.id,
                household_name: row.household_name,
                lgu: row.lgu,
                barangay: row.barangay,
                purok: row.purok,
                household_leader_id: row.household_leader_id || undefined,
                total_members: row.total_members,
                active_members: row.active_members,
                status: row.status as 'active' | 'inactive',
                house_picture_url: row.house_picture_url || undefined,
                house_picture_path: row.house_picture_path || undefined,
                created_date: new Date(row.created_date),
                updated_date: new Date(row.updated_date),
                created_by: row.created_by
            }));
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
            const transformedHousehold: Household = {
                id: newHousehold.id,
                household_name: newHousehold.household_name,
                lgu: newHousehold.lgu,
                barangay: newHousehold.barangay,
                purok: newHousehold.purok,
                // household_leader_id: newHousehold.household_leader_id || undefined,
                total_members: newHousehold.total_members,
                active_members: newHousehold.active_members,
                status: newHousehold.status as 'active' | 'inactive',
                house_picture_url: newHousehold.house_picture_url || undefined,
                house_picture_path: newHousehold.house_picture_path || undefined,
                created_date: new Date(newHousehold.created_date),
                updated_date: new Date(newHousehold.updated_date),
                created_by: newHousehold.created_by
            };
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
            const transformedHousehold: Household = {
                id: updatedHousehold.id,
                household_name: updatedHousehold.household_name,
                lgu: updatedHousehold.lgu,
                barangay: updatedHousehold.barangay,
                purok: updatedHousehold.purok,
                // household_leader_id: updatedHousehold.household_leader_id || undefined,
                total_members: updatedHousehold.total_members,
                active_members: updatedHousehold.active_members,
                status: updatedHousehold.status as 'active' | 'inactive',
                house_picture_url: updatedHousehold.house_picture_url || undefined,
                house_picture_path: updatedHousehold.house_picture_path || undefined,
                created_date: new Date(updatedHousehold.created_date),
                updated_date: new Date(updatedHousehold.updated_date),
                created_by: updatedHousehold.created_by
            };
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
export function useFamilyMembers(householdId?: string) {
    const [members, setMembers] = useState<FamilyMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            console.log('Fetching family members...');
            const data = await supabaseHelpers.getFamilyMembers(householdId);
            console.log('Raw family members data from Supabase:', data);
            // Transform Supabase data to application types
            const transformedData: FamilyMember[] = data.map(row => ({
                id: row.id,
                household_id: row.household_id,
                lastname: row.lastname,
                firstname: row.firstname,
                middlename: row.middlename || undefined,
                extension: row.extension || undefined,
                lgu: row.lgu,
                barangay: row.barangay,
                purok: row.purok,
                sector: row.sector as FamilyMember['sector'],
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
            }));
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
            const pendingHouseImage = (member as any).pendingHouseImage as File | undefined;
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
                    status: 'active',
                    created_by: 'current_user'
                });
                householdId = newHousehold.id;
                console.log('Created household:', newHousehold);

                // Handle house picture upload for new household
                if (pendingHouseImage) {
                    try {
                        console.log('Uploading house picture for new household:', householdId);
                        const { path, url } = await supabaseHelpers.uploadHousePicture(pendingHouseImage, householdId);

                        // Update household with house picture info
                        await supabaseHelpers.updateHousehold(householdId, {
                            house_picture_url: url,
                            house_picture_path: path
                        });
                        console.log('House picture uploaded and household updated');
                    } catch (error) {
                        console.error('Failed to upload house picture for new household:', error);
                    }
                }
            }

            // Create the member with the household_id
            const memberData = { ...memberDataWithoutImage, household_id: householdId };

            const newMember = await supabaseHelpers.createFamilyMember(memberData);
            console.log('Created member:', newMember);

            // Handle profile image upload for new member
            let finalMemberData = newMember;
            if (pendingProfileImage) {
                try {
                    console.log('Uploading profile image for new member:', newMember.id);
                    const { path, url } = await supabaseHelpers.uploadProfilePicture(pendingProfileImage, newMember.id);

                    // Update member with profile picture info
                    finalMemberData = await supabaseHelpers.updateFamilyMember(newMember.id, {
                        profile_picture_url: url,
                        profile_picture_path: path
                    });
                    console.log('Profile image uploaded and member updated:', finalMemberData);
                } catch (error) {
                    console.error('Failed to upload profile image for new member:', error);
                    // Don't fail the entire operation, just log the error
                }
            }

            // Transform the new member data
            const transformedMember: FamilyMember = {
                id: finalMemberData.id,
                household_id: finalMemberData.household_id,
                lastname: finalMemberData.lastname,
                firstname: finalMemberData.firstname,
                middlename: finalMemberData.middlename || undefined,
                extension: finalMemberData.extension || undefined,
                lgu: finalMemberData.lgu,
                barangay: finalMemberData.barangay,
                purok: finalMemberData.purok,
                sector: finalMemberData.sector as FamilyMember['sector'],
                is_voter: finalMemberData.is_voter,
                contact_number: finalMemberData.contact_number || undefined,
                is_household_leader: finalMemberData.is_household_leader,
                is_cooperative_member: finalMemberData.is_cooperative_member,
                membership_date: finalMemberData.membership_date ? new Date(finalMemberData.membership_date) : undefined,
                birth_date: finalMemberData.birth_date ? new Date(finalMemberData.birth_date) : undefined,
                age: finalMemberData.age || undefined,
                latitude: finalMemberData.latitude || undefined,
                longitude: finalMemberData.longitude || undefined,
                religion: finalMemberData.religion || undefined,
                school: finalMemberData.school || undefined,
                year_level: finalMemberData.year_level || undefined,
                profile_picture_url: finalMemberData.profile_picture_url || undefined,
                profile_picture_path: finalMemberData.profile_picture_path || undefined,
                created_date: new Date(finalMemberData.created_date),
                updated_date: new Date(finalMemberData.updated_date),
                // created_by: finalMemberData.created_by
            };
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
            const transformedMember: FamilyMember = {
                id: updatedMember.id,
                household_id: updatedMember.household_id,
                lastname: updatedMember.lastname,
                firstname: updatedMember.firstname,
                middlename: updatedMember.middlename || undefined,
                extension: updatedMember.extension || undefined,
                lgu: updatedMember.lgu,
                barangay: updatedMember.barangay,
                purok: updatedMember.purok,
                sector: updatedMember.sector as FamilyMember['sector'],
                is_voter: updatedMember.is_voter,
                contact_number: updatedMember.contact_number || undefined,
                is_household_leader: updatedMember.is_household_leader,
                is_cooperative_member: updatedMember.is_cooperative_member,
                membership_date: updatedMember.membership_date ? new Date(updatedMember.membership_date) : undefined,
                birth_date: updatedMember.birth_date ? new Date(updatedMember.birth_date) : undefined,
                age: updatedMember.age || undefined,
                latitude: updatedMember.latitude || undefined,
                longitude: updatedMember.longitude || undefined,
                religion: updatedMember.religion || undefined,
                school: updatedMember.school || undefined,
                year_level: updatedMember.year_level || undefined,
                profile_picture_url: updatedMember.profile_picture_url || undefined,
                profile_picture_path: updatedMember.profile_picture_path || undefined,
                created_date: new Date(updatedMember.created_date),
                updated_date: new Date(updatedMember.updated_date),
                // created_by: updatedMember.created_by
            };
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
    }, [householdId]);

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
export function useDuesPayments(memberId?: string, householdId?: string) {
    const [payments, setPayments] = useState<DuesPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const data = await supabaseHelpers.getDuesPayments(memberId, householdId);
            // Transform Supabase data to application types
            const transformedData: DuesPayment[] = data.map(row => ({
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
                created_date: new Date(row.created_date),
                updated_date: new Date(row.updated_date),
                created_by: row.created_by
            }));
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
            const transformedPayment: DuesPayment = {
                id: newPayment.id,
                member_id: newPayment.member_id,
                household_id: newPayment.household_id,
                amount: newPayment.amount,
                payment_month: newPayment.payment_month,
                payment_for_month: newPayment.payment_for_month || '',
                payment_end_month: newPayment.payment_end_month || '',
                months_covered: newPayment.months_covered || 1,
                payment_date: new Date(newPayment.payment_date),
                payment_method: newPayment.payment_method as DuesPayment['payment_method'],
                reference_number: newPayment.reference_number || undefined,
                collected_by: newPayment.collected_by,
                notes: newPayment.notes || undefined,
                status: newPayment.status as DuesPayment['status'],
                created_date: new Date(newPayment.created_date),
                updated_date: new Date(newPayment.updated_date),
                created_by: newPayment.created_by
            };
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
            const transformedPayment: DuesPayment = {
                id: updatedPayment.id,
                member_id: updatedPayment.member_id,
                household_id: updatedPayment.household_id,
                amount: updatedPayment.amount,
                payment_month: updatedPayment.payment_month,
                payment_for_month: updatedPayment.payment_for_month || '',
                payment_end_month: updatedPayment.payment_end_month || '',
                months_covered: updatedPayment.months_covered || 1,
                payment_date: new Date(updatedPayment.payment_date),
                payment_method: updatedPayment.payment_method as DuesPayment['payment_method'],
                reference_number: updatedPayment.reference_number || undefined,
                collected_by: updatedPayment.collected_by,
                notes: updatedPayment.notes || undefined,
                status: updatedPayment.status as DuesPayment['status'],
                created_date: new Date(updatedPayment.created_date),
                updated_date: new Date(updatedPayment.updated_date),
                created_by: updatedPayment.created_by
            };
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
    }, [memberId, householdId]);

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
            const transformedData: User[] = data.map(row => ({
                id: row.id,
                email: row.email,
                firstname: row.firstname,
                lastname: row.lastname,
                role: row.role as User['role'],
                status: row.status as User['status'],
                last_login: row.last_login ? new Date(row.last_login) : undefined,
                permissions: row.permissions,
                created_date: new Date(row.created_date),
                updated_date: new Date(row.updated_date),
                created_by: row.created_by
            }));
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
            const transformedUser: User = {
                id: newUser.id,
                email: newUser.email,
                firstname: newUser.firstname,
                lastname: newUser.lastname,
                role: newUser.role as User['role'],
                status: newUser.status as User['status'],
                last_login: newUser.last_login ? new Date(newUser.last_login) : undefined,
                permissions: newUser.permissions,
                created_date: new Date(newUser.created_date),
                updated_date: new Date(newUser.updated_date),
                // created_by: newUser.created_by
            };

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
            const transformedUser: User = {
                id: updatedUser.id,
                email: updatedUser.email,
                firstname: updatedUser.firstname,
                lastname: updatedUser.lastname,
                role: updatedUser.role as User['role'],
                status: updatedUser.status as User['status'],
                last_login: updatedUser.last_login ? new Date(updatedUser.last_login) : undefined,
                permissions: updatedUser.permissions,
                created_date: new Date(updatedUser.created_date),
                updated_date: new Date(updatedUser.updated_date),
                // created_by: updatedUser.created_by
            };
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
                created_date: new Date(row.created_date),
                updated_date: new Date(row.updated_date),
                created_by: row.created_by
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
                created_date: new Date(newLocation.created_date),
                updated_date: new Date(newLocation.updated_date),
                created_by: newLocation.created_by
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
                created_date: new Date(updatedLocation.created_date),
                updated_date: new Date(updatedLocation.updated_date),
                created_by: updatedLocation.created_by
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