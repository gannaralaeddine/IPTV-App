const Season = require('../models/Season');
const Episode = require('../models/Episode');

module.exports.getSeasons = async (req, res) => {
    try {
        const { series_id } = req.query;
        const filter = series_id ? { series_id: parseInt(series_id) } : {};
        const seasons = await Season.find(filter).sort({ season_number: 1 });
        res.json(seasons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.createSeason = async (req, res) => {
    try {
        console.log("Season data:", req.body);
        const season = new Season(req.body);
        await season.save();
        res.status(201).json(season);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports.updateSeason = async (req, res) => {
    try {
        const season = await Season.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!season) return res.status(404).json({ error: 'Season not found' });
        res.json(season);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports.deleteSeason = async (req, res) => {
    try {
        // Also delete all episodes in this season
        await Episode.deleteMany({ season_id: req.params.id });
        await Season.findOneAndDelete({ "season_id": req.params.id });
        res.json({ message: 'Season and all episodes deleted' });
        console.log("Season deleted successfully!!");
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.getSeasonWithEpisodes = async (req, res) => {
    try {
        const season = await Season.findOne({ season_id: req.params.id });
        if (!season) return res.status(404).json({ error: 'Season not found' });
        
        const episodes = await Episode.find({ season_id: req.params.id }).sort({ episode_number: 1 });
        
        res.json({
            season,
            episodes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
