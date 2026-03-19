import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MoreHorizontal, Trash2, Upload } from 'lucide-react';
import { ReconciliationDetail } from './ReconciliationDetail';
import { BulkDepositUploadPanel } from './BulkDepositUploadPanel';
import { hoteleraTransactions, MonthlyTransaction } from '../../data/hoteleraTransactions';

interface MonthlyTransactionsViewProps {
  clientName: string;
  monthName: string;
  onBack: () => void;
}

const defaultTransactions: MonthlyTransaction[] = [];

export function MonthlyTransactionsView({ clientName, monthName, onBack }: MonthlyTransactionsViewProps) {
  const [selectedTxn, setSelectedTxn] = useState<MonthlyTransaction | null>(null);
  const [isAddDepositModalOpen, setIsAddDepositModalOpen] = useState(false);
  const [isBulkDepositUploadOpen, setIsBulkDepositUploadOpen] = useState(false);
  const [newDepositData, setNewDepositData] = useState({ account: '', amount: '', date: '' });
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [reconciliationToDelete, setReconciliationToDelete] = useState<string | null>(null);
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

  const handleAddDeposit = () => {
    const newId = `TXN-${(transactions.length + 1).toString().padStart(3, '0')}`;
    
    const newReconciliation: MonthlyTransaction = {
      id: newId,
      account: newDepositData.account || '-',
      fecha: newDepositData.date || new Date().toLocaleDateString('es-MX'),
      numRecibos: 0,
      montoRecibido: formatCurrency(parseCurrency(newDepositData.amount)),
      montoEsperado: '$0.00',
      diferencia: formatCurrency(parseCurrency(newDepositData.amount)),
      estado: 'No conciliado'
    };
    
    setTransactions(prev => [newReconciliation, ...prev]);
    setIsAddDepositModalOpen(false);
    setNewDepositData({ account: '', amount: '', date: '' });
  };

  const handleBulkDepositUpload = (data: any[]) => {
    const newDeposits: MonthlyTransaction[] = data.map((item, index) => {
      const newId = `TXN-${(transactions.length + index + 1).toString().padStart(3, '0')}`;
      return {
        id: newId,
        account: item.account || '-',
        fecha: item.date || new Date().toLocaleDateString('es-MX'),
        numRecibos: 0,
        montoRecibido: formatCurrency(parseCurrency(item.amount)),
        montoEsperado: '$0.00',
        diferencia: formatCurrency(parseCurrency(item.amount)),
        estado: 'No conciliado'
      };
    });

    setTransactions(prev => [...newDeposits, ...prev]);
    setIsBulkDepositUploadOpen(false);
  };

  const handleDeleteReconciliation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setReconciliationToDelete(id);
    setActiveDropdownId(null);
  };

  const confirmDelete = () => {
    if (reconciliationToDelete) {
      setTransactions(prev => prev.filter(t => t.id !== reconciliationToDelete));
      // Also clean up the associated transactions in localStorage
      const txnKey = `nats_conciliation_txns_${clientName}_${monthName}_${reconciliationToDelete}`;
      localStorage.removeItem(txnKey);
      setReconciliationToDelete(null);
    }
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
        reconciliationName={selectedTxn.account ? `${selectedTxn.account} (${selectedTxn.fecha})` : selectedTxn.fecha}
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
            <p className="text-[11px] font-normal text-gray-500">{transactions.length} depósitos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsBulkDepositUploadOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-[11px] font-normal transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Carga Masiva
          </button>
          <button 
            onClick={() => setIsAddDepositModalOpen(true)}
            className="flex items-center gap-2 bg-[#6b21a8] hover:bg-[#581c87] text-white px-4 py-2.5 rounded-lg text-[11px] font-normal transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar Depósito
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-normal text-gray-500 mb-1 uppercase tracking-wider">Monto Total Recibido</p>
          <p className="text-[14px] font-bold text-green-600">
            ${totalRecibido.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-normal text-gray-500 mb-1 uppercase tracking-wider">Monto Total Esperado</p>
          <p className="text-[14px] font-bold text-gray-900">
            ${totalEsperado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-normal text-gray-500 mb-1 uppercase tracking-wider">Diferencia</p>
          <p className={`text-[14px] font-bold ${diferenciaTotal === 0 ? 'text-green-600' : 'text-red-500'}`}>
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
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Cuenta</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Num. de Recibos</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Monto Esperado</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Diferencia</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider w-12"></th>
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
                    <td className="py-3 px-4 text-[12px] font-normal text-gray-500 font-mono">{row.account || row.id}</td>
                    <td className={`py-3 px-4 text-[12px] font-medium ${isError ? 'text-red-500' : 'text-gray-900'}`}>{row.montoRecibido}</td>
                    <td className="py-3 px-4 text-[12px] font-normal text-gray-900">{row.fecha}</td>
                    <td className="py-3 px-4 text-[12px] font-normal text-gray-900">{row.numRecibos}</td>
                    <td className="py-3 px-4 text-[12px] font-medium text-gray-900">{row.montoEsperado}</td>
                    <td className={`py-3 px-4 text-[12px] font-medium ${isError ? 'text-red-500' : 'text-gray-900'}`}>{row.diferencia}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${
                        isError 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {row.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownId(activeDropdownId === row.id ? null : row.id);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      
                      {activeDropdownId === row.id && (
                        <div 
                          className="absolute right-8 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleDeleteReconciliation(row.id, e)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Deposit Modal */}
      {isAddDepositModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Agregar Depósito</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">Cuenta</label>
                <input
                  type="text"
                  value={newDepositData.account}
                  onChange={(e) => setNewDepositData(prev => ({ ...prev, account: e.target.value }))}
                  placeholder="Ej: 1234567890"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8] transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">Monto</label>
                <input
                  type="text"
                  value={newDepositData.amount}
                  onChange={(e) => setNewDepositData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Ej: 50000.00"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8] transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1.5">Fecha</label>
                <input
                  type="text"
                  value={newDepositData.date}
                  onChange={(e) => setNewDepositData(prev => ({ ...prev, date: e.target.value }))}
                  placeholder="DD/MM/YYYY"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8] transition-all"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsAddDepositModalOpen(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-normal text-[11px] rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddDeposit}
                className="flex-1 px-4 py-2.5 bg-[#6b21a8] text-white font-normal text-[11px] rounded-xl hover:bg-[#581c87] transition-colors shadow-sm"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkDepositUploadPanel
        isOpen={isBulkDepositUploadOpen}
        onClose={() => setIsBulkDepositUploadOpen(false)}
        onUpload={handleBulkDepositUpload}
      />

      {/* Delete Confirmation Modal */}
      {reconciliationToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6 text-red-600">
              <div className="p-3 bg-red-50 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">¿Eliminar conciliación?</h3>
            </div>
            
            <p className="text-gray-600 mb-8">
              Esta acción no se puede deshacer. Se eliminarán todos los recibos asociados a esta conciliación.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setReconciliationToDelete(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-normal text-[11px] rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-normal text-[11px] rounded-xl hover:bg-red-700 transition-colors shadow-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
