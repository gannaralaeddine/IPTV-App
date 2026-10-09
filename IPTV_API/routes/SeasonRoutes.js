const { Router } = require('express');
const adminSeasonController = require('../controllers/adminSeasonController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/authMiddleware');
const router = Router();

// Only super_admin has access to Seasons management
router.use(authenticateToken, requireSuperAdmin);

// Season Routes
router.get("/seasons", adminSeasonController.getSeasons);
router.post("/create-season", adminSeasonController.createSeason);
router.put("/update-season/:id", adminSeasonController.updateSeason);
router.delete("/delete-season/:id", adminSeasonController.deleteSeason);
router.get("/season/:id", adminSeasonController.getSeasonWithEpisodes);

module.exports = router;
