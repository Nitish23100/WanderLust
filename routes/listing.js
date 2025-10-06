const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema } = require("../schema.js");
const Listing = require("../models/listing");
const { isLoggedIn , isOwner , validateListing} = require("../middleware");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");

const upload = multer({ storage });


//Index Route
router.get("/", wrapAsync(async (req, res) => {
    const { category } = req.query;
    let filter = {};
    
    if (category && category !== 'trending') {
        filter.category = category;
    }
    
    const allListings = await Listing.find(filter);
    res.render("listings/index.ejs", { 
        listings: allListings, 
        selectedCategory: category || 'trending',
        showCategories: true 
    });
}));

// Search Route
router.get("/search", wrapAsync(async (req, res) => {
    const { location } = req.query;
    let filter = {};
    
    if (location && location.trim() !== '') {
        // Search by location, country, or title (case-insensitive)
        filter = {
            $or: [
                { location: { $regex: location, $options: 'i' } },
                { country: { $regex: location, $options: 'i' } },
                { title: { $regex: location, $options: 'i' } }
            ]
        };
    }
    
    const searchResults = await Listing.find(filter);
    
    if (searchResults.length === 0) {
        req.flash("error", `No listings found for "${location}"`);
    } else {
        req.flash("success", `Found ${searchResults.length} listing(s) for "${location}"`);
    }
    
    res.render("listings/index.ejs", { 
        listings: searchResults, 
        selectedCategory: 'search',
        searchQuery: location,
        showCategories: true 
    });
}));

// New Route - Login required to view the form
router.get("/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});

//Show Route
router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
                model: "User"
            }
        })
        .populate("owner");
        
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
}));

// Create Route
router.post("/" ,
    isLoggedIn ,
    upload.single('listing[image]'),
    validateListing, wrapAsync(async (req , res) => {
    const newListing = new Listing(req.body.listing);
    
    if (req.file) {
        newListing.image = { 
            url: req.file.path, 
            filename: req.file.filename 
        };
    } else {
        // Fallback to default image if no file uploaded
        newListing.image = { 
            url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80", 
            filename: "default-listing" 
        };
    }
    
    // Ensure user is authenticated and has an _id
    if (!req.user || !req.user._id) {
        req.flash("error", "You must be logged in to create a listing");
        return res.redirect("/login");
    }
    
    // Set the current user as the owner
    newListing.owner = req.user._id;
    
    try {
        await newListing.save();
        req.flash("success" , "Listing created successfully");
        res.redirect("/listings");
    } catch (err) {
        console.error("Error saving listing:", err);
        req.flash("error", "Failed to create listing");
        res.redirect("/listings/new");
    }
}));

//Edit Route
router.get("/:id/edit" ,
    isLoggedIn ,
    isOwner ,
     wrapAsync(async (req , res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error" , "Listing not found");
        return res.redirect("/listings");
    }
    res.render("listings/edit.ejs" , {listing});
}));

//Update Route
router.put("/:id", 
    isLoggedIn ,
    isOwner ,
    upload.single('listing[image]'),
    validateListing, 
    wrapAsync(async (req , res) => {
    let {id} = req.params;
    let updatedListing = req.body.listing;
    
    // Handle file upload for updates
    if (req.file) {
        updatedListing.image = { 
            url: req.file.path, 
            filename: req.file.filename 
        };
    } else if (req.body.listing.image && req.body.listing.image.url) {
        updatedListing.image = { 
            url: req.body.listing.image.url, 
            filename: "default-listing" 
        };
    }
    
    await Listing.findByIdAndUpdate(id , updatedListing);
    req.flash("success" , "Listing updated successfully");
    res.redirect(`/listings/${id}`);
}));

//Delete Route
router.delete("/:id" , 
    isLoggedIn ,
    isOwner , 
    wrapAsync(async (req , res) => {
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success" , "Listing deleted successfully");
    res.redirect("/listings");
}));

module.exports = router;