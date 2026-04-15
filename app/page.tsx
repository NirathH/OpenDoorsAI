import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Sparkles,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-light text-gray-900">
      <LandingNav />

      {/* HERO */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-8 pt-12 pb-10">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-brand-muted bg-white text-sm font-semibold text-gray-700">
              <Sparkles size={16} className="text-brand-primary" />
              AI coaching for work and real conversations
            </div>

            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight">
              Build confidence for work, coaching, and{" "}
              <span className="text-brand-primary">real-life communication</span>.
            </h1>

            <p className="mt-4 text-lg text-gray-600 font-medium leading-relaxed max-w-xl">
              OpenDoorsAI helps people practice job-related and everyday speaking
              scenarios, get clear feedback, and improve over time with guided
              coaching.
            </p>

            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-md"
              >
                <Play size={18} />
                Start Practicing
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-brand-muted hover:border-brand-primary text-gray-900 font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                Log in
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <MiniBadge icon={<ShieldCheck size={16} />} text="Private recordings" />
              <MiniBadge icon={<Clock size={16} />} text="Quick feedback" />
              <MiniBadge icon={<TrendingUp size={16} />} text="Track growth" />
            </div>
          </div>

          {/* HERO CARD */}
          <div className="relative">
            <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/70 border-2 border-brand-muted blur-[0px]" />
            <div className="absolute -bottom-12 -left-10 h-64 w-64 rounded-full bg-white/60 border-2 border-brand-muted" />

            <div className="relative bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-8 overflow-hidden">
              <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-light border-2 border-brand-muted opacity-80" />

              <div className="relative flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl border-2 border-brand-muted bg-brand-light flex items-center justify-center">
                  <span className="text-brand-primary font-extrabold">OD</span>
                </div>
                <div>
                  <div className="text-lg font-extrabold">Your next session</div>
                  <div className="text-sm text-gray-600 font-medium">
                    “Practice a workplace conversation”
                  </div>
                </div>
              </div>

              <div className="relative mt-6 grid gap-4">
                <StepRow
                  icon={<MessageSquare className="text-brand-primary" size={18} />}
                  title="Practice scenarios"
                  desc="Work, coaching, and everyday communication prompts."
                />
                <StepRow
                  icon={<Sparkles className="text-brand-primary" size={18} />}
                  title="Clear feedback"
                  desc="Support on confidence, clarity, and response quality."
                />
                <StepRow
                  icon={<TrendingUp className="text-brand-primary" size={18} />}
                  title="See progress"
                  desc="Track improvement and focus on next steps."
                />
              </div>

              <div className="relative mt-7 rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  Example feedback
                </div>
                <div className="text-gray-900 font-semibold">
                  “Good effort. Next, slow down and make your response more clear
                  and structured.”
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <Tag>Confidence</Tag>
                  <Tag>Clarity</Tag>
                  <Tag>Structure</Tag>
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-600 font-medium text-center">
              Built for job seekers, students, and people building communication skills.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-[1400px] mx-auto px-6 md:px-8 py-10">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">How it works</h2>
          <p className="mt-2 text-gray-600 font-medium">
            Practice, feedback, improvement.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Play size={22} className="text-brand-primary" />}
            title="Start a session"
            text="Choose a goal like employment coaching, communication, or conversation practice."
          />
          <FeatureCard
            icon={<MessageSquare size={22} className="text-brand-primary" />}
            title="Respond to prompts"
            text="Practice realistic scenarios with guided AI support."
          />
          <FeatureCard
            icon={<TrendingUp size={22} className="text-brand-primary" />}
            title="Get feedback"
            text="See what went well, what to improve, and what to practice next."
          />
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-[1400px] mx-auto px-6 md:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-6">
          <BigCard
            title="Participant features"
            points={[
              "Practice work and conversation scenarios",
              "Simple feedback and next steps",
              "Progress dashboard with trends and streaks",
              "Personal goals and coaching support",
            ]}
          />
          <BigCard
            title="Instructor / Coach features"
            points={[
              "View session results and participant progress",
              "Leave notes and assign practice sessions",
              "Support communication and employment goals",
              "Guide growth over time",
            ]}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-8 py-12">
        <div className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-10 text-center relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand-light border-2 border-brand-muted opacity-70" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-light border-2 border-brand-muted opacity-60" />

          <h3 className="relative text-3xl font-extrabold">Ready to practice?</h3>
          <p className="relative mt-2 text-gray-600 font-medium">
            Start a session and build confidence step by step.
          </p>

          <div className="relative mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-md"
            >
              Start Practicing
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-brand-muted hover:border-brand-primary text-gray-900 font-semibold py-4 px-6 rounded-xl transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function LandingNav() {
  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b-2 border-brand-muted">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-brand-muted bg-white shadow-sm">
            <Image src="/logo-submark.png" alt="OpenDoorsAI" fill className="object-contain p-1" priority />
          </div>
          <span className="text-[18px] font-extrabold text-brand-primary">OpenDoorsAI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 rounded-2xl border-2 border-brand-muted bg-brand-light/50 px-2 py-2">
          <NavLink href="#how">How it works</NavLink>
          <NavLink href="#features">Features</NavLink>
          <NavLink href="/login">Log in</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/register"
            className="bg-brand-secondary hover:bg-brand-primary text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-white/70 transition-colors"
    >
      {children}
    </a>
  );
}

function MiniBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-brand-muted bg-white text-xs font-semibold text-gray-700">
      <span className="text-brand-primary">{icon}</span>
      {text}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold border-2 border-brand-muted bg-white text-gray-700">
      {children}
    </span>
  );
}

function StepRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-brand-muted p-4 bg-white">
      <div className="h-10 w-10 rounded-2xl bg-brand-light border-2 border-brand-muted flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="font-extrabold">{title}</div>
        <div className="text-sm text-gray-600 font-medium">{desc}</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6">
      <div className="h-12 w-12 rounded-2xl bg-brand-light border-2 border-brand-muted flex items-center justify-center">
        {icon}
      </div>
      <div className="mt-4 text-lg font-extrabold">{title}</div>
      <div className="mt-2 text-gray-600 font-medium">{text}</div>
    </div>
  );
}

function BigCard({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-8">
      <div className="text-xl font-extrabold">{title}</div>
      <div className="mt-4 grid gap-3">
        {points.map((p) => (
          <div key={p} className="flex items-start gap-2">
            <CheckCircle2 size={18} className="text-brand-primary mt-0.5" />
            <div className="text-gray-700 font-medium">{p}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t-2 border-brand-muted bg-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 py-10 flex flex-col md:flex-row gap-4 justify-between">
        <div>
          <div className="font-extrabold text-brand-primary">OpenDoorsAI</div>
          <div className="text-sm text-gray-600 font-medium mt-1">
            Practice. Feedback. Growth.
          </div>
        </div>
        <div className="text-sm text-gray-600 font-medium">
          © {new Date().getFullYear()} OpenDoorsAI • Built with care
        </div>
      </div>
    </footer>
  );
}