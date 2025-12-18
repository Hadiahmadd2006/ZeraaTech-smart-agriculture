import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile?.emails?.[0]?.value || profile?._json?.email || "";
        if (!email) return done(null, profile);

        const defaultAdminEmail = "ghareeb.hadi1@gmail.com";
        const adminEmail = (process.env.ADMIN_EMAIL || defaultAdminEmail).toLowerCase();
        const normalizedEmail = email.toLowerCase();
        const role = normalizedEmail === adminEmail ? "admin" : "farmer";

        const appUser = await User.findOneAndUpdate(
          { email: normalizedEmail },
          {
            $setOnInsert: {
              email: normalizedEmail,
              status: "Active",
              displayName: profile.displayName || email,
              googleId: profile.id,
            },
            $set: {
              lastActiveAt: new Date(),
              role,
            },
          },
          { upsert: true, new: true }
        );

        profile.appUserId = appUser._id.toString();
        profile.role = appUser.role;
        return done(null, profile);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

export default passport;
