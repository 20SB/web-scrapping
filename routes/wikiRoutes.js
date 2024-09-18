const express = require("express");
const wikiWebPageScrapController = require("../controllers/wikiController");

const router = express.Router();

// Route to scrape Wikipedia
router.get("/scrape", wikiWebPageScrapController.scrapeWikipedia);

module.exports = router;
