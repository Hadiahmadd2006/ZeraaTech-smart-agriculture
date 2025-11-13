import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000/login",
  }),
  (req, res) => {
    // If login is successful, redirect to dashboard
    res.redirect("http://localhost:3000/dashboard");
  }
);

router.get("/logout", (req, res) => {
  req.logout(() => {
    const accepts = req.get("accept") || "";
    const wantsJson = accepts.includes("application/json");
    if (wantsJson || req.xhr) {
      // For fetch/XHR calls, avoid cross-origin redirects (which cause CORS errors)
      return res.status(204).end();
    }
    // For regular browser navigations, redirect back to login page
    res.redirect("http://localhost:3000/login");
  });
});

router.get("/current-user", (req, res) => {
  if (req.user) {
    res.send(req.user);
  } else {
    res.status(401).send({ message: "Not logged in" });
  }
});

export default router;
