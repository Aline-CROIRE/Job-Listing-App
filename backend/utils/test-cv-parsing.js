/**
 * Test script for CV parsing functionality
 */

require("dotenv").config()
const { parseCVContent } = require("../utils/aiHelper")

// Sample CV text for testing
const sampleCVText = `
John Doe
Senior Full Stack Developer
Email: john.doe@email.com
Phone: +1-555-0123

PROFESSIONAL EXPERIENCE

Senior Full Stack Developer
Tech Solutions Inc. | Jan 2020 - Present
• Developed and maintained web applications using React, Node.js, and MongoDB
• Led a team of 5 developers in building e-commerce platforms
• Implemented CI/CD pipelines using Docker and Jenkins
• Collaborated with product managers and designers to deliver user-centric solutions

Full Stack Developer  
Digital Innovations LLC | Jun 2018 - Dec 2019
• Built responsive web applications using Angular and Express.js
• Designed and implemented RESTful APIs with PostgreSQL database
• Optimized application performance resulting in 40% faster load times
• Mentored junior developers and conducted code reviews

Frontend Developer
StartupXYZ | Mar 2017 - May 2018
• Developed user interfaces using React and Redux
• Collaborated with UX/UI designers to implement pixel-perfect designs
• Integrated third-party APIs and payment gateways
• Participated in agile development processes

EDUCATION

Master of Science in Computer Science
Stanford University | 2015 - 2017

Bachelor of Science in Software Engineering  
University of California, Berkeley | 2011 - 2015

TECHNICAL SKILLS

Programming Languages: JavaScript, TypeScript, Python, Java
Frontend: React, Angular, Vue.js, HTML5, CSS3, SASS
Backend: Node.js, Express.js, Django, Spring Boot
Databases: MongoDB, PostgreSQL, MySQL, Redis
Cloud & DevOps: AWS, Docker, Kubernetes, Jenkins, Git
Tools: VS Code, Postman, Jira, Figma

CERTIFICATIONS

AWS Certified Solutions Architect | 2021
Google Cloud Professional Developer | 2020
`

async function testCVParsing() {
  console.log("🧪 Testing CV Parsing Functionality...\n")

  try {
    console.log("📄 Sample CV Text Length:", sampleCVText.length)
    console.log("🤖 Starting CV parsing...")

    const startTime = Date.now()
    const parsedData = await parseCVContent(sampleCVText)
    const endTime = Date.now()

    console.log(`⏱️  Parsing completed in ${endTime - startTime} ms\n`)

    console.log("✅ PARSED RESULTS:")
    console.log("==================")

    console.log("\n🔧 SKILLS EXTRACTED:")
    const skills = parsedData.skills || []
    console.log(`Found ${skills.length} skills:`)
    skills.forEach((skill, index) => {
      console.log(`  ${index + 1}. ${skill}`)
    })

    console.log("\n💼 EXPERIENCE EXTRACTED:")
    const experience = parsedData.experience || []
    console.log(`Found ${experience.length} work experiences:`)
    experience.forEach((exp, index) => {
      console.log(`  ${index + 1}. ${exp.position || "N/A"} at ${exp.company || "N/A"}`)
      console.log(`     Duration: ${exp.duration || "N/A"}`)
      console.log(`     Description: ${(exp.description || "").substring(0, 100)}${(exp.description && exp.description.length > 100) ? "..." : ""}`)
    })

    console.log("\n🎓 EDUCATION EXTRACTED:")
    const education = parsedData.education || []
    console.log(`Found ${education.length} education entries:`)
    education.forEach((edu, index) => {
      console.log(`  ${index + 1}. ${edu.degree || "N/A"}`)
      console.log(`     Institution: ${edu.institution || "N/A"}`)
      console.log(`     Year: ${edu.year || "N/A"}`)
    })

    console.log("\n🎉 CV Parsing Test Completed Successfully!")

    // Minimal CV test
    console.log("\n" + "=".repeat(50))
    console.log("Testing with minimal CV...")

    const minimalCV = "I am a JavaScript developer with React and Node.js experience. I worked at Google as Software Engineer."
    const minimalResult = await parseCVContent(minimalCV)

    console.log("\nMinimal CV Results:")
    console.log("Skills:", minimalResult.skills || [])
    console.log("Experience:", minimalResult.experience || [])
    console.log("Education:", minimalResult.education || [])

  } catch (error) {
    console.error("❌ CV Parsing Test Failed:", error.message)
    console.error(error.stack)
  }
}

// Run the test
testCVParsing().catch(console.error)
