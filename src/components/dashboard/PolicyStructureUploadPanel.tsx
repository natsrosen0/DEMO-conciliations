import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle } from 'lucide-react';

interface PolicyStructureUploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: any[]) => void;
}

export function PolicyStructureUploadPanel({ isOpen, onClose, onUpload }: PolicyStructureUploadPanelProps) {
  const [pastedData, setPastedData] = useState('');
  const [error, setError] = useState<string | null>(null);

  const downloadTemplate = () => {
    const headers = ['Subsidiaria', 'Póliza Padre', 'Póliza de Cobranza', 'Recibo', 'Monto'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_estructura_polizas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcess = () => {
    try {
      const rows = pastedData.split('\n').filter(row => row.trim());
      if (rows.length === 0) {
        setError('No hay datos para procesar');
        return;
      }

      // Detect delimiter (tab or comma)
      const firstRow = rows[0];
      const delimiter = firstRow.includes('\t') ? '\t' : (firstRow.includes(',') ? ',' : null);

      if (!delimiter && rows.length > 1) {
        setError('No se pudo detectar el formato. Asegúrate de copiar desde Excel o usar comas.');
        return;
      }

      const startIndex = (rows[0].toLowerCase().includes('subsidiaria') || rows[0].toLowerCase().includes('padre')) ? 1 : 0;
      
      const parsedData = rows.slice(startIndex).map(row => {
        const columns = row.split(delimiter || ',');
        return {
          subsidiaria: columns[0]?.trim() || 'Subsidiaria Principal',
          polizaPadre: columns[1]?.trim() || '-',
          polizaCobranza: columns[2]?.trim() || '-',
          recibo: columns[3]?.trim() || null,
          monto: columns[4]?.trim() || null
        };
      });

      onUpload(parsedData);
      setPastedData('');
      setError(null);
      onClose();
    } catch (err) {
      setError('Error al procesar los datos. Verifica el formato.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="flex items-start justify-between px-6 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cargar Estructura de Pólizas</h2>
            <p className="text-sm text-gray-500 mt-1">Define la jerarquía de subsidiarias y pólizas desde Excel</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Instrucciones</span>
              <button 
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-sm text-[#6b21a8] hover:text-[#581c87] font-medium"
              >
                <Download className="w-4 h-4" />
                Descargar Plantilla
              </button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-xs text-blue-800 leading-relaxed">
                Copia las columnas de tu Excel en este orden: <br/>
                <strong>Subsidiaria | Póliza Padre | Póliza de Cobranza | Recibo | Monto</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Pegar datos aquí
              </label>
              <textarea
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                className="w-full h-64 px-4 py-3 border border-gray-200 rounded-lg focus:border-[#6b21a8] focus:ring-1 focus:ring-[#6b21a8] outline-none transition-shadow text-sm font-mono"
                placeholder="Pega aquí las filas de tu Excel..."
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleProcess}
            className="w-full py-3.5 text-sm font-medium text-white bg-[#6b21a8] hover:bg-[#581c87] rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Procesar y Cargar
          </button>
        </div>
      </div>
    </>
  );
}
