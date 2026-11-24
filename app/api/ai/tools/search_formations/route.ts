import { handleToolRequest, extractQueryArgs } from '@/lib/ai-tools-handler'
export async function GET(req: Request) {
  return handleToolRequest('search_formations', extractQueryArgs(req.url), req)
}
