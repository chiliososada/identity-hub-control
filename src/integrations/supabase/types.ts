export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      oauth_clients: {
        Row: {
          client_id: string
          client_name: string
          client_secret: string
          created_at: string | null
          id: string
          is_active: boolean | null
          redirect_uris: string[] | null
          scopes: string[] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          client_name: string
          client_secret: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          redirect_uris?: string[] | null
          scopes?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          client_name?: string
          client_secret?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          redirect_uris?: string[] | null
          scopes?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          email: string | null
          expires_at: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          is_company_admin: boolean | null
          is_test_account: boolean | null
          job_title: string | null
          last_login_at: string | null
          last_name: string | null
          permissions: Json | null
          position: string | null
          role: string
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_company_admin?: boolean | null
          is_test_account?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          permissions?: Json | null
          position?: string | null
          role?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_company_admin?: boolean | null
          is_test_account?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          permissions?: Json | null
          position?: string | null
          role?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_members: {
        Row: {
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role: Database["public"]["Enums"]["user_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          company_email: string | null
          company_info: Json | null
          company_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          domain: string | null
          id: string
          is_active: boolean
          locale: string | null
          max_users: number | null
          name: string
          stripe_customer_id: string | null
          subscription_plan: string | null
          tenant_type: Database["public"]["Enums"]["tenant_type"]
          time_zone: string | null
          updated_at: string
        }
        Insert: {
          company_email?: string | null
          company_info?: Json | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          locale?: string | null
          max_users?: number | null
          name: string
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          tenant_type: Database["public"]["Enums"]["tenant_type"]
          time_zone?: string | null
          updated_at?: string
        }
        Update: {
          company_email?: string | null
          company_info?: Json | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          locale?: string | null
          max_users?: number | null
          name?: string
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          tenant_type?: Database["public"]["Enums"]["tenant_type"]
          time_zone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      tenant_type: "personal" | "enterprise"
      user_role:
        | "owner"
        | "admin"
        | "member"
        | "viewer"
        | "developer"
        | "test_user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      tenant_type: ["personal", "enterprise"],
      user_role: [
        "owner",
        "admin",
        "member",
        "viewer",
        "developer",
        "test_user",
      ],
    },
  },
} as const
