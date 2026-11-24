import { handleToolRequest, extractQueryArgs } from '@/lib/ai-tools-handler'
export async function GET(req: Request) {
  return handleToolRequest('get_alternative_formations', extractQueryArgs(req.url), req)
}
