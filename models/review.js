const mongoose = require("mongoose");
const schema = mongoose.Schema;

const reviewSchema = new schema({
    comment: {
        type:String,
        required:true
    },
    rating: {
        type:Number,
        required:true,
        min:1,
        max:5
    },
    createdAt: {
        type:Date,
        default:Date.now()
    },
    author :{
        type:schema.Types.ObjectId,
        ref:"User"
    }
})

const Review = mongoose.model("Review" , reviewSchema);
module.exports = Review;
