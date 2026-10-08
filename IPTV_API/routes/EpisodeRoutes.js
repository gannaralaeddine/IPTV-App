const { Router } = require('express');
const adminEpisodeController = require('../controllers/adminEpisodeController');
const router = Router();

// Episode Routes
router.get("/episodes", adminEpisodeController.getEpisodes);
router.post("/create-episode", adminEpisodeController.episodeUpload.single('file'), adminEpisodeController.createEpisode);
router.put("/update-episode/:id", adminEpisodeController.episodeUpload.single('file'), adminEpisodeController.updateEpisode);
router.delete("/delete-episode/:id", adminEpisodeController.deleteEpisode);

module.exports = router;
