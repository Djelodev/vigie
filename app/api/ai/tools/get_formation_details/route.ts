import { handleToolRequest, extractQueryArgs } from '@/lib/ai-tools-handler'
export async function GET(req: Request) {
  return handleToolRequest('get_formation_details', extractQueryArgs(req.url), req)
}
