import React, { useState, useEffect } from 'react';
import { SeriesAPI } from '../services/api';
import AdminLayout from './layout/AdminLayout';

const SeriesCategories = () => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ category_name: '', parent_id: 0 });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await SeriesAPI.get('/series-categories');
            setCategories(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error fetching categories');
        }
    };

    const getParentCategoryName = (parentId) => {
        if (!parentId || parentId === 0) return 'Root (None)';
        const parent = categories.find((c) => c.category_id === parentId);
        return parent ? parent.category_name : `Category ${parentId}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                parent_id: parseInt(formData.parent_id) || 0
            };
            if (editingId) {
                await SeriesAPI.put(`/update-series-category/${editingId}`, data);
                setSuccess('Series category updated successfully');
            } else {
                await SeriesAPI.post('/create-series-category', data);
                setSuccess('Series category created successfully');
            }
            await fetchCategories();
            resetForm();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Error saving category');
        }
    };

    const handleEdit = (category) => {
        setFormData({
            category_name: category.category_name,
            parent_id: category.parent_id || 0
        });
        setEditingId(category._id);
        setError('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this series category?')) return;
        try {
            await SeriesAPI.delete(`/delete-series-category/${id}`);
            await fetchCategories();
            setSuccess('Series category deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error deleting category');
        }
    };

    const resetForm = () => {
        setFormData({ category_name: '', parent_id: 0 });
        setEditingId(null);
        setError('');
    };

    return (
        <AdminLayout
            title="Series Categories"
            subtitle="Manage TV show genres and groupings"
            breadcrumbs={[
                { label: 'Series Management', link: '/series-categories' },
                { label: 'Series Categories' }
            ]}
        >
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="admin-card mb-4">
                <div className="admin-card-header bg-light">
                    <h3 className="admin-card-title">
                        <i className={`fa-solid ${editingId ? 'fa-pen-to-square' : 'fa-plus'} text-primary me-2`}></i>
                        {editingId ? 'Edit Series Category' : 'Create New Series Category'}
                    </h3>
                </div>
                <div className="admin-card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Category Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Drama, Anime, Comedy, Documentary"
                                    value={formData.category_name}
                                    onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                                    className="form-control"
                                    required
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-semibold">Parent Category (Optional)</label>
                                <select
                                    value={formData.parent_id}
                                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                    className="form-select"
                                >
                                    <option value={0}>-- Root Category (No Parent) --</option>
                                    {categories
                                        .filter((cat) => !editingId || cat._id !== editingId)
                                        .map((cat) => (
                                            <option key={cat._id} value={cat.category_id}>
                                                {cat.category_name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 d-flex gap-2">
                            <button type="submit" className="btn btn-primary px-4">
                                <i className="fa-solid fa-check me-1"></i>
                                {editingId ? 'Update Category' : 'Save Category'}
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
                        Available Series Categories ({categories.length})
                    </h3>
                </div>
                <div className="admin-card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: '90px' }}>ID</th>
                                    <th>Category Name</th>
                                    <th>Parent Category</th>
                                    <th style={{ width: '150px' }} className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length > 0 ? (
                                    categories.map((cat) => (
                                        <tr key={cat._id}>
                                            <td className="fw-bold text-muted">#{cat.category_id}</td>
                                            <td className="fw-semibold">
                                                <i className="fa-solid fa-tv text-muted me-2"></i>
                                                {cat.category_name}
                                            </td>
                                            <td>
                                                {cat.parent_id && cat.parent_id !== 0 ? (
                                                    <span className="badge bg-secondary">
                                                        {getParentCategoryName(cat.parent_id)}
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-light text-muted border">Root Category</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    onClick={() => handleEdit(cat)}
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    title="Edit"
                                                >
                                                    <i className="fa-solid fa-pen"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.category_id)}
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
                                        <td colSpan="4" className="text-center py-4 text-muted">
                                            No series categories found. Use the form above to create one.
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

export default SeriesCategories;
