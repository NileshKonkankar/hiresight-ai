const express = require("express");
const router = express.Router();

const {
 rankCandidates
} = require("../controllers/aiController");

router.post("/rank", rankCandidates);

module.exports = router;