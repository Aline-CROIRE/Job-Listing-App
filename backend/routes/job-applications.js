const express = require("express")
const { body, validationResult } = require("express-validator")
const JobApplication = require("../models/JobApplication")
const Job = require("../models/Job")
const User = require("../models/User")
const authMiddleware = require("../middleware/auth")
const { isTalent, isEmployer } = require("../middleware/role")
const { calculateMatchScore, generateApplicationInsights } = require("../utils/aiHelper")

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Job Applications
 *   description: Job application management
 */

/**
 * @swagger
 * /api/job-applications:
 *   post:
 *     summary: Submit application to a job (talents only)
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobId
 *               - coverLetter
 *             properties:
 *               jobId:
 *                 type: string
 *                 description: ID of the job to apply to
 *               coverLetter:
 *                 type: string
 *                 description: Cover letter explaining why you're a good fit
 *                 example: "I am excited to apply for this position because..."
 *               expectedSalary:
 *                 type: number
 *                 description: Your expected salary
 *                 example: 95000
 *               availableStartDate:
 *                 type: string
 *                 format: date-time
 *                 description: When you can start working
 *                 example: "2024-02-01T00:00:00.000Z"
 *               portfolioUrl:
 *                 type: string
 *                 description: Link to your portfolio
 *                 example: "https://myportfolio.com"
 *               linkedinUrl:
 *                 type: string
 *                 description: Your LinkedIn profile URL
 *                 example: "https://linkedin.com/in/johndoe"
 *               githubUrl:
 *                 type: string
 *                 description: Your GitHub profile URL
 *                 example: "https://github.com/johndoe"
 *     responses:
 *       201:
 *         description: Application submitted successfully
 *       400:
 *         description: Validation error or duplicate application
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not a talent)
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  authMiddleware,
  isTalent,
  [
    body("jobId").isMongoId().withMessage("Invalid job ID"),
    body("coverLetter")
      .trim()
      .isLength({ min: 100, max: 1500 })
      .withMessage("Cover letter must be between 100 and 1500 characters"),
    body("expectedSalary").optional().isNumeric().withMessage("Expected salary must be a number"),
    body("availableStartDate").optional().isISO8601().withMessage("Invalid start date format"),
    body("portfolioUrl").optional().isURL().withMessage("Portfolio URL must be valid"),
    body("linkedinUrl")
      .optional()
      .matches(/^https?:\/\/(www\.)?linkedin\.com\/.+/)
      .withMessage("LinkedIn URL must be a valid LinkedIn profile"),
    body("githubUrl")
      .optional()
      .matches(/^https?:\/\/(www\.)?github\.com\/.+/)
      .withMessage("GitHub URL must be a valid GitHub profile"),
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

      const { jobId, coverLetter, expectedSalary, availableStartDate, portfolioUrl, linkedinUrl, githubUrl } = req.body

      // Check if job exists and is open
      const job = await Job.findById(jobId)
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        })
      }

      if (job.status !== "open") {
        return res.status(400).json({
          success: false,
          message: "This job is no longer accepting applications",
        })
      }

      // Check application deadline
      if (job.applicationDeadline && new Date() > job.applicationDeadline) {
        return res.status(400).json({
          success: false,
          message: "Application deadline has passed",
        })
      }

      // Check if user already applied to this job
      const existingApplication = await JobApplication.findOne({
        jobId,
        talentId: req.user._id,
      })

      if (existingApplication) {
        return res.status(400).json({
          success: false,
          message: "You have already applied to this job",
        })
      }

      // Calculate AI match score
      const talent = await User.findById(req.user._id)
      const aiMatchScore = calculateMatchScore(job.skillsRequired, talent.talentProfile?.skills || [])

      // Create application
      const application = new JobApplication({
        jobId,
        talentId: req.user._id,
        coverLetter,
        expectedSalary,
        availableStartDate,
        portfolioUrl,
        linkedinUrl,
        githubUrl,
        aiMatchScore,
      })

      await application.save()

      // Update job applications count
      await Job.findByIdAndUpdate(jobId, {
        $inc: { applicationsCount: 1 },
      })

      // Populate the application for response
      await application.populate([
        {
          path: "jobId",
          select: "title description skillsRequired salary jobType workType location status",
        },
        {
          path: "talentId",
          select: "name email profile talentProfile.skills talentProfile.hourlyRate",
        },
      ])

      res.status(201).json({
        success: true,
        message: "Job application submitted successfully",
        application,
        aiMatchScore,
      })
    } catch (error) {
      console.error("Submit job application error:", error)
      res.status(500).json({
        success: false,
        message: "Server error while submitting application",
      })
    }
  },
)

/**
 * @swagger
 * /api/job-applications/my:
 *   get:
 *     summary: Get current user's job applications (talents only)
 *     tags: [Job Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [applied, screening, interview, offer, hired, rejected]
 *         description: Filter by application status
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
 *         description: Number of applications per page
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not a talent)
 *       500:
 *         description: Server error
 */
router.get("/my", authMiddleware, isTalent, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query

    const filter = { talentId: req.user._id }
    if (status) filter.status = status

    const applications = await JobApplication.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("jobId", "title description skillsRequired salary jobType workType location status postedBy")
      .populate("talentId", "name email profile")

    const total = await JobApplication.countDocuments(filter)

    res.json({
      success: true,
      applications,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Get my job applications error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching your applications",
    })
  }
})

module.exports = router
