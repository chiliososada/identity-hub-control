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
      audit_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          success: boolean | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_attempts: {
        Row: {
          created_at: string | null
          email: string | null
          failure_reason: string | null
          id: string
          ip_address: unknown | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          failure_reason?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      auth_tokens: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          device_name: string | null
          expires_at: string
          id: string
          ip_address: unknown | null
          is_revoked: boolean | null
          last_used_at: string | null
          revoked_at: string | null
          revoked_reason: string | null
          tenant_id: string
          token_id: string
          token_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          device_name?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown | null
          is_revoked?: boolean | null
          last_used_at?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          tenant_id: string
          token_id: string
          token_type?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_revoked?: boolean | null
          last_used_at?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          tenant_id?: string
          token_id?: string
          token_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jwt_keys: {
        Row: {
          algorithm: string
          created_at: string | null
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          key_format: string | null
          key_id: string
          key_name: string
          key_size: number | null
          last_used_at: string | null
          private_key: string
          public_key: string
          usage_count: number | null
        }
        Insert: {
          algorithm?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          key_format?: string | null
          key_id: string
          key_name: string
          key_size?: number | null
          last_used_at?: string | null
          private_key: string
          public_key: string
          usage_count?: number | null
        }
        Update: {
          algorithm?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          key_format?: string | null
          key_id?: string
          key_name?: string
          key_size?: number | null
          last_used_at?: string | null
          private_key?: string
          public_key?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "jwt_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          last_ip_address: unknown | null
          last_login_at: string | null
          last_name: string | null
          locked_until: string | null
          login_attempts: number | null
          password_hash: string | null
          password_salt: string | null
          password_updated_at: string | null
          permissions: Json | null
          position: string | null
          reset_token: string | null
          reset_token_expires_at: string | null
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
          last_ip_address?: unknown | null
          last_login_at?: string | null
          last_name?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          password_hash?: string | null
          password_salt?: string | null
          password_updated_at?: string | null
          permissions?: Json | null
          position?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
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
          last_ip_address?: unknown | null
          last_login_at?: string | null
          last_name?: string | null
          locked_until?: string | null
          login_attempts?: number | null
          password_hash?: string | null
          password_salt?: string | null
          password_updated_at?: string | null
          permissions?: Json | null
          position?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
          role?: string
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_configs: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          api_key: string | null
          client_secret: string | null
          company_email: string | null
          company_info: Json | null
          company_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          domain: string | null
          expires_at: string | null
          features: Json | null
          id: string
          is_active: boolean
          last_verified_at: string | null
          license_key: string | null
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
          api_key?: string | null
          client_secret?: string | null
          company_email?: string | null
          company_info?: Json | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          domain?: string | null
          expires_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          license_key?: string | null
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
          api_key?: string | null
          client_secret?: string | null
          company_email?: string | null
          company_info?: Json | null
          company_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          domain?: string | null
          expires_at?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          last_verified_at?: string | null
          license_key?: string | null
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
      hash_password: {
        Args: { password: string; salt?: string }
        Returns: string
      }
      verify_password: {
        Args: { password: string; stored_hash: string }
        Returns: boolean
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
