const express = require("express");
const flipkartController = require("../controllers/flipkartController");

const router = express.Router();

// Route to scrape Wikipedia
router.get("/scrape", flipkartController.scrapeFlipkartData);

module.exports = router;
