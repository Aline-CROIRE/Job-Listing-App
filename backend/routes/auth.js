const express = require("express")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const authMiddleware = require("../middleware/auth")
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/email")

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and account management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [employer, talent]
 *                 example: talent
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 *       500:
 *         description: Server error
 */
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Name must be between 2 and 100 characters"),
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body("role").isIn(["employer", "talent"]).withMessage("Role must be either employer or talent"),
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

      const { name, email, password, role } = req.body

      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        })
      }

      const user = new User({
        name,
        email,
        password,
        role,
      })

      const verificationToken = user.generateEmailVerificationToken()
      await user.save()

      try {
        await sendVerificationEmail(user.email, verificationToken)
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError)
      }

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      })

      res.status(201).json({
        success: true,
        message: "User registered successfully. Please check your email for verification.",
        token,
        user,
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during registration",
      })
    }
  },
)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
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

      const { email, password } = req.body

      const user = await User.findOne({ email }).select("+password")

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password",
        })
      }

      const isPasswordValid = await user.comparePassword(password)

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password",
        })
      }

      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      })

      user.password = undefined

      res.json({
        success: true,
        message: "Login successful",
        token,
        user,
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during login",
      })
    }
  },
)

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      })
    }

    const user = await User.findOne({ emailVerificationToken: token })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      })
    }

    // Mark email as verified
    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    await user.save()

    // Send welcome email
    try {
      const { sendWelcomeEmail } = require("../utils/email")
      await sendWelcomeEmail(user.email, user.name, user.role)
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Don't fail verification if welcome email fails
    }

    res.json({
      success: true,
      message: "Email verified successfully! Welcome to TalentLink AI.",
    })
  } catch (error) {
    console.error("Email verification error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during email verification",
    })
  }
})

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    })
  }
})

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email")],
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

      const { email } = req.body

      const user = await User.findOne({ email })
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found with this email",
        })
      }

      const resetToken = user.generatePasswordResetToken()
      await user.save()

      try {
        await sendPasswordResetEmail(user.email, resetToken)

        res.json({
          success: true,
          message: "Password reset email sent",
        })
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError)
        res.status(500).json({
          success: false,
          message: "Failed to send password reset email",
        })
      }
    } catch (error) {
      console.error("Forgot password error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during password reset request",
      })
    }
  },
)

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
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

      const { token, password } = req.body

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() },
      })

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        })
      }

      user.password = password
      user.resetPasswordToken = undefined
      user.resetPasswordExpire = undefined
      await user.save()

      res.json({
        success: true,
        message: "Password reset successful",
      })
    } catch (error) {
      console.error("Reset password error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during password reset",
      })
    }
  },
)

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change password (authenticated user)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put(
  "/change-password",
  authMiddleware,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters long"),
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

      const { currentPassword, newPassword } = req.body

      const user = await User.findById(req.user._id).select("+password")

      const isCurrentPasswordValid = await user.comparePassword(currentPassword)
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        })
      }

      user.password = newPassword
      await user.save()

      res.json({
        success: true,
        message: "Password changed successfully",
      })
    } catch (error) {
      console.error("Change password error:", error)
      res.status(500).json({
        success: false,
        message: "Server error during password change",
      })
    }
  },
)

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend email verification
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email sent
 *       400:
 *         description: Email already verified
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/resend-verification", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      })
    }

    const verificationToken = user.generateEmailVerificationToken()
    await user.save()

    try {
      await sendVerificationEmail(user.email, verificationToken)

      res.json({
        success: true,
        message: "Verification email sent",
      })
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)
      res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      })
    }
  } catch (error) {
    console.error("Resend verification error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during resend verification",
    })
  }
})

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (client-side token removal)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    // Since we're using stateless JWT, logout is handled client-side
    // In a production app, you might want to implement token blacklisting
    res.json({
      success: true,
      message: "Logout successful. Please remove the token from client storage.",
    })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    })
  }
})

module.exports = router
