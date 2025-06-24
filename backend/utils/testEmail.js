/**
 * Email testing utility
 * Run this file to test your Gmail configuration
 */

require("dotenv").config()

async function testGmailSetup() {
  console.log("🧪 Testing Gmail Configuration...\n")

  // Check if environment variables are set
  console.log("📋 Checking environment variables...")
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? "✅ Set" : "❌ Not set"}`)
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? "✅ Set" : "❌ Not set"}`)
  console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL ? "✅ Set" : "❌ Not set"}\n`)

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("❌ Missing required environment variables!")
    console.log("Please set EMAIL_USER and EMAIL_PASS in your .env file")
    return
  }

  // Import email functions after env check
  const { testEmailConfiguration, sendVerificationEmail } = require("./email")

  // Test 1: Verify Gmail connection
  console.log("1. Testing Gmail connection...")
  const isConfigValid = await testEmailConfiguration()

  if (!isConfigValid) {
    console.log("\n❌ Gmail configuration failed!")
    console.log("Common solutions:")
    console.log("1. Make sure you're using Gmail App Password, not regular password")
    console.log("2. Enable 2-Factor Authentication on Gmail")
    console.log("3. Generate App Password: Google Account → Security → App passwords")
    console.log("4. Use the 16-character app password in EMAIL_PASS")
    return
  }

  // Test 2: Send test verification email
  console.log("\n2. Sending test verification email...")
  try {
    const testEmail = process.env.EMAIL_USER // Send to yourself for testing
    const testToken = "test-verification-token-123"

    await sendVerificationEmail(testEmail, testToken)
    console.log("✅ Test email sent successfully!")
    console.log(`📧 Check your inbox at: ${testEmail}`)
    console.log("🔗 The verification link in the email will contain the test token")
  } catch (error) {
    console.log("❌ Failed to send test email:", error.message)

    // Provide specific error guidance
    if (error.message.includes("Invalid login")) {
      console.log("\n💡 Solution: Use Gmail App Password instead of regular password")
      console.log("Steps:")
      console.log("1. Go to Google Account → Security")
      console.log("2. Enable 2-Factor Authentication")
      console.log("3. Go to App passwords")
      console.log("4. Generate password for 'Mail'")
      console.log("5. Use that 16-character password in EMAIL_PASS")
    }
  }

  console.log("\n🎉 Gmail testing completed!")
}

// Run the test
testGmailSetup().catch(console.error)
