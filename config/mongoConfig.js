const mongoose = require("mongoose");

// mongoose.connect(`${process.env.MONGO}/scrappd-data`);

// const db = mongoose.connection;

// db.on("error", function (err) {
//     console.log(err.message);
// });

// db.once("open", function () {
//     console.log(`Successfully connected to the database :: MongoDB`);
// });

// module.exports = db;

// MongoDB connection setup
async function connectToDB() {
    try {
        await mongoose.connect(`${process.env.MONGO}/scrappd-data`);

        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

module.exports = connectToDB;
