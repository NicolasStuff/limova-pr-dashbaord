export const PR_FRAGMENT = `
  fragment PrFields on PullRequest {
    id
    number
    title
    body
    url
    state
    isDraft
    createdAt
    updatedAt
    mergedAt
    closedAt
    additions
    deletions
    changedFiles
    headRefName
    baseRefName
    reviewDecision
    author {
      login
      avatarUrl
    }
    repository {
      nameWithOwner
    }
    labels(first: 20) {
      nodes {
        name
        color
      }
    }
    reviewRequests(first: 20) {
      nodes {
        requestedReviewer {
          ... on User {
            login
            avatarUrl
          }
          ... on Team {
            name
            avatarUrl
          }
        }
      }
    }
    reviews(first: 50) {
      totalCount
      nodes {
        id
        author {
          login
          avatarUrl
        }
        state
        body
        submittedAt
        comments {
          totalCount
        }
      }
    }
    comments {
      totalCount
    }
    commits(last: 1) {
      nodes {
        commit {
          statusCheckRollup {
            state
          }
        }
      }
    }
  }
`;

export const FETCH_PRS_QUERY = `
  ${PR_FRAGMENT}
  query FetchPRs($searchQuery: String!, $cursor: String) {
    search(query: $searchQuery, type: ISSUE, first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
          ...PrFields
        }
      }
    }
  }
`;

export const FETCH_RECENT_MERGED_QUERY = `
  ${PR_FRAGMENT}
  query FetchRecentMerged($searchQuery: String!, $cursor: String) {
    search(query: $searchQuery, type: ISSUE, first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
          ...PrFields
        }
      }
    }
  }
`;

export function buildOpenPrsSearchQuery(repoFullName: string): string {
  return `repo:${repoFullName} is:pr is:open sort:updated-desc`;
}

export function buildRecentMergedSearchQuery(
  repoFullName: string,
  daysAgo: number = 7
): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dateStr = date.toISOString().split("T")[0];
  return `repo:${repoFullName} is:pr is:merged merged:>${dateStr} sort:updated-desc`;
}
