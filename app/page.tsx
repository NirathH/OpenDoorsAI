import Image from "next/image";
import { Play, TrendingUp, Book, MessageSquare, Eye, Award } from 'lucide-react';
import Header from "../components/Header";
import ActionCircle from "../components/ActionCircle";
import FeedbackCard from "../components/FeedbackCard";
import GoalCard from "../components/GoalCard";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-[1400px] w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">

        {/* Left Column - Main Content */}
        <div className="flex-1 flex flex-col gap-8">

          {/* Welcome Card */}
          <div className="bg-white rounded-[2rem] p-10 border-2 border-[#b4e0d4] shadow-sm flex flex-col items-center justify-center">
            <div className="w-36 h-36 rounded-full border-[6px] border-brand-primary overflow-hidden mb-6 relative shadow-lg">
              <div className="w-full h-full bg-brand-light flex items-center justify-center text-brand-primary font-bold text-5xl">
                A
              </div>
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-3">Welcome back, Alex!</h1>
            <p className="text-gray-500 font-medium">You're on a 3-day streak!</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center items-center gap-6 py-6">
            <ActionCircle icon={TrendingUp} label="Review Progress" variant="secondary" />
            <ActionCircle icon={Play} label="Start Session" variant="primary" size="lg" />
            <ActionCircle icon={Book} label="Skill Modules" variant="secondary" />
          </div>

          {/* Bottom Area: Progress & Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">

            {/* My Progress */}
            <div className="bg-white rounded-[2rem] p-6 border-2 border-[#b4e0d4] flex flex-col">
              <h2 className="text-[15px] font-medium text-gray-700 mb-4 px-2">My Progress</h2>
              <div className="flex gap-4 flex-1">
                <div className="flex-1 border-2 border-[#b4e0d4] rounded-2xl p-5 flex flex-col items-start justify-center">
                  <div className="text-brand-secondary mb-3 bg-brand-light p-2 rounded-xl">
                    <TrendingUp size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 font-semibold mb-1">Sessions Completed</div>
                    <div className="text-3xl font-bold text-gray-900 leading-none">5</div>
                  </div>
                </div>
                <div className="flex-1 border-2 border-[#b4e0d4] rounded-2xl p-5 flex flex-col items-start justify-center">
                  <div className="text-brand-secondary mb-3 bg-brand-light p-2 rounded-xl">
                    <Award size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 font-semibold mb-1">Last Score</div>
                    <div className="text-3xl font-bold text-gray-900 leading-none">85<span className="text-sm text-gray-500 font-bold ml-1">/100</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Goals */}
            <div className="bg-white rounded-[2rem] p-6 border-2 border-[#b4e0d4] flex flex-col">
              <h2 className="text-[15px] font-medium text-gray-700 mb-4 px-2">Upcoming Goals</h2>
              <div className="flex flex-col flex-1 justify-center">
                <GoalCard icon={MessageSquare} title="Practice: 'Tell me about yourself'" />
                <GoalCard icon={Eye} title="Practice: Eye Contact" />
              </div>
            </div>

          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="w-full lg:w-[420px] bg-white rounded-[2rem] border-2 border-[#b4e0d4] p-8 flex flex-col h-fit relative shadow-sm">
          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-brand-muted">
            <div className="bg-brand-muted p-3 rounded-2xl mt-1">
              <MessageSquare size={24} className="text-brand-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-gray-900 font-semibold text-[17px]">Instructor Feedback</h2>
              <p className="text-gray-500 text-[13px] font-medium">Recent notes from your coach</p>
            </div>
          </div>

          <div className="flex flex-col gap-1">
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

          <button className="mt-4 w-full bg-brand-secondary hover:bg-brand-primary text-white font-medium py-4 rounded-xl transition-colors shadow-md">
            View All Feedback
          </button>
        </div>

      </main>
    </div>
  );
}
