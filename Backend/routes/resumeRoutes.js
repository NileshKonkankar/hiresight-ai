const express = require("express");

const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

const auth = require("../middleware/authMiddleware");

const {
 uploadResumes,
 updateStatus
} = require("../controllers/resumeController");

router.post(
 "/upload",
 // auth ← REMOVE THIS LINE
 upload.array("resumes",20),
 uploadResumes
);
router.post("/status", updateStatus);

module.exports = router;