import React, { useState, useEffect } from 'react';
import { SeriesAPI, SeasonAPI, EpisodeAPI } from '../services/api';
import AdminLayout from './layout/AdminLayout';

const Episodes = () => {
    const [episodes, setEpisodes] = useState([]);
    const [seasons, setSeasons] = useState([]);
    const [series, setSeries] = useState([]);
    const [formData, setFormData] = useState({
        series_id: '',
        season_id: '',
        season_number: '',
        episode_number: '',
        name: '',
        file: null,
        description: '',
        duration: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchEpisodes();
        fetchSeasons();
        fetchSeries();
    }, []);

    const fetchEpisodes = async () => {
        try {
            const res = await EpisodeAPI.get('/episodes');
            setEpisodes(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error fetching episodes');
        }
    };

    const fetchSeasons = async () => {
        try {
            const res = await SeasonAPI.get('/seasons');
            setSeasons(res.data);
        } catch (err) {
            console.error('Error fetching seasons:', err);
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
            const data = new FormData();
            data.append('series_id', formData.series_id);
            data.append('season_id', formData.season_id);
            data.append('season_number', formData.season_number);
            data.append('episode_number', formData.episode_number);
            data.append('name', formData.name);
            data.append('description', formData.description || '');
            data.append('duration', formData.duration || '');

            if (formData.file) {
                data.append('file', formData.file);
            } else if (!editingId) {
                throw new Error('File is required for new episodes');
            }

            if (editingId) {
                await EpisodeAPI.put(`/update-episode/${editingId}`, data);
                setSuccess('Episode updated successfully');
            } else {
                await EpisodeAPI.post('/create-episode', data);
                setSuccess('Episode created successfully');
            }
            await fetchEpisodes();
            resetForm();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Error saving episode');
        }
    };

    const handleEdit = (episode) => {
        setFormData({
            series_id: episode.series_id,
            season_id: episode.season_id,
            season_number: episode.season_number,
            episode_number: episode.episode_number,
            name: episode.name,
            file: null,
            description: episode.description || '',
            duration: episode.duration || ''
        });
        setEditingId(episode._id);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this episode?')) return;
        try {
            await EpisodeAPI.delete(`/delete-episode/${id}`);
            await fetchEpisodes();
            setSuccess('Episode deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error deleting episode');
        }
    };

    const resetForm = () => {
        setFormData({
            series_id: '',
            season_id: '',
            season_number: '',
            episode_number: '',
            name: '',
            file: null,
            description: '',
            duration: ''
        });
        setEditingId(null);
        setError('');
    };

    const getSeriesName = (seriesId) => {
        const seriesItem = series.find(s => s.series_id === seriesId);
        return seriesItem ? seriesItem.name : `Series ${seriesId}`;
    };

    const getSeasonName = (seasonId) => {
        const seasonItem = seasons.find(s => s.season_id === seasonId);
        return seasonItem ? seasonItem.name : `Season ${seasonId}`;
    };

    const handleSeriesChange = (seriesId) => {
        setFormData({ ...formData, series_id: seriesId, season_id: '', season_number: '' });
    };

    const handleSeasonChange = (seasonId) => {
        const season = seasons.find(s => s.season_id === parseInt(seasonId));
        setFormData({
            ...formData,
            season_id: seasonId,
            season_number: season ? season.season_number : ''
        });
    };

    return (
        <AdminLayout
            title="Episodes"
            subtitle="Manage TV Series episodes and video files"
            breadcrumbs={[
                { label: 'Series Management', link: '/series-streams' },
                { label: 'Episodes' }
            ]}
        >
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="admin-card mb-4">
                <div className="admin-card-header bg-light">
                    <h3 className="admin-card-title">
                        <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'} text-primary me-2`}></i>
                        {editingId ? 'Edit Episode' : 'Upload New Episode'}
                    </h3>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">TV Series *</label>
                                <select
                                    value={formData.series_id}
                                    onChange={(e) => handleSeriesChange(e.target.value)}
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

                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Season *</label>
                                <select
                                    value={formData.season_id}
                                    onChange={(e) => handleSeasonChange(e.target.value)}
                                    className="form-select"
                                    required
                                    disabled={!formData.series_id}
                                >
                                    <option value="">-- Choose Season --</option>
                                    {seasons
                                        .filter(s => s.series_id === parseInt(formData.series_id))
                                        .map((s) => (
                                            <option key={s._id} value={s.season_id}>
                                                {s.name} (Season {s.season_number})
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="col-md-3">
                                <label className="form-label fw-semibold">Episode Number *</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 1, 2"
                                    value={formData.episode_number}
                                    onChange={(e) => setFormData({ ...formData, episode_number: e.target.value })}
                                    className="form-control"
                                    required
                                    min="1"
                                />
                            </div>

                            <div className="col-md-5">
                                <label className="form-label fw-semibold">Episode Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Pilot, Winter is Coming"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-control"
                                    required
                                />
                            </div>

                            <div className="col-md-4">
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

                            <div className="col-md-12">
                                <label className="form-label fw-semibold">Episode Synopsis / Description</label>
                                <textarea
                                    placeholder="Plot summary for this episode..."
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
                                {editingId ? 'Update Episode' : 'Upload Episode'}
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
                        Available Episodes ({episodes.length})
                    </h3>
                </div>
                <div className="admin-card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '80px' }}>ID</th>
                                    <th>Series</th>
                                    <th>Season</th>
                                    <th>Ep #</th>
                                    <th>Title</th>
                                    <th>File</th>
                                    <th>Duration</th>
                                    <th style={{ width: '150px' }} className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {episodes.length > 0 ? (
                                    episodes.map((episode) => (
                                        <tr key={episode._id}>
                                            <td className="fw-bold text-muted">#{episode.episode_id}</td>
                                            <td className="fw-semibold">{getSeriesName(episode.series_id)}</td>
                                            <td>
                                                <span className="badge bg-secondary">
                                                    {getSeasonName(episode.season_id)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge bg-info text-dark">E{episode.episode_number}</span>
                                            </td>
                                            <td className="fw-semibold">{episode.name}</td>
                                            <td><code>{episode.file}</code></td>
                                            <td className="text-muted small">{episode.duration || '-'}</td>
                                            <td className="text-center">
                                                <button
                                                    onClick={() => handleEdit(episode)}
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    title="Edit"
                                                >
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(episode.episode_id)}
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
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            No episodes uploaded yet. Use the form above to add one.
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

export default Episodes;
