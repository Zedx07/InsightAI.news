import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
    const { user, logout, getCurrentUser } = useAuth();
    const [ showDropdown, setShowDropdown ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(false);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setIsLoading(false);
            setShowDropdown(false);
        }
    };

    const handleRefreshProfile = async () => {
        setIsLoading(true);
        try {
            await getCurrentUser();
        } catch (error) {
            console.error('Refresh profile error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const closeDropdown = () => {
        setShowDropdown(false);
    };

    return (
        <div className="user-profile">
            <button
                className="user-profile-button"
                onClick={toggleDropdown}
                disabled={isLoading}
            >
                <div className="user-avatar">
                    {getInitials(user?.name)}
                </div>
                <div className="user-info">
                    <div className="user-name">{user?.name || 'User'}</div>
                    <div className="user-email">{user?.email}</div>
                </div>
                <div className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}>
                    ▼
                </div>
            </button>

            {showDropdown && (
                <>
                    <div className="dropdown-overlay" onClick={closeDropdown}></div>
                    <div className="user-dropdown">
                        <div className="dropdown-header">
                            <div className="user-avatar-large">
                                {getInitials(user?.name)}
                            </div>
                            <div className="user-details">
                                <div className="user-name-large">{user?.name}</div>
                                <div className="user-email-small">{user?.email}</div>
                            </div>
                        </div>

                        <div className="dropdown-divider"></div>

                        <div className="dropdown-menu">
                            <button
                                className="dropdown-item"
                                onClick={handleRefreshProfile}
                                disabled={isLoading}
                            >
                                <span className="dropdown-icon">🔄</span>
                                Refresh Profile
                            </button>

                            <div className="dropdown-divider"></div>

                            <button
                                className="dropdown-item logout-item"
                                onClick={handleLogout}
                                disabled={isLoading}
                            >
                                <span className="dropdown-icon">🚪</span>
                                {isLoading ? 'Signing Out...' : 'Sign Out'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default UserProfile;