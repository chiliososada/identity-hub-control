
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
  name: string;
  algorithm: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  usage_count: number;
  last_used: string;
}
