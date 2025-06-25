const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { v2: cloudinary } = require("cloudinary")
const authMiddleware = require("../middleware/auth")
const { isTalent } = require("../middleware/role")
const { parseCVContent } = require("../utils/aiHelper")
const User = require("../models/User")

const router = express.Router()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/"
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, `${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

const fileFilter = (req, file, cb) => {
  // Allow PDF, DOC, DOCX files for CV
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]

  if (file.fieldname === "cv" && allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else if (file.fieldname === "avatar" && file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Invalid file type"), false)
  }
}

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
})

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: File upload management
 */

/**
 * @swagger
 * /api/upload/cv:
 *   post:
 *     summary: Upload CV and auto-parse profile (talents only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               cv:
 *                 type: string
 *                 format: binary
 *                 description: CV file (PDF, DOC, DOCX)
 *               autoFill:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to auto-fill profile from CV
 *     responses:
 *       200:
 *         description: CV uploaded and parsed successfully
 *       400:
 *         description: Invalid file or upload error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not a talent)
 *       500:
 *         description: Server error
 */
router.post("/cv", authMiddleware, isTalent, upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No CV file uploaded",
      })
    }

    const { autoFill = true } = req.body

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "talentlink/cvs",
      resource_type: "raw", // For non-image files
      public_id: `cv-${req.user._id}-${Date.now()}`,
    })

    // Delete local file after upload
    fs.unlinkSync(req.file.path)

    let parsedData = null
    if (autoFill === "true" || autoFill === true) {
      try {
        // For demo purposes, we'll simulate CV parsing
        // In production, you'd use actual CV parsing service
        parsedData = await parseCVContent(req.file.originalname)
      } catch (parseError) {
        console.error("CV parsing error:", parseError)
        // Continue without parsing if it fails
      }
    }

    // Update user's CV URL
    const updateData = {
      "talentProfile.cvUrl": result.secure_url,
    }

    // Auto-fill profile if parsing was successful
    if (parsedData && autoFill) {
      if (parsedData.skills && parsedData.skills.length > 0) {
        updateData["talentProfile.skills"] = [
          ...new Set([...(req.user.talentProfile?.skills || []), ...parsedData.skills]),
        ]
      }

      if (parsedData.experience && parsedData.experience.length > 0) {
        updateData["talentProfile.experience"] = [
          ...(req.user.talentProfile?.experience || []),
          ...parsedData.experience,
        ]
      }

      if (parsedData.education && parsedData.education.length > 0) {
        updateData["talentProfile.education"] = [...(req.user.talentProfile?.education || []), ...parsedData.education]
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    })

    res.json({
      success: true,
      message: "CV uploaded successfully",
      cvUrl: result.secure_url,
      ...(parsedData && { parsedData }),
      user: updatedUser,
    })
  } catch (error) {
    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    console.error("CV upload error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during CV upload",
    })
  }
})

/**
 * @swagger
 * /api/upload/avatar:
 *   post:
 *     summary: Upload profile avatar
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: Invalid file or upload error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No avatar file uploaded",
      })
    }

    // Upload to Cloudinary with transformations
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "talentlink/avatars",
      public_id: `avatar-${req.user._id}-${Date.now()}`,
      transformation: [
        { width: 300, height: 300, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    })

    // Delete local file after upload
    fs.unlinkSync(req.file.path)

    // Update user's avatar
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { "profile.avatar": result.secure_url },
      { new: true, runValidators: true },
    )

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      avatarUrl: result.secure_url,
      user: updatedUser,
    })
  } catch (error) {
    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    console.error("Avatar upload error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during avatar upload",
    })
  }
})

/**
 * @swagger
 * /api/upload/delete-cv:
 *   delete:
 *     summary: Delete uploaded CV (talents only)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CV deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied (not a talent)
 *       404:
 *         description: No CV found
 *       500:
 *         description: Server error
 */
router.delete("/delete-cv", authMiddleware, isTalent, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user.talentProfile?.cvUrl) {
      return res.status(404).json({
        success: false,
        message: "No CV found to delete",
      })
    }

    // Extract public_id from Cloudinary URL
    const publicId = user.talentProfile.cvUrl.split("/").pop().split(".")[0]

    try {
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(`talentlink/cvs/${publicId}`, {
        resource_type: "raw",
      })
    } catch (cloudinaryError) {
      console.error("Cloudinary deletion error:", cloudinaryError)
      // Continue even if Cloudinary deletion fails
    }

    // Remove CV URL from user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $unset: { "talentProfile.cvUrl": "" } },
      { new: true, runValidators: true },
    )

    res.json({
      success: true,
      message: "CV deleted successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Delete CV error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during CV deletion",
    })
  }
})

module.exports = router
