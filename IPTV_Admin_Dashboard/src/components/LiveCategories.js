import React, { useState, useEffect } from 'react';
import { LiveAPI } from '../services/api';
import AdminLayout from './layout/AdminLayout';
import SearchBar from './SearchBar';

const LiveCategories = () => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ category_name: '', parent_id: 0 });
    const [editingId, setEditingId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await LiveAPI.get('/live-categories');
            setCategories(res.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error fetching categories');
        }
    };

    // Helper to get parent category name from parent_id
    const getParentCategoryName = (parentId) => {
        if (!parentId || parentId === 0) return 'Root (None)';
        const parent = categories.find((c) => c.category_id === parentId);
        return parent ? parent.category_name : `Category ${parentId}`;
    };

    const handleOpenCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const handleEdit = (category) => {
        setFormData({
            category_name: category.category_name,
            parent_id: category.parent_id || 0
        });
        setEditingId(category._id);
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                parent_id: parseInt(formData.parent_id) || 0
            };
            if (editingId) {
                await LiveAPI.put(`/update-live-category/${editingId}`, data);
                setSuccess('Category updated successfully');
            } else {
                await LiveAPI.post('/create-live-category', data);
                setSuccess('Category created successfully');
            }
            await fetchCategories();
            setShowModal(false);
            resetForm();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Error saving category');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            await LiveAPI.delete(`/delete-live-category/${id}`);
            await fetchCategories();
            setSuccess('Category deleted successfully');
            setTimeout(() => setSuccess(''), 3000);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Error deleting category');
        }
    };

    const resetForm = () => {
        setFormData({ category_name: '', parent_id: 0 });
        setEditingId(null);
    };

    const filteredCategories = categories.filter((cat) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        const name = (cat.category_name || '').toLowerCase();
        const id = String(cat.category_id || '');
        const parentName = getParentCategoryName(cat.parent_id).toLowerCase();
        return name.includes(term) || id.includes(term) || parentName.includes(term);
    });

    return (
        <AdminLayout
            title="Live Categories"
            subtitle="Manage Live TV genres and groupings"
            breadcrumbs={[
                { label: 'IPTV Management', link: '/live-categories' },
                { label: 'Live Categories' }
            ]}
        >
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Categories Table Card (Displayed First) */}
            <div className="admin-card">
                <div className="admin-card-header bg-light d-flex flex-wrap justify-content-between align-items-center gap-2">
                    <h3 className="admin-card-title mb-0">
                        <i className="fa-solid fa-folder-tree text-primary me-2"></i>
                        Available Categories ({filteredCategories.length}{searchTerm.trim() ? ` of ${categories.length}` : ''})
                    </h3>
                    <div className="d-flex align-items-center gap-2">
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search categories..."
                        />
                        <button onClick={handleOpenCreateModal} className="btn btn-sm btn-primary text-nowrap">
                            <i className="fa-solid fa-plus me-1"></i> Add Category
                        </button>
                    </div>
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
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map((cat) => (
                                        <tr key={cat._id}>
                                            <td className="fw-bold text-muted">#{cat.category_id}</td>
                                            <td className="fw-semibold">
                                                <i className="fa-regular fa-folder text-warning me-2"></i>
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
                                            {searchTerm.trim() ? (
                                                <>
                                                    <i className="fa-solid fa-magnifying-glass me-2"></i>
                                                    No categories found matching "{searchTerm}".{' '}
                                                    <button
                                                        type="button"
                                                        className="btn btn-link btn-sm p-0 ms-1"
                                                        onClick={() => setSearchTerm('')}
                                                    >
                                                        Clear search
                                                    </button>
                                                </>
                                            ) : (
                                                <>No categories created yet. Click <strong>Add Category</strong> above to create one.</>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Popup Modal for Add / Edit Category */}
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
                                    {editingId ? 'Edit Live Category' : 'Create New Live Category'}
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
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Category Name *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Sports, News, Movies, Kids"
                                            value={formData.category_name}
                                            onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                                            className="form-control"
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div className="mb-3">
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
                                        <div className="form-text">
                                            Select an existing category to make this a sub-category, or leave as Root.
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
                                        {editingId ? 'Update Category' : 'Save Category'}
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

export default LiveCategories;
