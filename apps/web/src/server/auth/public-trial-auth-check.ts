import {
  authSessionCookieName as serverAuthSessionCookieName,
} from "./index";
import {
  authSessionCookieName,
  decidePublicTrialRoute,
  defaultPublicTrialNextPath,
  getSafePublicTrialNextPath,
  publicTrialRedirectHeaders,
} from "../../lib/public-trial-auth";

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function expectNoSensitive(label: string, value: unknown) {
  const serialized = JSON.stringify(value);

  for (const leaked of [
    "raw_cookie_value",
    "raw_session_secret",
    "provider_session_raw",
    "postgres://operation:operation_dev_password@",
    "Bearer",
    "sk-",
  ]) {
    if (serialized.includes(leaked)) {
      throw new Error(`${label} leaked sensitive metadata`);
    }
  }
}

function expectRedirect(pathname: string, expectedLocation: string) {
  const decision = decidePublicTrialRoute({
    hasSessionCookie: false,
    origin: "https://operation.local",
    pathname,
  });

  expect(
    decision.action === "redirect",
    `${pathname} without session cookie did not redirect`,
  );
  expect(
    decision.action === "redirect" && decision.location === expectedLocation,
    `${pathname} redirected to ${decision.action === "redirect" ? decision.location : "none"}`,
  );
  expectNoSensitive(`${pathname} redirect decision`, decision);
}

function expectAllow(pathname: string, hasSessionCookie: boolean) {
  const decision = decidePublicTrialRoute({
    hasSessionCookie,
    origin: "https://operation.local",
    pathname,
  });

  expect(
    decision.action === "allow",
    `${pathname} should have passed through route gate`,
  );
  expectNoSensitive(`${pathname} allow decision`, decision);
}

function main() {
  expect(
    authSessionCookieName === serverAuthSessionCookieName,
    "Shared auth session cookie name drifted from server auth export",
  );
  expect(
    authSessionCookieName === "operation_session",
    "Unexpected auth session cookie name",
  );

  expectRedirect("/sessions", "/trial?next=%2Fsessions");
  expectRedirect("/rackets", "/trial?next=%2Frackets");
  expectRedirect("/knowledge", "/trial?next=%2Fknowledge");
  expectRedirect("/ai-review", "/trial?next=%2Fai-review");
  expectRedirect("/talk-tracks", "/trial?next=%2Ftalk-tracks");
  expectRedirect("/next-actions", "/trial?next=%2Fnext-actions");
  expectRedirect("/sessions/extra", "/trial?next=%2Fsessions");

  for (const protectedPath of [
    "/sessions",
    "/rackets",
    "/knowledge",
    "/ai-review",
    "/talk-tracks",
    "/next-actions",
  ]) {
    expectAllow(protectedPath, true);
  }

  for (const publicPath of [
    "/",
    "/trial",
    "/api/auth/session",
    "/_next/static/app.js",
    "/favicon.ico",
    "/robots.txt",
    "/unknown",
    "/session",
  ]) {
    expectAllow(publicPath, false);
  }

  for (const unsafeNext of [
    null,
    "",
    "https://evil.example/sessions",
    "//evil.example/sessions",
    "/api/auth/session",
    "/_next/static/app.js",
    "/unknown",
    "/sessions/extra",
    "/\\evil",
  ]) {
    expect(
      getSafePublicTrialNextPath(unsafeNext) === defaultPublicTrialNextPath,
      `Unsafe next path ${String(unsafeNext)} did not fall back`,
    );
  }

  expect(
    getSafePublicTrialNextPath("/sessions?from=trial") === "/sessions",
    "Known next path with query did not resolve to its safe pathname",
  );
  expect(
    getSafePublicTrialNextPath("/next-actions") === "/next-actions",
    "Known next path did not pass through",
  );

  const redirectHeaders = publicTrialRedirectHeaders();
  expect(
    redirectHeaders["Cache-Control"] === "no-store",
    "Public trial redirect headers must disable caching",
  );
  expectNoSensitive("public trial redirect headers", redirectHeaders);

  console.log("Public trial auth route decision check passed.");
}

main();
