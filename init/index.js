const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing");
const User = require("../models/user");

require('dotenv').config();
const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}
connectDB();

const initDb = async () => {
    await Listing.deleteMany({});
    await User.deleteMany({});
    
    // Create a default user for sample listings
    const defaultUser = new User({
        email: "admin@wanderlust.com",
        username: "admin"
    });
    
    const registeredUser = await User.register(defaultUser, "password123");
    console.log("Default user created:", registeredUser._id);
    
    // Assign the default user as owner to all sample listings
    initData.data = initData.data.map((obj) => {
        return {...obj, owner: registeredUser._id};
    });
    
    await Listing.insertMany(initData.data);
    console.log("Data was initialized with proper owners");
}

initDb();