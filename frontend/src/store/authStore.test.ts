import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';
import { authService } from '../services/auth';

// Mock the auth service
vi.mock('../services/auth', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'STUDENT' as const,
    };

    it('should set loading state during login', async () => {
      vi.mocked(authService.login).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ message: 'Success', user: mockUser, accessToken: 'token', refreshToken: 'refresh' }), 100))
      );

      const loginPromise = useAuthStore.getState().login({ email: 'test@example.com', password: 'password' });

      expect(useAuthStore.getState().isLoading).toBe(true);
      expect(useAuthStore.getState().error).toBeNull();

      await loginPromise;
    });

    it('should set user and isAuthenticated on successful login', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        message: 'Login successful',
        user: mockUser,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await useAuthStore.getState().login({ email: 'test@example.com', password: 'password' });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error on failed login', async () => {
      const error = { response: { data: { error: 'Invalid credentials' } } };
      vi.mocked(authService.login).mockRejectedValue(error);

      await expect(
        useAuthStore.getState().login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toEqual(error);

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('register', () => {
    const mockUser = {
      id: '123',
      email: 'new@example.com',
      name: 'New User',
      role: 'STUDENT' as const,
    };

    it('should set user and isAuthenticated on successful registration', async () => {
      vi.mocked(authService.register).mockResolvedValue({
        message: 'Registration successful',
        user: mockUser,
        accessToken: 'token',
        refreshToken: 'refresh',
      });

      await useAuthStore.getState().register({
        email: 'new@example.com',
        password: 'Password123',
        name: 'New User',
        role: 'STUDENT',
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should set error on failed registration', async () => {
      const error = { response: { data: { error: 'Email already exists' } } };
      vi.mocked(authService.register).mockRejectedValue(error);

      await expect(
        useAuthStore.getState().register({
          email: 'existing@example.com',
          password: 'Password123',
          name: 'User',
          role: 'STUDENT',
        })
      ).rejects.toEqual(error);

      expect(useAuthStore.getState().error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should clear user and set isAuthenticated to false', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: { id: '123', email: 'test@example.com', name: 'Test', role: 'STUDENT' },
        isAuthenticated: true,
      });

      vi.mocked(authService.logout).mockResolvedValue(undefined);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should clear state even if logout API fails', async () => {
      useAuthStore.setState({
        user: { id: '123', email: 'test@example.com', name: 'Test', role: 'STUDENT' },
        isAuthenticated: true,
      });

      vi.mocked(authService.logout).mockRejectedValue(new Error('Network error'));

      // Logout clears state in finally block, but error still propagates
      // We catch it here since we only care about state being cleared
      try {
        await useAuthStore.getState().logout();
      } catch {
        // Expected - error propagates after finally
      }

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should set isAuthenticated false if not authenticated', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(false);

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should fetch and set user if authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test', role: 'STUDENT' as const };
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('should clear auth state if getCurrentUser fails', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Token expired'));

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useAuthStore.setState({ error: 'Some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
