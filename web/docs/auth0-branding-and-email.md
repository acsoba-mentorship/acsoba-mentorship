# Auth0 branding and verification email

The sign-up screen in the feedback deck is Auth0 Universal Login, not a page
rendered by this Next.js application. Its “continue to …” copy comes from the
Auth0 application name. Verification-message inbox placement also depends on
the Auth0 tenant's mail provider and the sending domain's DNS.

## Apply the application-owned configuration

Create a short-lived Auth0 Management API token with these scopes:

- `update:clients`
- `read:prompts`
- `update:prompts`
- `read:email_provider`
- `read:email_templates`

Then run:

```bash
AUTH0_DOMAIN="tenant.example.auth0.com" \
AUTH0_CLIENT_ID="your_application_client_id" \
AUTH0_MANAGEMENT_API_TOKEN="short_lived_management_api_token" \
AUTH0_EMAIL_FROM_DOMAIN="members.shepherds.example.org" \
npm run auth:configure
```

The script renames the Universal Login client to **Shepherds Programme** and
sets the English `signup-id`, `signup-password`, and standard `signup` text.
It first reads and merges each existing prompt dictionary because Auth0's
update endpoint replaces the whole dictionary.

The deck shows code-based verification, so the readiness check defaults to the
`verify_email_by_code` template. If the tenant uses an authentication email
challenge instead, also set:

```bash
AUTH0_VERIFICATION_TEMPLATE="auth_email_by_code"
```

The check fails unless the tenant has an enabled custom email provider and the
selected code template is enabled, contains `{{ code }}`, has a subject, and
uses the exact `AUTH0_EMAIL_FROM_DOMAIN`. Keep the Management API token out of
committed environment files and CI logs.

## Complete the mail-provider setup

Before production rollout:

1. Send verification mail through a dedicated programme subdomain, such as
   `members.shepherds.example.org`, using the organisation's transactional
   email provider rather than Auth0's test sender.
2. Publish and verify the provider's SPF and DKIM records for that subdomain.
3. Publish DMARC, begin with reporting enabled, and review aggregate reports
   before moving to a stricter policy.
4. Use a stable, monitored `From` address and a matching reply/support address.
5. Test sign-up with representative Gmail, Outlook, and organisational
   mailboxes. Check spam placement and provider delivery logs.

Application code cannot guarantee inbox placement. DNS authentication, sender
reputation, suppression lists, and tenant/provider configuration must be
validated in the production environment.
