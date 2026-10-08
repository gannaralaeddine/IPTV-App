import React, { useState, useEffect, useRef } from 'react';
import { EpisodeAPI } from '../services/api';
import UploadProgressBar, { formatBytes, createUploadProgressHandler } from './UploadProgressBar';
import SearchBar from './SearchBar';

const EpisodesModal = ({
    isOpen,
    onClose,
    series,
    season,
    onBack
}) => {
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        episode_number: '',
        file: null,
        description: ''
    });
    const [editingId, setEditingId] = useState(null);

    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStats, setUploadStats] = useState({ loaded: 0, total: 0, speed: 0, estimatedTime: null });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && season) {
            fetchEpisodes();
            resetForm();
            setError('');
            setSuccess('');
            setSearchTerm('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, season]);

    const fetchEpisodes = async () => {
        if (!season) return;
        setLoading(true);
        try {
            const res = await EpisodeAPI.get('/episodes', {
                params: { season_id: season.season_id }
            });
            setEpisodes(res.data || []);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error fetching episodes');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            episode_number: '',
            file: null,
            description: ''
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setEditingId(null);
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStats({ loaded: 0, total: 0, speed: 0, estimatedTime: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!season) return;

        try {
            const data = new FormData();
            const seriesId = series ? series.series_id : season.series_id;
            data.append('series_id', seriesId);
            data.append('season_id', season.season_id);
            data.append('season_number', season.season_number);
            data.append('episode_number', formData.episode_number);
            data.append('name', formData.name);
            data.append('description', formData.description || '');

            if (formData.file) {
                data.append('file', formData.file);
            } else if (!editingId) {
                throw new Error('Video file is required for new episodes');
            }

            if (formData.file) {
                setIsUploading(true);
                setUploadProgress(0);
                setUploadStats({ loaded: 0, total: formData.file.size, speed: 0, estimatedTime: null });
            }

            const axiosConfig = formData.file ? {
                onUploadProgress: createUploadProgressHandler(setUploadProgress, setUploadStats)
            } : {};

            if (editingId) {
                await EpisodeAPI.put(`/update-episode/${editingId}`, data, axiosConfig);
                setSuccess('Episode updated successfully');
            } else {
                await EpisodeAPI.post('/create-episode', data, axiosConfig);
                setSuccess('Episode uploaded and created successfully');
            }

            await fetchEpisodes();
            resetForm();
            setShowForm(false);
            setTimeout(() => setSuccess(''), 3500);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Error saving episode');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleEdit = (episode) => {
        setFormData({
            name: episode.name,
            episode_number: episode.episode_number,
            file: null,
            description: episode.description || ''
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setEditingId(episode._id);
        setShowForm(true);
        setError('');
    };

    const handleDelete = async (episodeId) => {
        if (!window.confirm('Are you sure you want to delete this episode?')) return;
        try {
            await EpisodeAPI.delete(`/delete-episode/${episodeId}`);
            await fetchEpisodes();
            setSuccess('Episode deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error deleting episode');
        }
    };

    if (!isOpen || !season) return null;

    const seriesTitle = series ? series.name : `Series #${season.series_id}`;

    const filteredEpisodes = episodes.filter((ep) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const epNum = String(ep.episode_number || '');
        const name = (ep.name || '').toLowerCase();
        const desc = (ep.description || '').toLowerCase();
        const file = (ep.file || '').toLowerCase();
        return epNum.includes(term) || name.includes(term) || desc.includes(term) || file.includes(term);
    });

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1065 }}
        >
            <div className="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
                <div className="modal-content shadow-lg border-0">
                    {/* Modal Header */}
                    <div className="modal-header bg-dark text-white d-flex align-items-center justify-content-between py-3">
                        <div className="d-flex align-items-center">
                            {onBack && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-light me-2"
                                    onClick={onBack}
                                    title="Back to Seasons"
                                >
                                    <i className="fa-solid fa-arrow-left me-1"></i> Seasons
                                </button>
                            )}
                            <h5 className="modal-title mb-0">
                                <i className="fa-solid fa-clapperboard text-warning me-2"></i>
                                {seriesTitle} &mdash; Season {season.season_number}
                                {season.name ? ` (${season.name})` : ''} Episodes
                            </h5>
                        </div>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onClose}
                            aria-label="Close"
                        ></button>
                    </div>

                    {/* Modal Body */}
                    <div className="modal-body p-4" style={{ backgroundColor: '#f8f9fa' }}>
                        {error && <div className="alert alert-danger py-2">{error}</div>}
                        {success && <div className="alert alert-success py-2">{success}</div>}

                        {/* Top Action Bar */}
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                            <h6 className="mb-0 fw-bold text-secondary">
                                <i className="fa-solid fa-list-ol me-2 text-primary"></i>
                                Episodes List ({filteredEpisodes.length}{searchTerm.trim() ? ` of ${episodes.length}` : ''})
                            </h6>
                            <div className="d-flex align-items-center gap-2">
                                <SearchBar
                                    value={searchTerm}
                                    onChange={setSearchTerm}
                                    placeholder="Search episodes..."
                                    style={{ width: '200px' }}
                                />
                                <button
                                    className={`btn btn-sm ${showForm ? 'btn-secondary' : 'btn-success'} text-nowrap`}
                                    onClick={() => {
                                        if (showForm) {
                                            resetForm();
                                            setShowForm(false);
                                        } else {
                                            resetForm();
                                            // Auto suggest next episode number
                                            const nextEp = episodes.length > 0
                                                ? Math.max(...episodes.map(e => parseInt(e.episode_number) || 0)) + 1
                                                : 1;
                                            setFormData(prev => ({ ...prev, episode_number: nextEp }));
                                            setShowForm(true);
                                        }
                                    }}
                                    disabled={isUploading}
                                >
                                    <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-plus'} me-1`}></i>
                                    {showForm ? 'Close Form' : 'Add New Episode'}
                                </button>
                            </div>
                        </div>

                        {/* Add / Edit Episode Form Card */}
                        {showForm && (
                            <div className="card shadow-sm border-0 mb-4 bg-white">
                                <div className="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                                    <span className="fw-semibold text-primary">
                                        <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'} me-1`}></i>
                                        {editingId ? 'Edit Episode' : `Add Episode to Season ${season.season_number}`}
                                    </span>
                                    {editingId && (
                                        <span className="badge bg-warning text-dark">Editing ID: #{editingId}</span>
                                    )}
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                                        <div className="row g-3">
                                            {/* Episode Number */}
                                            <div className="col-md-3">
                                                <label className="form-label fw-semibold small">Episode Number *</label>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 1, 2"
                                                    value={formData.episode_number}
                                                    onChange={(e) => setFormData({ ...formData, episode_number: e.target.value })}
                                                    className="form-control form-control-sm"
                                                    required
                                                    min="1"
                                                    disabled={isUploading}
                                                />
                                            </div>

                                            {/* Episode Title */}
                                            <div className="col-md-5">
                                                <label className="form-label fw-semibold small">Episode Title *</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Pilot, The Winds of Winter"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="form-control form-control-sm"
                                                    required
                                                    disabled={isUploading}
                                                />
                                            </div>

                                            {/* Video File */}
                                            <div className="col-md-4">
                                                <label className="form-label fw-semibold small">
                                                    Video File (.mp4, .ts, .m3u8) {editingId ? '(Optional if unchanged)' : '*'}
                                                </label>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".ts,.m3u8,.mp4"
                                                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] || null })}
                                                    className="form-control form-control-sm"
                                                    required={!editingId}
                                                    disabled={isUploading}
                                                />
                                                {formData.file && (
                                                    <div className="mt-1 small text-success">
                                                        <i className="fa-solid fa-file-video me-1"></i>
                                                        <strong>{formData.file.name}</strong> ({formatBytes(formData.file.size)})
                                                    </div>
                                                )}
                                            </div>

                                            {/* Episode Description */}
                                            <div className="col-md-12">
                                                <label className="form-label fw-semibold small">Description / Synopsis</label>
                                                <textarea
                                                    placeholder="Brief episode overview..."
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    className="form-control form-control-sm"
                                                    rows="2"
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

                                        {/* Submit & Cancel Buttons */}
                                        <div className="mt-3 d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-sm btn-primary px-3"
                                                disabled={isUploading}
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        {uploadProgress < 100 ? `Uploading (${uploadProgress}%)...` : 'Processing Video...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fa-solid fa-check me-1"></i>
                                                        {editingId ? 'Update Episode' : 'Upload & Save Episode'}
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    resetForm();
                                                    setShowForm(false);
                                                }}
                                                className="btn btn-sm btn-secondary px-3"
                                                disabled={isUploading}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Episodes Table Card */}
                        <div className="card shadow-sm border-0 bg-white">
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-4 text-muted">
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Loading episodes...
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ width: '80px' }}>Episode</th>
                                                    <th>Title</th>
                                                    <th>Duration</th>
                                                    <th>File</th>
                                                    <th>Description</th>
                                                    <th style={{ width: '130px' }} className="text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredEpisodes.length > 0 ? (
                                                    filteredEpisodes.map((ep) => (
                                                        <tr key={ep._id}>
                                                            <td>
                                                                <span className="badge bg-primary fs-7">
                                                                    Ep {ep.episode_number}
                                                                </span>
                                                            </td>
                                                            <td className="fw-semibold">{ep.name}</td>
                                                            <td>
                                                                <span className="badge bg-secondary">
                                                                    <i className="fa-regular fa-clock me-1"></i>
                                                                    {ep.duration || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td className="small text-muted text-truncate" style={{ maxWidth: '200px' }}>
                                                                {ep.file || '-'}
                                                            </td>
                                                            <td className="small text-muted text-truncate" style={{ maxWidth: '250px' }}>
                                                                {ep.description || '-'}
                                                            </td>
                                                            <td className="text-center">
                                                                <button
                                                                    onClick={() => handleEdit(ep)}
                                                                    className="btn btn-sm btn-outline-primary me-2"
                                                                    title="Edit Episode"
                                                                    disabled={isUploading}
                                                                >
                                                                    <i className="fa-solid fa-pen"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(ep.episode_id)}
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    title="Delete Episode"
                                                                    disabled={isUploading}
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
                                                                    No episodes found matching "{searchTerm}".{' '}
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-link btn-sm p-0 ms-1"
                                                                        onClick={() => setSearchTerm('')}
                                                                    >
                                                                        Clear search
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>No episodes found for this season. Click <strong>Add New Episode</strong> above to upload one.</>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="modal-footer bg-light py-2">
                        {onBack && (
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onBack}>
                                <i className="fa-solid fa-arrow-left me-1"></i> Back to Seasons
                            </button>
                        )}
                        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={isUploading}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EpisodesModal;
