import { notFound } from "next/navigation";
import { LocalGameSetupClient } from "@/components/home/local-game-setup-client";
import { MODE_META } from "@/lib/game/modes";
import type { GameMode } from "@/lib/store/game";

export function generateStaticParams() {
  return Object.keys(MODE_META).map((mode) => ({ mode }));
}

export default async function LocalGameSetupPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  if (!(mode in MODE_META)) notFound();

  return <LocalGameSetupClient mode={mode as GameMode} />;
}
