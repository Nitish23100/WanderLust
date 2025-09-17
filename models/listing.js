const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const listingSchema = new Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
    },
    description: {
        type: String,
        required: [true, "Description is required"],
    },
    image: {
        filename: {
            type: String,
            default: "default-listing"
        },
        url: {
            type: String,
            default: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80"
        }
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price must be a positive number"]
    },
    location: {
        type: String,
        required: [true, "Location is required"],
    },
    country: {
        
        type: String,
        required: [true, "Country is required"],
    },
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
});

listingSchema.post("findOneAndDelete" , async function(listing) {
    if(listing){
        await Review.deleteMany({_id:{$in: listing.reviews}});
    }
})

const listing = mongoose.model("listing" , listingSchema);
module.exports = listing;
