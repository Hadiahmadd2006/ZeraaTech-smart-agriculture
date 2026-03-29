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
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile?.emails?.[0]?.value || profile?._json?.email || "";
        if (!email) return done(null, false);

        const defaultAdminEmail = "ghareeb.hadi1@gmail.com";
        const adminEmail = (process.env.ADMIN_EMAIL || defaultAdminEmail).toLowerCase();
        const normalizedEmail = email.toLowerCase();
        const role = normalizedEmail === adminEmail ? "admin" : "farmer";

        const photoUrl = profile.photos?.[0]?.value || null;

        const appUser = await User.findOneAndUpdate(
          { email: normalizedEmail },
          {
            $setOnInsert: {
              email: normalizedEmail,
              status: "Active",
              googleId: profile.id,
            },
            $set: {
              lastActiveAt: new Date(),
              role,
              displayName: profile.displayName || email,
              photo: photoUrl,
            },
          },
          { upsert: true, new: true }
        );

        return done(null, {
          appUserId: appUser._id.toString(),
          email: appUser.email,
        });
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user?.appUserId || null);
});

passport.deserializeUser(async (appUserId, done) => {
  try {
    if (!appUserId) return done(null, false);
    const appUser = await User.findById(appUserId);
    return done(null, appUser || false);
  } catch (err) {
    return done(err);
  }
});

export default passport;
