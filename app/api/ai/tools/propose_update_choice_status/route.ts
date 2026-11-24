import { handleToolRequest } from '@/lib/ai-tools-handler'
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  return handleToolRequest('propose_update_choice_status', body, req)
}
