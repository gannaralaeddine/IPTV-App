const { Router } = require('express');
const adminController = require('../controllers/adminController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const router = Router();

// Multer storage configuration for Live streams
const liveStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = config.LIVE_DIR;
        fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use original filename
    }
});

// Create dedicated multer instance for Live streams
const liveUpload = multer({
    storage: liveStorage,
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


// Live Categories ____________________________________________________________________________________________

router.get("/live-categories", adminController.getLiveCategories)

router.post("/create-live-category", adminController.createLiveCategory)

router.put("/update-live-category/:id", adminController.updateLiveCategory)

router.delete("/delete-live-category/:id", adminController.deleteLiveCategory)

// Live Streams ____________________________________________________________________________________________

router.get("/live-streams", adminController.getLiveStreams)

router.post("/create-live-stream", liveUpload.single('file'), adminController.createLiveStream)

router.put("/update-live-stream/:id", liveUpload.single('file'), adminController.updateLiveStream)

router.delete("/delete-live-stream/:id", adminController.deleteLiveStream)

module.exports = router
