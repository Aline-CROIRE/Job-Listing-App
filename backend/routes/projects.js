const express = require("express")
const { body, validationResult } = require("express-validator")
const Project = require("../models/Project")
const Application = require("../models/Application")
const User = require("../models/User")
const authMiddleware = require("../middleware/auth")
const { isEmployer, isTalent, isAdmin } = require("../middleware/role")
const { recommendTalents } = require("../utils/aiHelper")

const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management and job listings
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects with filtering and pagination
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in-progress, closed, cancelled]
 *         description: Filter by project status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [short-term, long-term]
 *         description: Filter by project type
 *       - in: query
 *         name: skills
 *         schema:
 *           type: string
 *         description: Filter by required skills (comma-separated)
 *       - in: query
 *         name: minBudget
 *         schema:
 *           type: number
 *         description: Minimum budget filter
 *       - in: query
 *         name: maxBudget
 *         schema:
 *           type: number
 *         description: Maximum budget filter
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
 *         description: Number of projects per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, deadline, budget, applicationsCount]
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
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const {
      status,
      type,
      skills,
      minBudget,
      maxBudget,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query

    // Build filter object
    const filter = {}

    if (status) filter.status = status
    if (type) filter.type = type

    // Skills filter (comma-separated)
    if (skills) {
      const skillsArray = skills.split(",").map((skill) => skill.trim())
      filter.skillsRequired = { $in: skillsArray }
    }

    // Budget filter
    if (minBudget || maxBudget) {
      filter["budget.min"] = {}
      if (minBudget) filter["budget.min"].$gte = Number(minBudget)
      if (maxBudget) filter["budget.max"] = { $lte: Number(maxBudget) }
    }

    // Search in title and description
    if (search) {
      filter.$text = { $search: search }
    }

    // Build sort object
    const sort = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1

    // Execute query with pagination
    const projects = await Project.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("postedBy", "name email profile.avatar")

    const total = await Project.countDocuments(filter)
    const pages = Math.ceil(total / limit)

    res.json({
      success: true,
      projects,
      pagination: {
        current: Number(page),
        pages,
        total,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
      filters: {
        status,
        type,
        skills,
        minBudget,
        maxBudget,
        search,
      },
    })
  } catch (error) {
    console.error("Get projects error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching projects",
    })
  }
})

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project (employers only)
 *     tags: [Projects]
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
 *               - skillsRequired
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Build a React E-commerce Website"
 *               description:
 *                 type: string
 *                 example: "We need a modern e-commerce website built with React and Node.js"
 *               type:
 *                 type: string
 *                 enum: [short-term, long-term]
 *                 example: "short-term"
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["React", "Node.js", "MongoDB", "JavaScript"]
 *               budget:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                     example: 1000
 *                   max:
 *                     type: number
 *                     example: 3000
 *                   currency:
 *                     type: string
 *                     example: "USD"
 *               deliverables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Responsive website", "Admin dashboard", "Payment integration"]
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-02-15T00:00:00.000Z"
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 example: "high"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["web-development", "e-commerce", "full-stack"]
 *     responses:
 *       201:
 *         description: Project created successfully
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
      .isLength({ min: 20, max: 2000 })
      .withMessage("Description must be between 20 and 2000 characters"),
    body("skillsRequired").isArray({ min: 1 }).withMessage("At least one skill is required"),
    body("skillsRequired.*").trim().isLength({ min: 1 }).withMessage("Skills cannot be empty"),
    body("type").optional().isIn(["short-term", "long-term"]).withMessage("Invalid project type"),
    body("budget.min").optional().isNumeric().withMessage("Budget min must be a number"),
    body("budget.max").optional().isNumeric().withMessage("Budget max must be a number"),
    body("deadline").optional().isISO8601().withMessage("Invalid deadline format"),
    body("priority").optional().isIn(["low", "medium", "high", "urgent"]).withMessage("Invalid priority"),
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

      const { title, description, type, skillsRequired, budget, deliverables, deadline, priority, tags } = req.body

      // Validate budget logic
      if (budget && budget.min && budget.max && budget.min > budget.max) {
        return res.status(400).json({
          success: false,
          message: "Budget minimum cannot be greater than maximum",
        })
      }

      const project = new Project({
        title,
        description,
        type,
        skillsRequired,
        budget,
        deliverables,
        deadline,
        priority,
        tags,
        postedBy: req.user._id,
      })

      await project.save()

      // Populate the postedBy field for response
      await project.populate("postedBy", "name email profile.avatar")

      res.status(201).json({
        success: true,
        message: "Project created successfully",
        project,
      })
    } catch (error) {
      console.error("Create project error:", error)
      res.status(500).json({
        success: false,
        message: "Server error while creating project",
      })
    }
  },
)

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID with recommendations
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: includeRecommendations
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include AI talent recommendations
 *     responses:
 *       200:
 *         description: Project retrieved successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const { includeRecommendations = false } = req.query

    const project = await Project.findById(req.params.id).populate("postedBy", "name email profile.avatar")

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      })
    }

    // Increment view count
    project.viewsCount += 1
    await project.save()

    let recommendations = []
    if (includeRecommendations === "true") {
      // Get talent recommendations using AI
      const talents = await User.find({ role: "talent", isEmailVerified: true })
      recommendations = recommendTalents(project, talents)
    }

    res.json({
      success: true,
      project,
      ...(includeRecommendations === "true" && { recommendations }),
    })
  } catch (error) {
    console.error("Get project error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching project",
    })
  }
})

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project (project owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               skillsRequired:
 *                 type: array
 *                 items:
 *                   type: string
 *               budget:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                   max:
 *                     type: number
 *               status:
 *                 type: string
 *                 enum: [open, in-progress, closed, cancelled]
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not project owner)
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      })
    }

    // Check if user is project owner or admin
    if (project.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only update your own projects.",
      })
    }

    const allowedUpdates = [
      "title",
      "description",
      "skillsRequired",
      "budget",
      "deliverables",
      "status",
      "deadline",
      "priority",
      "tags",
    ]

    const updates = {}
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key]
      }
    })

    // Validate budget if provided
    if (updates.budget && updates.budget.min && updates.budget.max && updates.budget.min > updates.budget.max) {
      return res.status(400).json({
        success: false,
        message: "Budget minimum cannot be greater than maximum",
      })
    }

    const updatedProject = await Project.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("postedBy", "name email profile.avatar")

    res.json({
      success: true,
      message: "Project updated successfully",
      project: updatedProject,
    })
  } catch (error) {
    console.error("Update project error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while updating project",
    })
  }
})

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete project (project owner or admin only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      })
    }

    // Check if user is project owner or admin
    if (project.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own projects.",
      })
    }

    // Delete all applications for this project
    await Application.deleteMany({ projectId: req.params.id })

    // Delete the project
    await Project.findByIdAndDelete(req.params.id)

    res.json({
      success: true,
      message: "Project and all related applications deleted successfully",
    })
  } catch (error) {
    console.error("Delete project error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while deleting project",
    })
  }
})

