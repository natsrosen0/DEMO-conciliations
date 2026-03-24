import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronRight, FileText, Shield, Building2, Receipt, Home, Trash2, Upload, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientData, Subsidiary, PolizaPadre, PolizaCobranza, Invoice } from './ClientTable';

interface PoliciesTableViewProps {
  client: ClientData;
  onBack?: () => void;
  onUploadClick: () => void;
  hideHeader?: boolean;
  summaryOnly?: boolean;
  onViewDetails?: () => void;
}

type ViewLevel = 'subsidiaries' | 'padres' | 'cobranzas' | 'invoices';

export function PoliciesTableView({ 
  client, 
  onBack, 
  onUploadClick, 
  hideHeader = false,
  summaryOnly = false,
  onViewDetails
}: PoliciesTableViewProps) {
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
    const reciboToHierarchy: Record<string, { sub: string, padre: string, cobranza: string, monto?: string, estado?: string }> = {};
    const processedRecibos = new Set<string>();

    // First, populate with uploaded structure
    uploadedStructure.forEach((item: any) => {
      const subName = (item.subsidiaria || 'Subsidiaria Principal').trim();
      const padreNum = (item.polizaPadre || '-').trim();
      const cobranzaNum = (item.polizaCobranza || '-').trim();
      const reciboNum = item.recibo?.toString().trim();
      const monto = item.monto;
      const estado = item.estado;

      if (reciboNum) {
        reciboToHierarchy[reciboNum] = { sub: subName, padre: padreNum, cobranza: cobranzaNum, monto, estado };
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
      let padreNum = (txn.polizaPadre || 'Sin Póliza Padre').trim();
      let cobranzaNum = (txn.polizaCobranza || 'Sin Póliza Cobranza').trim();
      
      let montoEsperadoStr = txn.montoEsperado;
      
      const reciboKey = txn.numRecibo?.toString().trim();
      const mapping = reciboKey ? reciboToHierarchy[reciboKey] : null;
      if (mapping) {
        subName = mapping.sub;
        padreNum = mapping.padre;
        cobranzaNum = mapping.cobranza;
        if (mapping.monto) {
          montoEsperadoStr = mapping.monto;
        }
        processedRecibos.add(reciboKey);
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
      const isPaid = Math.abs(montoRecibido - montoEsperado) < 0.1 && montoEsperado > 0;

      cobranza.invoices.push({
        id: txn.id || Math.random().toString(36).substr(2, 9),
        number: txn.numRecibo || 'Sin Número',
        status: isPaid ? 'paid' : (montoRecibido > 0 ? 'error' : 'pending'),
        amount: montoEsperadoStr,
        paidAmount: txn.monto,
        estado: txn.estado || mapping?.estado
      });
    });

    // Finally, add receipts from structure that don't have transactions yet
    uploadedStructure.forEach((item: any) => {
      if (item.recibo && !processedRecibos.has(item.recibo)) {
        const subName = item.subsidiaria || 'Subsidiaria Principal';
        const padreNum = item.polizaPadre || '-';
        const cobranzaNum = item.polizaCobranza || '-';
        const monto = item.monto || '0';

        const sub = subsMap[subName];
        const padre = sub.polizasPadre.find(p => p.number === padreNum);
        const cobranza = padre?.cobranzas.find(c => c.number === cobranzaNum);

        if (cobranza) {
          cobranza.invoices.push({
            id: `struct-${item.recibo}`,
            number: item.recibo,
            status: 'pending',
            amount: monto,
            paidAmount: '0',
            estado: item.estado
          });
        }
      }
    });

    // 4. Sort and check for out-of-order payments
    Object.values(subsMap).forEach(sub => {
      let subHasError = false;
      sub.polizasPadre.forEach(padre => {
        let padreHasError = false;
        padre.cobranzas.forEach(cobranza => {
          // Sort invoices by number
          cobranza.invoices.sort((a, b) => {
            const numA = parseInt(a.number.toString().replace(/\D/g, '')) || 0;
            const numB = parseInt(b.number.toString().replace(/\D/g, '')) || 0;
            if (numA !== numB) return numA - numB;
            return a.number.toString().localeCompare(b.number.toString());
          });

          // Check for out of order
          let foundUnpaid = false;
          let cobranzaHasError = false;
          cobranza.invoices.forEach(inv => {
            const currentEstado = (inv.estado || '').toUpperCase();
            const isInvPaid = currentEstado === 'EMITIDO' || currentEstado === 'EMITIDA';
            if (isInvPaid && foundUnpaid) {
              inv.outOfOrder = true;
              cobranzaHasError = true;
              padreHasError = true;
              subHasError = true;
            }
            if (!isInvPaid) {
              foundUnpaid = true;
            }
          });
          cobranza.hasOrderError = cobranzaHasError;
        });
        padre.hasOrderError = padreHasError;
      });
      sub.hasOrderError = subHasError;
    });

    return Object.values(subsMap);
  }, [client.cliente]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const parseCurrency = (val: string | number) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    
    let str = val.toString().trim();
    // Remove currency symbols and spaces, but keep digits, commas, dots, and minus
    str = str.replace(/[^\d,.-]/g, '');
    
    if (!str) return 0;

    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    
    // If both exist, the one that appears last is the decimal separator
    if (lastComma !== -1 && lastDot !== -1) {
      if (lastComma > lastDot) {
        // 1.234,56 format
        return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
      } else {
        // 1,234.56 format
        return parseFloat(str.replace(/,/g, '')) || 0;
      }
    }
    
    // If only one exists, we need to guess
    if (lastComma !== -1) {
      const parts = str.split(',');
      // If it looks like a thousands separator (e.g., 1,000 or 1,000,000)
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        return parseFloat(str.replace(/,/g, '')) || 0;
      }
      // Otherwise treat as decimal
      return parseFloat(str.replace(',', '.')) || 0;
    }
    
    if (lastDot !== -1) {
      const parts = str.split('.');
      // If it looks like a thousands separator (e.g., 1.000)
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        return parseFloat(str.replace(/\./g, '')) || 0;
      }
      // Otherwise treat as decimal (default for parseFloat)
      return parseFloat(str) || 0;
    }
    
    return parseFloat(str) || 0;
  };

  // Helper to calculate totals for any level
  const calculateTotals = (items: any[], type: ViewLevel) => {
    let total = 0;
    let reconciled = 0;
    let actualPaid = 0;
    let allEmitido = true;
    let hasInvoices = false;
    let hasOrderError = false;

    const processInvoices = (invoices: any[]) => {
      if (invoices.length > 0) hasInvoices = true;
      invoices.forEach(inv => {
        const amt = parseCurrency(inv.amount);
        const received = parseCurrency(inv.paidAmount || 0);
        const currentEstado = (inv.estado || '').toUpperCase();
        const isInvEmitido = currentEstado === 'EMITIDO' || currentEstado === 'EMITIDA';
        
        // If it is "Emitido", reflect full amount in Total Pagado (Conciliated).
        const conciliated = isInvEmitido ? amt : 0;
        
        total += amt;
        reconciled += conciliated;
        actualPaid += received;
        
        if (!isInvEmitido) allEmitido = false;
        if (inv.outOfOrder) hasOrderError = true;
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
    const paidPercentage = total === 0 ? 100 : Math.round((actualPaid / total) * 100);
    
    const finalIsEmitido = hasInvoices ? allEmitido : (total === 0 && items.length > 0);

    return { total, reconciled, actualPaid, remaining, percentage, paidPercentage, isEmitido: finalIsEmitido, hasOrderError };
  };

  const globalTotals = useMemo(() => calculateTotals(subsidiaries, 'subsidiaries'), [subsidiaries]);

  const stats = useMemo(() => {
    const subsCount = subsidiaries.length;
    const padresCount = subsidiaries.reduce((acc, sub) => acc + sub.polizasPadre.length, 0);
    return { subsCount, padresCount };
  }, [subsidiaries]);

  const ProgressBar = ({ percentage, color }: { percentage: number, color?: string }) => {
    const isComplete = percentage === 100;
    const barColor = color || (isComplete ? 'bg-green-600' : 'bg-[#6b21a8]');
    return (
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-medium w-10 text-gray-900">{percentage}%</span>
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
    let childLabel = "";

    if (currentLevel === 'subsidiaries') {
      data = subsidiaries.map(s => ({ 
        ...s, 
        ...calculateTotals([s], 'subsidiaries'), 
        label: s.name,
        childCount: s.polizasPadre.length 
      }));
      title = "Contratantes";
      icon = <Building2 className="w-4 h-4" />;
      childLabel = "Pólizas Padre";
    } else if (currentLevel === 'padres' && selectedSubsidiary) {
      data = selectedSubsidiary.polizasPadre.map(p => ({ 
        ...p, 
        ...calculateTotals([p], 'padres'), 
        label: p.number,
        childCount: p.cobranzas.length
      }));
      title = "Pólizas Padre";
      icon = <Shield className="w-4 h-4" />;
      childLabel = "Pólizas Cobranza";
    } else if (currentLevel === 'cobranzas' && selectedPadre) {
      data = selectedPadre.cobranzas.map(c => ({ 
        ...c, 
        ...calculateTotals([c], 'cobranzas'), 
        label: c.number,
        childCount: c.invoices.length
      }));
      title = "Pólizas de Cobranza";
      icon = <FileText className="w-4 h-4" />;
      childLabel = "Recibos";
    } else if (currentLevel === 'invoices' && selectedCobranza) {
      data = selectedCobranza.invoices.map(i => {
        const totals = calculateTotals([i], 'invoices');
        return { 
          ...i, 
          ...totals,
          label: i.number,
          childCount: 0
        };
      });
      title = "Recibos (Facturas)";
      icon = <Receipt className="w-4 h-4" />;
      childLabel = "-";
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
          <span className="text-[10px] font-medium bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
            {data.length} REGISTROS
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Nombre / Número</th>
                {currentLevel !== 'invoices' && (
                  <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider text-center">{childLabel}</th>
                )}
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Total Pagado</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">% Pagado</th>
                {(currentLevel === 'cobranzas' || currentLevel === 'invoices') && (
                  <th className="py-3 px-4 text-[12px] font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                )}
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
                        <span className="text-[12px] font-normal text-gray-900">{item.label}</span>
                        {item.hasOrderError && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 animate-pulse" title="Error de orden de pago">
                            <Bell className="w-3 h-3" />
                            <span className="text-[9px] font-bold">ORDEN</span>
                          </div>
                        )}
                        {currentLevel !== 'invoices' && <ChevronRight className="w-3 h-3 text-gray-300" />}
                      </div>
                    </td>
                    {currentLevel !== 'invoices' && (
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[12px] font-medium">
                          {item.childCount}
                        </span>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className="text-[12px] font-medium text-green-600">
                        {formatCurrency(item.reconciled)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[12px] font-medium text-gray-900">{formatCurrency(item.total)}</td>
                    <td className="py-3 px-4">
                      <ProgressBar percentage={item.percentage} color="bg-blue-600" />
                    </td>
                    {(currentLevel === 'cobranzas' || currentLevel === 'invoices') && (
                      <td className="py-3 px-4">
                        {currentLevel === 'invoices' ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                            (item.estado?.toUpperCase() === 'EMITIDO' || item.estado?.toUpperCase() === 'EMITIDA')
                              ? 'bg-green-50 text-green-700 border border-green-100' 
                              : item.estado === 'REHABILITACION'
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : item.estado === 'CANCELADO'
                                  ? 'bg-red-50 text-red-700 border border-red-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {item.estado || 'POR EMITIR'}
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                            item.isEmitido
                              ? 'bg-green-50 text-green-700 border border-green-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {item.isEmitido ? 'Emitido' : 'POR EMITIR'}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400 italic">No hay datos disponibles</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteStructure = () => {
    setConfirmDelete(true);
  };

  const executeDelete = () => {
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
    onBack?.(); // Go back to the list as the data is now gone
  };

  if (summaryOnly) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Contratantes</p>
            <p className="text-[14px] font-medium text-gray-900">{stats.subsCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Pólizas Padre</p>
            <p className="text-[14px] font-medium text-gray-900">{stats.padresCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Total Pagado</p>
            <p className="text-[14px] font-medium text-green-600">{formatCurrency(globalTotals.reconciled)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Valor Total</p>
            <p className="text-[14px] font-medium text-gray-900">{formatCurrency(globalTotals.total)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">% Pagado</p>
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-medium text-[#6b21a8]">{globalTotals.percentage}%</p>
              <div className="flex-1 h-1.5 w-12 rounded-full bg-gray-100 overflow-hidden hidden sm:block">
                <div 
                  className={`h-full rounded-full ${globalTotals.percentage === 100 ? 'bg-green-500' : 'bg-[#6b21a8]'}`} 
                  style={{ width: `${globalTotals.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>
          {globalTotals.hasOrderError && (
            <div className="col-span-2 md:col-span-5 mt-4 flex items-center gap-3 bg-red-50 border border-red-100 p-3 rounded-xl animate-pulse">
              <div className="p-2 bg-red-100 rounded-full text-red-600">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-red-700 uppercase tracking-wider">Alerta de Orden de Pago</p>
                <p className="text-[10px] text-red-600">Se han detectado recibos pagados fuera de orden cronológico/numérico.</p>
              </div>
            </div>
          )}
        </div>
        {onViewDetails && (
          <div className="mt-6 pt-6 border-t border-gray-50 flex justify-end">
            <button 
              onClick={onViewDetails}
              className="text-[11px] font-medium text-[#6b21a8] hover:text-[#581c87] transition-colors flex items-center gap-1"
            >
              Ver detalle de pólizas
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar datos de {client.cliente}?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Se eliminarán permanentemente la estructura de pólizas y todas las transacciones asociadas a este cliente. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2.5 text-[11px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 px-4 py-2.5 text-[11px] font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-3">
            <button
              onClick={onUploadClick}
              className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-xl transition-all border border-gray-200 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Cargar Estructura
            </button>
            <button
              onClick={handleDeleteStructure}
              className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Estructura
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {!hideHeader && (
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8`}>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h3 className="text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Valor Total</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-[14px] font-medium text-gray-900">{formatCurrency(globalTotals.total)}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-600"></div>
              <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total Pagado</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[14px] font-medium text-green-600">{formatCurrency(globalTotals.reconciled)}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${globalTotals.percentage === 100 ? 'bg-green-500' : 'bg-blue-600'}`}></div>
              <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">% Pagado</h3>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[14px] font-medium text-gray-900">{globalTotals.percentage}%</span>
            </div>
          </div>
        </div>
      )}

      {renderBreadcrumbs()}
      {renderTable()}
    </div>
  );
}
