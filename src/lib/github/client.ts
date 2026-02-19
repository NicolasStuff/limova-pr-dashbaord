import { graphql } from "@octokit/graphql";

export const githubGraphQL = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GITHUB_PAT}`,
  },
});

export async function fetchGitHub<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  try {
    const response = await githubGraphQL<T & { rateLimit?: { remaining: number; resetAt: string } }>(
      query,
      variables
    );

    if (response.rateLimit) {
      console.log(
        `[GitHub] Rate limit remaining: ${response.rateLimit.remaining}, resets at: ${response.rateLimit.resetAt}`
      );
    }

    return response;
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      (error as { status: number }).status === 403
    ) {
      console.error("[GitHub] Rate limit exceeded. Waiting before retry...");
    }
    console.error("[GitHub] GraphQL error:", error);
    throw error;
  }
}
