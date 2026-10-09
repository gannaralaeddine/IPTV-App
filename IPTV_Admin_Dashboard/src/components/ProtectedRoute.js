import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLayout from './layout/AdminLayout';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { isAuthenticated, user, loading, isSuperAdmin } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                height: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ecf0f5'
            }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <div className="mt-3 text-muted fw-bold">Authenticating session...</div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role checks
    if (requiredRole === 'super_admin' && !isSuperAdmin) {
        return (
            <AdminLayout title="Access Denied" subtitle="Super Admin Only">
                <div className="row justify-content-center mt-4">
                    <div className="col-md-8">
                        <div className="card shadow-sm border-0">
                            <div className="card-header bg-danger text-white py-3">
                                <h5 className="card-title mb-0">
                                    <i className="fa-solid fa-shield-halved me-2"></i>
                                    Access Restricted: Super Administrator Role Required
                                </h5>
                            </div>
                            <div className="card-body p-4 text-center">
                                <div className="mb-3">
                                    <i className="fa-solid fa-lock text-danger" style={{ fontSize: '4rem' }}></i>
                                </div>
                                <h4 className="fw-bold mb-2">You do not have permission to access this module</h4>
                                <p className="text-muted mb-4">
                                    Your account role is <strong>{user?.role?.toUpperCase()}</strong>.
                                    Only users with the <strong>SUPER_ADMIN</strong> role have privileges to manage Live streams, VOD, TV Series, and user role assignments.
                                </p>
                                <div className="d-flex justify-content-center gap-3">
                                    <Link to="/" className="btn btn-outline-secondary">
                                        <i className="fa-solid fa-house me-2"></i> Dashboard Home
                                    </Link>
                                    <Link to="/client-users" className="btn btn-primary">
                                        <i className="fa-solid fa-users me-2"></i> Manage Client Subscriptions
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return children;
};

export default ProtectedRoute;
