All environment variables are defined in a single `.env` file at the repository root.

To get started, copy the example file:

```bash
cp .env.example .env
```

| Variable       | Purpose                                      | Default     | Required | Apps |
| -------------- | -------------------------------------------- | ----------- | -------- | ---- |
| NODE_ENV       | Node runtime environment                     | development | ❌       | api  |
| HOSTNAME       | Hostname or base URL of the app              | localhost   | ❌       | api  |
| AUTH_URL       | Dashboard URL (where auth routes are hosted) | -           | ✅       | api  |
| SITE_URL       | Public URL of the site                       | -           | ✅       | api  |
| JWT_SECRET     | Secret key for signing JWTs                  | -           | ✅       | api  |
| NO_REPLY_EMAIL | Email address for no-reply sender            | -           | ✅       | api  |
| SUPPORT_EMAIL  | Email address for support contact            | -           | ✅       | api  |
| DATABASE_URL   | Database connection string                   | -           | ✅       | api  |
| RESEND_API_KEY | Resend full-access API key                   | -           | ✅       | api  |
| VITE_API_URL   | Backend API URL for frontend                 | -           | ✅       | web  |
| VITE_AUTH_URL  | Dashboard URL (where auth routes are hosted) | -           | ✅       | web  |
| VITE_SITE_URL  | Public site URL                              | -           | ✅       | web  |
