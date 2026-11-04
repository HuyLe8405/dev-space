/**
 * Feature 001: Authentication & User Management Contracts
 * Framework-agnostic TypeScript contracts shared across apps/api and apps/web.
 */

// ============================================================================
// 1. Primitive & Shared Types
// ============================================================================

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  createdAt: string; // ISO 8601
}

export interface UserProfile extends UserSummary {
  updatedAt: string; // ISO 8601
}

export interface AuthSessionResponse {
  user: UserSummary;
  expiresIn: number; // Access token expiration in seconds (e.g., 900)
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
}

// ============================================================================
// 2. Authentication DTOs
// ============================================================================

/**
 * Request payload for POST /api/auth/register
 */
export interface RegisterRequest {
  /**
   * Valid email address (normalized to lowercase).
   * @example "alex@example.com"
   */
  email: string;

  /**
   * Password conforming to FR-003:
   * - Minimum 8 characters
   * - At least 1 uppercase letter
   * - At least 1 lowercase letter
   * - At least 1 number
   */
  password: string;

  /**
   * Optional display name (1–60 chars).
   * Defaults to email local-part if omitted.
   * @example "Alex"
   */
  displayName?: string;
}

/**
 * Request payload for POST /api/auth/login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Response payload for POST /api/auth/register and POST /api/auth/login
 * Note: access_token and refresh_token are set as httpOnly cookies on the response.
 */
export type AuthResponse = AuthSessionResponse;

// ============================================================================
// 3. User Management DTOs
// ============================================================================

/**
 * Request payload for PATCH /api/users/profile
 */
export interface UpdateProfileRequest {
  /**
   * User display name (1–60 non-empty characters).
   * @example "Alex Rivera"
   */
  displayName: string;
}

/**
 * Request payload for POST /api/users/change-password
 */
export interface ChangePasswordRequest {
  /**
   * The user's active, verified password.
   */
  currentPassword: string;

  /**
   * New password conforming to FR-003 complexity rules.
   * Must differ from current password.
   */
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}

// ============================================================================
// 4. REST Endpoint Specifications
// ============================================================================

export interface AuthApiEndpoints {
  /**
   * POST /api/auth/register
   * Creates account, profile, and active session. Sets auth cookies.
   */
  register(body: RegisterRequest): Promise<AuthResponse>;

  /**
   * POST /api/auth/login
   * Validates credentials and creates session. Sets auth cookies.
   */
  login(body: LoginRequest): Promise<AuthResponse>;

  /**
   * POST /api/auth/refresh
   * Rotates access and refresh tokens using httpOnly refresh cookie.
   */
  refresh(): Promise<AuthResponse>;

  /**
   * POST /api/auth/logout
   * Revokes current session in database and clears auth cookies.
   */
  logout(): Promise<MessageResponse>;

  /**
   * GET /api/auth/me
   * Returns current authenticated user summary.
   */
  getCurrentUser(): Promise<UserSummary>;

  /**
   * PATCH /api/users/profile
   * Updates display name for authenticated user.
   */
  updateProfile(body: UpdateProfileRequest): Promise<UserProfile>;

  /**
   * POST /api/users/change-password
   * Validates current password, updates hash, revokes other sessions.
   */
  changePassword(body: ChangePasswordRequest): Promise<MessageResponse>;
}
