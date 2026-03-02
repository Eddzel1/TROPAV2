export interface Household {
  id: string;
  household_name: string;
  lgu: string;
  barangay: string;
  purok: string;
  total_members: number;
  active_members: number;
  status: 'active' | 'inactive';
  house_picture_url?: string;
  house_picture_path?: string;
  created_date: Date;
  updated_date: Date;
  created_by: string;
}

export interface FamilyMember {
  id: string;
  household_id: string;
  lastname: string;
  firstname: string;
  middlename?: string;
  extension?: string;
  lgu: string;
  barangay: string;
  purok: string;
  sector: 'General' | 'Youth' | 'Student' | 'PWD' | 'Senior Citizen' | 'LGBTQ+' | 'Indigenous People' | 'Solo Parent';

  is_voter: boolean;
  contact_number?: string;
  is_household_leader: boolean;
  is_cooperative_member: boolean;
  membership_date?: Date;
  birth_date?: Date;
  age?: number;
  latitude?: number;
  longitude?: number;
  religion?: string;
  school?: string;
  year_level?: string;
  listing_status?: string;

  profile_picture_url?: string;
  profile_picture_path?: string;
  created_date: Date;
  updated_date: Date;
}

export interface DuesPayment {
  id: string;
  member_id: string;
  household_id: string;
  amount: number;
  payment_month: string;
  months_covered?: number;
  payment_for_month?: string;
  payment_end_month?: string;
  payment_date: Date;
  payment_method: 'Cash' | 'Bank Transfer' | 'GCash' | 'PayMaya' | 'Check';
  reference_number?: string;
  notes?: string;
  status: 'completed' | 'pending' | 'cancelled';
  collected_by: string;
  created_by: string;
  created_date: Date;
  updated_date: Date;
}

export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: 'admin' | 'collector' | 'user';
  status: 'active' | 'inactive';
  permissions: string[];
  last_login?: Date;
  created_date: Date;
  updated_date: Date;
}

export interface Location {
  id: string;
  lgu: string;
  barangay: string;
  created_date: Date;
  updated_date: Date;
  created_by: string;
}

export interface Voter {
  id: number;
  classification?: string | null;
  lastname: string;
  firstname: string;
  ext?: string | null;
  middlename?: string | null;
  purok?: string | null;
  brgy?: string | null;
  lgu?: string | null;
  district?: number | null;
  precinct?: string | null;
  clusteredprecinct?: string | null;
  status?: string | null;
  note?: string | null;
}
