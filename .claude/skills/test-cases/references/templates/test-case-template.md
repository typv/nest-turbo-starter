# Test Cases: UC-{MODULE}-{NNN} — {UC Title}

**Related UC**: [UC-{MODULE}-{NNN}](../../docs/usecases/{module}/uc-{module}-{nnn}-{slug}.md)
**Module**: {module-name}
**Last Updated**: {date}

---

## TC-{MODULE}-{NNN}-01: {Happy path scenario}

- **Type**: Positive
- **Priority**: Critical | High | Medium | Low
- **Method**: API | UI | CLI
- **Precondition**:
  - {Specific state required, e.g., "User `testuser@example.com` exists with role `admin`"}
  - {Reference test-config.md account if applicable, e.g., "Logged in as Admin (see test-config.md)"}
- **Test Data**:
  - {Concrete input values, e.g., `email: "new@example.com"`, `password: "Valid123!"`}
- **Steps**:
  1. {Specific action with details, e.g., "POST `/api/v1/auth/login` with body `{email, password}`"}
  2. {Next action, e.g., "Extract `token` from response body"}
- **Expected Result**:
  - {Verifiable outcome, e.g., "Status 200, response body contains `{token: string, user: {id, email}}`"}
- **Actual Result**: __{fill on execution}__
- **Status**: Pending | Pass | Fail | Blocked

---

## TC-{MODULE}-{NNN}-02: {Negative scenario}

- **Type**: Negative
- **Priority**: High
- **Method**: API | UI | CLI
- **Precondition**:
  - {Setup state}
- **Test Data**:
  - {Invalid/edge input values, e.g., `email: "not-an-email"`, `password: ""`}
- **Steps**:
  1. {Action with invalid input, e.g., "POST `/api/v1/auth/login` with invalid body"}
- **Expected Result**:
  - {Specific error, e.g., "Status 422, body contains `{error: 'Invalid email format'}`"}
- **Actual Result**: __{fill on execution}__
- **Status**: Pending | Pass | Fail | Blocked

---

## TC-{MODULE}-{NNN}-03: {Edge case scenario}

- **Type**: Edge
- **Priority**: Medium
- **Method**: API | UI | CLI
- **Precondition**:
  - {Setup state}
- **Test Data**:
  - {Boundary values, e.g., `name: ""` (empty), `name: "a".repeat(256)` (max+1)}
- **Steps**:
  1. {Boundary action}
- **Expected Result**:
  - {Specific outcome with exact values/codes}
- **Actual Result**: __{fill on execution}__
- **Status**: Pending | Pass | Fail | Blocked

---

## TC-{MODULE}-{NNN}-04: {Security scenario}

- **Type**: Security
- **Priority**: High
- **Method**: API | UI | CLI
- **Precondition**:
  - {Setup state, e.g., "Logged in as Regular User (see test-config.md)"}
- **Test Data**:
  - {Payload for security test, e.g., `id: "other-users-uuid"`}
- **Steps**:
  1. {Security action, e.g., "GET `/api/v1/users/{other-user-id}` with Regular User token"}
- **Expected Result**:
  - {Security enforcement, e.g., "Status 403 Forbidden, no user data leaked in response"}
- **Actual Result**: __{fill on execution}__
- **Status**: Pending | Pass | Fail | Blocked
