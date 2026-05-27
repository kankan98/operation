import {
  completeV0TrialRun,
  listV0TrialRuns,
  startV0TrialRun,
  trialRunUserMessage,
  updateV0TrialRunStep,
} from "./v0-trial-runs"
import type { OperatorV0Scope } from "./internal-trial-access"

type CapturedRequest = {
  body: unknown
  headers: Headers
  method: string
  url: string
}

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

function createFetcher(captured: CapturedRequest[]) {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({
      body: init?.body ? JSON.parse(String(init.body)) : null,
      headers: new Headers(init?.headers),
      method: init?.method ?? "GET",
      url: String(input),
    })

    return Response.json(
      {
        ok: true,
        requestId: "trial_runs_client_check_request",
        run: {
          id: "trialrun_client_check",
          status: "active",
          steps: [],
        },
        runs: [],
        summary: {
          activeRunCount: 1,
          completedRunCount: 0,
          issueStepCount: 0,
          latestRunId: "trialrun_client_check",
          nextAction: {
            href: "/sessions",
            label: "检查直播场次",
            stepId: "sessions",
          },
          skippedStepCount: 0,
          stepCoverage: {
            ai_review: 0,
            knowledge: 0,
            next_actions: 0,
            rackets: 0,
            sessions: 0,
            talk_tracks: 0,
          },
          totalRuns: 1,
        },
      },
      {
        status: 200,
      },
    )
  }
}

function main() {
  const scope: OperatorV0Scope = {
    actorName: "V0 运营",
    teamId: "operation_v0_live_team",
    teamName: "直播运营 V0 小组",
    tenantId: "operation_v0_tenant",
    tenantName: "V0 内部演示租户",
  }
  const captured: CapturedRequest[] = []
  const fetcher = createFetcher(captured)

  void listV0TrialRuns({
    fetcher,
    limit: 2,
    scope,
    status: "active",
  })
  expect(captured[0]?.method === "GET", "list should use GET")
  expect(
    captured[0]?.url.includes("/api/trial-runs?limit=2&status=active&"),
    "list should include limit, status, and scoped query",
  )

  void startV0TrialRun({
    evaluatorRole: "live_operator",
    fetcher,
    scope,
  })
  expect(captured[1]?.method === "POST", "start should use POST")
  expect(
    captured[1]?.headers.get("x-operation-csrf") === "v0-trial-run",
    "start should include trial run CSRF header",
  )
  expect(
    (captured[1]?.body as { evaluatorRole?: string }).evaluatorRole ===
      "live_operator",
    "start should send evaluator role",
  )

  void updateV0TrialRunStep({
    fetcher,
    input: {
      note: "复盘步骤已通过。",
      status: "passed",
    },
    runId: "trialrun_client_check",
    scope,
    stepId: "ai_review",
  })
  expect(captured[2]?.method === "PATCH", "step update should use PATCH")
  expect(
    captured[2]?.url.includes("/api/trial-runs/trialrun_client_check/steps/ai_review?"),
    "step update should target run step route",
  )

  void completeV0TrialRun({
    fetcher,
    runId: "trialrun_client_check",
    scope,
    summaryNote: "六步路径已完成。",
  })
  expect(captured[3]?.method === "PATCH", "complete should use PATCH")
  expect(
    (captured[3]?.body as { status?: string }).status === "completed",
    "complete should send completed status",
  )

  expect(
    trialRunUserMessage({ userMessage: "请检查试用运行内容" }) ===
      "请检查试用运行内容",
    "user message should prefer safe route message",
  )

  console.log("V0 trial runs client helper check passed")
}

main()
