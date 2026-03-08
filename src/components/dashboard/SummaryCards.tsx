import { ClientData } from './ClientTable';

interface SummaryCardsProps {
  clients: ClientData[];
}

export function SummaryCards({ clients }: SummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const totalPorConciliar = clients.reduce((sum, client) => {
    const amount = typeof client.porConciliar === 'string' 
      ? parseFloat(client.porConciliar.replace(/[^-0-9.]/g, '')) 
      : client.porConciliar;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const totalTransacciones = clients.reduce((sum, client) => sum + client.transacciones, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Card 1 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-xs font-medium text-gray-500 mb-1">Clientes totales</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{clients.length}</span>
          <span className="text-xs text-gray-500">registrados</span>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[#6b21a8]"></div>
          <h3 className="text-xs font-medium text-gray-500">Transacciones totales</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{totalTransacciones}</span>
          <span className="text-xs text-gray-500">procesadas</span>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <h3 className="text-xs font-medium text-gray-500">Monto total por conciliar</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalPorConciliar)}</span>
        </div>
      </div>
    </div>
  );
}
