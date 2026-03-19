import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings2, Plus, Loader2, User, Mail, Pencil, Check, X, Trash2, Bell, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { ClientData, Responsible } from './ClientTable';
import { ReconciliationRulesModal } from './ReconciliationRulesModal';
import { CreateReconciliationPanel } from './CreateReconciliationPanel';
import { MonthlyTransactionsView } from './MonthlyTransactionsView';
import { PoliciesTableView } from './PoliciesTableView';
import { PolicyStructureUploadPanel } from './PolicyStructureUploadPanel';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays, isAfter, parseISO } from 'date-fns';

interface PaymentAlert {
  id: string;
  estimatedDate: string;
  thresholdDays: number;
  description: string;
  createdAt: string;
}

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
        <span className="text-[10px] font-medium w-10 text-gray-400">0%</span>
        <div className={`h-1.5 w-24 rounded-full ${bgColor} overflow-hidden relative`}>
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
        </div>
        <Loader2 className="w-4 h-4 text-[#6b21a8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-medium w-10 text-gray-900">{percentage}%</span>
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
  const [tempResponsablesCuenta, setTempResponsablesCuenta] = useState<Responsible[]>([]);
  const [tempPeriodicidadPago, setTempPeriodicidadPago] = useState<'Mensual' | 'Trimestral' | 'Anual'>('Mensual');
  const [isPolicyUploadOpen, setIsPolicyUploadOpen] = useState(false);
  const [isPolicyDetailOpen, setIsPolicyDetailOpen] = useState(false);
  const [policyRefreshTrigger, setPolicyRefreshTrigger] = useState(0);

  // Alerts state
  const alertsStorageKey = `nats_conciliation_alerts_${client.cliente}`;
  const [alerts, setAlerts] = useState<PaymentAlert[]>(() => {
    const saved = localStorage.getItem(alertsStorageKey);
    return saved ? JSON.parse(saved) : [];
  });
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [newAlertDate, setNewAlertDate] = useState<Date | null>(new Date());
  const [newAlertThreshold, setNewAlertThreshold] = useState(5);
  const [newAlertDescription, setNewAlertDescription] = useState('');

  useEffect(() => {
    localStorage.setItem(alertsStorageKey, JSON.stringify(alerts));
  }, [alerts, alertsStorageKey]);

  const handleCreateAlert = () => {
    if (!newAlertDate) return;
    
    const newAlert: PaymentAlert = {
      id: Math.random().toString(36).substr(2, 9),
      estimatedDate: newAlertDate.toISOString(),
      thresholdDays: newAlertThreshold,
      description: newAlertDescription || `Alerta de pago - ${format(newAlertDate, 'dd/MM/yyyy')}`,
      createdAt: new Date().toISOString()
    };
    
    setAlerts([newAlert, ...alerts]);
    setIsAlertModalOpen(false);
    setNewAlertDate(new Date());
    setNewAlertThreshold(5);
    setNewAlertDescription('');
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const checkAlertStatus = (alert: PaymentAlert) => {
    const estimated = parseISO(alert.estimatedDate);
    const triggerDate = addDays(estimated, alert.thresholdDays);
    const now = new Date();
    
    // For this demo, we'll assume "no payment registered" if the client's global percentage is < 100
    // In a real app, we'd check the specific month/period associated with the alert
    const isOverdue = isAfter(now, triggerDate) && client.porcentaje < 100;
    
    return {
      isOverdue,
      triggerDate: format(triggerDate, 'dd/MM/yyyy'),
      daysLeft: Math.ceil((triggerDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  useEffect(() => {
    if (isEditingResponsibles) {
      setTempGnpResponsables(client.gnpResponsables || [{ name: '', email: '' }]);
      setTempIntermediarioResponsables(client.intermediarioResponsables || [{ name: '', email: '' }]);
      setTempResponsablesCuenta(client.responsablesCuenta || [{ name: '', email: '' }]);
      setTempPeriodicidadPago(client.periodicidadPago || 'Mensual');
    }
  }, [isEditingResponsibles, client]);

  const handleSaveResponsibles = () => {
    const filteredGnp = tempGnpResponsables.filter(r => r.name.trim() || r.email.trim());
    const filteredInter = tempIntermediarioResponsables.filter(r => r.name.trim() || r.email.trim());
    const filteredCuenta = tempResponsablesCuenta.filter(r => r.name.trim() || r.email.trim());
    
    onUpdateClient({
      ...client,
      gnpResponsables: filteredGnp,
      intermediarioResponsables: filteredInter,
      responsablesCuenta: filteredCuenta,
      periodicidadPago: tempPeriodicidadPago
    });
    setIsEditingResponsibles(false);
  };

  const addResponsible = (type: 'gnp' | 'intermediario' | 'cuenta') => {
    if (type === 'gnp') {
      setTempGnpResponsables([...tempGnpResponsables, { name: '', email: '' }]);
    } else if (type === 'intermediario') {
      setTempIntermediarioResponsables([...tempIntermediarioResponsables, { name: '', email: '' }]);
    } else {
      setTempResponsablesCuenta([...tempResponsablesCuenta, { name: '', email: '' }]);
    }
  };

  const removeResponsible = (type: 'gnp' | 'intermediario' | 'cuenta', index: number) => {
    if (type === 'gnp') {
      setTempGnpResponsables(tempGnpResponsables.filter((_, i) => i !== index));
    } else if (type === 'intermediario') {
      setTempIntermediarioResponsables(tempIntermediarioResponsables.filter((_, i) => i !== index));
    } else {
      setTempResponsablesCuenta(tempResponsablesCuenta.filter((_, i) => i !== index));
    }
  };

  const updateResponsible = (type: 'gnp' | 'intermediario' | 'cuenta', index: number, field: keyof Responsible, value: string) => {
    if (type === 'gnp') {
      const updated = [...tempGnpResponsables];
      updated[index] = { ...updated[index], [field]: value };
      setTempGnpResponsables(updated);
    } else if (type === 'intermediario') {
      const updated = [...tempIntermediarioResponsables];
      updated[index] = { ...updated[index], [field]: value };
      setTempIntermediarioResponsables(updated);
    } else {
      const updated = [...tempResponsablesCuenta];
      updated[index] = { ...updated[index], [field]: value };
      setTempResponsablesCuenta(updated);
    }
  };

  const [monthlyData, setMonthlyData] = useState<any[]>(() => {
    const saved = localStorage.getItem(storageKey);
    const data = saved ? JSON.parse(saved) : initialMonthlyData;
    
    const structureKey = `nats_conciliation_structure_${client.cliente}`;
    const savedStructure = localStorage.getItem(structureKey);
    const uploadedStructure = savedStructure ? JSON.parse(savedStructure) : [];
    
    const reciboToMonto: Record<string, number> = {};
    const reciboToEstado: Record<string, string> = {};
    const parseCurrency = (val: string) => parseFloat(val.replace(/[^-0-9.]/g, '')) || 0;

    uploadedStructure.forEach((item: any) => {
      if (item.recibo) {
        if (item.monto) reciboToMonto[item.recibo] = parseCurrency(item.monto);
        if (item.estado) reciboToEstado[item.recibo] = item.estado;
      }
    });

    // Update each item with real data from its own transaction storage
    return data.map((item: any) => {
      const reconciliationsKey = `nats_conciliation_reconciliations_${client.cliente}_${item.mes}`;
      const savedReconciliations = localStorage.getItem(reconciliationsKey);
      
      let totalEsperado = 0;
      let totalRecibido = 0;
      let totalConciliado = 0;

      if (savedReconciliations) {
        const reconciliations = JSON.parse(savedReconciliations);
        reconciliations.forEach((recon: any) => {
          const txnKey = `nats_conciliation_txns_${client.cliente}_${item.mes}_${recon.id}`;
          const savedTxns = localStorage.getItem(txnKey);
          if (savedTxns) {
            const txns = JSON.parse(savedTxns);
            txns.forEach((t: any) => {
              let amt = parseCurrency(t.montoEsperado);
              const received = parseCurrency(t.monto);
              
              const mappingEstado = t.numRecibo ? reciboToEstado[t.numRecibo] : null;
              const isEmitido = !!((t.estado || mappingEstado) && (t.estado || mappingEstado).toLowerCase().includes('emitido'));
              
              if (t.numRecibo && reciboToMonto[t.numRecibo] !== undefined) {
                amt = reciboToMonto[t.numRecibo];
              }
              
              totalEsperado += amt;
              totalRecibido += received;
              totalConciliado += isEmitido ? amt : 0;
            });
          }
        });
      }
      
      const percentage = totalEsperado === 0 ? 100 : Math.round((totalConciliado / totalEsperado) * 100);
      
      return {
        ...item,
        monto: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalConciliado),
        porcentaje: Math.min(100, Math.max(0, percentage)),
        status: 'completed'
      };
    });
  });
  const [selectedReconciliation, setSelectedReconciliation] = useState<any | null>(null);

  // Save to localStorage whenever monthlyData changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(monthlyData));
  }, [monthlyData, storageKey]);

  // Re-calculate when coming back from detail view
  useEffect(() => {
    if (!selectedReconciliation) {
      const structureKey = `nats_conciliation_structure_${client.cliente}`;
      const savedStructure = localStorage.getItem(structureKey);
      const uploadedStructure = savedStructure ? JSON.parse(savedStructure) : [];
      
      const parseCurrency = (val: string) => parseFloat(val.replace(/[^-0-9.]/g, '')) || 0;
      const reciboToMonto: Record<string, number> = {};
      const reciboToEstado: Record<string, string> = {};
      uploadedStructure.forEach((item: any) => {
        if (item.recibo) {
          if (item.monto) reciboToMonto[item.recibo] = parseCurrency(item.monto);
          if (item.estado) reciboToEstado[item.recibo] = item.estado;
        }
      });

      setMonthlyData(prev => prev.map(item => {
        const reconciliationsKey = `nats_conciliation_reconciliations_${client.cliente}_${item.mes}`;
        const savedReconciliations = localStorage.getItem(reconciliationsKey);
        
        let totalEsperado = 0;
        let totalRecibido = 0;
        let totalConciliado = 0;

        if (savedReconciliations) {
          const reconciliations = JSON.parse(savedReconciliations);
          reconciliations.forEach((recon: any) => {
            const txnKey = `nats_conciliation_txns_${client.cliente}_${item.mes}_${recon.id}`;
            const savedTxns = localStorage.getItem(txnKey);
            if (savedTxns) {
              const txns = JSON.parse(savedTxns);
              txns.forEach((t: any) => {
                let amt = parseCurrency(t.montoEsperado);
                const received = parseCurrency(t.monto);
                
                const mappingEstado = t.numRecibo ? reciboToEstado[t.numRecibo] : null;
                const isEmitido = !!((t.estado || mappingEstado) && (t.estado || mappingEstado).toLowerCase().includes('emitido'));
                
                if (t.numRecibo && reciboToMonto[t.numRecibo] !== undefined) {
                  amt = reciboToMonto[t.numRecibo];
                }
                
                totalEsperado += amt;
                totalRecibido += received;
                totalConciliado += isEmitido ? amt : 0;
              });
            }
          });
        }
        
        const percentage = totalEsperado === 0 ? 100 : Math.round((totalConciliado / totalEsperado) * 100);
        
        return {
          ...item,
          monto: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalConciliado),
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

  const handleUploadPolicyStructure = (data: any[]) => {
    const structureKey = `nats_conciliation_structure_${client.cliente}`;
    localStorage.setItem(structureKey, JSON.stringify(data));
    setPolicyRefreshTrigger(prev => prev + 1);
  };

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const handleDeletePolicyStructure = () => {
    const clientName = client.cliente;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith(`nats_conciliation_structure_${clientName}`) ||
        key.startsWith(`nats_conciliation_monthly_${clientName}`) ||
        key.startsWith(`nats_conciliation_reconciliations_${clientName}`) ||
        key.startsWith(`nats_conciliation_txns_${clientName}`)
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    setPolicyRefreshTrigger(prev => prev + 1);
    setIsConfirmDeleteOpen(false);
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

  if (isPolicyDetailOpen) {
    return (
      <div key={policyRefreshTrigger}>
        <PoliciesTableView 
          client={client} 
          onBack={() => setIsPolicyDetailOpen(false)}
          onUploadClick={() => setIsPolicyUploadOpen(true)}
        />
      </div>
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
            <p className="text-sm text-gray-500">{client.porcentaje}% pagado (global)</p>
          </div>
        </div>
      </div>

      {/* Responsibles Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Información de Contacto</h2>
          {!isEditingResponsibles ? (
            <button 
              onClick={() => setIsEditingResponsibles(true)}
              className="flex items-center gap-2 text-[#6b21a8] hover:text-[#581c87] text-[10px] font-medium transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              EDITAR INFORMACIÓN
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditingResponsibles(false)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-[10px] font-medium transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                CANCELAR
              </button>
              <button 
                onClick={handleSaveResponsibles}
                className="flex items-center gap-2 text-[#6b21a8] hover:text-[#581c87] text-[10px] font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                GUARDAR CAMBIOS
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Responsables de Cuenta (Cliente) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Responsables de Cuenta (Cliente)</h3>
            </div>
            <div className="p-4 space-y-4">
              {!isEditingResponsibles ? (
                client.responsablesCuenta && client.responsablesCuenta.length > 0 ? (
                  client.responsablesCuenta.map((resp, idx) => (
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
                  {tempResponsablesCuenta.map((resp, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-1 gap-2">
                        <input
                          type="text"
                          placeholder="Nombre"
                          value={resp.name}
                          onChange={(e) => updateResponsible('cuenta', idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8]"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={resp.email}
                          onChange={(e) => updateResponsible('cuenta', idx, 'email', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8]"
                        />
                      </div>
                      <button 
                        onClick={() => removeResponsible('cuenta', idx)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => addResponsible('cuenta')}
                    className="flex items-center gap-2 text-[#6b21a8] hover:text-[#581c87] text-[10px] font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    AGREGAR RESPONSABLE
                  </button>
                </div>
              )}
            </div>
          </div>

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
                      <div className="flex-1 grid grid-cols-1 gap-2">
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
                    className="flex items-center gap-2 text-[#6b21a8] hover:text-[#581c87] text-[10px] font-medium transition-colors"
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
                      <div className="flex-1 grid grid-cols-1 gap-2">
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
                    className="flex items-center gap-2 text-[#6b21a8] hover:text-[#581c87] text-[10px] font-medium transition-colors"
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

      {/* Payment Config Section */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Configuración y Periodicidad de Pagos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Periodicidad de Pago</h3>
            </div>
            <div className="p-4">
              <label className="block text-xs font-medium text-gray-500 mb-2 uppercase">Periodicidad</label>
              {!isEditingResponsibles ? (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {client.periodicidadPago || 'Mensual'}
                </div>
              ) : (
                <select
                  value={tempPeriodicidadPago}
                  onChange={(e) => setTempPeriodicidadPago(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8] bg-white"
                >
                  <option value="Mensual">Mensual</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Anual">Anual</option>
                </select>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Alertas de Pago</h3>
              <button 
                onClick={() => setIsAlertModalOpen(true)}
                className="flex items-center gap-1.5 text-[#6b21a8] hover:text-[#581c87] text-[10px] font-bold transition-colors uppercase"
              >
                <Plus className="w-3 h-3" />
                Crear Alerta
              </button>
            </div>
            <div className="p-4">
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map(alert => {
                    const status = checkAlertStatus(alert);
                    return (
                      <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${status.isOverdue ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${status.isOverdue ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{alert.description}</p>
                            <p className="text-[10px] text-gray-500">
                              Estimado: {format(parseISO(alert.estimatedDate), 'dd/MM/yyyy')} • 
                              Gatillo: {status.triggerDate} ({alert.thresholdDays} días)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {status.isOverdue && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase">Vencido</span>
                            </div>
                          )}
                          <button 
                            onClick={() => handleDeleteAlert(alert.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 italic">No hay alertas configuradas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Policies Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Pólizas</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 text-[10px] font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              ELIMINAR ESTRUCTURA
            </button>
            <button 
              onClick={() => setIsPolicyUploadOpen(true)}
              className="flex items-center gap-2 text-[#6b21a8] hover:text-[#581c87] text-[10px] font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              CARGAR ESTRUCTURA
            </button>
          </div>
        </div>
        <div key={policyRefreshTrigger}>
          <PoliciesTableView 
            client={client} 
            hideHeader={true}
            summaryOnly={true}
            onUploadClick={() => setIsPolicyUploadOpen(true)}
            onViewDetails={() => setIsPolicyDetailOpen(true)}
          />
        </div>
      </div>

      {/* Confirmation Modal for Policy Deletion */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar datos de {client.cliente}?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Se eliminarán permanentemente la estructura de pólizas y todas las transacciones asociadas a este contratante. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="flex-1 px-4 py-2.5 text-[11px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeletePolicyStructure}
                className="flex-1 px-4 py-2.5 text-[11px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conciliations Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Conciliaciones</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsRulesModalOpen(true)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-[10px] font-medium transition-colors uppercase tracking-wider"
            >
              <Settings2 className="w-3.5 h-3.5" />
              Reglas de Conciliación
            </button>
            <button 
              onClick={() => setIsCreatePanelOpen(true)}
              className="flex items-center gap-2 text-[#6b21a8] hover:text-[#581c87] text-[10px] font-medium transition-colors uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear Conciliación
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider w-1/2">Mes</th>
                  <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider w-1/4">Total Pagado</th>
                  <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider w-1/4">% Pagado</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row) => (
                  <tr 
                    key={row.id} 
                    className={`border-b border-gray-100 transition-colors ${row.status === 'loading' ? '' : 'hover:bg-gray-50/50 cursor-pointer'}`}
                    onClick={() => row.status !== 'loading' && setSelectedReconciliation(row)}
                  >
                    <td className="py-3 px-4 text-[12px] font-normal text-gray-900">{row.mes}</td>
                    <td className="py-3 px-4 text-[12px] font-medium text-gray-900">{row.status === 'loading' ? '-' : row.monto}</td>
                    <td className="py-3 px-4">
                      <ProgressBar percentage={row.porcentaje} status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Alert Creation Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Crear Alerta de Pago</h3>
              <button onClick={() => setIsAlertModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">Descripción</label>
                <input
                  type="text"
                  placeholder="Ej: Pago Mensual Marzo"
                  value={newAlertDescription}
                  onChange={(e) => setNewAlertDescription(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">Fecha Estimada</label>
                  <div className="relative">
                    <DatePicker
                      selected={newAlertDate}
                      onChange={(date) => setNewAlertDate(date)}
                      dateFormat="dd/MM/yyyy"
                      className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8]"
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wider">Días de Tolerancia</label>
                  <input
                    type="number"
                    min="1"
                    value={newAlertThreshold}
                    onChange={(e) => setNewAlertThreshold(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6b21a8]/20 focus:border-[#6b21a8]"
                  />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-[11px] text-purple-700 leading-relaxed">
                  Se generará una alerta si no se registra el pago {newAlertThreshold} días después del {newAlertDate ? format(newAlertDate, 'dd/MM/yyyy') : '...'} (Gatillo: {newAlertDate ? format(addDays(newAlertDate, newAlertThreshold), 'dd/MM/yyyy') : '...'}).
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsAlertModalOpen(false)}
                className="flex-1 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAlert}
                className="flex-1 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white bg-[#6b21a8] hover:bg-[#581c87] rounded-xl transition-colors shadow-lg shadow-purple-200"
              >
                Crear Alerta
              </button>
            </div>
          </div>
        </div>
      )}

      <ReconciliationRulesModal 
        isOpen={isRulesModalOpen} 
        onClose={() => setIsRulesModalOpen(false)} 
      />

      <CreateReconciliationPanel
        isOpen={isCreatePanelOpen}
        onClose={() => setIsCreatePanelOpen(false)}
        onCreate={handleCreateReconciliation}
      />

      <PolicyStructureUploadPanel
        isOpen={isPolicyUploadOpen}
        onClose={() => setIsPolicyUploadOpen(false)}
        onUpload={handleUploadPolicyStructure}
      />
    </div>
  );
}
