/**
 * Authentication DTOs and Response Contracts
 */

export interface UserSummary {
  id: string;
  email: string;
  displayName: string;
  createdAt: string; // ISO 8601
}

export interface AuthSessionResponse {
  user: UserSummary;
  expiresIn: number; // Access token lifetime in seconds
}

export type AuthResponse = AuthSessionResponse;

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
}
