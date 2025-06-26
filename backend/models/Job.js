const mongoose = require("mongoose")

/**
 * @swagger
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - skillsRequired
 *         - postedBy
 *         - jobType
 *         - workType
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated job ID
 *         title:
 *           type: string
 *           description: Job title
 *         description:
 *           type: string
 *           description: Detailed job description
 *         jobType:
 *           type: string
 *           enum: [full-time, part-time, contract, internship, temporary]
 *           description: Type of employment
 *         workType:
 *           type: string
 *           enum: [remote, on-site, hybrid]
 *           description: Work arrangement
 *         skillsRequired:
 *           type: array
 *           items:
 *             type: string
 *           description: Required skills for the job
 *         salary:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             currency:
 *               type: string
 *               default: USD
 *             period:
 *               type: string
 *               enum: [hourly, monthly, yearly]
 *               default: yearly
 *         location:
 *           type: object
 *           properties:
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             address:
 *               type: string
 *         requirements:
 *           type: array
 *           items:
 *             type: string
 *           description: Job requirements and qualifications
 *         responsibilities:
 *           type: array
 *           items:
 *             type: string
 *           description: Job responsibilities
 *         benefits:
 *           type: array
 *           items:
 *             type: string
 *           description: Job benefits and perks
 *         experienceLevel:
 *           type: string
 *           enum: [entry, junior, mid, senior, lead, executive]
 *           description: Required experience level
 *         status:
 *           type: string
 *           enum: [open, paused, closed, filled]
 *           default: open
 *         postedBy:
 *           type: string
 *           description: Employer ID who posted the job
 *         applicationDeadline:
 *           type: string
 *           format: date-time
 *         startDate:
 *           type: string
 *           format: date-time
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         applicationsCount:
 *           type: number
 *           default: 0
 *         viewsCount:
 *           type: number
 *           default: 0
 *         company:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             size:
 *               type: string
 *               enum: [startup, small, medium, large, enterprise]
 *             industry:
 *               type: string
 *             website:
 *               type: string
 *             logo:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "temporary"],
      required: [true, "Job type is required"],
    },
    workType: {
      type: String,
      enum: ["remote", "on-site", "hybrid"],
      required: [true, "Work type is required"],
    },
    skillsRequired: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    salary: {
      min: {
        type: Number,
        min: [0, "Salary cannot be negative"],
      },
      max: {
        type: Number,
        min: [0, "Salary cannot be negative"],
      },
      currency: {
        type: String,
        default: "USD",
      },
      period: {
        type: String,
        enum: ["hourly", "monthly", "yearly"],
        default: "yearly",
      },
    },
    location: {
      city: String,
      state: String,
      country: String,
      address: String,
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    responsibilities: [
      {
        type: String,
        trim: true,
      },
    ],
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    experienceLevel: {
      type: String,
      enum: ["entry", "junior", "mid", "senior", "lead", "executive"],
      default: "mid",
    },
    status: {
      type: String,
      enum: ["open", "paused", "closed", "filled"],
      default: "open",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Job must have a poster"],
    },
    applicationDeadline: {
      type: Date,
    },
    startDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    applicationsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    company: {
      name: String,
      size: {
        type: String,
        enum: ["startup", "small", "medium", "large", "enterprise"],
      },
      industry: String,
      website: String,
      logo: String,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
jobSchema.index({ postedBy: 1 })
jobSchema.index({ status: 1 })
jobSchema.index({ jobType: 1 })
jobSchema.index({ workType: 1 })
jobSchema.index({ skillsRequired: 1 })
jobSchema.index({ experienceLevel: 1 })
jobSchema.index({ createdAt: -1 })
jobSchema.index({ "location.city": 1 })
jobSchema.index({ "location.country": 1 })
jobSchema.index({ title: "text", description: "text" })

// Virtual for applications
jobSchema.virtual("applications", {
  ref: "JobApplication",
  localField: "_id",
  foreignField: "jobId",
})

// Middleware to populate postedBy user info
jobSchema.pre(/^find/, function (next) {
  this.populate({
    path: "postedBy",
    select: "name email profile.avatar",
  })
  next()
})

module.exports = mongoose.model("Job", jobSchema)
