const express = require("express")
const { body, validationResult } = require("express-validator")
const Job = require("../models/Job")
const JobApplication = require("../models/JobApplication")
const User = require("../models/User")
const authMiddleware = require("../middleware/auth")
const { isEmployer, isTalent, isAdmin } = require("../middleware/role")
const { recommendTalents } = require("../utils/aiHelper")

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job posting and management
 */

/**
 * @swagger
 * /api/jobs:
 *   get:
 *     summary: Get all jobs with filtering and pagination
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, paused, closed, filled]
 *         description: Filter by job status
 *       - in: query
 *         name: jobType
 *         schema:
 *           type: string
 *           enum: [full-time, part-time, contract, internship, temporary]
 *         description: Filter by job type
 *       - in: query
 *         name: workType
 *         schema:
 *           type: string
 *           enum: [remote, on-site, hybrid]
 *         description: Filter by work type
 *       - in: query
 *         name: experienceLevel
 *         schema:
 *           type: string
 *           enum: [entry, junior, mid, senior, lead, executive]
 *         description: Filter by experience level
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Filter by required skills (comma-separated)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by city or country
 *       - in: query
 *         name: minSalary
 *         schema:
 *           type: number
 *         description: Minimum salary filter
 *       - in: query
 *         name: maxSalary
 *         schema:
 *           type: number
 *         description: Maximum salary filter
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and description
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
 *         description: Number of jobs per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, applicationDeadline, salary, applicationsCount]
 *           default: createdAt
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Jobs retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const {
      status,
      jobType,
      workType,
      experienceLevel,
      skills,
      location,
      minSalary,
      maxSalary,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    // Build filter object
    const filter = {}

    if (status) filter.status = status
    if (jobType) filter.jobType = jobType
    if (workType) filter.workType = workType
    if (experienceLevel) filter.experienceLevel = experienceLevel

    // Skills filter (comma-separated)
    if (skills) {
      const skillsArray = skills.split(",").map((skill) => skill.trim())
      filter.skillsRequired = { $in: skillsArray }
    }

    // Location filter (search in city or country)
    if (location) {
      filter.$or = [
        { "location.city": { $regex: location, $options: "i" } },
        { "location.country": { $regex: location, $options: "i" } },
      ]
    }

    // Salary filter
    if (minSalary || maxSalary) {
      filter["salary.min"] = {}
      if (minSalary) filter["salary.min"].$gte = Number(minSalary)
      if (maxSalary) filter["salary.max"] = { $lte: Number(maxSalary) }
    }

    // Search in title and description
    if (search) {
      filter.$text = { $search: search }
    }

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    // Execute query with pagination
    const jobs = await Job.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("postedBy", "name email profile.avatar")

    const total = await Job.countDocuments(filter)
    const pages = Math.ceil(total / limit)

    res.json({
      success: true,
      jobs,
      pagination: {
        current: Number(page),
        pages,
        total,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
      filters: {
        status,
        jobType,
        workType,
        experienceLevel,
        skills,
        location,
        minSalary,
        maxSalary,
        search,
      },
    })
  } catch (error) {
    console.error("Get jobs error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching jobs",
    })
  }
})

/**
 * @swagger
 * /api/jobs:
 *   post:
 *     summary: Create a new job posting (employers only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - jobType
 *               - workType
 *               - skillsRequired
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Senior React Developer"
 *               description:
 *                 type: string
 *                 example: "We are looking for an experienced React developer to join our team..."
 *               jobType:
 *                 type: string
 *                 enum: [full-time, part-time, contract, internship, temporary]
 *                 example: "full-time"
 *               workType:
 *                 type: string
 *                 enum: [remote, on-site, hybrid]
 *                 example: "remote"
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["React", "JavaScript", "Node.js", "TypeScript"]
 *               salary:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                     example: 80000
 *                   max:
 *                     type: number
 *                     example: 120000
 *                   currency:
 *                     type: string
 *                     example: "USD"
 *                   period:
 *                     type: string
 *                     enum: [hourly, monthly, yearly]
 *                     example: "yearly"
 *               location:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                     example: "San Francisco"
 *                   state:
 *                     type: string
 *                     example: "CA"
 *                   country:
 *                     type: string
 *                     example: "USA"
 *               requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["5+ years React experience", "Bachelor's degree in CS"]
 *               responsibilities:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Develop user interfaces", "Collaborate with design team"]
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Health insurance", "401k matching", "Remote work"]
 *               experienceLevel:
 *                 type: string
 *                 enum: [entry, junior, mid, senior, lead, executive]
 *                 example: "senior"
 *               applicationDeadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-03-15T00:00:00.000Z"
 *               company:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "TechCorp Inc."
 *                   size:
 *                     type: string
 *                     enum: [startup, small, medium, large, enterprise]
 *                     example: "medium"
 *                   industry:
 *                     type: string
 *                     example: "Technology"
 *     responses:
 *       201:
 *         description: Job created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not an employer)
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  authMiddleware,
  isEmployer,
  [
    body("title").trim().isLength({ min: 5, max: 200 }).withMessage("Title must be between 5 and 200 characters"),
    body("description")
      .trim()
      .isLength({ min: 50, max: 3000 })
      .withMessage("Description must be between 50 and 3000 characters"),
    body("jobType")
      .isIn(["full-time", "part-time", "contract", "internship", "temporary"])
      .withMessage("Invalid job type"),
    body("workType").isIn(["remote", "on-site", "hybrid"]).withMessage("Invalid work type"),
    body("skillsRequired").isArray({ min: 1 }).withMessage("At least one skill is required"),
    body("skillsRequired.*").trim().isLength({ min: 1 }).withMessage("Skills cannot be empty"),
    body("experienceLevel")
      .optional()
      .isIn(["entry", "junior", "mid", "senior", "lead", "executive"])
      .withMessage("Invalid experience level"),
    body("salary.min").optional().isNumeric().withMessage("Salary min must be a number"),
    body("salary.max").optional().isNumeric().withMessage("Salary max must be a number"),
    body("applicationDeadline").optional().isISO8601().withMessage("Invalid deadline format"),
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

      const {
        title,
        description,
        jobType,
        workType,
        skillsRequired,
        salary,
        location,
        requirements,
        responsibilities,
        benefits,
        experienceLevel,
        applicationDeadline,
        startDate,
        priority,
        tags,
        company,
      } = req.body

      // Validate salary logic
      if (salary && salary.min && salary.max && salary.min > salary.max) {
        return res.status(400).json({
          success: false,
          message: "Salary minimum cannot be greater than maximum",
        })
      }

      const job = new Job({
        title,
        description,
        jobType,
        workType,
        skillsRequired,
        salary,
        location,
        requirements,
        responsibilities,
        benefits,
        experienceLevel,
        applicationDeadline,
        startDate,
        priority,
        tags,
        company,
        postedBy: req.user._id,
      })

      await job.save()

      // Populate the postedBy field for response
      await job.populate("postedBy", "name email profile.avatar")

      res.status(201).json({
        success: true,
        message: "Job posted successfully",
        job,
      })
    } catch (error) {
      console.error("Create job error:", error)
      res.status(500).json({
        success: false,
        message: "Server error while creating job",
      })
    }
  },
)

/**
 * @swagger
 * /api/jobs/{id}:
 *   get:
 *     summary: Get job by ID with recommendations
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *       - in: query
 *         name: includeRecommendations
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include AI talent recommendations
 *     responses:
 *       200:
 *         description: Job retrieved successfully
 *       404:
 *         description: Job not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const { includeRecommendations = false } = req.query

    const job = await Job.findById(req.params.id).populate("postedBy", "name email profile.avatar")

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      })
    }

    // Increment view count
    job.viewsCount += 1
    await job.save()

    let recommendations = []
    if (includeRecommendations === "true") {
      // Get talent recommendations using AI
      const talents = await User.find({ role: "talent", isEmailVerified: true })
      recommendations = recommendTalents(job, talents)
    }

    res.json({
      success: true,
      job,
      ...(includeRecommendations === "true" && { recommendations }),
    })
  } catch (error) {
    console.error("Get job error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching job",
    })
  }
})

/**
 * @swagger
 * /api/jobs/my/jobs:
 *   get:
 *     summary: Get current user's job postings (employers only)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, paused, closed, filled]
 *         description: Filter by job status
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
 *         description: Number of jobs per page
 *     responses:
 *       200:
 *         description: User's jobs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not an employer)
 *       500:
 *         description: Server error
 */
router.get("/my/jobs", authMiddleware, isEmployer, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query

    const filter = { postedBy: req.user._id }
    if (status) filter.status = status

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("postedBy", "name email profile.avatar")

    const total = await Job.countDocuments(filter)

    res.json({
      success: true,
      jobs,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Get my jobs error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching your jobs",
    })
  }
})

module.exports = router
