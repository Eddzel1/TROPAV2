import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { generateProfileImagePath } from './imageUtils';
import { getOutstandingMonths } from './utils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const supabaseHelpers = {
  async uploadProfilePicture(file: File, memberId: string): Promise<{ path: string; url: string }> {
    const filePath = generateProfileImagePath(memberId, file.name);
    const { error } = await supabase.storage.from('member-profiles').upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('member-profiles').getPublicUrl(filePath);
    return { path: filePath, url: urlData.publicUrl };
  },

  async deleteProfilePicture(path: string): Promise<void> {
    const { error } = await supabase.storage.from('member-profiles').remove([path]);
    if (error) throw error;
  },

  async uploadHousePicture(file: File, householdId: string): Promise<{ path: string; url: string }> {
    const fileExt = file.name.split('.').pop();
    const filePath = `${householdId}/house-${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('house-pictures').upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('house-pictures').getPublicUrl(filePath);
    return { path: filePath, url: urlData.publicUrl };
  },

  async deleteHousePicture(path: string): Promise<void> {
    const { error } = await supabase.storage.from('house-pictures').remove([path]);
    if (error) throw error;
  },

  async getHouseholds() {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .order('created_date', { ascending: false })
      .limit(500);
    if (error) throw error;
    return data || [];
  },

  async getHouseholdsPaginated(options: { 
    page: number; 
    limit: number; 
    searchTerm?: string;
    filterLGU?: string;
    filterBarangay?: string;
    filterPuroks?: string[];
    filterPurokIds?: string[];
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  }) {
    const { page, limit, searchTerm, filterLGU, filterBarangay, filterPuroks, filterPurokIds, sortField = 'created_date', sortDirection = 'desc' } = options;
    const from = (page - 1) * limit;
    const to = Math.min(from + limit - 1, 499);

    if (from >= 500) {
      return { data: [], count: 500 };
    }

    let query = supabase.from('households').select('*', { count: 'exact' });

    if (filterLGU) query = query.eq('lgu', filterLGU);
    if (filterBarangay) query = query.eq('barangay', filterBarangay);

    // Prefer filtering by purok_id when IDs are available (avoids text-case mismatches)
    if (filterPurokIds && filterPurokIds.length > 0) {
      query = query.in('purok_id', filterPurokIds);
    } else if (filterPuroks && filterPuroks.length > 0) {
      // Fallback: filter by text purok name (for entries without purok_id)
      query = query.in('purok', filterPuroks);
    }

    if (searchTerm) {
      query = query.or(`household_name.ilike.%${searchTerm}%,lgu.ilike.%${searchTerm}%,barangay.ilike.%${searchTerm}%`);
    }

    query = query.order(sortField, { ascending: sortDirection === 'asc' }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return { data: data || [], count: count !== null ? Math.min(count, 500) : 0 };
  },

  async createHousehold(household: Omit<Database['public']['Tables']['households']['Insert'], 'id' | 'created_date' | 'updated_date'>) {
    const { data, error } = await supabase.from('households').insert(household).select().single();
    if (error) throw error;
    return data;
  },

  async updateHousehold(id: string, updates: Database['public']['Tables']['households']['Update']) {
    const { data, error } = await supabase.from('households').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Household with id ${id} not found`);

    if (updates.lgu !== undefined || updates.barangay !== undefined || updates.purok !== undefined || updates.purok_id !== undefined) {
      const memberUpdates: any = {};
      if (updates.lgu !== undefined) memberUpdates.lgu = updates.lgu;
      if (updates.barangay !== undefined) memberUpdates.barangay = updates.barangay;
      if (updates.purok !== undefined) memberUpdates.purok = updates.purok;
      if (updates.purok_id !== undefined) memberUpdates.purok_id = updates.purok_id;

      const { error: memberError } = await supabase
        .from('family_members')
        .update(memberUpdates)
        .eq('household_id', id);
        
      if (memberError) {
        console.error('Failed to update location for household members:', memberError);
      }
    }

    return data;
  },

  async deleteHousehold(id: string) {
    const { error } = await supabase.from('households').delete().eq('id', id);
    if (error) throw error;
  },

  async getFamilyMembers(householdId?: string, hasCoordinatesOnly?: boolean) {
    let q = supabase
      .from('family_members')
      .select(`*, household:households!family_members_household_id_fkey(household_name, lgu, barangay, purok)`)
      .order('created_date', { ascending: false });
    if (householdId) q = q.eq('household_id', householdId);
    if (hasCoordinatesOnly) {
      q = q.not('latitude', 'is', null).not('longitude', 'is', null);
    }
    q = q.limit(500);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  async getFamilyMembersPaginated(options: { 
    page: number; 
    limit: number; 
    searchTerm?: string;
    searchLastname?: string;
    searchFirstname?: string;
    searchMiddlename?: string;
    householdId?: string;
    filterSector?: string;
    filterStatus?: string;
    filterLgu?: string;
    filterBarangay?: string;
  }) {
    const { page, limit, searchTerm, searchLastname, searchFirstname, searchMiddlename, householdId, filterSector, filterStatus, filterLgu, filterBarangay } = options;
    const from = (page - 1) * limit;
    const to = Math.min(from + limit - 1, 499);

    if (from >= 500) {
      return { data: [], count: 500 };
    }

    let query = supabase
      .from('family_members')
      .select(`*, household:households!family_members_household_id_fkey(household_name, lgu, barangay, purok)`, { count: 'exact' });

    if (householdId) {
      query = query.eq('household_id', householdId);
    }

    if (filterLgu) {
      query = query.eq('lgu', filterLgu);
    }

    if (filterBarangay) {
      query = query.eq('barangay', filterBarangay);
    }

    if (filterStatus) {
      if (filterStatus === 'member') query = query.eq('is_cooperative_member', true);
      else if (filterStatus === 'non-member') query = query.eq('is_cooperative_member', false);
      else if (filterStatus === 'leader') query = query.eq('is_household_leader', true);
      else if (filterStatus === 'voter') query = query.eq('is_voter', true);
    }

    if (filterSector) {
      query = query.ilike('sector', `%${filterSector}%`);
    }

    // Individual name field searches (applied as AND filters)
    if (searchLastname) {
      query = query.ilike('lastname', `%${searchLastname}%`);
    }
    if (searchFirstname) {
      query = query.ilike('firstname', `%${searchFirstname}%`);
    }
    if (searchMiddlename) {
      query = query.ilike('middlename', `%${searchMiddlename}%`);
    }

    // Generic search across multiple fields (used when no individual name filters are set)
    if (searchTerm && !searchLastname && !searchFirstname && !searchMiddlename) {
      query = query.or(`firstname.ilike.%${searchTerm}%,lastname.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%`);
    }

    query = query.order('created_date', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return { data: data || [], count: count !== null ? Math.min(count, 500) : 0 };
  },


  async createFamilyMember(member: Omit<Database['public']['Tables']['family_members']['Insert'], 'id' | 'created_date' | 'updated_date'>) {
    const { data, error } = await supabase.from('family_members').insert(member).select().single();
    if (error) throw error;
    return data;
  },

  async updateFamilyMember(id: string, updates: Database['public']['Tables']['family_members']['Update']) {
    const { data, error } = await supabase.from('family_members').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Family member with id ${id} not found`);
    return data;
  },

  async deleteFamilyMember(id: string) {
    const { error } = await supabase.from('family_members').delete().eq('id', id);
    if (error) throw error;
  },

  async getDuesPayments(memberId?: string, householdId?: string, limit?: number, sinceMonth?: string) {
    let q = supabase
      .from('dues_payments')
      .select(`*, member:family_members(firstname, lastname), household:households(household_name)`)
      .order('payment_date', { ascending: false });
    if (memberId) q = q.eq('member_id', memberId);
    if (householdId) q = q.eq('household_id', householdId);
    if (sinceMonth) q = q.gte('payment_month', sinceMonth);
    
    q = q.limit(limit || 500);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  },

  async getDuesPaymentsPaginated(options: {
    page: number;
    limit: number;
    searchTerm?: string;
    month?: string;
    status?: string;
    method?: string;
    matchingMemberIds?: string[];
    matchingHouseholdIds?: string[];
  }) {
    const { page, limit, searchTerm, month, status, method, matchingMemberIds, matchingHouseholdIds } = options;
    const from = (page - 1) * limit;
    const to = Math.min(from + limit - 1, 499);

    if (from >= 500) {
      return { data: [], count: 500 };
    }

    let query = supabase
      .from('dues_payments')
      .select(`*, member:family_members(firstname, lastname), household:households(household_name)`, { count: 'exact' });

    if (month) {
      query = query.eq('payment_month', month);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (method) {
      query = query.eq('payment_method', method);
    }

    if (searchTerm) {
      const orConditions: string[] = [];
      if (matchingMemberIds && matchingMemberIds.length > 0) {
        orConditions.push(`member_id.in.(${matchingMemberIds.join(',')})`);
      }
      if (matchingHouseholdIds && matchingHouseholdIds.length > 0) {
        orConditions.push(`household_id.in.(${matchingHouseholdIds.join(',')})`);
      }
      orConditions.push(`reference_number.ilike.%${searchTerm}%`);
      query = query.or(orConditions.join(','));
    }

    query = query.order('payment_date', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      data: data || [],
      count: count !== null ? Math.min(count, 500) : 0
    };
  },

  async getDuesPaymentsMetadata(memberIds?: string[]) {
    if (memberIds && memberIds.length > 0) {
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < memberIds.length; i += chunkSize) {
        chunks.push(memberIds.slice(i, i + chunkSize));
      }
      const results = await Promise.all(
        chunks.map(chunk =>
          supabase
            .from('dues_payments')
            .select('id, amount, status, payment_month, member_id, payment_for_month, payment_end_month, payment_method')
            .in('member_id', chunk)
        )
      );
      return results.flatMap(r => { if (r.error) throw r.error; return r.data || []; });
    }

    const { data, error } = await supabase
      .from('dues_payments')
      .select('id, amount, status, payment_month, member_id, payment_for_month, payment_end_month, payment_method')
      .order('payment_date', { ascending: false })
      .limit(500);
    if (error) throw error;
    return data || [];
  },

  async getDuesCollectionStats() {
    const { count: totalPaymentsCount, error: countError } = await supabase
      .from('dues_payments')
      .select('*', { count: 'exact', head: true });
    if (countError) throw countError;

    const pageSize = 1000;
    const paymentPages = Math.ceil((totalPaymentsCount || 0) / pageSize);
    let allPayments: { amount: number; status: string | null; payment_month: string; member_id: string; payment_for_month?: string | null; payment_end_month?: string | null }[] = [];
    
    if (totalPaymentsCount && totalPaymentsCount > 0) {
      const results = await Promise.all(
        Array.from({ length: paymentPages }, (_, i) =>
          supabase
            .from('dues_payments')
            .select('amount, status, payment_month, member_id, payment_for_month, payment_end_month')
            .range(i * pageSize, (i + 1) * pageSize - 1)
        )
      );
      allPayments = results.flatMap(r => { if (r.error) throw r.error; return r.data || []; });
    }

    const { count: totalCoopCount, error: coopCountError } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('is_cooperative_member', true);
    if (coopCountError) throw coopCountError;

    let coopMembers: { id: string; membership_date: string | null }[] = [];
    if (totalCoopCount && totalCoopCount > 0) {
      const coopPages = Math.ceil(totalCoopCount / pageSize);
      const results = await Promise.all(
        Array.from({ length: coopPages }, (_, i) =>
          supabase
            .from('family_members')
            .select('id, membership_date')
            .eq('is_cooperative_member', true)
            .range(i * pageSize, (i + 1) * pageSize - 1)
        )
      );
      coopMembers = results.flatMap(r => { if (r.error) throw r.error; return r.data || []; });
    }

    const completedPayments = allPayments.filter(p => p.status === 'completed');
    const totalCollection = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    const currentMonthISO = new Date().toISOString().slice(0, 7);
    const monthlyCollection = completedPayments
      .filter(p => p.payment_month === currentMonthISO)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const outstandingMembers = coopMembers.filter(member => {
      const memberPayments = allPayments.filter(p => p.member_id === member.id);
      const outstanding = getOutstandingMonths(
        member.membership_date ? new Date(member.membership_date) : undefined,
        memberPayments as any,
        currentMonthISO
      );
      return outstanding.length > 0;
    }).length;

    return {
      totalPayments: totalPaymentsCount || 0,
      totalCollection,
      monthlyCollection,
      outstandingMembers
    };
  },

  async createDuesPayment(payment: Omit<Database['public']['Tables']['dues_payments']['Insert'], 'id' | 'created_date' | 'updated_date'>) {
    const { data, error } = await supabase.from('dues_payments').insert(payment).select().single();
    if (error) throw error;
    return data;
  },

  async updateDuesPayment(id: string, updates: Database['public']['Tables']['dues_payments']['Update']) {
    const { data, error } = await supabase.from('dues_payments').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Dues payment with id ${id} not found`);
    return data;
  },

  async deleteDuesPayment(id: string) {
    const { error } = await supabase.from('dues_payments').delete().eq('id', id);
    if (error) throw error;
  },

  async getUsers() {
    const { data, error } = await supabase.from('users').select('*').order('created_date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createUser(user: Omit<Database['public']['Tables']['users']['Insert'], 'id' | 'created_date' | 'updated_date'> & { password?: string }) {
    const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${supabaseAnonKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Failed to create user');
    return result.user;
  },

  async updateUser(id: string, updates: Database['public']['Tables']['users']['Update']) {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`User with id ${id} not found`);
    return data;
  },

  async deleteUser(id: string) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  async getLocations() {
    const { data, error } = await supabase.from('locations').select('*').order('lgu', { ascending: true }).order('barangay', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createLocation(location: Omit<Database['public']['Tables']['locations']['Insert'], 'id' | 'created_date' | 'updated_date'>) {
    const { data, error } = await supabase.from('locations').insert(location).select().single();
    if (error) throw error;
    return data;
  },

  async updateLocation(id: string, updates: Database['public']['Tables']['locations']['Update']) {
    // 1. Fetch old location to know the old names for propagation
    const { data: oldLoc, error: fetchError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;

    // 2. Update the location
    const { data, error } = await supabase.from('locations').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Location with id ${id} not found`);

    // 3. Propagate changes if LGU or Barangay changed
    const lguChanged = updates.lgu !== undefined && updates.lgu !== oldLoc.lgu;
    const barangayChanged = updates.barangay !== undefined && updates.barangay !== oldLoc.barangay;
    
    if (lguChanged || barangayChanged) {
      const hhUpdates: any = {};
      if (lguChanged) hhUpdates.lgu = updates.lgu;
      if (barangayChanged) hhUpdates.barangay = updates.barangay;

      // Update households
      const { error: householdError } = await supabase
        .from('households')
        .update(hhUpdates)
        .eq('lgu', oldLoc.lgu)
        .eq('barangay', oldLoc.barangay);
        
      if (householdError) {
        console.error('Failed to update location for households:', householdError);
      }

      // Update family members
      const { error: memberError } = await supabase
        .from('family_members')
        .update(hhUpdates)
        .eq('lgu', oldLoc.lgu)
        .eq('barangay', oldLoc.barangay);
        
      if (memberError) {
        console.error('Failed to update location for family members:', memberError);
      }
    }

    return data;
  },

  async deleteLocation(id: string) {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw error;
  },

  async getPuroks(locationId?: string) {
    let query = supabase.from('puroks').select('*').order('name', { ascending: true });
    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  },

  async createPurok(purok: Omit<Database['public']['Tables']['puroks']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase.from('puroks').insert(purok).select().single();
    if (error) throw error;
    return data;
  },

  async ensurePurok(name: string, locationId: string): Promise<string> {
    const trimmed = name.trim();
    // 1. Search for existing purok under this location (case-insensitive)
    const { data: existing, error: searchError } = await supabase
      .from('puroks')
      .select('id')
      .eq('location_id', locationId)
      .ilike('name', trimmed)
      .maybeSingle();

    if (searchError) throw searchError;
    if (existing) return existing.id;

    // 2. If it does not exist, insert it
    const { data: inserted, error: insertError } = await supabase
      .from('puroks')
      .insert({ location_id: locationId, name: trimmed })
      .select('id')
      .single();

    if (insertError) throw insertError;
    return inserted.id;
  },

  async updatePurok(id: string, updates: Database['public']['Tables']['puroks']['Update']) {
    const { data, error } = await supabase.from('puroks').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Purok with id ${id} not found`);

    if (updates.name !== undefined) {
      // Propagate the name change to households
      const { error: householdError } = await supabase
        .from('households')
        .update({ purok: updates.name })
        .eq('purok_id', id);
        
      if (householdError) {
        console.error('Failed to update purok name for households:', householdError);
      }

      // Propagate the name change to family members
      const { error: memberError } = await supabase
        .from('family_members')
        .update({ purok: updates.name })
        .eq('purok_id', id);
        
      if (memberError) {
        console.error('Failed to update purok name for family members:', memberError);
      }
    }

    return data;
  },

  async deletePurok(id: string) {
    // 1. Update households to clear purok name and set purok_id to null
    const { error: householdError } = await supabase
      .from('households')
      .update({ purok: '', purok_id: null })
      .eq('purok_id', id);
      
    if (householdError) {
      console.error('Failed to clear purok for households on delete:', householdError);
    }

    // 2. Update family members to clear purok name and set purok_id to null
    const { error: memberError } = await supabase
      .from('family_members')
      .update({ purok: '', purok_id: null })
      .eq('purok_id', id);
      
    if (memberError) {
      console.error('Failed to clear purok for family members on delete:', memberError);
    }

    // 3. Delete from puroks table
    const { error } = await supabase.from('puroks').delete().eq('id', id);
    if (error) throw error;
  },

  async getOfficers(locationId: string, purokId?: string) {
    let query = supabase
      .from('officers')
      .select('*, member:family_members(firstname, lastname, contact_number, profile_picture_url)');
    
    if (purokId) {
      query = query.eq('level', 'purok').eq('purok_id', purokId);
    } else {
      query = query.eq('level', 'barangay').eq('location_id', locationId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async assignOfficer(officer: Omit<Database['public']['Tables']['officers']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
    if (officer.position !== 'Board Member') {
      const query = supabase.from('officers').delete();
      if (officer.level === 'purok') {
        await query.eq('level', 'purok').eq('purok_id', officer.purok_id!).eq('position', officer.position);
      } else {
        await query.eq('level', 'barangay').eq('location_id', officer.location_id).eq('position', officer.position);
      }
    }

    const { data, error } = await supabase.from('officers').insert(officer).select().single();
    if (error) throw error;
    return data;
  },

  async removeOfficer(id: string) {
    const { error } = await supabase.from('officers').delete().eq('id', id);
    if (error) throw error;
  },

  async searchVoters(
    lastname: string,
    firstname: string,
    middlename: string,
    lgu?: string,
    brgy?: string
  ) {
    if ((!lastname || lastname.trim().length < 2) && (!firstname || firstname.trim().length < 2) && (!middlename || middlename.trim().length < 2)) return [];

    let dbQuery = supabase
      .from('voters')
      .select('id, classification, lastname, firstname, ext, middlename, purok, brgy, lgu, district, precinct, clusteredprecinct, status');

    if (lastname && lastname.trim().length >= 2) dbQuery = dbQuery.ilike('lastname', `%${lastname.trim()}%`);
    if (firstname && firstname.trim().length >= 2) dbQuery = dbQuery.ilike('firstname', `%${firstname.trim()}%`);
    if (middlename && middlename.trim().length >= 2) dbQuery = dbQuery.ilike('middlename', `%${middlename.trim()}%`);

    if (lgu) dbQuery = dbQuery.ilike('lgu', lgu);
    if (brgy) dbQuery = dbQuery.ilike('brgy', brgy);

    if (lastname) dbQuery = dbQuery.order('lastname', { ascending: true });
    if (firstname) dbQuery = dbQuery.order('firstname', { ascending: true });
    if (middlename) dbQuery = dbQuery.order('middlename', { ascending: true });

    const { data, error } = await dbQuery.limit(100);
    if (error) throw error;
    return data ?? [];
  },





  async getDashboardStats() {
    const [
      householdsCount,
      membersCount,
      activeMembersCount,
      leadersCount,
      votersCount,
      paymentsResult
    ] = await Promise.all([
      supabase.from('households').select('*', { count: 'exact', head: true }),
      supabase.from('family_members').select('*', { count: 'exact', head: true }),
      supabase.from('family_members').select('*', { count: 'exact', head: true }).eq('is_cooperative_member', true),
      supabase.from('family_members').select('*', { count: 'exact', head: true }).eq('is_household_leader', true),
      supabase.from('family_members').select('*', { count: 'exact', head: true }).eq('is_voter', true),
      supabase.from('dues_payments').select('amount').eq('status', 'completed').eq('payment_month', new Date().toISOString().slice(0, 7))
    ]);

    if (householdsCount.error) throw householdsCount.error;
    if (membersCount.error) throw membersCount.error;
    if (activeMembersCount.error) throw activeMembersCount.error;
    if (leadersCount.error) throw leadersCount.error;
    if (votersCount.error) throw votersCount.error;
    if (paymentsResult.error) throw paymentsResult.error;

    const monthlyCollection = (paymentsResult.data || []).reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalHouseholds: householdsCount.count || 0,
      totalMembers: membersCount.count || 0,
      activeMembers: activeMembersCount.count || 0,
      totalLeaders: leadersCount.count || 0,
      totalVoters: votersCount.count || 0,
      monthlyCollection,
      pendingDues: 0
    };
  }
};
