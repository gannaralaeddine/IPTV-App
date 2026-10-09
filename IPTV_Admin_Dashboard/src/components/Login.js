import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check query params if session was expired
    const queryParams = new URLSearchParams(location.search);
    const sessionExpired = queryParams.get('session') === 'expired';

    const from = location.state?.from?.pathname || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password) {
            setError('Please enter both username and password.');
            return;
        }

        setLoading(true);
        try {
            await login(username.trim(), password);
            navigate(from, { replace: true });
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const fillDemo = (demoUser, demoPass) => {
        setUsername(demoUser);
        setPassword(demoPass);
        setError('');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#d2d6de',
            padding: '20px'
        }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo and Brand */}
                <div className="text-center mb-4">
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        backgroundColor: '#3c8dbc',
                        color: '#fff',
                        fontSize: '28px',
                        marginBottom: '10px',
                        boxShadow: '0 4px 10px rgba(60, 141, 188, 0.4)'
                    }}>
                        <i className="fa-solid fa-tv"></i>
                    </div>
                    <h2 className="fw-bold text-dark mb-0" style={{ letterSpacing: '0.5px' }}>
                        IPTV <span style={{ color: '#3c8dbc', fontWeight: '300' }}>PORTAL</span>
                    </h2>
                    <p className="text-muted small">Content & Subscriber Management System</p>
                </div>

                {/* Login Card */}
                <div className="card shadow border-0" style={{ borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{
                        backgroundColor: '#3c8dbc',
                        color: '#ffffff',
                        padding: '16px 24px',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px'
                    }}>
                        <h5 className="mb-0 fw-bold">Sign In</h5>
                        <small style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Enter your administrator or operator credentials</small>
                    </div>

                    <div className="card-body p-4 bg-white">
                        {sessionExpired && !error && (
                            <div className="alert alert-warning py-2 px-3 small d-flex align-items-center mb-3">
                                <i className="fa-solid fa-triangle-exclamation me-2"></i>
                                Your session has expired. Please sign in again.
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger py-2 px-3 small d-flex align-items-center mb-3">
                                <i className="fa-solid fa-circle-exclamation me-2"></i>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Username or Email */}
                            <div className="mb-3">
                                <label className="form-label fw-bold text-secondary small">Username or Email</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Username or email"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <span className="input-group-text bg-light text-muted">
                                        <i className="fa-solid fa-user"></i>
                                    </span>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="mb-3">
                                <label className="form-label fw-bold text-secondary small">Password</label>
                                <div className="input-group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <label className="form-check-label text-muted small" htmlFor="rememberMe">
                                        Remember Me
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="btn w-100 text-white fw-bold py-2 mb-3"
                                style={{ backgroundColor: '#3c8dbc', borderColor: '#367fa9' }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-right-to-bracket me-2"></i>
                                        Sign In
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Quick Demo Credentials Helpers */}
                        <div className="pt-3 border-top text-center">
                            <span className="text-muted small d-block mb-2">Quick Sign-in (Demo Accounts):</span>
                            <div className="d-flex gap-2 justify-content-center">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => fillDemo('superadmin', 'superadmin123')}
                                    title="All privileges: User management, live, vod, series, roles"
                                >
                                    <i className="fa-solid fa-shield-halved me-1"></i> Super Admin
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => fillDemo('admin', 'admin123')}
                                    title="Client subscriber management & category assignment"
                                >
                                    <i className="fa-solid fa-user-gear me-1"></i> Admin
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-3 text-muted small">
                    IPTV Platform &bull; Xtream Codes Engine &bull; {new Date().getFullYear()}
                </div>
            </div>
        </div>
    );
};

export default Login;
