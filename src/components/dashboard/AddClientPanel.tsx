import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Responsible } from './ClientTable';

export interface AddClientPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (client: { 
    cliente: string; 
    agente: string;
    gnpResponsables: Responsible[];
    intermediarioResponsables: Responsible[];
    responsablesCuenta: Responsible[];
    periodicidadPago: 'Mensual' | 'Trimestral' | 'Anual';
  }) => void;
}

export function AddClientPanel({ isOpen, onClose, onAddClient }: AddClientPanelProps) {
  const [cliente, setCliente] = useState('');
  const [agente, setAgente] = useState('');
  const [periodicidadPago, setPeriodicidadPago] = useState<'Mensual' | 'Trimestral' | 'Anual'>('Mensual');
  const [gnpResponsables, setGnpResponsables] = useState<Responsible[]>([{ name: '', email: '' }]);
  const [intermediarioResponsables, setIntermediarioResponsables] = useState<Responsible[]>([{ name: '', email: '' }]);
  const [responsablesCuenta, setResponsablesCuenta] = useState<Responsible[]>([{ name: '', email: '' }]);

  const handleAddResponsible = (type: 'gnp' | 'intermediario' | 'cuenta') => {
    if (type === 'gnp') {
      setGnpResponsables([...gnpResponsables, { name: '', email: '' }]);
    } else if (type === 'intermediario') {
      setIntermediarioResponsables([...intermediarioResponsables, { name: '', email: '' }]);
    } else {
      setResponsablesCuenta([...responsablesCuenta, { name: '', email: '' }]);
    }
  };

  const handleRemoveResponsible = (type: 'gnp' | 'intermediario' | 'cuenta', index: number) => {
    if (type === 'gnp') {
      setGnpResponsables(gnpResponsables.filter((_, i) => i !== index));
    } else if (type === 'intermediario') {
      setIntermediarioResponsables(intermediarioResponsables.filter((_, i) => i !== index));
    } else {
      setResponsablesCuenta(responsablesCuenta.filter((_, i) => i !== index));
    }
  };

  const handleUpdateResponsible = (type: 'gnp' | 'intermediario' | 'cuenta', index: number, field: keyof Responsible, value: string) => {
    if (type === 'gnp') {
      const updated = [...gnpResponsables];
      updated[index][field] = value;
      setGnpResponsables(updated);
    } else if (type === 'intermediario') {
      const updated = [...intermediarioResponsables];
      updated[index][field] = value;
      setIntermediarioResponsables(updated);
    } else {
      const updated = [...responsablesCuenta];
      updated[index][field] = value;
      setResponsablesCuenta(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cliente.trim() && agente.trim()) {
      onAddClient({ 
        cliente: cliente.trim(), 
        agente: agente.trim(),
        periodicidadPago,
        gnpResponsables: gnpResponsables.filter(r => r.name.trim() || r.email.trim()),
        intermediarioResponsables: intermediarioResponsables.filter(r => r.name.trim() || r.email.trim()),
        responsablesCuenta: responsablesCuenta.filter(r => r.name.trim() || r.email.trim())
      });
      setCliente('');
      setAgente('');
      setPeriodicidadPago('Mensual');
      setGnpResponsables([{ name: '', email: '' }]);
      setIntermediarioResponsables([{ name: '', email: '' }]);
      setResponsablesCuenta([{ name: '', email: '' }]);
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
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
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
          <form id="add-client-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cliente" className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  Nombre del cliente
                </label>
                <input
                  type="text"
                  id="cliente"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none transition-shadow text-[11px] font-normal"
                  placeholder="Ej. Empresa S.A."
                  required
                />
              </div>

              <div>
                <label htmlFor="agente" className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  Agente asignado
                </label>
                <input
                  type="text"
                  id="agente"
                  value={agente}
                  onChange={(e) => setAgente(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none transition-shadow text-[11px] font-normal"
                  placeholder="Ej. Inter"
                  required
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="periodicidad" className="block text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">
                  Periodicidad de pago
                </label>
                <select
                  id="periodicidad"
                  value={periodicidadPago}
                  onChange={(e) => setPeriodicidadPago(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none transition-shadow bg-white text-[11px] font-normal"
                >
                  <option value="Mensual">Mensual</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>
            </div>

            {/* Responsables de Cuenta */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Responsables de Cuenta (Cliente)</h3>
                <button
                  type="button"
                  onClick={() => handleAddResponsible('cuenta')}
                  className="text-[#6b21a8] hover:text-[#581c87] text-[10px] font-normal flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Agregar responsable
                </button>
              </div>
              <div className="space-y-3">
                {responsablesCuenta.map((resp, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={resp.name}
                        onChange={(e) => handleUpdateResponsible('cuenta', index, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 text-[11px] font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] outline-none"
                        placeholder="Nombre"
                      />
                      <input
                        type="email"
                        value={resp.email}
                        onChange={(e) => handleUpdateResponsible('cuenta', index, 'email', e.target.value)}
                        className="w-full px-3 py-1.5 text-[11px] font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] outline-none"
                        placeholder="Email"
                      />
                    </div>
                    {responsablesCuenta.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveResponsible('cuenta', index)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* GNP Responsables */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Responsables GNP</h3>
                <button
                  type="button"
                  onClick={() => handleAddResponsible('gnp')}
                  className="text-[#6b21a8] hover:text-[#581c87] text-[10px] font-normal flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Agregar responsable
                </button>
              </div>
              <div className="space-y-3">
                {gnpResponsables.map((resp, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={resp.name}
                        onChange={(e) => handleUpdateResponsible('gnp', index, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 text-[11px] font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] outline-none"
                        placeholder="Nombre"
                      />
                      <input
                        type="email"
                        value={resp.email}
                        onChange={(e) => handleUpdateResponsible('gnp', index, 'email', e.target.value)}
                        className="w-full px-3 py-1.5 text-[11px] font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] outline-none"
                        placeholder="Email"
                      />
                    </div>
                    {gnpResponsables.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveResponsible('gnp', index)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Intermediario Responsables */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Responsables Intermediario</h3>
                <button
                  type="button"
                  onClick={() => handleAddResponsible('intermediario')}
                  className="text-[#6b21a8] hover:text-[#581c87] text-[10px] font-normal flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Agregar responsable
                </button>
              </div>
              <div className="space-y-3">
                {intermediarioResponsables.map((resp, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={resp.name}
                        onChange={(e) => handleUpdateResponsible('intermediario', index, 'name', e.target.value)}
                        className="w-full px-3 py-1.5 text-[11px] font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] outline-none"
                        placeholder="Nombre"
                      />
                      <input
                        type="email"
                        value={resp.email}
                        onChange={(e) => handleUpdateResponsible('intermediario', index, 'email', e.target.value)}
                        className="w-full px-3 py-1.5 text-[11px] font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] outline-none"
                        placeholder="Email"
                      />
                    </div>
                    {intermediarioResponsables.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveResponsible('intermediario', index)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[11px] font-normal text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="add-client-form"
            className="px-4 py-2 text-[11px] font-normal text-white bg-[#6b21a8] hover:bg-[#581c87] rounded-lg transition-colors shadow-sm"
          >
            Agregar cliente
          </button>
        </div>
      </div>
    </>
  );
}
