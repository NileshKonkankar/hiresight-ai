const express = require("express");
const auth = require("../middleware/authMiddleware");
const {
  listJobDescriptions,
  createJobDescription,
  updateJobDescription,
  deleteJobDescription
} = require("../controllers/jobDescriptionController");

const router = express.Router();

router.use(auth);

router.get("/", listJobDescriptions);
router.post("/", createJobDescription);
router.patch("/:id", updateJobDescription);
router.delete("/:id", deleteJobDescription);

module.exports = router;
