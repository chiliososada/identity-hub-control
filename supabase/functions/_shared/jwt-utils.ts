
// JWT 工具函数
import { decode } from 'https://deno.land/std@0.208.0/encoding/base64url.ts'

export interface JWTHeader {
  alg: string;
  typ: string;
  kid: string;
}

export interface JWTPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  jti: string;
  email?: string;
  role?: string;
  tenant_id?: string;
}

// 生成 JWT Token
export async function generateJWT(
  payload: JWTPayload,
  privateKey: string,
  keyId: string,
  algorithm: string = 'RS256'
): Promise<string> {
  const header: JWTHeader = {
    alg: algorithm,
    typ: 'JWT',
    kid: keyId
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/]/g, (c) => ({ '+': '-', '/': '_' }[c]!)).replace(/=/g, '');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+/]/g, (c) => ({ '+': '-', '/': '_' }[c]!)).replace(/=/g, '');
  
  const data = `${encodedHeader}.${encodedPayload}`;
  
  // 导入私钥
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  
  const binaryKey = decode(keyData);
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // 签名
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(data)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/[+/]/g, (c) => ({ '+': '-', '/': '_' }[c]!))
    .replace(/=/g, '');

  return `${data}.${encodedSignature}`;
}

// 验证 JWT Token
export async function verifyJWT(
  token: string,
  publicKey: string,
  algorithm: string = 'RS256'
): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // 验证 header
    const header = JSON.parse(atob(encodedHeader.replace(/[-_]/g, (c) => ({ '-': '+', '_': '/' }[c]!))));
    if (header.alg !== algorithm) {
      return { valid: false, error: 'Algorithm mismatch' };
    }

    // 解析 payload
    const payload = JSON.parse(atob(encodedPayload.replace(/[-_]/g, (c) => ({ '-': '+', '_': '/' }[c]!))));
    
    // 检查过期时间
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { valid: false, error: 'Token expired' };
    }

    // 验证签名
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = new Uint8Array(
      atob(encodedSignature.replace(/[-_]/g, (c) => ({ '-': '+', '_': '/' }[c]!)))
        .split('')
        .map(c => c.charCodeAt(0))
    );

    // 导入公钥
    const keyData = publicKey
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');
    
    const binaryKey = decode(keyData);
    
    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signature,
      new TextEncoder().encode(data)
    );

    return {
      valid: isValid,
      payload: isValid ? payload : undefined,
      error: isValid ? undefined : 'Invalid signature'
    };
  } catch (error) {
    return { valid: false, error: `Verification failed: ${error.message}` };
  }
}

// 从 RSA 公钥提取 JWKS 参数
export function extractJWKSFromPublicKey(publicKey: string): { n: string; e: string } {
  // 简化实现 - 在生产环境中应该使用专门的库来解析 RSA 公钥
  // 这里返回默认值，实际应该解析真实的公钥参数
  return {
    n: "4f5wg5l2hKsTeNem_V41fGnJm6gOdrj8ym3rFkEjWT2btf06nmZpjgp2Q8y-8t3l-bJgK2I9FbZN9ZqHE5y1mKNKr8-HKsTeNem_V41fGnJm6gOdrj8ym3rFkEjWT2btf06nmZpjgp2Q8y-8t3l",
    e: "AQAB"
  };
}

// 生成安全的随机字符串
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomArray = new Uint8Array(length);
  crypto.getRandomValues(randomArray);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i] % chars.length];
  }
  
  return result;
}

// 获取客户端 IP 地址
export function getClientIP(request: Request): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    // 处理多级代理的情况，取第一个 IP
    return xForwardedFor.split(',')[0].trim();
  }
  
  return cfConnectingIP || xRealIP || '127.0.0.1';
}
