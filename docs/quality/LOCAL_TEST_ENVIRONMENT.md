# Local Test Environment

## Automatic environment selection

| Where the app runs | Data source | Visible indicator |
| --- | --- | --- |
| `localhost`, `127.0.0.1`, `::1` via `npm run dev` | Firebase DEV (`lakeducation-dev`) | Green development bar |
| `localhost`, `127.0.0.1`, `::1` via `npm run dev:emulator` | Firebase Local Emulator (`demo-lakeducation`) | Green emulator bar |
| `lakeducation.edu.vn`, `erp.lakeducation.edu.vn` | Production Firebase (`lakeducation`) | None |

The application uses the same business source code in every environment. Only Firebase bootstrap configuration differs. A browser outside localhost is blocked if it is configured to request the local emulator.

## Daily local test flow

1. For normal development using the cloned cloud data, run `npm run dev` and open the printed localhost URL.
   - Danh bạ tài khoản & mật khẩu các vai trò trên DEV DB: [`docs/LOCAL_DEV_ACCOUNTS.md`](file:///Volumes/DATA/projects/ThiEducation/docs/LOCAL_DEV_ACCOUNTS.md) (hoặc JSON: [`docs/local_dev_accounts.json`](file:///Volumes/DATA/projects/ThiEducation/docs/local_dev_accounts.json)).
   - Hỗ trợ chuyển đổi nhanh 1-Click qua URL: `http://localhost:3000/?sso_uid=<ID>` (VD: `ADM001`, `DIR505`, `ACA404`, `GV952`, `ACC330`, `HV151`).
2. For isolated destructive/offline checks, Terminal A: `npm run emulators`.
3. Terminal B: `npm run dev:emulator`; it seeds the fixed local fixture automatically, then starts the app.
4. Sign in with one of the seeded `test.<role>@lakeducation.test` accounts and password `LakTest@2026`.
5. After testing: `npm run test:emulator:cleanup`, then stop the Emulator.

### Google sign-in in localhost

In Emulator mode, Google sign-in is a local Firebase Emulator page, never the real Google service. On its first use, choose **Add new account** and enter one seeded test email such as `test.admin@lakeducation.test`; the Emulator creates a mock Google account. Subsequent Google sign-ins can select that local account. The seeded profiles permit both password and Google methods.

The seed and cleanup commands require `LAK_USE_FIREBASE_EMULATOR=true`; they use a hard-coded `demo-lakeducation` configuration and cannot write to production.

## Promotion to production

Only source code, Firestore rules/indexes and an explicitly approved data migration move to production. DEV documents and Emulator fixtures never move back to production. Before deploy, run the relevant regression checks and build; after deploy, run a minimal production smoke test without creating routine test data.
