"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/app/actions/auth";

export default function LoginForm() {
  const sp = useSearchParams();
  const error = sp.get("error");

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-white/60 border-2 border-brand-muted" />
      <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-white/40 border-2 border-brand-muted" />

      <form
        action={signIn}
        className="relative w-full max-w-md bg-white rounded-[2rem] p-10 border-2 border-brand-muted shadow-sm space-y-6"
      >
        {/* Logo + Branding */}
        <div className="flex flex-col items-center">
          <div className="relative h-14 w-14 rounded-full border-2 border-brand-muted bg-brand-light flex items-center justify-center mb-4">
            <Image
              src="/logo-submark.png"
              alt="OpenDoorsAI"
              fill
              className="object-contain p-2"
              priority
            />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome Back
          </h1>

          <p className="text-sm text-gray-600 font-medium mt-1 text-center">
            Log in to continue practicing with <span className="text-brand-primary font-semibold">OpenDoorsAI</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full rounded-2xl border-2 border-brand-muted focus:border-brand-primary outline-none px-4 py-3 transition-colors"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl border-2 border-brand-muted focus:border-brand-primary outline-none px-4 py-3 transition-colors"
            required
          />
        </div>

        {/* Button */}
        <button className="w-full bg-brand-secondary hover:bg-brand-primary text-white font-semibold py-3 rounded-xl transition-colors shadow-md">
          Log in
        </button>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <a
            href="/register"
            className="text-brand-primary font-semibold hover:underline"
          >
            Create one
          </a>
        </p>
      </form>
    </div>
  );
}