"use client";

import { useCallback, useEffect, useRef } from "react";

const CHECK_INTERVAL_MS = 60_000;

type VersionResponse = { version?: string };

/**
 * Les applications ajoutées à l'écran d'accueil iOS conservent parfois
 * l'ancien shell web. Ce composant compare la version courante à celle du
 * serveur et recharge l'application dès qu'une nouvelle version est publiée.
 */
export function UpdateChecker() {
  const currentVersion = useRef<string | null>(null);
  const reloadPending = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (reloadPending.current || typeof navigator === "undefined" || !navigator.onLine) {
      return;
    }

    try {
      const response = await fetch(`/api/version?ts=${Date.now()}`, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) return;

      const data = (await response.json()) as VersionResponse;
      if (!data.version) return;

      if (currentVersion.current === null) {
        currentVersion.current = data.version;
        return;
      }

      if (currentVersion.current !== data.version) {
        reloadPending.current = true;
        // Laisser le navigateur terminer la requête avant de remplacer le shell.
        window.setTimeout(() => window.location.reload(), 100);
      }
    } catch {
      // Une coupure réseau ne doit jamais bloquer l'utilisation de l'application.
    }
  }, []);

  useEffect(() => {
    void checkForUpdate();

    const interval = window.setInterval(() => void checkForUpdate(), CHECK_INTERVAL_MS);
    const onFocus = () => void checkForUpdate();
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkForUpdate();
    };
    const onOnline = () => void checkForUpdate();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onOnline);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onOnline);
    };
  }, [checkForUpdate]);

  return null;
}
