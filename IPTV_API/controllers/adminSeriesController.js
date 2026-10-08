const SeriesCategory = require('../models/SeriesCategory')
const SeriesStream = require('../models/SeriesStream')


module.exports.getSeriesCategories = async (req, res) => {

    try {
        const categories = await SeriesCategory.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.createSeriesCategory = async (req, res) => {
    try {
        console.log("Series Category data:", req.body)
        const category = new SeriesCategory(req.body);
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports.updateSeriesCategory = async (req, res) => {
    try {
        const category = await SeriesCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!category) return res.status(404).json({ error: 'Not found' });
        res.json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports.deleteSeriesCategory = async (req, res) => {
    try {
        await SeriesCategory.findOneAndDelete({ "category_id": req.params.id })
        res.json({ message: 'Deleted' });
        console.log("Series Category deleted successfully!!")
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// _________________________________________________________


module.exports.getSeriesStreams = async (req, res) => {

    try {
        const streams = await SeriesStream.find();
        res.json(streams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.createSeriesStream = async (req, res) => {
    try
    {
        const { name, category_id, stream_icon, director, cast, release_date, genre, description } = req.body;

        console.log("***************************************** \n req.body: ", req.body)

        const stream = new SeriesStream({
            name,
            category_id: parseInt(category_id),
            stream_icon: stream_icon || '',
            added: Date.now(),
            director: director || '',
            cast: cast || '',
            release_date: release_date || '',
            genre: genre || '',
            description: description || ''
        });

        console.log(stream)

        await stream.save();
        res.status(201).json(stream);
    }
    catch (err)
    {
        res.status(400).json({ error: err.message });
    }

}

module.exports.updateSeriesStream = async (req, res) => {
    try
    {
        const stream = await SeriesStream.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!stream) return res.status(404).json({ error: 'Not found' });
        res.json(stream);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }

}

module.exports.deleteSeriesStream = async (req, res) => {
    try {
        const deleted = await SeriesStream.findOneAndDelete({ "series_id": req.params.id })
        console.log("Deleted:", deleted)
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

}
