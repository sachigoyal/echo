# CLI Auth Test Plan

## Testing the new CLI auth functionality with app enrollment

### Setup

1. Start the development server: `npm run dev`
2. Create a test app in the dashboard
3. Get the app ID from the URL or database

### Test Cases

#### Case 1: Normal CLI auth flow (no app ID in URL)

- Visit: `http://localhost:3000/cli-auth`
- Should show dropdown with user's apps
- Should allow generating API key

#### Case 2: CLI auth with app ID - user already has access

- Visit: `http://localhost:3000/cli-auth?appId=<app-id>` (where user owns the app)
- Should pre-select the app
- Should show success message about pre-selection
- Should disable app selection dropdown
- Should allow generating API key

#### Case 3: CLI auth with app ID - user needs enrollment

- Visit: `http://localhost:3000/cli-auth?appId=<app-id>` (where user doesn't own the app)
- Should show "Joining app..." loading state
- Should automatically enroll user as customer
- Should pre-select the app
- Should show success message about enrollment
- Should allow generating API key

#### Case 4: CLI auth with invalid app ID

- Visit: `http://localhost:3000/cli-auth?appId=invalid-id`
- Should show error message
- Should provide options to view user's apps or go to dashboard

### API Endpoints to Test

#### POST /api/owner/apps/[id]/customers

- Test self-enrollment (empty body)
- Test enrolling existing member (should return existing membership)
- Test enrolling non-existent app (should return 404)
- Test insufficient permissions (when trying to enroll someone else)

### Manual Test Steps

1. Create two test users (User A and User B)
2. User A creates an app
3. User A gets the invite link: `http://localhost:3000/cli-auth?appId=<app-id>`
4. User B visits the invite link
5. Verify User B is automatically enrolled as customer
6. Verify User B can generate API key for the app
7. Verify User A can see User B in the customers list
