const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID;

/**
 * Create a Linear issue with the given title.
 */
async function createIssue({ title }) {
  if (!LINEAR_API_KEY) {
    throw new Error("LINEAR_API_KEY is not set.");
  }
  if (!LINEAR_TEAM_ID) {
    throw new Error("LINEAR_TEAM_ID is not set.");
  }

  const mutation = `
    mutation CreateIssue($title: String!, $teamId: String!) {
      issueCreate(input: { title: $title, teamId: $teamId }) {
        success
        issue {
          id
          identifier
          title
          url
        }
      }
    }
  `;

  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: LINEAR_API_KEY,
    },
    body: JSON.stringify({
      query: mutation,
      variables: { title, teamId: LINEAR_TEAM_ID },
    }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(`Linear API error: ${result.errors[0].message}`);
  }

  if (!result.data.issueCreate.success) {
    throw new Error("Linear issue creation failed.");
  }

  return result.data.issueCreate.issue;
}

module.exports = { createIssue };
