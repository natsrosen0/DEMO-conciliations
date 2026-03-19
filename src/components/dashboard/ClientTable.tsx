import React from 'react';
import { Trash2 } from 'lucide-react';

export interface Responsible {
  name: string;
  email: string;
}

export interface Invoice {
  id: string;
  number: string;
  status: 'paid' | 'pending' | 'error';
  amount: string;
  paidAmount?: string;
  estado?: string;
}

export interface PolizaCobranza {
  id: string;
  number: string;
  invoices: Invoice[];
}

export interface PolizaPadre {
  id: string;
  number: string;
  cobranzas: PolizaCobranza[];
}

export interface Subsidiary {
  id: string;
  name: string;
  polizasPadre: PolizaPadre[];
}

export interface ClientData {
  cliente: string;
  agente: string;
  transacciones: number;
  porConciliar: string;
  porcentaje: number;
  gnpResponsables?: Responsible[];
  intermediarioResponsables?: Responsible[];
  subsidiaries?: Subsidiary[];
}

const ProgressBar = ({ percentage }: { percentage: number }) => {
  const isComplete = percentage === 100;
  const barColor = isComplete ? 'bg-green-600' : 'bg-[#6b21a8]';
  const bgColor = 'bg-gray-100';

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

export function ClientTable({ 
  data, 
  onRowClick, 
  onDelete 
}: { 
  data: ClientData[];
  onRowClick: (client: ClientData) => void;
  onDelete: (cliente: string, e: React.MouseEvent) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-1/5">Cliente</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-1/5">Agente</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-1/5">Transacciones</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-1/5">Por conciliar</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-1/5">% Conciliado</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr 
                key={index} 
                className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => onRowClick(row)}
              >
                <td className="py-3 px-4 text-xs font-bold text-gray-900">{row.cliente}</td>
                <td className="py-3 px-4 text-xs text-gray-500">{row.agente}</td>
                <td className="py-3 px-4 text-xs text-gray-500">{row.transacciones}</td>
                <td className="py-3 px-4 text-xs text-gray-500">{row.porConciliar}</td>
                <td className="py-3 px-4">
                  <ProgressBar percentage={row.porcentaje} />
                </td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={(e) => onDelete(row.cliente, e)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="py-4 px-6 text-xs text-gray-400 border-t border-gray-100">
        Mostrando {data.length} de {data.length}
      </div>
    </div>
  );
}
