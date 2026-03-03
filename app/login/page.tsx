import LoginForm from "./login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-light" />}>
      <LoginForm />
    </Suspense>
  );
}