const express = require("express");
const rbiWebPageScrapController = require("../controllers/rbiController");

const router = express.Router();

// Route to scrape RBI PDFs
router.get("/scrape", rbiWebPageScrapController.scrapeRbiPdfs);

// Route to scrape RBI PDFs of a particular time period
router.get("/scrape_pdfs", rbiWebPageScrapController.scrapeRbiPdfsOfParticularTimePeriod);

// Route to scrape RBI speeches from home
router.get("/scrape_speeches_from_home", rbiWebPageScrapController.scrapeRbiSpeechesFromHome);

// Route to scrape RBI speeches
router.get("/scrape_speeches", rbiWebPageScrapController.scrapeRbiSpeeches);

module.exports = router;
