import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Register.css';

const Register = ({ onSwitchToLogin, onClose }) => {
    const [ formData, setFormData ] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [ showPassword, setShowPassword ] = useState(false);
    const [ showConfirmPassword, setShowConfirmPassword ] = useState(false);
    const [ success, setSuccess ] = useState(false);

    const { register, isLoading, error, clearError } = useAuth();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [ name ]: value
        }));
        if (error) clearError();
        if (success) setSuccess(false);
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            return 'Name is required';
        }
        if (!formData.email.trim()) {
            return 'Email is required';
        }
        if (formData.password.length < 6) {
            return 'Password must be at least 6 characters';
        }
        if (formData.password !== formData.confirmPassword) {
            return 'Passwords do not match';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            return;
        }

        try {
            const result = await register(formData.email, formData.password, formData.name);
            if (result.success) {
                setSuccess(true);
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });

                // Auto switch to login after 2 seconds
                setTimeout(() => {
                    onSwitchToLogin();
                }, 2000);
            }
        } catch (error) {
            // Error is handled by context
            console.error('Registration failed:', error.message);
        }
    };

    if (success) {
        return (
            <div className="auth-form">
                <div className="success-message">
                    <div className="success-icon">✅</div>
                    <h2>Registration Successful!</h2>
                    <p>Your account has been created successfully.</p>
                    <p>Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-form">
            <div className="auth-header">
                <h2>Create Account</h2>
                <p>Sign up to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-content">
                {error && (
                    <div className="error-message">
                        <span>⚠️ {error}</span>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                        autoComplete="name"
                    />
                </div>

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
                            placeholder="Enter your password (min 6 characters)"
                            required
                            autoComplete="new-password"
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

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="password-input-container">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            required
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                </div>

                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <div className="validation-error">
                        Passwords do not match
                    </div>
                )}

                <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={isLoading || validateForm() !== null}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner"></span>
                            Creating Account...
                        </>
                    ) : (
                        'Create Account'
                    )}
                </button>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <button
                            type="button"
                            className="link-button"
                            onClick={onSwitchToLogin}
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default Register;