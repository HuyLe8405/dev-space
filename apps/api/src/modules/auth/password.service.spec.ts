import { PasswordService } from './password.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(() => {
    service = new PasswordService();
  });

  describe('validatePasswordComplexity (FR-003)', () => {
    it('should reject passwords shorter than 8 characters', () => {
      expect(service.validatePasswordComplexity('Pass1')).toBe(false);
    });

    it('should reject passwords without uppercase letter', () => {
      expect(service.validatePasswordComplexity('password123')).toBe(false);
    });

    it('should reject passwords without lowercase letter', () => {
      expect(service.validatePasswordComplexity('PASSWORD123')).toBe(false);
    });

    it('should reject passwords without numeric digit', () => {
      expect(service.validatePasswordComplexity('PasswordABC')).toBe(false);
    });

    it('should accept passwords satisfying all FR-003 requirements', () => {
      expect(service.validatePasswordComplexity('Password123')).toBe(true);
      expect(service.validatePasswordComplexity('SecurePass456!')).toBe(true);
    });
  });

  describe('hashPassword and comparePassword', () => {
    it('should correctly hash and verify password with constant-time check', async () => {
      const raw = 'Password123';
      const hash = await service.hashPassword(raw);

      expect(hash).toBeDefined();
      expect(hash).not.toEqual(raw);

      const isValid = await service.comparePassword(raw, hash);
      expect(isValid).toBe(true);

      const isInvalid = await service.comparePassword('WrongPassword123', hash);
      expect(isInvalid).toBe(false);
    });
  });
});
