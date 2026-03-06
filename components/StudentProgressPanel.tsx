import { Plus, Video } from "lucide-react";
import StatMiniCard from "@/components/StatMiniCard";

export default function StudentProgressPanel() {
  return (
    <div className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 flex flex-col h-fit">
      <div className="flex items-start justify-between border-b border-brand-muted pb-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Alex</h2>
          <p className="text-sm text-gray-500 font-medium">
            Student Progress Details
          </p>
        </div>

        <button className="text-gray-400 hover:text-gray-700 text-lg font-bold">
          ×
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Interview Confidence Score
        </h3>

        <div className="h-[180px] rounded-2xl border-2 border-brand-muted bg-brand-light/30 flex items-center justify-center text-sm text-gray-500 font-medium">
          Chart Placeholder
        </div>

        <p className="text-sm text-gray-600 font-medium mt-4">
          Confidence has improved by <span className="font-semibold text-brand-primary">37%</span> over the last 4 weeks
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatMiniCard label="Total Sessions" value="12" />
        <StatMiniCard label="Avg. Score" value="74" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Quick Actions
        </h3>

        <div className="flex flex-col gap-3">
          <button className="w-full bg-brand-secondary hover:bg-brand-primary text-white font-semibold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
            <Plus size={16} />
            Assign New Goal
          </button>

          <button className="w-full border-2 border-brand-muted hover:border-brand-primary bg-white text-gray-800 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Video size={16} />
            Review Latest Recording
          </button>
        </div>
      </div>
    </div>
  );
}