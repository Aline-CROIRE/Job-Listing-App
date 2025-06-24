const express = require("express")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const authMiddleware = require("../middleware/auth")
const { isAdmin, isTalent, isEmployer } = require("../middleware/role")

const router = express.Router()

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
 *     summary: Update user profile
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
 *                   bio:
 *                     type: string
 *                   location:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   website:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put(
  "/profile",
  authMiddleware,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("profile.bio").optional().isLength({ max: 500 }).withMessage("Bio cannot exceed 500 characters"),
    body("profile.phone").optional().isMobilePhone().withMessage("Please provide a valid phone number"),
    body("profile.website").optional().isURL().withMessage("Please provide a valid website URL"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { name, profile } = req.body

      const updateData = {}
      if (name) updateData.name = name
      if (profile) {
        updateData.profile = { ...req.user.profile, ...profile }
      }

      const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
        runValidators: true,
      })

      res.json({
        success: true,
        message: "Profile updated successfully",
        user,
      })
    } catch (error) {
      console.error("Update profile error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during profile update",
      })
    }
  },
)

/**
 * @swagger
 * /api/users/talent-profile:
 *   put:
 *     summary: Update talent profile (talents only)
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
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               hourlyRate:
 *                 type: number
 *               availability:
 *                 type: string
 *                 enum: [available, busy, unavailable]
 *               experience:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     company:
 *                       type: string
 *                     position:
 *                       type: string
 *                     duration:
 *                       type: string
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Talent profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not a talent)
 *       500:
 *         description: Server error
 */
router.put(
  "/talent-profile",
  authMiddleware,
  isTalent,
  [
    body("skills").optional().isArray().withMessage("Skills must be an array"),
    body("hourlyRate").optional().isNumeric().isFloat({ min: 0 }).withMessage("Hourly rate must be a positive number"),
    body("availability")
      .optional()
      .isIn(["available", "busy", "unavailable"])
      .withMessage("Invalid availability status"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { skills, hourlyRate, availability, experience, education } = req.body

      const updateData = {
        talentProfile: { ...req.user.talentProfile },
      }

      if (skills) updateData.talentProfile.skills = skills
      if (hourlyRate !== undefined) updateData.talentProfile.hourlyRate = hourlyRate
      if (availability) updateData.talentProfile.availability = availability
      if (experience) updateData.talentProfile.experience = experience
      if (education) updateData.talentProfile.education = education

      const user = await User.findByIdAndUpdate(req.user._id, updateData, {
        new: true,
        runValidators: true,
      })

      res.json({
        success: true,
        message: "Talent profile updated successfully",
        user,
      })
    } catch (error) {
      console.error("Update talent profile error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during talent profile update",
      })
    }
  },
)

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, employer, talent]
 *         description: Filter by user role
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not admin)
 *       500:
 *         description: Server error
 */
router.get("/", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query

    const filter = {}
    if (role) filter.role = role

    const users = await User.find(filter)
      .select("-password -emailVerificationToken -resetPasswordToken")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const total = await User.countDocuments(filter)

    res.json({
      success: true,
      users,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    })
  }
})

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -emailVerificationToken -resetPasswordToken")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    })
  }
})

module.exports = router
