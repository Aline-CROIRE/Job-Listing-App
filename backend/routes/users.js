// routes/users.js

const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { isAdmin, isTalent, isEmployer } = require("../middleware/role");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user's general and talent profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               profile:
 *                 type: object
 *                 properties:
 *                   bio: { type: string }
 *                   location: { type: string }
 *                   phone: { type: string }
 *                   website: { type: string }
 *               talentProfile:
 *                 type: object
 *                 properties:
 *                   skills:
 *                     type: array
 *                     items: { type: string }
 *                   availability:
 *                     type: string
 *                     enum: [available, busy, unavailable]
 *                   hourlyRate:
 *                      type: number
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.put(
  "/profile", // Merged into a single, cleaner endpoint
  authMiddleware,
  [
    // Validation rules
    body("name").optional().trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    body("profile.bio").optional().isLength({ max: 500 }).withMessage("Bio cannot exceed 500 characters"),
    body("profile.phone").optional().isMobilePhone().withMessage("Please provide a valid phone number"),
    body("profile.website").optional().isURL().withMessage("Please provide a valid website URL"),
    body("talentProfile.skills").optional().isArray().withMessage("Skills must be an array"),
    body("talentProfile.hourlyRate").optional().isNumeric().isFloat({ min: 0 }).withMessage("Hourly rate must be a positive number"),
    body("talentProfile.availability").optional().isIn(["available", "busy", "unavailable"]).withMessage("Invalid availability status"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Validation failed", errors: errors.array() });
    }

    try {
      const { name, profile, talentProfile } = req.body;

      // [FIX] Use dot notation for updating nested fields.
      // This is the most efficient and safest way.
      const updateData = {};

      if (name) updateData.name = name;

      if (profile) {
        Object.keys(profile).forEach(key => {
          // Only update fields that are actually sent in the request
          updateData[`profile.${key}`] = profile[key];
        });
      }

      if (talentProfile && req.user.role === 'talent') {
        Object.keys(talentProfile).forEach(key => {
          updateData[`talentProfile.${key}`] = talentProfile[key];
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updateData }, // Use the $set operator
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({ success: true, message: "Profile updated successfully", user });

    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ success: false, message: "Server error during profile update" });
    }
  }
);


// We no longer need a separate `/talent-profile` route, as the logic is now
// cleanly merged into the main `/profile` route, making the API simpler.
// You can now delete the old `/talent-profile` PUT route handler.


// --- All your other GET routes are fine and do not need changes ---

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     // ... (swagger comments are fine)
 */
router.get("/", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    const users = await User.find(filter)
      .select("-password -emailVerificationToken -resetPasswordToken")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);
    res.json({
      success: true,
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     // ... (swagger comments are fine)
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -emailVerificationToken -resetPasswordToken");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
});

module.exports = router;