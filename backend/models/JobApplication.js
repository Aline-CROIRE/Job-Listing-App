const mongoose = require("mongoose")

/**
 * @swagger
 * components:
 *   schemas:
 *     JobApplication:
 *       type: object
 *       required:
 *         - jobId
 *         - talentId
 *         - coverLetter
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated application ID
 *         jobId:
 *           type: string
 *           description: ID of the job being applied to
 *         talentId:
 *           type: string
 *           description: ID of the talent applying
 *         coverLetter:
 *           type: string
 *           description: Talent's cover letter
 *         expectedSalary:
 *           type: number
 *           description: Talent's expected salary
 *         availableStartDate:
 *           type: string
 *           format: date-time
 *           description: When the talent can start
 *         portfolioUrl:
 *           type: string
 *           description: Link to talent's portfolio
 *         linkedinUrl:
 *           type: string
 *           description: LinkedIn profile URL
 *         githubUrl:
 *           type: string
 *           description: GitHub profile URL
 *         status:
 *           type: string
 *           enum: [applied, screening, interview, offer, hired, rejected]
 *           default: applied
 *         aiMatchScore:
 *           type: number
 *           min: 0
 *           max: 100
 *           description: AI-calculated match score
 *         interviewNotes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *               interviewer:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
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

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: [true, "Job ID is required"],
    },
    talentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Talent ID is required"],
    },
    coverLetter: {
      type: String,
      required: [true, "Cover letter is required"],
      maxlength: [1500, "Cover letter cannot exceed 1500 characters"],
    },
    expectedSalary: {
      type: Number,
      min: [0, "Expected salary cannot be negative"],
    },
    availableStartDate: {
      type: Date,
    },
    portfolioUrl: {
      type: String,
      validate: {
        validator: (v) => !v || /^https?:\/\/.+/.test(v),
        message: "Portfolio URL must be a valid URL",
      },
    },
    linkedinUrl: {
      type: String,
      validate: {
        validator: (v) => !v || /^https?:\/\/(www\.)?linkedin\.com\/.+/.test(v),
        message: "LinkedIn URL must be a valid LinkedIn profile URL",
      },
    },
    githubUrl: {
      type: String,
      validate: {
        validator: (v) => !v || /^https?:\/\/(www\.)?github\.com\/.+/.test(v),
        message: "GitHub URL must be a valid GitHub profile URL",
      },
    },
    status: {
      type: String,
      enum: ["applied", "screening", "interview", "offer", "hired", "rejected"],
      default: "applied",
    },
    aiMatchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    interviewNotes: [
      {
        note: {
          type: String,
          maxlength: [1000, "Interview note cannot exceed 1000 characters"],
        },
        interviewer: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
jobApplicationSchema.index({ jobId: 1, talentId: 1 }, { unique: true })

// Indexes for better query performance
jobApplicationSchema.index({ jobId: 1 })
jobApplicationSchema.index({ talentId: 1 })
jobApplicationSchema.index({ status: 1 })
jobApplicationSchema.index({ aiMatchScore: -1 })

// Populate job and talent info
jobApplicationSchema.pre(/^find/, function (next) {
  this.populate({
    path: "jobId",
    select: "title description skillsRequired salary jobType workType location status",
  }).populate({
    path: "talentId",
    select: "name email profile talentProfile.skills talentProfile.hourlyRate talentProfile.experience",
  })
  next()
})

module.exports = mongoose.model("JobApplication", jobApplicationSchema)
