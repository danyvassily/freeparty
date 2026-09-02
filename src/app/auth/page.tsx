import Link from "next/link";
import { ArrowLeft, History, ShieldCheck, UsersRound } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { BrandMark } from "@/components/ui/app-navigation";
import { KawaiiMascot } from "@/components/ui/kawaii-mascot";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const initialMode = mode === "login" ? "login" : "register";

  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <BrandMark />
        <Link href="/" className="fp-btn-ghost gap-2"><ArrowLeft className="h-4 w-4" />Retour à l’accueil</Link>
      </div>

      <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1fr_29rem] lg:gap-16">
        <section className="hidden lg:block">
          <div className="flex items-center gap-5">
            <KawaiiMascot theme="party" size={112} className="border-4 border-white shadow-xl" />
            <div>
              <p className="fp-eyebrow">Votre espace joueur</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-fp-text">Retrouvez vos parties partout.</h1>
            </div>
          </div>
          <p className="mt-6 max-w-xl text-lg leading-8 text-fp-text-dim">Le compte est facultatif pour jouer. Il sert à conserver votre historique, synchroniser vos appareils et retrouver vos amis.</p>
          <ul className="mt-8 grid gap-4">
            <li className="flex items-start gap-3 rounded-2xl border border-fp-border bg-white/75 p-4"><History className="mt-0.5 h-5 w-5 shrink-0 text-fp-primary" /><div><p className="font-bold text-fp-text">Questions inédites</p><p className="mt-0.5 text-sm text-fp-text-dim">Votre historique anti-répétition vous suit d’une partie à l’autre.</p></div></li>
            <li className="flex items-start gap-3 rounded-2xl border border-fp-border bg-white/75 p-4"><UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-fp-primary" /><div><p className="font-bold text-fp-text">Salons et amis</p><p className="mt-0.5 text-sm text-fp-text-dim">Reprenez plus facilement les parties avec votre groupe.</p></div></li>
            <li className="flex items-start gap-3 rounded-2xl border border-fp-border bg-white/75 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-fp-success" /><div><p className="font-bold text-fp-text">Session mémorisée</p><p className="mt-0.5 text-sm text-fp-text-dim">Une fois connecté, vous n’avez pas à saisir vos identifiants à chaque visite.</p></div></li>
          </ul>
          <Link href="/play/local" className="mt-6 inline-flex min-h-11 items-center text-sm font-bold text-fp-primary hover:underline">Continuer sans compte</Link>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-5 text-center lg:hidden">
            <KawaiiMascot theme="party" size={76} className="mb-3" />
            <h1 className="text-2xl font-black tracking-tight text-fp-text">Votre espace joueur</h1>
            <p className="mt-1 text-sm text-fp-text-dim">Le compte reste facultatif pour jouer.</p>
          </div>
          <AuthForm mode={initialMode} />
          <Link href="/play/local" className="mt-4 flex min-h-12 items-center justify-center rounded-xl text-sm font-bold text-fp-text-dim hover:bg-black/[0.04] hover:text-fp-text lg:hidden">Continuer sans compte</Link>
        </section>
      </div>
    </main>
  );
}
