const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
 rankCandidates
} = require("../controllers/aiController");

router.post("/rank", authMiddleware, rankCandidates);

module.exports = router;