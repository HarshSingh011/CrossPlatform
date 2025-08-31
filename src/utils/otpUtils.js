const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');

// Store OTPs with their expiration time
const otpStorage = {};
exports.otpStorage = otpStorage;

// OTP expiration time in milliseconds (1 minute)
const OTP_EXPIRY_TIME = 60 * 1000;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.generateOTP = (email) => {
  const otp = otpGenerator.generate(6, { 
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true
  });
  
  // Store OTP with 1-minute expiration time
  otpStorage[email] = {
    otp,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_TIME)
  };
  
  return otp;
};

exports.verifyOTP = (email, otp) => {
  const otpData = otpStorage[email];
  
  if (!otpData) {
    return { valid: false, message: 'No OTP found for this email' };
  }
    // Check if OTP has expired
  if (new Date() > otpData.expiresAt) {
    delete otpStorage[email]; 
    return { 
      valid: false, 
      message: 'OTP has expired. Please request a new OTP using the resend option.',
      expired: true
    };
  }
  
  if (otpData.otp !== otp) {
    return { valid: false, message: 'Invalid OTP. Please try again.' };
  }
  
  // Delete OTP after successful verification
  delete otpStorage[email];
  return { valid: true, message: 'OTP verified successfully' };
};

exports.sendOTPEmail = async (email, otp, type = 'Registration OTP') => {
  let subject, heading, message;
  
  switch (type) {
    case 'Registration OTP':
      subject = 'Your Register OTP from Hospital';
      heading = 'Welcome to Syncly!';
      message = 'Thank you for registering with us. To complete your registration, please use the following OTP:';
      break;
    case 'Password Reset OTP':
      subject = 'Your Forgot Password OTP from Hospital';
      heading = 'Reset Your Password';
      message = 'You requested to reset your password. To continue with the password reset process, please use the following OTP:';
      break;
    case 'Registration Resend OTP':
      subject = 'Your Register Resend OTP from Hospital';
      heading = 'Welcome to Syncly!';
      message = 'Here is your resent registration OTP. To complete your registration, please use the following OTP:';
      break;
    case 'Password Reset Resend OTP':
      subject = 'Your Forgot Password Resend OTP from Hospital';
      heading = 'Reset Your Password';
      message = 'Here is your resent password reset OTP. To continue with the password reset process, please use the following OTP:';
      break;
    default:
      subject = 'Your Register OTP from Hospital';
      heading = 'Welcome to Syncly!';
      message = 'Thank you for registering with us. To complete your registration, please use the following OTP:';
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #333;">${heading}</h2>
        <p>${message}</p>        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${otp}
        </div>
        <p style="color: #e74c3c; font-weight: bold;">⚠️ This OTP is valid for only 1 minute.</p>
        <p>If the OTP expires, you will need to request a new one using the resend option.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
        <p style="margin-top: 30px; font-size: 12px; color: #777;">
          This is an automated email. Please do not reply to this email.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};
