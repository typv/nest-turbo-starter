# Test Configuration

**Last Updated**: {date}
**Default Environment**: {local|staging}

## Environments

| Environment | Base URL | Purpose |
|------------|----------|---------|
| Local | http://localhost:{port} | Development testing |
| Staging | {staging-url} | Pre-release validation |
| Production | {prod-url} | Smoke tests only |

## Test Accounts

> **Security**: Never commit real passwords here. Use env var references or vault paths.
> AI agents: read credentials from the env var or command shown in the Password column.

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| Admin | {admin-email} | `$TEST_ADMIN_PASSWORD` | Full CRUD, user management, settings |
| Regular User | {user-email} | `$TEST_USER_PASSWORD` | Own data CRUD, read shared resources |
| Read-Only | {viewer-email} | `$TEST_VIEWER_PASSWORD` | Read-only access, no mutations |
| Unauthenticated | _(none)_ | _(none)_ | Public endpoints only |

### How to retrieve credentials

```bash
# From .env file (local)
source .env && echo $TEST_ADMIN_PASSWORD

# From vault (staging/production)
{vault-command-here}
```

## API Authentication

| Method | Header/Field | Example |
|--------|-------------|---------|
| {Bearer Token / API Key / Cookie} | `Authorization: Bearer {token}` | Login via `POST {base-url}/api/auth/login` with account above |

### Login command (for AI agents)

```bash
# Get auth token for Admin
curl -s -X POST {base-url}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "{admin-email}", "password": "'$TEST_ADMIN_PASSWORD'"}' \
  | jq -r '.token'
```

## Database

| Environment | Connection | Seed Command | Reset Command |
|------------|-----------|--------------|---------------|
| Local | `postgresql://localhost:{port}/{db}` | `{seed-command}` | `{reset-command}` |
| Staging | `{connection-string-ref}` | N/A (read-only) | N/A |

## Prerequisites Checklist

- [ ] Target environment is running (`curl -f {base-url}/health`)
- [ ] `.env` file has `TEST_ADMIN_PASSWORD`, `TEST_USER_PASSWORD`, `TEST_VIEWER_PASSWORD`
- [ ] Database is seeded: `{seed-command}`
- [ ] VPN connected (if targeting staging)

## Test Data

### Fixture Data
- {Describe what the seed creates, e.g., "10 users, 5 products, 3 orders"}
- Referenced in test cases as: "existing user `testuser@example.com`"

### Cleanup After Run
```bash
{cleanup-command}
```

## Execution Notes

- **API tests**: Use `curl`, Postman, or Playwright API context
- **UI tests**: Chrome headless preferred, viewport 1280x720
- **Timeouts**: API responses expected within 5s, page loads within 10s
- **Rate limits**: {rate-limit-info, e.g., "100 req/min per IP on staging"}
- {Any known flaky areas, environment quirks, or workarounds}
