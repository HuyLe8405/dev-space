/**
 * User Profile and Account Management DTOs
 */

import type { UserSummary } from './auth.dto';

export interface UserProfile extends UserSummary {
  updatedAt: string; // ISO 8601
}

export interface UpdateProfileRequest {
  displayName: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MessageResponse {
  message: string;
}
