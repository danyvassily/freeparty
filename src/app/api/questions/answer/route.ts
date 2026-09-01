import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestSupabase } from "@/lib/supabase/request";

const RequestSchema = z.object({
  sessionId: z.string().uuid(),
  participantToken: z.string().min(12).max(200),
  familyId: z.string().min(2),
  correct: z.boolean(),
});

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  const supabase = getRequestSupabase(request);
  if (!supabase) return NextResponse.json({ synced: false, reason: "offline" });
  const { error } = await supabase.rpc("mark_question_answered", {
    p_session_id: parsed.data.sessionId,
    p_device_token: parsed.data.participantToken,
    p_family_id: parsed.data.familyId,
    p_correct: parsed.data.correct,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ synced: true });
}
