const express = require('express');
const mongoose = require('mongoose');
const LiveCategory = require('./models/LiveCategory');
const LiveStream = require('./models/LiveStream');
const SeriesCategory = require('./models/SeriesCategory');
const SeriesStream = require('./models/SeriesStream');
const Season = require('./models/Season');
const Episode = require('./models/Episode');
const VodCategory = require('./models/VodCategory');
const VodStream = require('./models/VodStream');
const path = require("path");
const fs = require("fs");
const cors = require('cors');

const bodyParser = require('body-parser');



const config = require('./config/config');
const db = config.URL;
const PORT = config.PORT;

const adminRoutes = require('./routes/adminRoutes')
const vodRoutes = require('./routes/VodRoutes')
const seriesRoutes = require('./routes/SeriesRoutes')
const seasonRoutes = require('./routes/SeasonRoutes')
const episodeRoutes = require('./routes/EpisodeRoutes')

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const USERNAME = 'test';
const PASSWORD = 'test';

// Note: Multer configuration is now handled in individual route files

// Connect MongoDB (adjust URI if needed)
mongoose
    .connect(db)
    .then(()=>{
        console.log('MongoDB connected...');
        console.log('Database URL:', db);
        // Check if the collection exists and has data
        mongoose.connection.db.listCollections().toArray()
            .then((collections) => {
                console.log('Available collections:', collections.map(c => c.name));
            })
            .catch((err) => {
                console.log('Error listing collections:', err);
            });
    })
    .catch(err=> console.log('MongoDB error:', err))


// app.use(cors());
app.use(cors({
    origin: '*', // Or specify allowed origins, e.g., ['http://localhost', 'https://yourapp.com']
    methods: ['GET', 'POST', 'PUT', 'OPTIONS', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    console.log('Incoming request:', {
        url: req.url,
        query: req.query,
        headers: req.headers,
        body: req.body
    });
    next();

});


app.use('/admin', adminRoutes);
app.use('/admin-vod', vodRoutes);
app.use('/admin-series', seriesRoutes);
app.use('/admin-seasons', seasonRoutes);
app.use('/admin-episodes', episodeRoutes);

// Simple auth check
// function auth(req) {
//     return req.query.username === USERNAME && req.query.password === PASSWORD;
// }


// Auth middleware
function auth(req) {
    const username = Array.isArray(req.query.username) ? req.query.username[0] : req.query.username || req.headers['x-username'] || req.body.username;
    const password = Array.isArray(req.query.password) ? req.query.password[0] : req.query.password || req.headers['x-password'] || req.body.password;
    return username === USERNAME && password === PASSWORD;
}

// Handle OPTIONS requests for player_api.php
app.options('/player_api.php', (req, res) => {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
        'Access-Control-Max-Age': '86400'
    });
    res.end();
});

