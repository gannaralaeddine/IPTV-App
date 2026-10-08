import axios from 'axios';

const getApiBaseUrl = () => {
    if (process.env.REACT_APP_API_URL !== undefined) {
        return process.env.REACT_APP_API_URL;
    }
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
        const protocol = window.location.protocol || 'http:';
        return `${protocol}//${window.location.hostname}:8080`;
    }
    return 'http://localhost:8080';
};

const API_BASE_URL = getApiBaseUrl();

const LiveAPI = axios.create({
    baseURL: `${API_BASE_URL}/admin`, // Or 'http://localhost:8080/admin' for dev
    params: { username: 'test', password: 'test' } // Basic auth via query params
});

const VodAPI = axios.create({
    baseURL: `${API_BASE_URL}/admin-vod`, // Or 'http://localhost:8080/admin' for dev
    params: { username: 'test', password: 'test' } // Basic auth via query params
});

const SeriesAPI = axios.create({
    baseURL: `${API_BASE_URL}/admin-series`, // Or 'http://localhost:8080/admin' for dev
    params: { username: 'test', password: 'test' } // Basic auth via query params
});

const SeasonAPI = axios.create({
    baseURL: `${API_BASE_URL}/admin-seasons`, // Or 'http://localhost:8080/admin' for dev
    params: { username: 'test', password: 'test' } // Basic auth via query params
});

const EpisodeAPI = axios.create({
    baseURL: `${API_BASE_URL}/admin-episodes`, // Or 'http://localhost:8080/admin' for dev
    params: { username: 'test', password: 'test' } // Basic auth via query params
});

export { LiveAPI, VodAPI, SeriesAPI, SeasonAPI, EpisodeAPI, API_BASE_URL };
