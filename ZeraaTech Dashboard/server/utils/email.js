import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.INVITE_FROM_EMAIL,
    pass: process.env.INVITE_EMAIL_PASSWORD,
  },
});

export async function sendInvitationEmail({ toEmail, toName, role, token }) {
  const base = process.env.CLIENT_URL || "http://localhost:3000";
  const acceptUrl = `${base}/invite/${token}?action=accept`;
  const denyUrl   = `${base}/invite/${token}?action=deny`;
  const roleLabel = role === "admin" ? "Admin" : "Farmer";

  await transporter.sendMail({
    from: `"ZeraaTech" <${process.env.INVITE_FROM_EMAIL}>`,
    to: toEmail,
    subject: "You've been invited to ZeraaTech",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#16a34a;margin-bottom:8px">ZeraaTech Invitation</h2>
        <p style="color:#374151">Hi ${toName || toEmail},</p>
        <p style="color:#374151">
          You have been invited to join <strong>ZeraaTech Smart Agriculture</strong> as a <strong>${roleLabel}</strong>.
        </p>
        <p style="color:#374151">Click one of the buttons below to respond:</p>
        <div style="margin:28px 0;display:flex;gap:12px">
          <a href="${acceptUrl}"
             style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:12px">
            Accept
          </a>
          <a href="${denyUrl}"
             style="background:#ef4444;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
            Deny
          </a>
        </div>
        <p style="color:#9ca3af;font-size:13px">This invitation expires in 7 days.</p>
      </div>
    `,
  });
}
