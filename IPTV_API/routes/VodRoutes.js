const { Router } = require('express');
const adminVodController = require('../controllers/adminVodController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const { authenticateToken, requireSuperAdmin } = require('../middleware/authMiddleware');
const router = Router();

// Only super_admin has access to VOD management
router.use(authenticateToken, requireSuperAdmin);

// Multer storage configuration for VOD
const vodStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = config.VOD_DIR;
        console.log('VOD Upload - Destination path:', uploadPath);
        fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        console.log('VOD Upload - Filename:', file.originalname);
        cb(null, file.originalname); // Use original filename
    }
});

// Create dedicated multer instance for VOD
const vodUpload = multer({
    storage: vodStorage,
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


// Vod Categories ____________________________________________________________________________________________

router.get("/vod-categories", adminVodController.getVodCategories)

router.post("/create-vod-category", adminVodController.createVodCategory)

router.put("/update-vod-category/:id", adminVodController.updateVodCategory)

router.delete("/delete-vod-category/:id", adminVodController.deleteVodCategory)

// Vod Streams ____________________________________________________________________________________________

router.get("/vod-streams", adminVodController.getVodStreams)

router.post("/create-vod-stream", vodUpload.single('file'), adminVodController.createVodStream)

router.put("/update-vod-stream/:id", vodUpload.single('file'), adminVodController.updateVodStream)

router.delete("/delete-vod-stream/:id", adminVodController.deleteVodStream)

module.exports = router
