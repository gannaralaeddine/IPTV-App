import React, { useState, useEffect } from 'react';
import AdminLayout from './layout/AdminLayout';
import { UserAPI, API_BASE_URL } from '../services/api';

const ClientUsers = () => {

    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const [allCategories, setAllCategories] = useState({
        liveCategories: [],
        vodCategories: [],
        seriesCategories: []
    });

    // Modals
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    const [copiedField, setCopiedField] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Generate Form state
    const [clientForm, setClientForm] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        username: '',
        password: '',
        durationMonths: 12, // Default 1 year
        expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        maxConnections: 1,
        status: 'active',
        allLiveCategories: true,
        allowedLiveCategories: [],
        allVodCategories: true,
        allowedVodCategories: [],
        allSeriesCategories: true,
        allowedSeriesCategories: [],
        notes: ''
    });

    // Edit Form state
    const [editForm, setEditForm] = useState({
        name: '',
        phoneNumber: '',
        email: '',
        password: '',
        expDate: '',
        maxConnections: 1,
        status: 'active',
        allLiveCategories: true,
        allowedLiveCategories: [],
        allVodCategories: true,
        allowedVodCategories: [],
        allSeriesCategories: true,
        allowedSeriesCategories: [],
        notes: ''
    });

    // Fetch clients
    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await UserAPI.get('/?role=client_user');
            setClients(res.data);
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to load client subscriptions');
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories for assignment
    const fetchCategories = async () => {
        try {
            const res = await UserAPI.get('/categories');
            setAllCategories(res.data);
        } catch (err) {
            console.warn('Failed to load categories:', err.message);
        }
    };

    useEffect(() => {
        fetchClients();
        fetchCategories();
    }, []);

    // Generate credentials
    const handleGenerateCredentials = async (isEdit = false) => {
        try {
            const res = await UserAPI.get('/generate-credentials');
            if (isEdit) {
                setEditForm(prev => ({ ...prev, password: res.data.password }));
            } else {
                setClientForm(prev => ({
                    ...prev,
                    username: res.data.username,
                    password: res.data.password
                }));
            }
        } catch (err) {
            console.error('Error auto-generating credentials:', err);
        }
    };

    // Duration preset change
    const handleDurationChange = (months) => {
        const newExp = new Date();
        newExp.setMonth(newExp.getMonth() + Number(months));
        setClientForm(prev => ({
            ...prev,
            durationMonths: Number(months),
            expDate: newExp.toISOString().split('T')[0]
        }));
    };

    // Open Generate Modal
    const handleOpenGenerateModal = () => {
        handleGenerateCredentials(false);
        setShowGenerateModal(true);
    };

    // Handle Create Client
    const handleCreateClient = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const payload = {
                ...clientForm,
                role: 'client_user'
            };
            const res = await UserAPI.post('/', payload);
            setSuccessMsg(`Client subscription for "${clientForm.name}" created successfully!`);
            setShowGenerateModal(false);
            // Open credentials modal to allow instant copy
            if (res.data?.user) {
                setSelectedClient(res.data.user);
                setShowCredentialsModal(true);
            }
            // Reset form
            setClientForm({
                name: '',
                phoneNumber: '',
                email: '',
                username: '',
                password: '',
                durationMonths: 12,
                expDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                maxConnections: 1,
                status: 'active',
                allLiveCategories: true,
                allowedLiveCategories: [],
                allVodCategories: true,
                allowedVodCategories: [],
                allSeriesCategories: true,
                allowedSeriesCategories: [],
                notes: ''
            });
            fetchClients();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to create client subscription');
        }
    };

    // Open Edit Modal
    const handleOpenEdit = (client) => {
        setSelectedClient(client);
        setEditForm({
            name: client.name || '',
            phoneNumber: client.phoneNumber || '',
            email: client.email || '',
            password: '',
            expDate: client.expDate ? new Date(client.expDate).toISOString().split('T')[0] : '',
            maxConnections: client.maxConnections || 1,
            status: client.status || 'active',
            allLiveCategories: client.allLiveCategories !== undefined ? client.allLiveCategories : true,
            allowedLiveCategories: client.allowedLiveCategories || [],
            allVodCategories: client.allVodCategories !== undefined ? client.allVodCategories : true,
            allowedVodCategories: client.allowedVodCategories || [],
            allSeriesCategories: client.allSeriesCategories !== undefined ? client.allSeriesCategories : true,
            allowedSeriesCategories: client.allowedSeriesCategories || [],
            notes: client.notes || ''
        });
        setShowEditModal(true);
    };

    // Handle Update Client
    const handleUpdateClient = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        try {
            await UserAPI.put(`/${selectedClient._id}`, editForm);
            setSuccessMsg(`Client account "${selectedClient.username}" updated successfully!`);
            setShowEditModal(false);
            setSelectedClient(null);
            fetchClients();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to update client');
        }
    };

    // Handle Delete Client
    const handleDeleteClient = async (client) => {
        if (!window.confirm(`Are you sure you want to delete client "${client.name}" (@${client.username})?`)) {
            return;
        }

        try {
            await UserAPI.delete(`/${client._id}`);
            setSuccessMsg(`Client account "${client.username}" deleted.`);
            fetchClients();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to delete client');
        }
    };

    // Toggle Client Status
    const handleToggleStatus = async (client) => {
        const nextStatus = client.status === 'active' ? 'disabled' : 'active';
        try {
            await UserAPI.put(`/${client._id}`, { status: nextStatus });
            setSuccessMsg(`Client status changed to ${nextStatus}.`);
            fetchClients();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Failed to update status');
        }
    };

    // Copy to clipboard helper
    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(''), 2500);
    };

    // Filter clients
    const filteredClients = clients.filter(c => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const q = searchTerm.toLowerCase();
        const matchesSearch = !q ||
            c.username.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.phoneNumber && c.phoneNumber.toLowerCase().includes(q));
        return matchesStatus && matchesSearch;
    });

    const activeCount = clients.filter(c => c.status === 'active' && (!c.expDate || new Date(c.expDate) >= new Date())).length;
    const expiredCount = clients.filter(c => c.expDate && new Date(c.expDate) < new Date()).length;
    const disabledCount = clients.filter(c => c.status === 'disabled').length;

    return (
        <AdminLayout
            title="Subscriber Management"
            subtitle="Client accounts, subscriptions & category visibility"
            breadcrumbs={[{ label: 'Subscribers', link: '/client-users' }]}
        >
            {/* Alerts */}
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

            {/* Top Stat Boxes */}
            <div className="row mb-4">
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-green">
                        <div className="inner">
                            <h3>{activeCount}</h3>
                            <p>Active Paying Subscribers</p>
                        </div>
                        <div className="icon"><i className="fa-solid fa-circle-check"></i></div>
                    </div>
                </div>
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-red">
                        <div className="inner">
                            <h3>{expiredCount}</h3>
                            <p>Expired Subscriptions</p>
                        </div>
                        <div className="icon"><i className="fa-solid fa-hourglass-end"></i></div>
                    </div>
                </div>
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-yellow">
                        <div className="inner">
                            <h3>{disabledCount}</h3>
                            <p>Disabled / Paused Accounts</p>
                        </div>
                        <div className="icon"><i className="fa-solid fa-ban"></i></div>
                    </div>
                </div>
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-aqua">
                        <div className="inner">
                            <h3>{clients.length}</h3>
                            <p>Total Client Accounts</p>
                        </div>
                        <div className="icon"><i className="fa-solid fa-users"></i></div>
                    </div>
                </div>
            </div>

            {/* Client Accounts Card */}
            <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2">
                        <h5 className="mb-0 fw-bold text-dark">
                            <i className="fa-solid fa-id-card text-primary me-2"></i>
                            Client Subscription Accounts
                        </h5>
                        <span className="badge bg-light text-dark border">
                            {filteredClients.length} of {clients.length} clients
                        </span>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        {/* Status Filter */}
                        <select
                            className="form-select form-select-sm"
                            style={{ width: '130px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                        </select>

                        {/* Search Input */}
                        <div className="input-group input-group-sm" style={{ width: '220px' }}>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Search clients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span className="input-group-text bg-white text-muted">
                                <i className="fa-solid fa-magnifying-glass"></i>
                            </span>
                        </div>

                        {/* Generate New Account Button */}
                        <button
                            type="button"
                            className="btn btn-sm btn-success fw-bold"
                            onClick={handleOpenGenerateModal}
                        >
                            <i className="fa-solid fa-plus-circle me-1"></i> Generate Client Account
                        </button>
                    </div>
                </div>

                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Client / Username</th>
                                    <th>Contact Details</th>
                                    <th>Status</th>
                                    <th>Subscription Expiration</th>
                                    <th>Category Visibility</th>
                                    <th>Created By</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5">
                                            <div className="spinner-border text-success" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                            <div className="mt-2 text-muted">Loading client subscriptions...</div>
                                        </td>
                                    </tr>
                                ) : filteredClients.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-5 text-muted">
                                            <i className="fa-solid fa-user-xmark fs-3 d-block mb-2"></i>
                                            No client subscriptions found. Click <strong>Generate Client Account</strong> to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredClients.map(client => {
                                        const isExpired = client.expDate && new Date(client.expDate) < new Date();
                                        return (
                                            <tr key={client._id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            backgroundColor: isExpired ? '#dd4b39' : (client.status === 'active' ? '#00a65a' : '#777'),
                                                            color: '#fff',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontWeight: 'bold',
                                                            marginRight: '12px'
                                                        }}>
                                                            {client.name ? client.name.charAt(0).toUpperCase() : 'C'}
                                                        </div>
                                                        <div>
                                                            <div className="fw-bold text-dark">{client.name}</div>
                                                            <div className="text-muted font-monospace small">
                                                                @{client.username}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="small"><i className="fa-solid fa-phone text-muted me-1"></i> {client.phoneNumber}</div>
                                                    <div className="small text-muted"><i className="fa-solid fa-envelope text-muted me-1"></i> {client.email}</div>
                                                </td>
                                                <td>
                                                    {client.status === 'disabled' ? (
                                                        <span className="badge bg-secondary">Disabled</span>
                                                    ) : isExpired ? (
                                                        <span className="badge bg-danger">Expired</span>
                                                    ) : (
                                                        <span className="badge bg-success">Active</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {client.expDate ? (
                                                        <div>
                                                            <span className="fw-semibold">{new Date(client.expDate).toLocaleDateString()}</span>
                                                            <div className="small text-muted">
                                                                {isExpired ? (
                                                                    <span className="text-danger">Expired</span>
                                                                ) : (
                                                                    <span>Expires in {Math.ceil((new Date(client.expDate) - new Date()) / (1000 * 60 * 60 * 24))} days</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small">Lifetime</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="small">
                                                        <span className={`badge me-1 ${client.allLiveCategories ? 'bg-primary' : 'bg-info text-dark'}`}>
                                                            {client.allLiveCategories ? 'All Live' : `${client.allowedLiveCategories?.length || 0} Live`}
                                                        </span>
                                                        <span className={`badge me-1 ${client.allVodCategories ? 'bg-primary' : 'bg-info text-dark'}`}>
                                                            {client.allVodCategories ? 'All VOD' : `${client.allowedVodCategories?.length || 0} VOD`}
                                                        </span>
                                                        <span className={`badge ${client.allSeriesCategories ? 'bg-primary' : 'bg-info text-dark'}`}>
                                                            {client.allSeriesCategories ? 'All Series' : `${client.allowedSeriesCategories?.length || 0} Series`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="small text-muted">{client.createdByName || 'Admin'}</span>
                                                </td>
                                                <td className="text-end">
                                                    <div className="btn-group btn-group-sm">
                                                        {/* Credentials / M3U Modal trigger */}
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-info"
                                                            title="View credentials & M3U playlist"
                                                            onClick={() => {
                                                                setSelectedClient(client);
                                                                setShowCredentialsModal(true);
                                                            }}
                                                        >
                                                            <i className="fa-solid fa-key"></i>
                                                        </button>
                                                        {/* Edit Categories & Subscription */}
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-primary"
                                                            title="Edit client & category visibility"
                                                            onClick={() => handleOpenEdit(client)}
                                                        >
                                                            <i className="fa-solid fa-pen-to-square"></i>
                                                        </button>
                                                        {/* Toggle active / disabled */}
                                                        <button
                                                            type="button"
                                                            className={`btn ${client.status === 'active' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                            title={client.status === 'active' ? 'Disable subscription' : 'Activate subscription'}
                                                            onClick={() => handleToggleStatus(client)}
                                                        >
                                                            <i className={`fa-solid ${client.status === 'active' ? 'fa-pause' : 'fa-play'}`}></i>
                                                        </button>
                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger"
                                                            title="Delete client"
                                                            onClick={() => handleDeleteClient(client)}
                                                        >
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ====================================================
                Modal 1: Generate Client Account (Automatically)
               ==================================================== */}
            {showGenerateModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleCreateClient}>
                                <div className="modal-header bg-success text-white">
                                    <h5 className="modal-title">
                                        <i className="fa-solid fa-wand-magic-sparkles me-2"></i>
                                        Generate Client Subscription Account
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowGenerateModal(false)}></button>
                                </div>

                                <div className="modal-body p-4">
                                    {/* Subscriber Customer Details */}
                                    <div className="card bg-light border p-3 mb-3">
                                        <h6 className="fw-bold text-dark mb-3">
                                            <i className="fa-solid fa-user me-2"></i> Subscriber Contact Information
                                        </h6>
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Subscriber Full Name *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="e.g. John Doe"
                                                    value={clientForm.name}
                                                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Phone Number *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="e.g. +1 555-0199"
                                                    value={clientForm.phoneNumber}
                                                    onChange={(e) => setClientForm({ ...clientForm, phoneNumber: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-12">
                                                <label className="form-label small fw-bold">Email Address *</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    placeholder="customer@email.com"
                                                    value={clientForm.email}
                                                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Auto-Generated Login Credentials */}
                                    <div className="card border-primary p-3 mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="fw-bold mb-0 text-primary">
                                                <i className="fa-solid fa-key me-2"></i> IPTV Credentials (Auto-Generated)
                                            </h6>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleGenerateCredentials(false)}
                                            >
                                                <i className="fa-solid fa-arrows-rotate me-1"></i> Re-generate
                                            </button>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Username *</label>
                                                <input
                                                    type="text"
                                                    className="form-control font-monospace fw-bold"
                                                    value={clientForm.username}
                                                    onChange={(e) => setClientForm({ ...clientForm, username: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Password *</label>
                                                <input
                                                    type="text"
                                                    className="form-control font-monospace fw-bold text-success"
                                                    value={clientForm.password}
                                                    onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subscription Duration Presets */}
                                    <div className="card bg-light border p-3 mb-3">
                                        <h6 className="fw-bold text-dark mb-2">
                                            <i className="fa-solid fa-calendar-check me-2"></i> Subscription Duration
                                        </h6>
                                        <div className="btn-group w-100 mb-3" role="group">
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${clientForm.durationMonths === 1 ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => handleDurationChange(1)}
                                            >
                                                1 Month
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${clientForm.durationMonths === 3 ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => handleDurationChange(3)}
                                            >
                                                3 Months
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${clientForm.durationMonths === 6 ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => handleDurationChange(6)}
                                            >
                                                6 Months
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn btn-sm ${clientForm.durationMonths === 12 ? 'btn-primary' : 'btn-outline-primary'}`}
                                                onClick={() => handleDurationChange(12)}
                                            >
                                                1 Year
                                            </button>
                                        </div>

                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Custom Expiration Date</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={clientForm.expDate}
                                                    onChange={(e) => setClientForm({ ...clientForm, expDate: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold">Max Connections</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    className="form-control"
                                                    value={clientForm.maxConnections}
                                                    onChange={(e) => setClientForm({ ...clientForm, maxConnections: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category Assignment Section */}
                                    <div className="card border-info p-3 mb-2">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <h6 className="fw-bold text-info mb-0">
                                                <i className="fa-solid fa-list-check me-2"></i> Category Permissions (Allowed Content)
                                            </h6>
                                            <span className="small text-muted">Select what this client can watch</span>
                                        </div>

                                        {/* 1. Live TV Categories */}
                                        <div className="p-2 border rounded bg-white mb-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="form-check form-switch mb-0">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="clientAllLive"
                                                        checked={clientForm.allLiveCategories}
                                                        onChange={(e) => setClientForm({ ...clientForm, allLiveCategories: e.target.checked })}
                                                    />
                                                    <label className="form-check-label fw-bold small" htmlFor="clientAllLive">
                                                        <i className="fa-solid fa-tv text-primary me-1"></i> Allow All Live TV Categories
                                                    </label>
                                                </div>
                                                <span className="badge bg-light text-secondary">
                                                    {clientForm.allLiveCategories ? 'All Allowed' : `${clientForm.allowedLiveCategories.length} selected`}
                                                </span>
                                            </div>

                                            {!clientForm.allLiveCategories && (
                                                <div className="mt-2 pt-2 border-top" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                                                    {allCategories.liveCategories.length === 0 ? (
                                                        <span className="small text-muted">No live categories available in database.</span>
                                                    ) : (
                                                        allCategories.liveCategories.map(cat => (
                                                            <div className="form-check form-check-inline" key={cat.id}>
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`gen-live-${cat.id}`}
                                                                    checked={clientForm.allowedLiveCategories.includes(cat.id)}
                                                                    onChange={(e) => {
                                                                        const set = new Set(clientForm.allowedLiveCategories);
                                                                        e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                        setClientForm({ ...clientForm, allowedLiveCategories: Array.from(set) });
                                                                    }}
                                                                />
                                                                <label className="form-check-label small" htmlFor={`gen-live-${cat.id}`}>
                                                                    {cat.name}
                                                                </label>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* 2. VOD Movie Categories */}
                                        <div className="p-2 border rounded bg-white mb-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="form-check form-switch mb-0">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="clientAllVod"
                                                        checked={clientForm.allVodCategories}
                                                        onChange={(e) => setClientForm({ ...clientForm, allVodCategories: e.target.checked })}
                                                    />
                                                    <label className="form-check-label fw-bold small" htmlFor="clientAllVod">
                                                        <i className="fa-solid fa-film text-danger me-1"></i> Allow All VOD Movies Categories
                                                    </label>
                                                </div>
                                                <span className="badge bg-light text-secondary">
                                                    {clientForm.allVodCategories ? 'All Allowed' : `${clientForm.allowedVodCategories.length} selected`}
                                                </span>
                                            </div>

                                            {!clientForm.allVodCategories && (
                                                <div className="mt-2 pt-2 border-top" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                                                    {allCategories.vodCategories.length === 0 ? (
                                                        <span className="small text-muted">No VOD categories available.</span>
                                                    ) : (
                                                        allCategories.vodCategories.map(cat => (
                                                            <div className="form-check form-check-inline" key={cat.id}>
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`gen-vod-${cat.id}`}
                                                                    checked={clientForm.allowedVodCategories.includes(cat.id)}
                                                                    onChange={(e) => {
                                                                        const set = new Set(clientForm.allowedVodCategories);
                                                                        e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                        setClientForm({ ...clientForm, allowedVodCategories: Array.from(set) });
                                                                    }}
                                                                />
                                                                <label className="form-check-label small" htmlFor={`gen-vod-${cat.id}`}>
                                                                    {cat.name}
                                                                </label>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* 3. TV Series Categories */}
                                        <div className="p-2 border rounded bg-white">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="form-check form-switch mb-0">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="clientAllSeries"
                                                        checked={clientForm.allSeriesCategories}
                                                        onChange={(e) => setClientForm({ ...clientForm, allSeriesCategories: e.target.checked })}
                                                    />
                                                    <label className="form-check-label fw-bold small" htmlFor="clientAllSeries">
                                                        <i className="fa-solid fa-layer-group text-warning me-1"></i> Allow All TV Series Categories
                                                    </label>
                                                </div>
                                                <span className="badge bg-light text-secondary">
                                                    {clientForm.allSeriesCategories ? 'All Allowed' : `${clientForm.allowedSeriesCategories.length} selected`}
                                                </span>
                                            </div>

                                            {!clientForm.allSeriesCategories && (
                                                <div className="mt-2 pt-2 border-top" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                                                    {allCategories.seriesCategories.length === 0 ? (
                                                        <span className="small text-muted">No series categories available.</span>
                                                    ) : (
                                                        allCategories.seriesCategories.map(cat => (
                                                            <div className="form-check form-check-inline" key={cat.id}>
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`gen-series-${cat.id}`}
                                                                    checked={clientForm.allowedSeriesCategories.includes(cat.id)}
                                                                    onChange={(e) => {
                                                                        const set = new Set(clientForm.allowedSeriesCategories);
                                                                        e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                        setClientForm({ ...clientForm, allowedSeriesCategories: Array.from(set) });
                                                                    }}
                                                                />
                                                                <label className="form-check-label small" htmlFor={`gen-series-${cat.id}`}>
                                                                    {cat.name}
                                                                </label>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-success fw-bold">
                                        <i className="fa-solid fa-check me-1"></i> Generate Account
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ====================================================
                Modal 2: View Credentials & M3U Playlist Links
               ==================================================== */}
            {showCredentialsModal && selectedClient && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-info text-white">
                                <h5 className="modal-title">
                                    <i className="fa-solid fa-key me-2"></i>
                                    Subscriber Credentials & Player Links: {selectedClient.name}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCredentialsModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="text-muted small mb-3">
                                    Provide these credentials to the customer or paste the M3U playlist link into their IPTV application (TiviMate, IPTV Smarters, VLC, etc.).
                                </p>

                                {/* Credentials Box */}
                                <div className="card bg-light border mb-3">
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">Username</label>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        className="form-control font-monospace bg-white"
                                                        value={selectedClient.username}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => copyToClipboard(selectedClient.username, 'username')}
                                                    >
                                                        {copiedField === 'username' ? (
                                                            <i className="fa-solid fa-check text-success"></i>
                                                        ) : (
                                                            <i className="fa-solid fa-copy"></i>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label small fw-bold text-secondary">Password</label>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        className="form-control font-monospace bg-white text-success fw-bold"
                                                        value={selectedClient.rawPassword || '••••••••'}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={() => copyToClipboard(selectedClient.rawPassword || '', 'password')}
                                                        disabled={!selectedClient.rawPassword}
                                                    >
                                                        {copiedField === 'password' ? (
                                                            <i className="fa-solid fa-check text-success"></i>
                                                        ) : (
                                                            <i className="fa-solid fa-copy"></i>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Server URL & M3U Playlist */}
                                <div className="card bg-light border mb-3">
                                    <div className="card-body">
                                        {/* Server URL */}
                                        <div className="mb-3">
                                            <label className="form-label small fw-bold text-secondary">Xtream Server URL</label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    className="form-control font-monospace bg-white small"
                                                    value={API_BASE_URL}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => copyToClipboard(API_BASE_URL, 'server')}
                                                >
                                                    {copiedField === 'server' ? (
                                                        <i className="fa-solid fa-check text-success"></i>
                                                    ) : (
                                                        <i className="fa-solid fa-copy"></i>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* M3U URL */}
                                        <div>
                                            <label className="form-label small fw-bold text-secondary">M3U Plus Playlist URL</label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    className="form-control font-monospace bg-white small"
                                                    value={`${API_BASE_URL}/get.php?username=${selectedClient.username}&password=${selectedClient.rawPassword || 'PASSWORD'}&type=m3u`}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary"
                                                    onClick={() => copyToClipboard(`${API_BASE_URL}/get.php?username=${selectedClient.username}&password=${selectedClient.rawPassword || ''}&type=m3u`, 'm3u')}
                                                >
                                                    {copiedField === 'm3u' ? (
                                                        <i className="fa-solid fa-check text-success"></i>
                                                    ) : (
                                                        <i className="fa-solid fa-copy"></i>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-info-subtle border border-info rounded small text-info-emphasis">
                                    <i className="fa-solid fa-circle-info me-2"></i>
                                    When the client connects with these credentials, the server automatically checks their account expiration date and filters content according to their assigned categories.
                                </div>
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-primary" onClick={() => setShowCredentialsModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ====================================================
                Modal 3: Edit Client & Categories
               ==================================================== */}
            {showEditModal && selectedClient && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleUpdateClient}>
                                <div className="modal-header bg-primary text-white">
                                    <h5 className="modal-title">
                                        <i className="fa-solid fa-pen-to-square me-2"></i>
                                        Edit Client Subscription: @{selectedClient.username}
                                    </h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Full Name *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Phone Number *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editForm.phoneNumber}
                                                onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Email Address *</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Status</label>
                                            <select
                                                className="form-select"
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="disabled">Disabled</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Password Reset */}
                                    <div className="card bg-light border p-3 mb-3">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <label className="form-label small fw-bold mb-0">Reset Password (Optional)</label>
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
                                            placeholder="Leave empty to keep existing password"
                                            value={editForm.password}
                                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                        />
                                    </div>

                                    {/* Expiration Date & Connections */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Subscription Expiration Date</label>
                                            <input
                                                type="date"
                                                className="form-control"
                                                value={editForm.expDate}
                                                onChange={(e) => setEditForm({ ...editForm, expDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Max Simultaneous Connections</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                className="form-control"
                                                value={editForm.maxConnections}
                                                onChange={(e) => setEditForm({ ...editForm, maxConnections: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Category Assignment Selection */}
                                    <div className="card border-info p-3 mb-2">
                                        <h6 className="fw-bold text-info mb-3">
                                            <i className="fa-solid fa-list-check me-2"></i> Category Visibility Permissions
                                        </h6>

                                        {/* Live Categories */}
                                        <div className="p-2 border rounded bg-white mb-2">
                                            <div className="form-check form-switch mb-1">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="editClientAllLive"
                                                    checked={editForm.allLiveCategories}
                                                    onChange={(e) => setEditForm({ ...editForm, allLiveCategories: e.target.checked })}
                                                />
                                                <label className="form-check-label fw-bold small" htmlFor="editClientAllLive">
                                                    Allow All Live TV Categories
                                                </label>
                                            </div>
                                            {!editForm.allLiveCategories && (
                                                <div className="mt-2 pt-2 border-top" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                                                    {allCategories.liveCategories.map(cat => (
                                                        <div className="form-check form-check-inline" key={cat.id}>
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`edit-c-live-${cat.id}`}
                                                                checked={editForm.allowedLiveCategories.includes(cat.id)}
                                                                onChange={(e) => {
                                                                    const set = new Set(editForm.allowedLiveCategories);
                                                                    e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                    setEditForm({ ...editForm, allowedLiveCategories: Array.from(set) });
                                                                }}
                                                            />
                                                            <label className="form-check-label small" htmlFor={`edit-c-live-${cat.id}`}>
                                                                {cat.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* VOD Categories */}
                                        <div className="p-2 border rounded bg-white mb-2">
                                            <div className="form-check form-switch mb-1">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="editClientAllVod"
                                                    checked={editForm.allVodCategories}
                                                    onChange={(e) => setEditForm({ ...editForm, allVodCategories: e.target.checked })}
                                                />
                                                <label className="form-check-label fw-bold small" htmlFor="editClientAllVod">
                                                    Allow All VOD Movies Categories
                                                </label>
                                            </div>
                                            {!editForm.allVodCategories && (
                                                <div className="mt-2 pt-2 border-top" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                                                    {allCategories.vodCategories.map(cat => (
                                                        <div className="form-check form-check-inline" key={cat.id}>
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`edit-c-vod-${cat.id}`}
                                                                checked={editForm.allowedVodCategories.includes(cat.id)}
                                                                onChange={(e) => {
                                                                    const set = new Set(editForm.allowedVodCategories);
                                                                    e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                    setEditForm({ ...editForm, allowedVodCategories: Array.from(set) });
                                                                }}
                                                            />
                                                            <label className="form-check-label small" htmlFor={`edit-c-vod-${cat.id}`}>
                                                                {cat.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Series Categories */}
                                        <div className="p-2 border rounded bg-white">
                                            <div className="form-check form-switch mb-1">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="editClientAllSeries"
                                                    checked={editForm.allSeriesCategories}
                                                    onChange={(e) => setEditForm({ ...editForm, allSeriesCategories: e.target.checked })}
                                                />
                                                <label className="form-check-label fw-bold small" htmlFor="editClientAllSeries">
                                                    Allow All TV Series Categories
                                                </label>
                                            </div>
                                            {!editForm.allSeriesCategories && (
                                                <div className="mt-2 pt-2 border-top" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                                                    {allCategories.seriesCategories.map(cat => (
                                                        <div className="form-check form-check-inline" key={cat.id}>
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`edit-c-series-${cat.id}`}
                                                                checked={editForm.allowedSeriesCategories.includes(cat.id)}
                                                                onChange={(e) => {
                                                                    const set = new Set(editForm.allowedSeriesCategories);
                                                                    e.target.checked ? set.add(cat.id) : set.delete(cat.id);
                                                                    setEditForm({ ...editForm, allowedSeriesCategories: Array.from(set) });
                                                                }}
                                                            />
                                                            <label className="form-check-label small" htmlFor={`edit-c-series-${cat.id}`}>
                                                                {cat.name}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className="fa-solid fa-check me-1"></i> Update Client
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

export default ClientUsers;
