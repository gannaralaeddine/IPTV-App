import React from 'react';

const Navbar = ({ onToggleSidebar }) => {
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
                </div>

                {/* Right Action Menu */}
                <div className="navbar-right-menu">
                    {/* Theme droplet icon */}
                    <span className="nav-icon-link" title="Theme">
                        <i className="fa-solid fa-droplet" style={{ color: '#ff6b6b' }}></i>
                    </span>

                    {/* Download icon */}
                    <span className="nav-icon-link" title="Download">
                        <i className="fa-solid fa-download"></i>
                    </span>

                    {/* Messages with green badge 4 */}
                    <span className="nav-icon-link" title="Messages">
                        <i className="fa-regular fa-envelope"></i>
                        <span className="nav-badge nav-badge-green">4</span>
                    </span>

                    {/* Notifications with yellow badge 10 */}
                    <span className="nav-icon-link" title="Notifications">
                        <i className="fa-regular fa-bell"></i>
                        <span className="nav-badge nav-badge-yellow">10</span>
                    </span>

                    {/* Flags/Tasks with red badge 3 */}
                    <span className="nav-icon-link" title="Tasks">
                        <i className="fa-regular fa-flag"></i>
                        <span className="nav-badge nav-badge-red">3</span>
                    </span>

                    {/* User profile with Ala Eddine Gannar */}
                    <div className="user-profile-menu">
                        <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80"
                            alt="Ala Eddine Gannar"
                            className="user-avatar-small"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                            }}
                        />
                        <span className="user-name-text">Ala Eddine Gannar</span>
                    </div>

                    {/* Settings cog */}
                    <span className="nav-icon-link" title="Settings">
                        <i className="fa-solid fa-gear"></i>
                    </span>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