// Handler function for player_api.php (used by both GET and POST)
async function handlePlayerApi(req, res) {
    // Set CORS headers for IPTV compatibility
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, If-None-Match',
        'Access-Control-Expose-Headers': 'ETag, Last-Modified',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Type': 'application/json; charset=utf-8'
    });

    // Log incoming requests for debugging
    console.log('Incoming player_api.php request:', {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: req.headers,
        body: req.body
    });

    // Check authentication
    const isAuthenticated = auth(req);
    console.log('Authentication result:', isAuthenticated);
    
    if (!isAuthenticated) {
        console.log('Authentication failed - returning blocked response');
        return res.status(200).json({ user_info: { auth: 0, status: "Blocked", username: "", password: "", message: "Invalid credentials" } });
    }

    // Merge query and body parameters (some clients send via POST body)
    const params = { ...req.query, ...req.body };
    
    // Handle duplicate action parameters
    const action = Array.isArray(params.action) ? params.action[0] : params.action;
    const category_id = Array.isArray(params.category_id) ? params.category_id[0] : params.category_id;
    const vod_id = Array.isArray(params.vod_id) ? params.vod_id[0] : params.vod_id;
    const series_id = Array.isArray(params.series_id) ? params.series_id[0] : params.series_id;

    try {
        // Default response when no action is specified (authentication/info request)
        if (!action || action === '' || action === undefined) {
            console.log('No action specified - returning user_info and server_info');
            const hostHeader = req.get('host') || '';
            const hostOnly = hostHeader.split(':')[0];
            const response = {
                user_info: {
                    username: USERNAME,
                    password: PASSWORD,
                    auth: 1,
                    status: "Active",
                    exp_date: "1769717936",
                    is_trial: "0",
                    active_cons: "0",
                    created_at: "1699717936",
                    max_connections: "1",
                    allowed_output_formats: ["m3u8", "ts", "rtmp"]
                },
                server_info: {
                    url: hostOnly,
                    port: PORT.toString(),
                    https_port: "",
                    server_protocol: "http",
                    rtmp_port: "",
                    timezone: "UTC",
                    timestamp_now: Math.floor(Date.now() / 1000),
                    time_now: new Date().toISOString()
                }
            };
            console.log('Sending response:', JSON.stringify(response, null, 2));
            return res.status(200).json(response);
        }

        if (action === 'get_live_categories')
        {
            try {
                console.log("Getting Live Categories")
                const categories = await LiveCategory.find().lean();

                const formatted = categories.map(c => ({
                    category_id: String(c.category_id),
                    category_name: c.category_name,
                    parent_id: c.parent_id || 0
                }));

                // res.setHeader('Content-Type', 'application/json');
                return res.json(formatted);
            } catch (error) {
                console.error("Error fetching live categories:", error);
                return res.status(500).json({ error: "Failed to fetch live categories" });
            }
        }

        if (action === 'get_live_streams')
        {
            console.log("Getting Live Streams")
            const parsedCategoryId = Number(category_id);
            const filter = Number.isFinite(parsedCategoryId) ? { category_id: parsedCategoryId } : {};

            const streams = await LiveStream.find(filter).lean();

            const formatted = streams.map((s, i) => ({
                num: i + 1,
                name: s.name,
                stream_type: "live",
                stream_id: s.stream_id,
                stream_icon: s.stream_icon || "",
                epg_channel_id: null,
                added: s.added ? s.added.toISOString() : "",
                category_id: s.category_id,
                custom_sid: "",
                tv_archive: 0,
                direct_source: s.file || "",
                tv_archive_duration: 0
            }));

            return res.json(formatted);
        }

        if (action === 'get_series_categories')
        {
            console.log("Getting Series Categories")
            const categories = await SeriesCategory.find().lean();
            const formatted = categories.map(c => ({
                category_id: String(c.category_id),
                category_name: c.category_name,
                parent_id: c.parent_id || 0
            }));
            return res.json(formatted);
        }

        if (action === 'get_series')
        {
            console.log("Getting series for category_id:", category_id);
            const parsedCategoryId = Number(category_id);
            const filter = Number.isFinite(parsedCategoryId) ? { category_id: parsedCategoryId } : {};
            const series = await SeriesStream.find(filter).lean();
            console.log(`Found ${series.length} series in database`);
            
            const hostHeader = req.get('host') || '';
            const hostOnly = hostHeader.split(':')[0];
            const base = `http://${hostOnly}:${PORT}`;
            
            const response = series.map((s, i) => ({
                num: i + 1,
                name: s.name,
                stream_type: "series",
                series_id: s.series_id,
                stream_icon: s.stream_icon || "",
                added: s.added ? new Date(s.added).toISOString() : "",
                category_id: s.category_id,
                container_extension: "mp4",
                custom_sid: "",
                direct_source: `${base}/series/${USERNAME}/${PASSWORD}/${s.series_id}.mp4`
            }));
            
            console.log("Series response:", JSON.stringify(response, null, 2));
            return res.json(response);
        }

        if (action === 'get_vod_categories')
        {
            console.log("Getting VOD Categories")
            const categories = await VodCategory.find().lean();
            const formatted = categories.map(c => ({
                category_id: String(c.category_id),
                category_name: c.category_name,
                parent_id: c.parent_id || 0
            }));
            return res.json(formatted);
        }

        if (action === 'get_vod_streams')
        {
            console.log("Getting VOD Streams");
            const parsedCategoryId = Number(category_id);
            const filter = Number.isFinite(parsedCategoryId) ? { category_id: parsedCategoryId } : {};
            console.log("VOD filter:", filter);
            const vods = await VodStream.find(filter).lean();
            console.log("VODs found:", vods.length);
            const hostHeader = req.get('host') || '';
            const hostOnly = hostHeader.split(':')[0];
            const base = `http://${hostOnly}:${PORT}`;
            const response = vods.map((v, i) => {
                const fileName = v.file || '';
                const fileExt = (fileName.split('.').pop() || 'mp4').toLowerCase();
                return {
                    num: i + 1,
                    name: v.name || 'Unknown Movie',
                    stream_type: "movie",
                    stream_id: v.vod_id || i + 1,
                    stream_icon: v.stream_icon || "",
                    added: v.added ? new Date(v.added).toISOString() : new Date().toISOString(),
                    category_id: Number.isFinite(Number(v.category_id)) ? Number(v.category_id) : 0,
                    container_extension: fileExt,
                    custom_sid: "",
                    direct_source: `${base}/movie/${USERNAME}/${PASSWORD}/${v.vod_id || i + 1}.${fileExt}`,
                    rating: v.rating || "0",
                    epg_channel_id: null,
                    tv_archive: 0,
                    tv_archive_duration: 0,
                    description: v.description || "",
                    year: v.year || ""
                };
            });
            return res.json(response);
        }


        if (action === 'get_vod_info')
        {
            console.log("Getting VOD info for vod_id:", vod_id);
            if (!vod_id || isNaN(vod_id)) {
                return res.status(400).json({ error: 'Invalid VOD ID' });
            }

            try {
                const vod = await VodStream.findOne({ vod_id: parseInt(vod_id) });
                if (!vod) {
                    return res.status(404).json({ error: 'VOD not found' });
                }
                const hostHeader = req.get('host') || '';
                const hostOnly = hostHeader.split(':')[0];
                const base = `http://${hostOnly}:${PORT}`;

                const options = { year: 'numeric', month: 'short', day: '2-digit' };

                const response = {
                    info: {
                        name: vod.name || 'N/A',
                        title: vod.title || vod.name || 'N/A',
                        year: vod.year || 'N/A',
                        duration: vod.duration,
                        plot: vod.plot,
                        stream_type: 'movie',
                        container_extension: vod.container_extension || 'mp4',
                        direct_source: `${base}/movie/${USERNAME}/${PASSWORD}/${vod_id}.mp4`,
                        rating: vod.rating || '0',
                        added: vod.added ? new Date(vod.added).toISOString() : '',
                        category_id: String(vod.category_id || 0),
                        stream_icon: vod.stream_icon || 'N/A',
                        movie_image: vod.stream_icon,
                        director: vod.director,
                        releasedate: (new Date(vod.releasedate)).toLocaleDateString('en-US', options),
                        genre: vod.genre,
                        cast: vod.casts,
                    }
                }
                console.log("__________________________________________________________________________________");
                console.log("VOD info response:", JSON.stringify(vod, null, 2));
                console.log("*******************************************************************************:");
                console.log("VOD info response:", JSON.stringify(response, null, 2));
                return res.json(response);
            } catch (err) {
                console.error('Error fetching VOD:', err);
                return res.status(500).json({ error: 'Server error' });
            }
        }

        if (action === 'get_series_info')
        {
            console.log("Getting Series Info for series_id:", series_id);
            let validSeriesId = series_id;
            
            if (!series_id || isNaN(series_id) || parseInt(series_id) <= 0) {
                console.log("Invalid series_id:", series_id, "- Trying to find first available series");
                
                // Try to find the first available series as a fallback
                const firstSeries = await SeriesStream.findOne().sort({ series_id: 1 }).lean();
                if (firstSeries) {
                    console.log("Found first series as fallback:", firstSeries.name, "with series_id:", firstSeries.series_id);
                    validSeriesId = firstSeries.series_id;
                } else {
                    console.log("No series found in database");
                    return res.status(400).json({ error: 'Invalid series ID. No series streams exist in the database.' });
                }
            }
            try {
                const series = await SeriesStream.findOne({ series_id: parseInt(validSeriesId) }).lean();
                if (!series) {
                    console.log("Series not found for series_id:", validSeriesId);
                    return res.status(404).json({ error: 'Series not found' });
                }
                
                // Get seasons for this series
                const seasons = await Season.find({ series_id: parseInt(validSeriesId) }).sort({ season_number: 1 }).lean();
                console.log(`Found ${seasons.length} seasons for series ${validSeriesId}`);
                
                // Get episodes for this series
                const episodes = await Episode.find({ series_id: parseInt(validSeriesId) }).sort({ season_number: 1, episode_number: 1 }).lean();
                console.log(`Found ${episodes.length} episodes for series ${validSeriesId}`);
                
                const hostHeader = req.get('host') || '';
                const hostOnly = hostHeader.split(':')[0];
                const base = `http://${hostOnly}:${PORT}`;
                
                // Format seasons data
                const seasonsData = seasons.map(season => ({
                    air_date: season.added ? new Date(season.added).toISOString() : '',
                    episode_count: episodes.filter(ep => ep.season_id === season.season_id).length,
                    id: season.season_id,
                    name: season.name,
                    overview: season.description || '',
                    season_number: season.season_number,
                    cover: season.cover || '',
                    cover_big: season.cover || ''
                }));
                
                // Format episodes data by season
                const episodesData = {};
                seasons.forEach(season => {
                    const seasonEpisodes = episodes
                        .filter(ep => ep.season_id === season.season_id)
                        .map(episode => ({
                            id: episode.episode_id,
                            episode_num: episode.episode_number,
                            title: episode.name,
                            container_extension: 'mp4',
                            info: {
                                air_date: episode.added ? new Date(episode.added).toISOString() : '',
                                plot: episode.description || '',
                                duration: episode.duration || '0',
                                movie_image: '',
                                rating: '0',
                                season: episode.season_number,
                                episode: episode.episode_number
                            },
                            custom_sid: '',
                            added: episode.added ? new Date(episode.added).toISOString() : '',
                            season: episode.season_number,
                            direct_source: `${base}/episode/${USERNAME}/${PASSWORD}/${episode.episode_id}.mp4`
                        }));
                    
                    episodesData[season.season_number] = seasonEpisodes;
                });
                
                const response = {
                    info: {
                        name: series.name || 'Unknown Series',
                        title: series.name || 'Unknown Series',
                        cover: series.stream_icon || '',
                        plot: series.description || 'No description',
                        cast: series.cast || '',
                        director: series.director || '',
                        genre: series.genre || 'Series',
                        release_date: series.release_date || '',
                        rating: series.rating || '0',
                        last_modified: series.added ? new Date(series.added).toISOString() : new Date().toISOString(),
                        stream_type: 'series',
                        container_extension: series.container_extension || 'mp4',
                        direct_source: `${base}/series/${USERNAME}/${PASSWORD}/${validSeriesId}.mp4`
                    },
                    seasons: seasonsData,
                    episodes: episodesData
                };
                console.log("Series info response:", JSON.stringify(response, null, 2));
                return res.json(response);
            } catch (err) {
                console.error('Error fetching series info:', err);
                return res.status(500).json({ error: 'Server error' });
            }
        }

        return res.status(200).json({ error: "Unknown action" });
    } catch (err) {
        console.error('Error in player_api.php handler:', err);
        return res.status(500).json({ error: "Server error", message: err.message });
    }
}

