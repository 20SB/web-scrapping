const express = require("express");
const googleFormController = require("../controllers/googleFormController");

const router = express.Router();

router.get("/fill", googleFormController.fillForm);

module.exports = router;
