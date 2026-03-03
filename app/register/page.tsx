import RegisterForm from "./register-form";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-light" />}>
      <RegisterForm />
    </Suspense>
  );
}