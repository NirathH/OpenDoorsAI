"use client";

import { useState } from "react";
import StudentTable from "@/components/StudentTable";
import StudentProgressPanel from "@/components/StudentProgressPanel";

type StudentTableRow = {
  id: string;
  name: string;
  lastSession: string;
  streak: string;
  status: string;
  totalSessions: number;
  avgScore: number;
};

interface DashboardClientProps {
  initialStudents: StudentTableRow[];
}

export default function DashboardClient({ initialStudents }: DashboardClientProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const selectedStudent = initialStudents.find(s => s.id === selectedStudentId) || null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      <StudentTable 
        students={initialStudents} 
        onSelectStudent={setSelectedStudentId}
        selectedStudentId={selectedStudentId}
      />
      
      {selectedStudent ? (
        <StudentProgressPanel 
          student={selectedStudent} 
          onClose={() => setSelectedStudentId(null)}
        />
      ) : (
        <div className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 flex flex-col h-[400px] items-center justify-center text-center text-gray-400">
          <p className="font-semibold text-gray-500">No Student Selected</p>
          <p className="text-sm mt-1">Click on a student in the table to view their progress details.</p>
        </div>
      )}
    </div>
  );
}