// Register player_api.php endpoint for both GET and POST
app.get('/player_api.php', handlePlayerApi);
app.post('/player_api.php', handlePlayerApi);

// Xtream Codes playlist endpoint
app.get('/get.php', async (req, res) => {
    const { username, password, type, output } = req.query;

    console.log('Request query:', req.query);
    console.log('get.php__________________________________________________');
    console.log('get.php called with:', {
        query: req.query,
        headers: req.headers,
        ip: req.ip
    });

    if (!auth(req)) {
        return res.status(403).send("Forbidden");
    }

    const host = req.hostname;
    const base = `http://${host}:${PORT}`;

    let lines = [
        `#EXTM3U url-tvg="${base}/xmltv.php?username=${USERNAME}&password=${PASSWORD}" x-tvg-url="${base}/xmltv.php?username=${USERNAME}&password=${PASSWORD}"`,
    ];

    try {
        if (!type || type === 'm3u' || type === 'live' || type === 'LIVE')
        {
            console.log("Serving Live")

            const live = await LiveStream.find().lean();
            live.forEach(s => {
                const logo = s.stream_icon || '';
                lines.push(`#EXTINF:-1 tvg-id="${s.stream_id}" tvg-name="${s.name}" tvg-logo="${logo}" group-title="Live",${s.name}`);
                lines.push(`${base}/live/${USERNAME}/${PASSWORD}/${s.stream_id}.ts`);
            });
        }

        if (!type || type === 'm3u' || type === 'movie' || type === 'vod' || type === "VOD")
        {
            const vods = await VodStream.find().lean();
            vods.forEach(v => {
                lines.push(`#EXTINF:-1 group-title="VOD",${v.name}`);
                lines.push(`${base}/movie/${USERNAME}/${PASSWORD}/${v.vod_id}.mp4`);
            });
        }

        if (!type || type === 'm3u' || type === 'series' || type === "SERIES")
        {
            // const series = await SeriesStream.find().lean();
            // series.forEach(s => {
            //     lines.push(`#EXTINF:-1 group-title="SERIES",${s.name}`);
            //     lines.push(`${base}/series/${USERNAME}/${PASSWORD}/${s.series_id}.mp4`);
            // });

            const episodes = await Episode.find().lean();
            episodes.forEach(episode => {
                lines.push(`#EXTINF:-1 group-title="SERIES",${episode.name}`);
                lines.push(`${base}/series/${USERNAME}/${PASSWORD}/${episode.episode_id}.mp4`);
            });
        }

        res.setHeader('Content-Type', 'audio/x-mpegurl');
        return res.send(lines.join('\n'));
    } catch (e) {
        console.error('Error building m3u:', e);
        return res.status(500).send('Error');
    }
});

