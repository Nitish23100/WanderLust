require('dotenv').config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing");
const User = require("./models/user");
const initData = require("./init/data.js");
const ejs = require("ejs");
const path = require("path");
const methodOverride = require("method-override");
const ejsmate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
app.engine("ejs" , ejsmate);
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressErrors.js");

app.set("view engine" , "ejs");
app.set("views" , path.join(__dirname , "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.user = req.user;
    next();
});

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}
connectDB();

// Import route files
const userRouter = require("./routes/user");
const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");

// Use routes
app.use("/", userRouter);
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);

app.get("/" , (req , res) => {
    res.redirect("/listings");
});

// app.get("/testListing" , async (req , res) => {
//     let sampleListing = new listing({
//         title: "My New Villa",
//         description: "by the beach.",
//         price: 1200,
//         location: "123 Main St",
//         country: "India",
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("Successful testing");
// });

// Error handling middleware
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong!" } = err;
    res.status(statusCode).render("error.ejs", { 
        statusCode: statusCode,
        message: message
    });
});

// 404 handler - for unmatched routes
app.get("*", (req, res) => {
    res.status(404).render("error.ejs", {
        statusCode: 404,
        message: "Page Not Found!"
    });
});

app.listen(3000 , () => {
    console.log("Server is listening to port 3000");
});