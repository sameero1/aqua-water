import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

let client;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

export async function sendSms(to, message) {
  if (!client || !fromNumber) {
    console.warn('Twilio is not configured. SMS payload was not sent.', { to, message });
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to,
    });
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('Failed to send SMS', error);
    return { success: false, error: error.message };
  }
}
