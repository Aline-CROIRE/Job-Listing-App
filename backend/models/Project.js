const mongoose = require("mongoose")

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - skillsRequired
 *         - postedBy
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated project ID
 *         title:
 *           type: string
 *           description: Project title
 *         description:
 *           type: string
 *           description: Detailed project description
 *         type:
 *           type: string
 *           enum: [short-term, long-term]
 *           description: Project duration type
 *         skillsRequired:
 *           type: array
 *           items:
 *             type: string
 *           description: Required skills for the project
 *         budget:
 *           type: object
 *           properties:
 *             min:
 *               type: number
 *             max:
 *               type: number
 *             currency:
 *               type: string
 *               default: USD
 *         deliverables:
 *           type: array
 *           items:
 *             type: string
 *           description: Expected project deliverables
 *         status:
 *           type: string
 *           enum: [open, in-progress, closed, cancelled]
 *           default: open
 *         postedBy:
 *           type: string
 *           description: Employer ID who posted the project
 *         deadline:
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    type: {
      type: String,
      enum: ["short-term", "long-term"],
      default: "short-term",
    },
    skillsRequired: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    budget: {
      min: {
        type: Number,
        min: [0, "Budget cannot be negative"],
      },
      max: {
        type: Number,
        min: [0, "Budget cannot be negative"],
      },
      currency: {
        type: String,
        default: "USD",
      },
    },
    deliverables: [
      {
        type: String,
        trim: true,
      },
    ],
    status: {
      type: String,
      enum: ["open", "in-progress", "closed", "cancelled"],
      default: "open",
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project must have a poster"],
    },
    deadline: {
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
  },
  {
    timestamps: true,
  },
)

// Indexes for better query performance
projectSchema.index({ postedBy: 1 })
projectSchema.index({ status: 1 })
projectSchema.index({ skillsRequired: 1 })
projectSchema.index({ createdAt: -1 })
projectSchema.index({ title: "text", description: "text" })

// Virtual for applications
projectSchema.virtual("applications", {
  ref: "Application",
  localField: "_id",
  foreignField: "projectId",
})

// Middleware to populate postedBy user info
projectSchema.pre(/^find/, function (next) {
  this.populate({
    path: "postedBy",
    select: "name email profile.avatar",
  })
  next()
})

module.exports = mongoose.model("Project", projectSchema)
