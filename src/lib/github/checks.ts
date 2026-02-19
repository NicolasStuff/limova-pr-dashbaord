import { fetchGitHub } from "./client";

export interface CheckRun {
  name: string;
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "WAITING" | "PENDING" | "REQUESTED";
  conclusion: "SUCCESS" | "FAILURE" | "NEUTRAL" | "CANCELLED" | "TIMED_OUT" | "ACTION_REQUIRED" | "SKIPPED" | "STALE" | null;
  detailsUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CheckSuite {
  app: { name: string; logoUrl: string | null } | null;
  status: string;
  conclusion: string | null;
  checkRuns: CheckRun[];
}

export interface PrChecksResult {
  overallStatus: "SUCCESS" | "FAILURE" | "PENDING" | "EXPECTED" | "ERROR" | null;
  checkSuites: CheckSuite[];
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  pendingChecks: number;
}

const FETCH_PR_CHECKS_QUERY = `
  query FetchPRChecks($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        commits(last: 1) {
          nodes {
            commit {
              statusCheckRollup {
                state
              }
              checkSuites(first: 20) {
                nodes {
                  app {
                    name
                    logoUrl
                  }
                  status
                  conclusion
                  checkRuns(first: 50) {
                    nodes {
                      name
                      status
                      conclusion
                      detailsUrl
                      startedAt
                      completedAt
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface ChecksResponse {
  repository: {
    pullRequest: {
      commits: {
        nodes: Array<{
          commit: {
            statusCheckRollup: {
              state: string;
            } | null;
            checkSuites: {
              nodes: Array<{
                app: { name: string; logoUrl: string | null } | null;
                status: string;
                conclusion: string | null;
                checkRuns: {
                  nodes: Array<{
                    name: string;
                    status: string;
                    conclusion: string | null;
                    detailsUrl: string | null;
                    startedAt: string | null;
                    completedAt: string | null;
                  }>;
                };
              }>;
            };
          };
        }>;
      };
    };
  };
}

export async function fetchPrChecks(
  owner: string,
  name: string,
  number: number
): Promise<PrChecksResult> {
  const data = await fetchGitHub<ChecksResponse>(FETCH_PR_CHECKS_QUERY, {
    owner,
    name,
    number,
  });

  const commitNode = data.repository.pullRequest.commits.nodes[0];
  if (!commitNode) {
    return { overallStatus: null, checkSuites: [], totalChecks: 0, passedChecks: 0, failedChecks: 0, pendingChecks: 0 };
  }

  const commit = commitNode.commit;
  const overallStatus = (commit.statusCheckRollup?.state as PrChecksResult["overallStatus"]) ?? null;

  const checkSuites: CheckSuite[] = (commit.checkSuites?.nodes ?? [])
    .filter((suite) => suite.checkRuns.nodes.length > 0)
    .map((suite) => ({
      app: suite.app,
      status: suite.status,
      conclusion: suite.conclusion,
      checkRuns: suite.checkRuns.nodes.map((run) => ({
        name: run.name,
        status: run.status as CheckRun["status"],
        conclusion: run.conclusion as CheckRun["conclusion"],
        detailsUrl: run.detailsUrl,
        startedAt: run.startedAt,
        completedAt: run.completedAt,
      })),
    }));

  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;
  let pendingChecks = 0;

  for (const suite of checkSuites) {
    for (const run of suite.checkRuns) {
      totalChecks++;
      if (run.conclusion === "SUCCESS" || run.conclusion === "NEUTRAL" || run.conclusion === "SKIPPED") {
        passedChecks++;
      } else if (run.conclusion === "FAILURE" || run.conclusion === "TIMED_OUT" || run.conclusion === "CANCELLED") {
        failedChecks++;
      } else {
        pendingChecks++;
      }
    }
  }

  return { overallStatus, checkSuites, totalChecks, passedChecks, failedChecks, pendingChecks };
}
