// config/passport.js
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

require("dotenv").config();

// Allow overriding callback URLs via environment variables so production
// deployments behind proxies (like Render) can explicitly use HTTPS URLs.
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback";
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || "/auth/github/callback";

passport.serializeUser((user, done) => {
  done(null, user.id); 
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).exec();
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ email: profile.emails[0].value });
        if (existingUser) {
          return done(null, existingUser);
        } else {
          // Create a new user
          const newUser = new User({
            email: profile.emails[0].value,
            name: profile.displayName || profile.name.givenName,
            authProvider: "google",
          });
          await newUser.save();
          return done(null, newUser);
        }
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ email: profile.username + "@github.com" });
        if (existingUser) {
          return done(null, existingUser);
        } else {
          const newUser = new User({
            email: profile.username + "@github.com",
            name: profile.displayName || profile.username,
            authProvider: "github",
          });
          await newUser.save();
          return done(null, newUser);
        }
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
