import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const currentPath = location.pathname;
    const { user, isSuperAdmin, canManageContent, logout } = useAuth();

    // Track which accordion submenus are open
    const [openMenus, setOpenMenus] = useState({
        dashboard: currentPath === '/',
        users: currentPath.includes('/users') || currentPath.includes('/client-users'),
        iptv: currentPath.includes('/live'),
        vod: currentPath.includes('/vod'),
        series: currentPath.includes('/series'),
        subscriber: currentPath.includes('/client-users'),
        epg: false,
        app: false,
        reports: false
    });

    const toggleMenu = (menuKey) => {
        setOpenMenus((prev) => ({
            ...prev,
            [menuKey]: !prev[menuKey]
        }));
    };

    const isDashboardActive = currentPath === '/';

    return (
        <aside className="main-sidebar">
            {/* User panel */}
            <div className="user-panel">
                <div style={{
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    backgroundColor: isSuperAdmin ? '#dd4b39' : '#3c8dbc',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-info-sidebar">
                    <div className="name fw-bold">{user?.name || 'User'}</div>
                    <div className="status d-flex align-items-center gap-1">
                        <span className="status-dot"></span>
                        <span className={`badge ${isSuperAdmin ? 'bg-danger' : 'bg-primary'}`} style={{ fontSize: '10px' }}>
                            {user?.role ? user.role.toUpperCase() : 'ONLINE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Search form */}
            <form className="sidebar-form" onSubmit={(e) => e.preventDefault()}>
                <div className="sidebar-search-box">
                    <input
                        type="text"
                        className="sidebar-search-input"
                        placeholder="Search menu..."
                    />
                    <button type="submit" className="sidebar-search-btn">
                        <i className="fa-solid fa-magnifying-glass"></i>
                    </button>
                </div>
            </form>

            {/* Sidebar menu header */}
            <div className="sidebar-menu-header">MAIN NAVIGATION</div>

            {/* Sidebar navigation list */}
            <ul className="sidebar-menu">
                {/* 1. Dashboard */}
                <li className={`${isDashboardActive ? 'active' : ''}`}>
                    <Link to="/">
                        <span className="sidebar-menu-icon">
                            <i className="fa-solid fa-gauge-high"></i>
                        </span>
                        <span className="sidebar-menu-title">Dashboard</span>
                    </Link>
                </li>

                {/* 2. User & Subscription Management (NEW) */}
                <li className={`${(currentPath === '/users' || currentPath === '/client-users') ? 'active' : ''} ${openMenus.users ? 'expanded' : ''}`}>
                    <a href="#!" onClick={(e) => { e.preventDefault(); toggleMenu('users'); }}>
                        <span className="sidebar-menu-icon">
                            <i className="fa-solid fa-users-gear text-primary"></i>
                        </span>
                        <span className="sidebar-menu-title">User Management</span>
                        <i className={`fa-solid fa-angle-${openMenus.users ? 'down' : 'left'} sidebar-menu-arrow`}></i>
                    </a>
                    {openMenus.users && (
                        <ul className="treeview-menu">
                            {/* Super Admin can manage all users and roles */}
                            {isSuperAdmin && (
                                <li className={currentPath === '/users' ? 'active' : ''}>
                                    <Link to="/users">
                                        <i className="fa-solid fa-shield-halved text-danger treeview-menu-icon"></i>
                                        All Users & Roles
                                    </Link>
                                </li>
                            )}
                            {/* Both Super Admin and Admin can manage client subscribers */}
                            <li className={currentPath === '/client-users' ? 'active' : ''}>
                                <Link to="/client-users">
                                    <i className="fa-solid fa-id-card text-success treeview-menu-icon"></i>
                                    Client Subscriptions
                                </Link>
                            </li>
                        </ul>
                    )}
                </li>

                {/* 3. IPTV Management (Super Admin Only) */}
                {canManageContent ? (
                    <li className={`${currentPath.includes('/live') ? 'active' : ''} ${openMenus.iptv ? 'expanded' : ''}`}>
                        <a href="#!" onClick={(e) => { e.preventDefault(); toggleMenu('iptv'); }}>
                            <span className="sidebar-menu-icon">
                                <i className="fa-solid fa-tv"></i>
                            </span>
                            <span className="sidebar-menu-title">IPTV Management</span>
                            <i className={`fa-solid fa-angle-${openMenus.iptv ? 'down' : 'left'} sidebar-menu-arrow`}></i>
                        </a>
                        {openMenus.iptv && (
                            <ul className="treeview-menu">
                                <li className={currentPath === '/live-categories' ? 'active' : ''}>
                                    <Link to="/live-categories">
                                        <i className="fa-regular fa-circle treeview-menu-icon"></i>
                                        Live Categories
                                    </Link>
                                </li>
                                <li className={currentPath === '/live-streams' ? 'active' : ''}>
                                    <Link to="/live-streams">
                                        <i className="fa-regular fa-circle treeview-menu-icon"></i>
                                        Live Streams
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                ) : null}

                {/* 4. VOD Management (Super Admin Only) */}
                {canManageContent ? (
                    <li className={`${currentPath.includes('/vod') ? 'active' : ''} ${openMenus.vod ? 'expanded' : ''}`}>
                        <a href="#!" onClick={(e) => { e.preventDefault(); toggleMenu('vod'); }}>
                            <span className="sidebar-menu-icon">
                                <i className="fa-solid fa-table-cells"></i>
                            </span>
                            <span className="sidebar-menu-title">VOD Management</span>
                            <i className={`fa-solid fa-angle-${openMenus.vod ? 'down' : 'left'} sidebar-menu-arrow`}></i>
                        </a>
                        {openMenus.vod && (
                            <ul className="treeview-menu">
                                <li className={currentPath === '/vod-categories' ? 'active' : ''}>
                                    <Link to="/vod-categories">
                                        <i className="fa-regular fa-circle treeview-menu-icon"></i>
                                        VOD Categories
                                    </Link>
                                </li>
                                <li className={currentPath === '/vod-streams' ? 'active' : ''}>
                                    <Link to="/vod-streams">
                                        <i className="fa-regular fa-circle treeview-menu-icon"></i>
                                        VOD Streams
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                ) : null}

                {/* 5. Series Management (Super Admin Only) */}
                {canManageContent ? (
                    <li className={`${currentPath.includes('/series') ? 'active' : ''} ${openMenus.series ? 'expanded' : ''}`}>
                        <a href="#!" onClick={(e) => { e.preventDefault(); toggleMenu('series'); }}>
                            <span className="sidebar-menu-icon">
                                <i className="fa-solid fa-film"></i>
                            </span>
                            <span className="sidebar-menu-title">Series Management</span>
                            <i className={`fa-solid fa-angle-${openMenus.series ? 'down' : 'left'} sidebar-menu-arrow`}></i>
                        </a>
                        {openMenus.series && (
                            <ul className="treeview-menu">
                                <li className={currentPath === '/series-categories' ? 'active' : ''}>
                                    <Link to="/series-categories">
                                        <i className="fa-regular fa-circle treeview-menu-icon"></i>
                                        Series Categories
                                    </Link>
                                </li>
                                <li className={currentPath === '/series-streams' ? 'active' : ''}>
                                    <Link to="/series-streams">
                                        <i className="fa-regular fa-circle treeview-menu-icon"></i>
                                        Series Streams
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </li>
                ) : null}

                {/* 6. Quick Subscribers Shortcut */}
                <li className={currentPath === '/client-users' ? 'active' : ''}>
                    <Link to="/client-users">
                        <span className="sidebar-menu-icon">
                            <i className="fa-solid fa-address-book text-success"></i>
                        </span>
                        <span className="sidebar-menu-title">Active Subscribers</span>
                    </Link>
                </li>

                {/* 7. Logout */}
                <li style={{ marginTop: '20px' }}>
                    <a href="#!" onClick={(e) => { e.preventDefault(); logout(); }} className="text-danger">
                        <span className="sidebar-menu-icon">
                            <i className="fa-solid fa-arrow-right-from-bracket text-danger"></i>
                        </span>
                        <span className="sidebar-menu-title text-danger fw-bold">Sign Out</span>
                    </a>
                </li>
            </ul>
        </aside>
    );
};

export default Sidebar;
