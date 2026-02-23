export const otpTemplate = ({ email, otpCode, expiresInMinutes, purpose }) => {
  const title = purpose === "reset-password" ? "Reset your password" : "Verify your request";

  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 16px; color: #111827;">
    <h2 style="margin: 0 0 12px;">${title}</h2>
    <p style="margin: 0 0 8px;">Hi ${email},</p>
    <p style="margin: 0 0 16px;">Use this OTP to continue:</p>
    <div style="font-size: 28px; letter-spacing: 6px; font-weight: bold; margin: 0 0 16px;">${otpCode}</div>
    <p style="margin: 0;">This code expires in ${expiresInMinutes} minutes.</p>
  </div>
  `;
};
