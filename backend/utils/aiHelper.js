/**
 * AI Helper functions for talent matching and CV parsing
 * This is a mock implementation - replace with actual AI service calls
 */

/**
 * Calculate match score between project requirements and talent skills
 * @param {Array} projectSkills - Required skills for the project
 * @param {Array} talentSkills - Talent's skills
 * @returns {Number} Match score between 0-100
 */
const calculateMatchScore = (projectSkills, talentSkills) => {
  if (!projectSkills || !talentSkills || projectSkills.length === 0 || talentSkills.length === 0) {
    return 0
  }

  // Convert to lowercase for case-insensitive matching
  const projectSkillsLower = projectSkills.map((skill) => skill.toLowerCase())
  const talentSkillsLower = talentSkills.map((skill) => skill.toLowerCase())

  // Find exact matches
  const exactMatches = projectSkillsLower.filter((skill) => talentSkillsLower.includes(skill)).length

  // Find partial matches (contains)
  const partialMatches = projectSkillsLower.filter((projectSkill) =>
    talentSkillsLower.some((talentSkill) => talentSkill.includes(projectSkill) || projectSkill.includes(talentSkill)),
  ).length

  // Calculate score
  const exactWeight = 0.8
  const partialWeight = 0.4

  const score = ((exactMatches * exactWeight + partialMatches * partialWeight) / projectSkills.length) * 100

  return Math.min(Math.round(score), 100)
}

/**
 * Recommend talents for a project based on skills matching
 * @param {Object} project - Project object with skillsRequired
 * @param {Array} talents - Array of talent users
 * @returns {Array} Sorted array of talents with match scores
 */
const recommendTalents = (project, talents) => {
  if (!project.skillsRequired || !talents || talents.length === 0) {
    return []
  }

  const recommendations = talents
    .filter((talent) => talent.role === "talent" && talent.talentProfile && talent.talentProfile.skills)
    .map((talent) => {
      const matchScore = calculateMatchScore(project.skillsRequired, talent.talentProfile.skills)

      return {
        talent,
        matchScore,
        matchedSkills: project.skillsRequired.filter((skill) =>
          talent.talentProfile.skills.some(
            (talentSkill) =>
              talentSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(talentSkill.toLowerCase()),
          ),
        ),
      }
    })
    .filter((rec) => rec.matchScore > 0) // Only include talents with some match
    .sort((a, b) => b.matchScore - a.matchScore) // Sort by match score descending
    .slice(0, 10) // Return top 10 recommendations

  return recommendations
}

/**
 * Mock CV parsing function
 * In production, this would call OpenAI API or other CV parsing service
 * @param {String} cvText - CV text content
 * @returns {Object} Parsed CV data
 */
const parseCVContent = async (cvText) => {
  // This is a mock implementation
  // In production, you would call OpenAI API or other CV parsing service

  // Mock parsing logic - extract common patterns
  const skills = extractSkills(cvText)
  const experience = extractExperience(cvText)
  const education = extractEducation(cvText)

  return {
    skills,
    experience,
    education,
  }
}

/**
 * Extract skills from CV text (mock implementation)
 */
const extractSkills = (text) => {
  const commonSkills = [
    "JavaScript",
    "Python",
    "Java",
    "React",
    "Node.js",
    "Angular",
    "Vue.js",
    "HTML",
    "CSS",
    "MongoDB",
    "MySQL",
    "PostgreSQL",
    "AWS",
    "Docker",
    "Git",
    "TypeScript",
    "PHP",
    "Laravel",
    "Django",
    "Express.js",
    "GraphQL",
    "REST API",
    "Microservices",
    "Kubernetes",
    "Jenkins",
  ]

  const foundSkills = commonSkills.filter((skill) => text.toLowerCase().includes(skill.toLowerCase()))

  return foundSkills
}

/**
 * Extract experience from CV text (mock implementation)
 */
const extractExperience = (text) => {
  // This is a very basic mock - in production use proper NLP
  const lines = text.split("\n")
  const experience = []

  // Look for patterns like "Company Name - Position"
  lines.forEach((line) => {
    if (line.includes(" - ") && line.length > 10 && line.length < 100) {
      const parts = line.split(" - ")
      if (parts.length >= 2) {
        experience.push({
          company: parts[0].trim(),
          position: parts[1].trim(),
          duration: "Not specified",
          description: "Extracted from CV",
        })
      }
    }
  })

  return experience.slice(0, 5) // Return max 5 experiences
}

/**
 * Extract education from CV text (mock implementation)
 */
const extractEducation = (text) => {
  const educationKeywords = ["university", "college", "degree", "bachelor", "master", "phd"]
  const lines = text.split("\n")
  const education = []

  lines.forEach((line) => {
    const lowerLine = line.toLowerCase()
    if (educationKeywords.some((keyword) => lowerLine.includes(keyword))) {
      education.push({
        institution: line.trim(),
        degree: "Not specified",
        year: "Not specified",
      })
    }
  })

  return education.slice(0, 3) // Return max 3 education entries
}

/**
 * Generate AI-powered application insights
 * @param {Object} application - Application object
 * @param {Object} project - Project object
 * @returns {Object} Application insights
 */
const generateApplicationInsights = (application, project) => {
  const insights = {
    strengths: [],
    concerns: [],
    recommendations: [],
  }

  // Analyze match score
  if (application.aiMatchScore >= 80) {
    insights.strengths.push("Excellent skill match for project requirements")
  } else if (application.aiMatchScore >= 60) {
    insights.strengths.push("Good skill alignment with project needs")
  } else {
    insights.concerns.push("Limited skill match with project requirements")
  }

  // Analyze confidence level
  if (application.confidenceLevel === "strong") {
    insights.strengths.push("High confidence in ability to deliver")
  } else if (application.confidenceLevel === "weak") {
    insights.concerns.push("Low confidence level indicated")
  }

  // Analyze proposed rate vs project budget
  if (project.budget && application.proposedRate) {
    if (application.proposedRate <= project.budget.max) {
      insights.strengths.push("Proposed rate within project budget")
    } else {
      insights.concerns.push("Proposed rate exceeds project budget")
    }
  }

  // Generate recommendations
  if (insights.strengths.length > insights.concerns.length) {
    insights.recommendations.push("Consider for interview or direct hire")
  } else {
    insights.recommendations.push("Request additional information or portfolio samples")
  }

  return insights
}

module.exports = {
  calculateMatchScore,
  recommendTalents,
  parseCVContent,
  generateApplicationInsights,
}
