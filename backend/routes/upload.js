// routes/upload.js

const express = require("express");
const multer = require("multer");
const path = require("path"); // Corrected: path should be a string 'path'
const fs = require("fs");
const { v2: cloudinary } = require("cloudinary");
const authMiddleware = require("../middleware/auth");
const { isTalent } = require("../middleware/role");
const { parseCVContent } = require("../utils/aiHelper");
const User = require("../models/User");

const pdf = require("pdf-parse");
const mammoth = require("mammoth");

const router = express.Router();

// --- Configuration (No changes needed) ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  if ((file.fieldname === "cv" && allowedTypes.includes(file.mimetype)) || (file.fieldname === "avatar" && file.mimetype.startsWith("image/"))) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type: " + file.mimetype), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});


// --- CV Upload Route ---
router.post("/cv", authMiddleware, isTalent, upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No CV file uploaded" });
    }

    const { autoFill = "true" } = req.body;
    let cvText = "";
    let parsingStatus = { success: false, message: "Parsing was not attempted." };
    const updatePayload = {};

    if (autoFill === 'true' || autoFill === true) {
      try {
        console.log("📄 Extracting text from CV...");
        cvText = await extractTextFromFile(req.file.path, req.file.originalname);
        if (cvText.length > 100) {
          console.log("🤖 Starting AI CV parsing...");
          const parsedData = await parseCVContent(cvText);
          console.log("✅ CV parsed successfully.");
          // [UPDATED] Use the new helper function to build the update payload
          const parsedUpdate = await buildProfileUpdateData(parsedData);
          Object.assign(updatePayload, parsedUpdate);
          parsingStatus = { success: true, message: "Profile updated with parsed CV data." };
        } else {
          parsingStatus = { success: false, message: "Not enough text in CV to parse." };
        }
      } catch (parseError) {
        if (parseError.name === 'CastError') {
             console.error("❌ Mongoose Schema Mismatch (CastError):", parseError.message);
             parsingStatus = { success: false, message: `Schema validation failed. Check that your User model matches the AI's output. Error on field: ${parseError.path}` };
        } else {
            console.error("❌ CV Parsing or Text Extraction Error:", parseError.message);
            parsingStatus = { success: false, message: "AI parsing failed. Profile was not auto-filled." };
        }
      }
    }

    console.log("☁️ Uploading CV to Cloudinary...");
    const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "talentlink/cvs",
      resource_type: "raw",
      public_id: `cv-${req.user._id}-${Date.now()}`,
    });
    console.log("✅ CV uploaded to Cloudinary successfully.");
    updatePayload["talentProfile.cvUrl"] = cloudinaryResult.secure_url;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    ).select('-password');
    
    console.log("✅ User profile updated in database.");
    return res.json({
      success: true, message: parsingStatus.message, user: updatedUser, cvUrl: cloudinaryResult.secure_url, profileUpdated: parsingStatus.success,
    });
  } catch (error) {
    console.error("CV upload main error:", error);
    return res.status(500).json({ success: false, message: "Server error during CV upload", error: error.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log(`🧹 Cleaned up local file: ${req.file.path}`);
    }
  }
});


/**
 * [CORRECTED & ENHANCED LOGGING] Upload avatar image route
 */
router.post("/avatar", authMiddleware, upload.single("avatar"), async (req, res) => {
  console.log("--- AVATAR UPLOAD ROUTE HIT ---");
  try {
    if (!req.file) {
      console.error("❌ Avatar upload error: No file received by multer.");
      return res.status(400).json({ success: false, message: "No avatar file uploaded. Check field name." });
    }
    console.log(`📄 Received file: ${req.file.originalname}, Size: ${req.file.size}`);

    console.log("☁️ Uploading avatar to Cloudinary...");
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "talentlink/avatars",
      public_id: `avatar-${req.user.id}-${Date.now()}`,
      transformation: [
        { width: 300, height: 300, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });
    console.log("✅ Avatar uploaded to Cloudinary:", result.secure_url);

    console.log("💾 Updating user document in database...");
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { "profile.profile": result.secure_url },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
        console.error("❌ Database update failed: User not found after update.");
        return res.status(404).json({ success: false, message: "User not found." });
    }
    console.log("✅ User document updated successfully.");

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      avatarUrl: result.secure_url,
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Avatar upload main error:", error);
    res.status(500).json({ success: false, message: "Server error during avatar upload", error: error.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log(`🧹 Cleaned up local file: ${req.file.path}`);
    }
    console.log("--- AVATAR UPLOAD ROUTE END ---");
  }
});


// --- Helper Functions ---

async function extractTextFromFile(filePath, originalname) {
  const ext = path.extname(originalname).toLowerCase();
  const dataBuffer = fs.readFileSync(filePath);
  switch (ext) {
    case ".pdf":
      return (await pdf(dataBuffer)).text;
    case ".doc":
    case ".docx":
      return (await mammoth.extractRawText({ buffer: dataBuffer })).value;
    case ".txt":
      return dataBuffer.toString("utf8");
    default:
      throw new Error(`Unsupported file type for text extraction: ${ext}`);
  }
}

/**
 * [UPDATED] This helper function now REPLACES old CV data.
 */
async function buildProfileUpdateData(parsedData) {
  const updateData = {};
  if (parsedData.skills && parsedData.skills.length > 0) {
    updateData["talentProfile.skills"] = [...new Set(parsedData.skills)];
  }
  if (parsedData.experience && parsedData.experience.length > 0) {
    updateData["talentProfile.experience"] = parsedData.experience;
  }
  if (parsedData.education && parsedData.education.length > 0) {
    updateData["talentProfile.education"] = parsedData.education;
  }
  return updateData;
}

router.delete("/delete-cv", authMiddleware, isTalent, async (req, res) => {
    // Your existing delete route logic is fine.
});


module.exports = router;