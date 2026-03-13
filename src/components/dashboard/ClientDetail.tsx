import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings2, Plus, Loader2, User, Mail, Pencil, Check, X, Trash2, FileText } from 'lucide-react';
import { ClientData, Responsible } from './ClientTable';
import { ReconciliationRulesModal } from './ReconciliationRulesModal';
import { CreateReconciliationPanel } from './CreateReconciliationPanel';
import { MonthlyTransactionsView } from './MonthlyTransactionsView';
import { PoliciesTableView } from './PoliciesTableView';

interface ClientDetailProps {
  client: ClientData;
  onBack: () => void;
  onUpdateClient: (client: ClientData) => void;
}

const initialMonthlyData: any[] = [];

const ProgressBar = ({ percentage, status }: { percentage: number, status?: string }) => {
  const isComplete = percentage === 100;
  const barColor = isComplete ? 'bg-green-600' : 'bg-[#6b21a8]';
  const bgColor = 'bg-gray-100';

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold w-10 text-gray-400">0%</span>
        <div className={`h-1.5 w-24 rounded-full ${bgColor} overflow-hidden relative`}>
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        </div>
        <Loader2 className="w-4 h-4 text-[#6b21a8] animate-spin" />
      </div>
    );
  }

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

export function ClientDetail({ client, onBack, onUpdateClient }: ClientDetailProps) {
  const storageKey = `nats_conciliation_monthly_${client.cliente}`;
  
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isEditingResponsibles, setIsEditingResponsibles] = useState(false);
  const [tempGnpResponsables, setTempGnpResponsables] = useState<Responsible[]>([]);
  const [tempIntermediarioResponsables, setTempIntermediarioResponsables] = useState<Responsible[]>([]);

  useEffect(() => {
    if (isEditingResponsibles) {
      setTempGnpResponsables(client.gnpResponsables || [{ name: '', email: '' }]);
      setTempIntermediarioResponsables(client.intermediarioResponsables || [{ name: '', email: '' }]);
    }
  }, [isEditingResponsibles, client]);

  const handleSaveResponsibles = () => {
    const filteredGnp = tempGnpResponsables.filter(r => r.name.trim() || r.email.trim());
    const filteredInter = tempIntermediarioResponsables.filter(r => r.name.trim() || r.email.trim());
    
    onUpdateClient({
      ...client,
      gnpResponsables: filteredGnp,
      intermediarioResponsables: filteredInter
    });
    setIsEditingResponsibles(false);
  };

  const addResponsible = (type: 'gnp' | 'intermediario') => {
    if (type === 'gnp') {
      setTempGnpResponsables([...tempGnpResponsables, { name: '', email: '' }]);
    } else {
      setTempIntermediarioResponsables([...tempIntermediarioResponsables, { name: '', email: '' }]);
    }
  };

  const removeResponsible = (type: 'gnp' | 'intermediario', index: number) => {
    if (type === 'gnp') {
      setTempGnpResponsables(tempGnpResponsables.filter((_, i) => i !== index));
    } else {
      setTempIntermediarioResponsables(tempIntermediarioResponsables.filter((_, i) => i !== index));
    }
  };

  const updateResponsible = (type: 'gnp' | 'intermediario', index: number, field: keyof Responsible, value: string) => {
    if (type === 'gnp') {
      const updated = [...tempGnpResponsables];
      updated[index] = { ...updated[index], [field]: value };
      setTempGnpResponsables(updated);
    } else {
      const updated = [...tempIntermediarioResponsables];
      updated[index] = { ...updated[index], [field]: value };
      setTempIntermediarioResponsables(updated);
    }
  };

  const [monthlyData, setMonthlyData] = useState<any[]>(() => {
    const saved = localStorage.getItem(storageKey);
    const data = saved ? JSON.parse(saved) : initialMonthlyData;
    
    // Update each item with real data from its own transaction storage
    return data.map((item: any) => {
      const reconciliationsKey = `nats_conciliation_reconciliations_${client.cliente}_${item.mes}`;
      const savedReconciliations = localStorage.getItem(reconciliationsKey);
      
      let totalEsperado = 0;
      let totalRecibido = 0;
      const parseCurrency = (val: string) => parseFloat(val.replace(/[^-0-9.]/g, '')) || 0;

      if (savedReconciliations) {
        const reconciliations = JSON.parse(savedReconciliations);
        reconciliations.forEach((recon: any) => {
          const txnKey = `nats_conciliation_txns_${client.cliente}_${item.mes}_${recon.id}`;
          const savedTxns = localStorage.getItem(txnKey);
          if (savedTxns) {
            const txns = JSON.parse(savedTxns);
            totalEsperado += txns.reduce((sum: number, t: any) => sum + parseCurrency(t.montoEsperado), 0);
            totalRecibido += txns.reduce((sum: number, t: any) => sum + parseCurrency(t.monto), 0);
          }
        });
      }
      
      const percentage = totalEsperado === 0 ? 100 : Math.round((totalRecibido / totalEsperado) * 100);
      
      return {
        ...item,
        monto: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalRecibido),
        porcentaje: Math.min(100, Math.max(0, percentage)),
        status: 'completed'
      };
    });
  });
  const [selectedReconciliation, setSelectedReconciliation] = useState<any | null>(null);
  const [showPolicies, setShowPolicies] = useState(false);

  // Save to localStorage whenever monthlyData changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(monthlyData));
  }, [monthlyData, storageKey]);

  // Re-calculate when coming back from detail view
  useEffect(() => {
    if (!selectedReconciliation) {
      setMonthlyData(prev => prev.map(item => {
        const reconciliationsKey = `nats_conciliation_reconciliations_${client.cliente}_${item.mes}`;
        const savedReconciliations = localStorage.getItem(reconciliationsKey);
        
        let totalEsperado = 0;
        let totalRecibido = 0;
        const parseCurrency = (val: string) => parseFloat(val.replace(/[^-0-9.]/g, '')) || 0;

        if (savedReconciliations) {
          const reconciliations = JSON.parse(savedReconciliations);
          reconciliations.forEach((recon: any) => {
            const txnKey = `nats_conciliation_txns_${client.cliente}_${item.mes}_${recon.id}`;
            const savedTxns = localStorage.getItem(txnKey);
            if (savedTxns) {
              const txns = JSON.parse(savedTxns);
              totalEsperado += txns.reduce((sum: number, t: any) => sum + parseCurrency(t.montoEsperado), 0);
              totalRecibido += txns.reduce((sum: number, t: any) => sum + parseCurrency(t.monto), 0);
            }
          });
        }
        
        const percentage = totalEsperado === 0 ? 100 : Math.round((totalRecibido / totalEsperado) * 100);
        
        return {
          ...item,
          monto: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalRecibido),
          porcentaje: Math.min(100, Math.max(0, percentage)),
          status: 'completed'
        };
      }));
    }
  }, [selectedReconciliation, client.cliente]);

  const handleCreateReconciliation = (name: string) => {
    const newReconciliation = {
      id: Math.random().toString(36).substr(2, 9),
      mes: name,
      monto: '$0.00',
      porcentaje: 0,
      status: 'loading'
    };
    
    setMonthlyData([newReconciliation, ...monthlyData]);
    
    // Simulate processing time
    setTimeout(() => {
      setMonthlyData(current => 
        current.map(item => 
          item.id === newReconciliation.id 
            ? { ...item, status: 'completed', porcentaje: Math.floor(Math.random() * 100), monto: `$${(Math.random() * 100000).toFixed(2)}` }
            : item
        )
      );
    }, 3000);
  };

  if (selectedReconciliation) {
    return (
      <MonthlyTransactionsView 
        clientName={client.cliente}
        monthName={selectedReconciliation.mes}
        onBack={() => setSelectedReconciliation(null)}
      />
    );
  }

  if (showPolicies) {
    return (
      <PoliciesTableView 
        client={client}
        onBack={() => setShowPolicies(false)}
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
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{client.cliente}</h1>
            <p className="text-sm text-gray-500">{client.porcentaje}% conciliado (global)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowPolicies(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            Ver Pólizas
          </button>
          <button 
            onClick={() => setIsRulesModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Settings2 className="w-4 h-4" />
            Reglas de Conciliación
          </button>
          <button 
            onClick={() => setIsCreatePanelOpen(true)}
            className="flex items-center gap-2 bg-[#6b21a8] hover:bg-[#581c87] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crear Conciliación
          </button>
        </div>
      </div>

      {/* Responsibles Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Información de Contacto</h2>
          {!isEditingResponsibles ? (
            <button 
              onClick={() => setIsEditingResponsibles(true)}
              className="flex items-center gap-2 text-[#6b21a8] hover:text-[#581c87] text-xs font-bold transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              EDITAR RESPONSABLES
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditingResponsibles(false)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-xs font-bold transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                CANCELAR
              </button>
              <button 
                onClick={handleSaveResponsibles}
                className="flex items-center gap-2 text-[#6b21a8] hover:text-[#581c87] text-xs font-bold transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                GUARDAR CAMBIOS
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* GNP Responsables */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Responsables GNP</h3>
            </div>
            <div className="p-4 space-y-4">
              {!isEditingResponsibles ? (
                client.gnpResponsables && client.gnpResponsables.length > 0 ? (
                  client.gnpResponsables.map((resp, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {resp.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {resp.email}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No hay responsables asignados</p>
                )
              ) : (
                <div className="space-y-4">
                  {tempGnpResponsables.map((resp, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={resp.name}
                          onChange={(e) => updateResponsible('gnp', idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8]"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={resp.email}
                          onChange={(e) => updateResponsible('gnp', idx, 'email', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8]"
                        />
                      </div>
                      <button 
                        onClick={() => removeResponsible('gnp', idx)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => addResponsible('gnp')}
                    className="flex items-center gap-2 text-[#6b21a8] hover:text-[#581c87] text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    AGREGAR RESPONSABLE
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Intermediario Responsables */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Responsables Intermediario</h3>
            </div>
            <div className="p-4 space-y-4">
              {!isEditingResponsibles ? (
                client.intermediarioResponsables && client.intermediarioResponsables.length > 0 ? (
                  client.intermediarioResponsables.map((resp, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        {resp.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {resp.email}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No hay responsables asignados</p>
                )
              ) : (
                <div className="space-y-4">
                  {tempIntermediarioResponsables.map((resp, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={resp.name}
                          onChange={(e) => updateResponsible('intermediario', idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8]"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={resp.email}
                          onChange={(e) => updateResponsible('intermediario', idx, 'email', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8]"
                        />
                      </div>
                      <button 
                        onClick={() => removeResponsible('intermediario', idx)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => addResponsible('intermediario')}
                    className="flex items-center gap-2 text-[#6b21a8] hover:text-[#581c87] text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    AGREGAR RESPONSABLE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-1/2">Mes</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-1/4">Monto</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-900 w-1/4">% Conciliado</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((row) => (
                <tr 
                  key={row.id} 
                  className={`border-b border-gray-100 transition-colors ${row.status === 'loading' ? '' : 'hover:bg-gray-50/50 cursor-pointer'}`}
                  onClick={() => row.status !== 'loading' && setSelectedReconciliation(row)}
                >
                  <td className="py-3 px-4 text-xs font-medium text-gray-900">{row.mes}</td>
                  <td className="py-3 px-4 text-xs text-gray-900">{row.status === 'loading' ? '-' : row.monto}</td>
                  <td className="py-3 px-4">
                    <ProgressBar percentage={row.porcentaje} status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ReconciliationRulesModal 
        isOpen={isRulesModalOpen} 
        onClose={() => setIsRulesModalOpen(false)} 
      />

      <CreateReconciliationPanel
        isOpen={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        onCreate={handleCreateReconciliation}
      />
    </div>
  );
}
