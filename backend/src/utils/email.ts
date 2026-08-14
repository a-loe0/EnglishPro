import nodemailer from 'nodemailer';

// Create transporter - in production, use actual SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@englishgopro.com';
const FROM_NAME = process.env.FROM_NAME || 'EnglishGoPro';

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<void> {
  const subject = 'Reset your EnglishGoPro password';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366F1; margin: 0; font-size: 28px;">EnglishGoPro</h1>
      </div>

      <div style="background: #f9fafb; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
        <h2 style="margin: 0 0 20px 0; color: #111827;">Reset your password</h2>
        <p style="margin: 0 0 20px 0; color: #6b7280;">Hi ${name},</p>
        <p style="margin: 0 0 20px 0; color: #6b7280;">
          We received a request to reset your password. Click the button below to choose a new password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(to right, #6366F1, #EC4899); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>

        <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
          This link will expire in 1 hour.
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>

      <div style="text-align: center; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0 0 10px 0;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="margin: 0; word-break: break-all;">
          <a href="${resetUrl}" style="color: #6366F1;">${resetUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  const text = `
Reset your EnglishGoPro password

Hi ${name},

We received a request to reset your password. Visit the link below to choose a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email.
  `.trim();

  // In development without SMTP configured, just log
  if (!process.env.SMTP_USER) {
    console.log('\n========== PASSWORD RESET EMAIL ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('===========================================\n');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`Password reset email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}
