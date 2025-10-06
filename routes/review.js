const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { reviewSchema } = require("../schema.js");
const Review = require("../models/review");
const ExpressError = require("../utils/ExpressErrors.js");
const Listing = require("../models/listing");
const {validateReview, isLoggedIn, isReviewAuthor} =  require("../middleware");

// Review Route
router.post("/" , isLoggedIn, validateReview , wrapAsync(async (req , res)=>{
    let listing = await Listing.findById(req.params.id);
    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }
    let review = new Review(req.body.review);
    review.author = req.user._id;
    await review.save();
    await Listing.findByIdAndUpdate(req.params.id, {
        $push: { reviews: review._id }
    });
    req.flash("success", "Review added successfully!");
    res.redirect(`/listings/${listing._id}`);
}));

router.delete("/:reviewId" , isLoggedIn, isReviewAuthor, wrapAsync(async (req , res) => {
    let {id, reviewId} = req.params;
    await Listing.findByIdAndUpdate(id , {$pull: {reviews: reviewId}});
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Review deleted successfully!");
    res.redirect(`/listings/${id}`);
}));

module.exports = router;
