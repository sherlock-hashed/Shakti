import nodemailer from "nodemailer";

/**
 * Creates and returns a Nodemailer transporter configured with environment variables.
 */
function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Send an email alert for a monitor status change ("DOWN" or "RECOVERED").
 *
 * @param {Object} options
 * @param {string} options.userEmail - Destination email address.
 * @param {string} options.monitorName - Name of the monitor.
 * @param {string} options.monitorUrl - URL of the monitor.
 * @param {"DOWN" | "RECOVERED"} options.status - New state ("DOWN" or "RECOVERED").
 * @param {Date | string} options.checkedAt - Timestamp of status check.
 * @param {string} [options.errorMessage] - Optional error details for down alert.
 * @param {number} [options.statusCode] - Optional HTTP status code.
 * @returns {Promise<boolean>} True if sent successfully, false otherwise.
 */
export async function sendAlertEmail({
  userEmail,
  monitorName,
  monitorUrl,
  status,
  checkedAt,
  errorMessage,
  statusCode,
}) {
  try {
    if (!userEmail) {
      console.warn("[AlertEmail] No destination userEmail provided. Skipping email alert.");
      return false;
    }

    const transporter = createTransporter();
    if (!transporter) {
      console.warn("[AlertEmail] EMAIL_USER or EMAIL_PASS not configured in .env. Skipping email alert.");
      return false;
    }

    const isDown = status === "DOWN";
    const subject = isDown
      ? `🚨 [DOWN] Alert: ${monitorName} is unreachable`
      : `✅ [RECOVERED] ${monitorName} is back UP`;

    const formattedTime = new Date(checkedAt || Date.now()).toUTCString();

    const htmlBody = isDown
      ? `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-b: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #ef4444; margin: 0; font-size: 22px;">🚨 Monitor Alert: DOWN</h2>
          <span style="background-color: #451a03; color: #f97316; border: 1px solid #78350f; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold;">CRITICAL</span>
        </div>
        
        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
          Your monitored service <strong>${monitorName}</strong> failed its latest health check and is currently offline.
        </p>

        <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-weight: 600; width: 120px;">Monitor Name:</td>
              <td style="padding: 6px 0; color: #f8fafc;">${monitorName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Target URL:</td>
              <td style="padding: 6px 0; color: #38bdf8; word-break: break-all;">${monitorUrl}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Time (UTC):</td>
              <td style="padding: 6px 0; color: #f8fafc;">${formattedTime}</td>
            </tr>
            ${
              statusCode
                ? `<tr>
                    <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">HTTP Code:</td>
                    <td style="padding: 6px 0; color: #ef4444; font-family: monospace;">${statusCode}</td>
                  </tr>`
                : ""
            }
            ${
              errorMessage
                ? `<tr>
                    <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Reason:</td>
                    <td style="padding: 6px 0; color: #f87171; font-family: monospace;">${errorMessage}</td>
                  </tr>`
                : ""
            }
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px; text-align: center;">
          Pulseboard Automated Monitoring System &bull; You will be notified when service recovers.
        </p>
      </div>
      `
      : `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-b: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #22c55e; margin: 0; font-size: 22px;">✅ Monitor Alert: RECOVERED</h2>
          <span style="background-color: #064e3b; color: #34d399; border: 1px solid #047857; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold;">RESOLVED</span>
        </div>
        
        <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6;">
          Great news! Your monitored service <strong>${monitorName}</strong> has recovered and is responding normally.
        </p>

        <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
          <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-weight: 600; width: 120px;">Monitor Name:</td>
              <td style="padding: 6px 0; color: #f8fafc;">${monitorName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Target URL:</td>
              <td style="padding: 6px 0; color: #38bdf8; word-break: break-all;">${monitorUrl}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Recovered At:</td>
              <td style="padding: 6px 0; color: #f8fafc;">${formattedTime}</td>
            </tr>
            ${
              statusCode
                ? `<tr>
                    <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">HTTP Code:</td>
                    <td style="padding: 6px 0; color: #4ade80; font-family: monospace;">${statusCode}</td>
                  </tr>`
                : ""
            }
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b; margin-top: 24px; text-align: center;">
          Pulseboard Automated Monitoring System
        </p>
      </div>
      `;

    const info = await transporter.sendMail({
      from: `"Pulseboard Alert System" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject,
      html: htmlBody,
    });

    console.log(`✉️  Alert email sent to ${userEmail} [${status}] (MessageId: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send alert email to ${userEmail}:`, error.message);
    return false;
  }
}
