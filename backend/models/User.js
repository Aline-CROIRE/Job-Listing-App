const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto"); // Moved to top for consistency

/**
 * @swagger
 * components:
 *   schemas:
 *     Experience:
 *       type: object
 *       properties:
 *         company:
 *           type: string
 *         position:
 *           type: string
 *         duration:
 *           type: string
 *         description:
 *           type: array
 *           items:
 *             type: string
 *           description: "List of responsibilities or achievements."
 *     Education:
 *       type: object
 *       properties:
 *          institution:
 *            type: string
 *          degree:
 *            type: string
 *          year:
 *            type: string
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
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, employer, talent]
 *         isEmailVerified:
 *           type: boolean
 *         profile:
 *           type: object
 *           properties:
 *             bio: { type: string }
 *             location: { type: string }
 *             phone: { type: string }
 *             website: { type: string }
 *             profile: { type: string } # Corrected from 'avatar' to match frontend state
 *         talentProfile:
 *           type: object
 *           properties:
 *             skills:
 *               type: array
 *               items: { type: string }
 *             experience:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Experience' # Reference the Experience schema
 *             education:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Education' # Reference the Education schema
 *             cvUrl:
 *               type: string
 *             hourlyRate:
 *               type: number
 *             availability:
 *               type: string
 *               enum: [available, busy, unavailable]
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
      select: false,
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

    profile: {
      bio: {
        type: String,
        maxlength: [500, "Bio cannot exceed 500 characters"],
      },
      location: String,
      phone: String,
      website: String,
      // [FIX 1] The frontend code uses `profile.profile` for the image URL.
      // Renaming 'avatar' to 'profile' makes the model consistent with the client.
      profile: String,
    },

    talentProfile: {
      skills: [{
        type: String,
        trim: true,
      }],
      experience: [{
        company: String,
        position: String,
        duration: String,
        // [FIX 2 - THE CRITICAL CHANGE]
        // Changed `description` from a single String to an array of Strings `[String]`.
        // This now matches the data structure produced by your AI parser.
        description: [String],
      }],
      education: [{
        institution: String,
        degree: String,
        // [FIX 3 - AI & SCHEMA CONSISTENCY]
        // AI will likely parse duration (e.g., "2018-2022") better than a single year.
        // Changed 'year' to 'duration' for better parsing results.
        duration: String,
      }],
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
  }
);

// --- NO CHANGES BELOW THIS LINE ---

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ "talentProfile.skills": 1 });

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate email verification token
userSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = token;
  return token;
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = token;
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};

module.exports = mongoose.model("User", userSchema);