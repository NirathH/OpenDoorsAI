import React from "react";
import { Play, TrendingUp, Book, MessageSquare, Eye, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import ActionCircle from "@/components/ActionCircle";
import FeedbackCard from "@/components/FeedbackCard";
import GoalCard from "@/components/GoalCard";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabaseServer";

export default async function Home() {

  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user || data.user.role === "instructor") redirect("/login");

  return (
    <div className="min-h-screen font-sans bg-brand-light">
      <Navbar />

      <main className="max-w-[1400px] mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
        {/* Left Column */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Welcome Card */}
          <section className="bg-white rounded-[2rem] p-10 border-2 border-brand-muted shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            {/* subtle background accent */}
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand-light border-2 border-brand-muted opacity-70" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-light border-2 border-brand-muted opacity-50" />

            <div className="relative w-36 h-36 rounded-full border-[6px] border-brand-primary overflow-hidden mb-6 shadow-lg bg-brand-light flex items-center justify-center">
              <span className="text-brand-primary font-extrabold text-5xl">A</span>
            </div>

            <h1 className="relative text-3xl font-semibold text-gray-900 mb-2">
              Welcome back, {data.user.user_metadata.full_name || "name"}!
            </h1>
            <p className="relative text-gray-500 font-medium">
              You&apos;re on a{" "}
              <span className="text-brand-primary font-semibold">3-day streak</span>{" "}
              🔥
            </p>

            <div className="relative mt-6 flex flex-wrap justify-center gap-3">
              <Pill>Next task: Tell me about yourself</Pill>
              <Pill>Focus: Filler words</Pill>
              <Pill>Goal: Confidence</Pill>
            </div>
          </section>

          {/* Action Buttons */}
          <section className="flex flex-wrap justify-center items-center gap-6 py-4">
            <ActionCircle icon={TrendingUp} label="Review Progress" variant="secondary" />
            <ActionCircle
                icon={Play}
                label="Start Session"
                variant="primary"
                size="lg"
                href="/sessions/new"
            />
            <ActionCircle icon={Book} label="Skill Modules" variant="secondary" />
          </section>

          {/* Progress + Goals */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="My Progress">
              <div className="flex gap-4">
                <MiniStat
                  icon={<TrendingUp size={24} strokeWidth={2.5} />}
                  label="Sessions Completed"
                  value="5"
                />
                <MiniStat
                  icon={<Award size={24} strokeWidth={2.5} />}
                  label="Last Score"
                  value={
                    <>
                      85 <span className="text-sm text-gray-500 font-bold">/100</span>
                    </>
                  }
                />
              </div>

              <div className="mt-4 border-2 border-brand-muted rounded-2xl p-4 bg-brand-light/40">
                <div className="text-xs text-gray-600 font-semibold mb-1">This week</div>
                <div className="text-sm text-gray-700 font-medium">
                  Keep the streak going — one more session to beat last week.
                </div>
              </div>
            </Card>

            <Card title="Upcoming Goals">
              <div className="flex flex-col gap-2">
                <GoalCard icon={MessageSquare} title="Practice: 'Tell me about yourself'" />
                <GoalCard icon={Eye} title="Practice: Eye Contact" />
              </div>

              <button className="mt-4 w-full bg-white border-2 border-brand-muted hover:border-brand-primary text-gray-900 font-semibold py-3 rounded-xl transition-colors">
                Add Goal
              </button>
            </Card>
          </section>
        </div>

        {/* Right Column - Sidebar */}
        <aside className="w-full lg:w-[420px] bg-white rounded-[2rem] border-2 border-brand-muted p-8 shadow-sm h-fit">
          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-brand-muted">
            <div className="bg-brand-light p-3 rounded-2xl border-2 border-brand-muted">
              <MessageSquare size={24} className="text-brand-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-gray-900 font-semibold text-[17px]">Instructor Feedback</h2>
              <p className="text-gray-500 text-[13px] font-medium">
                Recent notes from your coach
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <FeedbackCard
              type="positive"
              coachName="Coach Sarah"
              timeAgo="2 days ago"
              message="Great improvement on eye contact! Your engagement with the camera felt much more natural in the last session."
            />
            <FeedbackCard
              type="focus"
              coachName="Coach Sarah"
              timeAgo="3 days ago"
              message="Let's work on reducing filler words like 'um' and 'uh'. Try pausing silently instead—it shows confidence."
            />
            <FeedbackCard
              type="general"
              coachName="Coach Sarah"
              timeAgo="5 days ago"
              message="Remember to take a breath before answering. This helps with pacing and gives you time to organize your thoughts."
            />
          </div>

          <button className="mt-5 w-full bg-brand-secondary hover:bg-brand-primary text-white font-semibold py-4 rounded-xl transition-colors shadow-md">
            View All Feedback
          </button>
        </aside>
      </main>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 border-2 border-brand-muted flex flex-col">
      <h2 className="text-[15px] font-medium text-gray-700 mb-4 px-2">{title}</h2>
      {children}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex-1 border-2 border-brand-muted rounded-2xl p-5 flex flex-col items-start justify-center">
      <div className="text-brand-secondary mb-3 bg-brand-light p-2 rounded-xl border-2 border-brand-muted/60">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-600 font-semibold mb-1">{label}</div>
        <div className="text-3xl font-bold text-gray-900 leading-none">{value}</div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-brand-muted bg-white text-gray-700">
      {children}
    </span>
  );
}