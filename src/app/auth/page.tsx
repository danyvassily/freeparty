import { AuthForm } from "@/components/auth/auth-form";
import { Sparkles } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function AuthPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-fp-blue text-white shadow-sm">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-fp-text">{BRAND.name}</h1>
        <p className="mt-1 text-sm text-fp-text-secondary">{BRAND.tagline}</p>
      </div>
      <AuthForm />
    </main>
  );
}
