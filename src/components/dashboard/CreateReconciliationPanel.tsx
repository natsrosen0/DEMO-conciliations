import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';

export interface CreateReconciliationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function CreateReconciliationPanel({ isOpen, onClose, onCreate }: CreateReconciliationPanelProps) {
  const [nombre, setNombre] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nombre.trim()) {
      onCreate(nombre.trim());
      setNombre('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between px-6 py-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Crear Conciliación</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="create-reconciliation-form" onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="nombre" className="block text-sm font-semibold text-gray-900 mb-2">
                Nombre
              </label>
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 border-2 border-[#6b21a8] rounded-lg focus:ring-0 focus:border-[#6b21a8] outline-none transition-shadow text-gray-900"
                placeholder="Ej. Conciliación Febrero 2026"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">
                CASH
              </label>
              <button 
                type="button"
                className="w-full flex items-center justify-center gap-2 py-8 border border-dashed border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
              >
                <Upload className="w-4 h-4" />
                <span>Subir archivo</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Estado de Cuenta
              </label>
              <button 
                type="button"
                className="w-full flex items-center justify-center gap-2 py-8 border border-dashed border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
              >
                <Upload className="w-4 h-4" />
                <span>Subir archivo</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Archivo Aplicación
              </label>
              <button 
                type="button"
                className="w-full flex items-center justify-center gap-2 py-8 border border-dashed border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
              >
                <Upload className="w-4 h-4" />
                <span>Subir archivo</span>
              </button>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            type="submit"
            form="create-reconciliation-form"
            className="w-full py-3.5 text-sm font-medium text-white bg-[#a87ebf] hover:bg-[#9b6eb5] rounded-lg transition-colors shadow-sm"
          >
            Crear
          </button>
        </div>
      </div>
    </>
  );
}
