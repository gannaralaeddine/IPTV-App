import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    // Track which accordion submenus are open
    const [openMenus, setOpenMenus] = useState({
        dashboard: true, // open by default as in screenshot
        iptv: currentPath.includes('/live'),
        vod: currentPath.includes('/vod'),
        series: currentPath.includes('/series'),
        subscriber: false,
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
                <img
                    src="https://drive.usercontent.google.com/download?id=1TDMdmyWHXwBRZJ4uwAu6bHXx6XCPzyjf&export=view&authuser=0"
                    alt="Ala Eddine Gannar"
                    className="user-avatar-sidebar"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                    }}
                />
                <div className="user-info-sidebar">
                    <div className="name">Ala Eddine Gannar</div>
                    <div className="status">
                        <span className="status-dot"></span> Online
                    </div>
                </div>
            </div>

            {/* Search form */}
            <form className="sidebar-form" onSubmit={(e) => e.preventDefault()}>
                <div className="sidebar-search-box">
                    <input
                        type="text"
                        className="sidebar-search-input"
                        placeholder="Search..."
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
                {/* Dashboard with submenu */}
                <li className={`${isDashboardActive ? 'active' : ''} ${openMenus.dashboard ? 'expanded' : ''}`}>
                    <a href="#!" onClick={(e) => { e.preventDefault(); toggleMenu('dashboard'); }}>
                        <span className="sidebar-menu-icon">
                            <i className="fa-solid fa-gauge-high"></i>
                        </span>
                        <span className="sidebar-menu-title">Dashboard</span>
                        <i className={`fa-solid fa-angle-${openMenus.dashboard ? 'down' : 'left'} sidebar-menu-arrow`}></i>
                    </a>
                    {openMenus.dashboard && (
                        <ul className="treeview-menu">
                            <li className={isDashboardActive ? 'active' : ''}>
                                <Link to="/">
                                    <i className="fa-regular fa-circle treeview-menu-icon"></i>
                                    General Settings
                                </Link>
                            </li>
                            <li>
                                <Link to="/">
                                    <i className="fa-regular fa-circle treeview-menu-icon"></i>
                                    Settings
                                </Link>
                            </li>
                        </ul>
                    )}
                </li>

                {/* IPTV Management with badge 4 */}
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

                {/* VOD Management with badge 'new' */}
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

                {/* Series Management */}
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

                {/* Subscriber Management (from screenshot) */}
                <li className={openMenus.subscriber ? 'expanded' : ''}>
                    <a href="#!" onClick={(e) => { e.preventDefault(); toggleMenu('subscriber'); }}>
                        <span className="sidebar-menu-icon">
                            <i className="fa-solid fa-chart-pie"></i>
                        </span>
                        <span className="sidebar-menu-title">Subscriber Management</span>
                        <i className={`fa-solid fa-angle-${openMenus.subscriber ? 'down' : 'left'} sidebar-menu-arrow`}></i>
                    </a>
                    {openMenus.subscriber && (
                        <ul className="treeview-menu">
                            <li><a href="#!"><i className="fa-regular fa-circle treeview-menu-icon"></i>Active Subscribers</a></li>
                            <li><a href="#!"><i className="fa-regular fa-circle treeview-menu-icon"></i>Plans & Packages</a></li>
                        </ul>
                    )}
                </li>

                {/* EPG Management (from screenshot) */}
                <li className={openMenus.epg ? 'expanded' : ''}>
                    <a href="#!" onClick={(e) => { e.preventDefault(); toggleMenu('epg'); }}>
                        <span className="sidebar-menu-icon">
                            <i className="fa-solid fa-calendar-days"></i>
                        </span>
                        <span className="sidebar-menu-title">EPG Management</span>
                        <i className={`fa-solid fa-angle-${openMenus.epg ? 'down' : 'left'} sidebar-menu-arrow`}></i>
                    </a>
                    {openMenus.epg && (
                        <ul className="treeview-menu">
                            <li><a href="#!"><i className="fa-regular fa-circle treeview-menu-icon"></i>EPG XMLTV Sources</a></li>
                            <li><a href="#!"><i className="fa-regular fa-circle treeview-menu-icon"></i>Schedule Sync</a></li>
                        </ul>
                    )}
                </li>

                {/* APP Management (from screenshot) */}
                <li className={openMenus.app ? 'expanded' : ''}>
                    <a href="#!" onClick={(e) => { e.preventDefault(); toggleMenu('app'); }}>
                        <span className="sidebar-menu-icon">
                            <i className="fa-solid fa-mobile-screen-button"></i>
                        </span>
                        <span className="sidebar-menu-title">APP Management</span>
                        <i className={`fa-solid fa-angle-${openMenus.app ? 'down' : 'left'} sidebar-menu-arrow`}></i>
                    </a>
                    {openMenus.app && (
                        <ul className="treeview-menu">
                            <li><a href="#!"><i className="fa-regular fa-circle treeview-menu-icon"></i>App Branding</a></li>
                            <li><a href="#!"><i className="fa-regular fa-circle treeview-menu-icon"></i>Client Devices</a></li>
                        </ul>
                    )}
                </li>

                {/* Reports (from screenshot) */}
                <li className={openMenus.reports ? 'expanded' : ''}>
                    <a href="#!" onClick={(e) => { e.preventDefault(); toggleMenu('reports'); }}>
                        <span className="sidebar-menu-icon">
                            <i className="fa-solid fa-chart-line"></i>
                        </span>
                        <span className="sidebar-menu-title">Reports</span>
                        <i className={`fa-solid fa-angle-${openMenus.reports ? 'down' : 'left'} sidebar-menu-arrow`}></i>
                    </a>
                    {openMenus.reports && (
                        <ul className="treeview-menu">
                            <li><a href="#!"><i className="fa-regular fa-circle treeview-menu-icon"></i>Stream Analytics</a></li>
                            <li><a href="#!"><i className="fa-regular fa-circle treeview-menu-icon"></i>Bandwidth Usage</a></li>
                        </ul>
                    )}
                </li>
            </ul>
        </aside>
    );
};

export default Sidebar;
