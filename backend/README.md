# Backend runtime configuration

The application intentionally has no production secrets or default administrator credentials in source control. Configure the following environment variables through a secret manager or the deployment environment:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DB_URL` | Yes | JDBC connection URL |
| `DB_USERNAME` | Yes | Database account |
| `DB_PASSWORD` | Yes | Database password |
| `JWT_SECRET` | Yes | Stable, randomly generated secret of at least 64 UTF-8 bytes for HS512 |
| `MAIL_USERNAME` | When sending email | SMTP account |
| `MAIL_PASSWORD` | When sending email | SMTP credential or provider app password |
| `MAIL_HOST` | No | SMTP host; defaults to Gmail SMTP |
| `MAIL_PORT` | No | SMTP port; defaults to 587 |
| `APP_FRONTEND_URL` | No | Frontend origin used in email links |
| `APP_AUTH_COOKIE_SECURE` | No | Defaults to `true`; set to `false` only for local HTTP development |

Startup seeds application roles but never creates an administrator with a source-controlled or environment-provided default password. Provision an administrator through a controlled deployment process and require a unique credential; do not add an admin bootstrap password to application configuration.

The JWT key, SMTP credential, database credential, and any OAuth client secret previously committed to source must be rotated at their respective providers. Removing a value from the current files does not remove it from repository history.

Local HTTP development can override the secure-cookie default with `APP_AUTH_COOKIE_SECURE=false`. Production deployments must use HTTPS and retain `APP_AUTH_COOKIE_SECURE=true`.
