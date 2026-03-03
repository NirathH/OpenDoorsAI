import { User } from 'lucide-react';

export default function Header() {
  return (
    <header className="flex w-full items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
      <div className="flex items-center gap-2">
        <img src="/logo-submark.png" alt="Logo" className="h-18 w-auto object-contain" />
        <span className="font-bold text-brand-primary text-xl">OpenDoorsAI</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-medium text-black">Alex</span>
        <div className="bg-brand-primary rounded-full p-2 text-white">
          <User size={20} />
        </div>
      </div>
    </header>
  );
}
