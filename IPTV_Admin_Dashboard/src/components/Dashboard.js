import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './layout/AdminLayout';
import { LiveAPI, VodAPI, SeriesAPI } from '../services/api';

const Dashboard = () => {
    const [chartTab, setChartTab] = useState('Area'); // 'Area' or 'Donut'
    const [stats, setStats] = useState({
        liveStreams: 150,
        vodStreams: 53,
        seriesStreams: 44,
        categories: 65,
        loading: true
    });

    // Fetch actual database counts to display dynamic data if available
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [liveRes, vodRes, seriesRes, liveCatRes] = await Promise.allSettled([
                    LiveAPI.get('/live-streams'),
                    VodAPI.get('/vod-streams'),
                    SeriesAPI.get('/series-streams'),
                    LiveAPI.get('/live-categories')
                ]);

                setStats({
                    liveStreams: liveRes.status === 'fulfilled' && liveRes.value.data.length > 0 ? liveRes.value.data.length : 150,
                    vodStreams: vodRes.status === 'fulfilled' && vodRes.value.data.length > 0 ? vodRes.value.data.length : '53%',
                    seriesStreams: seriesRes.status === 'fulfilled' && seriesRes.value.data.length > 0 ? seriesRes.value.data.length : 44,
                    categories: liveCatRes.status === 'fulfilled' && liveCatRes.value.data.length > 0 ? liveCatRes.value.data.length : 65,
                    loading: false
                });
            } catch (err) {
                // Keep default demo stats from screenshot
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <AdminLayout title="Dashboard" subtitle="Control panel">
            {/* ====================================================
                4 Small Stat Boxes (AdminLTE)
               ==================================================== */}
            <div className="row">
                {/* 1. Aqua Box: New Orders */}
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-aqua">
                        <div className="inner">
                            <h3>{stats.liveStreams}</h3>
                            <p>New Orders</p>
                        </div>
                        <div className="icon">
                            <i className="fa-solid fa-bag-shopping"></i>
                        </div>
                        <Link to="/live-streams" className="small-box-footer">
                            More info <i className="fa-solid fa-circle-arrow-right ms-1"></i>
                        </Link>
                    </div>
                </div>

                {/* 2. Green Box: Bounce Rate */}
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-green">
                        <div className="inner">
                            <h3>{typeof stats.vodStreams === 'number' ? `${stats.vodStreams}%` : stats.vodStreams}</h3>
                            <p>Bounce Rate</p>
                        </div>
                        <div className="icon">
                            <i className="fa-solid fa-chart-column"></i>
                        </div>
                        <Link to="/vod-streams" className="small-box-footer">
                            More info <i className="fa-solid fa-circle-arrow-right ms-1"></i>
                        </Link>
                    </div>
                </div>

                {/* 3. Yellow Box: User Registrations */}
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-yellow">
                        <div className="inner">
                            <h3>{stats.seriesStreams}</h3>
                            <p>User Registrations</p>
                        </div>
                        <div className="icon">
                            <i className="fa-solid fa-user-plus"></i>
                        </div>
                        <Link to="/series-streams" className="small-box-footer">
                            More info <i className="fa-solid fa-circle-arrow-right ms-1"></i>
                        </Link>
                    </div>
                </div>

                {/* 4. Red Box: Unique Visitors */}
                <div className="col-lg-3 col-6">
                    <div className="small-box small-box-red">
                        <div className="inner">
                            <h3>{stats.categories}</h3>
                            <p>Unique Visitors</p>
                        </div>
                        <div className="icon">
                            <i className="fa-solid fa-chart-pie"></i>
                        </div>
                        <Link to="/episodes" className="small-box-footer">
                            More info <i className="fa-solid fa-circle-arrow-right ms-1"></i>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ====================================================
                Main Row: Sales Chart & Visitors Map
               ==================================================== */}
            <div className="row">
                {/* Left Card: Sales Area/Donut Chart */}
                <div className="col-lg-7 col-12">
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h3 className="admin-card-title">
                                <i className="fa-solid fa-box text-primary"></i>
                                Sales
                            </h3>
                            <div className="admin-card-tools">
                                <div className="chart-pills">
                                    <button
                                        type="button"
                                        className={`chart-pill-btn ${chartTab === 'Donut' ? 'active' : ''}`}
                                        onClick={() => setChartTab('Donut')}
                                    >
                                        Donut
                                    </button>
                                    <button
                                        type="button"
                                        className={`chart-pill-btn ${chartTab === 'Area' ? 'active' : ''}`}
                                        onClick={() => setChartTab('Area')}
                                    >
                                        Area
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="admin-card-body" style={{ minHeight: '340px' }}>
                            {chartTab === 'Area' ? (
                                /* SVG Area Chart matching screenshot */
                                <div style={{ width: '100%', height: '300px', position: 'relative' }}>
                                    <svg viewBox="0 0 650 300" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                                        <defs>
                                            {/* Gradient for Top Area */}
                                            <linearGradient id="salesGradTop" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3c8dbc" stopOpacity="0.65" />
                                                <stop offset="100%" stopColor="#3c8dbc" stopOpacity="0.15" />
                                            </linearGradient>
                                            {/* Gradient for Bottom Area */}
                                            <linearGradient id="salesGradBottom" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#5b92b9" stopOpacity="0.8" />
                                                <stop offset="100%" stopColor="#5b92b9" stopOpacity="0.3" />
                                            </linearGradient>
                                        </defs>

                                        {/* Y-axis Horizontal Gridlines */}
                                        <g stroke="#e9ecef" strokeWidth="1">
                                            {/* 30,000 */}
                                            <line x1="55" y1="30" x2="630" y2="30" />
                                            {/* 22,500 */}
                                            <line x1="55" y1="90" x2="630" y2="90" />
                                            {/* 15,000 */}
                                            <line x1="55" y1="150" x2="630" y2="150" />
                                            {/* 7,500 */}
                                            <line x1="55" y1="210" x2="630" y2="210" />
                                            {/* 0 */}
                                            <line x1="55" y1="270" x2="630" y2="270" />
                                        </g>

                                        {/* Y-axis Labels */}
                                        <g fill="#777777" fontSize="12" textAnchor="end">
                                            <text x="50" y="34">30,000</text>
                                            <text x="50" y="94">22,500</text>
                                            <text x="50" y="154">15,000</text>
                                            <text x="50" y="214">7,500</text>
                                            <text x="50" y="274">0</text>
                                        </g>

                                        {/* Layer 1: Bottom Area Filled Path */}
                                        <path
                                            d="M 65 245 
                                               C 110 245, 140 240, 180 235 
                                               C 220 230, 240 228, 280 225 
                                               C 320 222, 340 215, 380 215 
                                               C 420 215, 450 205, 480 180 
                                               C 510 155, 525 190, 545 205 
                                               C 575 220, 600 220, 625 225 
                                               L 625 270 L 65 270 Z"
                                            fill="url(#salesGradBottom)"
                                        />

                                        {/* Layer 2: Top Spline Area Filled Path matching screenshot peak */}
                                        <path
                                            d="M 65 235 
                                               C 110 235, 140 230, 180 225 
                                               C 220 220, 240 215, 280 210 
                                               C 320 205, 340 195, 380 195 
                                               C 410 195, 440 190, 470 170 
                                               C 490 150, 500 115, 515 115 
                                               C 530 115, 545 160, 570 180 
                                               C 595 195, 610 195, 625 200 
                                               L 625 270 L 65 270 Z"
                                            fill="url(#salesGradTop)"
                                        />

                                        {/* Layer 2 Stroke Line */}
                                        <path
                                            d="M 65 235 
                                               C 110 235, 140 230, 180 225 
                                               C 220 220, 240 215, 280 210 
                                               C 320 205, 340 195, 380 195 
                                               C 410 195, 440 190, 470 170 
                                               C 490 150, 500 115, 515 115 
                                               C 530 115, 545 160, 570 180 
                                               C 595 195, 610 195, 625 200"
                                            fill="none"
                                            stroke="#3c8dbc"
                                            strokeWidth="3"
                                        />

                                        {/* Data Points on Curve */}
                                        {[
                                            { cx: 65, cy: 235 },
                                            { cx: 120, cy: 234 },
                                            { cx: 180, cy: 225 },
                                            { cx: 235, cy: 220 },
                                            { cx: 295, cy: 210 },
                                            { cx: 355, cy: 198 },
                                            { cx: 415, cy: 193 },
                                            { cx: 470, cy: 170 },
                                            { cx: 515, cy: 115 },
                                            { cx: 570, cy: 180 },
                                            { cx: 625, cy: 200 }
                                        ].map((pt, i) => (
                                            <g key={i}>
                                                <circle cx={pt.cx} cy={pt.cy} r="5" fill="#ffffff" stroke="#3c8dbc" strokeWidth="2.5" />
                                            </g>
                                        ))}
                                    </svg>
                                </div>
                            ) : (
                                /* Donut View */
                                <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                                    <svg viewBox="0 0 200 200" width="220" height="220">
                                        {/* Live Streams (Aqua) */}
                                        <circle cx="100" cy="100" r="70" fill="transparent" stroke="#00c0ef" strokeWidth="32" strokeDasharray="140 300" strokeDashoffset="0" />
                                        {/* VOD (Green) */}
                                        <circle cx="100" cy="100" r="70" fill="transparent" stroke="#00a65a" strokeWidth="32" strokeDasharray="100 340" strokeDashoffset="-140" />
                                        {/* Series (Yellow) */}
                                        <circle cx="100" cy="100" r="70" fill="transparent" stroke="#f39c12" strokeWidth="32" strokeDasharray="80 360" strokeDashoffset="-240" />
                                        {/* Other (Red) */}
                                        <circle cx="100" cy="100" r="70" fill="transparent" stroke="#dd4b39" strokeWidth="32" strokeDasharray="60 380" strokeDashoffset="-320" />
                                        <text x="100" y="96" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#333">IPTV</text>
                                        <text x="100" y="114" textAnchor="middle" fontSize="12" fill="#777">Traffic</text>
                                    </svg>
                                    <div className="ms-4">
                                        <div className="mb-2"><span className="badge me-2" style={{ background: '#00c0ef' }}>&nbsp;</span> Live TV (45%)</div>
                                        <div className="mb-2"><span className="badge me-2" style={{ background: '#00a65a' }}>&nbsp;</span> VOD Movies (30%)</div>
                                        <div className="mb-2"><span className="badge me-2" style={{ background: '#f39c12' }}>&nbsp;</span> TV Series (15%)</div>
                                        <div className="mb-2"><span className="badge me-2" style={{ background: '#dd4b39' }}>&nbsp;</span> Radio & Catchup (10%)</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Card: Visitors World Map */}
                <div className="col-lg-5 col-12">
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h3 className="admin-card-title">
                                <i className="fa-solid fa-location-dot text-danger"></i>
                                Visitors
                            </h3>
                            <div className="admin-card-tools">
                                <button type="button" className="map-tool-btn me-1">
                                    <i className="fa-solid fa-minus"></i>
                                </button>
                                <button type="button" className="map-tool-btn">
                                    <i className="fa-regular fa-calendar"></i>
                                </button>
                            </div>
                        </div>

                        <div className="admin-card-body p-0" style={{ background: '#458bc4', position: 'relative', overflow: 'hidden', height: '340px' }}>
                            {/* Stylized Vector World Map matching the blue theme in screenshot */}
                            <svg viewBox="0 0 800 450" style={{ width: '100%', height: '100%', display: 'block' }}>
                                {/* Ocean background */}
                                <rect width="800" height="450" fill="#458bc4" />

                                {/* Continents in subtle soft blue */}
                                <g fill="#d8e8f5" opacity="0.95" stroke="#a4c6e2" strokeWidth="0.8">
                                    {/* North America */}
                                    <path d="M 120 70 Q 170 50 240 70 Q 230 110 200 130 Q 180 150 160 180 Q 130 150 110 110 Z" />
                                    <path d="M 160 180 Q 190 200 180 230 Q 165 240 150 220 Z" />
                                    {/* Greenland */}
                                    <path d="M 280 40 Q 340 30 350 60 Q 320 90 280 70 Z" />
                                    {/* South America */}
                                    <path d="M 210 230 Q 270 240 290 290 Q 280 370 230 410 Q 210 330 200 270 Z" />
                                    {/* Europe */}
                                    <path d="M 400 90 Q 460 70 480 100 Q 450 130 420 120 Q 390 120 400 90 Z" />
                                    {/* Africa */}
                                    <path d="M 390 140 Q 490 130 500 200 Q 470 300 430 330 Q 390 280 370 200 Z" />
                                    {/* Asia */}
                                    <path d="M 480 80 Q 640 60 710 130 Q 670 220 580 200 Q 520 180 480 120 Z" />
                                    {/* Australia */}
                                    <path d="M 620 280 Q 720 270 730 330 Q 660 370 610 330 Z" />
                                </g>

                                {/* Activity Hotspot Dots */}
                                <circle cx="180" cy="130" r="5" fill="#ffffff" opacity="0.9" />
                                <circle cx="430" cy="110" r="5" fill="#ffffff" opacity="0.9" />
                                <circle cx="450" cy="220" r="4" fill="#ffffff" opacity="0.9" />
                                <circle cx="610" cy="150" r="6" fill="#ffffff" opacity="0.9" />
                                <circle cx="670" cy="310" r="4" fill="#ffffff" opacity="0.9" />
                            </svg>

                            {/* Zoom controls at bottom right */}
                            <div style={{ position: 'absolute', bottom: '15px', right: '15px', display: 'flex', gap: '3px' }}>
                                <button className="btn btn-sm btn-light py-0 px-2 fw-bold" style={{ fontSize: '13px' }}>+</button>
                                <button className="btn btn-sm btn-light py-0 px-2 fw-bold" style={{ fontSize: '13px' }}>-</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ====================================================
                Quick Management Shortcuts
               ==================================================== */}
            <div className="row mt-2">
                <div className="col-12">
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <h3 className="admin-card-title">
                                <i className="fa-solid fa-list-check text-primary"></i>
                                IPTV Quick Management Center
                            </h3>
                        </div>
                        <div className="admin-card-body">
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <Link to="/live-streams" className="btn btn-outline-primary w-100 p-3 text-start">
                                        <i className="fa-solid fa-video me-2 fs-5"></i>
                                        <strong>Live Streams</strong>
                                        <div className="small text-muted mt-1">Manage channels, TS & M3U8 URLs</div>
                                    </Link>
                                </div>
                                <div className="col-md-3">
                                    <Link to="/live-categories" className="btn btn-outline-info w-100 p-3 text-start">
                                        <i className="fa-solid fa-folder-tree me-2 fs-5"></i>
                                        <strong>Live Categories</strong>
                                        <div className="small text-muted mt-1">Organize channel hierarchies</div>
                                    </Link>
                                </div>
                                <div className="col-md-3">
                                    <Link to="/vod-streams" className="btn btn-outline-success w-100 p-3 text-start">
                                        <i className="fa-solid fa-film me-2 fs-5"></i>
                                        <strong>VOD Movies</strong>
                                        <div className="small text-muted mt-1">Video-on-Demand library</div>
                                    </Link>
                                </div>
                                <div className="col-md-3">
                                    <Link to="/series-streams" className="btn btn-outline-warning w-100 p-3 text-start">
                                        <i className="fa-solid fa-tv me-2 fs-5"></i>
                                        <strong>Series & Seasons</strong>
                                        <div className="small text-muted mt-1">Episodes and series catalogs</div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Dashboard;
