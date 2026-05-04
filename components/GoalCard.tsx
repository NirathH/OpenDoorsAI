import { ChevronRight, LucideIcon } from 'lucide-react';

interface Props {
    icon: LucideIcon;
    title: string;
}

export default function GoalCard({ icon: Icon, title }: Props) {
    return (
        <div className="flex items-center justify-between p-4 border-2 border-[#b4e0d4] rounded-2xl bg-white hover:border-brand-secondary transition-colors cursor-pointer mb-3">
            <div className="flex items-center gap-4">
                <div className="bg-brand-light p-2 rounded-xl text-brand-primary">
                    <Icon size={24} />
                </div>
                <span className="font-semibold text-base text-gray-800">{title}</span>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
        </div>
    );
}
