const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated user ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: Hashed password
 *         role:
 *           type: string
 *           enum: [admin, employer, talent]
 *           description: User role in the system
 *         isEmailVerified:
 *           type: boolean
 *           default: false
 *           description: Email verification status
 *         emailVerificationToken:
 *           type: string
 *           description: Token for email verification
 *         resetPasswordToken:
 *           type: string
 *           description: Token for password reset
 *         resetPasswordExpire:
 *           type: string
 *           format: date-time
 *           description: Password reset token expiration
 *         profile:
 *           type: object
 *           properties:
 *             bio:
 *               type: string
 *             location:
 *               type: string
 *             phone:
 *               type: string
 *             website:
 *               type: string
 *             avatar:
 *               type: string
 *         talentProfile:
 *           type: object
 *           properties:
 *             skills:
 *               type: array
 *               items:
 *                 type: string
 *             experience:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   company:
 *                     type: string
 *                   position:
 *                     type: string
 *                   duration:
 *                     type: string
 *                   description:
 *                     type: string
 *             education:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   institution:
 *                     type: string
 *                   degree:
 *                     type: string
 *                   year:
 *                     type: string
 *             cvUrl:
 *               type: string
 *             hourlyRate:
 *               type: number
 *             availability:
 *               type: string
 *               enum: [available, busy, unavailable]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["admin", "employer", "talent"],
      required: [true, "Role is required"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // General profile information
    profile: {
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
      },
      location: String,
      phone: String,
      website: String,
      avatar: String,
    },

    // Talent-specific profile (only for role: 'talent')
    talentProfile: {
      skills: [
        {
          type: String,
          trim: true,
        },
      ],
      experience: [
        {
          company: String,
          position: String,
          duration: String,
          description: String,
        },
      ],
      education: [
        {
          institution: String,
          degree: String,
          year: String,
        },
      ],
      cvUrl: String,
      hourlyRate: {
        type: Number,
        min: [0, "Hourly rate cannot be negative"],
      },
      availability: {
        type: String,
        enum: ["available", "busy", "unavailable"],
        default: "available",
      },
    },
  },
  {
    timestamps: true,
  },
)

// Index for better query performance
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ "talentProfile.skills": 1 })

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash password if it's been modified
  if (!this.isModified("password")) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const crypto = require("crypto")
  const token = crypto.randomBytes(32).toString("hex")
  this.emailVerificationToken = token
  return token
}

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const crypto = require("crypto")
  const token = crypto.randomBytes(32).toString("hex")
  this.resetPasswordToken = token
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000 // 10 minutes
  return token
}

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject()
  delete user.password
  delete user.emailVerificationToken
  delete user.resetPasswordToken
  delete user.resetPasswordExpire
  return user
}

module.exports = mongoose.model("User", userSchema)
