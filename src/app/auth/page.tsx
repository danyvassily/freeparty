import { AuthForm } from "@/components/auth/auth-form";
import { Zap } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function AuthPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-5 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-amber-400 text-white shadow-lg shadow-violet-600/30">
          <Zap className="h-6 w-6 fill-white" />
        </div>
        <h1 className="mt-4 font-sans text-2xl font-bold tracking-tight text-white">{BRAND.name}</h1>
        <p className="mt-1 text-xs text-neutral-400 font-medium">{BRAND.tagline}</p>
      </div>
      <AuthForm />
    </main>
  );
}
