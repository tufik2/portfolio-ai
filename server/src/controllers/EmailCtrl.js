import nodemailer from 'nodemailer';

// Escapes user-provided text before putting it in an HTML email.
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default class EmailCtrl {
  static #transporter = null;

  // SMTP transport built from the EMAIL_* variables in server/.env.
  static #getTransporter() {
    if (!EmailCtrl.#transporter) {
      EmailCtrl.#transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    return EmailCtrl.#transporter;
  }

  /**
   * Checks the SMTP connection and login without sending anything.
   * @returns {Promise<true>}
   */
  static verify() {
    return EmailCtrl.#getTransporter().verify();
  }

  /**
   * Sends one email. `from` defaults to EMAIL_FROM, which must be an address
   * (or domain) verified in Amazon SES.
   * @returns {Promise<object>} nodemailer's send info (messageId, accepted…)
   */
  static send({ to, subject, text, html, from = process.env.EMAIL_FROM }) {
    if (!from) {
      throw new Error('EMAIL_FROM is not set in server/.env.');
    }
    return EmailCtrl.#getTransporter().sendMail({ from, to, subject, text, html });
  }

  /**
   * Email sent right after a user registers, with the link that verifies
   * their email address and completes the registration.
   * @param {{firstName: string, email: string}} user
   * @param {string} verifyUrl e.g. https://app.example.com/verify-email?token=…
   */
  static sendRegistration(user, verifyUrl) {
    const name = escapeHtml(user.firstName);
    const url = escapeHtml(verifyUrl);
    return EmailCtrl.send({
      to: user.email,
      subject: 'Verify your email address',
      text: [
        `Hi ${user.firstName},`,
        '',
        `Your account for ${user.email} has been created.`,
        'To complete your registration, verify your email address by opening this link:',
        '',
        verifyUrl,
        '',
        'If you did not create this account, you can ignore this email.',
      ].join('\n'),
      html: `
        <p>Hi ${name},</p>
        <p>Your account for <strong>${escapeHtml(user.email)}</strong> has been created.</p>
        <p>To complete your registration, verify your email address:</p>
        <p>
          <a href="${url}"
             style="display:inline-block;padding:10px 20px;background:#2563eb;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">
            Verify email
          </a>
        </p>
        <p>Or copy this link into your browser:<br><a href="${url}">${url}</a></p>
        <p>If you did not create this account, you can ignore this email.</p>
      `,
    });
  }

  /**
   * Email with a 6-digit sign-in code.
   * @param {{firstName: string, email: string}} user
   * @param {string} code
   * @param {number} expiresInMinutes
   */
  static sendLoginCode(user, code, expiresInMinutes) {
    return EmailCtrl.send({
      to: user.email,
      subject: 'Your sign-in code',
      text: [
        `Hi ${user.firstName},`,
        '',
        `Your sign-in code is ${code}.`,
        `It expires in ${expiresInMinutes} minutes.`,
        '',
        "If you didn't try to sign in, you can ignore this email.",
      ].join('\n'),
      html: `
        <p>Hi ${escapeHtml(user.firstName)},</p>
        <p>Your sign-in code is:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:16px 0">${escapeHtml(code)}</p>
        <p>It expires in ${Number(expiresInMinutes)} minutes.</p>
        <p>If you didn't try to sign in, you can ignore this email.</p>
      `,
    });
  }
}
