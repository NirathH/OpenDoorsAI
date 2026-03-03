import LoginForm from "./login-form";

export default function LoginPage() {
  <div className="min-h-screen bg-brand-light p-6">
    <div className="max-w-2xl mx-auto bg-white rounded-[2rem] p-8 border-2 border-brand-muted shadow-sm">
      <h1 className="text-2xl font-semibold text-gray-900">Login</h1>
      <p className="mt-4 text-gray-600">Welcome back! Please log in to your account.</p>
    </div>
  </div>;
  return <LoginForm />;
}