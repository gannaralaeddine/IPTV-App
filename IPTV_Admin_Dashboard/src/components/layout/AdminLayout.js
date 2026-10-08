import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AdminLayout = ({ children, title = "Dashboard", subtitle = "Control panel", breadcrumbs = [] }) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className={`admin-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Top Navigation Bar */}
            <Navbar onToggleSidebar={toggleSidebar} />

            {/* Left Navigation Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="content-wrapper">
                {/* Content Header / Breadcrumb */}
                <div className="content-header">
                    <h1>
                        {title}
                        {subtitle && <small>{subtitle}</small>}
                    </h1>
                    <div className="breadcrumb-custom">
                        <i className="fa-solid fa-house"></i>
                        <a href="/">Home</a>
                        {breadcrumbs.length > 0 ? (
                            breadcrumbs.map((b, idx) => (
                                <React.Fragment key={idx}>
                                    <span>&gt;</span>
                                    {b.link ? <a href={b.link}>{b.label}</a> : <span>{b.label}</span>}
                                </React.Fragment>
                            ))
                        ) : (
                            <>
                                <span>&gt;</span>
                                <span>{title}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Page Content */}
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
