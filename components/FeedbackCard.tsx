import { MessageCircle, CheckCircle, Target } from 'lucide-react';

interface Props {
    coachName: string;
    timeAgo: string;
    message: string;
    type?: 'general' | 'positive' | 'focus';
}

export default function FeedbackCard({ coachName, timeAgo, message, type = 'general' }: Props) {
    const icons = {
        general: <MessageCircle size={20} className="text-brand-primary" />,
        positive: <CheckCircle size={20} className="text-green-600" />,
        focus: <Target size={20} className="text-brand-primary" />
    };

    const bgColors = {
        general: "bg-brand-muted",
        positive: "bg-green-100",
        focus: "bg-brand-muted"
    };

    return (
        <div className="flex gap-4 p-5 border-2 border-[#b4e0d4] rounded-2xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-4">
            <div className={`mt-1 flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${bgColors[type]}`}>
                {icons[type]}
            </div>
            <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-gray-900">{coachName}</span>
                    <span className="text-xs text-gray-500 font-medium">{timeAgo}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{message}</p>
            </div>
        </div>
    );
}
