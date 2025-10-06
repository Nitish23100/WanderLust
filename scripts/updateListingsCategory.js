require('dotenv').config();
const mongoose = require("mongoose");
const Listing = require("../models/listing");

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function updateExistingListings() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to MongoDB");

        // Update all existing listings without a category to have 'trending' as default
        const result = await Listing.updateMany(
            { category: { $exists: false } },
            { $set: { category: "trending" } }
        );

        console.log(`Updated ${result.modifiedCount} listings with default category 'trending'`);
        
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    } catch (error) {
        console.error("Error updating listings:", error);
        process.exit(1);
    }
}

updateExistingListings();