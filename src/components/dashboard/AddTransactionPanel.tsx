import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export type TransactionType = 'poliza' | 'nota_credito';

export interface AddTransactionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    polizaPadre: string;
    polizaCobranza: string;
    numRecibo?: string;
    monto?: string;
    type?: TransactionType;
    isEditing?: boolean;
  } | null;
  onSubmit: (data: any) => void;
}

export function AddTransactionPanel({ isOpen, onClose, initialData, onSubmit }: AddTransactionPanelProps) {
  const [type, setType] = useState<TransactionType>('poliza');
  const [polizaPadre, setPolizaPadre] = useState('');
  const [polizaCobranza, setPolizaCobranza] = useState('');
  const [numRecibo, setNumRecibo] = useState('');
  const [monto, setMonto] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setPolizaPadre(initialData.polizaPadre || '');
        setPolizaCobranza(initialData.polizaCobranza || '');
        setNumRecibo(initialData.numRecibo || '');
        // Clean monto if it comes with currency symbols
        const cleanMonto = initialData.monto ? initialData.monto.replace(/[$,]/g, '') : '';
        setMonto(cleanMonto);
        
        if (initialData.type) {
          setType(initialData.type);
        }
      } else {
        setPolizaPadre('');
        setPolizaCobranza('');
        setNumRecibo('');
        setMonto('');
        setType('poliza');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ type, polizaPadre, polizaCobranza, numRecibo, monto });
    onClose();
  };

  if (!isOpen) return null;

  const isEditing = !!initialData?.isEditing;
  const isPreloaded = !!initialData && !!initialData.polizaPadre && !isEditing;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="flex items-start justify-between px-6 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Editar Transacción' : (type === 'poliza' ? 'Agregar Póliza' : 'Crear Nota de Crédito')}
            </h2>
            {isPreloaded && (
              <p className="text-sm text-gray-500 mt-1">
                Asociada a póliza de cobranza {initialData.polizaCobranza}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="add-transaction-form" onSubmit={handleSubmit} className="space-y-6">
            {!isPreloaded && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tipo de Transacción
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="transactionType" 
                      value="poliza" 
                      checked={type === 'poliza'} 
                      onChange={() => setType('poliza')}
                      className="text-[#6b21a8] focus:ring-[#6b21a8]"
                    />
                    <span className="text-sm text-gray-700">Póliza</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="transactionType" 
                      value="nota_credito" 
                      checked={type === 'nota_credito'} 
                      onChange={() => setType('nota_credito')}
                      className="text-[#6b21a8] focus:ring-[#6b21a8]"
                    />
                    <span className="text-sm text-gray-700">Nota de Crédito</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="polizaPadre" className="block text-sm font-semibold text-gray-900 mb-2">
                Póliza Padre
              </label>
              <input
                type="text"
                id="polizaPadre"
                value={polizaPadre}
                onChange={(e) => setPolizaPadre(e.target.value)}
                disabled={isPreloaded}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg outline-none transition-shadow text-gray-900 ${
                  isPreloaded ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:border-[#6b21a8] focus:ring-1 focus:ring-[#6b21a8]'
                }`}
                placeholder="Ej. 37707147"
                required
              />
            </div>

            <div>
              <label htmlFor="polizaCobranza" className="block text-sm font-semibold text-gray-900 mb-2">
                Póliza de Cobranza
              </label>
              <input
                type="text"
                id="polizaCobranza"
                value={polizaCobranza}
                onChange={(e) => setPolizaCobranza(e.target.value)}
                disabled={isPreloaded}
                className={`w-full px-4 py-3 border border-gray-200 rounded-lg outline-none transition-shadow text-gray-900 ${
                  isPreloaded ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'focus:border-[#6b21a8] focus:ring-1 focus:ring-[#6b21a8]'
                }`}
                placeholder="Ej. 45871231"
                required
              />
            </div>

            <div>
              <label htmlFor="numRecibo" className="block text-sm font-semibold text-gray-900 mb-2">
                {type === 'nota_credito' ? 'Num. Recibo (NC)' : 'Num. Recibo'}
              </label>
              <input
                type="text"
                id="numRecibo"
                value={numRecibo}
                onChange={(e) => setNumRecibo(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#6b21a8] rounded-lg focus:ring-0 focus:border-[#6b21a8] outline-none transition-shadow text-gray-900"
                placeholder={type === 'nota_credito' ? 'Ej. NC-001' : 'Ej. 2027034'}
                required
              />
            </div>

            <div>
              <label htmlFor="monto" className="block text-sm font-semibold text-gray-900 mb-2">
                Monto
              </label>
              <input
                type="text"
                id="monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-[#6b21a8] focus:ring-1 focus:ring-[#6b21a8] outline-none transition-shadow text-gray-900"
                placeholder="Ej. 500.00"
                required
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            type="submit"
            form="add-transaction-form"
            className="w-full py-3.5 text-sm font-medium text-white bg-[#a87ebf] hover:bg-[#9b6eb5] rounded-lg transition-colors shadow-sm"
          >
            {isEditing ? 'Guardar Cambios' : (type === 'poliza' ? 'Agregar Póliza' : 'Crear nota de crédito')}
          </button>
        </div>
      </div>
    </>
  );
}
