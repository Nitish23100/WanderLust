const express = require("express");
const router = express.Router({ mergeParams: true });
const User = require("../models/user");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const { saveRedirectUrl } = require("../middleware");

router.get("/signup", (req, res) => {
    res.render("users/signup.ejs");
});

router.post("/signup", wrapAsync(async (req, res, next) => {
    try {
        let { email, username, password } = req.body;
        
        // Input validation
        if (!email || !username || !password) {
            req.flash("error", "All fields are required");
            return res.redirect("/signup");
        }
        
        if (password.length < 6) {
            req.flash("error", "Password must be at least 6 characters long");
            return res.redirect("/signup");
        }
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.flash("error", "Please enter a valid email address");
            return res.redirect("/signup");
        }
        
        // Username validation (alphanumeric and underscores only)
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            req.flash("error", "Username must be 3-20 characters long and contain only letters, numbers, and underscores");
            return res.redirect("/signup");
        }
        
        const newUser = new User({ email: email.toLowerCase(), username });
        const registeredUser = await User.register(newUser, password);
        
        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to Wanderlust!");
            const redirectUrl = res.locals.redirectUrl || "/listings";
            delete res.locals.redirectUrl;
            res.redirect(redirectUrl);
        });
    } catch (e) {
        if (e.name === 'UserExistsError') {
            req.flash("error", "Username already exists. Please choose a different username.");
        } else if (e.code === 11000) {
            req.flash("error", "Email already exists. Please use a different email.");
        } else {
            req.flash("error", e.message);
        }
        res.redirect("/signup");
    }
}));

router.get("/login", (req , res)=>{
    res.render("users/login.ejs");
});

router.post("/login", 
    saveRedirectUrl,
    passport.authenticate("local", { 
        failureRedirect: "/login",
        failureFlash: true 
    }),
    wrapAsync(async (req, res) => {
        req.flash("success", "Welcome back!");
        // Get redirect URL from session or default to /listings
        let redirectUrl = req.session.returnTo || res.locals.redirectUrl || "/listings";
        // Clear the stored URL from session
        delete req.session.returnTo;
        // Validate redirect URL to prevent open redirect attacks
        if (!redirectUrl.startsWith('/')) {
            redirectUrl = "/listings";
        }
        res.redirect(redirectUrl);
    })
);

router.get("/logout" , isLoggedIn , (req , res , next) => {
    req.logout(err => {
        if (err) {
            return next(err);
        }
        req.flash("success" , "Goodbye!");
        res.redirect("/listings");
    });
})      

module.exports = router;
