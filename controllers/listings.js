const Listing = require("../models/listing");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { listings: allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({
        path: "reviews",
        populate: {
            path: "author",
        }
    });
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
    const newListing = new Listing(req.body.listing);

    // Handle uploaded image from Cloudinary
    if (req.file) {
        newListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    } else if (req.body.listing.image && req.body.listing.image.url) {
        // Fallback to URL if provided
        newListing.image = {
            url: req.body.listing.image.url,
            filename: "default-listing"
        };
    }

    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "Listing created successfully");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl.replace("/upload" , "/upload/h_300,w_250");
    res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let updatedListing = req.body.listing;

    // Handle uploaded image from Cloudinary
    if (req.file) {
        updatedListing.image = {
            url: req.file.path,
            filename: req.file.filename
        };
    } 
    else if (req.body.listing.image && req.body.listing.image.url) {
        // Keep existing image URL if provided
        updatedListing.image = {
            url: req.body.listing.image.url,
            filename: "default-listing"
        };
    }

    await Listing.findByIdAndUpdate(id, updatedListing);
    req.flash("success", "Listing updated successfully");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted successfully");
    res.redirect("/listings");
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};