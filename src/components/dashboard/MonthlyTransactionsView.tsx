import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { ReconciliationDetail } from './ReconciliationDetail';
import { hoteleraTransactions, MonthlyTransaction } from '../../data/hoteleraTransactions';

interface MonthlyTransactionsViewProps {
  clientName: string;
  monthName: string;
  onBack: () => void;
}

const defaultTransactions: MonthlyTransaction[] = [];

export function MonthlyTransactionsView({ clientName, monthName, onBack }: MonthlyTransactionsViewProps) {
  const [selectedTxn, setSelectedTxn] = useState<MonthlyTransaction | null>(null);
  const storageKey = `nats_conciliation_reconciliations_${clientName}_${monthName}`;
  
  const [transactions, setTransactions] = useState<MonthlyTransaction[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);
    
    if (clientName === 'HOTELERA PALACE' && monthName === 'Febrero 2026') {
      return hoteleraTransactions;
    }
    return defaultTransactions;
  });

  const parseCurrency = (val: string) => parseFloat(val.replace(/[^-0-9.]/g, '')) || 0;
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(transactions));
  }, [transactions, storageKey]);

  // Re-calculate when coming back from detail view or on mount
  useEffect(() => {
    if (!selectedTxn) {
      setTransactions(prev => prev.map(txn => {
        const txnKey = `nats_conciliation_txns_${clientName}_${monthName}_${txn.id}`;
        const savedTxns = localStorage.getItem(txnKey);
        if (savedTxns) {
          const txns = JSON.parse(savedTxns);
          
          const totalEsperado = txns.reduce((sum: number, t: any) => sum + parseCurrency(t.montoEsperado), 0);
          const totalRecibido = txns.reduce((sum: number, t: any) => sum + parseCurrency(t.monto), 0);
          const diff = totalRecibido - totalEsperado;
          
          return {
            ...txn,
            numRecibos: txns.length,
            montoRecibido: formatCurrency(totalRecibido),
            montoEsperado: formatCurrency(totalEsperado),
            diferencia: (diff >= 0 ? '+' : '-') + formatCurrency(Math.abs(diff)),
            estado: Math.abs(diff) < 0.01 ? 'Conciliado' : 'No conciliado'
          };
        }
        return txn;
      }));
    }
  }, [selectedTxn, clientName]);

  const handleAddReconciliation = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const newId = `TXN-${(transactions.length + 1).toString().padStart(3, '0')}`;
    
    const newReconciliation: MonthlyTransaction = {
      id: newId,
      fecha: formattedDate,
      numRecibos: 0,
      montoRecibido: '$0.00',
      montoEsperado: '$0.00',
      diferencia: '+$0.00',
      estado: 'Conciliado'
    };
    
    setTransactions(prev => [newReconciliation, ...prev]);
  };

  const totalRecibido = transactions.reduce((sum, txn) => {
    return sum + parseCurrency(txn.montoRecibido);
  }, 0);

  const totalEsperado = transactions.reduce((sum, txn) => {
    return sum + parseCurrency(txn.montoEsperado);
  }, 0);

  const diferenciaTotal = totalRecibido - totalEsperado;

  if (selectedTxn) {
    return (
      <ReconciliationDetail
        clientName={clientName}
        monthName={monthName}
        reconciliationId={selectedTxn.id}
        reconciliationName={selectedTxn.fecha}
        onBack={() => setSelectedTxn(null)}
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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{clientName} · {monthName}</h1>
            <p className="text-sm text-gray-500">{transactions.length} transacciones</p>
          </div>
        </div>
        <button 
          onClick={handleAddReconciliation}
          className="flex items-center gap-2 bg-[#6b21a8] hover:bg-[#581c87] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
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
