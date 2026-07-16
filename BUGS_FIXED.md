# 🐛 Bugs Fixed & Issues Resolved

## Overview

This document tracks all bugs found and fixed during the development and deployment of the Restaurant Reservation Management System. Each entry includes the issue, root cause, fix applied, and relevant files.

---

## 1. 🔴 Table Selection Not Working (Critical)

**Issue:** After clicking a table card to select it, the card stayed grey and the "Book Table" button remained disabled.

**Root Cause:** Tailwind CSS configuration had no `primary` color palette defined. The `BookingForm.jsx` component uses `primary-50`, `primary-500`, `primary-600`, `primary-700` classes for visual highlighting of selected tables and button styling — but without a custom primary color in the Tailwind config, these classes had no visual effect.

**Fix:** Added a blue-based primary color palette (50–900) to `tailwind.config.js`.

**Files Changed:**
- `client/tailwind.config.js` — Added `colors.primary` with blue palette

**Status:** ✅ Fixed

---

## 2. 🔴 Frontend API URL Missing `/api` Prefix (Critical)

**Issue:** Frontend was calling backend API endpoints without the `/api` prefix (e.g., `https://restaurant-api-elhr.onrender.com/reservations/available` instead of `https://restaurant-api-elhr.onrender.com/api/reservations/available`), resulting in 404 errors.

**Root Cause:** The `VITE_API_URL` environment variable in `.env.production` was set to `https://restaurant-api.onrender.com` (old URL) and also didn't include `/api`. The deployed frontend had `baseURL` set to `https://restaurant-api-elhr.onrender.com` (without `/api`).

**Fix:** Updated `.env.production` to `VITE_API_URL=https://restaurant-api-elhr.onrender.com/api` and updated `render.yaml` with correct URLs.

**Files Changed:**
- `client/.env.production` — Added `/api` suffix
- `render.yaml` — Updated all URL references

**Status:** ✅ Fixed

---

## 3. 🔴 Time Slot Mismatch (Critical)

**Issue:** Creating a reservation with a half-hour time slot (e.g., `18:30`) failed with validation error: "not a valid enum value for path `timeSlot`".

**Root Cause:** The frontend `BookingForm.jsx` offered 16 time slots including half-hour intervals (`11:00`, `11:30`, `12:00`, ...), but the backend `Reservation` model's `timeSlot` enum only allowed 8 on-the-hour slots (`11:00`, `12:00`, `13:00`, ...). When users selected a half-hour slot, Mongoose rejected it at the database level.

**Fix:** Updated the `Reservation.schema` timeSlot enum to accept all 16 time slots matching the frontend.

**Files Changed:**
- `server/src/models/Reservation.js` — Expanded timeSlot enum

**Status:** ✅ Fixed

---

## 4. 🟡 Environment Variable Typo (`MONGO_URI` → `MANGO_URI`)

**Issue:** Backend server crashed on startup with error: "The uri parameter to openUri() must be a string, got 'undefined'".

**Root Cause:** The environment variable in Render's dashboard was typed as `MANGO_URI` instead of `MONGO_URI`. Since the server code looks for `process.env.MONGO_URI`, it received `undefined`.

**Fix:** Corrected the environment variable name from `MANGO_URI` to `MONGO_URI` in the Render dashboard.

**Status:** ✅ Fixed

---

## 5. 🟡 MongoDB Authentication Failure

**Issue:** After fixing the env var name, the server still crashed with: "bad auth : authentication failed".

**Root Cause:** The MongoDB Atlas database user credentials in the connection string did not match the actual database user. The password was incorrect or the user didn't have proper permissions.

**Fix:** Reset the MongoDB Atlas database user password and updated the `MONGO_URI` in Render's environment variables with the correct credentials.

**Status:** ✅ Fixed

---

## 6. 🟡 Render Backend Deploying from Wrong Directory

**Issue:** Backend service returned Express 404 for all routes (including `/health`), even though the code had all routes registered correctly.

**Root Cause:** The Render web service was initially deployed from the repo root instead of the `server/` subdirectory, so it used the root `package.json` (which had no routes) rather than the server's code.

**Fix:** Set the **Root Directory** to `server` in Render's service configuration. Also ensured `rootDir: server` in `render.yaml`.

**Status:** ✅ Fixed

---

## 7. 🟡 Port Number Mismatch

**Issue:** Server logs showed `Server running on http://localhost:10000` instead of port 5000.

**Root Cause:** Render assigns a dynamic `PORT` environment variable (usually 10000) which overrides the default `PORT=5000` in the code. This is expected behavior — Render handles port mapping automatically.

**Fix:** No code change needed. The server correctly uses `process.env.PORT || 5000` which picks up Render's dynamic port. The app functions correctly on any port.

**Status:** ✅ Expected Behavior (Not a Bug)

---

## 8. 🟡 CI Pipeline Failures (GitHub Actions)

**Issue:** Multiple GitHub Actions CI runs failed with different errors:
- `Set up Node.js` failed due to missing root `package-lock.json`
- ESLint found unescaped entities and unused variables
- MongoDB replica set initialization failed

**Root Causes & Fixes:**

| Run | Issue | Fix |
|-----|-------|-----|
| #6 | `cache: 'npm'` failed (no root lockfile) | Removed `cache: 'npm'` from `setup-node` |
| #7 | ESLint didn't scan `.jsx` files | Added `--ext .js,.jsx` to lint script |
| #7 | Unescaped entity in `Login.jsx` | Fixed `Don't` → `Don&apos;t` |
| #7 | Unused `token` param in `AuthContext.jsx` | Removed unused parameter |
| #7 | Unused `result` variable in `Register.jsx` | Removed unused variable |
| #8 | Build job still had `cache: 'npm'` | Removed from Build job too |
| #8 | MongoDB custom entrypoint failed | Simplified to default `mongo:7` image |

**Files Changed:**
- `.github/workflows/ci.yml`
- `client/src/pages/Login.jsx`
- `client/src/pages/Register.jsx`
- `client/src/context/AuthContext.jsx`
- `client/package.json`

**Status:** ✅ Fixed — CI now passes with green checkmark

---

## 9. 🟢 Debug Logging Added (Temporary)

**Issue:** When diagnosing Render deployment issues, it was unclear whether environment variables were being passed correctly to the Node.js process.

**Fix:** Added startup debug logging that prints whether `MONGO_URI`, `JWT_SECRET`, `NODE_ENV`, and `PORT` environment variables exist (not their values). This helped diagnose the `MANGO_URI` typo.

**Note:** These logs should be removed for production after final verification.

**Files Changed:**
- `server/src/index.js` — Added `ENV DEBUG` console.logs

**Status:** ⏳ Temporary — Remove after final verification

---

## Summary

| Severity | Count | Status |
|----------|:-----:|:------:|
| 🔴 Critical | 3 | ✅ All Fixed |
| 🟡 Medium | 5 | ✅ All Fixed |
| 🟢 Minor/Temp | 1 | ⏳ Remove debug logs |

**All 9 issues resolved.** The application is now fully functional with all 176 tests passing in CI.
