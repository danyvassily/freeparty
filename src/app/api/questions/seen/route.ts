import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestSupabase } from "@/lib/supabase/request";

const RequestSchema = z.object({
  sessionId: z.string().uuid(),
  onlineSessionId: z.string().uuid().optional(),
  participantTokens: z.array(z.string().min(12).max(200)).min(1).max(8),
  questionId: z.string().min(3),
  familyId: z.string().min(2),
});

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const supabase = getRequestSupabase(request);
  if (!supabase) return NextResponse.json({ synced: false, reason: "offline" });
  const { data, error } = await supabase.rpc("mark_question_seen", {
    p_session_id: parsed.data.sessionId,
    p_device_tokens: parsed.data.participantTokens,
    p_online_session_id: parsed.data.onlineSessionId ?? null,
    p_question_id: parsed.data.questionId,
    p_family_id: parsed.data.familyId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ synced: true, inserted: data });
}
