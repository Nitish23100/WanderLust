const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressErrors.js");
const {listingSchema , reviewSchema} = require("./schema.js");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        // Store the intended route for redirect after login
        if (req.method.toUpperCase() === 'POST' && req.originalUrl === '/listings') {
            // For POST to /listings, redirect to the form page
            req.session.intendedRoute = '/listings/new';
        } else {
            // For all other protected routes, store the original URL
            req.session.intendedRoute = req.originalUrl;
        }
        req.flash("error" , "You must be signed in first!");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

module.exports.isOwner = async (req , res , next) => {
    let {id}= req.params;
    let listing =await Listing.findById(id);
    if(listing.owner && !listing.owner._id.equals(req.user._id)){
        req.flash("error","You are not the owner of this Listing");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        return next(new ExpressError(400, errMsg));
    }
    next();
};

module.exports.validateReview = (req , res , next) => {
    let { error } = reviewSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => {
            if (el.message.includes('rating') && el.message.includes('greater than or equal to 1')) {
                return 'Please select a star rating before submitting your review.';
            }
            return el.message;
        }).join(",");
        req.flash("error", errMsg);
        return res.redirect('back');
    }
    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const Review = require("./models/review");
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    
    if (!review) {
        req.flash("error", "Review not found");
        return res.redirect(`/listings/${id}`);
    }
    
    if (!review.author.equals(req.user._id)) {
        req.flash("error", "You are not authorized to delete this review");
        return res.redirect(`/listings/${id}`);
    }
    next();
};