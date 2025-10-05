import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [ mode, setMode ] = useState(initialMode); // 'login' or 'register'

    if (!isOpen) return null;

    const handleSwitchToLogin = () => setMode('login');
    const handleSwitchToRegister = () => setMode('register');

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="auth-modal-overlay" onClick={handleOverlayClick}>
            <div className="auth-modal">
                <button className="auth-modal-close" onClick={onClose}>
                    ✕
                </button>

                <div className="auth-modal-content">
                    {mode === 'login' ? (
                        <Login
                            onSwitchToRegister={handleSwitchToRegister}
                            onClose={onClose}
                        />
                    ) : (
                        <Register
                            onSwitchToLogin={handleSwitchToLogin}
                            onClose={onClose}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;