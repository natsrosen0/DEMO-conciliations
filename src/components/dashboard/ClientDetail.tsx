import React, { useState } from 'react';
import { ArrowLeft, Settings2, Plus, Loader2 } from 'lucide-react';
import { ClientData } from './ClientTable';
import { ReconciliationRulesModal } from './ReconciliationRulesModal';
import { CreateReconciliationPanel } from './CreateReconciliationPanel';
import { MonthlyTransactionsView } from './MonthlyTransactionsView';

interface ClientDetailProps {
  client: ClientData;
  onBack: () => void;
}

const initialMonthlyData = [
  { id: '1', mes: 'Febrero 2026', monto: '$144,274,682.74', porcentaje: 100, status: 'completed' },
  { id: '2', mes: 'Enero 2026', monto: '$312,400.00', porcentaje: 72, status: 'completed' },
];

const ProgressBar = ({ percentage, status }: { percentage: number, status?: string }) => {
  const isComplete = percentage === 100;
  const barColor = isComplete ? 'bg-green-600' : 'bg-[#6b21a8]';
  const bgColor = 'bg-gray-100';

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold w-10 text-gray-400">0%</span>
        <div className={`h-1.5 w-24 rounded-full ${bgColor} overflow-hidden relative`}>
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        </div>
        <Loader2 className="w-4 h-4 text-[#6b21a8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold w-10 text-gray-900">{percentage}%</span>
      <div className={`h-1.5 w-24 rounded-full ${bgColor} overflow-hidden`}>
        <div 
          className={`h-full rounded-full ${barColor}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export function ClientDetail({ client, onBack }: ClientDetailProps) {
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [monthlyData, setMonthlyData] = useState(initialMonthlyData);
  const [selectedReconciliation, setSelectedReconciliation] = useState<any | null>(null);

  const handleCreateReconciliation = (name: string) => {
    const newReconciliation = {
      id: Math.random().toString(36).substr(2, 9),
      mes: name,
      monto: '$0.00',
      porcentaje: 0,
      status: 'loading'
    };
    
    setMonthlyData([newReconciliation, ...monthlyData]);
    
    // Simulate processing time
    setTimeout(() => {
      setMonthlyData(current => 
        current.map(item => 
          item.id === newReconciliation.id 
            ? { ...item, status: 'completed', porcentaje: Math.floor(Math.random() * 100), monto: `$${(Math.random() * 100000).toFixed(2)}` }
            : item
        )
      );
    }, 3000);
  };

  if (selectedReconciliation) {
    return (
      <MonthlyTransactionsView 
        clientName={client.cliente}
        monthName={selectedReconciliation.mes}
        onBack={() => setSelectedReconciliation(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{client.cliente}</h1>
            <p className="text-sm text-gray-500">{client.porcentaje}% conciliado (global)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsRulesModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Settings2 className="w-4 h-4" />
            Reglas de Conciliación
          </button>
          <button 
            onClick={() => setIsCreatePanelOpen(true)}
            className="flex items-center gap-2 bg-[#6b21a8] hover:bg-[#581c87] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crear Conciliación
          </button>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-1/2">Mes</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-1/4">Monto</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-1/4">% Conciliado</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((row) => (
                <tr 
                  key={row.id} 
                  className={`border-b border-gray-100 transition-colors ${row.status === 'loading' ? '' : 'hover:bg-gray-50/50 cursor-pointer'}`}
                  onClick={() => row.status !== 'loading' && setSelectedReconciliation(row)}
                >
                  <td className="py-3 px-4 text-xs font-medium text-gray-900">{row.mes}</td>
                  <td className="py-3 px-4 text-xs text-gray-900">{row.status === 'loading' ? '-' : row.monto}</td>
                  <td className="py-3 px-4">
                    <ProgressBar percentage={row.porcentaje} status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReconciliationRulesModal 
        isOpen={isRulesModalOpen} 
        onClose={() => setIsRulesModalOpen(false)} 
      />

      <CreateReconciliationPanel
        isOpen={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        onCreate={handleCreateReconciliation}
      />
    </div>
  );
}
