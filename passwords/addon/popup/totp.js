// TOTP Implementation - Zero External Dependencies
// Uses Web Crypto API for HMAC-SHA1

const TOTP = {
  // Base32 alphabet (RFC 4648)
  base32Chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
  
  /**
   * Decode Base32 string to Uint8Array
   * @param {string} base32 - Base32 encoded secret
   * @returns {Uint8Array}
   */
  decodeBase32(base32) {
    // Remove spaces and convert to uppercase
    base32 = base32.replace(/\s/g, '').toUpperCase();
    
    const chars = this.base32Chars;
    let bits = 0;
    let value = 0;
    let index = 0;
    const output = new Uint8Array(Math.ceil(base32.length * 5 / 8));
    
    for (let i = 0; i < base32.length; i++) {
      const char = base32[i];
      if (char === '=') break;
      
      const charValue = chars.indexOf(char);
      if (charValue === -1) {
        throw new Error('Invalid base32 character: ' + char);
      }
      
      value = (value << 5) | charValue;
      bits += 5;
      
      if (bits >= 8) {
        output[index++] = (value >>> (bits - 8)) & 0xFF;
        bits -= 8;
      }
    }
    
    return output.slice(0, index);
  },
  
  /**
   * Convert number to 8-byte array (big endian)
   * @param {number} num
   * @returns {Uint8Array}
   */
  numberToBytes(num) {
    const bytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      bytes[i] = num & 0xFF;
      num = Math.floor(num / 256);
    }
    return bytes;
  },
  
  /**
   * Generate HMAC-SHA1
   * @param {Uint8Array} key
   * @param {Uint8Array} message
   * @returns {Promise<Uint8Array>}
   */
  async hmacSha1(key, message) {
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
    return new Uint8Array(signature);
  },
  
  /**
   * Generate TOTP token
   * @param {string} secret - Base32 encoded secret
   * @param {number} [timeStep=30] - Time step in seconds (default: 30)
   * @param {number} [digits=6] - Number of digits in token (default: 6)
   * @param {number} [timestamp] - Unix timestamp in seconds (default: current time)
   * @returns {Promise<string>}
   */
  async generateToken(secret, timeStep = 30, digits = 6, timestamp = null) {
    try {
      // Decode base32 secret
      const key = this.decodeBase32(secret);
      
      // Calculate time counter
      const time = timestamp || Math.floor(Date.now() / 1000);
      const counter = Math.floor(time / timeStep);
      const counterBytes = this.numberToBytes(counter);
      
      // Generate HMAC
      const hmac = await this.hmacSha1(key, counterBytes);
      
      // Dynamic truncation (RFC 6238)
      const offset = hmac[hmac.length - 1] & 0x0F;
      const code = (
        ((hmac[offset] & 0x7F) << 24) |
        ((hmac[offset + 1] & 0xFF) << 16) |
        ((hmac[offset + 2] & 0xFF) << 8) |
        (hmac[offset + 3] & 0xFF)
      );
      
      // Generate token with specified digits
      const token = (code % Math.pow(10, digits)).toString();
      return token.padStart(digits, '0');
    } catch (error) {
      console.error('TOTP generation error:', error);
      throw error;
    }
  },
  
  /**
   * Get remaining seconds until next token refresh
   * @param {number} [timeStep=30] - Time step in seconds
   * @returns {number}
   */
  getRemainingSeconds(timeStep = 30) {
    const time = Math.floor(Date.now() / 1000);
    return timeStep - (time % timeStep);
  },
  
  /**
   * Validate base32 secret format
   * @param {string} secret
   * @returns {boolean}
   */
  isValidSecret(secret) {
    try {
      const cleaned = secret.replace(/\s/g, '').toUpperCase();
      return /^[A-Z2-7]+=*$/.test(cleaned) && cleaned.length >= 16;
    } catch {
      return false;
    }
  },
  
  /**
   * Parse otpauth:// URI
   * @param {string} uri - OTP Auth URI
   * @returns {object|null}
   */
  parseOtpAuthUri(uri) {
    try {
      const url = new URL(uri);
      if (url.protocol !== 'otpauth:') return null;
      
      const type = url.hostname; // totp or hotp
      const label = decodeURIComponent(url.pathname.slice(1));
      const params = url.searchParams;
      
      let issuer = params.get('issuer') || '';
      let accountName = label;
      
      // Handle "Issuer:Account" format
      if (label.includes(':')) {
        const parts = label.split(':');
        issuer = issuer || parts[0];
        accountName = parts[1] || parts[0];
      }
      
      return {
        type,
        issuer,
        accountName,
        secret: params.get('secret'),
        algorithm: params.get('algorithm') || 'SHA1',
        digits: parseInt(params.get('digits') || '6'),
        period: parseInt(params.get('period') || '30')
      };
    } catch {
      return null;
    }
  },
  
  /**
   * Generate random base32 secret
   * @param {number} [length=20] - Length in bytes
   * @returns {string}
   */
  generateSecret(length = 20) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    
    let secret = '';
    const chars = this.base32Chars;
    
    for (let i = 0; i < bytes.length; i += 5) {
      const chunk = [
        bytes[i] || 0,
        bytes[i + 1] || 0,
        bytes[i + 2] || 0,
        bytes[i + 3] || 0,
        bytes[i + 4] || 0
      ];
      
      secret += chars[chunk[0] >> 3];
      secret += chars[((chunk[0] & 0x07) << 2) | (chunk[1] >> 6)];
      secret += chars[(chunk[1] >> 1) & 0x1F];
      secret += chars[((chunk[1] & 0x01) << 4) | (chunk[2] >> 4)];
      secret += chars[((chunk[2] & 0x0F) << 1) | (chunk[3] >> 7)];
      secret += chars[(chunk[3] >> 2) & 0x1F];
      secret += chars[((chunk[3] & 0x03) << 3) | (chunk[4] >> 5)];
      secret += chars[chunk[4] & 0x1F];
    }
    
    return secret.slice(0, Math.ceil(length * 8 / 5));
  }
};

// Export for use in extension
window.TOTP = TOTP;