/**
 * @swagger
 * /api/projects/my/projects:
 *   get:
 *     summary: Get current user's projects (employers only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in-progress, closed, cancelled]
 *         description: Filter by project status
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
 *         description: Number of projects per page
 *     responses:
 *       200:
 *         description: User's projects retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not an employer)
 *       500:
 *         description: Server error
 */
router.get("/my/projects", authMiddleware, isEmployer, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query

    const filter = { postedBy: req.user._id }
    if (status) filter.status = status

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("postedBy", "name email profile.avatar")

    const total = await Project.countDocuments(filter)

    res.json({
      success: true,
      projects,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / limit),
        total,
      },
    })
  } catch (error) {
    console.error("Get my projects error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching your projects",
    })
  }
})

/**
 * @swagger
 * /api/projects/{id}/applications:
 *   get:
 *     summary: Get applications for a project (project owner only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [applied, reviewed, shortlisted, rejected, accepted]
 *         description: Filter by application status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, aiMatchScore]
 *           default: aiMatchScore
 *         description: Sort applications by
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not project owner)
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get("/:id/applications", authMiddleware, async (req, res) => {
  try {
    const { status, sortBy = "aiMatchScore" } = req.query

    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      })
    }

    // Check if user is project owner or admin
    if (project.postedBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view applications for your own projects.",
      })
    }

    const filter = { projectId: req.params.id }
    if (status) filter.status = status

    const sort = {}
    if (sortBy === "aiMatchScore") {
      sort.aiMatchScore = -1 // Highest match score first
    } else {
      sort[sortBy] = -1
    }

    const applications = await Application.find(filter)
      .sort(sort)
      .populate(
        "talentId",
        "name email profile talentProfile.skills talentProfile.hourlyRate talentProfile.availability",
      )
      .populate("projectId", "title skillsRequired budget")

    res.json({
      success: true,
      applications,
      project: {
        id: project._id,
        title: project.title,
        status: project.status,
      },
    })
  } catch (error) {
    console.error("Get project applications error:", error)
    res.status(500).json({
      success: false,
      message: "Server error while fetching applications",
    })
  }
})

module.exports = router
