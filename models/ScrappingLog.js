const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
    {
        totalscrapedData: Number,
        totalNewData: Number,
    },
    { timestamps: true }
);

module.exports = mongoose.model("ScrappingLog", LogSchema);
