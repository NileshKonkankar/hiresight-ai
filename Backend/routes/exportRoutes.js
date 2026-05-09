const express = require("express");
const auth = require("../middleware/authMiddleware");
const { exportCSV } = require("../controllers/exportController");

const router = express.Router();

router.get("/csv", auth, exportCSV);

module.exports = router;
