import crypto from 'crypto';

export class SecurityService {
  private static readonly ALGORITHM = 'aes-256-cbc';
  // In production, use process.env.ENCRYPTION_KEY.
  // We use a stable key derived from a secret to ensure persistence across restarts.
  private static readonly KEY = process.env.ENCRYPTION_KEY
    ? crypto.scryptSync(process.env.ENCRYPTION_KEY, 'viva-salt', 32)
    : crypto.scryptSync('viva-banking-default-secret-key-2024', 'viva-salt', 32);

  /**
   * Encrypts sensitive text data (e.g., BVN, full account numbers)
   */
  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts encrypted text data
   */
  static decrypt(encryptedData: string): string {
    try {
      const [ivHex, encryptedText] = encryptedData.split(':');
      if (!ivHex || !encryptedText) return '';

      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }

  /**
   * Hashes a password using PBKDF2 with a random salt.
   * Returns a string in the format salt:hash
   */
  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  /**
   * Verifies a password against a stored PBKDF2 hash or legacy SHA-256 hash.
   */
  static verifyPassword(password: string, storedHash: string): boolean {
    try {
      // Handle legacy SHA-256 hashes or plain text from mock data
      if (!storedHash.includes(':')) {
        const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');

        // Timing safe comparison requires equal lengths.
        // We use a simple comparison for legacy/mock data if lengths differ.
        if (sha256Hash.length !== storedHash.length) {
          return password === storedHash;
        }

        return crypto.timingSafeEqual(
          Buffer.from(sha256Hash),
          Buffer.from(storedHash)
        ) || password === storedHash;
      }

      const [salt, originalHash] = storedHash.split(':');
      const hashToVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

      if (originalHash.length !== hashToVerify.length) {
        return false;
      }

      return crypto.timingSafeEqual(Buffer.from(originalHash), Buffer.from(hashToVerify));
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Generates a cryptographically secure random token (e.g., for password resets)
   */
  static generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generates a numeric One-Time Password (OTP)
   */
  static generateOTP(length = 6): string {
    const digits = '0123456789';
    let otp = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      otp += digits[bytes[i] % 10];
    }
    return otp;
  }

  /**
   * Masks sensitive information for display
   */
  static maskSensitiveData(data: string, type: 'email' | 'account' | 'generic' = 'generic'): string {
    if (!data) return '';

    if (type === 'email') {
      const [user, domain] = data.split('@');
      if (!domain) return '***';
      return `${user.charAt(0)}${'*'.repeat(Math.max(0, user.length - 2))}${user.length > 1 ? user.slice(-1) : ''}@${domain}`;
    }

    if (type === 'account') {
      return '*'.repeat(Math.max(0, data.length - 4)) + data.slice(-4);
    }

    if (data.length <= 4) return '*'.repeat(data.length);
    return data.slice(0, 2) + '*'.repeat(data.length - 4) + data.slice(-2);
  }

  /**
   * Timing-safe string comparison to prevent side-channel attacks
   */
  static compareStrings(a: string, b: string): boolean {
    if (a.length !== b.length) {
      // Still do a comparison to mitigate some timing differences,
      // though length difference is often unavoidable.
      crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  /**
   * Generates a challenge for WebAuthn registration or authentication
   */
  static generateBiometricChallenge(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Verifies a biometric signature (simplified WebAuthn-like verification)
   * In a real app, use @simplewebauthn/server for full spec compliance.
   */
  static verifyBiometricSignature(publicKey: string, challenge: string, signature: string): boolean {
    try {
      const verifier = crypto.createVerify('sha256');
      verifier.update(challenge);
      return verifier.verify(publicKey, signature, 'base64');
    } catch (error) {
      console.error('Biometric verification failed:', error);
      return false;
    }
  }
}
