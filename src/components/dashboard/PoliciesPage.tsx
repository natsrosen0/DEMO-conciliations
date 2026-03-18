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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const parseCurrency = (val: string | number) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(val.toString().replace(/[^-0-9.]/g, '')) || 0;
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

    // Add from structure (unique padres)
    uploadedStructure.forEach((item: any) => {
      if (item.polizaPadre && item.polizaPadre !== '-') {
        padreNumbers.add(item.polizaPadre);
      }
    });

    // Map to track overrides from structure
    const reciboToMonto: Record<string, number> = {};
    uploadedStructure.forEach((item: any) => {
      if (item.recibo && item.monto) {
        reciboToMonto[item.recibo] = parseCurrency(item.monto);
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

              const montoRecibido = parseCurrency(txn.monto);
              let montoEsperado = parseCurrency(txn.montoEsperado);
              
              // Apply override if exists
              if (txn.numRecibo && reciboToMonto[txn.numRecibo] !== undefined) {
                montoEsperado = reciboToMonto[txn.numRecibo];
              }

              totalExpected += montoEsperado;
              if (Math.abs(montoRecibido - montoEsperado) < 0.01 && montoEsperado > 0) {
                totalPaid += montoRecibido;
              }
            });
          }
        });
      }
    });

    return {
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
    if (window.confirm(`¿Estás seguro de que deseas eliminar la estructura de pólizas para ${clientName}?`)) {
      const structureKey = `nats_conciliation_structure_${clientName}`;
      localStorage.removeItem(structureKey);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  if (selectedClient) {
    return (
      <div className="relative h-full">
        <div className="absolute top-0 right-0 z-10 p-8">
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Cargar Estructura
          </button>
        </div>
        <PoliciesTableView 
          client={selectedClient} 
          onBack={() => setSelectedClient(null)} 
        />
        <PolicyStructureUploadPanel
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUpload={handleUploadStructure}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Estructura de Pólizas</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen de jerarquías y estados de conciliación por contratante.</p>
      </div>

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
                <th className="py-4 px-6 text-xs font-bold text-gray-900 uppercase tracking-wider text-center">Pólizas Padre</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-900 uppercase tracking-wider">Total Pagado</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-900 uppercase tracking-wider">Valor Total</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-900 uppercase tracking-wider">Estado</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const percentage = client.metrics.totalExpected === 0 ? 100 : Math.round((client.metrics.totalPaid / client.metrics.totalExpected) * 100);
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
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        percentage === 100 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {percentage === 100 ? 'Emitido' : 'POR EMITIR'}
                      </span>
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
