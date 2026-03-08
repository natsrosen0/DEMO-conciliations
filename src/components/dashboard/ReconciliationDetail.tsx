import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import { AddTransactionPanel, TransactionType } from './AddTransactionPanel';

interface Transaction {
  id: string;
  polizaPadre: string;
  polizaCobranza: string;
  numRecibo: string;
  montoEsperado: string;
  monto: string;
}

const initialTransactions: Transaction[] = [
  { id: '1', polizaPadre: '37453655', polizaCobranza: '37455240', numRecibo: '1002', montoEsperado: '-$12,080,716.59', monto: '-$12,080,716.59' },
  { id: '2', polizaPadre: '37453655', polizaCobranza: '37455240', numRecibo: '1001', montoEsperado: '-$12,080,716.59', monto: '$0.00' },
  { id: '3', polizaPadre: '37453655', polizaCobranza: '37455240', numRecibo: '1000', montoEsperado: '$80,916,246.33', monto: '$80,916,246.33' },
  { id: '4', polizaPadre: '37707179', polizaCobranza: '45871285', numRecibo: '2027033', montoEsperado: '$323,334.51', monto: '$323,334.51' },
];

interface ReconciliationDetailProps {
  clientName: string;
  reconciliationName: string;
  onBack: () => void;
}

export function ReconciliationDetail({ clientName, reconciliationName, onBack }: ReconciliationDetailProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isCreditNotePanelOpen, setIsCreditNotePanelOpen] = useState(false);
  const [selectedTransactionData, setSelectedTransactionData] = useState<{
    id?: string;
    polizaPadre: string;
    polizaCobranza: string;
    numRecibo?: string;
    monto?: string;
    type?: TransactionType;
    isEditing?: boolean;
  } | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
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
    
    // Clean and parse the amount
    const rawMonto = data.monto.replace(/[$,]/g, '');
    const amount = parseFloat(rawMonto);
    
    if (isNaN(amount)) {
      console.error('Invalid amount entered:', data.monto);
      return;
    }

    // For credit notes, we want the expected amount to be negative.
    // If the user enters 500, it becomes -500. If they enter -500, it stays -500.
    const montoEsperadoValue = data.type === 'nota_credito' 
      ? (amount > 0 ? -amount : amount) 
      : amount;
    
    // For polizas, monto matches montoEsperado. For credit notes, it's 0 as per requirements.
    const montoValue = data.type === 'nota_credito' ? 0 : montoEsperadoValue;
    
    if (selectedTransactionData?.isEditing && selectedTransactionData.id) {
      // Update existing transaction
      setTransactions(prev => prev.map(t => {
        if (t.id === selectedTransactionData.id) {
          return {
            ...t,
            polizaPadre: data.polizaPadre || '-',
            polizaCobranza: data.polizaCobranza || '-',
            numRecibo: data.numRecibo || t.numRecibo,
            montoEsperado: formatCurrency(montoEsperadoValue),
            monto: formatCurrency(montoValue),
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
        montoEsperado: formatCurrency(montoEsperadoValue),
        monto: formatCurrency(montoValue),
      };

      // Add to the beginning of the list so it's visible immediately
      setTransactions(prev => [newTransaction, ...prev]);
    }
    
    setIsCreditNotePanelOpen(false);
  };

  const handleDeleteTransaction = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTransactions(prev => prev.filter(t => t.id !== id));
    setActiveDropdownId(null);
  };

  const openTransactionPanel = (transaction?: Transaction, type?: TransactionType, isEditing: boolean = false) => {
    if (transaction) {
      setSelectedTransactionData({
        id: transaction.id,
        polizaPadre: transaction.polizaPadre,
        polizaCobranza: transaction.polizaCobranza,
        numRecibo: transaction.numRecibo,
        monto: transaction.monto !== '$0.00' ? transaction.monto : transaction.montoEsperado,
        type: type || (transaction.numRecibo.startsWith('NC') ? 'nota_credito' : 'poliza'),
        isEditing
      });
    } else {
      setSelectedTransactionData(null);
    }
    setIsCreditNotePanelOpen(true);
    setActiveDropdownId(null);
  };

  const totalRecibos = transactions.length;

  const montoEsperadoTotal = transactions.reduce((sum, txn) => {
    const amount = parseFloat(txn.montoEsperado.replace(/[$,]/g, ''));
    return sum + amount;
  }, 0);

  const montoRecibidoTotal = transactions.reduce((sum, txn) => {
    const amount = parseFloat(txn.monto.replace(/[$,]/g, ''));
    return sum + amount;
  }, 0);

  const diferenciaTotal = montoRecibidoTotal - montoEsperadoTotal;

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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{clientName} · 03/02/2026</h1>
            <p className="text-sm text-gray-500">{totalRecibos} recibos</p>
          </div>
        </div>
        
        <button 
          onClick={() => openTransactionPanel()}
          className="flex items-center gap-2 bg-[#6b21a8] hover:bg-[#581c87] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Total Recibos</p>
          <p className="text-xl font-bold text-gray-900">{totalRecibos}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Monto Esperado</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(montoEsperadoTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Monto Recibido</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(montoRecibidoTotal)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Diferencia</p>
          <p className={`text-xl font-bold ${diferenciaTotal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
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
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Póliza Padre</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Póliza de Cobranza</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Num. Recibo</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Monto Esperado</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Monto</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500">Estado</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row) => {
                const montoEsperadoNum = parseFloat(row.montoEsperado.replace(/[$,]/g, ''));
                const montoNum = parseFloat(row.monto.replace(/[$,]/g, ''));
                const estado = montoEsperadoNum === montoNum ? 'Conciliado' : 'No conciliado';
                return (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-xs text-gray-900">{row.polizaPadre}</td>
                    <td className="py-3 px-4 text-xs text-gray-900">{row.polizaCobranza}</td>
                    <td className="py-3 px-4 text-xs text-gray-900">{row.numRecibo}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{row.montoEsperado}</td>
                    <td className="py-3 px-4 text-xs font-semibold text-gray-900">{row.monto}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
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
    </div>
  );
}
