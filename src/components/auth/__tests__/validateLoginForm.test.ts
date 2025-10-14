import { validateLoginForm } from '../validateLoginForm';

describe('validateLoginForm', () => {
  describe('email validation', () => {
    it('should return error when email is empty', () => {
      const result = validateLoginForm({
        email: '',
        password: 'validPassword123',
        showPasswordField: false,
      });

      expect(result.email).toBe('Email is required.');
    });

    it('should return error when email is only whitespace', () => {
      const result = validateLoginForm({
        email: '   ',
        password: 'validPassword123',
        showPasswordField: false,
      });

      expect(result.email).toBe('Email is required.');
    });

    it('should return error when email format is invalid', () => {
      const invalidEmails = [
        'invalid-email',
        'invalid@',
        '@domain.com',
        'invalid@domain',
        'invalid.domain.com',
        'invalid@domain.',
      ];

      invalidEmails.forEach((email) => {
        const result = validateLoginForm({
          email,
          password: 'validPassword123',
          showPasswordField: false,
        });

        expect(result.email).toBe('Invalid email format.');
      });
    });

    it('should not return error when email format is valid', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach((email) => {
        const result = validateLoginForm({
          email,
          password: 'validPassword123',
          showPasswordField: false,
        });

        expect(result.email).toBeUndefined();
      });
    });
  });

  describe('password validation', () => {
    it('should validate password when password field is shown', () => {
      const resultWithPasswordHidden = validateLoginForm({
        email: 'test@example.com',
        password: '',
        showPasswordField: false,
      });

      const resultWithPasswordShown = validateLoginForm({
        email: 'test@example.com',
        password: '',
        showPasswordField: true,
      });

      const resultWithValidPassword = validateLoginForm({
        email: 'test@example.com',
        password: 'validPassword123',
        showPasswordField: true,
      });

      // When password field is hidden, no password validation should occur
      expect(resultWithPasswordHidden.password).toBeUndefined();
      
      // When password field is shown but password is empty, validation should fail
      expect(resultWithPasswordShown.password).toBe('Password is required.');
      
      // When password field is shown and password is provided, validation should pass
      expect(resultWithValidPassword.password).toBeUndefined();
    });
  });

  describe('combined validation', () => {
    it('should return empty object when email is valid and password field is hidden', () => {
      const result = validateLoginForm({
        email: 'test@example.com',
        password: '',
        showPasswordField: false,
      });

      expect(result).toEqual({});
    });

    it('should return empty object when email is valid and password is provided', () => {
      const result = validateLoginForm({
        email: 'test@example.com',
        password: 'anyPassword',
        showPasswordField: true,
      });

      expect(result).toEqual({});
    });

    it('should return password error when email is valid but password is empty and field is shown', () => {
      const result = validateLoginForm({
        email: 'test@example.com',
        password: '',
        showPasswordField: true,
      });

      expect(result.password).toBe('Password is required.');
      expect(result.email).toBeUndefined();
    });

    it('should return only email error when email is invalid', () => {
      const result = validateLoginForm({
        email: 'invalid-email',
        password: 'anyPassword',
        showPasswordField: true,
      });

      expect(result.email).toBe('Invalid email format.');
      expect(result.password).toBeUndefined();
    });

    it('should return both email and password errors when both are invalid', () => {
      const result = validateLoginForm({
        email: 'invalid-email',
        password: '',
        showPasswordField: true,
      });

      expect(result.email).toBe('Invalid email format.');
      expect(result.password).toBe('Password is required.');
    });
  });
});