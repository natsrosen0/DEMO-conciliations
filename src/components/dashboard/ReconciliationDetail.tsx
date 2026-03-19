import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, MoreHorizontal, Trash2, Upload } from 'lucide-react';
import { AddTransactionPanel, TransactionType } from './AddTransactionPanel';
import { BulkUploadPanel } from './BulkUploadPanel';

interface Transaction {
  id: string;
  polizaPadre: string;
  polizaCobranza: string;
  numRecibo: string;
  montoEsperado: string;
  monto: string;
  montoTransaccion?: string;
}

const initialTransactions: Transaction[] = [
  { id: '1', polizaPadre: '37453655', polizaCobranza: '37455240', numRecibo: '1002', montoEsperado: '-$12,080,716.59', monto: '-$12,080,716.59' },
  { id: '2', polizaPadre: '37453655', polizaCobranza: '37455240', numRecibo: '1001', montoEsperado: '-$12,080,716.59', monto: '$0.00' },
  { id: '3', polizaPadre: '37453655', polizaCobranza: '37455240', numRecibo: '1000', montoEsperado: '$80,916,246.33', monto: '$80,916,246.33' },
  { id: '4', polizaPadre: '37707179', polizaCobranza: '45871285', numRecibo: '2027033', montoEsperado: '$323,334.51', monto: '$323,334.51' },
];

interface ReconciliationDetailProps {
  clientName: string;
  monthName: string;
  reconciliationId: string;
  reconciliationName: string;
  onBack: () => void;
}

