const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const auth = require("../middleware/authMiddleware");
const {
  listResumes,
  uploadResumes,
  updateStatus,
  deleteResume
} = require("../controllers/resumeController");

const router = express.Router();

router.get("/", auth, listResumes);
router.post("/upload", auth, upload.array("resumes", 20), uploadResumes);
router.post("/status", auth, updateStatus);
router.delete("/:id", auth, deleteResume);

module.exports = router;
