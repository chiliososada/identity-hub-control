
export interface AuthToken {
  id: string;
  token_id: string;
  user_id: string;
  tenant_id: string;
  token_type: string;
  expires_at: string;
  last_used_at: string;
  created_at: string;
  is_revoked: boolean;
  revoked_at: string | null;
  revoked_reason: string | null;
  device_name: string | null;
  device_fingerprint: string | null;
  ip_address: string | null;
  user_agent: string | null;
  user_email?: string;
  tenant_name?: string;
}

export interface JWTKey {
  id: string;
  key_name: string;
  key_id: string;
  algorithm: string;
  private_key: string;
  public_key: string;
  is_active: boolean;
  is_primary: boolean;
  usage_count: number;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  created_by: string | null;
  description: string | null;
}
