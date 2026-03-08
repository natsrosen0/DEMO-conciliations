/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { ClientTable, ClientData } from './components/dashboard/ClientTable';
import { AddClientPanel } from './components/dashboard/AddClientPanel';
import { ClientDetail } from './components/dashboard/ClientDetail';

const initialData: ClientData[] = [
  { cliente: 'BIMBO', agente: 'Inter', transacciones: 20, porConciliar: '$30,000', porcentaje: 70 },
  { cliente: 'Lear', agente: 'AON', transacciones: 72, porConciliar: '$27,987.45', porcentaje: 89 },
  { cliente: 'CUPRUM', agente: 'Howden', transacciones: 65, porConciliar: '$13,789', porcentaje: 63 },
  { cliente: 'UP', agente: 'Inter', transacciones: 53, porConciliar: '$0', porcentaje: 100 },
  { cliente: 'Herdez', agente: 'AON', transacciones: 38, porConciliar: '$15,450', porcentaje: 78 },
  { cliente: 'HOTELERA PALACE', agente: 'Howden', transacciones: 118, porConciliar: '$0', porcentaje: 100 },
];

const STORAGE_KEY = 'nats_conciliation_clients';

export default function App() {
  const [clients, setClients] = useState<ClientData[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialData;
  });
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

  // Save to localStorage whenever clients change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  const handleAddClient = (newClient: { cliente: string; agente: string }) => {
    const clientData: ClientData = {
      ...newClient,
      transacciones: 0,
      porConciliar: '$0',
      porcentaje: 0,
    };
    setClients((prev) => [clientData, ...prev]);
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
              
              <SummaryCards />
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
