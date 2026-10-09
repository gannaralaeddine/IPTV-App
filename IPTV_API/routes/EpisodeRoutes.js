const { Router } = require('express');
const adminEpisodeController = require('../controllers/adminEpisodeController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/authMiddleware');
const router = Router();

// Only super_admin has access to Episodes management
router.use(authenticateToken, requireSuperAdmin);

// Episode Routes
router.get("/episodes", adminEpisodeController.getEpisodes);
router.post("/create-episode", adminEpisodeController.episodeUpload.single('file'), adminEpisodeController.createEpisode);
router.put("/update-episode/:id", adminEpisodeController.episodeUpload.single('file'), adminEpisodeController.updateEpisode);
router.delete("/delete-episode/:id", adminEpisodeController.deleteEpisode);

module.exports = router;
