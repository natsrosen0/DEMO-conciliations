import React, { useState, useMemo } from 'react';
import { ClientData } from './ClientTable';
import { PoliciesTableView } from './PoliciesTableView';
import { Search, Building2, ChevronRight, Upload, Shield, Receipt, DollarSign, Trash2 } from 'lucide-react';
import { PolicyStructureUploadPanel } from './PolicyStructureUploadPanel';

interface PoliciesPageProps {
  clients: ClientData[];
}

export function PoliciesPage({ clients }: PoliciesPageProps) {
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'single' | 'all', clientName?: string } | null>(null);

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

  const getClientMetrics = (clientName: string) => {
    // 1. Load uploaded structure
    const structureKey = `nats_conciliation_structure_${clientName}`;
    const structureStr = localStorage.getItem(structureKey);
    const uploadedStructure = structureStr ? JSON.parse(structureStr) : [];

    // 2. Load transactions
    const monthsKey = `nats_conciliation_monthly_${clientName}`;
    const monthsStr = localStorage.getItem(monthsKey);
    const months = monthsStr ? JSON.parse(monthsStr) : [];
    
    let totalExpected = 0;
    let totalPaid = 0;
    const padreNumbers = new Set<string>();
    const subsSet = new Set<string>();
    
    // Track which receipts have been processed from transactions
    const processedRecibos = new Set<string>();

    // Map to track overrides and hierarchy from structure
    const reciboToMonto: Record<string, number> = {};
    const reciboToSub: Record<string, string> = {};

    uploadedStructure.forEach((item: any) => {
      const subName = item.subsidiaria || 'Subsidiaria Principal';
      subsSet.add(subName);
      if (item.polizaPadre && item.polizaPadre !== '-') {
        padreNumbers.add(item.polizaPadre);
      }
      if (item.recibo) {
        reciboToSub[item.recibo] = subName;
        if (item.monto) {
          reciboToMonto[item.recibo] = parseCurrency(item.monto);
        }
      }
    });

    // Process all transactions
    months.forEach((m: any) => {
      const reconKey = `nats_conciliation_reconciliations_${clientName}_${m.mes}`;
      const reconStr = localStorage.getItem(reconKey);
      if (reconStr) {
        const recons = JSON.parse(reconStr);
        recons.forEach((r: any) => {
          const txnKey = `nats_conciliation_txns_${clientName}_${m.mes}_${r.id}`;
          const txnStr = localStorage.getItem(txnKey);
          if (txnStr) {
            const txns = JSON.parse(txnStr);
            txns.forEach((txn: any) => {
              if (txn.polizaPadre && txn.polizaPadre !== 'Sin Póliza Padre') {
                padreNumbers.add(txn.polizaPadre);
              }

              // Count subsidiaries from transactions
              const mappingSub = reciboToSub[txn.numRecibo];
              if (mappingSub) {
                subsSet.add(mappingSub);
              } else {
                subsSet.add('Subsidiaria Principal');
              }

              const montoRecibido = parseCurrency(txn.monto);
              let montoEsperado = parseCurrency(txn.montoEsperado);
              
              // Apply override if exists
              if (txn.numRecibo && reciboToMonto[txn.numRecibo] !== undefined) {
                montoEsperado = reciboToMonto[txn.numRecibo];
                processedRecibos.add(txn.numRecibo);
              }

              totalExpected += montoEsperado;
              totalPaid += montoRecibido;
            });
          }
        });
      }
    });

    // Add expected amounts from structure for receipts that don't have transactions yet
    uploadedStructure.forEach((item: any) => {
      if (item.recibo && !processedRecibos.has(item.recibo) && item.monto) {
        totalExpected += parseCurrency(item.monto);
      }
    });

    return {
      numSubsidiaries: subsSet.size,
      numPadres: padreNumbers.size,
      totalPaid,
      totalExpected
    };
  };

  const clientsWithMetrics = useMemo(() => {
    return clients.map(client => ({
      ...client,
      metrics: getClientMetrics(client.cliente)
    }));
  }, [clients, refreshTrigger]);

  const filteredClients = clientsWithMetrics.filter(c => 
    c.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.agente.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadStructure = (data: any[]) => {
    if (!selectedClient) return;
    const structureKey = `nats_conciliation_structure_${selectedClient.cliente}`;
    localStorage.setItem(structureKey, JSON.stringify(data));
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteStructure = (e: React.MouseEvent, clientName: string) => {
    e.stopPropagation();
    setConfirmDelete({ type: 'single', clientName });
  };

  const executeDelete = () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'single' && confirmDelete.clientName) {
      const clientName = confirmDelete.clientName;
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
    } else if (confirmDelete.type === 'all') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nats_conciliation_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    setRefreshTrigger(prev => prev + 1);
    setConfirmDelete(null);
    if (selectedClient && confirmDelete.type === 'single' && confirmDelete.clientName === selectedClient.cliente) {
      setSelectedClient(null);
    }
  };

  if (selectedClient) {
    return (
      <div className="relative h-full">
        <PoliciesTableView 
          client={selectedClient} 
          onBack={() => setSelectedClient(null)} 
          onUploadClick={() => setIsUploadOpen(true)}
        />
        <PolicyStructureUploadPanel
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUpload={handleUploadStructure}
        />
      </div>
    );
  }

  const handleClearAllData = () => {
    setConfirmDelete({ type: 'all' });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Estructura de Pólizas</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen de jerarquías y estados de conciliación por contratante.</p>
        </div>
        <button
          onClick={handleClearAllData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100"
        >
          <Trash2 className="w-4 h-4" />
          Limpiar Todo
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {confirmDelete.type === 'all' ? '¿Eliminar todos los datos?' : `¿Eliminar datos de ${confirmDelete.clientName}?`}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {confirmDelete.type === 'all' 
                ? 'Esta acción eliminará permanentemente todas las estructuras y transacciones cargadas para todos los clientes. No se puede deshacer.'
                : `Se eliminarán permanentemente la estructura de pólizas y todas las transacciones asociadas a ${confirmDelete.clientName}.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar contratante..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#6b21a8] focus:ring-1 focus:ring-[#6b21a8] outline-none transition-shadow shadow-sm"
        />
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="py-4 px-6 text-xs font-bold text-gray-900 uppercase tracking-wider">Contratante</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-900 uppercase tracking-wider text-center">Subsidiarias</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-900 uppercase tracking-wider text-center">Pólizas Padre</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-900 uppercase tracking-wider">Total Pagado</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-900 uppercase tracking-wider">Valor Total</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                return (
                  <tr 
                    key={client.cliente}
                    className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedClient(client)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-[#6b21a8] group-hover:bg-[#6b21a8] group-hover:text-white transition-colors">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{client.cliente}</div>
                          <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{client.agente}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                        {client.metrics.numSubsidiaries}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                        {client.metrics.numPadres}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-green-600">
                        {formatCurrency(client.metrics.totalPaid)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(client.metrics.totalExpected)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteStructure(e, client.cliente)}
                          className="p-2 rounded-lg bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          title="Eliminar Estructura"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:text-[#6b21a8] group-hover:bg-purple-50 transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <p className="text-sm text-gray-400 italic">No se encontraron contratantes</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
