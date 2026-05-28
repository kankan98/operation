import {
  accessGateItemIds,
  buildProductionAccessTransportGate,
  transportGateItemIds,
  type ProductionAccessTransportGateAssessment,
} from "./production-access-transport-gate"

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertNoSensitiveLeak(assessment: ProductionAccessTransportGateAssessment) {
  const text = JSON.stringify(assessment)
  const forbidden = [
    "sk-",
    "postgres://",
    "DATABASE_URL",
    "Set-Cookie",
    "Authorization",
    "session_ref",
    "operation_session=",
    "raw prompt",
    "ACME_ACCOUNT",
    "DNS_TOKEN",
  ]

  for (const token of forbidden) {
    expect(!text.includes(token), `assessment leaked sensitive token: ${token}`)
  }
}

function main() {
  const assessment = buildProductionAccessTransportGate()

  expect(
    assessment.stage === "implementation_ready",
    "gate should be ready for implementation planning",
  )
  expect(
    assessment.controlledRealTrialReady === false,
    "planning gate must not open controlled real trial",
  )
  expect(
    assessment.sections.map((section) => section.id).join(",") ===
      "production_access,https_transport",
    "sections should stay in access then transport order",
  )
  expect(
    assessment.sections[0]?.items.map((item) => item.id).join(",") ===
      accessGateItemIds.join(","),
    "production access item order should stay stable",
  )
  expect(
    assessment.sections[1]?.items.map((item) => item.id).join(",") ===
      transportGateItemIds.join(","),
    "HTTPS transport item order should stay stable",
  )
  expect(
    assessment.sections.every((section) => section.status !== "ready"),
    "runtime sections should not be ready in a planning-only wave",
  )
  expect(
    assessment.sections
      .flatMap((section) => section.items)
      .every((item) => item.status === "planned" || item.status === "blocked"),
    "items should only be planned or blocked before runtime implementation",
  )
  expect(
    assessment.currentBlockers.some((blocker) => blocker.includes("登录")),
    "access blockers should mention production login",
  )
  expect(
    assessment.currentBlockers.some((blocker) => blocker.includes("HTTPS")),
    "transport blockers should mention HTTPS",
  )
  expect(
    assessment.safeDataBoundary.allowedDataLabel === "仅演示/脱敏数据",
    "safe data boundary should keep the current preview limited to demo data",
  )
  expect(
    assessment.nextImplementationWave.id === "production-auth-https-runtime",
    "next wave should move to production auth and HTTPS runtime implementation",
  )
  expect(
    assessment.providerSelectionCriteria.length >= 7,
    "provider selection criteria should be explicit enough for the next wave",
  )
  expect(
    assessment.transportPassCriteria.some((item) => item.includes("Secure")),
    "transport pass criteria should include secure cookie requirements",
  )
  assertNoSensitiveLeak(assessment)

  console.log("Production access transport gate check passed")
}

main()