// Minimal XMLTV EPG to satisfy clients (empty guide)
app.get('/xmltv.php', (req, res) => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tv generator-info-name="iptv-api">\n</tv>`;
    res.setHeader('Content-Type', 'application/xml');
    return res.send(xml);
});

// Debug endpoint to check episode data
app.get('/debug/episodes', async (req, res) => {
    try {
        const episodes = await Episode.find().lean();
        const series = await SeriesStream.find().lean();
        const seasons = await Season.find().lean();
        
        res.json({
            episodes: episodes.map(ep => ({
                episode_id: ep.episode_id,
                series_id: ep.series_id,
                season_id: ep.season_id,
                season_number: ep.season_number,
                episode_number: ep.episode_number,
                name: ep.name,
                file: ep.file,
                added: ep.added
            })),
            series: series.map(s => ({
                series_id: s.series_id,
                name: s.name,
                category_id: s.category_id
            })),
            seasons: seasons.map(s => ({
                season_id: s.season_id,
                series_id: s.series_id,
                season_number: s.season_number,
                name: s.name
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




// Serve live streams
app.get('/live/:username/:password/:stream_id', async (req, res) => {
    if (req.params.username !== USERNAME || req.params.password !== PASSWORD)
    {
        return res.status(403).send("Forbidden");
    }
    let  liveStreams = []

    try
    {
        liveStreams = await LiveStream.find().lean();

    } catch (error) {
        console.error("Error fetching live streams:", error);
        return res.status(500).json({error: "Failed to fetch live streams"});
    }


    const streamId = parseInt(req.params.stream_id);
    const stream = liveStreams.find(s => s.stream_id === streamId);
    if (!stream) return res.status(404).send("Stream not found");

    const filePath = path.join(config.LIVE_DIR, stream.file);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

    streamFile(req, res, filePath);
});

// Some players require an explicit container extension in the URL
app.get('/live/:username/:password/:stream_id.:ext', async (req, res) => {
    if (req.params.username !== USERNAME || req.params.password !== PASSWORD)
    {
        return res.status(403).send("Forbidden");
    }

    let liveStreams = [];
    try {
        liveStreams = await LiveStream.find().lean();
    } catch (error) {
        console.error("Error fetching live streams:", error);
        return res.status(500).json({ error: "Failed to fetch live streams" });
    }

    const streamId = parseInt(req.params.stream_id);
    const stream = liveStreams.find(s => s.stream_id === streamId);
    if (!stream) return res.status(404).send("Stream not found");

    const filePath = path.join(config.LIVE_DIR, stream.file);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

    const contentTypeByExt = {
        mp4: 'video/mp4',
        m3u8: 'application/vnd.apple.mpegURL',
        ts: 'video/mp2t',
        mkv: 'video/x-matroska'
    };
    const requestedExt = (req.params.ext || '').toLowerCase();
    const contentType = contentTypeByExt[requestedExt] || 'video/mp4';
    streamFile(req, res, filePath, contentType);
});

function streamFile(req, res, filePath, overrideContentType) {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = overrideContentType || 'video/mp4';
    
    // Generate ETag for the file
    const etag = `"${stat.mtime.getTime().toString(16)}-${stat.size.toString(16)}"`;
    
    // Check if client has the same version (ETag match)
    if (req.headers['if-none-match'] === etag) {
        res.writeHead(304, {
            'ETag': etag,
            'Cache-Control': 'public, max-age=31536000',
            'Last-Modified': stat.mtime.toUTCString()
        });
        return res.end();
    }

    // Set common headers for IPTV compatibility
    const commonHeaders = {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'ETag': etag,
        'Cache-Control': 'public, max-age=31536000',
        'Last-Modified': stat.mtime.toUTCString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, If-Range, If-None-Match, If-Modified-Since',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
        'X-Content-Type-Options': 'nosniff',
        'Connection': 'keep-alive'
    };

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        const head = {
            ...commonHeaders,
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Content-Length': chunksize,
        };
        res.writeHead(206, head);
        if (req.method === 'HEAD') {
            return res.end();
        }
        const file = fs.createReadStream(filePath, { start, end });
        file.pipe(res);
    } else {
        const head = {
            ...commonHeaders,
            'Content-Length': fileSize,
        };
        res.writeHead(200, head);
        if (req.method === 'HEAD') {
            return res.end();
        }
        fs.createReadStream(filePath).pipe(res);
    }
}

// Handle OPTIONS requests for CORS
app.options('/movie/:username/:password/:stream_id.:ext', (req, res) => {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, If-Range, If-None-Match, If-Modified-Since',
        'Access-Control-Max-Age': '86400'
    });
    res.end();
});

// VOD by Xtream-style path (with extension)
app.get('/movie/:username/:password/:stream_id.:ext', async (req, res) => {
    if (req.params.username !== USERNAME || req.params.password !== PASSWORD) {
        return res.status(403).send("Forbidden");
    }

    const streamId = parseInt(req.params.stream_id);
    let vodStreams = [];
    try {
        vodStreams = await VodStream.find().lean();
    } catch (error) {
        console.error("Error fetching vod streams:", error);
        return res.status(500).json({ error: "Failed to fetch vod streams" });
    }

    const vod = vodStreams.find(v => v.vod_id === streamId);
    if (!vod) return res.status(404).send("Stream not found");

    const filePath = path.join(config.VOD_DIR, vod.file);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

    const contentTypeByExt = {
        mp4: 'video/mp4',
        m3u8: 'application/vnd.apple.mpegURL',
        ts: 'video/mp2t',
        mkv: 'video/x-matroska',
    };
    const requestedExt = (req.params.ext || '').toLowerCase();
    const contentType = contentTypeByExt[requestedExt] || 'video/mp4';
    streamFile(req, res, filePath, contentType);
});

// Handle OPTIONS requests for CORS (without extension)
app.options('/movie/:username/:password/:stream_id', (req, res) => {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, If-Range, If-None-Match, If-Modified-Since',
        'Access-Control-Max-Age': '86400'
    });
    res.end();
});

// VOD by Xtream-style path (without extension)
app.get('/movie/:username/:password/:stream_id', async (req, res) => {
    if (req.params.username !== USERNAME || req.params.password !== PASSWORD) {
        return res.status(403).send("Forbidden");
    }

    const streamId = parseInt(req.params.stream_id);
    let vodStreams = [];
    try {
        vodStreams = await VodStream.find().lean();
    } catch (error) {
        console.error("Error fetching vod streams:", error);
        return res.status(500).json({ error: "Failed to fetch vod streams" });
    }

    const vod = vodStreams.find(v => v.vod_id === streamId);
    if (!vod) return res.status(404).send("Stream not found");

    const filePath = path.join(config.VOD_DIR, vod.file);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found");

    streamFile(req, res, filePath);
});


// SERIES by Xtream-style path (with extension)
app.get('/series/:username/:password/:stream_id.:ext', async (req, res) => {
    if (req.params.username !== USERNAME || req.params.password !== PASSWORD) {
        return res.status(403).send("Forbidden");
    }

    const streamId = parseInt(req.params.stream_id);
    console.log(`[series.ext] Request for series_id=${streamId}, ext=${req.params.ext}`);
    // Legacy behavior: serve the first episode of the series
    try {
        const firstEpisode = await Episode.findOne({ 'series_id': streamId })
            .sort({ season_number: 1, episode_number: 1 })
            .lean();
        if (!firstEpisode) {
            console.log(`[series.ext] No episodes found for series_id=${streamId}`);
            const sample = await Episode.find({}).limit(5).lean();
            console.log(`[series.ext] Sample existing episodes (up to 5):`, sample.map(e => ({ series_id: e.series_id, season_id: e.season_id, episode_id: e.episode_id, file: e.file })));
            return res.status(404).send("No episodes found for this series");
        }

        const filePath = path.join(config.SERIES_DIR, firstEpisode.file);
        console.log(`[series.ext] Found first episode_id=${firstEpisode.episode_id}, file=${firstEpisode.file}`);
        console.log(`[series.ext] Looking for file at: ${filePath}`);
        if (!fs.existsSync(filePath)) {
            console.log(`[series.ext] File not found on disk at: ${filePath}`);
            return res.status(404).send("File not found");
        }

        const contentTypeByExt = {
            mp4: 'video/mp4',
            m3u8: 'application/vnd.apple.mpegURL',
            ts: 'video/mp2t',
            mkv: 'video/x-matroska',
        };
        const requestedExt = (req.params.ext || '').toLowerCase();
        const contentType = contentTypeByExt[requestedExt] || 'video/mp4';
        console.log(`[series.ext] Streaming with content-type=${contentType}`);
        streamFile(req, res, filePath, contentType);
    } catch (error) {
        console.error("[series.ext] Error resolving series first episode:", error);
        return res.status(500).json({ error: "Failed to fetch series" });
    }
});

// SERIES by Xtream-style path (without extension)
app.get('/series/:username/:password/:stream_id', async (req, res) => {
    console.log(`Streaming request: /series/${req.params.username}/${req.params.password}/${req.params.stream_id}`);
    
    if (req.params.username !== USERNAME || req.params.password !== PASSWORD) {
        console.log("Authentication failed for streaming request");
        return res.status(403).send("Forbidden");
    }

    const streamId = parseInt(req.params.stream_id);
    console.log(`Looking for series with stream_id: ${streamId}`);
    
    let seriesStreams = [];
    try {
        seriesStreams = await SeriesStream.find().lean();
        console.log(`Found ${seriesStreams.length} series streams in database`);
    } catch (error) {
        console.error("Error fetching series streams:", error);
        return res.status(500).json({ error: "Failed to fetch series streams" });
    }

    const series = seriesStreams.find(v => v.series_id === streamId);
    if (!series) {
        console.log(`Series not found for stream_id: ${streamId}`);
        console.log("Available series IDs:", seriesStreams.map(s => s.series_id));
        return res.status(404).send("Stream not found");
    }

    // Legacy: serve first episode of this series if exists
    try {
        const firstEpisode = await Episode.findOne({ series_id: streamId })
            .sort({ season_number: 1, episode_number: 1 })
            .lean();
        if (!firstEpisode) {
            console.log(`No episodes found for series_id: ${streamId}`);
            return res.status(404).send("No episodes found for this series");
        }
        const filePath = path.join(config.SERIES_DIR, firstEpisode.file);
        console.log(`Streaming first episode file at: ${filePath}`);
        if (!fs.existsSync(filePath)) {
            console.log(`File not found at: ${filePath}`);
            return res.status(404).send("File not found");
        }
        streamFile(req, res, filePath);
    } catch (e) {
        console.error("Error resolving first episode:", e);
        return res.status(500).send("Server error");
    }
});

// EPISODE by Xtream-style path (with extension)
app.get('/episode/:username/:password/:episode_id.:ext', async (req, res) => {
    if (req.params.username !== USERNAME || req.params.password !== PASSWORD) {
        return res.status(403).send("Forbidden");
    }

    const episodeId = parseInt(req.params.episode_id);
    console.log(`[episode.ext] Request for episode_id=${episodeId}, ext=${req.params.ext}`);
    
    let episodes = [];
    try {
        episodes = await Episode.find().lean();
        console.log(`[episode.ext] Found ${episodes.length} episodes in database`);
    } catch (error) {
        console.error("Error fetching episodes:", error);
        return res.status(500).json({ error: "Failed to fetch episodes" });
    }

    const episode = episodes.find(e => e.episode_id === episodeId);
    if (!episode) {
        console.log(`[episode.ext] Episode not found for episode_id=${episodeId}`);
        console.log(`[episode.ext] Available episode IDs:`, episodes.map(e => e.episode_id));
        return res.status(404).send("Episode not found");
    }

    console.log(`[episode.ext] Found episode:`, { 
        episode_id: episode.episode_id, 
        name: episode.name, 
        file: episode.file,
        series_id: episode.series_id,
        season_id: episode.season_id 
    });

    const filePath = path.join(config.SERIES_DIR, episode.file);
    console.log(`[episode.ext] Looking for file at: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`[episode.ext] File not found on disk at: ${filePath}`);
        return res.status(404).send("File not found");
    }

    const contentTypeByExt = {
        mp4: 'video/mp4',
        m3u8: 'application/vnd.apple.mpegURL',
        ts: 'video/mp2t',
        mkv: 'video/x-matroska',
    };
    const requestedExt = (req.params.ext || '').toLowerCase();
    const contentType = contentTypeByExt[requestedExt] || 'video/mp4';
    console.log(`[episode.ext] Streaming with content-type=${contentType}`);
    streamFile(req, res, filePath, contentType);
});

