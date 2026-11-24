import { handleToolRequest } from '@/lib/ai-tools-handler'
export async function GET(req: Request) {
  return handleToolRequest('get_official_deadlines', {}, req)
}
