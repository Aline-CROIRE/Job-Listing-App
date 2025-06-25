const nodemailer = require("nodemailer");

// ✅ Create email transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * ✅ Send email verification link to user
 */
const sendVerificationEmail = async (email, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"TalentLink AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🎉 Verify Your Email - TalentLink AI",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to TalentLink AI!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verificationUrl}" style="display:inline-block;background:#667eea;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">✅ Verify My Email</a>
        <p>If the button doesn't work, copy this link and open it in your browser:</p>
        <p style="word-break:break-all;color:#444;">${verificationUrl}</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Verification email failed:", error.message);
    throw error;
  }
};

/**
 * ✅ Send password reset email
 */
const sendPasswordResetEmail = async (email, token) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"TalentLink AI Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🔐 Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Reset Your Password</h2>
        <p>Click the button below to set a new password. This link expires in 10 minutes.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#ff6b6b;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">🔑 Reset My Password</a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break:break-all;color:#444;">${resetUrl}</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Password reset email failed:", error.message);
    throw error;
  }
};

/**
 * ✅ Send welcome email after email verification
 */
const sendWelcomeEmail = async (email, userName, userRole) => {
  const transporter = createTransporter();
  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;

  const roleCTA = userRole === "talent"
    ? {
        heading: "You're now ready to apply to projects! 💼",
        button: "Complete My Profile",
        color: "#27ae60"
      }
    : {
        heading: "Start posting projects & find talent! 🎯",
        button: "Post My First Project",
        color: "#2980b9"
      };

  const mailOptions = {
    from: `"TalentLink AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🎉 Welcome, ${userName}!`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Hi ${userName}, welcome to TalentLink AI!</h2>
        <p>${roleCTA.heading}</p>
        <a href="${dashboardUrl}" style="display:inline-block;background:${roleCTA.color};color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">🚀 ${roleCTA.button}</a>
        <p>We're glad to have you onboard!</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Welcome email failed:", error.message);
    throw error;
  }
};

/**
 * ✅ Test Gmail configuration
 */
const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Gmail configuration is working properly");
    return true;
  } catch (error) {
    console.error("❌ Gmail configuration failed:", error.message);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  testEmailConfiguration,
};
