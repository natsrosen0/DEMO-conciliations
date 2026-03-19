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

  const totalPagado = clients.reduce((sum, client) => {
    const amount = typeof client.totalPagado === 'string'
      ? parseFloat(client.totalPagado.replace(/[^-0-9.]/g, ''))
      : (client.totalPagado || 0);
    return sum + (isNaN(amount as number) ? 0 : (amount as number));
  }, 0);

  const totalTransacciones = clients.reduce((sum, client) => sum + client.transacciones, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Card 1 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wider">Clientes totales</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-[21px] font-bold text-gray-900">{clients.length}</span>
          <span className="text-[10px] font-normal text-gray-500">registrados</span>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-purple-600"></div>
          <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Transacciones</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[21px] font-bold text-gray-900">{totalTransacciones}</span>
          <span className="text-[10px] font-normal text-gray-500">procesadas</span>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total Pagado</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[21px] font-bold text-green-600">{formatCurrency(totalPagado)}</span>
        </div>
      </div>

      {/* Card 4 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Valor Total</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[21px] font-bold text-gray-900">{formatCurrency(totalPorConciliar)}</span>
        </div>
      </div>
    </div>
  );
}
