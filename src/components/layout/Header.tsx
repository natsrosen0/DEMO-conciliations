import { Bell, ChevronDown } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-white flex items-center justify-end px-8 border-b border-gray-100">
      <div className="flex items-center gap-6">
        <button className="text-gray-500 hover:text-gray-700 relative">
          <Bell className="w-5 h-5" strokeWidth={1.5} />
          {/* Optional notification dot could go here */}
        </button>
        
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-900">Ana Gonzalez</span>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-gray-500">Nombre Organización</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
