/**
 * AI Helper functions for talent matching and CV parsing
 * Enhanced with OpenAI integration for production use
 */

const OpenAI = require("openai")

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

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
  const projectSkillsLower = projectSkills.map((skill) => skill.toLowerCase().trim())
  const talentSkillsLower = talentSkills.map((skill) => skill.toLowerCase().trim())

  // Find exact matches
  const exactMatches = projectSkillsLower.filter((skill) => talentSkillsLower.includes(skill)).length

  // Find partial matches (contains or similar)
  const partialMatches = projectSkillsLower.filter((projectSkill) =>
    talentSkillsLower.some(
      (talentSkill) =>
        talentSkill.includes(projectSkill) ||
        projectSkill.includes(talentSkill) ||
        getSimilarityScore(projectSkill, talentSkill) > 0.7,
    ),
  ).length

  // Calculate weighted score
  const exactWeight = 1.0
  const partialWeight = 0.6

  const totalMatches = exactMatches * exactWeight + (partialMatches - exactMatches) * partialWeight
  const score = (totalMatches / projectSkills.length) * 100

  return Math.min(Math.round(score), 100)
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * @param {String} str1 - First string
 * @param {String} str2 - Second string
 * @returns {Number} Similarity score between 0-1
 */
const getSimilarityScore = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) return 1.0

  const editDistance = getEditDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculate Levenshtein distance between two strings
 */
const getEditDistance = (str1, str2) => {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
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
    .filter((talent) => {
      return (
        talent.role === "talent" &&
        talent.isEmailVerified &&
        talent.talentProfile &&
        talent.talentProfile.skills &&
        talent.talentProfile.availability !== "unavailable"
      )
    })
    .map((talent) => {
      const matchScore = calculateMatchScore(project.skillsRequired, talent.talentProfile.skills)

      // Find matched skills for display
      const matchedSkills = project.skillsRequired.filter((skill) =>
        talent.talentProfile.skills.some(
          (talentSkill) =>
            talentSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(talentSkill.toLowerCase()) ||
            getSimilarityScore(skill.toLowerCase(), talentSkill.toLowerCase()) > 0.7,
        ),
      )

      // Calculate additional factors
      const availabilityScore = talent.talentProfile.availability === "available" ? 10 : 5
      const rateCompatibility = calculateRateCompatibility(project.budget, talent.talentProfile.hourlyRate)
      const experienceBonus = talent.talentProfile.experience ? talent.talentProfile.experience.length * 2 : 0

      const finalScore = Math.min(matchScore + availabilityScore + rateCompatibility + experienceBonus, 100)

      return {
        talent: {
          _id: talent._id,
          name: talent.name,
          email: talent.email,
          profile: talent.profile,
          talentProfile: {
            skills: talent.talentProfile.skills,
            hourlyRate: talent.talentProfile.hourlyRate,
            availability: talent.talentProfile.availability,
            experience: talent.talentProfile.experience,
          },
        },
        matchScore: finalScore,
        skillMatchScore: matchScore,
        matchedSkills,
        availabilityScore,
        rateCompatibility,
        experienceBonus,
      }
    })
    .filter((rec) => rec.skillMatchScore > 20) // Only include talents with reasonable match
    .sort((a, b) => b.matchScore - a.matchScore) // Sort by final score descending
    .slice(0, 15) // Return top 15 recommendations

  return recommendations
}

/**
 * Calculate rate compatibility between project budget and talent rate
 */
const calculateRateCompatibility = (projectBudget, talentRate) => {
  if (!projectBudget || !talentRate) return 0

  const { min, max } = projectBudget

  if (!min && !max) return 0

  if (talentRate <= (max || min)) {
    return talentRate >= (min || 0) ? 10 : 5
  }

  return 0
}

/**
 * Parse CV content using OpenAI (production version)
 * @param {String} cvText - CV text content or filename
 * @returns {Object} Parsed CV data
 */
const parseCVContent = async (cvText) => {
  // If OpenAI is not configured, use mock parsing
  if (!openai) {
    console.log("OpenAI not configured, using mock CV parsing")
    return mockParseCVContent(cvText)
  }

  try {
    const prompt = `
Parse the following CV/Resume and extract structured information. Return a JSON object with the following structure:
{
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "company": "Company Name",
      "position": "Job Title",
      "duration": "Duration",
      "description": "Brief description"
    }
  ],
  "education": [
    {
      "institution": "School/University",
      "degree": "Degree/Certification",
      "year": "Year or duration"
    }
  ]
}

CV Content: ${cvText}

Please extract only the most relevant technical skills, work experience, and education. Keep descriptions concise.
`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a professional CV parser. Extract structured information from CVs and return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    })

    const parsedContent = response.choices[0].message.content
    const parsedData = JSON.parse(parsedContent)

    // Validate and clean the parsed data
    return {
      skills: Array.isArray(parsedData.skills) ? parsedData.skills.slice(0, 20) : [],
      experience: Array.isArray(parsedData.experience) ? parsedData.experience.slice(0, 5) : [],
      education: Array.isArray(parsedData.education) ? parsedData.education.slice(0, 3) : [],
    }
  } catch (error) {
    console.error("OpenAI CV parsing error:", error)
    // Fallback to mock parsing if OpenAI fails
    return mockParseCVContent(cvText)
  }
}

/**
 * Mock CV parsing function (fallback when OpenAI is not available)
 */
const mockParseCVContent = (cvText) => {
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
  ]

  // Mock parsing logic here
  return {
    skills: commonSkills,
    experience: [],
    education: [],
  }
}
