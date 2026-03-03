import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { generateProfileImagePath } from './imageUtils';

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
    let allData: any[] = [];
    const limit = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .order('created_date', { ascending: false })
        .range(from, from + limit - 1);

      if (error) throw error;
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += limit;
      } else {
        hasMore = false;
      }
      if (data && data.length < limit) {
        hasMore = false;
      }
    }
    return allData;
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
    return data;
  },

  async deleteHousehold(id: string) {
    const { error } = await supabase.from('households').delete().eq('id', id);
    if (error) throw error;
  },

  async getFamilyMembers(householdId?: string) {
    let allData: any[] = [];
    const limit = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase.from('family_members').select(`*, household:households!family_members_household_id_fkey(household_name, lgu, barangay, purok)`).order('created_date', { ascending: false }).range(from, from + limit - 1);
      if (householdId) { query = query.eq('household_id', householdId); }
      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += limit;
      } else {
        hasMore = false;
      }
      if (data && data.length < limit) {
        hasMore = false;
      }
    }
    return allData;
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

  async getDuesPayments(memberId?: string, householdId?: string) {
    let allData: any[] = [];
    const limit = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase.from('dues_payments').select(`*, member:family_members(firstname, lastname), household:households(household_name)`).order('payment_date', { ascending: false }).range(from, from + limit - 1);
      if (memberId) { query = query.eq('member_id', memberId); }
      if (householdId) { query = query.eq('household_id', householdId); }
      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += limit;
      } else {
        hasMore = false;
      }
      if (data && data.length < limit) {
        hasMore = false;
      }
    }
    return allData;
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
    const { data, error } = await supabase.from('locations').update(updates).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) throw new Error(`Location with id ${id} not found`);
    return data;
  },

  async deleteLocation(id: string) {
    const { error } = await supabase.from('locations').delete().eq('id', id);
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
    const [householdsResult, membersResult, paymentsResult] = await Promise.all([
      supabase.from('households').select('id, status'),
      supabase.from('family_members').select('id, is_cooperative_member'),
      supabase.from('dues_payments').select('amount, status, payment_month').eq('status', 'completed')
    ]);
    if (householdsResult.error) throw householdsResult.error;
    if (membersResult.error) throw membersResult.error;
    if (paymentsResult.error) throw paymentsResult.error;
    const households = householdsResult.data || [];
    const members = membersResult.data || [];
    const payments = paymentsResult.data || [];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyCollection = payments.filter(p => p.payment_month === currentMonth).reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      totalHouseholds: households.length,
      totalMembers: members.length,
      activeMembers: members.filter(m => m.is_cooperative_member).length,
      monthlyCollection,
      pendingDues: 0
    };
  }
};
