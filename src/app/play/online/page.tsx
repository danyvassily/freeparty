"use client";

import { Suspense } from "react";
import { OnlineRoom } from "@/components/game/online-room";

export default function OnlinePage() {
  return (
    <Suspense fallback={null}>
      <OnlineRoom />
    </Suspense>
  );
}
