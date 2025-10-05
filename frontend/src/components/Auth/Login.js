import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = ({ onSwitchToRegister, onClose }) => {
    const [ formData, setFormData ] = useState({
        email: '',
        password: ''
    });
    const [ showPassword, setShowPassword ] = useState(false);

    const { login, isLoading, error, clearError } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [ name ]: value
        }));
        if (error) clearError();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            return;
        }

        try {
            await login(formData.email, formData.password);
            onClose(); // Close modal on successful login
        } catch (error) {
            // Error is handled by context
            console.error('Login failed:', error.message);
        }
    };

    return (
        <div className="auth-form">
            <div className="auth-header">
                <h2>Welcome Back</h2>
                <p>Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-content">
                {error && (
                    <div className="error-message">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                        autoComplete="email"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-container">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={isLoading || !formData.email || !formData.password}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner"></span>
                            Signing In...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </button>

                <div className="auth-footer">
                    <p>
                        Don't have an account?{' '}
                        <button
                            type="button"
                            className="link-button"
                            onClick={onSwitchToRegister}
                        >
                            Sign Up
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default Login;