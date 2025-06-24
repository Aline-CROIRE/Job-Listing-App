const express = require("express")
const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management (Coming in Day 2)
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects (Coming in Day 2)
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Projects endpoint - Coming in Day 2
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Projects endpoints will be implemented in Day 2",
    availableEndpoints: [
      "GET /api/projects - Get all projects",
      "POST /api/projects - Create project",
      "GET /api/projects/:id - Get project by ID",
      "PUT /api/projects/:id - Update project",
      "DELETE /api/projects/:id - Delete project",
    ],
  })
})

module.exports = router
