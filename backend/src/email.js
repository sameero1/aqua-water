import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'Barcode Payment App <no-reply@example.com>';

let sharedTransporter;

async function getTransporter() {
  if (sharedTransporter) {
    return sharedTransporter;
  }

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    sharedTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    sharedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return sharedTransporter;
}

export async function sendOtpEmail(email, otp) {
  const transporter = await getTransporter();
  const message = {
    from: smtpFrom,
    to: email,
    subject: 'Your Barcode Payment App OTP',
    text: `Use the following one-time code to sign in:\n\n${otp}\n\nThis code expires in 10 minutes.`,
    html: `<p>Use the one-time login code below:</p><p><strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
  };

  const info = await transporter.sendMail(message);
  const previewUrl = nodemailer.getTestMessageUrl(info);

  return {
    messageId: info.messageId,
    previewUrl,
  };
}
