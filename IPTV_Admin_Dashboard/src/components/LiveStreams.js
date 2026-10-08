import React, { useState, useEffect } from 'react';
import { LiveAPI } from '../services/api';
import AdminLayout from './layout/AdminLayout';

const LiveStreams = () => {
    const [streams, setStreams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        file: null,
        stream_icon: '',
        added: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchStreams();
        fetchCategories();
    }, []);

    const fetchStreams = async () => {
        try {
            const res = await LiveAPI.get('/live-streams');
            setStreams(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error fetching streams');
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await LiveAPI.get('/live-categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    // Helper to get category name from category_id
    const getCategoryName = (categoryId) => {
        const cat = categories.find((c) => c.category_id === categoryId);
        return cat ? cat.category_name : `Category ${categoryId}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('category_id', formData.category_id);
            if (formData.file) {
                data.append('file', formData.file);
            } else if (!editingId) {
                throw new Error('File is required for new streams');
            }
            data.append('stream_icon', formData.stream_icon || '');
            data.append('added', formData.added || new Date().toISOString());

            if (editingId) {
                await LiveAPI.put(`/update-live-stream/${editingId}`, data);
                setSuccess('Live stream updated successfully');
            } else {
                await LiveAPI.post('/create-live-stream', data);
                setSuccess('Live stream created successfully');
            }
            await fetchStreams();
            resetForm();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Error saving stream');
        }
    };

    const handleEdit = (stream) => {
        setFormData({
            name: stream.name,
            category_id: stream.category_id,
            file: null, // File input should be re-selected if changing
            stream_icon: stream.stream_icon || '',
            added: stream.added ? new Date(stream.added).toISOString().slice(0, 16) : ''
        });
        setEditingId(stream._id);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this stream?')) return;
        try {
            await LiveAPI.delete(`/delete-live-stream/${id}`);
            await fetchStreams();
            setSuccess('Stream deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error deleting stream');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category_id: '',
            file: null,
            stream_icon: '',
            added: ''
        });
        setEditingId(null);
        setError('');
    };

    return (
        <AdminLayout
            title="Live Streams"
            subtitle="Manage TV channels and live broadcast streams"
            breadcrumbs={[
                { label: 'IPTV Management', link: '/live-streams' },
                { label: 'Live Streams' }
            ]}
        >
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Form Card */}
            <div className="admin-card mb-4">
                <div className="admin-card-header bg-light">
                    <h3 className="admin-card-title">
                        <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'} text-primary me-2`}></i>
                        {editingId ? 'Edit Live Stream' : 'Add New Live Stream'}
                    </h3>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="row g-3">
                            {/* Stream Name */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Stream Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ESPN HD, HBO 1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-control"
                                    required
                                />
                            </div>

                            {/* Select Live Category (Dropdown instead of ID) */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Category *</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="form-select"
                                    required
                                >
                                    <option value="">-- Choose Category --</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat.category_id}>
                                            {cat.category_name}
                                        </option>
                                    ))}
                                </select>
                                {categories.length === 0 && (
                                    <div className="form-text text-warning">
                                        No categories found. Please create a Live Category first.
                                    </div>
                                )}
                            </div>

                            {/* Stream File */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">
                                    Media File (.ts, .m3u8, .mp4) {editingId ? '(Optional if keeping current)' : '*'}
                                </label>
                                <input
                                    type="file"
                                    accept=".ts,.m3u8,.mp4"
                                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                    className="form-control"
                                    required={!editingId}
                                />
                            </div>

                            {/* Stream Icon URL */}
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Stream Icon / Logo URL</label>
                                <input
                                    type="text"
                                    placeholder="https://example.com/logo.png"
                                    value={formData.stream_icon}
                                    onChange={(e) => setFormData({ ...formData, stream_icon: e.target.value })}
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="mt-4 d-flex gap-2">
                            <button type="submit" className="btn btn-primary px-4">
                                <i className="fa-solid fa-check me-1"></i>
                                {editingId ? 'Update Stream' : 'Save Stream'}
                            </button>
                            {editingId && (
                                <button type="button" onClick={resetForm} className="btn btn-secondary px-3">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* Table Card */}
            <div className="admin-card">
                <div className="admin-card-header bg-light">
                    <h3 className="admin-card-title">
                        <i className="fa-solid fa-list text-primary me-2"></i>
                        Available Live Streams ({streams.length})
                    </h3>
                </div>
                <div className="admin-card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '80px' }}>ID</th>
                                    <th>Icon</th>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>File</th>
                                    <th>Added Date</th>
                                    <th style={{ width: '150px' }} className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {streams.length > 0 ? (
                                    streams.map((stream) => (
                                        <tr key={stream._id}>
                                            <td className="fw-bold text-muted">#{stream.stream_id}</td>
                                            <td>
                                                {stream.stream_icon ? (
                                                    <img
                                                        src={stream.stream_icon}
                                                        alt={stream.name}
                                                        style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <span className="badge bg-secondary">No Icon</span>
                                                )}
                                            </td>
                                            <td className="fw-semibold">{stream.name}</td>
                                            <td>
                                                <span className="badge bg-info text-dark">
                                                    {getCategoryName(stream.category_id)}
                                                </span>
                                            </td>
                                            <td><code>{stream.file}</code></td>
                                            <td className="text-muted small">
                                                {stream.added ? new Date(stream.added).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    onClick={() => handleEdit(stream)}
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    title="Edit"
                                                >
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(stream.stream_id)}
                                                    className="btn btn-sm btn-outline-danger"
                                                    title="Delete"
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            No live streams found. Use the form above to add one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default LiveStreams;
