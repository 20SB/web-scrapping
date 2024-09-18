require("dotenv").config();
require("./config/mongoConfig.js");
const express = require("express");

const app = express();
app.use(express.json());

app.use("/", require("./routes"));

const port = process.env.PORT || 8000;

app.listen(port, () => {
    console.log("Server is running on port ", port);
});
