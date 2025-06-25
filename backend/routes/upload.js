const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { v2: cloudinary } = require("cloudinary")
const authMiddleware = require("../middleware/auth")
const { isTalent } = require("../middleware/role")
const { parseCVContent } = require("../utils/aiHelper")
const User = require("../models/User")

const pdf = require("pdf-parse")
const mammoth = require("mammoth")
const textract = require("textract")

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

    // Extract text from the uploaded file
    let cvText = ""
    try {
      cvText = await extractTextFromFile(req.file)
      console.log("📄 Extracted CV text length:", cvText.length)
    } catch (extractError) {
      console.error("Text extraction error:", extractError)
      // Continue with upload even if text extraction fails
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "talentlink/cvs",
      resource_type: "raw",
      public_id: `cv-${req.user._id}-${Date.now()}`,
    })

    // Delete local file after upload
    fs.unlinkSync(req.file.path)

    let parsedData = null
    let profileUpdated = false

    if ((autoFill === "true" || autoFill === true) && cvText.length > 100) {
      try {
        console.log("🤖 Starting AI CV parsing...")
        parsedData = await parseCVContent(cvText)
        console.log("✅ CV parsed successfully:", {
          skills: parsedData.skills?.length || 0,
          experience: parsedData.experience?.length || 0,
          education: parsedData.education?.length || 0,
        })

        // Update user profile with parsed data
        if (
          parsedData &&
          (parsedData.skills?.length > 0 || parsedData.experience?.length > 0 || parsedData.education?.length > 0)
        ) {
          const updateData = await buildProfileUpdateData(req.user, parsedData)

          const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
            new: true,
            runValidators: true,
          })

          profileUpdated = true
          console.log("✅ Profile updated with parsed CV data")

          res.json({
            success: true,
            message: "CV uploaded and profile updated successfully with AI parsing",
            cvUrl: result.secure_url,
            parsedData,
            profileUpdated: true,
            user: updatedUser,
            extractedText: cvText.substring(0, 500) + "...", // First 500 chars for verification
          })
        } else {
          throw new Error("No useful data extracted from CV")
        }
      } catch (parseError) {
        console.error("CV parsing error:", parseError)
        // Continue without parsing if it fails
        parsedData = { error: parseError.message }
      }
    }

    // If parsing failed or was disabled, just update CV URL
    if (!profileUpdated) {
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { "talentProfile.cvUrl": result.secure_url },
        { new: true, runValidators: true },
      )

      res.json({
        success: true,
        message: parsedData?.error
          ? "CV uploaded successfully, but AI parsing failed. Please update your profile manually."
          : "CV uploaded successfully",
        cvUrl: result.secure_url,
        profileUpdated: false,
        user: updatedUser,
        ...(parsedData && { parsedData }),
        ...(cvText && { extractedText: cvText.substring(0, 500) + "..." }),
      })
    }
  } catch (error) {
    // Clean up local file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    console.error("CV upload error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during CV upload",
      error: error.message,
    })
  }
})

/**
 * Extract text content from uploaded file based on file type
 */
async function extractTextFromFile(file) {
  const fileExtension = path.extname(file.originalname).toLowerCase()

  try {
    switch (fileExtension) {
      case ".pdf":
        return await extractFromPDF(file.path)

      case ".doc":
      case ".docx":
        return await extractFromWord(file.path)

      case ".txt":
        return fs.readFileSync(file.path, "utf8")

      default:
        // Try textract as fallback for other formats
        return await extractWithTextract(file.path)
    }
  } catch (error) {
    console.error(`Failed to extract text from ${fileExtension} file:`, error)
    throw error
  }
}

/**
 * Extract text from PDF file
 */
async function extractFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath)
    const data = await pdf(dataBuffer)
    return data.text
  } catch (error) {
    console.error("PDF extraction error:", error)
    throw new Error("Failed to extract text from PDF")
  }
}

/**
 * Extract text from Word document
 */
async function extractFromWord(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value
  } catch (error) {
    console.error("Word extraction error:", error)
    throw new Error("Failed to extract text from Word document")
  }
}

/**
 * Extract text using textract (fallback method)
 */
async function extractWithTextract(filePath) {
  return new Promise((resolve, reject) => {
    textract.fromFileWithPath(filePath, (error, text) => {
      if (error) {
        reject(error)
      } else {
        resolve(text)
      }
    })
  })
}

/**
 * Build profile update data from parsed CV
 */
async function buildProfileUpdateData(user, parsedData) {
  const updateData = {}

  // Update skills (merge with existing, avoid duplicates)
  if (parsedData.skills && parsedData.skills.length > 0) {
    const existingSkills = user.talentProfile?.skills || []
    const newSkills = parsedData.skills.filter(
      (skill) => !existingSkills.some((existing) => existing.toLowerCase() === skill.toLowerCase()),
    )

    updateData["talentProfile.skills"] = [...existingSkills, ...newSkills]
  }

  // Update experience (append to existing)
  if (parsedData.experience && parsedData.experience.length > 0) {
    const existingExperience = user.talentProfile?.experience || []
    updateData["talentProfile.experience"] = [...existingExperience, ...parsedData.experience]
  }

  // Update education (append to existing)
  if (parsedData.education && parsedData.education.length > 0) {
    const existingEducation = user.talentProfile?.education || []
    updateData["talentProfile.education"] = [...existingEducation, ...parsedData.education]
  }

  return updateData
}

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
