const { Router } = require('express');
const adminSeriesController = require('../controllers/adminSeriesController');
// Removed series file uploads; files belong to episodes
const router = Router();

// No multer required


// Series Categories ____________________________________________________________________________________________

router.get("/series-categories", adminSeriesController.getSeriesCategories)

router.post("/create-series-category", adminSeriesController.createSeriesCategory)

router.put("/update-series-category/:id", adminSeriesController.updateSeriesCategory)

router.delete("/delete-series-category/:id", adminSeriesController.deleteSeriesCategory)

// Series Streams ____________________________________________________________________________________________

router.get("/series-streams", adminSeriesController.getSeriesStreams)

router.post("/create-series-stream", adminSeriesController.createSeriesStream)

router.put("/update-series-stream/:id", adminSeriesController.updateSeriesStream)

router.delete("/delete-series-stream/:id", adminSeriesController.deleteSeriesStream)

module.exports = router
