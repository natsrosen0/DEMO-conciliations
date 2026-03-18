import React, { useState } from 'react';
import { ClientData } from './ClientTable';
import { PoliciesTableView } from './PoliciesTableView';
import { Search, Building2, ChevronRight } from 'lucide-react';

interface PoliciesPageProps {
  clients: ClientData[];
}

export function PoliciesPage({ clients }: PoliciesPageProps) {
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = clients.filter(c => 
    c.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.agente.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedClient) {
    return (
      <PoliciesTableView 
        client={selectedClient} 
        onBack={() => setSelectedClient(null)} 
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Estructura de Pólizas</h1>
        <p className="text-sm text-gray-500 mt-1">Selecciona un cliente para ver su estructura de pólizas y estados de conciliación.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar cliente o agente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-[#6b21a8] focus:ring-1 focus:ring-[#6b21a8] outline-none transition-shadow shadow-sm"
        />
      </div>

      {/* Client Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <button
            key={client.cliente}
            onClick={() => setSelectedClient(client)}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-[#6b21a8]/50 hover:shadow-md transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-[#6b21a8] group-hover:bg-[#6b21a8] group-hover:text-white transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{client.cliente}</h3>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{client.agente}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#6b21a8] transition-colors" />
          </button>
        ))}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-100 rounded-2xl">
            <p className="text-sm text-gray-400 italic">No se encontraron clientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
