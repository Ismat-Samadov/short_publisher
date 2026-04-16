import { NextRequest } from 'next/server';

/**
 * Validate that the request carries the correct pipeline secret key.
 * Used by internal API routes called by GitHub Actions.
 */
export function validatePipelineKey(req: Request): boolean {
  const key = req.headers.get('x-pipeline-key');
  return key === process.env.PIPELINE_SECRET_KEY;
}

/**
 * Validate that the request has a valid dashboard session cookie.
 * Used by dashboard-only API routes.
 */
export function validateSession(req: NextRequest): boolean {
  const token = req.cookies.get('sp_auth')?.value;
  return !!token && token === process.env.AUTH_TOKEN;
}
