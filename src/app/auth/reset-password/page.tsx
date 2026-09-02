import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";
import { BrandMark } from "@/components/ui/app-navigation";
import { KawaiiMascot } from "@/components/ui/kawaii-mascot";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between">
        <BrandMark />
        <Link href="/auth?mode=login" className="fp-btn-ghost gap-2"><ArrowLeft className="h-4 w-4" />Connexion</Link>
      </div>

      <div className="mx-auto mt-12 w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="relative mx-auto w-fit">
            <KawaiiMascot theme="thinking" size={82} />
            <span className="absolute -bottom-1 -right-2 grid h-9 w-9 place-items-center rounded-xl border-4 border-fp-bg bg-fp-primary text-white"><KeyRound className="h-4 w-4" /></span>
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-fp-text">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm leading-6 text-fp-text-dim">Choisissez un mot de passe sûr pour retrouver votre compte.</p>
        </div>
        <AuthForm mode="recovery" />
      </div>
    </main>
  );
}
