import React, { useState, useEffect } from 'react';
import { SeasonAPI } from '../services/api';
import EpisodesModal from './EpisodesModal';
import SearchBar from './SearchBar';

const SeasonsModal = ({
    isOpen,
    onClose,
    series
}) => {
    const [seasons, setSeasons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        season_number: '',
        name: '',
        cover: '',
        description: ''
    });
    const [editingId, setEditingId] = useState(null);

    // Active season for nested episodes modal popup
    const [selectedSeasonForEpisodes, setSelectedSeasonForEpisodes] = useState(null);

    useEffect(() => {
        if (isOpen && series) {
            fetchSeasons();
            resetForm();
            setError('');
            setSuccess('');
            setSearchTerm('');
            setSelectedSeasonForEpisodes(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, series]);

    const fetchSeasons = async () => {
        if (!series) return;
        setLoading(true);
        try {
            const res = await SeasonAPI.get('/seasons', {
                params: { series_id: series.series_id }
            });
            setSeasons(res.data || []);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error fetching seasons');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            season_number: '',
            name: '',
            cover: '',
            description: ''
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!series) return;

        try {
            const payload = {
                ...formData,
                series_id: series.series_id,
                season_number: parseInt(formData.season_number)
            };

            if (editingId) {
                await SeasonAPI.put(`/update-season/${editingId}`, payload);
                setSuccess('Season updated successfully');
            } else {
                await SeasonAPI.post('/create-season', payload);
                setSuccess('Season created successfully');
            }

            await fetchSeasons();
            resetForm();
            setShowForm(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Error saving season');
        }
    };

    const handleEdit = (season) => {
        setFormData({
            season_number: season.season_number,
            name: season.name,
            cover: season.cover || '',
            description: season.description || ''
        });
        setEditingId(season._id);
        setShowForm(true);
        setError('');
    };

    const handleDelete = async (seasonId) => {
        if (!window.confirm('Are you sure you want to delete this season? This will also remove all its episodes.')) return;
        try {
            await SeasonAPI.delete(`/delete-season/${seasonId}`);
            await fetchSeasons();
            setSuccess('Season and its episodes deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error deleting season');
        }
    };

    const filteredSeasons = seasons.filter((season) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const sNum = String(season.season_number || '');
        const name = (season.name || '').toLowerCase();
        const desc = (season.description || '').toLowerCase();
        return sNum.includes(term) || name.includes(term) || desc.includes(term);
    });

    if (!isOpen || !series) return null;

    return (
        <>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)', zIndex: 1055 }}
            >
                <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
                    <div className="modal-content shadow-lg border-0">
                        {/* Modal Header */}
                        <div className="modal-header bg-primary text-white d-flex align-items-center justify-content-between py-3">
                            <h5 className="modal-title mb-0">
                                <i className="fa-solid fa-layer-group me-2"></i>
                                Seasons for Series: <strong>{series.name}</strong>
                            </h5>
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

                            {/* Top Controls */}
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                <h6 className="mb-0 fw-bold text-secondary">
                                    <i className="fa-solid fa-tv me-2 text-primary"></i>
                                    Available Seasons ({filteredSeasons.length}{searchTerm.trim() ? ` of ${seasons.length}` : ''})
                                </h6>
                                <div className="d-flex align-items-center gap-2">
                                    <SearchBar
                                        value={searchTerm}
                                        onChange={setSearchTerm}
                                        placeholder="Search seasons..."
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
                                                // Suggest next season number
                                                const nextSeasonNum = seasons.length > 0
                                                    ? Math.max(...seasons.map(s => parseInt(s.season_number) || 0)) + 1
                                                    : 1;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    season_number: nextSeasonNum,
                                                    name: `Season ${nextSeasonNum}`
                                                }));
                                                setShowForm(true);
                                            }
                                        }}
                                    >
                                        <i className={`fa-solid ${showForm ? 'fa-xmark' : 'fa-plus'} me-1`}></i>
                                        {showForm ? 'Close Form' : 'Add New Season'}
                                    </button>
                                </div>
                            </div>

                            {/* Add / Edit Season Form Card */}
                            {showForm && (
                                <div className="card shadow-sm border-0 mb-4 bg-white">
                                    <div className="card-header bg-light py-2 d-flex justify-content-between align-items-center">
                                        <span className="fw-semibold text-primary">
                                            <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'} me-1`}></i>
                                            {editingId ? 'Edit Season' : `Add Season to "${series.name}"`}
                                        </span>
                                        {editingId && (
                                            <span className="badge bg-warning text-dark">Editing ID: #{editingId}</span>
                                        )}
                                    </div>
                                    <div className="card-body">
                                        <form onSubmit={handleSubmit}>
                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <label className="form-label fw-semibold small">Season Number *</label>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 1, 2"
                                                        value={formData.season_number}
                                                        onChange={(e) => setFormData({ ...formData, season_number: e.target.value })}
                                                        className="form-control form-control-sm"
                                                        required
                                                        min="1"
                                                    />
                                                </div>

                                                <div className="col-md-8">
                                                    <label className="form-label fw-semibold small">Season Title / Name *</label>
                                                    <input
                                                        type="text"
                                                        placeholder="e.g. Season 1, Final Season"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        className="form-control form-control-sm"
                                                        required
                                                    />
                                                </div>

                                                <div className="col-md-12">
                                                    <label className="form-label fw-semibold small">Cover Image URL (Optional)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="https://example.com/season-cover.jpg"
                                                        value={formData.cover}
                                                        onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                                                        className="form-control form-control-sm"
                                                    />
                                                </div>

                                                <div className="col-md-12">
                                                    <label className="form-label fw-semibold small">Description (Optional)</label>
                                                    <textarea
                                                        placeholder="Season overview or storyline notes..."
                                                        value={formData.description}
                                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                        className="form-control form-control-sm"
                                                        rows="2"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-3 d-flex gap-2">
                                                <button type="submit" className="btn btn-sm btn-primary px-3">
                                                    <i className="fa-solid fa-check me-1"></i>
                                                    {editingId ? 'Update Season' : 'Save Season'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        resetForm();
                                                        setShowForm(false);
                                                    }}
                                                    className="btn btn-sm btn-secondary px-3"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Seasons Table Card */}
                            <div className="card shadow-sm border-0 bg-white">
                                <div className="card-body p-0">
                                    {loading ? (
                                        <div className="text-center py-4 text-muted">
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Loading seasons...
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th style={{ width: '90px' }}>Season</th>
                                                        <th>Name</th>
                                                        <th>Cover</th>
                                                        <th>Description</th>
                                                        <th style={{ width: '220px' }} className="text-center">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredSeasons.length > 0 ? (
                                                        filteredSeasons.map((season) => (
                                                            <tr key={season._id}>
                                                                <td>
                                                                    <span className="badge bg-primary">
                                                                        Season {season.season_number}
                                                                    </span>
                                                                </td>
                                                                <td className="fw-semibold">{season.name}</td>
                                                                <td>
                                                                    {season.cover ? (
                                                                        <img
                                                                            src={season.cover}
                                                                            alt={season.name}
                                                                            style={{ width: '32px', height: '44px', objectFit: 'cover', borderRadius: '3px' }}
                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                        />
                                                                    ) : (
                                                                        <span className="badge bg-secondary">No Cover</span>
                                                                    )}
                                                                </td>
                                                                <td className="small text-muted text-truncate" style={{ maxWidth: '240px' }}>
                                                                    {season.description || '-'}
                                                                </td>
                                                                <td className="text-center">
                                                                    {/* Button to open Episodes popup */}
                                                                    <button
                                                                        onClick={() => setSelectedSeasonForEpisodes(season)}
                                                                        className="btn btn-sm btn-outline-success me-2"
                                                                        title="Manage Episodes"
                                                                    >
                                                                        <i className="fa-solid fa-clapperboard me-1"></i>
                                                                        Episodes
                                                                    </button>

                                                                    {/* Button to edit Season */}
                                                                    <button
                                                                        onClick={() => handleEdit(season)}
                                                                        className="btn btn-sm btn-outline-primary me-2"
                                                                        title="Edit Season"
                                                                    >
                                                                        <i className="fa-solid fa-pen"></i>
                                                                    </button>

                                                                    {/* Button to delete Season */}
                                                                    <button
                                                                        onClick={() => handleDelete(season.season_id)}
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        title="Delete Season"
                                                                    >
                                                                        <i className="fa-solid fa-trash"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="text-center py-4 text-muted">
                                                                {searchTerm.trim() ? (
                                                                    <>
                                                                        <i className="fa-solid fa-magnifying-glass me-2"></i>
                                                                        No seasons found matching "{searchTerm}".{' '}
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-link btn-sm p-0 ms-1"
                                                                            onClick={() => setSearchTerm('')}
                                                                        >
                                                                            Clear search
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <>No seasons found for this series. Click <strong>Add New Season</strong> above to create one.</>
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
                            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nested Episodes Modal Popup */}
            {selectedSeasonForEpisodes && (
                <EpisodesModal
                    isOpen={true}
                    series={series}
                    season={selectedSeasonForEpisodes}
                    onClose={() => setSelectedSeasonForEpisodes(null)}
                    onBack={() => setSelectedSeasonForEpisodes(null)}
                />
            )}
        </>
    );
};

export default SeasonsModal;
