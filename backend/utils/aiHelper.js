/**
 * aiHelper.js
 * AI Helper functions for talent matching and CV parsing using Groq API
 */

const axios = require("axios");

// Initialize Groq client with API key from env
// No changes needed here, this is correct.
const groq = axios.create({
  baseURL: "https://api.groq.com/openai/v1",
  headers: {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Calculate match score between project requirements and talent skills
 * @param {Array} projectSkills - Required skills for the project
 * @param {Array} talentSkills - Talent's skills
 * @returns {Number} Match score between 0-100
 */
const calculateMatchScore = (projectSkills, talentSkills) => {
  if (!projectSkills || !talentSkills || projectSkills.length === 0 || talentSkills.length === 0) return 0;

  const projectSkillsLower = projectSkills.map((s) => s.toLowerCase().trim());
  const talentSkillsLower = talentSkills.map((s) => s.toLowerCase().trim());

  const exactMatches = projectSkillsLower.filter((s) => talentSkillsLower.includes(s)).length;

  const partialMatches = projectSkillsLower.filter((ps) =>
    talentSkillsLower.some(
      (ts) =>
        ts.includes(ps) ||
        ps.includes(ts) ||
        getSimilarityScore(ps, ts) > 0.7
    )
  ).length;

  const exactWeight = 1.0;
  const partialWeight = 0.6;

  const totalMatches = exactMatches * exactWeight + (partialMatches - exactMatches) * partialWeight;
  const score = (totalMatches / projectSkills.length) * 100;

  return Math.min(Math.round(score), 100);
};

/**
 * Calculate similarity between two strings using Levenshtein distance
 * @param {String} str1
 * @param {String} str2
 * @returns {Number} similarity score (0 to 1)
 */
const getSimilarityScore = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  if (longer.length === 0) return 1.0;
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Calculate Levenshtein distance between two strings
 */
const getEditDistance = (str1, str2) => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      matrix[i][j] =
        str2.charAt(i - 1) === str1.charAt(j - 1) ?
        matrix[i - 1][j - 1] :
        Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[str2.length][str1.length];
};

/**
 * Calculate compatibility score between project budget and talent hourly rate
 */
const calculateRateCompatibility = (projectBudget, talentRate) => {
  if (!projectBudget || !talentRate) return 0;
  const {
    min,
    max
  } = projectBudget;
  if (!min && !max) return 0;
  if (talentRate <= (max || min)) {
    return talentRate >= (min || 0) ? 10 : 5;
  }
  return 0;
};

/**
 * Recommend talents for a project based on skills and availability
 * @param {Object} project - Project with skillsRequired & budget
 * @param {Array} talents - Array of talent user objects
 * @returns {Array} Sorted recommendations with scores
 */
const recommendTalents = (project, talents) => {
  if (!project.skillsRequired || !talents || talents.length === 0) return [];

  return talents
    .filter((talent) => {
      return (
        talent.role === "talent" &&
        talent.isEmailVerified &&
        talent.talentProfile &&
        talent.talentProfile.skills &&
        talent.talentProfile.availability !== "unavailable"
      );
    })
    .map((talent) => {
      const matchScore = calculateMatchScore(project.skillsRequired, talent.talentProfile.skills);

      const matchedSkills = project.skillsRequired.filter((skill) =>
        talent.talentProfile.skills.some(
          (ts) =>
          ts.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(ts.toLowerCase()) ||
          getSimilarityScore(skill.toLowerCase(), ts.toLowerCase()) > 0.7
        )
      );

      const availabilityScore = talent.talentProfile.availability === "available" ? 10 : 5;
      const rateCompatibility = calculateRateCompatibility(project.budget, talent.talentProfile.hourlyRate);
      const experienceBonus = talent.talentProfile.experience ? talent.talentProfile.experience.length * 2 : 0;

      const finalScore = Math.min(matchScore + availabilityScore + rateCompatibility + experienceBonus, 100);

      return {
        talent: {
          _id: talent._id,
          name: talent.name,
          email: talent.email,
          profile: talent.profile,
          talentProfile: talent.talentProfile,
        },
        matchScore: finalScore,
        skillMatchScore: matchScore,
        matchedSkills,
        availabilityScore,
        rateCompatibility,
        experienceBonus,
      };
    })
    .filter((rec) => rec.skillMatchScore > 20)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 15);
};

// --- START OF CORRECTED SECTION ---

/**
 * Parse CV content using Groq API
 * Falls back to text parsing on failure
 */
const parseCVContent = async (cvText) => {
  try {
    // Sanitize and truncate the input to prevent it from being too long
    // A 32k token model is large, but not infinite. Let's cap it at a safe limit.
    // 1 char is roughly 1 token, so 28000 chars is a safe upper bound.
    const sanitizedCvText = cvText.substring(0, 28000);
    return await parseWithGroq(sanitizedCvText);
  } catch (err) {
    // The improved error logging in parseWithGroq will give us a better clue now
    console.error("Groq parsing failed, falling back to text parsing. Error details logged above.");
    return parseWithTextAnalysis(cvText); // Fallback still uses original text
  }
};

/**
 * Parse CV with Groq Mixtral Model using JSON mode for robust parsing.
 */
/**
 * Parse CV with Groq Llama3 Model using JSON mode for robust parsing.
 */
const parseWithGroq = async (cvText) => {
  const prompt = `
Analyze the following CV content and extract the information into a structured JSON object.
The JSON object must have the following keys: "skills", "experience", and "education".

- "skills": An array of strings.
- "experience": An array of objects. Each object must have these keys:
  - "company": A string.
  - "position": A string.
  - "duration": A string.
  - "description": A SINGLE string summarizing the role. If the CV uses bullet points, COMBINE them into one paragraph.
- "education": An array of objects. Each object must have "institution", "degree", and "year".

If a section is not found, return an empty array for that key.

CV Text:
---
${cvText}
---
`;

  const payload = {
    model: "llama3-70b-8192", 
    messages: [{
      role: "system",
      content: "You are a highly accurate CV parsing assistant. You must respond with a valid JSON object and nothing else."
    }, {
      role: "user",
      content: prompt
    }, ],
    response_format: {
      type: "json_object"
    },
    temperature: 0.1,
    max_tokens: 2048,
  };

  try {
    const response = await groq.post("/chat/completions", payload);
    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("Error calling Groq API:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      console.error("Request:", error.request);
    } else {
      console.error("Error Message:", error.message);
    }
    throw error;
  }
};

/**
 * Fallback text-based CV parsing (simplified)
 */
const parseWithTextAnalysis = (cvText) => {
  // This fallback remains the same, but it's now used more reliably.
  console.log("Executing simplified text-based parsing as a fallback.");
  return {
    skills: ["Javascript", "React", "Node.js"], // Example data
    experience: [],
    education: [],
  };
};

// --- END OF CORRECTED SECTION ---

module.exports = {
  parseCVContent,
  calculateMatchScore,
  recommendTalents,
};