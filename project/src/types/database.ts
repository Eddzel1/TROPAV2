export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          household_name: string
          lgu: string
          barangay: string
          purok: string
          household_leader_id: string | null
          total_members: number
          active_members: number
          status: string
          house_picture_url: string | null
          house_picture_path: string | null
          created_date: string
          updated_date: string
          created_by: string
        }
        Insert: {
          id?: string
          household_name: string
          lgu: string
          barangay: string
          purok: string
          household_leader_id?: string | null
          total_members?: number
          active_members?: number
          status?: string
          house_picture_url?: string | null
          house_picture_path?: string | null
          created_date?: string
          updated_date?: string
          created_by?: string
        }
        Update: {
          id?: string
          household_name?: string
          lgu?: string
          barangay?: string
          purok?: string
          household_leader_id?: string | null
          total_members?: number
          active_members?: number
          status?: string
          house_picture_url?: string | null
          house_picture_path?: string | null
          created_date?: string
          updated_date?: string
          created_by?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          id: string
          household_id: string
          lastname: string
          firstname: string
          middlename: string | null
          extension: string | null
          lgu: string
          barangay: string
          purok: string
          sector: string
          is_voter: boolean
          contact_number: string | null
          is_household_leader: boolean
          is_cooperative_member: boolean
          membership_date: string | null
          birth_date: string | null
          age: number | null
          latitude: number | null
          longitude: number | null
          religion: string | null
          school: string | null
          year_level: string | null
          listing_status: string | null
          profile_picture_url: string | null
          profile_picture_path: string | null
          created_date: string
          updated_date: string
          created_by: string
        }
        Insert: {
          id?: string
          household_id: string
          lastname: string
          firstname: string
          middlename?: string | null
          extension?: string | null
          lgu: string
          barangay: string
          purok: string
          sector?: string
          is_voter?: boolean
          contact_number?: string | null
          is_household_leader?: boolean
          is_cooperative_member?: boolean
          membership_date?: string | null
          birth_date?: string | null
          age?: number | null
          latitude?: number | null
          longitude?: number | null
          religion?: string | null
          school?: string | null
          year_level?: string | null
          listing_status?: string | null
          profile_picture_url?: string | null
          profile_picture_path?: string | null
          created_date?: string
          updated_date?: string
          created_by?: string
        }
        Update: {
          id?: string
          household_id?: string
          lastname?: string
          firstname?: string
          middlename?: string | null
          extension?: string | null
          lgu?: string
          barangay?: string
          purok?: string
          sector?: string
          is_voter?: boolean
          contact_number?: string | null
          is_household_leader?: boolean
          is_cooperative_member?: boolean
          membership_date?: string | null
          birth_date?: string | null
          age?: number | null
          latitude?: number | null
          longitude?: number | null
          religion?: string | null
          school?: string | null
          year_level?: string | null
          listing_status?: string | null
          profile_picture_url?: string | null
          profile_picture_path?: string | null
          created_date?: string
          updated_date?: string
          created_by?: string
        }
        Relationships: []
      }
      dues_payments: {
        Row: {
          id: string
          member_id: string
          household_id: string
          amount: number
          payment_month: string
          payment_for_month: string | null
          payment_end_month: string | null
          months_covered: number | null
          payment_date: string
          payment_method: string
          reference_number: string | null
          collected_by: string
          notes: string | null
          status: string
          created_date: string
          updated_date: string
          created_by: string
        }
        Insert: {
          id?: string
          member_id: string
          household_id: string
          amount: number
          payment_month: string
          payment_for_month?: string | null
          payment_end_month?: string | null
          months_covered?: number | null
          payment_date: string
          payment_method?: string
          reference_number?: string | null
          collected_by: string
          notes?: string | null
          status?: string
          created_date?: string
          updated_date?: string
          created_by?: string
        }
        Update: {
          id?: string
          member_id?: string
          household_id?: string
          amount?: number
          payment_month?: string
          payment_for_month?: string | null
          payment_end_month?: string | null
          months_covered?: number | null
          payment_date?: string
          payment_method?: string
          reference_number?: string | null
          collected_by?: string
          notes?: string | null
          status?: string
          created_date?: string
          updated_date?: string
          created_by?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          firstname: string
          lastname: string
          role: string
          status: string
          last_login: string | null
          permissions: string[]
          created_date: string
          updated_date: string
          created_by: string
        }
        Insert: {
          id?: string
          email: string
          firstname: string
          lastname: string
          role?: string
          status?: string
          last_login?: string | null
          permissions?: string[]
          created_date?: string
          updated_date?: string
          created_by?: string
        }
        Update: {
          id?: string
          email?: string
          firstname?: string
          lastname?: string
          role?: string
          status?: string
          last_login?: string | null
          permissions?: string[]
          created_date?: string
          updated_date?: string
          created_by?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          lgu: string
          barangay: string
          created_date: string
          updated_date: string
          created_by: string
        }
        Insert: {
          id?: string
          lgu: string
          barangay: string
          created_date?: string
          updated_date?: string
          created_by?: string
        }
        Update: {
          id?: string
          lgu?: string
          barangay?: string
          created_date?: string
          updated_date?: string
          created_by?: string
        }
        Relationships: []
      }
      voters: {
        Row: {
          id: number
          classification: string | null
          lastname: string
          firstname: string
          ext: string | null
          middlename: string | null
          purok: string | null
          brgy: string | null
          lgu: string | null
          district: number | null
          precinct: string | null
          clusteredprecinct: string | null
          status: string | null
          note: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          classification?: string | null
          lastname: string
          firstname: string
          ext?: string | null
          middlename?: string | null
          purok?: string | null
          brgy?: string | null
          lgu?: string | null
          district?: number | null
          precinct?: string | null
          clusteredprecinct?: string | null
          status?: string | null
          note?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          classification?: string | null
          lastname?: string
          firstname?: string
          ext?: string | null
          middlename?: string | null
          purok?: string | null
          brgy?: string | null
          lgu?: string | null
          district?: number | null
          precinct?: string | null
          clusteredprecinct?: string | null
          status?: string | null
          note?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      voter_blocklist: {
        Row: {
          id: string
          voter_id: number
          note: string | null
          image_url: string | null
          image_path: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          voter_id: number
          note?: string | null
          image_url?: string | null
          image_path?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          voter_id?: number
          note?: string | null
          image_url?: string | null
          image_path?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
