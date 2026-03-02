import { useState, useEffect } from 'react';
import { supabase, supabaseHelpers } from '../lib/supabase';
import { Household, FamilyMember, DuesPayment, User, Location } from '../types';

function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? undefined : d;
}

export function useData() {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [payments, setPayments] = useState<DuesPayment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [householdsRes, membersRes, paymentsRes, usersRes, locationsRes] = await Promise.all([
        supabase.from('households').select('*').order('created_date', { ascending: false }),
        supabase.from('family_members').select('*').order('created_date', { ascending: false }),
        supabase.from('dues_payments').select('*').order('created_date', { ascending: false }),
        supabase.from('users').select('*').order('created_date', { ascending: false }),
        supabase.from('locations').select('*').order('lgu, barangay', { ascending: true }),
      ]);

      if (householdsRes.error) throw householdsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (usersRes.error) throw usersRes.error;
      if (locationsRes.error) throw locationsRes.error;

      const parsedHouseholds: Household[] = (householdsRes.data || []).map((h) => ({
        ...h,
        created_date: parseDate(h.created_date) || new Date(),
        updated_date: parseDate(h.updated_date) || new Date(),
      }));

      const parsedMembers: FamilyMember[] = (membersRes.data || []).map((m) => ({
        ...m,
        membership_date: parseDate(m.membership_date),
        birth_date: parseDate(m.birth_date),
        created_date: parseDate(m.created_date) || new Date(),
        updated_date: parseDate(m.updated_date) || new Date(),
      }));

      const parsedPayments: DuesPayment[] = (paymentsRes.data || []).map((p) => ({
        ...p,
        payment_date: parseDate(p.payment_date) || new Date(),
        created_date: parseDate(p.created_date) || new Date(),
        updated_date: parseDate(p.updated_date) || new Date(),
      }));

      const parsedUsers: User[] = (usersRes.data || []).map((u) => ({
        ...u,
        last_login: parseDate(u.last_login),
        created_date: parseDate(u.created_date) || new Date(),
        updated_date: parseDate(u.updated_date) || new Date(),
      }));

      const parsedLocations: Location[] = (locationsRes.data || []).map((l) => ({
        ...l,
        created_date: parseDate(l.created_date) || new Date(),
        updated_date: parseDate(l.updated_date) || new Date(),
      }));

      setHouseholds(parsedHouseholds);
      setMembers(parsedMembers);
      setPayments(parsedPayments);
      setUsers(parsedUsers);
      setLocations(parsedLocations);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Household CRUD operations
  const createHousehold = async (
    householdData: Omit<Household, 'id' | 'created_date' | 'updated_date'>
  ): Promise<Household> => {
    const { data, error } = await supabase
      .from('households')
      .insert([{ ...householdData }])
      .select()
      .single();

    if (error) throw error;
    const parsed = {
      ...data,
      created_date: parseDate(data.created_date) || new Date(),
      updated_date: parseDate(data.updated_date) || new Date(),
    };
    setHouseholds((prev) => [parsed, ...prev]);
    return parsed;
  };

  const updateHousehold = async (
    id: string,
    updates: Partial<Household>,
    housePictureFile?: File
  ): Promise<Household> => {
    let finalUpdates = { ...updates };

    // Upload house picture if provided
    if (housePictureFile) {
      const currentHousehold = households.find((h) => h.id === id);
      if (currentHousehold?.house_picture_path) {
        try {
          await supabaseHelpers.deleteHousePicture(currentHousehold.house_picture_path);
        } catch (err) {
          console.warn('Failed to delete old house picture:', err);
        }
      }
      const { path, url } = await supabaseHelpers.uploadHousePicture(housePictureFile, id);
      finalUpdates = { ...finalUpdates, house_picture_url: url, house_picture_path: path };
    }

    const { data, error } = await supabase
      .from('households')
      .update(finalUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const parsed = {
      ...data,
      created_date: parseDate(data.created_date) || new Date(),
      updated_date: parseDate(data.updated_date) || new Date(),
    };
    setHouseholds((prev) => prev.map((h) => (h.id === id ? parsed : h)));
    return parsed;
  };

  const deleteHousehold = async (id: string): Promise<void> => {
    const { error } = await supabase.from('households').delete().eq('id', id);
    if (error) throw error;
    setHouseholds((prev) => prev.filter((h) => h.id !== id));
    setMembers((prev) => prev.filter((m) => m.household_id !== id));
  };

  // Member CRUD operations
  const createMember = async (
    memberData: Omit<FamilyMember, 'id' | 'created_date' | 'updated_date'>
  ): Promise<FamilyMember> => {
    const { pendingProfileImage, pendingHouseImage, household_name, ...cleanData } = memberData as any;

    let householdId = cleanData.household_id;

    // Handle household leader creating a new household
    if (cleanData.is_household_leader && !householdId && household_name) {
      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .insert([{
          household_name: household_name,
          lgu: cleanData.lgu,
          barangay: cleanData.barangay,
          purok: cleanData.purok,
          total_members: 1,
          active_members: 1,
          status: 'active',
          created_by: 'current_user'
        }])
        .select()
        .single();

      if (householdError) throw householdError;

      const newHousehold = {
        ...householdData,
        created_date: parseDate(householdData.created_date) || new Date(),
        updated_date: parseDate(householdData.updated_date) || new Date(),
      };
      setHouseholds((prev) => [newHousehold, ...prev]);
      householdId = householdData.id;
    }

    const insertData = {
      ...cleanData,
      household_id: householdId,
      membership_date: cleanData.membership_date instanceof Date
        ? cleanData.membership_date.toISOString()
        : cleanData.membership_date,
      birth_date: cleanData.birth_date instanceof Date
        ? cleanData.birth_date.toISOString()
        : cleanData.birth_date,
    };

    const { data, error } = await supabase
      .from('family_members')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;

    const newMemberId = data.id;

    // Upload profile picture if pending
    if (pendingProfileImage) {
      try {
        const { path, url } = await supabaseHelpers.uploadProfilePicture(pendingProfileImage, newMemberId);
        await supabase
          .from('family_members')
          .update({ profile_picture_url: url, profile_picture_path: path })
          .eq('id', newMemberId);
        data.profile_picture_url = url;
        data.profile_picture_path = path;
      } catch (err) {
        console.error('Failed to upload profile picture:', err);
      }
    }

    // Upload house picture if leader with pending house image
    if (pendingHouseImage && householdId) {
      try {
        const { path, url } = await supabaseHelpers.uploadHousePicture(pendingHouseImage, householdId);
        await supabase
          .from('households')
          .update({ house_picture_url: url, house_picture_path: path })
          .eq('id', householdId);
        setHouseholds((prev) =>
          prev.map((h) =>
            h.id === householdId
              ? { ...h, house_picture_url: url, house_picture_path: path }
              : h
          )
        );
      } catch (err) {
        console.error('Failed to upload house picture:', err);
      }
    }

    // Update household member counts
    if (householdId) {
      const { data: updatedHousehold } = await supabase
        .from('households')
        .select('*')
        .eq('id', householdId)
        .single();

      if (updatedHousehold) {
        const parsed = {
          ...updatedHousehold,
          created_date: parseDate(updatedHousehold.created_date) || new Date(),
          updated_date: parseDate(updatedHousehold.updated_date) || new Date(),
        };
        setHouseholds((prev) => prev.map((h) => (h.id === householdId ? parsed : h)));
      }
    }

    const parsed: FamilyMember = {
      ...data,
      membership_date: parseDate(data.membership_date),
      birth_date: parseDate(data.birth_date),
      created_date: parseDate(data.created_date) || new Date(),
      updated_date: parseDate(data.updated_date) || new Date(),
    };
    setMembers((prev) => [parsed, ...prev]);
    return parsed;
  };

  const updateMember = async (
    id: string,
    updates: Partial<FamilyMember>
  ): Promise<FamilyMember> => {
    const { pendingProfileImage, pendingHouseImage, household_name, ...cleanUpdates } = updates as any;

    let householdId = cleanUpdates.household_id;
    const currentMember = members.find((m) => m.id === id);

    // Handle household leader updating household name
    if (cleanUpdates.is_household_leader && household_name && householdId) {
      await supabase
        .from('households')
        .update({ household_name: household_name })
        .eq('id', householdId);
    }

    // Upload house picture if provided
    if (pendingHouseImage && householdId) {
      try {
        const currentHousehold = households.find((h) => h.id === householdId);
        if (currentHousehold?.house_picture_path) {
          await supabaseHelpers.deleteHousePicture(currentHousehold.house_picture_path);
        }
        const { path, url } = await supabaseHelpers.uploadHousePicture(pendingHouseImage, householdId);
        await supabase
          .from('households')
          .update({ house_picture_url: url, house_picture_path: path })
          .eq('id', householdId);
        setHouseholds((prev) =>
          prev.map((h) =>
            h.id === householdId
              ? { ...h, house_picture_url: url, house_picture_path: path }
              : h
          )
        );
      } catch (err) {
        console.error('Failed to upload house picture:', err);
      }
    }

    const updateData = {
      ...cleanUpdates,
      membership_date: cleanUpdates.membership_date instanceof Date
        ? cleanUpdates.membership_date.toISOString()
        : cleanUpdates.membership_date,
      birth_date: cleanUpdates.birth_date instanceof Date
        ? cleanUpdates.birth_date.toISOString()
        : cleanUpdates.birth_date,
    };

    const { data, error } = await supabase
      .from('family_members')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const parsed: FamilyMember = {
      ...data,
      membership_date: parseDate(data.membership_date),
      birth_date: parseDate(data.birth_date),
      created_date: parseDate(data.created_date) || new Date(),
      updated_date: parseDate(data.updated_date) || new Date(),
    };
    setMembers((prev) => prev.map((m) => (m.id === id ? parsed : m)));

    // Update household member counts if household changed
    const oldHouseholdId = currentMember?.household_id;
    if (householdId && (householdId !== oldHouseholdId || cleanUpdates)) {
      const householdIds = new Set([householdId, oldHouseholdId].filter(Boolean));
      for (const hId of householdIds) {
        const { data: updatedHousehold } = await supabase
          .from('households')
          .select('*')
          .eq('id', hId)
          .single();

        if (updatedHousehold) {
          const parsedH = {
            ...updatedHousehold,
            created_date: parseDate(updatedHousehold.created_date) || new Date(),
            updated_date: parseDate(updatedHousehold.updated_date) || new Date(),
          };
          setHouseholds((prev) => prev.map((h) => (h.id === hId ? parsedH : h)));
        }
      }
    }

    return parsed;
  };

  const deleteMember = async (id: string): Promise<void> => {
    const member = members.find((m) => m.id === id);

    // Delete profile picture if exists
    if (member?.profile_picture_path) {
      try {
        await supabaseHelpers.deleteProfilePicture(member.profile_picture_path);
      } catch (err) {
        console.warn('Failed to delete profile picture:', err);
      }
    }

    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) throw error;
    setMembers((prev) => prev.filter((m) => m.id !== id));

    // Update household member count
    if (member?.household_id) {
      const { data: updatedHousehold } = await supabase
        .from('households')
        .select('*')
        .eq('id', member.household_id)
        .single();

      if (updatedHousehold) {
        const parsed = {
          ...updatedHousehold,
          created_date: parseDate(updatedHousehold.created_date) || new Date(),
          updated_date: parseDate(updatedHousehold.updated_date) || new Date(),
        };
        setHouseholds((prev) => prev.map((h) => (h.id === member.household_id ? parsed : h)));
      }
    }
  };

  // Payment CRUD operations
  const createPayment = async (
    paymentData: Omit<DuesPayment, 'id' | 'created_date' | 'updated_date'>
  ): Promise<DuesPayment> => {
    const insertData = {
      ...paymentData,
      payment_date: paymentData.payment_date instanceof Date
        ? paymentData.payment_date.toISOString()
        : paymentData.payment_date,
    };

    const { data, error } = await supabase
      .from('dues_payments')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    const parsed: DuesPayment = {
      ...data,
      payment_date: parseDate(data.payment_date) || new Date(),
      created_date: parseDate(data.created_date) || new Date(),
      updated_date: parseDate(data.updated_date) || new Date(),
    };
    setPayments((prev) => [parsed, ...prev]);
    return parsed;
  };

  const updatePayment = async (
    id: string,
    updates: Partial<DuesPayment>
  ): Promise<DuesPayment> => {
    const updateData = {
      ...updates,
      payment_date: updates.payment_date instanceof Date
        ? updates.payment_date.toISOString()
        : updates.payment_date,
    };

    const { data, error } = await supabase
      .from('dues_payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const parsed: DuesPayment = {
      ...data,
      payment_date: parseDate(data.payment_date) || new Date(),
      created_date: parseDate(data.created_date) || new Date(),
      updated_date: parseDate(data.updated_date) || new Date(),
    };
    setPayments((prev) => prev.map((p) => (p.id === id ? parsed : p)));
    return parsed;
  };

  const deletePayment = async (id: string): Promise<void> => {
    const { error } = await supabase.from('dues_payments').delete().eq('id', id);
    if (error) throw error;
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  // User CRUD operations
  const createUser = async (
    userData: Omit<User, 'id' | 'created_date' | 'updated_date'>
  ): Promise<User> => {
    const { password, ...userDataWithoutPassword } = userData as any;

    // Create auth user if password provided
    if (password && userData.email) {
      const { error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: password,
        email_confirm: true,
      });
      if (authError) {
        console.warn('Auth user creation warning:', authError.message);
      }
    }

    const { data, error } = await supabase
      .from('users')
      .insert([userDataWithoutPassword])
      .select()
      .single();

    if (error) throw error;
    const parsed: User = {
      ...data,
      last_login: parseDate(data.last_login),
      created_date: parseDate(data.created_date) || new Date(),
      updated_date: parseDate(data.updated_date) || new Date(),
    };
    setUsers((prev) => [parsed, ...prev]);
    return parsed;
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
    const { password, ...cleanUpdates } = updates as any;
    const { data, error } = await supabase
      .from('users')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const parsed: User = {
      ...data,
      last_login: parseDate(data.last_login),
      created_date: parseDate(data.created_date) || new Date(),
      updated_date: parseDate(data.updated_date) || new Date(),
    };
    setUsers((prev) => prev.map((u) => (u.id === id ? parsed : u)));
    return parsed;
  };

  const deleteUser = async (id: string): Promise<void> => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Location CRUD operations
  const createLocation = async (
    locationData: Omit<Location, 'id' | 'created_date' | 'updated_date'>
  ): Promise<Location> => {
    const { data, error } = await supabase
      .from('locations')
      .insert([locationData])
      .select()
      .single();

    if (error) throw error;
    const parsed: Location = {
      ...data,
      created_date: parseDate(data.created_date) || new Date(),
      updated_date: parseDate(data.updated_date) || new Date(),
    };
    setLocations((prev) => [...prev, parsed].sort((a, b) => a.lgu.localeCompare(b.lgu)));
    return parsed;
  };

  const updateLocation = async (
    id: string,
    updates: Partial<Location>
  ): Promise<Location> => {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    const parsed: Location = {
      ...data,
      created_date: parseDate(data.created_date) || new Date(),
      updated_date: parseDate(data.updated_date) || new Date(),
    };
    setLocations((prev) => prev.map((l) => (l.id === id ? parsed : l)));
    return parsed;
  };

  const deleteLocation = async (id: string): Promise<void> => {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw error;
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  return {
    households,
    members,
    payments,
    users,
    locations,
    loading,
    error,
    refetch: fetchData,
    createHousehold,
    updateHousehold,
    deleteHousehold,
    createMember,
    updateMember,
    deleteMember,
    createPayment,
    updatePayment,
    deletePayment,
    createUser,
    updateUser,
    deleteUser,
    createLocation,
    updateLocation,
    deleteLocation,
  };
}
