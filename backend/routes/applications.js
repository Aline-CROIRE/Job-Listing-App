const express = require("express")
const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Job applications (Coming in Day 2)
 */

/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get applications (Coming in Day 2)
 *     tags: [Applications]
 *     responses:
 *       200:
 *         description: Applications endpoint - Coming in Day 2
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Applications endpoints will be implemented in Day 2",
    availableEndpoints: [
      "GET /api/applications - Get all applications",
      "POST /api/applications - Submit application",
      "GET /api/applications/:id - Get application by ID",
      "PUT /api/applications/:id - Update application status",
    ],
  })
})

module.exports = router
