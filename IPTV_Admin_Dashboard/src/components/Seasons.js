import React, { useState, useEffect } from 'react';
import { SeriesAPI, SeasonAPI } from '../services/api';
import AdminLayout from './layout/AdminLayout';
import EpisodesModal from './EpisodesModal';
import SearchBar from './SearchBar';

const Seasons = () => {
    const [seasons, setSeasons] = useState([]);
    const [series, setSeries] = useState([]);
    const [formData, setFormData] = useState({
        series_id: '',
        season_number: '',
        name: '',
        description: '',
        cover: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedSeasonForEpisodes, setSelectedSeasonForEpisodes] = useState(null);

    useEffect(() => {
        fetchSeasons();
        fetchSeries();
    }, []);

    const fetchSeasons = async () => {
        try {
            const res = await SeasonAPI.get('/seasons');
            setSeasons(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error fetching seasons');
        }
    };

    const fetchSeries = async () => {
        try {
            const res = await SeriesAPI.get('/series-streams');
            setSeries(res.data);
        } catch (err) {
            console.error('Error fetching series:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await SeasonAPI.put(`/update-season/${editingId}`, formData);
                setSuccess('Season updated successfully');
            } else {
                await SeasonAPI.post('/create-season', formData);
                setSuccess('Season created successfully');
            }
            await fetchSeasons();
            resetForm();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error saving season');
        }
    };

    const handleEdit = (season) => {
        setFormData({
            series_id: season.series_id,
            season_number: season.season_number,
            name: season.name,
            description: season.description || '',
            cover: season.cover || ''
        });
        setEditingId(season._id);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure? This will also delete all episodes in this season.')) {
            try {
                await SeasonAPI.delete(`/delete-season/${id}`);
                await fetchSeasons();
                setSuccess('Season deleted successfully');
                setTimeout(() => setSuccess(''), 3000);
                setError('');
            } catch (err) {
                setError(err.response?.data?.error || 'Error deleting season');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            series_id: '',
            season_number: '',
            name: '',
            description: '',
            cover: ''
        });
        setEditingId(null);
        setError('');
    };

    const getSeriesName = (seriesId) => {
        const seriesItem = series.find(s => s.series_id === seriesId);
        return seriesItem ? seriesItem.name : `Series ${seriesId}`;
    };

    const filteredSeasons = seasons.filter((season) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const sNum = String(season.season_number || '');
        const name = (season.name || '').toLowerCase();
        const seriesName = getSeriesName(season.series_id).toLowerCase();
        return sNum.includes(term) || name.includes(term) || seriesName.includes(term);
    });

    return (
        <AdminLayout
            title="TV Show Seasons"
            subtitle="Manage Seasons grouped under TV Series"
            breadcrumbs={[
                { label: 'Series Management', link: '/series-streams' },
                { label: 'Seasons' }
            ]}
        >
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="admin-card mb-4">
                <div className="admin-card-header bg-light">
                    <h3 className="admin-card-title">
                        <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'} text-primary me-2`}></i>
                        {editingId ? 'Edit Season' : 'Add New Season'}
                    </h3>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Parent TV Series *</label>
                                <select
                                    value={formData.series_id}
                                    onChange={(e) => setFormData({ ...formData, series_id: e.target.value })}
                                    className="form-select"
                                    required
                                >
                                    <option value="">-- Choose Series --</option>
                                    {series.map((s) => (
                                        <option key={s._id} value={s.series_id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Season Number *</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 1, 2, 3"
                                    value={formData.season_number}
                                    onChange={(e) => setFormData({ ...formData, season_number: e.target.value })}
                                    className="form-control"
                                    required
                                    min="1"
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Season Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Season 1"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-control"
                                    required
                                />
                            </div>

                            <div className="col-md-12">
                                <label className="form-label fw-semibold">Season Cover Image URL</label>
                                <input
                                    type="text"
                                    placeholder="https://example.com/season1.jpg"
                                    value={formData.cover}
                                    onChange={(e) => setFormData({ ...formData, cover: e.target.value })}
                                    className="form-control"
                                />
                            </div>

                            <div className="col-md-12">
                                <label className="form-label fw-semibold">Description (Optional)</label>
                                <textarea
                                    placeholder="Season synopsis or notes..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="form-control"
                                    rows="2"
                                />
                            </div>
                        </div>

                        <div className="mt-4 d-flex gap-2">
                            <button type="submit" className="btn btn-primary px-4">
                                <i className="fa-solid fa-check me-1"></i>
                                {editingId ? 'Update Season' : 'Save Season'}
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
                <div className="admin-card-header bg-light d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <h3 className="admin-card-title mb-0">
                        <i className="fa-solid fa-layer-group text-primary me-2"></i>
                        Available Seasons ({filteredSeasons.length}{searchTerm.trim() ? ` of ${seasons.length}` : ''})
                    </h3>
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search seasons..."
                    />
                </div>
                <div className="admin-card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '80px' }}>ID</th>
                                    <th>Series</th>
                                    <th>Season</th>
                                    <th>Name</th>
                                    <th>Cover</th>
                                    <th style={{ width: '220px' }} className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSeasons.length > 0 ? (
                                    filteredSeasons.map((season) => (
                                        <tr key={season._id}>
                                            <td className="fw-bold text-muted">#{season.season_id}</td>
                                            <td className="fw-semibold">{getSeriesName(season.series_id)}</td>
                                            <td>
                                                <span className="badge bg-primary">Season {season.season_number}</span>
                                            </td>
                                            <td>{season.name}</td>
                                            <td>
                                                {season.cover ? (
                                                    <img
                                                        src={season.cover}
                                                        alt={season.name}
                                                        style={{ width: '30px', height: '40px', objectFit: 'cover' }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                ) : '-'}
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    onClick={() => setSelectedSeasonForEpisodes(season)}
                                                    className="btn btn-sm btn-outline-success me-2"
                                                    title="Manage Episodes"
                                                >
                                                    <i className="fa-solid fa-clapperboard me-1"></i>
                                                    Episodes
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(season)}
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    title="Edit"
                                                >
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(season.season_id)}
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
                                                <>No seasons found. Use the form above to add a season.</>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Episodes Modal Popup for selected season */}
            {selectedSeasonForEpisodes && (
                <EpisodesModal
                    isOpen={true}
                    series={series.find(s => s.series_id === selectedSeasonForEpisodes.series_id)}
                    season={selectedSeasonForEpisodes}
                    onClose={() => setSelectedSeasonForEpisodes(null)}
                />
            )}
        </AdminLayout>
    );
};

export default Seasons;
