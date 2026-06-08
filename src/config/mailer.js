const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525', 10),
  auth: {
    user: process.env.SMTP_USER || 'dummy',
    pass: process.env.SMTP_PASS || 'dummy',
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@shopmanager.com',
      to,
      subject,
      html,
    };

    if (process.env.NODE_ENV === 'test' || (!process.env.SMTP_USER || process.env.SMTP_USER === 'dummy_user')) {
      logger.info(`[Email Sandbox] To: ${to} | Subject: ${subject}`);
      return { messageId: 'sandbox-mock-id' };
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    throw error;
  }
};

module.exports = { transporter, sendEmail };
