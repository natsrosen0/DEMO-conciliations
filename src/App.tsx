/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { ClientTable, ClientData, Responsible } from './components/dashboard/ClientTable';
import { AddClientPanel } from './components/dashboard/AddClientPanel';
import { ClientDetail } from './components/dashboard/ClientDetail';

const initialData: ClientData[] = [];

const STORAGE_KEY = 'nats_conciliation_clients';

export default function App() {
  const [clients, setClients] = useState<ClientData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : initialData;
    
    // Update each client with real data from their monthly reconciliations
    return data.map((client: ClientData) => {
      const monthlyKey = `nats_conciliation_monthly_${client.cliente}`;
      const savedMonthly = localStorage.getItem(monthlyKey);
      if (savedMonthly) {
        const monthly = JSON.parse(savedMonthly);
        const totalTransacciones = monthly.reduce((sum: number, m: any) => {
          const txnKey = `nats_conciliation_txns_${client.cliente}_${m.mes}`;
          const savedTxns = localStorage.getItem(txnKey);
          return sum + (savedTxns ? JSON.parse(savedTxns).length : 0);
        }, 0);
        
        const parseCurrency = (val: string) => parseFloat(val.replace(/[^-0-9.]/g, '')) || 0;
        
        let totalEsperadoGlobal = 0;
        let totalRecibidoGlobal = 0;
        
        monthly.forEach((m: any) => {
          const reconciliationsKey = `nats_conciliation_reconciliations_${client.cliente}_${m.mes}`;
          const savedReconciliations = localStorage.getItem(reconciliationsKey);
          if (savedReconciliations) {
            const reconciliations = JSON.parse(savedReconciliations);
            reconciliations.forEach((recon: any) => {
              const txnKey = `nats_conciliation_txns_${client.cliente}_${m.mes}_${recon.id}`;
              const savedTxns = localStorage.getItem(txnKey);
              if (savedTxns) {
                const txns = JSON.parse(savedTxns);
                totalEsperadoGlobal += txns.reduce((sum: number, t: any) => sum + parseCurrency(t.montoEsperado), 0);
                totalRecibidoGlobal += txns.reduce((sum: number, t: any) => sum + parseCurrency(t.monto), 0);
              }
            });
          }
        });
        
        const porConciliar = totalEsperadoGlobal - totalRecibidoGlobal;
        const porcentaje = totalEsperadoGlobal === 0 ? 100 : Math.round((totalRecibidoGlobal / totalEsperadoGlobal) * 100);
        
        return {
          ...client,
          transacciones: totalTransacciones,
          porConciliar: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Math.max(0, porConciliar)),
          porcentaje: Math.min(100, Math.max(0, porcentaje))
        };
      }
      return client;
    });
  });
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

  // Save to localStorage whenever clients change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  // Re-calculate when coming back from client detail view
  useEffect(() => {
    if (!selectedClient) {
      setClients(prev => prev.map(client => {
        const monthlyKey = `nats_conciliation_monthly_${client.cliente}`;
        const savedMonthly = localStorage.getItem(monthlyKey);
        if (savedMonthly) {
          const monthly = JSON.parse(savedMonthly);
          const totalTransacciones = monthly.reduce((sum: number, m: any) => {
            const txnKey = `nats_conciliation_txns_${client.cliente}_${m.mes}`;
            const savedTxns = localStorage.getItem(txnKey);
            return sum + (savedTxns ? JSON.parse(savedTxns).length : 0);
          }, 0);
          
          const parseCurrency = (val: string) => parseFloat(val.replace(/[^-0-9.]/g, '')) || 0;
          
          let totalEsperadoGlobal = 0;
          let totalRecibidoGlobal = 0;
          
          monthly.forEach((m: any) => {
            const reconciliationsKey = `nats_conciliation_reconciliations_${client.cliente}_${m.mes}`;
            const savedReconciliations = localStorage.getItem(reconciliationsKey);
            if (savedReconciliations) {
              const reconciliations = JSON.parse(savedReconciliations);
              reconciliations.forEach((recon: any) => {
                const txnKey = `nats_conciliation_txns_${client.cliente}_${m.mes}_${recon.id}`;
                const savedTxns = localStorage.getItem(txnKey);
                if (savedTxns) {
                  const txns = JSON.parse(savedTxns);
                  totalEsperadoGlobal += txns.reduce((sum: number, t: any) => sum + parseCurrency(t.montoEsperado), 0);
                  totalRecibidoGlobal += txns.reduce((sum: number, t: any) => sum + parseCurrency(t.monto), 0);
                }
              });
            }
          });
          
          const porConciliar = totalEsperadoGlobal - totalRecibidoGlobal;
          const porcentaje = totalEsperadoGlobal === 0 ? 100 : Math.round((totalRecibidoGlobal / totalEsperadoGlobal) * 100);
          
          return {
            ...client,
            transacciones: totalTransacciones,
            porConciliar: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Math.max(0, porConciliar)),
            porcentaje: Math.min(100, Math.max(0, porcentaje))
          };
        }
        return client;
      }));
    }
  }, [selectedClient]);

  const handleAddClient = (newClient: { 
    cliente: string; 
    agente: string;
    gnpResponsables: Responsible[];
    intermediarioResponsables: Responsible[];
  }) => {
    const clientData: ClientData = {
      ...newClient,
      transacciones: 0,
      porConciliar: '$0',
      porcentaje: 0,
    };
    setClients((prev) => [clientData, ...prev]);
  };

  const handleUpdateClient = (updatedClient: ClientData) => {
    setClients((prev) => prev.map(c => c.cliente === updatedClient.cliente ? updatedClient : c));
    setSelectedClient(updatedClient);
  };

  const handleDeleteClient = (clienteName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    // Removed window.confirm to comply with iframe restrictions
    setClients((prev) => prev.filter((c) => c.cliente !== clienteName));
  };

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans text-gray-900 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-8 relative">
          {selectedClient ? (
            <ClientDetail 
              client={selectedClient} 
              onBack={() => setSelectedClient(null)} 
              onUpdateClient={handleUpdateClient}
            />
          ) : (
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold tracking-tight">Conciliaciones</h1>
                <button 
                  onClick={() => setIsPanelOpen(true)}
                  className="flex items-center gap-2 bg-[#6b21a8] hover:bg-[#581c87] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar cliente
                </button>
              </div>
              
              <SummaryCards clients={clients} />
              <ClientTable 
                data={clients} 
                onRowClick={setSelectedClient}
                onDelete={handleDeleteClient}
              />
            </div>
          )}
        </main>
      </div>

      <AddClientPanel 
        isOpen={isPanelOpen} 
        onClose={() => setIsPanelOpen(false)} 
        onAddClient={handleAddClient} 
      />
    </div>
  );
}
