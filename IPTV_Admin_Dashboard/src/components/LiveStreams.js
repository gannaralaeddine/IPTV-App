import React, { useState, useEffect, useRef } from 'react';
import { LiveAPI } from '../services/api';
import AdminLayout from './layout/AdminLayout';
import UploadProgressBar, { formatBytes, createUploadProgressHandler } from './UploadProgressBar';
import SearchBar from './SearchBar';

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
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStats, setUploadStats] = useState({ loaded: 0, total: 0, speed: 0, estimatedTime: null });
    const fileInputRef = useRef(null);

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

    const handleOpenCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const handleEdit = (stream) => {
        setFormData({
            name: stream.name,
            category_id: stream.category_id,
            file: null,
            stream_icon: stream.stream_icon || '',
            added: stream.added ? new Date(stream.added).toISOString().slice(0, 16) : ''
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setEditingId(stream._id);
        setError('');
        setShowModal(true);
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

            if (formData.file) {
                setIsUploading(true);
                setUploadProgress(0);
                setUploadStats({ loaded: 0, total: formData.file.size, speed: 0, estimatedTime: null });
            }

            const axiosConfig = formData.file ? {
                onUploadProgress: createUploadProgressHandler(setUploadProgress, setUploadStats)
            } : {};

            if (editingId) {
                await LiveAPI.put(`/update-live-stream/${editingId}`, data, axiosConfig);
                setSuccess('Live stream updated successfully');
            } else {
                await LiveAPI.post('/create-live-stream', data, axiosConfig);
                setSuccess('Live stream created successfully');
            }
            await fetchStreams();
            setShowModal(false);
            resetForm();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Error saving stream');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
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
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setEditingId(null);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStats({ loaded: 0, total: 0, speed: 0, estimatedTime: null });
    };

    const filteredStreams = streams.filter((stream) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const name = (stream.name || '').toLowerCase();
        const id = String(stream.stream_id || '');
        const catName = getCategoryName(stream.category_id).toLowerCase();
        const file = (stream.file || '').toLowerCase();
        return name.includes(term) || id.includes(term) || catName.includes(term) || file.includes(term);
    });

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

            {/* Table Card (Displayed First) */}
            <div className="admin-card">
                <div className="admin-card-header bg-light d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <h3 className="admin-card-title mb-0">
                        <i className="fa-solid fa-list text-primary me-2"></i>
                        Available Live Streams ({filteredStreams.length}{searchTerm.trim() ? ` of ${streams.length}` : ''})
                    </h3>
                    <div className="d-flex align-items-center gap-2">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search live streams..."
                        />
                        <button onClick={handleOpenCreateModal} className="btn btn-sm btn-primary text-nowrap">
                            <i className="fa-solid fa-plus me-1"></i> Add Live Stream
                        </button>
                    </div>
                </div>
                <div className="admin-card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '80px' }}>ID</th>
                                    <th>Logo</th>
                                    <th>Stream Name</th>
                                    <th>Category</th>
                                    <th>Source / File</th>
                                    <th>Added Date</th>
                                    <th style={{ width: '150px' }} className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStreams.length > 0 ? (
                                    filteredStreams.map((stream) => (
                                        <tr key={stream._id}>
                                            <td className="fw-bold text-muted">#{stream.stream_id}</td>
                                            <td>
                                                {stream.stream_icon ? (
                                                    <img
                                                        src={stream.stream_icon}
                                                        alt={stream.name}
                                                        style={{ width: '36px', height: '36px', objectFit: 'contain' }}
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
                                            <td className="text-muted small text-truncate" style={{ maxWidth: '200px' }}>
                                                {stream.file}
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
                                            {searchTerm.trim() ? (
                                                <>
                                                    <i className="fa-solid fa-magnifying-glass me-2"></i>
                                                    No live streams found matching "{searchTerm}".{' '}
                                                    <button
                                                        type="button"
                                                        className="btn btn-link btn-sm p-0 ms-1"
                                                        onClick={() => setSearchTerm('')}
                                                    >
                                                        Clear search
                                                    </button>
                                                </>
                                            ) : (
                                                <>No live streams found. Click <strong>Add Live Stream</strong> above to create one.</>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Popup Modal for Add / Edit Stream */}
            {showModal && (
                <div
                    className="modal fade show d-block"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', zIndex: 1050 }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-primary text-white py-3">
                                <h5 className="modal-title mb-0">
                                    <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'} me-2`}></i>
                                    {editingId ? 'Edit Live Stream' : 'Add New Live Stream'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => !isUploading && setShowModal(false)}
                                    disabled={isUploading}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit} encType="multipart/form-data">
                                <div className="modal-body p-4">
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
                                                disabled={isUploading}
                                                autoFocus
                                            />
                                        </div>

                                        {/* Select Live Category */}
                                        <div className="col-md-6">
                                            <label className="form-label fw-semibold">Category *</label>
                                            <select
                                                value={formData.category_id}
                                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                                className="form-select"
                                                required
                                                disabled={isUploading}
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
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".ts,.m3u8,.mp4"
                                                onChange={(e) => setFormData({ ...formData, file: e.target.files[0] || null })}
                                                className="form-control"
                                                required={!editingId}
                                                disabled={isUploading}
                                            />
                                            {formData.file && (
                                                <div className="mt-1 small text-success">
                                                    <i className="fa-solid fa-file-video me-1"></i>
                                                    Selected: <strong>{formData.file.name}</strong> ({formatBytes(formData.file.size)})
                                                </div>
                                            )}
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
                                                disabled={isUploading}
                                            />
                                        </div>
                                    </div>

                                    {/* Upload Progress Bar with Speed & ETA */}
                                    <UploadProgressBar
                                        uploading={isUploading}
                                        progress={uploadProgress}
                                        fileName={formData.file?.name}
                                        loaded={uploadStats.loaded}
                                        total={uploadStats.total}
                                        speed={uploadStats.speed}
                                        estimatedTime={uploadStats.estimatedTime}
                                    />
                                </div>

                                <div className="modal-footer bg-light py-2">
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => setShowModal(false)}
                                        disabled={isUploading}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-sm px-3" disabled={isUploading}>
                                        {isUploading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                {uploadProgress < 100 ? `Uploading (${uploadProgress}%)...` : 'Processing Video...'}
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-check me-1"></i>
                                                {editingId ? 'Update Stream' : 'Save Stream'}
                                            </>
                                        )}
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

export default LiveStreams;
