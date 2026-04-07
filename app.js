if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// Validate required environment variables (throw instead of process.exit for serverless)
const requiredEnvVars = ['ATLASDB_URL', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_KEY', 'CLOUDINARY_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    const msg = `Missing required environment variables: ${missingEnvVars.join(', ')}`;
    console.error(msg);
    throw new Error(msg);
}

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
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const cors = require("cors");

app.engine("ejs", ejsmate);
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressErrors.js");

// Security middleware with deployment-friendly CSP
if (process.env.NODE_ENV === "production") {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://api.cloudinary.com", "https://res.cloudinary.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:", "https:", "http:", "https://res.cloudinary.com", "https://images.unsplash.com"],
                fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'", "https://res.cloudinary.com"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
} else {
    // Development mode - more relaxed CSP
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many authentication attempts, please try again later.",
    skipSuccessfulRequests: true,
});

// MongoDB injection protection
app.use(mongoSanitize());

// CORS configuration for deployment
app.use(cors({
    origin: process.env.NODE_ENV === "production" 
        ? ["https://your-app-name.onrender.com"] // Replace with your actual Render URL
        : ["http://localhost:3000"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Trust proxy for deployment platforms like Render, Heroku, etc.
app.set('trust proxy', 1);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const MONGO_URL = process.env.ATLASDB_URL || "mongodb://127.0.0.1:27017/wanderlust";

const store = MongoStore.create({
    mongoUrl: MONGO_URL,
    touchAfter: 24 * 3600, // lazy session update (24 hours)
    crypto: {
        secret: process.env.SESSION_SECRET || "mysupersecretcode"
    },
    collectionName: 'sessions',
    stringify: false,
    autoRemove: 'native', // Default
    autoRemoveInterval: 10, // In minutes. Default
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
});

// Handle store errors
store.on('error', function (error) {
    console.error('Session store error:', error);
});

store.on('create', function (sessionId) {
    console.log('Session created:', sessionId);
});

store.on('touch', function (sessionId) {
    console.log('Session touched:', sessionId);
});

store.on('destroy', function (sessionId) {
    console.log('Session destroyed:', sessionId);
});

const sessionOptions = {
    secret: process.env.SESSION_SECRET || "mysupersecretcode",
    resave: false,
    saveUninitialized: false,
    store: store,
    name: 'wanderlust.sid', // Custom session name
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: 'lax'
    },
    rolling: true, // Reset expiration on activity
};

// Session middleware with error handling
app.use((req, res, next) => {
    session(sessionOptions)(req, res, (err) => {
        if (err) {
            console.error('Session middleware error:', err);
            return next(err);
        }
        next();
    });
});

app.use(flash());

// Configure Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Local Strategy
passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password'
    },
    User.authenticate()
));

// Serialize user to session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        console.error('Error deserializing user:', err);
        done(err);
    }
});

// Import middleware
const { saveRedirectUrl } = require("./middleware");

// Add saveRedirectUrl middleware
app.use(saveRedirectUrl);

// Middleware to make user available to all templates
app.use((req, res, next) => {
    // Make user available to all templates
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");

    // Make user available to all routes
    res.locals.user = req.user;

    next();
});

// Cached MongoDB connection for serverless (reused across warm invocations)
let cachedConnection = null;

async function connectDB() {
    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }
    try {
        cachedConnection = await mongoose.connect(MONGO_URL);
        console.log("Connected to MongoDB Atlas");
        return cachedConnection;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        cachedConnection = null;
        throw error;
    }
}

// Middleware to ensure DB connection before handling any request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("Failed to connect to database:", err);
        next(err);
    }
});

// Import route files
const userRouter = require("./routes/user");
const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");

// Use routes with rate limiting for auth routes
app.use("/", authLimiter, userRouter);
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);

app.get("/", (req, res) => {
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

    // Don't expose sensitive error details in production
    if (process.env.NODE_ENV === "production" && statusCode === 500) {
        message = "Internal Server Error";
    }

    console.error(err.stack); // Log error for debugging

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

// Only start the server when running locally (not on Vercel)
if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`);
    });
}

// Export the app for Vercel serverless
module.exports = app;