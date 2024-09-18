const express = require("express");

const router = express.Router();

router.use("/wiki", require("./wikiRoutes"));
router.use("/rbi", require("./rbiRoutes"));
router.use("/gf", require("./googleFormRoutes"));
router.use("/flipkart", require("./filpkartRoutes"));

module.exports = router;
