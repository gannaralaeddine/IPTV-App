const Episode = require('../models/Episode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getVideoDurationInSeconds } = require('get-video-duration');
const config = require('../config/config');

// Multer storage configuration for Episodes
const episodeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = config.SERIES_DIR;
        console.log('Episode Upload - Destination path:', uploadPath);
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        console.log('Episode Upload - Filename:', file.originalname);
        cb(null, file.originalname);
    }
});

// Create dedicated multer instance for Episodes
const episodeUpload = multer({
    storage: episodeStorage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.ts', '.m3u8', '.mp4'].includes(ext)) {
            cb(null, true);
        } else {
            console.log("Only .ts, .m3u8, and .mp4 files are allowed");
            cb(new Error('Only .ts, .m3u8, and .mp4 files are allowed'), false);
        }
    }
});

module.exports.getEpisodes = async (req, res) => {
    try {
        const { season_id, series_id } = req.query;
        let filter = {};
        
        if (season_id) {
            filter.season_id = parseInt(season_id);
        } else if (series_id) {
            filter.series_id = parseInt(series_id);
        }
        
        const episodes = await Episode.find(filter).sort({ season_number: 1, episode_number: 1 });
        res.json(episodes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.createEpisode = async (req, res) => {
    try {
        const { name, series_id, season_id, season_number, episode_number, description } = req.body;
        const file = req.file ? req.file.originalname : null;

        const duration = await getVideoDurationInSeconds(req.file.path);
        const  hhmmss = secondsToHms(duration)

        if (!file) return res.status(400).json({ error: 'File is required' });
        
        const episode = new Episode({
            name,
            series_id: parseInt(series_id),
            season_id: parseInt(season_id),
            season_number: parseInt(season_number),
            episode_number: parseInt(episode_number),
            file,
            description: description || '',
            duration: hhmmss,
        });
        
        await episode.save();
        res.status(201).json(episode);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports.updateEpisode = async (req, res) => {
    try {
        const episode = await Episode.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!episode) return res.status(404).json({ error: 'Episode not found' });
        res.json(episode);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports.deleteEpisode = async (req, res) => {
    try {
        const deleted = await Episode.findOneAndDelete({ "episode_id": req.params.id });
        console.log("Deleted:", deleted);
        res.json({ message: 'Episode deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// Export the multer middleware for use in routes
module.exports.episodeUpload = episodeUpload;


function secondsToHms(seconds) {
    seconds = Math.floor(seconds); // remove decimals
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}