export function ReconciliationDetail({ clientName, monthName, reconciliationId, reconciliationName, onBack }: ReconciliationDetailProps) {
  const storageKey = `nats_conciliation_txns_${clientName}_${monthName}_${reconciliationId}`;
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(transactions));
  }, [transactions, storageKey]);

  const [isCreditNotePanelOpen, setIsCreditNotePanelOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [selectedTransactionData, setSelectedTransactionData] = useState<{
    id?: string;
    polizaPadre: string;
    polizaCobranza: string;
    numRecibo?: string;
    montoEsperado?: string;
    monto?: string;
    type?: TransactionType;
    isEditing?: boolean;
  } | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const handleCreateTransaction = (data: any) => {
    console.log('Handling transaction:', data);
    
    // Clean and parse the amounts using the same logic as parseCurrency
    const amountEsperado = parseCurrency(data.montoEsperado);
    const amountRecibido = parseCurrency(data.monto);
    const amountTransaccion = parseCurrency(data.montoTransaccion);
    
    if (isNaN(amountEsperado) || isNaN(amountRecibido)) {
      console.error('Invalid amount entered:', data.montoEsperado, data.monto);
      return;
    }

    if (selectedTransactionData?.isEditing && selectedTransactionData.id) {
      // Update existing transaction
      setTransactions(prev => prev.map(t => {
        if (t.id === selectedTransactionData.id) {
          return {
            ...t,
            polizaPadre: data.polizaPadre || '-',
            polizaCobranza: data.polizaCobranza || '-',
            numRecibo: data.numRecibo || t.numRecibo,
            montoEsperado: formatCurrency(amountEsperado),
            monto: formatCurrency(amountRecibido),
            montoTransaccion: amountTransaccion !== 0 ? formatCurrency(amountTransaccion) : t.montoTransaccion,
          };
        }
        return t;
      }));
    } else {
      // Create new transaction
      const newTransaction: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        polizaPadre: data.polizaPadre || '-',
        polizaCobranza: data.polizaCobranza || '-',
        numRecibo: data.numRecibo || (data.type === 'nota_credito' ? `NC-${Math.floor(Math.random() * 10000)}` : `REC-${Math.floor(Math.random() * 10000)}`),
        montoEsperado: formatCurrency(amountEsperado),
        monto: formatCurrency(amountRecibido),
        montoTransaccion: amountTransaccion !== 0 ? formatCurrency(amountTransaccion) : undefined,
      };

      // Add to the beginning of the list so it's visible immediately
      setTransactions(prev => [newTransaction, ...prev]);
    }
    
    setIsCreditNotePanelOpen(false);
  };

  const handleBulkUpload = (data: any[]) => {
    const newTransactions: Transaction[] = data.map(item => ({
      id: Math.random().toString(36).substr(2, 9),
      polizaPadre: item.polizaPadre,
      polizaCobranza: item.polizaCobranza,
      numRecibo: item.numRecibo,
      montoEsperado: formatCurrency(parseCurrency(item.montoEsperado)),
      monto: formatCurrency(parseCurrency(item.monto)),
      montoTransaccion: formatCurrency(parseCurrency(item.montoTransaccion)),
    }));

    setTransactions(prev => [...newTransactions, ...prev]);
    setIsBulkUploadOpen(false);
  };

  const handleDeleteTransaction = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTransactionToDelete(id);
    setActiveDropdownId(null);
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      setTransactions(prev => prev.filter(t => t.id !== transactionToDelete));
      setTransactionToDelete(null);
    }
  };

  const openTransactionPanel = (transaction?: Transaction, type?: TransactionType, isEditing: boolean = false) => {
    if (transaction) {
      setSelectedTransactionData({
        id: transaction.id,
        polizaPadre: transaction.polizaPadre,
        polizaCobranza: transaction.polizaCobranza,
        numRecibo: transaction.numRecibo,
        montoEsperado: transaction.montoEsperado,
        monto: transaction.monto,
        type: type || (transaction.numRecibo.startsWith('NC') ? 'nota_credito' : 'poliza'),
        isEditing
      });
    } else {
      setSelectedTransactionData(null);
    }
    setIsCreditNotePanelOpen(true);
    setActiveDropdownId(null);
  };

  const parseCurrency = (value: string | number) => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    // Remove everything except numbers, dots, and minus signs
    const cleanValue = value.replace(/[^-0-9.]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalRecibos = transactions.length;

  const montoEsperadoTotal = transactions.reduce((sum, txn) => {
    return sum + parseCurrency(txn.montoEsperado);
  }, 0);

  const montoRecibidoTotal = transactions.reduce((sum, txn) => {
    return sum + parseCurrency(txn.monto);
  }, 0);

  const diferenciaTotal = montoRecibidoTotal - montoEsperadoTotal;

  // Force re-calculation of global state in localStorage for other components
  useEffect(() => {
    const monthlyKey = `nats_conciliation_monthly_${clientName}`;
    const savedMonthly = localStorage.getItem(monthlyKey);
    if (savedMonthly) {
      const monthly = JSON.parse(savedMonthly);
      const updatedMonthly = monthly.map((m: any) => {
        if (m.mes === monthName) {
          return {
            ...m,
            monto: formatCurrency(montoRecibidoTotal),
            porcentaje: montoEsperadoTotal === 0 ? 100 : Math.round((montoRecibidoTotal / montoEsperadoTotal) * 100)
          };
        }
        return m;
      });
      localStorage.setItem(monthlyKey, JSON.stringify(updatedMonthly));
    }
  }, [transactions, montoRecibidoTotal, montoEsperadoTotal, clientName, monthName]);

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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{clientName} · {reconciliationName}</h1>
            <p className="text-[11px] font-normal text-gray-500">{totalRecibos} recibos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsBulkUploadOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-[11px] font-normal transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Carga Masiva
          </button>
          <button 
            onClick={() => openTransactionPanel()}
            className="flex items-center gap-2 bg-[#6b21a8] hover:bg-[#581c87] text-white px-4 py-2.5 rounded-lg text-[11px] font-normal transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-normal text-gray-500 mb-1 uppercase tracking-wider">Total Recibos</p>
          <p className="text-[14px] font-bold text-gray-900">{totalRecibos}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-normal text-gray-500 mb-1 uppercase tracking-wider">Monto Esperado</p>
          <p className="text-[14px] font-bold text-gray-900">{formatCurrency(montoEsperadoTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-normal text-gray-500 mb-1 uppercase tracking-wider">Monto Recibido</p>
          <p className="text-[14px] font-bold text-green-600">{formatCurrency(montoRecibidoTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-normal text-gray-500 mb-1 uppercase tracking-wider">Diferencia</p>
          <p className={`text-[14px] font-bold ${diferenciaTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {diferenciaTotal > 0 ? '+' : ''}{formatCurrency(diferenciaTotal)}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Póliza Padre</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Póliza de Cobranza</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Num. Recibo</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Monto Esperado</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Monto Recibido</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Monto Transacción</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row) => {
                const montoEsperadoNum = parseFloat(row.montoEsperado.replace(/[$,]/g, ''));
                const montoNum = parseFloat(row.monto.replace(/[$,]/g, ''));
                const estado = montoEsperadoNum === montoNum ? 'Conciliado' : 'No conciliado';
                return (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-[12px] font-normal text-gray-900">{row.polizaPadre}</td>
                    <td className="py-3 px-4 text-[12px] font-normal text-gray-900">{row.polizaCobranza}</td>
                    <td className="py-3 px-4 text-[12px] font-normal text-gray-900">{row.numRecibo}</td>
                    <td className="py-3 px-4 text-[12px] font-normal text-gray-500">{row.montoEsperado}</td>
                    <td className="py-3 px-4 text-[12px] font-medium text-gray-900">{row.monto}</td>
                    <td className="py-3 px-4 text-[12px] font-normal text-gray-500">{row.montoTransaccion || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium ${
                        estado === 'Conciliado' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 relative">
                      <button 
                        onClick={() => setActiveDropdownId(activeDropdownId === row.id ? null : row.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      
                      {activeDropdownId === row.id && (
                        <div 
                          ref={dropdownRef}
                          className="absolute right-8 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10"
                        >
                          <button
                            onClick={() => openTransactionPanel(row, undefined, true)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => openTransactionPanel(row, 'nota_credito')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Crear nota de crédito
                          </button>
                          <button
                            onClick={(e) => handleDeleteTransaction(row.id, e)}
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

      <AddTransactionPanel
        isOpen={isCreditNotePanelOpen}
        onClose={() => setIsCreditNotePanelOpen(false)}
        initialData={selectedTransactionData}
        onSubmit={handleCreateTransaction}
      />

      <BulkUploadPanel
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onUpload={handleBulkUpload}
      />

      {/* Delete Confirmation Modal */}
      {transactionToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-6 text-red-600">
              <div className="p-3 bg-red-50 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">¿Eliminar recibo?</h3>
            </div>
            
            <p className="text-gray-600 mb-8">
              Esta acción no se puede deshacer. El recibo será eliminado permanentemente de esta conciliación.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setTransactionToDelete(null)}
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
