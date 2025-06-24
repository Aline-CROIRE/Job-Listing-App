const mongoose = require("mongoose")

/**
 * @swagger
 * components:
 *   schemas:
 *     Application:
 *       type: object
 *       required:
 *         - projectId
 *         - talentId
 *         - coverLetter
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated application ID
 *         projectId:
 *           type: string
 *           description: ID of the project being applied to
 *         talentId:
 *           type: string
 *           description: ID of the talent applying
 *         coverLetter:
 *           type: string
 *           description: Talent's cover letter
 *         proposedRate:
 *           type: number
 *           description: Talent's proposed hourly/project rate
 *         estimatedDuration:
 *           type: string
 *           description: Estimated time to complete
 *         confidenceLevel:
 *           type: string
 *           enum: [weak, medium, strong]
 *           description: Talent's confidence in their fit
 *         status:
 *           type: string
 *           enum: [applied, reviewed, shortlisted, rejected, accepted]
 *           default: applied
 *         aiMatchScore:
 *           type: number
 *           min: 0
 *           max: 100
 *           description: AI-calculated match score
 *         employerComments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const applicationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
    },
    talentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Talent ID is required"],
    },
    coverLetter: {
      type: String,
      required: [true, "Cover letter is required"],
      maxlength: [1000, "Cover letter cannot exceed 1000 characters"],
    },
    proposedRate: {
      type: Number,
      min: [0, "Proposed rate cannot be negative"],
    },
    estimatedDuration: {
      type: String,
      trim: true,
    },
    confidenceLevel: {
      type: String,
      enum: ["weak", "medium", "strong"],
      required: [true, "Confidence level is required"],
    },
    status: {
      type: String,
      enum: ["applied", "reviewed", "shortlisted", "rejected", "accepted"],
      default: "applied",
    },
    aiMatchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    employerComments: [
      {
        comment: {
          type: String,
          maxlength: [500, "Comment cannot exceed 500 characters"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Compound index to prevent duplicate applications
applicationSchema.index({ projectId: 1, talentId: 1 }, { unique: true })

// Indexes for better query performance
applicationSchema.index({ projectId: 1 })
applicationSchema.index({ talentId: 1 })
applicationSchema.index({ status: 1 })
applicationSchema.index({ aiMatchScore: -1 })

// Populate project and talent info
applicationSchema.pre(/^find/, function (next) {
  this.populate({
    path: "projectId",
    select: "title description skillsRequired budget status",
  }).populate({
    path: "talentId",
    select: "name email profile talentProfile.skills talentProfile.hourlyRate",
  })
  next()
})

module.exports = mongoose.model("Application", applicationSchema)
