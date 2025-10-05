const API_BASE_URL = 'http://localhost:3001/api';

class AuthService {
    constructor() {
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user')) || null;
    }

    // Get authorization headers
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
    }

    // Register new user
    async register(email, password, name) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, name }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            if (data.success) {
                console.log('User registered successfully:', data.user);
                return { success: true, user: data.user, message: data.message };
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error.message);
            throw error;
        }
    }

    // Login user
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            if (data.success) {
                // Store token and user data
                this.token = data.token;
                this.user = data.user;

                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

                console.log('User logged in successfully:', this.user);
                return { success: true, token: data.token, user: data.user };
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error.message);
            throw error;
        }
    }

    // Logout user
    async logout() {
        try {
            if (this.token) {
                const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                });

                const data = await response.json();
                console.log('Logout response:', data.message);
            }
        } catch (error) {
            console.error('Logout error:', error.message);
        } finally {
            // Clear local storage regardless of API call success
            this.token = null;
            this.user = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
    }

    // Get current user profile
    async getCurrentUser() {
        try {
            if (!this.token) {
                throw new Error('No auth token available');
            }

            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get user profile');
            }

            if (data.success) {
                this.user = data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                return { success: true, user: data.user };
            } else {
                throw new Error(data.error || 'Failed to get user profile');
            }
        } catch (error) {
            console.error('Get current user error:', error.message);
            // If token is invalid, clear local storage
            if (error.message.includes('Invalid') || error.message.includes('expired')) {
                this.logout();
            }
            throw error;
        }
    }

    // Verify token
    async verifyToken() {
        try {
            if (!this.token) {
                return { valid: false };
            }

            const response = await fetch(`${API_BASE_URL}/auth/verify`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });

            const data = await response.json();

            if (data.success && data.valid) {
                return { valid: true, user: data.user };
            } else {
                // Token is invalid, clear local storage
                this.logout();
                return { valid: false };
            }
        } catch (error) {
            console.error('Token verification error:', error.message);
            this.logout();
            return { valid: false };
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    // Get current user data
    getCurrentUserData() {
        return this.user;
    }

    // Get auth token
    getToken() {
        return this.token;
    }

    // Initialize auth service (verify token on app start)
    async initialize() {
        if (this.token) {
            try {
                const result = await this.verifyToken();
                return result.valid;
            } catch (error) {
                console.error('Auth initialization error:', error);
                this.logout();
                return false;
            }
        }
        return false;
    }
}

export default new AuthService();