# Step 4 — Authentication Test Scenarios

## Prerequisites
- A user must be registered before testing login
- Test user: `{ firstName: 'Test', lastName: 'User', email: 'test@example.com', password: 'password123' }`

---

## Scenario 1: Login page renders
- **Request:** `GET /session/new`
- **Expected status:** 200
- **Expected body:** contains form with `action="/session"`, fields `data[email]`, `data[password]`

## Scenario 2: Successful login
- **Precondition:** user registered with email `test@example.com`, password `password123`
- **Request:** `POST /session` with body `data[email]=test@example.com&data[password]=password123`
- **Expected status:** 302
- **Expected redirect:** `/`
- **Expected session:** `userId` is set (subsequent requests have `currentUser`)
- **Verification:** `GET /` after login should show "Выход" button in nav (not "Вход")

## Scenario 3: Failed login — wrong password
- **Precondition:** user registered with email `test@example.com`
- **Request:** `POST /session` with body `data[email]=test@example.com&data[password]=wrongpass`
- **Expected status:** 200 (re-renders the form, does NOT redirect)
- **Expected body:** login form is shown again

## Scenario 4: Failed login — non-existent email
- **Request:** `POST /session` with body `data[email]=nobody@example.com&data[password]=anything`
- **Expected status:** 200
- **Expected body:** login form is shown again

## Scenario 5: Logout
- **Precondition:** user is logged in (session cookie from Scenario 2)
- **Request:** `DELETE /session` (via `POST /session` with `_method=delete`)
- **Expected status:** 302
- **Expected redirect:** `/`
- **Expected session:** cleared (no longer authenticated)
- **Verification:** `GET /` after logout should show "Вход" link (not "Выход")

## Scenario 6: Protected routes — edit user (not logged in)
- **Request:** `GET /users/1/edit` (no session cookie)
- **Expected status:** 403
- **Expected redirect:** `/users`

## Scenario 7: Protected routes — edit other user's profile
- **Precondition:** logged in as user ID=1
- **Request:** `GET /users/2/edit`
- **Expected status:** 403
- **Expected redirect:** `/users`

## Scenario 8: Protected routes — edit own profile (success)
- **Precondition:** logged in as user ID=1
- **Request:** `GET /users/1/edit`
- **Expected status:** 200
- **Expected body:** edit form with user's data

## Scenario 9: Protected routes — delete other user
- **Precondition:** logged in as user ID=1
- **Request:** `DELETE /users/2`
- **Expected status:** 403

## Scenario 10: Protected routes — delete own account
- **Precondition:** logged in as user ID=1
- **Request:** `DELETE /users/1`
- **Expected status:** 302
- **Expected redirect:** `/users`
- **Expected DB:** user ID=1 no longer exists
- **Expected session:** destroyed (logged out)

## Scenario 11: Nav links change based on auth state
- **Not logged in:** nav contains "Вход" and "Регистрация" links
- **Logged in:** nav contains "Выход" button, no "Вход"/"Регистрация"
