const mongoose = require("mongoose");

const speechSchema = new mongoose.Schema(
    {
        date: String,
        title: String,
        speechLink: String,
        pdfLink: String,
        pdfSize: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model("Speech", speechSchema);
