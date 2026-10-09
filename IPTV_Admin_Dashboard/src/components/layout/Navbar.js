import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const Navbar = ({ onToggleSidebar }) => {
    const { user, isSuperAdmin, logout } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    return (
        <header className="main-header">
            {/* Custom Navbar */}
            <nav className="navbar-custom">
                {/* Left Side: Sidebar Toggle Button */}
                <div className="d-flex align-items-center">
                    <button
                        type="button"
                        className="sidebar-toggle-btn"
                        onClick={onToggleSidebar}
                        title="Toggle Sidebar"
                    >
                        <i className="fa-solid fa-bars"></i>
                    </button>
                    <span className="ms-3 fw-bold d-none d-md-inline" style={{ fontSize: '15px', letterSpacing: '0.5px' }}>
                        IPTV MANAGEMENT PLATFORM
                    </span>
                </div>

                {/* Right Action Menu */}
                <div className="navbar-right-menu">
                    {/* User profile dropdown */}
                    <div className="position-relative">
                        <div
                            className="user-profile-menu cursor-pointer"
                            style={{ cursor: 'pointer', padding: '5px 10px', borderRadius: '4px' }}
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: isSuperAdmin ? '#dd4b39' : '#ffffff',
                                color: isSuperAdmin ? '#ffffff' : '#3c8dbc',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '12px',
                                marginRight: '8px'
                            }}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="user-name-text me-2">{user?.name || 'Administrator'}</span>
                            <span className={`badge ${isSuperAdmin ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: '10px' }}>
                                {user?.role ? user.role.toUpperCase() : 'ADMIN'}
                            </span>
                            <i className="fa-solid fa-caret-down ms-2 small"></i>
                        </div>

                        {/* Dropdown Menu */}
                        {showProfileMenu && (
                            <div
                                className="position-absolute end-0 mt-2 bg-white text-dark shadow rounded py-2"
                                style={{ width: '240px', zIndex: 1050 }}
                            >
                                <div className="px-3 py-2 border-bottom">
                                    <div className="fw-bold text-dark">{user?.name}</div>
                                    <div className="small text-muted font-monospace">@{user?.username}</div>
                                    <div className="small text-muted">{user?.email}</div>
                                    <div className="mt-1">
                                        <span className={`badge ${isSuperAdmin ? 'bg-danger' : 'bg-primary'}`}>
                                            {isSuperAdmin ? 'Super Administrator' : 'Operations Admin'}
                                        </span>
                                    </div>
                                </div>

                                {isSuperAdmin && (
                                    <Link
                                        to="/users"
                                        className="dropdown-item px-3 py-2 text-dark d-flex align-items-center"
                                        onClick={() => setShowProfileMenu(false)}
                                    >
                                        <i className="fa-solid fa-users-gear text-secondary me-2"></i> All Users & Roles
                                    </Link>
                                )}

                                <Link
                                    to="/client-users"
                                    className="dropdown-item px-3 py-2 text-dark d-flex align-items-center"
                                    onClick={() => setShowProfileMenu(false)}
                                >
                                    <i className="fa-solid fa-id-card text-success me-2"></i> Client Subscriptions
                                </Link>

                                <div className="dropdown-divider"></div>

                                <button
                                    type="button"
                                    className="dropdown-item px-3 py-2 text-danger d-flex align-items-center"
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        logout();
                                    }}
                                >
                                    <i className="fa-solid fa-right-from-bracket me-2"></i> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
