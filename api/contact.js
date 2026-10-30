// Vercel serverless function. Configure RESEND_API_KEY and CONTACT_TO in Vercel Environment Variables.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const body = typeof req.body === "object" && req.body ? req.body : {};
  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const person = clean(body.person, 50);
  const projectType = clean(body.projectType, 100);
  const message = clean(body.message, 5000);
  if (!name || !emailPattern.test(email) || !person || !projectType || message.length < 10) {
    return res.status(400).json({ error: "Please complete all fields and enter a valid email and a message of at least 10 characters." });
  }
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  const from = process.env.CONTACT_FROM || "K&D Studio <onboarding@resend.dev>";
  if (!apiKey || !to) {
    return res.status(503).json({ error: "The contact inbox is not configured yet. Please try again later or contact us through GitHub." });
  }
  const textBody = [
    "New project enquiry from K&D Studio portfolio",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Contact preference: ${person}`,
    `Project type: ${projectType}`,
    "",
    "Message:",
    message
  ].join("\n");
  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `[Portfolio enquiry] ${projectType} — ${name}`,
        text: textBody
      })
    });
    if (!result.ok) {
      // Do not expose provider responses or credentials to the visitor.
      console.error("Email provider rejected contact form request; status:", result.status);
      return res.status(502).json({ error: "The email service could not deliver this message. Please try again later." });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact email delivery failed.");
    return res.status(502).json({ error: "The email service is temporarily unavailable. Please try again later." });
  }
};