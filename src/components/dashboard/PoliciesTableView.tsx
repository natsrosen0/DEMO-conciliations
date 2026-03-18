import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronRight, FileText, Shield, Building2, Receipt, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientData, Subsidiary, PolizaPadre, PolizaCobranza, Invoice } from './ClientTable';

interface PoliciesTableViewProps {
  client: ClientData;
  onBack: () => void;
}

type ViewLevel = 'subsidiaries' | 'padres' | 'cobranzas' | 'invoices';

export function PoliciesTableView({ client, onBack }: PoliciesTableViewProps) {
  const [currentLevel, setCurrentLevel] = useState<ViewLevel>('subsidiaries');
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary | null>(null);
  const [selectedPadre, setSelectedPadre] = useState<PolizaPadre | null>(null);
  const [selectedCobranza, setSelectedCobranza] = useState<PolizaCobranza | null>(null);

  // Load data from localStorage
  const subsidiaries: Subsidiary[] = useMemo(() => {
    // 1. Load uploaded structure
    const structureKey = `nats_conciliation_structure_${client.cliente}`;
    const structureStr = localStorage.getItem(structureKey);
    const uploadedStructure = structureStr ? JSON.parse(structureStr) : [];

    // 2. Load transactions
    const monthsKey = `nats_conciliation_monthly_${client.cliente}`;
    const monthsStr = localStorage.getItem(monthsKey);
    const months = monthsStr ? JSON.parse(monthsStr) : [];
    const allTransactions: any[] = [];

    months.forEach((m: any) => {
      const reconKey = `nats_conciliation_reconciliations_${client.cliente}_${m.mes}`;
      const reconStr = localStorage.getItem(reconKey);
      if (reconStr) {
        const recons = JSON.parse(reconStr);
        recons.forEach((r: any) => {
          const txnKey = `nats_conciliation_txns_${client.cliente}_${m.mes}_${r.id}`;
          const txnStr = localStorage.getItem(txnKey);
          if (txnStr) {
            const txns = JSON.parse(txnStr);
            allTransactions.push(...txns);
          }
        });
      }
    });

    // 3. Build the hierarchy map
    const subsMap: Record<string, Subsidiary> = {};
    const reciboToHierarchy: Record<string, { sub: string, padre: string, cobranza: string, monto?: string }> = {};

    // First, populate with uploaded structure
    uploadedStructure.forEach((item: any) => {
      const subName = item.subsidiaria || 'Subsidiaria Principal';
      const padreNum = item.polizaPadre || '-';
      const cobranzaNum = item.polizaCobranza || '-';
      const reciboNum = item.recibo;
      const monto = item.monto;

      if (reciboNum) {
        reciboToHierarchy[reciboNum] = { sub: subName, padre: padreNum, cobranza: cobranzaNum, monto };
      }

      if (!subsMap[subName]) {
        subsMap[subName] = { id: `sub-${subName}`, name: subName, polizasPadre: [] };
      }

      let padre = subsMap[subName].polizasPadre.find(p => p.number === padreNum);
      if (!padre) {
        padre = { id: `padre-${subName}-${padreNum}`, number: padreNum, cobranzas: [] };
        subsMap[subName].polizasPadre.push(padre);
      }

      let cobranza = padre.cobranzas.find(c => c.number === cobranzaNum);
      if (!cobranza) {
        cobranza = { id: `cobranza-${subName}-${padreNum}-${cobranzaNum}`, number: cobranzaNum, invoices: [] };
        padre.cobranzas.push(cobranza);
      }
    });

    // Then, add transactions
    allTransactions.forEach((txn: any) => {
      let subName = 'Subsidiaria Principal';
      let padreNum = txn.polizaPadre || 'Sin Póliza Padre';
      let cobranzaNum = txn.polizaCobranza || 'Sin Póliza Cobranza';
      
      let montoEsperadoStr = txn.montoEsperado;
      
      const mapping = reciboToHierarchy[txn.numRecibo];
      if (mapping) {
        subName = mapping.sub;
        padreNum = mapping.padre;
        cobranzaNum = mapping.cobranza;
        if (mapping.monto) {
          montoEsperadoStr = mapping.monto;
        }
      }

      // Find or create the hierarchy path
      if (!subsMap[subName]) {
        subsMap[subName] = { id: `sub-${subName}`, name: subName, polizasPadre: [] };
      }

      let padre = subsMap[subName].polizasPadre.find(p => p.number === padreNum);
      if (!padre) {
        padre = { id: `padre-${subName}-${padreNum}`, number: padreNum, cobranzas: [] };
        subsMap[subName].polizasPadre.push(padre);
      }

      let cobranza = padre.cobranzas.find(c => c.number === cobranzaNum);
      if (!cobranza) {
        cobranza = { id: `cobranza-${subName}-${padreNum}-${cobranzaNum}`, number: cobranzaNum, invoices: [] };
        padre.cobranzas.push(cobranza);
      }

      const montoRecibido = parseCurrency(txn.monto);
      const montoEsperado = parseCurrency(montoEsperadoStr);
      const isPaid = Math.abs(montoRecibido - montoEsperado) < 0.01 && montoEsperado > 0;

      cobranza.invoices.push({
        id: txn.id || Math.random().toString(36).substr(2, 9),
        number: txn.numRecibo || 'Sin Número',
        status: isPaid ? 'paid' : (montoRecibido > 0 ? 'error' : 'pending'),
        amount: montoEsperadoStr
      });
    });

    return Object.values(subsMap);
  }, [client.cliente]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const parseCurrency = (val: string) => parseFloat(val.replace(/[^-0-9.]/g, '')) || 0;

  // Helper to calculate totals for any level
  const calculateTotals = (items: any[], type: ViewLevel) => {
    let total = 0;
    let reconciled = 0;

    const processInvoices = (invoices: Invoice[]) => {
      invoices.forEach(inv => {
        const amt = parseCurrency(inv.amount);
        total += amt;
        if (inv.status === 'paid') reconciled += amt;
      });
    };

    const processCobranzas = (cobranzas: PolizaCobranza[]) => {
      cobranzas.forEach(cob => processInvoices(cob.invoices));
    };

    const processPadres = (padres: PolizaPadre[]) => {
      padres.forEach(padre => processCobranzas(padre.cobranzas));
    };

    const processSubsidiaries = (subs: Subsidiary[]) => {
      subs.forEach(sub => processPadres(sub.polizasPadre));
    };

    if (type === 'subsidiaries') processSubsidiaries(items);
    else if (type === 'padres') processPadres(items);
    else if (type === 'cobranzas') processCobranzas(items);
    else if (type === 'invoices') processInvoices(items);

    const remaining = total - reconciled;
    const percentage = total === 0 ? 100 : Math.round((reconciled / total) * 100);

    return { total, remaining, percentage };
  };

  const globalTotals = useMemo(() => calculateTotals(subsidiaries, 'subsidiaries'), [subsidiaries]);

  const ProgressBar = ({ percentage }: { percentage: number }) => {
    const isComplete = percentage === 100;
    const barColor = isComplete ? 'bg-green-600' : 'bg-[#6b21a8]';
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold w-10 text-gray-900">{percentage}%</span>
        <div className="h-1.5 w-24 rounded-full bg-gray-100 overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percentage}%` }}></div>
        </div>
      </div>
    );
  };

  const renderBreadcrumbs = () => (
    <div className="flex items-center gap-2 mb-6 text-xs font-medium">
      <button 
        onClick={() => {
          setCurrentLevel('subsidiaries');
          setSelectedSubsidiary(null);
          setSelectedPadre(null);
          setSelectedCobranza(null);
        }}
        className="flex items-center gap-1 text-gray-500 hover:text-[#6b21a8]"
      >
        <Home className="w-3.5 h-3.5" />
        Inicio
      </button>
      {selectedSubsidiary && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <button 
            onClick={() => {
              setCurrentLevel('padres');
              setSelectedPadre(null);
              setSelectedCobranza(null);
            }}
            className="text-gray-500 hover:text-[#6b21a8]"
          >
            {selectedSubsidiary.name}
          </button>
        </>
      )}
      {selectedPadre && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <button 
            onClick={() => {
              setCurrentLevel('cobranzas');
              setSelectedCobranza(null);
            }}
            className="text-gray-500 hover:text-[#6b21a8]"
          >
            {selectedPadre.number}
          </button>
        </>
      )}
      {selectedCobranza && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <span className="text-gray-900">{selectedCobranza.number}</span>
        </>
      )}
    </div>
  );

  const renderTable = () => {
    let data: any[] = [];
    let title = "";
    let icon: any = null;

    if (currentLevel === 'subsidiaries') {
      data = subsidiaries.map(s => ({ ...s, ...calculateTotals([s], 'subsidiaries'), label: s.name }));
      title = "Subsidiarias";
      icon = <Building2 className="w-4 h-4" />;
    } else if (currentLevel === 'padres' && selectedSubsidiary) {
      data = selectedSubsidiary.polizasPadre.map(p => ({ ...p, ...calculateTotals([p], 'padres'), label: p.number }));
      title = "Pólizas Padre";
      icon = <Shield className="w-4 h-4" />;
    } else if (currentLevel === 'cobranzas' && selectedPadre) {
      data = selectedPadre.cobranzas.map(c => ({ ...c, ...calculateTotals([c], 'cobranzas'), label: c.number }));
      title = "Pólizas de Cobranza";
      icon = <FileText className="w-4 h-4" />;
    } else if (currentLevel === 'invoices' && selectedCobranza) {
      data = selectedCobranza.invoices.map(i => ({ 
        ...i, 
        total: parseCurrency(i.amount), 
        remaining: i.status === 'paid' ? 0 : parseCurrency(i.amount),
        percentage: i.status === 'paid' ? 100 : 0,
        label: i.number 
      }));
      title = "Recibos (Facturas)";
      icon = <Receipt className="w-4 h-4" />;
    }

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white rounded-lg border border-gray-200 text-gray-400">
              {icon}
            </div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{title}</h3>
          </div>
          <span className="text-[10px] font-bold bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
            {data.length} REGISTROS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-xs font-semibold text-gray-900">Nombre / Número</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-900">Monto Total</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-900">Por Conciliar</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-900">% Conciliado</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item) => (
                  <tr 
                    key={item.id} 
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => {
                      if (currentLevel === 'subsidiaries') {
                        setSelectedSubsidiary(item);
                        setCurrentLevel('padres');
                      } else if (currentLevel === 'padres') {
                        setSelectedPadre(item);
                        setCurrentLevel('cobranzas');
                      } else if (currentLevel === 'cobranzas') {
                        setSelectedCobranza(item);
                        setCurrentLevel('invoices');
                      }
                    }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-900">{item.label}</span>
                        {currentLevel !== 'invoices' && <ChevronRight className="w-3 h-3 text-gray-300" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-900">{formatCurrency(item.total)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${item.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(item.remaining)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <ProgressBar percentage={item.percentage} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-gray-400 italic">No hay datos disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Resumen de Pólizas</h1>
          <p className="text-sm text-gray-500">{client.cliente}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-xs font-medium text-gray-500 mb-1">Monto Total Pólizas</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{formatCurrency(globalTotals.total)}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <h3 className="text-xs font-medium text-gray-500">Total por Conciliar</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 text-red-600">{formatCurrency(globalTotals.remaining)}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${globalTotals.percentage === 100 ? 'bg-green-500' : 'bg-[#6b21a8]'}`}></div>
            <h3 className="text-xs font-medium text-gray-500">% Conciliación Global</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{globalTotals.percentage}%</span>
          </div>
        </div>
      </div>

      {renderBreadcrumbs()}
      {renderTable()}
    </div>
  );
}
