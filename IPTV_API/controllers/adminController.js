const LiveCategory = require('../models/LiveCategory')
const LiveStream = require('../models/LiveStream')


module.exports.getLiveCategories = async (req, res) => {

    try {
        const categories = await LiveCategory.find();
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.createLiveCategory = async (req, res) => {
    try {
        console.log("Live Category data:", req.body)
        const category = new LiveCategory(req.body);
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports.updateLiveCategory = async (req, res) => {
    try {
        const category = await LiveCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!category) return res.status(404).json({ error: 'Not found' });
        res.json(category);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}

module.exports.deleteLiveCategory = async (req, res) => {
    try {
        await LiveCategory.findOneAndDelete({ "category_id": req.params.id })
        res.json({ message: 'Deleted' });
        console.log("Live Category deleted successfully!!")
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// _________________________________________________________


module.exports.getLiveStreams = async (req, res) => {

    try {
        const streams = await LiveStream.find();
        res.json(streams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports.createLiveStream = async (req, res) => {
    try
    {
        const { name, category_id, stream_icon } = req.body;

        const file = req.file ? req.file.originalname : null;
        if (!file) return res.status(400).json({ error: 'File is required' });
        const stream = new LiveStream({
            name,
            category_id: parseInt(category_id),
            file,
            stream_icon: stream_icon || '',
            added: Date.now()
        });
        await stream.save();
        res.status(201).json(stream);
    }
    catch (err)
    {
        res.status(400).json({ error: err.message });
    }

}

module.exports.updateLiveStream = async (req, res) => {
    try
    {
        const stream = await LiveStream.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!stream) return res.status(404).json({ error: 'Not found' });
        res.json(stream);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }

}

module.exports.deleteLiveStream = async (req, res) => {
    try {
        const deleted = await LiveStream.findOneAndDelete({ "stream_id": req.params.id })
        console.log("Deleted:", deleted)
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }

}
