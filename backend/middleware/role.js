/**
 * Role-based authorization middleware
 * Checks if authenticated user has required role(s)
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (should be set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      })
    }

    // Check if user role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      })
    }

    next()
  }
}

/**
 * Middleware to check if user is an employer
 */
const isEmployer = roleMiddleware("employer", "admin")

/**
 * Middleware to check if user is a talent
 */
const isTalent = roleMiddleware("talent", "admin")

/**
 * Middleware to check if user is an admin
 */
const isAdmin = roleMiddleware("admin")

/**
 * Middleware to check if user is employer or talent (not admin-only)
 */
const isEmployerOrTalent = roleMiddleware("employer", "talent")

module.exports = {
  roleMiddleware,
  isEmployer,
  isTalent,
  isAdmin,
  isEmployerOrTalent,
}
