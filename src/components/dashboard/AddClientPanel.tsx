import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface AddClientPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: { cliente: string; agente: string }) => void;
}

export function AddClientPanel({ isOpen, onClose, onAddClient }: AddClientPanelProps) {
  const [cliente, setCliente] = useState('');
  const [agente, setAgente] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cliente.trim() && agente.trim()) {
      onAddClient({ cliente: cliente.trim(), agente: agente.trim() });
      setCliente('');
      setAgente('');
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Agregar nuevo cliente</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="add-client-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del cliente
              </label>
              <input
                type="text"
                id="cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none transition-shadow"
                placeholder="Ej. Empresa S.A."
                required
              />
            </div>

            <div>
              <label htmlFor="agente" className="block text-sm font-medium text-gray-700 mb-1">
                Agente asignado
              </label>
              <input
                type="text"
                id="agente"
                value={agente}
                onChange={(e) => setAgente(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none transition-shadow"
                placeholder="Ej. Inter"
                required
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="add-client-form"
            className="px-4 py-2 text-sm font-medium text-white bg-[#6b21a8] hover:bg-[#581c87] rounded-lg transition-colors shadow-sm"
          >
            Agregar cliente
          </button>
        </div>
      </div>
    </>
  );
}
