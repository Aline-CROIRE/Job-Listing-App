const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const swaggerJsdoc = require("swagger-jsdoc")
const swaggerUi = require("swagger-ui-express")
require("dotenv").config()

// Import routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const projectRoutes = require("./routes/projects")
const applicationRoutes = require("./routes/applications")
const uploadRoutes = require("./routes/upload") // ✅ NEW

const app = express()

// Security middleware
app.use(helmet())

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
})
app.use(limiter)

// CORS
app.use(
  cors({
    origin: "http://192.168.1.162:8081",
    credentials: true,
  })
)

// Body parser
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "JobNest AI API",
      version: "1.0.0",
      description: "Job/project platform API with AI-powered talent matching",
      contact: {
        name: "JobNest AI Team",
        email: "support@jobnest.ai",
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js", "./models/*.js"],
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/applications", applicationRoutes)
app.use("/api/upload", uploadRoutes) // ✅ NEW UPLOAD ROUTES

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "TalentLink AI Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
})

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB")

    const PORT = process.env.PORT || 5000
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`)
      console.log(`🏥 Health: http://localhost:${PORT}/health`)
    })
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  })

module.exports = app
