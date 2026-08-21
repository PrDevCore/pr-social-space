import "server-only";
import nodemailer from "nodemailer";

/**
 * Transactional email via SMTP (nodemailer).
 *
 * Configure with these env vars (see .env.example):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 *
 * When SMTP is not configured, sendMail() logs and no-ops so local dev and
 * preview deploys never fail because of email.
 */

const SITE_NAME = "Social Hub";

let cachedTransport: nodemailer.Transporter | null | undefined;

function getTransport(): nodemailer.Transporter | null {
  if (cachedTransport !== undefined) return cachedTransport;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("mail: SMTP not configured, emails will be skipped.");
    cachedTransport = null;
    return cachedTransport;
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransport;
}

function mailFrom(): string {
  return process.env.MAIL_FROM ?? `${SITE_NAME} <no-reply@prsocialhub.space>`;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const transport = getTransport();
  if (!transport) return false;
  try {
    await transport.sendMail({
      from: mailFrom(),
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return true;
  } catch (err) {
    console.error("mail: failed to send:", err);
    return false;
  }
}

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:20px;">${title}</h1>
      ${bodyHtml}
      <p style="margin-top:28px;font-size:12px;color:#888;">
        You received this because you created a ${SITE_NAME} account.
      </p>
    </div>
  </body>
</html>`;
}

export async function sendWelcomeEmail(user: {
  name: string;
  email: string;
}): Promise<boolean> {
  const firstName = user.name.split(" ")[0] || "there";
  const text = [
    `Hi ${firstName},`,
    "",
    `Welcome to ${SITE_NAME}! Your account is ready.`,
    "",
    "Here's how to get started:",
    "1. Connect your first social platform from the dashboard sidebar.",
    "2. Pick your billing currency (USD, NGN or GBP).",
    "3. Compose your first post - publish it now or schedule it.",
    '4. When it\'s live, use the Campaigns tab to boost it as an ad.',
    "",
    `- The ${SITE_NAME} team`,
  ].join("\n");

  const html = layout(
    `Welcome to ${SITE_NAME}, ${firstName}!`,
    `
      <p style="margin:0 0 12px;">Your account is ready. Here's how to get started:</p>
      <ol style="margin:0 0 16px;padding-left:20px;line-height:1.7;">
        <li>Connect your first social platform from the dashboard sidebar.</li>
        <li>Pick your billing currency (USD, NGN or GBP).</li>
        <li>Compose your first post &mdash; publish it now or schedule it.</li>
        <li>When it's live, use the <strong>Campaigns</strong> tab to boost it as an ad.</li>
      </ol>
      <a href="${process.env.APP_URL ?? "https://prsocialhub.space"}/dashboard"
         style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;border-radius:12px;padding:12px 24px;font-weight:600;font-size:14px;">
        Open your dashboard
      </a>
    `
  );

  return sendMail({
    to: user.email,
    subject: `Welcome to ${SITE_NAME}`,
    text,
    html,
  });
}
