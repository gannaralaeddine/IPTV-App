import React, { useState, useEffect } from 'react';
import { SeriesAPI } from '../services/api';
import AdminLayout from './layout/AdminLayout';
import SeasonsModal from './SeasonsModal';
import SearchBar from './SearchBar';

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
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedSeriesForSeasons, setSelectedSeriesForSeasons] = useState(null);

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

    const handleOpenCreateModal = () => {
        resetForm();
        setShowModal(true);
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
            setShowModal(false);
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
        setShowModal(true);
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

    const filteredStreams = streams.filter((stream) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const name = (stream.name || '').toLowerCase();
        const id = String(stream.series_id || '');
        const catName = getCategoryName(stream.category_id).toLowerCase();
        return name.includes(term) || id.includes(term) || catName.includes(term);
    });

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

            {/* Series Table Card (Displayed First) */}
            <div className="admin-card">
                <div className="admin-card-header bg-light d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <h3 className="admin-card-title mb-0">
                        <i className="fa-solid fa-tv text-primary me-2"></i>
                        Available Series ({filteredStreams.length}{searchTerm.trim() ? ` of ${streams.length}` : ''})
                    </h3>
                    <div className="d-flex align-items-center gap-2">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search TV series..."
                        />
                        <button onClick={handleOpenCreateModal} className="btn btn-sm btn-primary text-nowrap">
                            <i className="fa-solid fa-plus me-1"></i> Add TV Series
                        </button>
                    </div>
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
                                    <th style={{ width: '220px' }} className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStreams.length > 0 ? (
                                    filteredStreams.map((stream) => (
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
                                                    onClick={() => setSelectedSeriesForSeasons(stream)}
                                                    className="btn btn-sm btn-outline-info me-2"
                                                    title="Manage Seasons"
                                                >
                                                    <i className="fa-solid fa-layer-group me-1"></i>
                                                    Seasons
                                                </button>
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
                                            {searchTerm.trim() ? (
                                                <>
                                                    <i className="fa-solid fa-magnifying-glass me-2"></i>
                                                    No TV series found matching "{searchTerm}".{' '}
                                                    <button
                                                        type="button"
                                                        className="btn btn-link btn-sm p-0 ms-1"
                                                        onClick={() => setSearchTerm('')}
                                                    >
                                                        Clear search
                                                    </button>
                                                </>
                                            ) : (
                                                <>No TV series found. Click <strong>Add TV Series</strong> above to add one.</>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Popup Modal for Add / Edit Series */}
            {showModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-primary text-white py-3">
                                <h5 className="modal-title mb-0">
                                    <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'} me-2`}></i>
                                    {editingId ? 'Edit TV Series' : 'Add New TV Series'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body p-4">
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
                                                autoFocus
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
                                </div>
                                <div className="modal-footer bg-light py-2">
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-sm px-3">
                                        <i className="fa-solid fa-check me-1"></i>
                                        {editingId ? 'Update Series' : 'Save Series'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Seasons Modal Popup for selected series */}
            {selectedSeriesForSeasons && (
                <SeasonsModal
                    isOpen={true}
                    series={selectedSeriesForSeasons}
                    onClose={() => setSelectedSeriesForSeasons(null)}
                />
            )}
        </AdminLayout>
    );
};

export default SeriesStreams;
