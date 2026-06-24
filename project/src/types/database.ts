export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      contribution_rates: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          effective_from: string
          id: string
          notes: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string
          effective_from: string
          id?: string
          notes?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          effective_from?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      dues_payments: {
        Row: {
          amount: number
          collected_by: string
          created_by: string | null
          created_date: string | null
          household_id: string
          id: string
          member_id: string
          months_covered: number | null
          notes: string | null
          payment_date: string
          payment_end_month: string | null
          payment_for_month: string | null
          payment_method: string | null
          payment_month: string
          reference_number: string | null
          status: string | null
          updated_date: string | null
        }
        Insert: {
          amount: number
          collected_by: string
          created_by?: string | null
          created_date?: string | null
          household_id: string
          id?: string
          member_id: string
          months_covered?: number | null
          notes?: string | null
          payment_date: string
          payment_end_month?: string | null
          payment_for_month?: string | null
          payment_method?: string | null
          payment_month: string
          reference_number?: string | null
          status?: string | null
          updated_date?: string | null
        }
        Update: {
          amount?: number
          collected_by?: string
          created_by?: string | null
          created_date?: string | null
          household_id?: string
          id?: string
          member_id?: string
          months_covered?: number | null
          notes?: string | null
          payment_date?: string
          payment_end_month?: string | null
          payment_for_month?: string | null
          payment_method?: string | null
          payment_month?: string
          reference_number?: string | null
          status?: string | null
          updated_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dues_payments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dues_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          }
        ]
      }
      family_members: {
        Row: {
          age: number | null
          barangay: string
          birth_date: string | null
          contact_number: string | null
          created_by: string | null
          created_date: string | null
          extension: string | null
          firstname: string
          household_id: string
          id: string
          is_cooperative_member: boolean | null
          is_household_leader: boolean | null
          is_voter: boolean | null
          lastname: string
          latitude: number | null
          lgu: string
          listing_status: string | null
          longitude: number | null
          membership_date: string | null
          middlename: string | null
          phic_member: boolean | null
          phic_no: string | null
          profile_picture_path: string | null
          profile_picture_url: string | null
          purok: string
          purok_id: string | null
          religion: string | null
          school: string | null
          sector: string | null
          updated_date: string | null
          voter_barangay: string | null
          voter_id: number | null
          year_level: string | null
        }
        Insert: {
          age?: number | null
          barangay: string
          birth_date?: string | null
          contact_number?: string | null
          created_by?: string | null
          created_date?: string | null
          extension?: string | null
          firstname: string
          household_id: string
          id?: string
          is_cooperative_member?: boolean | null
          is_household_leader?: boolean | null
          is_voter?: boolean | null
          lastname: string
          latitude?: number | null
          lgu: string
          listing_status?: string | null
          longitude?: number | null
          membership_date?: string | null
          middlename?: string | null
          phic_member?: boolean | null
          phic_no?: string | null
          profile_picture_path?: string | null
          profile_picture_url?: string | null
          purok: string
          purok_id?: string | null
          religion?: string | null
          school?: string | null
          sector?: string | null
          updated_date?: string | null
          voter_barangay?: string | null
          voter_id?: number | null
          year_level?: string | null
        }
        Update: {
          age?: number | null
          barangay?: string
          birth_date?: string | null
          contact_number?: string | null
          created_by?: string | null
          created_date?: string | null
          extension?: string | null
          firstname?: string
          household_id?: string
          id?: string
          is_cooperative_member?: boolean | null
          is_household_leader?: boolean | null
          is_voter?: boolean | null
          lastname?: string
          latitude?: number | null
          lgu?: string
          listing_status?: string | null
          longitude?: number | null
          membership_date?: string | null
          middlename?: string | null
          phic_member?: boolean | null
          phic_no?: string | null
          profile_picture_path?: string | null
          profile_picture_url?: string | null
          purok?: string
          purok_id?: string | null
          religion?: string | null
          school?: string | null
          sector?: string | null
          updated_date?: string | null
          voter_barangay?: string | null
          voter_id?: number | null
          year_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_purok_id_fkey"
            columns: ["purok_id"]
            isOneToOne: false
            referencedRelation: "puroks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "voters"
            referencedColumns: ["id"]
          }
        ]
      }
      households: {
        Row: {
          active_members: number | null
          barangay: string
          created_by: string | null
          created_date: string | null
          house_picture_path: string | null
          house_picture_url: string | null
          household_leader_id: string | null
          household_name: string
          id: string
          lgu: string
          purok: string
          purok_id: string | null
          status: string | null
          total_members: number | null
          updated_date: string | null
        }
        Insert: {
          active_members?: number | null
          barangay: string
          created_by?: string | null
          created_date?: string | null
          house_picture_path?: string | null
          house_picture_url?: string | null
          household_leader_id?: string | null
          household_name: string
          id?: string
          lgu: string
          purok: string
          purok_id?: string | null
          status?: string | null
          total_members?: number | null
          updated_date?: string | null
        }
        Update: {
          active_members?: number | null
          barangay?: string
          created_by?: string | null
          created_date?: string | null
          house_picture_path?: string | null
          house_picture_url?: string | null
          household_leader_id?: string | null
          household_name?: string
          id?: string
          lgu?: string
          purok?: string
          purok_id?: string | null
          status?: string | null
          total_members?: number | null
          updated_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_household_leader"
            columns: ["household_leader_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_purok_id_fkey"
            columns: ["purok_id"]
            isOneToOne: false
            referencedRelation: "puroks"
            referencedColumns: ["id"]
          }
        ]
      }
      locations: {
        Row: {
          barangay: string
          created_by: string | null
          created_date: string | null
          id: string
          lgu: string
          updated_date: string | null
        }
        Insert: {
          barangay: string
          created_by?: string | null
          created_date?: string | null
          id?: string
          lgu: string
          updated_date?: string | null
        }
        Update: {
          barangay?: string
          created_by?: string | null
          created_date?: string | null
          id?: string
          lgu?: string
          updated_date?: string | null
        }
        Relationships: []
      }
      officers: {
        Row: {
          created_at: string
          id: string
          level: string
          location_id: string
          member_id: string
          position: string
          purok_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          location_id: string
          member_id: string
          position: string
          purok_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          location_id?: string
          member_id?: string
          position?: string
          purok_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "officers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officers_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "officers_purok_id_fkey"
            columns: ["purok_id"]
            isOneToOne: false
            referencedRelation: "puroks"
            referencedColumns: ["id"]
          }
        ]
      }
      puroks: {
        Row: {
          created_at: string
          id: string
          location_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "puroks_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          created_by: string | null
          created_date: string | null
          email: string
          firstname: string
          id: string
          last_login: string | null
          lastname: string
          permissions: string[] | null
          role: string | null
          status: string | null
          updated_date: string | null
        }
        Insert: {
          created_by?: string | null
          created_date?: string | null
          email: string
          firstname: string
          id?: string
          last_login?: string | null
          lastname: string
          permissions?: string[] | null
          role?: string | null
          status?: string | null
          updated_date?: string | null
        }
        Update: {
          created_by?: string | null
          created_date?: string | null
          email?: string
          firstname?: string
          id?: string
          last_login?: string | null
          lastname?: string
          permissions?: string[] | null
          role?: string | null
          status?: string | null
          updated_date?: string | null
        }
        Relationships: []
      }
      voter_blocklist: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          image_path: string | null
          image_url: string | null
          note: string | null
          voter_id: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          note?: string | null
          voter_id: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          image_path?: string | null
          image_url?: string | null
          note?: string | null
          voter_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "voter_blocklist_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: true
            referencedRelation: "voters"
            referencedColumns: ["id"]
          }
        ]
      }
      voters: {
        Row: {
          brgy: string | null
          classification: string | null
          clusteredprecinct: string | null
          contactno: string | null
          created_at: string | null
          district: number | null
          dob: string | null
          ext: string | null
          firstname: string | null
          HHL: string | null
          id: number
          lastname: string | null
          lgu: string | null
          middlename: string | null
          note: string | null
          PC: string | null
          precinct: string | null
          purok: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          brgy?: string | null
          classification?: string | null
          clusteredprecinct?: string | null
          contactno?: string | null
          created_at?: string | null
          district?: number | null
          dob?: string | null
          ext?: string | null
          firstname?: string | null
          HHL?: string | null
          id: number
          lastname?: string | null
          lgu?: string | null
          middlename?: string | null
          note?: string | null
          PC?: string | null
          precinct?: string | null
          purok?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          brgy?: string | null
          classification?: string | null
          clusteredprecinct?: string | null
          contactno?: string | null
          created_at?: string | null
          district?: number | null
          dob?: string | null
          ext?: string | null
          firstname?: string | null
          HHL?: string | null
          id?: number
          lastname?: string | null
          lgu?: string | null
          middlename?: string | null
          note?: string | null
          PC?: string | null
          precinct?: string | null
          purok?: string | null
          status?: string | null
          updated_at?: string | null
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
