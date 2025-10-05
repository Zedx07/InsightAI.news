import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

// Auth context
const AuthContext = createContext();

// Auth actions
const AUTH_ACTIONS = {
    LOGIN_START: 'LOGIN_START',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    LOGOUT: 'LOGOUT',
    REGISTER_START: 'REGISTER_START',
    REGISTER_SUCCESS: 'REGISTER_SUCCESS',
    REGISTER_FAILURE: 'REGISTER_FAILURE',
    VERIFY_TOKEN: 'VERIFY_TOKEN',
    SET_USER: 'SET_USER',
    CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial state
const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
};

// Auth reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.LOGIN_START:
        case AUTH_ACTIONS.REGISTER_START:
            return {
                ...state,
                isLoading: true,
                error: null
            };

        case AUTH_ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };

        case AUTH_ACTIONS.REGISTER_SUCCESS:
            return {
                ...state,
                isLoading: false,
                error: null
            };

        case AUTH_ACTIONS.LOGIN_FAILURE:
        case AUTH_ACTIONS.REGISTER_FAILURE:
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload
            };

        case AUTH_ACTIONS.LOGOUT:
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            };

        case AUTH_ACTIONS.VERIFY_TOKEN:
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: action.payload.isAuthenticated,
                isLoading: false
            };

        case AUTH_ACTIONS.SET_USER:
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true
            };

        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };

        default:
            return state;
    }
};

// Auth provider component
export const AuthProvider = ({ children }) => {
    const [ state, dispatch ] = useReducer(authReducer, initialState);

    // Initialize auth on app start
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const isValid = await authService.initialize();
                if (isValid) {
                    const userData = authService.getCurrentUserData();
                    const token = authService.getToken();
                    dispatch({
                        type: AUTH_ACTIONS.VERIFY_TOKEN,
                        payload: {
                            user: userData,
                            token: token,
                            isAuthenticated: true
                        }
                    });
                } else {
                    dispatch({
                        type: AUTH_ACTIONS.VERIFY_TOKEN,
                        payload: {
                            user: null,
                            token: null,
                            isAuthenticated: false
                        }
                    });
                }
            } catch (error) {
                console.error('Auth initialization failed:', error);
                dispatch({
                    type: AUTH_ACTIONS.VERIFY_TOKEN,
                    payload: {
                        user: null,
                        token: null,
                        isAuthenticated: false
                    }
                });
            }
        };

        initializeAuth();
    }, []);

    // Login function
    const login = async (email, password) => {
        dispatch({ type: AUTH_ACTIONS.LOGIN_START });
        try {
            const result = await authService.login(email, password);
            if (result.success) {
                dispatch({
                    type: AUTH_ACTIONS.LOGIN_SUCCESS,
                    payload: {
                        user: result.user,
                        token: result.token
                    }
                });
                return { success: true };
            }
        } catch (error) {
            dispatch({
                type: AUTH_ACTIONS.LOGIN_FAILURE,
                payload: error.message
            });
            throw error;
        }
    };

    // Register function
    const register = async (email, password, name) => {
        dispatch({ type: AUTH_ACTIONS.REGISTER_START });
        try {
            const result = await authService.register(email, password, name);
            if (result.success) {
                dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS });
                return { success: true, message: result.message };
            }
        } catch (error) {
            dispatch({
                type: AUTH_ACTIONS.REGISTER_FAILURE,
                payload: error.message
            });
            throw error;
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
    };

    // Get current user
    const getCurrentUser = async () => {
        try {
            const result = await authService.getCurrentUser();
            if (result.success) {
                dispatch({
                    type: AUTH_ACTIONS.SET_USER,
                    payload: result.user
                });
                return result.user;
            }
        } catch (error) {
            console.error('Get current user error:', error);
            logout();
            throw error;
        }
    };

    // Clear error
    const clearError = () => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    };

    const value = {
        ...state,
        login,
        register,
        logout,
        getCurrentUser,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;