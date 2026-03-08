import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const githubToken = process.env.GH_TOKEN;
  const githubRepo = process.env.GH_REPO;
  const workflowFile = process.env.GH_WORKFLOW_FILE ?? 'publish.yml';

  if (!githubToken || !githubRepo) {
    return NextResponse.json(
      { error: 'GH_TOKEN and GH_REPO env vars are required' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true || body.dry_run === 'true';

    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: { dry_run: String(dryRun) },
        }),
      }
    );

    if (response.status === 204) {
      return NextResponse.json({ ok: true, dry_run: dryRun });
    }

    const errorData = await response.json().catch(() => ({}));
    return NextResponse.json(
      { error: errorData.message ?? 'GitHub API error', status: response.status },
      { status: response.status }
    );
  } catch (error) {
    console.error('[POST /api/pipeline/trigger]', error);
    return NextResponse.json({ error: 'Failed to trigger workflow' }, { status: 500 });
  }
}