// EPISODE by Xtream-style path (without extension)
app.get('/episode/:username/:password/:episode_id', async (req, res) => {
    if (req.params.username !== USERNAME || req.params.password !== PASSWORD) {
        return res.status(403).send("Forbidden");
    }

    const episodeId = parseInt(req.params.episode_id);
    console.log(`[episode] Request for episode_id=${episodeId}`);
    
    let episodes = [];
    try {
        episodes = await Episode.find().lean();
        console.log(`[episode] Found ${episodes.length} episodes in database`);
    } catch (error) {
        console.error("Error fetching episodes:", error);
        return res.status(500).json({ error: "Failed to fetch episodes" });
    }

    const episode = episodes.find(e => e.episode_id === episodeId);
    if (!episode) {
        console.log(`[episode] Episode not found for episode_id=${episodeId}`);
        console.log(`[episode] Available episode IDs:`, episodes.map(e => e.episode_id));
        return res.status(404).send("Episode not found");
    }

    console.log(`[episode] Found episode:`, { 
        episode_id: episode.episode_id, 
        name: episode.name, 
        file: episode.file,
        series_id: episode.series_id,
        season_id: episode.season_id 
    });

    const filePath = path.join(config.SERIES_DIR, episode.file);
    console.log(`[episode] Looking for file at: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`[episode] File not found on disk at: ${filePath}`);
        return res.status(404).send("File not found");
    }

    console.log(`[episode] Streaming file: ${episode.file}`);
    streamFile(req, res, filePath);
});


// (Add your streaming routes here, similar to previous examples)
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}...`));

