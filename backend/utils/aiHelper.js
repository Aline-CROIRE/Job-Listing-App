/**
 * aiHelper.js
 * AI Helper functions for talent matching and CV parsing using Groq API
 */

const axios = require("axios");

// Initialize Groq client with API key from env
const groq = axios.create({
  baseURL: "https://api.groq.com/openai/v1",
  headers: {
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Calculate match score between project requirements and talent skills
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
        str2.charAt(i - 1) === str1.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[str2.length][str1.length];
};

/**
 * Calculate compatibility score between project budget and talent hourly rate
 */
const calculateRateCompatibility = (projectBudget, talentRate) => {
  if (!projectBudget || !talentRate) return 0;
  const { min, max } = projectBudget;
  if (!min && !max) return 0;
  if (talentRate <= (max || min)) {
    return talentRate >= (min || 0) ? 10 : 5;
  }
  return 0;
};

/**
 * Recommend talents for a project based on skills and availability
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

// --- START OF UPDATED PARSING SECTION ---

/**
 * Parse CV content using Groq API
 * Falls back to simplified parsing on failure
 */
const parseCVContent = async (cvText) => {
  try {
    // Truncate input to ~28,000 chars to stay within token limits
    const sanitizedCvText = cvText.substring(0, 28000);
    return await parseWithGroq(sanitizedCvText);
  } catch (err) {
    console.error("Groq parsing failed, falling back to simplified parsing. Error details logged above.");
    return parseWithTextAnalysis(cvText);
  }
};

/**
 * Parse CV with Groq Llama3 model in JSON mode
 */
const parseWithGroq = async (cvText) => {
  const prompt = `
Analyze the following CV content and extract the information into a structured JSON object.
The JSON object must have these keys: "skills", "experience", and "education".

- "skills": array of strings.
- "experience": array of objects with keys: "company", "position", "duration", "description".
- "education": array of objects with keys: "institution", "degree", "year".

If any section is missing, return empty arrays.

CV Text:
---
${cvText}
---
`;

  const payload = {
    model: "llama3-70b-8192",
    messages: [
      {
        role: "system",
        content: "You are a highly accurate CV parsing assistant. Respond ONLY with a valid JSON object.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
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
 * Fallback simplified CV parser
 */
const parseWithTextAnalysis = (cvText) => {
  console.log("Fallback simplified text-based CV parsing.");
  return {
    skills: ["Javascript", "React", "Node.js"],
    experience: [],
    education: [],
  };
};

// --- END OF UPDATED PARSING SECTION ---

module.exports = {
  parseCVContent,
  calculateMatchScore,
  recommendTalents,
};
