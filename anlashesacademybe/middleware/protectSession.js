// middleware/protectSession.js
export const protectSession = (req, res, next) => {
  if (req.session?.admin) {
    req.admin = req.session.admin; // gán admin từ session
    next();
  } else {
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
};
