import { 
  Home, 
  BarChart2, 
  FolderOpen, 
  FileDown, 
  FileUp, 
  Scale, 
  Send, 
  Puzzle, 
  Settings,
  ChevronDown,
  FileText
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 flex items-center">
        <div 
          className="h-8 w-24 bg-[#6b21a8] cursor-pointer"
          onClick={() => onViewChange('dashboard')}
          style={{
            maskImage: 'url("https://trytoku.com/hubfs/Toku-2023/home/logos/Logo%20Toku%20Black.png")',
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'left center',
            WebkitMaskImage: 'url("https://trytoku.com/hubfs/Toku-2023/home/logos/Logo%20Toku%20Black.png")',
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'left center',
          }}
          aria-label="Toku Logo"
          role="img"
        />
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          <li>
            <button 
              onClick={() => onViewChange('dashboard')}
              className={`w-full flex items-center gap-3 px-6 py-2.5 transition-colors ${
                currentView === 'dashboard' ? 'text-[#6b21a8] bg-purple-50/50 border-l-4 border-[#6b21a8]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Home className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-xs font-medium">Inicio</span>
            </button>
          </li>
          <li>
            <a href="#" className="flex items-center justify-between px-6 py-2.5 text-gray-600 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <BarChart2 className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs font-medium">Métricas</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center justify-between px-6 py-2.5 text-gray-600 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs font-medium">Datos</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center justify-between px-6 py-2.5 text-gray-600 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileDown className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs font-medium">Cuentas por cobrar</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center justify-between px-6 py-2.5 text-gray-600 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <FileUp className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs font-medium">Cuentas por pagar</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </a>
          </li>
          
          {/* Active Section */}
          <li className="pt-2">
            <button 
              onClick={() => onViewChange('dashboard')}
              className={`w-full flex items-center justify-between px-6 py-2.5 transition-colors ${
                currentView === 'dashboard' ? 'text-[#6b21a8] bg-purple-50/50 border-l-4 border-[#6b21a8]' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 -ml-1">
                <Scale className="w-4 h-4" strokeWidth={1.5} />
                <span className="text-xs font-semibold">Conciliaciones</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <ul className="py-2 space-y-1">
              <li>
                <button 
                  onClick={() => onViewChange('dashboard')}
                  className={`w-full text-left px-14 py-2 text-xs font-medium ${
                    currentView === 'dashboard' ? 'text-[#6b21a8]' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Conciliación por cliente
                </button>
              </li>
            </ul>
          </li>

          <li className="pt-2">
            <a href="#" className="flex items-center gap-3 px-6 py-2.5 text-gray-600 hover:bg-gray-50">
              <Send className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-xs font-medium">Mensajería</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 px-6 py-2.5 text-gray-600 hover:bg-gray-50">
              <Puzzle className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-xs font-medium">Extensiones</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 px-6 py-2.5 text-gray-600 hover:bg-gray-50">
              <Settings className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-xs font-medium">Ajustes</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
