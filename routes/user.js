const express = require("express");
const router = express.Router({ mergeParams: true });
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn } = require("../middleware");
const userController = require("../controllers/users");

router.route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signup));

router.route("/login")
    .get(userController.renderLoginForm)
    .post(passport.authenticate("local", { 
        failureRedirect: "/login",
        failureFlash: true 
    }), userController.login);

router.get("/logout", isLoggedIn, userController.logout);

module.exports = router;
