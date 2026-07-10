# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` — run the dev server (Turbopack, Cache Components enabled).
- `pnpm build` — production build; runs the TypeScript check as part of the build (no separate typecheck script).
- `pnpm lint` — ESLint (`eslint-config-next` core-web-vitals + typescript).
- There is no test script/framework configured in this repo.

## Architecture

This is the **Next.js portal (BFF)** for the WYD private-server platform. It is a pure Backend-for-Frontend: the browser only ever speaks HTTP to this app's own Route Handlers (`src/app/api/**`); this app is the only thing that speaks gRPC, over server-only code, to a separate Go backend service called `web-api` (repo `w2pp-OpenWYD`, not in this repo).

```
Browser ──HTTP──> Next.js Route Handlers (BFF) ──gRPC(+mTLS)──> web-api :7600 ──> Postgres
```

### gRPC contract with web-api

- `proto/web.proto` is a **local copy** of the backend's proto contract — it is not generated/synced automatically from `w2pp-OpenWYD`. When adding or changing an RPC, the source of truth is the backend's `api/web/v1/web.proto`; this file must be kept byte-for-byte in sync (field numbers **and** types), since a mismatch causes a wire-format desync that corrupts responses silently rather than erroring (this has happened before — see the `class` field history in `character-normalize.ts`/`character-client.ts`).
- `src/lib/web-api/channel.ts` loads `proto/web.proto` dynamically at runtime via `@grpc/proto-loader` (no `protoc` codegen step) and owns channel credentials:
  - `WEB_API_ADDR` (default `localhost:7600`), `WEB_API_INSECURE=1` for local/insecure dev.
  - mTLS client cert (`WEB_API_CA` / `WEB_API_CLIENT_KEY` / `WEB_API_CLIENT_CRT`) is only used for a **direct** link to the webserver (e.g. local docker-compose). Behind Railway's public HTTPS edge there's no client cert to present, so plain SSL is used instead — see comments in `channel.ts`.
- Each gRPC service has its own thin client module under `src/lib/web-api/` (`client.ts` for `AccountWebService`, `character-client.ts` for `CharacterWebService`, `npc-admin-client.ts` for `NpcAdminService`), each wrapping the callback-style `@grpc/grpc-js` stub in a `Promise`-returning `rpc()`/`*Rpc()` function. Follow this pattern for new services rather than introducing a different client style.
- Route Handlers call these `rpc()` functions directly; business outcomes (e.g. `AdminResult`, `CreateResult`) travel in the response body and are mapped to HTTP status by convention (see `admin-http.ts`), while actual gRPC rejections (infra failures) always become **502**. gRPC error codes are never surfaced as arbitrary passthrough statuses.

### Auth / session

- `src/lib/auth/session.ts` wraps `iron-session` (cookie `wyd_session`) and stores `accountId`, `name`, `isLoggedIn`, and `role` (`"player" | "moderator" | "admin"`, as reported by `VerifyCredentials` at login).
- `accountId`/`moderator_id` sent to `web-api` must **always** come from the session cookie, never from the request body — this is a hard invariant across all routes (see `require-moderator.ts`).
- `require-moderator.ts`'s `requireModerator()` is a fail-fast UI-only gate (403 if the session already knows the role isn't moderator/admin); `web-api` is always the actual authorization authority and re-checks role server-side. Session role is convenience, not a security boundary.
- Mutating admin routes also call `assertSameOrigin()` (Origin-header check) since there's no CSRF-token infra yet.

### Feature areas

- `src/app/(portal)/dashboard` — reads `CharacterWebService.ListMyCharacters`, normalized via `character-normalize.ts` into a view model (`CharacterSummaryView`) for display.
- `src/app/(portal)/admin/npcs` + `src/app/api/admin/**` — moderator-only NPC editing UI/BFF over `NpcAdminService`. This is the most involved feature; **read `docs/admin-npc-editing.md` before touching it** — it documents the REST↔RPC route table, domain semantics (merchant types, shop slot layout, global item pricing), the read-only picker RPCs (`ListMerchantTemplates`/`ListItemCatalog`/`ListMapZones`) and their "empty list is a valid response" contract (depends on whether `webserver` was started with content mounted), and the operational prerequisites (migrations, moderator role seeding, tmServer overlay flag).
- `src/app/api/login`, `signup`, `logout` — thin wrappers over `AccountWebService`.

### Next.js specifics

- `cacheComponents: true` is enabled in `next.config.ts` (Next 16 Cache Components / PPR). Two project-local agent skills document how to work with this: `.agents/skills/next-cache-components-adoption` and `.agents/skills/next-cache-components-optimizer`.
- All gRPC/session code is marked `"server-only"` and must stay server-side (Route Handlers / Server Components) — the browser never sees `web-api` addresses or credentials.
