import nodemailer from 'nodemailer';

const getTransporter = () => {
  const host = process.env.EMAIL_HOST || 
    (process.env.EMAIL_USER && process.env.EMAIL_USER.endsWith('@gmail.com') 
      ? 'smtp.gmail.com' 
      : 'smtp.ethereal.email');

  const port = Number(process.env.EMAIL_PORT) || (host === 'smtp.gmail.com' ? 465 : 587);
  const secure = process.env.EMAIL_SECURE === 'true' || (port === 465);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER || 'ethereal_user',
      pass: process.env.EMAIL_PASS || 'ethereal_pass',
    },
  });
};

const transporter = getTransporter();

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: `"Mediease Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    // If default credentials are mock, print to console as fallback for easy local dev testing
    if (
      !process.env.EMAIL_USER || 
      process.env.EMAIL_USER.includes('mock') || 
      process.env.EMAIL_USER === 'ethereal_user'
    ) {
      console.log(`\n=================== [MOCK EMAIL DISPATCH] ===================`);
      console.log(`TO:      ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`HTML CONTENT:`);
      console.log(html);
      console.log(`=============================================================\n`);
      return { success: true, message: 'Mock email logged successfully' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Mail sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Error] Failed to send email:', error.message);
    // Don't crash, return false
    return { success: false, error: error.message };
  }
};
