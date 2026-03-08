export function SummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Card 1 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-xs font-medium text-gray-500 mb-1">Monto total esperado</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">$1,500,000</span>
          <span className="text-xs text-gray-500">(900 deudas)</span>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h3 className="text-xs font-medium text-gray-500">Monto total conciliado</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">$1,429,762</span>
          <span className="text-xs text-gray-500">(798 transacciones)</span>
        </div>
      </div>

      {/* Card 3 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <h3 className="text-xs font-medium text-gray-500">Monto total por conciliar</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">$70,238</span>
          <span className="text-xs text-gray-500">(13 transacciones)</span>
        </div>
      </div>
    </div>
  );
}
