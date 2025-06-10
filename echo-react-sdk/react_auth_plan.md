Below is a battle-tested pattern that lets **any customer SPA complete a PKCE flow with _no_ backend of their own**, while Echo remains the only server in the picture.

---

## 1 ⃣ High-level flow (Authorization Code + PKCE, browser-only)

1. **Redirect to Echo’s authorize endpoint**

   ```ts
   const codeVerifier = crypto.randomUUID().replace(/-/g, '');
   const codeChallenge = base64url(
     await crypto.subtle.digest(
       'SHA-256',
       new TextEncoder().encode(codeVerifier)
     )
   );
   const authUrl =
     `https://echo.merit.systems/oauth/authorize` +
     `?response_type=code&client_id=${ECHO_PUBLIC_KEY}` +
     `&redirect_uri=${encodeURIComponent(window.location.origin + '/echo/callback')}` +
     `&code_challenge=${codeChallenge}&code_challenge_method=S256` +
     `&state=${crypto.randomUUID()}`;
   window.location.href = authUrl;
   ```

2. **User lands on Clerk UI at `echo.merit.systems`, signs in with GitHub.**

3. **Echo redirects back to the SPA**
   `https://app.customer.tld/echo/callback?code=XYZ&state=…`

4. **SPA exchanges the one-time code**

   ```ts
   const res = await fetch('https://echo.merit.systems/oauth/token', {
     method: 'POST',
     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
     body: new URLSearchParams({
       grant_type: 'authorization_code',
       client_id: ECHO_PUBLIC_KEY, // public
       code_verifier: codeVerifier, // from step 1
       code: returnedCode,
       redirect_uri: window.location.origin + '/echo/callback',
     }),
   }); // CORS-enabled on Echo’s side
   const { access_token, expires_in, refresh_token } = await res.json();
   ```

5. **Store tokens**

   - `access_token` (JWT, 5–10 min TTL) → **memory** (React context)
   - `refresh_token` → **HttpOnly, Secure, SameSite=None cookie set by `/oauth/token` response**
     _Because the request is a direct cross-origin call to Echo (not a passive third-party cookie), Chrome’s 3P-cookie phase-out does **not** block this cookie._

6. **Silent refresh**
   _Every `N-1` minutes_ the SDK runs

   ```ts
   await fetch('https://echo.merit.systems/oauth/token', {
     method: 'POST',
     credentials: 'include', // sends refresh-token cookie
     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
     body: new URLSearchParams({ grant_type: 'refresh_token' }),
   });
   ```

   Echo rotates the refresh token each time (refresh-token rotation) and returns a new access token. ([auth0.com][1])

---

## 2 ⃣ Why this satisfies PKCE _and_ “no customer backend”

| Goal                           | How this design meets it                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PKCE security**              | The SPA never handles a client secret; the _verifier/challenge_ pair proves possession to Echo, preventing intercepted-code attacks. ([rfc-editor.org][2])                      |
| **No server at customer**      | All exchanges happen via `fetch` from the browser; Echo’s `/oauth/token` endpoint is CORS-enabled for registered origins.                                                       |
| **No long-lived secret in JS** | Access token lives only in memory; refresh token is HttpOnly and rotates.                                                                                                       |
| **Works without 3P cookies**   | Because the token call is an explicit top-level `fetch` to Echo, the cookie is considered _first-party at request time_ and survives Chrome’s 3P phase-out.                     |
| **Familiar to auditors**       | This is exactly the “SPA Public Client + PKCE” flow recommended by OAuth 2.1 drafts and widely implemented by Auth0, Okta, Azure AD, etc. ([docs.spring.io][3], [auth0.com][4]) |

---

## 3 ⃣ React tooling

| Library                                         | What it gives you                                                                                                                                                       |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`oidc-client-ts`**                            | Battle-tested PKCE client; handles code-verifier storage, silent refresh (via hidden iframe or `fetch`), event hooks. GitHub demo shows React wiring. ([github.com][5]) |
| **`react-oauth2-code-pkce`** / **`react-pkce`** | Lightweight hooks if you want to wrap the flow yourself.                                                                                                                |
| **Auth0 SPA SDK (open-source)**                 | Even if you don’t use Auth0, the source is a good reference for in-memory token caches + rotating refresh cookies. ([auth0.com][4])                                     |

Your `<EchoProvider>` can simply wrap one of these, expose:

```ts
const { signedIn, balance, signIn, signOut } = useEcho();
```

and hide all the PKCE / refresh logic.

---

## 4 ⃣ Security checklist to bake into Echo

1. **CORS:** Token endpoint only allows `Origin`s registered per customer instance.
2. **CSRF:** Require `Origin` + `state` validation on `/oauth/token`.
3. **Scopes:** Mint JWTs with narrow `aud: "echo-proxy"`, include `credits_remaining`.
4. **ROTATE refresh tokens** and revoke on first misuse (Auth0-style).
5. **Replay defence:** 5-minute max auth-code lifetime + single-use.
6. **`Strict-Transport-Security`** & `X-Frame-Options: DENY` on echo.merit.systems UI.
7. **Remove `?code=` from history** after exchange (`history.replaceState`).

---

### TL;DR

Use the **standard Authorization-Code + PKCE** flow exactly as browsers expect, but let the **SPA itself hit Echo’s `/oauth/token`** over CORS to trade the code for tokens.
Store the short-lived access token in memory, the refresh token in an HttpOnly rotating cookie, and ship a tiny React SDK (built on `oidc-client-ts` or similar) so customers get a `<EchoSignIn>` button with zero backend work.

[1]: https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation?utm_source=chatgpt.com 'Refresh Token Rotation - Auth0'
[2]: https://www.rfc-editor.org/rfc/rfc8252?utm_source=chatgpt.com 'RFC 8252: OAuth 2.0 for Native Apps - RFC Editor'
[3]: https://docs.spring.io/spring-authorization-server/reference/guides/how-to-pkce.html?utm_source=chatgpt.com 'How-to: Authenticate using a Single Page Application with PKCE'
[4]: https://auth0.com/docs/libraries/auth0-single-page-app-sdk?utm_source=chatgpt.com 'Auth0 Single Page App SDK'
[5]: https://github.com/kdhttps/react-oidc-client-ts?utm_source=chatgpt.com 'kdhttps/react-oidc-client-ts: React JS oidc-client-ts Demo - GitHub'
