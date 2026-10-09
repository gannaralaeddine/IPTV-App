import React, { useState, useEffect } from 'react';
import AdminLayout from './layout/AdminLayout';
import { UserAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Users = () => {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeRoleFilter, setActiveRoleFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [allCategories, setAllCategories] = useState({
        liveCategories: [],
        vodCategories: [],
        seriesCategories: []
    });

    // Modals state
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Form state for creating user
    const [newUser, setNewUser] = useState({
        username: '',
        password: '',
        name: '',
        phoneNumber: '',
        email: '',
        role: 'admin',
        status: 'active',
        expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxConnections: 1,
        allLiveCategories: true,
        allowedLiveCategories: [],
        allVodCategories: true,
        allowedVodCategories: [],
        allSeriesCategories: true,
        allowedSeriesCategories: [],
        notes: ''
    });

    // Form state for editing user
    const [editFormData, setEditFormData] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        role: 'admin',
        status: 'active',
        password: '',
        expDate: '',
        maxConnections: 1,
        allLiveCategories: true,
        allowedLiveCategories: [],
        allVodCategories: true,
        allowedVodCategories: [],
        allSeriesCategories: true,
        allowedSeriesCategories: [],
        notes: ''
    });

    // Fetch users and categories
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await UserAPI.get('/');
            setUsers(res.data);
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await UserAPI.get('/categories');
            setAllCategories(res.data);
        } catch (err) {
            console.warn('Could not load categories:', err.message);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchCategories();
    }, []);

    // Generate credentials
    const handleGenerateCredentials = async (isEdit = false) => {
        try {
            const res = await UserAPI.get('/generate-credentials');
            if (isEdit) {
                setEditFormData(prev => ({ ...prev, password: res.data.password }));
            } else {
                setNewUser(prev => ({
                    ...prev,
                    username: res.data.username,
                    password: res.data.password
                }));
            }
        } catch (err) {
            console.error('Error generating credentials:', err);
        }
    };

    // Handle Create User Submit
    const handleCreateUser = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await UserAPI.post('/', newUser);
            setSuccessMsg(`User "${newUser.username}" created successfully!`);
            setShowAddModal(false);
            // Reset form
            setNewUser({
                username: '',
                password: '',
                name: '',
                phoneNumber: '',
                email: '',
                role: 'admin',
                status: 'active',
                expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                maxConnections: 1,
                allLiveCategories: true,
                allowedLiveCategories: [],
                allVodCategories: true,
                allowedVodCategories: [],
                allSeriesCategories: true,
                allowedSeriesCategories: [],
                notes: ''
            });
            fetchUsers();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to create user');
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (user) => {
        setSelectedUser(user);
        setEditFormData({
            name: user.name || '',
            phoneNumber: user.phoneNumber || '',
            email: user.email || '',
            role: user.role || 'client_user',
            status: user.status || 'active',
            password: '',
            expDate: user.expDate ? new Date(user.expDate).toISOString().split('T')[0] : '',
            maxConnections: user.maxConnections || 1,
            allLiveCategories: user.allLiveCategories !== undefined ? user.allLiveCategories : true,
            allowedLiveCategories: user.allowedLiveCategories || [],
            allVodCategories: user.allVodCategories !== undefined ? user.allVodCategories : true,
            allowedVodCategories: user.allowedVodCategories || [],
            allSeriesCategories: user.allSeriesCategories !== undefined ? user.allSeriesCategories : true,
            allowedSeriesCategories: user.allowedSeriesCategories || [],
            notes: user.notes || ''
        });
        setShowEditModal(true);
    };

    // Handle Update User Submit
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await UserAPI.put(`/${selectedUser._id}`, editFormData);
            setSuccessMsg(`User "${selectedUser.username}" updated successfully!`);
            setShowEditModal(false);
            setSelectedUser(null);
            fetchUsers();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to update user');
        }
    };

    // Handle Delete User
    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to delete user "${user.username}" (${user.name})? This action cannot be undone.`)) {
            return;
        }

        try {
            await UserAPI.delete(`/${user._id}`);
            setSuccessMsg(`User "${user.username}" deleted.`);
            fetchUsers();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to delete user');
        }
    };

    // Filter users list
    const filteredUsers = users.filter(u => {
        const matchesRole = activeRoleFilter === 'all' || u.role === activeRoleFilter;
        const q = searchTerm.toLowerCase();
        const matchesSearch = !q ||
            u.username.toLowerCase().includes(q) ||
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q));
        return matchesRole && matchesSearch;
    });

    // Counts for stat badges
    const superAdminCount = users.filter(u => u.role === 'super_admin').length;
    const adminCount = users.filter(u => u.role === 'admin').length;
    const clientCount = users.filter(u => u.role === 'client_user').length;

    const getRoleBadge = (role) => {
        switch (role) {
            case 'super_admin':
                return <span className="badge bg-danger text-white"><i className="fa-solid fa-crown me-1"></i> SUPER ADMIN</span>;
            case 'admin':
                return <span className="badge bg-primary text-white"><i className="fa-solid fa-user-tie me-1"></i> ADMIN</span>;
            case 'client_user':
                return <span className="badge bg-success text-white"><i className="fa-solid fa-user me-1"></i> CLIENT USER</span>;
            default:
                return <span className="badge bg-secondary">{role}</span>;
        }
    };

    return (
        <AdminLayout
            title="User Management"
            subtitle="Manage Super Admins, Admins, and Client Users"
            breadcrumbs={[{ label: 'Users', link: '/users' }]}
        >
            {/* Notifications */}
            {successMsg && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <i className="fa-solid fa-circle-check me-2"></i> {successMsg}
                    <button type="button" className="btn-close" onClick={() => setSuccessMsg('')}></button>
                </div>
            )}
            {errorMsg && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="fa-solid fa-circle-exclamation me-2"></i> {errorMsg}
                    <button type="button" className="btn-close" onClick={() => setErrorMsg('')}></button>
                </div>
            )}

            {/* Top Stat Cards */}
            <div className="row mb-4">
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-aqua">
                        <div className="inner">
                            <h3>{users.length}</h3>
                            <p>Total Registered Users</p>
                        </div>
                        <div className="icon"><i className="fa-solid fa-users"></i></div>
                    </div>
                </div>
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-red">
                        <div className="inner">
                            <h3>{superAdminCount}</h3>
                            <p>Super Administrators</p>
                        </div>
                        <div className="icon"><i className="fa-solid fa-shield-halved"></i></div>
                    </div>
                </div>
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-yellow">
                        <div className="inner">
                            <h3>{adminCount}</h3>
                            <p>Operations Admins</p>
                        </div>
                        <div className="icon"><i className="fa-solid fa-user-gear"></i></div>
                    </div>
                </div>
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-green">
                        <div className="inner">
                            <h3>{clientCount}</h3>
                            <p>Client Subscribers</p>
                        </div>
                        <div className="icon"><i className="fa-solid fa-user-check"></i></div>
                    </div>
                </div>
            </div>

            {/* Main Users Table Card */}
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    {/* Role Filter Tabs */}
                    <div className="btn-group" role="group">
                        <button
                            type="button"
                            className={`btn btn-sm ${activeRoleFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setActiveRoleFilter('all')}
                        >
                            All Users ({users.length})
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${activeRoleFilter === 'super_admin' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => setActiveRoleFilter('super_admin')}
                        >
                            <i className="fa-solid fa-crown me-1"></i> Super Admins ({superAdminCount})
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${activeRoleFilter === 'admin' ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => setActiveRoleFilter('admin')}
                        >
                            <i className="fa-solid fa-user-gear me-1"></i> Admins ({adminCount})
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${activeRoleFilter === 'client_user' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setActiveRoleFilter('client_user')}
                        >
                            <i className="fa-solid fa-user me-1"></i> Client Users ({clientCount})
                        </button>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        {/* Search Input */}
                        <div className="input-group input-group-sm" style={{ width: '220px' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span className="input-group-text bg-white text-muted">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                        </div>

                        {/* Add User Button */}
                        <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            onClick={() => {
                                handleGenerateCredentials(false);
                                setShowAddModal(true);
                            }}
                        >
                            <i className="fa-solid fa-user-plus me-1"></i> Add New User
                        </button>
                    </div>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>User / Name</th>
                                    <th>Role</th>
                                    <th>Contact Details</th>
                                    <th>Status</th>
                                    <th>Subscription Expiry</th>
                                    <th>Created By</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <div className="mt-2 text-muted">Loading users...</div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5 text-muted">
                                            <i className="fa-solid fa-user-slash fs-3 d-block mb-2"></i>
                                            No users found matching current filters.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <div style={{
                                                        width: '38px',
                                                        height: '38px',
                                                        borderRadius: '50%',
                                                        backgroundColor: user.role === 'super_admin' ? '#dd4b39' : (user.role === 'admin' ? '#3c8dbc' : '#00a65a'),
                                                        color: '#fff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 'bold',
                                                        fontSize: '14px',
                                                        marginRight: '12px'
                                                    }}>
                                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="fw-bold">{user.name}</div>
                                                        <div className="text-muted small">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{getRoleBadge(user.role)}</td>
                                            <td>
                                                <div><i className="fa-solid fa-envelope text-muted me-1 small"></i> {user.email}</div>
                                                <div className="small text-muted"><i className="fa-solid fa-phone text-muted me-1"></i> {user.phoneNumber}</div>
                                            </td>
                                            <td>
                                                {user.status === 'active' ? (
                                                    <span className="badge bg-success-subtle text-success border border-success">Active</span>
                                                ) : (
                                                    <span className="badge bg-secondary">Disabled</span>
                                                )}
                                            </td>
                                            <td>
                                                {user.role === 'client_user' && user.expDate ? (
                                                    <div>
                                                        <span>{new Date(user.expDate).toLocaleDateString()}</span>
                                                        {new Date(user.expDate) < new Date() && (
                                                            <span className="badge bg-danger ms-1">Expired</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted small">N/A (Unlimited)</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="small text-muted">{user.createdByName || 'System'}</span>
                                            </td>
                                            <td className="text-end">
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary"
                                                        title="Edit user & roles"
                                                        onClick={() => handleOpenEdit(user)}
                                                    >
                                                        <i className="fa-solid fa-pen-to-square"></i>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger"
                                                        title="Delete user"
                                                        disabled={user._id === currentUser?.id}
                                                        onClick={() => handleDeleteUser(user)}
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ====================================================
                Modal 1: Add New User
               ==================================================== */}
            {showAddModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleCreateUser}>
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="fa-solid fa-user-plus me-2"></i>
                                        Create New User Account
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {/* Role Selection */}
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Select Role & Privileges</label>
                                        <select
                                            className="form-select form-select-lg"
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                            required
                                        >
                                            <option value="super_admin">SUPER_ADMIN (Full access: Live, IPTV, VOD, Users, Roles)</option>
                                            <option value="admin">ADMIN (Can create clients & assign categories)</option>
                                            <option value="client_user">CLIENT_USER (Paying subscriber - watches streams)</option>
                                        </select>
                                        <div className="form-text small">
                                            {newUser.role === 'super_admin' && 'Super Admin is the only role with all access to live management, vod management, and assigning/deassigning roles.'}
                                            {newUser.role === 'admin' && 'Admin can create client user accounts and configure category visibility permissions.'}
                                            {newUser.role === 'client_user' && 'Client user is a subscriber account used in IPTV apps & media players.'}
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        {/* Name */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Full Name *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. John Doe"
                                                value={newUser.name}
                                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        {/* Phone Number */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Phone Number *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="e.g. +1 555-0192"
                                                value={newUser.phoneNumber}
                                                onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        {/* Email */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Email Address *</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                placeholder="john@example.com"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        {/* Status */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Account Status</label>
                                            <select
                                                className="form-select"
                                                value={newUser.status}
                                                onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="disabled">Disabled</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Credentials Section */}
                                    <div className="card bg-light border p-3 mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="fw-bold mb-0 text-primary">
                                                <i className="fa-solid fa-key me-1"></i> Login Credentials
                                            </h6>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => handleGenerateCredentials(false)}
                                            >
                                                <i className="fa-solid fa-wand-magic-sparkles me-1"></i> Auto-Generate Credentials
                                            </button>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Username *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={newUser.username}
                                                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Password *</label>
                                                <input
                                                    type="text"
                                                    className="form-control font-monospace"
                                                    value={newUser.password}
                                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Assignment Section (If client_user) */}
                                    {newUser.role === 'client_user' && (
                                        <div className="card border-info p-3 mb-3">
                                            <h6 className="fw-bold text-info mb-2">
                                                <i className="fa-solid fa-sliders me-1"></i> Subscription & Category Access
                                            </h6>

                                            <div className="row g-3 mb-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold">Expiration Date</label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={newUser.expDate}
                                                        onChange={(e) => setNewUser({ ...newUser, expDate: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold">Max Simultaneous Connections</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        className="form-control"
                                                        value={newUser.maxConnections}
                                                        onChange={(e) => setNewUser({ ...newUser, maxConnections: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Live TV Category access */}
                                            <div className="mb-2">
                                                <div className="form-check form-switch mb-1">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="newAllLive"
                                                        checked={newUser.allLiveCategories}
                                                        onChange={(e) => setNewUser({ ...newUser, allLiveCategories: e.target.checked })}
                                                    />
                                                    <label className="form-check-label fw-bold small" htmlFor="newAllLive">
                                                        Allow All Live TV Categories
                                                    </label>
                                                </div>
                                                {!newUser.allLiveCategories && (
                                                    <div className="p-2 border rounded bg-white" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                        {allCategories.liveCategories.map(cat => (
                                                            <div className="form-check" key={cat.id}>
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`new-live-${cat.id}`}
                                                                    checked={newUser.allowedLiveCategories.includes(cat.id)}
                                                                    onChange={(e) => {
                                                                        const set = new Set(newUser.allowedLiveCategories);
                                                                        e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                        setNewUser({ ...newUser, allowedLiveCategories: Array.from(set) });
                                                                    }}
                                                                />
                                                                <label className="form-check-label small" htmlFor={`new-live-${cat.id}`}>
                                                                    {cat.name}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* VOD Category access */}
                                            <div className="mb-2">
                                                <div className="form-check form-switch mb-1">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="newAllVod"
                                                        checked={newUser.allVodCategories}
                                                        onChange={(e) => setNewUser({ ...newUser, allVodCategories: e.target.checked })}
                                                    />
                                                    <label className="form-check-label fw-bold small" htmlFor="newAllVod">
                                                        Allow All VOD Movie Categories
                                                    </label>
                                                </div>
                                                {!newUser.allVodCategories && (
                                                    <div className="p-2 border rounded bg-white" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                        {allCategories.vodCategories.map(cat => (
                                                            <div className="form-check" key={cat.id}>
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`new-vod-${cat.id}`}
                                                                    checked={newUser.allowedVodCategories.includes(cat.id)}
                                                                    onChange={(e) => {
                                                                        const set = new Set(newUser.allowedVodCategories);
                                                                        e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                        setNewUser({ ...newUser, allowedVodCategories: Array.from(set) });
                                                                    }}
                                                                />
                                                                <label className="form-check-label small" htmlFor={`new-vod-${cat.id}`}>
                                                                    {cat.name}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Series Category access */}
                                            <div>
                                                <div className="form-check form-switch mb-1">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="newAllSeries"
                                                        checked={newUser.allSeriesCategories}
                                                        onChange={(e) => setNewUser({ ...newUser, allSeriesCategories: e.target.checked })}
                                                    />
                                                    <label className="form-check-label fw-bold small" htmlFor="newAllSeries">
                                                        Allow All TV Series Categories
                                                    </label>
                                                </div>
                                                {!newUser.allSeriesCategories && (
                                                    <div className="p-2 border rounded bg-white" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                        {allCategories.seriesCategories.map(cat => (
                                                            <div className="form-check" key={cat.id}>
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`new-series-${cat.id}`}
                                                                    checked={newUser.allowedSeriesCategories.includes(cat.id)}
                                                                    onChange={(e) => {
                                                                        const set = new Set(newUser.allowedSeriesCategories);
                                                                        e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                        setNewUser({ ...newUser, allowedSeriesCategories: Array.from(set) });
                                                                    }}
                                                                />
                                                                <label className="form-check-label small" htmlFor={`new-series-${cat.id}`}>
                                                                    {cat.name}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className="fa-solid fa-floppy-disk me-1"></i> Save User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ====================================================
                Modal 2: Edit User & Role Assignment
               ==================================================== */}
            {showEditModal && selectedUser && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleUpdateUser}>
                                <div className="modal-header bg-dark text-white">
                                    <h5 className="modal-title">
                                        <i className="fa-solid fa-user-pen me-2"></i>
                                        Edit User: @{selectedUser.username}
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    {/* Role Assignment (Only Super Admin can change roles) */}
                                    <div className="card bg-warning-subtle border-warning p-3 mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <i className="fa-solid fa-crown text-warning fs-4 me-2"></i>
                                            <h6 className="fw-bold mb-0 text-dark">Role & Privileges Assignment</h6>
                                        </div>
                                        <p className="small text-muted mb-2">
                                            As Super Admin, you can assign or deassign roles from any user:
                                        </p>
                                        <select
                                            className="form-select fw-bold"
                                            value={editFormData.role}
                                            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                        >
                                            <option value="super_admin">SUPER_ADMIN (Full privileges: Live, IPTV, VOD, Users, Roles)</option>
                                            <option value="admin">ADMIN (Operations: Create clients & assign categories)</option>
                                            <option value="client_user">CLIENT_USER (Consumer subscriber)</option>
                                        </select>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Full Name *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.name}
                                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Phone Number *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.phoneNumber}
                                                onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Email Address *</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={editFormData.email}
                                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Status</label>
                                            <select
                                                className="form-select"
                                                value={editFormData.status}
                                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="disabled">Disabled</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Password Reset */}
                                    <div className="card bg-light border p-3 mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="fw-bold mb-0 text-secondary">
                                                <i className="fa-solid fa-key me-1"></i> Reset Password (optional)
                                            </h6>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => handleGenerateCredentials(true)}
                                            >
                                                <i className="fa-solid fa-wand-magic-sparkles me-1"></i> Generate Password
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            className="form-control font-monospace"
                                            placeholder="Leave blank to keep existing password"
                                            value={editFormData.password}
                                            onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                        />
                                        {selectedUser.rawPassword && (
                                            <div className="small text-muted mt-1">
                                                Current subscriber password: <code>{selectedUser.rawPassword}</code>
                                            </div>
                                        )}
                                    </div>

                                    {/* Category Assignment if client user */}
                                    {editFormData.role === 'client_user' && (
                                        <div className="card border-info p-3 mb-3">
                                            <h6 className="fw-bold text-info mb-2">
                                                <i className="fa-solid fa-sliders me-1"></i> Client Category Access Permissions
                                            </h6>

                                            <div className="row g-3 mb-3">
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold">Subscription Expiration Date</label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={editFormData.expDate}
                                                        onChange={(e) => setEditFormData({ ...editFormData, expDate: e.target.value })}
                                                    />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label small fw-bold">Max Connections</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        className="form-control"
                                                        value={editFormData.maxConnections}
                                                        onChange={(e) => setEditFormData({ ...editFormData, maxConnections: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* Live TV */}
                                            <div className="mb-2">
                                                <div className="form-check form-switch mb-1">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="editAllLive"
                                                        checked={editFormData.allLiveCategories}
                                                        onChange={(e) => setEditFormData({ ...editFormData, allLiveCategories: e.target.checked })}
                                                    />
                                                    <label className="form-check-label fw-bold small" htmlFor="editAllLive">
                                                        Allow All Live TV Categories
                                                    </label>
                                                </div>
                                                {!editFormData.allLiveCategories && (
                                                    <div className="p-2 border rounded bg-white" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                        {allCategories.liveCategories.map(cat => (
                                                            <div className="form-check" key={cat.id}>
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`edit-live-${cat.id}`}
                                                                    checked={editFormData.allowedLiveCategories.includes(cat.id)}
                                                                    onChange={(e) => {
                                                                        const set = new Set(editFormData.allowedLiveCategories);
                                                                        e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                        setEditFormData({ ...editFormData, allowedLiveCategories: Array.from(set) });
                                                                    }}
                                                                />
                                                                <label className="form-check-label small" htmlFor={`edit-live-${cat.id}`}>
                                                                    {cat.name}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* VOD */}
                                            <div className="mb-2">
                                                <div className="form-check form-switch mb-1">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="editAllVod"
                                                        checked={editFormData.allVodCategories}
                                                        onChange={(e) => setEditFormData({ ...editFormData, allVodCategories: e.target.checked })}
                                                    />
                                                    <label className="form-check-label fw-bold small" htmlFor="editAllVod">
                                                        Allow All VOD Movie Categories
                                                    </label>
                                                </div>
                                                {!editFormData.allVodCategories && (
                                                    <div className="p-2 border rounded bg-white" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                        {allCategories.vodCategories.map(cat => (
                                                            <div className="form-check" key={cat.id}>
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`edit-vod-${cat.id}`}
                                                                    checked={editFormData.allowedVodCategories.includes(cat.id)}
                                                                    onChange={(e) => {
                                                                        const set = new Set(editFormData.allowedVodCategories);
                                                                        e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                        setEditFormData({ ...editFormData, allowedVodCategories: Array.from(set) });
                                                                    }}
                                                                />
                                                                <label className="form-check-label small" htmlFor={`edit-vod-${cat.id}`}>
                                                                    {cat.name}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Series */}
                                            <div>
                                                <div className="form-check form-switch mb-1">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="editAllSeries"
                                                        checked={editFormData.allSeriesCategories}
                                                        onChange={(e) => setEditFormData({ ...editFormData, allSeriesCategories: e.target.checked })}
                                                    />
                                                    <label className="form-check-label fw-bold small" htmlFor="editAllSeries">
                                                        Allow All TV Series Categories
                                                    </label>
                                                </div>
                                                {!editFormData.allSeriesCategories && (
                                                    <div className="p-2 border rounded bg-white" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                        {allCategories.seriesCategories.map(cat => (
                                                            <div className="form-check" key={cat.id}>
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`edit-series-${cat.id}`}
                                                                    checked={editFormData.allowedSeriesCategories.includes(cat.id)}
                                                                    onChange={(e) => {
                                                                        const set = new Set(editFormData.allowedSeriesCategories);
                                                                        e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                        setEditFormData({ ...editFormData, allowedSeriesCategories: Array.from(set) });
                                                                    }}
                                                                />
                                                                <label className="form-check-label small" htmlFor={`edit-series-${cat.id}`}>
                                                                    {cat.name}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className="fa-solid fa-check me-1"></i> Update User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default Users;
