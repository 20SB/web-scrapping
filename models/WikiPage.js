const mongoose = require("mongoose");

const wikiPageSchema = new mongoose.Schema(
    {
        title: String,
        image: String,
        details: Object,
    },
    { timestamps: true }
);

module.exports = mongoose.model("WikiPage", wikiPageSchema);
