// Session Handler for managing authentication tokens and remember me functionality

export interface SessionData {
  token: string;
  userEmail: string;
  rememberMe: boolean;
  expiresAt: number;
}

export class SessionHandler {
  private static readonly TOKEN_KEY = 'token';
  private static readonly REMEMBER_ME_KEY = 'rememberMe';
  private static readonly USER_EMAIL_KEY = 'userEmail';
  private static readonly EXPIRES_AT_KEY = 'expiresAt';
  
  // Default token expiration times
  private static readonly SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly REMEMBER_ME_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

  /**
   * Store session data based on remember me preference
   */
  static storeSession(token: string, userEmail: string, rememberMe: boolean): void {
    const expiresAt = Date.now() + (rememberMe ? this.REMEMBER_ME_EXPIRY : this.SESSION_EXPIRY);
    
    if (rememberMe) {
      // Store in localStorage for persistent sessions
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.REMEMBER_ME_KEY, 'true');
      localStorage.setItem(this.USER_EMAIL_KEY, userEmail);
      localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
    } else {
      // Store in sessionStorage for session-only storage
      sessionStorage.setItem(this.TOKEN_KEY, token);
      sessionStorage.setItem(this.REMEMBER_ME_KEY, 'false');
      sessionStorage.setItem(this.USER_EMAIL_KEY, userEmail);
      sessionStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
    }
  }

  /**
   * Get current session data
   */
  static getSession(): SessionData | null {
    // Check localStorage first (remember me)
    let token = localStorage.getItem(this.TOKEN_KEY);
    let rememberMe = localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
    let userEmail = localStorage.getItem(this.USER_EMAIL_KEY);
    let expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);

    // If not found in localStorage, check sessionStorage
    if (!token) {
      token = sessionStorage.getItem(this.TOKEN_KEY);
      rememberMe = sessionStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
      userEmail = sessionStorage.getItem(this.USER_EMAIL_KEY);
      expiresAt = sessionStorage.getItem(this.EXPIRES_AT_KEY);
    }

    if (!token || !userEmail || !expiresAt) {
      return null;
    }

    // Check if token has expired
    const now = Date.now();
    const expiryTime = parseInt(expiresAt);
    
    if (now > expiryTime) {
      this.clearSession();
      return null;
    }

    return {
      token,
      userEmail,
      rememberMe,
      expiresAt: expiryTime
    };
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const session = this.getSession();
    return session !== null;
  }

  /**
   * Get authentication token
   */
  static getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }

  /**
   * Get user email
   */
  static getUserEmail(): string | null {
    const session = this.getSession();
    return session?.userEmail || null;
  }

  /**
   * Check if remember me is enabled
   */
  static isRememberMeEnabled(): boolean {
    const session = this.getSession();
    return session?.rememberMe || false;
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  static getTimeUntilExpiry(): number {
    const session = this.getSession();
    if (!session) return 0;
    
    return Math.max(0, session.expiresAt - Date.now());
  }

  /**
   * Check if token expires soon (within 1 hour)
   */
  static isExpiringSoon(): boolean {
    const timeUntilExpiry = this.getTimeUntilExpiry();
    return timeUntilExpiry > 0 && timeUntilExpiry < 60 * 60 * 1000; // 1 hour
  }

  /**
   * Refresh session (extend expiry time)
   */
  static refreshSession(): void {
    const session = this.getSession();
    if (!session) return;

    const newExpiresAt = Date.now() + (session.rememberMe ? this.REMEMBER_ME_EXPIRY : this.SESSION_EXPIRY);
    
    if (session.rememberMe) {
      localStorage.setItem(this.EXPIRES_AT_KEY, newExpiresAt.toString());
    } else {
      sessionStorage.setItem(this.EXPIRES_AT_KEY, newExpiresAt.toString());
    }
  }

  /**
   * Clear all session data
   */
  static clearSession(): void {
    // Clear localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REMEMBER_ME_KEY);
    localStorage.removeItem(this.USER_EMAIL_KEY);
    localStorage.removeItem(this.EXPIRES_AT_KEY);
    
    // Clear sessionStorage
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.REMEMBER_ME_KEY);
    sessionStorage.removeItem(this.USER_EMAIL_KEY);
    sessionStorage.removeItem(this.EXPIRES_AT_KEY);
  }

  /**
   * Logout user
   */
  static logout(): void {
    this.clearSession();
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  /**
   * Format time until expiry for display
   */
  static getFormattedTimeUntilExpiry(): string {
    const timeUntilExpiry = this.getTimeUntilExpiry();
    
    if (timeUntilExpiry <= 0) {
      return 'Expired';
    }

    const days = Math.floor(timeUntilExpiry / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeUntilExpiry % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((timeUntilExpiry % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}
