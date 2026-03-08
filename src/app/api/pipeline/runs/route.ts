import { NextResponse } from 'next/server';

export async function GET() {
  const githubToken = process.env.GH_TOKEN;
  const githubRepo = process.env.GH_REPO;
  const workflowFile = process.env.GH_WORKFLOW_FILE ?? 'publish.yml';

  if (!githubToken || !githubRepo) {
    return NextResponse.json(
      { error: 'GH_TOKEN and GH_REPO env vars are required', runs: [] },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/${workflowFile}/runs?per_page=20`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        next: { revalidate: 30 },
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message ?? 'GitHub API error', runs: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ runs: data.workflow_runs ?? [] });
  } catch (error) {
    console.error('[GET /api/pipeline/runs]', error);
    return NextResponse.json({ error: 'Failed to fetch runs', runs: [] }, { status: 500 });
  }
}
