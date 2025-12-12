| Variable       | Purpose                                      | Default     | Required  | Apps                  |
| -------------- | -------------------------------------------- | ----------- | --------- | --------------------- |
| NODE_ENV       | Node runtime environment                     | development | ❌        | api                   |
| HOSTNAME       | Hostname or base URL of the app              | -           | ✅        | api                   |
| AUTH_URL       | Dashboard URL (where auth routes are hosted) | -           | ✅        | api                   |
| SITE_URL       | Public URL of the site                       | -           | ✅        | api                   |
| SUPPORT_EMAIL  | Email address for support contact            | -           | ✅        | api                   |
| DATABASE_URL   | Database connection string                   | -           | ✅        | api                   |
| RESEND_API_KEY | Resend full-access API key                   | -           | ✅        | api                   |
| VITE_API_URL   | Backend API URL for frontend                 | -           | ✅        | web                   |
| VITE_SITE_URL  | Public site URL                              | -           | ✅        | web                   |
| VITE_AUTH_URL  | Dashboard URL (where auth routes are hosted) | -           | ✅        | api, web              |
| JWT_SECRET     | Secret key for signing JWTs                  | -           | ✅        | web                   |
