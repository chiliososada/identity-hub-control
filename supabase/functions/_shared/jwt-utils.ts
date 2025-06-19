
// JWT 工具函数 - 修正版
// 将标准base64解码替换base64url解码

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

// 标准 Base64 解码函数（用于 PEM 密钥）
function decodeBase64(str: string): Uint8Array {
  const binaryString = atob(str);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Base64url 解码函数（用于 JWT 部分）
function decodeBase64Url(str: string): Uint8Array {
  // 将 base64url 转换为标准 base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // 补充填充字符
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeBase64(base64);
}

// 生成 JWT Token
export async function generateJWT(
  payload: JWTPayload,
  privateKey: string,
  keyId: string,
  algorithm: string = 'RS256'
): Promise<string> {
  try {
    const header: JWTHeader = {
      alg: algorithm,
      typ: 'JWT',
      kid: keyId
    };

    // Base64Url 编码 header 和 payload
    const encodedHeader = btoa(JSON.stringify(header))
      .replace(/[+/]/g, (c) => ({ '+': '-', '/': '_' }[c]!))
      .replace(/=/g, '');
    
    const encodedPayload = btoa(JSON.stringify(payload))
      .replace(/[+/]/g, (c) => ({ '+': '-', '/': '_' }[c]!))
      .replace(/=/g, '');
    
    const data = `${encodedHeader}.${encodedPayload}`;
    
    // 清理私钥格式并进行标准 Base64 解码
    const keyData = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    console.log('Private key length after cleanup:', keyData.length);
    
    // 使用标准 Base64 解码替代 base64url 解码
    const binaryKey = decodeBase64(keyData);
    
    console.log('Decoded binary key length:', binaryKey.length);
    
    // 导入私钥
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

    // Base64Url 编码签名
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/[+/]/g, (c) => ({ '+': '-', '/': '_' }[c]!))
      .replace(/=/g, '');

    const jwt = `${data}.${encodedSignature}`;
    console.log('Generated JWT successfully');
    
    return jwt;
  } catch (error) {
    console.error('JWT generation error:', error);
    throw error;
  }
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
    const headerPadded = encodedHeader + '='.repeat((4 - encodedHeader.length % 4) % 4);
    const header = JSON.parse(atob(headerPadded.replace(/[-_]/g, (c) => ({ '-': '+', '_': '/' }[c]!))));
    
    if (header.alg !== algorithm) {
      return { valid: false, error: 'Algorithm mismatch' };
    }

    // 解析 payload
    const payloadPadded = encodedPayload + '='.repeat((4 - encodedPayload.length % 4) % 4);
    const payload = JSON.parse(atob(payloadPadded.replace(/[-_]/g, (c) => ({ '-': '+', '_': '/' }[c]!))));
    
    // 检查过期时间
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { valid: false, error: 'Token expired' };
    }

    // 验证签名
    const data = `${encodedHeader}.${encodedPayload}`;
    const signaturePadded = encodedSignature + '='.repeat((4 - encodedSignature.length % 4) % 4);
    const signature = new Uint8Array(
      atob(signaturePadded.replace(/[-_]/g, (c) => ({ '-': '+', '_': '/' }[c]!)))
        .split('')
        .map(c => c.charCodeAt(0))
    );

    // 清理公钥格式
    const keyData = publicKey
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s/g, '');
    
    // 使用标准 Base64 解码
    const binaryKey = decodeBase64(keyData);
    
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
    console.error('JWT verification error:', error);
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
