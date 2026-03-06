import InstructorSidebar from "@/components/InstructorSidebar";
import StudentTable from "@/components/StudentTable";
import StudentProgressPanel from "@/components/StudentProgressPanel";

const students = [
  {
    id: 1,
    name: "Alex",
    lastSession: "Dec 14, 2024",
    streak: "3 days",
    status: "Active",
  },
  {
    id: 2,
    name: "Jordan",
    lastSession: "Dec 12, 2024",
    streak: "1 day",
    status: "Needs Help",
  },
  {
    id: 3,
    name: "Taylor",
    lastSession: "Dec 10, 2024",
    streak: "7 days",
    status: "Active",
  },
  {
    id: 4,
    name: "Morgan",
    lastSession: "Dec 5, 2024",
    streak: "0 days",
    status: "Inactive",
  },
];

export default function InstructorDashboardPage() {
  return (
    <div className="min-h-screen bg-brand-light flex">
      <InstructorSidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600 font-medium mt-1">
              Manage and track your students&apos; progress
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
            <StudentTable students={students} />
            <StudentProgressPanel />
          </div>
        </div>
      </main>
    </div>
  );
}