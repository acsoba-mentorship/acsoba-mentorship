const requiredEnvironment = [
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_MANAGEMENT_API_TOKEN",
  "AUTH0_EMAIL_FROM_DOMAIN",
];

const missingEnvironment = requiredEnvironment.filter(
  (name) => !process.env[name]?.trim()
);

if (missingEnvironment.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvironment.join(", ")}`
  );
}

const domain = process.env.AUTH0_DOMAIN.replace(/^https?:\/\//, "").replace(
  /\/+$/,
  ""
);
const clientId = process.env.AUTH0_CLIENT_ID;
const token = process.env.AUTH0_MANAGEMENT_API_TOKEN;
const emailFromDomain = process.env.AUTH0_EMAIL_FROM_DOMAIN
  .trim()
  .replace(/^@/, "")
  .toLowerCase();
const verificationTemplateName =
  process.env.AUTH0_VERIFICATION_TEMPLATE?.trim() || "verify_email_by_code";
const managementApi = `https://${domain}/api/v2`;

if (
  verificationTemplateName !== "verify_email_by_code" &&
  verificationTemplateName !== "auth_email_by_code"
) {
  throw new Error(
    "AUTH0_VERIFICATION_TEMPLATE must be verify_email_by_code or auth_email_by_code"
  );
}

async function request(path, init = {}) {
  const response = await fetch(`${managementApi}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Auth0 Management API ${init.method ?? "GET"} ${path} failed ` +
        `(${response.status}): ${body}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function setPromptDescription(prompt, screen, description) {
  const path = `/prompts/${prompt}/custom-text/en`;
  const existingText = await request(path);
  await request(path, {
    method: "PUT",
    body: JSON.stringify({
      ...existingText,
      [screen]: {
        ...(existingText?.[screen] ?? {}),
        description,
      },
    }),
  });
}

function getEmailDomain(from) {
  if (typeof from !== "string") return null;
  const match = from.trim().match(/@([a-z0-9.-]+\.[a-z]{2,})(?:>|$)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

await request(`/clients/${encodeURIComponent(clientId)}`, {
  method: "PATCH",
  body: JSON.stringify({
    name: "Shepherds Programme",
  }),
});

const [emailProvider, verificationTemplate] = await Promise.all([
  request("/emails/provider"),
  request(`/email-templates/${verificationTemplateName}`),
]);

await Promise.all([
  setPromptDescription(
    "signup-id",
    "signup-id",
    "Sign-up to continue to the Shepherds Programme."
  ),
  setPromptDescription(
    "signup-password",
    "signup-password",
    "Set your password to continue to the Shepherds Programme."
  ),
  setPromptDescription(
    "signup",
    "signup",
    "Sign-up to continue to the Shepherds Programme."
  ),
]);

const providerConfigured =
  emailProvider &&
  emailProvider.enabled === true &&
  typeof emailProvider.name === "string" &&
  emailProvider.name.toLowerCase() !== "auth0";
const senderDomain = getEmailDomain(verificationTemplate?.from);
const templateConfigured =
  verificationTemplate &&
  verificationTemplate.enabled === true &&
  senderDomain === emailFromDomain &&
  typeof verificationTemplate.subject === "string" &&
  verificationTemplate.subject.trim().length > 0 &&
  typeof verificationTemplate.body === "string" &&
  /\{\{[^}]*\bcode\b[^}]*\}\}/i.test(verificationTemplate.body);

if (!providerConfigured || !templateConfigured) {
  const failures = [
    !providerConfigured
      ? "a custom, enabled email provider"
      : null,
    !templateConfigured
      ? `an enabled ${verificationTemplateName} template with a {{ code }} token, subject, and sender at ${emailFromDomain}`
      : null,
  ].filter(Boolean);

  throw new Error(
    `Auth0 branding was updated, but production email is not ready: configure ${failures.join(
      " and "
    )}. See docs/auth0-branding-and-email.md.`
  );
}

console.log(
  `Configured Auth0 client "${clientId}", sign-up screens, and verified the ${verificationTemplateName} email template/provider.`
);
