import axios from 'axios';

const getApiBaseUrl = () => {
    if (process.env.REACT_APP_API_URL !== undefined && process.env.REACT_APP_API_URL !== '') {
        return process.env.REACT_APP_API_URL;
    }
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
        const protocol = window.location.protocol || 'http:';
        return `${protocol}//${window.location.hostname}:8080`;
    }
    return 'http://localhost:8080';
};

const API_BASE_URL = getApiBaseUrl();

// Helper to attach authorization header to an axios instance
const attachAuthInterceptor = (instance) => {
    instance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('iptv_token');
            if (token) {
                config.headers = config.headers || {};
                config.headers['Authorization'] = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                // If token expired or unauthorized, and not already on login page
                if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                    localStorage.removeItem('iptv_token');
                    localStorage.removeItem('iptv_user');
                    window.location.href = '/login?session=expired';
                }
            }
            return Promise.reject(error);
        }
    );
};

const LiveAPI = axios.create({
    baseURL: `${API_BASE_URL}/admin`
});
attachAuthInterceptor(LiveAPI);

const VodAPI = axios.create({
    baseURL: `${API_BASE_URL}/admin-vod`
});
attachAuthInterceptor(VodAPI);

const SeriesAPI = axios.create({
    baseURL: `${API_BASE_URL}/admin-series`
});
attachAuthInterceptor(SeriesAPI);

const SeasonAPI = axios.create({
    baseURL: `${API_BASE_URL}/admin-seasons`
});
attachAuthInterceptor(SeasonAPI);

const EpisodeAPI = axios.create({
    baseURL: `${API_BASE_URL}/admin-episodes`
});
attachAuthInterceptor(EpisodeAPI);

const UserAPI = axios.create({
    baseURL: `${API_BASE_URL}/admin/users`
});
attachAuthInterceptor(UserAPI);

const AuthAPI = axios.create({
    baseURL: `${API_BASE_URL}/auth`
});

export {
    LiveAPI,
    VodAPI,
    SeriesAPI,
    SeasonAPI,
    EpisodeAPI,
    UserAPI,
    AuthAPI,
    API_BASE_URL
};
