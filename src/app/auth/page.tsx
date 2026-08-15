import { AuthForm } from "@/components/auth/auth-form";

export default function AuthPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-5 py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fp-primary to-fp-primary-2 text-3xl shadow-lg shadow-fp-primary/30">
          🎉
        </div>
        <h1 className="mt-3 font-display text-3xl font-bold">Free Party</h1>
      </div>
      <AuthForm />
    </main>
  );
}
