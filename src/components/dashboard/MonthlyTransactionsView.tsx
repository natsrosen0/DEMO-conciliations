import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ReconciliationDetail } from './ReconciliationDetail';
import { hoteleraTransactions, MonthlyTransaction } from '../../data/hoteleraTransactions';

interface MonthlyTransactionsViewProps {
  clientName: string;
  monthName: string;
  onBack: () => void;
}

const defaultTransactions: MonthlyTransaction[] = [
  { id: 'TXN-001', fecha: '03/02/2026', numRecibos: 14, montoRecibido: '$1,816,322.85', montoEsperado: '$1,816,322.85', diferencia: '+$0.00', estado: 'Conciliado' },
  { id: 'TXN-002', fecha: '13/02/2026', numRecibos: 8, montoRecibido: '$1,815,458.52', montoEsperado: '$1,820,000.00', diferencia: '-$4,541.48', estado: 'No conciliado' },
  { id: 'TXN-003', fecha: '12/02/2026', numRecibos: 22, montoRecibido: '$143,686.50', montoEsperado: '$143,686.50', diferencia: '+$0.00', estado: 'Conciliado' },
  { id: 'TXN-004', fecha: '12/02/2026', numRecibos: 5, montoRecibido: '$142,977.65', montoEsperado: '$145,000.00', diferencia: '-$2,022.35', estado: 'No conciliado' },
  { id: 'TXN-005', fecha: '03/02/2026', numRecibos: 17, montoRecibido: '$142,269.03', montoEsperado: '$142,269.03', diferencia: '+$0.00', estado: 'Conciliado' },
  { id: 'TXN-006', fecha: '06/02/2026', numRecibos: 11, montoRecibido: '$28,450.57', montoEsperado: '$30,000.00', diferencia: '-$1,549.43', estado: 'No conciliado' },
  { id: 'TXN-007', fecha: '09/02/2026', numRecibos: 1, montoRecibido: '$26,800.02', montoEsperado: '$26,800.02', diferencia: '+$0.00', estado: 'Conciliado' },
  { id: 'TXN-008', fecha: '06/02/2026', numRecibos: 7, montoRecibido: '$14,292.67', montoEsperado: '$15,100.00', diferencia: '-$807.33', estado: 'No conciliado' },
  { id: 'TXN-009', fecha: '03/02/2026', numRecibos: 12, montoRecibido: '$13,204.33', montoEsperado: '$13,204.33', diferencia: '+$0.00', estado: 'Conciliado' },
  { id: 'TXN-010', fecha: '12/02/2026', numRecibos: 6, montoRecibido: '$12,586.50', montoEsperado: '$12,586.50', diferencia: '+$0.00', estado: 'Conciliado' },
  { id: 'TXN-011', fecha: '12/02/2026', numRecibos: 10, montoRecibido: '$8,242.24', montoEsperado: '$8,500.00', diferencia: '-$257.76', estado: 'No conciliado' },
  { id: 'TXN-012', fecha: '12/02/2026', numRecibos: 4, montoRecibido: '$4,533.00', montoEsperado: '$4,533.00', diferencia: '+$0.00', estado: 'Conciliado' },
  { id: 'TXN-013', fecha: '03/02/2026', numRecibos: 8, montoRecibido: '$4,533.00', montoEsperado: '$4,800.00', diferencia: '-$267.00', estado: 'No conciliado' },
  { id: 'TXN-014', fecha: '13/02/2026', numRecibos: 5, montoRecibido: '$1,173.07', montoEsperado: '$1,173.07', diferencia: '+$0.00', estado: 'Conciliado' },
  { id: 'TXN-015', fecha: '06/02/2026', numRecibos: 3, montoRecibido: '$1,173.07', montoEsperado: '$1,350.00', diferencia: '-$176.93', estado: 'No conciliado' },
  { id: 'TXN-016', fecha: '03/02/2026', numRecibos: 6, montoRecibido: '$401.57', montoEsperado: '$401.57', diferencia: '+$0.00', estado: 'Conciliado' },
];

export function MonthlyTransactionsView({ clientName, monthName, onBack }: MonthlyTransactionsViewProps) {
  const [selectedTxn, setSelectedTxn] = useState<MonthlyTransaction | null>(null);

  const transactions = clientName === 'HOTELERA PALACE' && monthName === 'Febrero 2026' ? hoteleraTransactions : defaultTransactions;

  const totalRecibido = transactions.reduce((sum, txn) => {
    const amount = parseFloat(txn.montoRecibido.replace(/[$,]/g, ''));
    return sum + amount;
  }, 0);

  const totalEsperado = transactions.reduce((sum, txn) => {
    const amount = parseFloat(txn.montoEsperado.replace(/[$,]/g, ''));
    return sum + amount;
  }, 0);

  const diferenciaTotal = totalRecibido - totalEsperado;

  if (selectedTxn) {
    return (
      <ReconciliationDetail
        clientName={clientName}
        reconciliationName={selectedTxn.fecha}
        onBack={() => setSelectedTxn(null)}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{clientName} · {monthName}</h1>
          <p className="text-sm text-gray-500">{transactions.length} transacciones</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Monto Total Recibido</p>
          <p className="text-xl font-bold text-gray-900">
            ${totalRecibido.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Monto Total Esperado</p>
          <p className="text-xl font-bold text-gray-900">
            ${totalEsperado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Diferencia</p>
          <p className={`text-xl font-bold ${diferenciaTotal === 0 ? 'text-green-600' : 'text-red-500'}`}>
            {diferenciaTotal > 0 ? '+' : diferenciaTotal < 0 ? '-' : ''}${Math.abs(diferenciaTotal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">ID</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Fecha</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Num. de Recibos</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Monto Recibido</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Monto Esperado</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Diferencia</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row) => {
                const isError = row.estado === 'No conciliado';
                return (
                  <tr 
                    key={row.id} 
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTxn(row)}
                  >
                    <td className="py-3 px-4 text-xs text-gray-500 font-mono">{row.id}</td>
                    <td className="py-3 px-4 text-xs text-gray-900">{row.fecha}</td>
                    <td className="py-3 px-4 text-xs text-gray-900">{row.numRecibos}</td>
                    <td className={`py-3 px-4 text-xs font-semibold ${isError ? 'text-red-500' : 'text-gray-900'}`}>{row.montoRecibido}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-gray-900">{row.montoEsperado}</td>
                    <td className={`py-3 px-4 text-xs font-semibold ${isError ? 'text-red-500' : 'text-gray-900'}`}>{row.diferencia}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        isError 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {row.estado}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
