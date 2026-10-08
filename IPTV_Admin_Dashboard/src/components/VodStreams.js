import React, { useState, useEffect } from 'react';
import { VodAPI } from '../services/api';
import AdminLayout from './layout/AdminLayout';

const VodStreams = () => {
    const [streams, setStreams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        file: null,
        stream_icon: '',
        added: '',
        releasedate: '',
        director: '',
        plot: '',
        genre: '',
        casts: ''
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
            const res = await VodAPI.get('/vod-streams');
            setStreams(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error fetching streams');
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await VodAPI.get('/vod-categories');
            setCategories(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error fetching categories');
        }
    };

    const getCategoryName = (categoryId) => {
        const category = categories.find(cat => cat.category_id === categoryId);
        return category ? category.category_name : `Category ${categoryId}`;
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
            data.append('releasedate', formData.releasedate || '');
            data.append('director', formData.director || '');
            data.append('plot', formData.plot || '');
            data.append('genre', formData.genre || '');
            data.append('casts', formData.casts || '');

            if (editingId) {
                await VodAPI.put(`/update-vod-stream/${editingId}`, data);
                setSuccess('VOD stream updated successfully');
            } else {
                await VodAPI.post('/create-vod-stream', data);
                setSuccess('VOD stream created successfully');
            }
            await fetchStreams();
            resetForm();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Error saving VOD stream');
        }
    };

    const handleEdit = (stream) => {
        setFormData({
            name: stream.name,
            category_id: stream.category_id,
            file: null,
            stream_icon: stream.stream_icon || '',
            added: stream.added ? new Date(stream.added).toISOString().slice(0, 16) : '',
            releasedate: stream.releasedate ? new Date(stream.releasedate).toISOString().slice(0, 10) : '',
            director: stream.director || '',
            plot: stream.plot || '',
            genre: stream.genre || '',
            casts: stream.casts || ''
        });
        setEditingId(stream._id);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this VOD stream?')) return;
        try {
            await VodAPI.delete(`/delete-vod-stream/${id}`);
            await fetchStreams();
            setSuccess('VOD stream deleted successfully');
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
            added: '',
            releasedate: '',
            director: '',
            plot: '',
            genre: '',
            casts: ''
        });
        setEditingId(null);
        setError('');
    };

    return (
        <AdminLayout
            title="VOD Streams"
            subtitle="Manage Movie catalogue and metadata"
            breadcrumbs={[
                { label: 'VOD Management', link: '/vod-streams' },
                { label: 'VOD Streams' }
            ]}
        >
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="admin-card mb-4">
                <div className="admin-card-header bg-light">
                    <h3 className="admin-card-title">
                        <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'} text-primary me-2`}></i>
                        {editingId ? 'Edit VOD Stream' : 'Add New VOD Stream'}
                    </h3>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Movie Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Inception, The Dark Knight"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-control"
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-semibold">VOD Category *</label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    className="form-select"
                                    required
                                >
                                    <option value="">-- Select Category --</option>
                                    {categories.map((category) => (
                                        <option key={category._id} value={category.category_id}>
                                            {category.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-semibold">
                                    Video File (.ts, .m3u8, .mp4) {editingId ? '(Optional if unchanged)' : '*'}
                                </label>
                                <input
                                    type="file"
                                    accept=".ts,.m3u8,.mp4"
                                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                    className="form-control"
                                    required={!editingId}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Poster / Icon URL</label>
                                <input
                                    type="text"
                                    placeholder="https://example.com/poster.jpg"
                                    value={formData.stream_icon}
                                    onChange={(e) => setFormData({ ...formData, stream_icon: e.target.value })}
                                    className="form-control"
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Release Date</label>
                                <input
                                    type="date"
                                    value={formData.releasedate}
                                    onChange={(e) => setFormData({ ...formData, releasedate: e.target.value })}
                                    className="form-control"
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Director</label>
                                <input
                                    type="text"
                                    placeholder="Director Name"
                                    value={formData.director}
                                    onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                                    className="form-control"
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-semibold">Genre</label>
                                <input
                                    type="text"
                                    placeholder="Action, Thriller"
                                    value={formData.genre}
                                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                                    className="form-control"
                                />
                            </div>

                            <div className="col-md-12">
                                <label className="form-label fw-semibold">Cast</label>
                                <input
                                    type="text"
                                    placeholder="Actors (comma separated)"
                                    value={formData.casts}
                                    onChange={(e) => setFormData({ ...formData, casts: e.target.value })}
                                    className="form-control"
                                />
                            </div>

                            <div className="col-md-12">
                                <label className="form-label fw-semibold">Plot / Synopsis</label>
                                <textarea
                                    placeholder="Brief movie summary..."
                                    value={formData.plot}
                                    onChange={(e) => setFormData({ ...formData, plot: e.target.value })}
                                    className="form-control"
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="mt-4 d-flex gap-2">
                            <button type="submit" className="btn btn-primary px-4">
                                <i className="fa-solid fa-check me-1"></i>
                                {editingId ? 'Update VOD Stream' : 'Save VOD Stream'}
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
                        <i className="fa-solid fa-film text-primary me-2"></i>
                        Available Movies ({streams.length})
                    </h3>
                </div>
                <div className="admin-card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '80px' }}>ID</th>
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Director</th>
                                    <th>Genre</th>
                                    <th>Release Date</th>
                                    <th style={{ width: '150px' }} className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {streams.length > 0 ? (
                                    streams.map((stream) => (
                                        <tr key={stream._id}>
                                            <td className="fw-bold text-muted">#{stream.vod_id}</td>
                                            <td className="fw-semibold">{stream.name}</td>
                                            <td>
                                                <span className="badge bg-success text-white">
                                                    {getCategoryName(stream.category_id)}
                                                </span>
                                            </td>
                                            <td>{stream.director || '-'}</td>
                                            <td>{stream.genre || '-'}</td>
                                            <td className="text-muted small">
                                                {stream.releasedate ? new Date(stream.releasedate).toLocaleDateString() : '-'}
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
                                                    onClick={() => handleDelete(stream.vod_id)}
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
                                            No VOD movies found. Use the form above to add one.
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

export default VodStreams;
