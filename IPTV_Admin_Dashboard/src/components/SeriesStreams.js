import React, { useState, useEffect } from 'react';
import { SeriesAPI } from '../services/api';
import AdminLayout from './layout/AdminLayout';

const SeriesStreams = () => {
    const [streams, setStreams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
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
            const res = await SeriesAPI.get('/series-streams');
            setStreams(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error fetching streams');
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await SeriesAPI.get('/series-categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching series categories:', err);
        }
    };

    const getCategoryName = (categoryId) => {
        const cat = categories.find((c) => c.category_id === categoryId);
        return cat ? cat.category_name : `Category ${categoryId}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                category_id: formData.category_id,
                stream_icon: formData.stream_icon || '',
                added: formData.added || new Date().toISOString()
            };

            if (editingId) {
                await SeriesAPI.put(`/update-series-stream/${editingId}`, payload);
                setSuccess('Series updated successfully');
            } else {
                await SeriesAPI.post('/create-series-stream', payload);
                setSuccess('Series created successfully');
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
            stream_icon: stream.stream_icon || '',
            added: stream.added ? new Date(stream.added).toISOString().slice(0, 16) : ''
        });
        setEditingId(stream._id);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this series?')) return;
        try {
            await SeriesAPI.delete(`/delete-series-stream/${id}`);
            await fetchStreams();
            setSuccess('Series deleted successfully');
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
            stream_icon: '',
            added: ''
        });
        setEditingId(null);
        setError('');
    };

    return (
        <AdminLayout
            title="TV Series"
            subtitle="Manage TV show series catalogue"
            breadcrumbs={[
                { label: 'Series Management', link: '/series-streams' },
                { label: 'Series' }
            ]}
        >
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="admin-card mb-4">
                <div className="admin-card-header bg-light">
                    <h3 className="admin-card-title">
                        <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'} text-primary me-2`}></i>
                        {editingId ? 'Edit Series' : 'Add New TV Series'}
                    </h3>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Series Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Breaking Bad, Game of Thrones"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-control"
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Category *</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="form-select"
                                    required
                                >
                                    <option value="">-- Select Series Category --</option>
                                    {categories.map((cat) => (
                                        <option key={cat._id} value={cat.category_id}>
                                            {cat.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-12">
                                <label className="form-label fw-semibold">Series Cover / Poster URL</label>
                                <input
                                    type="text"
                                    placeholder="https://example.com/poster.jpg"
                                    value={formData.stream_icon}
                                    onChange={(e) => setFormData({ ...formData, stream_icon: e.target.value })}
                                    className="form-control"
                                />
                            </div>
                        </div>

                        <div className="mt-4 d-flex gap-2">
                            <button type="submit" className="btn btn-primary px-4">
                                <i className="fa-solid fa-check me-1"></i>
                                {editingId ? 'Update Series' : 'Save Series'}
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

            <div className="admin-card">
                <div className="admin-card-header bg-light">
                    <h3 className="admin-card-title">
                        <i className="fa-solid fa-tv text-primary me-2"></i>
                        Available Series ({streams.length})
                    </h3>
                </div>
                <div className="admin-card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '80px' }}>ID</th>
                                    <th>Poster</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Added Date</th>
                                    <th style={{ width: '150px' }} className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {streams.length > 0 ? (
                                    streams.map((stream) => (
                                        <tr key={stream._id}>
                                            <td className="fw-bold text-muted">#{stream.series_id}</td>
                                            <td>
                                                {stream.stream_icon ? (
                                                    <img
                                                        src={stream.stream_icon}
                                                        alt={stream.name}
                                                        style={{ width: '36px', height: '48px', objectFit: 'cover', borderRadius: '3px' }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <span className="badge bg-secondary">No Poster</span>
                                                )}
                                            </td>
                                            <td className="fw-semibold">{stream.name}</td>
                                            <td>
                                                <span className="badge bg-warning text-dark">
                                                    {getCategoryName(stream.category_id)}
                                                </span>
                                            </td>
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
                                                    onClick={() => handleDelete(stream.series_id)}
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
                                        <td colSpan="6" className="text-center py-4 text-muted">
                                            No TV series found. Use the form above to add one.
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

export default SeriesStreams;
