/**
 * Validate that the request carries the correct pipeline secret key.
 * Used by internal API routes called by GitHub Actions.
 */
export function validatePipelineKey(req: Request): boolean {
  const key = req.headers.get('x-pipeline-key');
  return key === process.env.PIPELINE_SECRET_KEY;
}
