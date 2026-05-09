const express = require("express");
const auth = require("../middleware/authMiddleware");
const {
  listJobs,
  createJob,
  updateJob,
  deleteJob
} = require("../controllers/jobController");

const router = express.Router();

router.use(auth);

router.get("/", listJobs);
router.post("/", createJob);
router.patch("/:id", updateJob);
router.delete("/:id", deleteJob);

module.exports = router;
