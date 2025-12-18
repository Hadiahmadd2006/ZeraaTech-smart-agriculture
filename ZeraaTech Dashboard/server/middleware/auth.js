import User from "../models/User.js";

const DEFAULT_ADMIN_EMAIL = "ghareeb.hadi1@gmail.com";

export async function attachAppUser(req, _res, next) {
  try {
    if (req.appUser) return next();

    if (req.user) {
      const email =
        req.user?.email ||
        req.user?.emails?.[0]?.value ||
        req.user?._json?.email ||
        "";

      if (email) {
        const normalizedEmail = email.toLowerCase();
        const adminEmail = (process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase();
        const role = normalizedEmail === adminEmail ? "admin" : "farmer";

        const user = await User.findOneAndUpdate(
          { email: normalizedEmail },
          {
            $setOnInsert: {
              email: normalizedEmail,
              status: "Active",
              displayName: req.user.displayName || normalizedEmail,
              googleId: req.user.id,
            },
            $set: {
              lastActiveAt: new Date(),
              role,
            },
          },
          { upsert: true, new: true }
        );

        req.appUser = user;
      }

      return next();
    }

    if (req.session?.userId) {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.appUser = user;
      }
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

export function requireAuth(req, res, next) {
  const hasAuth = Boolean(req.user) || Boolean(req.session?.userId);
  if (!hasAuth) return res.status(401).json({ message: "Not logged in" });
  return next();
}

export function requireAdmin(req, res, next) {
  if (!req.appUser) return res.status(401).json({ message: "Not logged in" });
  if (req.appUser.role !== "admin") return res.status(403).json({ message: "Admin only" });
  return next();
}
