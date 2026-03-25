import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BulkUploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: any[]) => void;
}

interface PreviewRow {
  polizaPadre: string;
  polizaCobranza: string;
  numRecibo: string;
  montoEsperado: string;
  monto: string;
  montoTransaccion: string;
  estado: string;
}

// Column name mapping from reconcile.py output → demo fields
const COLUMN_MAP: Record<string, keyof PreviewRow> = {
  'POLIZA_PADRE':               'polizaPadre',
  'POLIZA':                     'polizaCobranza',
  'RECIBO':                     'numRecibo',
  'PENDIENTE RECIBO (EDC)':     'montoEsperado',
  'PAGO REPORTADO':             'monto',
  'DELTA':                      'montoTransaccion',
  'STATUS':                     'estado',
};

const TARGET_SHEET = 'DETALLE RECONCILIACION';

function parseExcel(file: File): Promise<PreviewRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Try the target sheet first, fall back to first sheet
        const sheetName = workbook.SheetNames.includes(TARGET_SHEET)
          ? TARGET_SHEET
          : workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (rows.length < 2) {
          reject(new Error('El archivo no contiene datos suficientes.'));
          return;
        }

        // Build column index map from header row
        const headers: string[] = rows[0].map((h: any) => String(h).trim());
        const colIndex: Partial<Record<keyof PreviewRow, number>> = {};
        headers.forEach((h, i) => {
          const mapped = COLUMN_MAP[h];
          if (mapped) colIndex[mapped] = i;
        });

        const required: (keyof PreviewRow)[] = ['polizaPadre', 'polizaCobranza', 'numRecibo'];
        const missing = required.filter(k => colIndex[k] === undefined);
        if (missing.length > 0) {
          reject(new Error(`No se encontraron columnas requeridas: ${missing.join(', ')}.\nAsegúrate de subir la hoja "${TARGET_SHEET}" del reporte de reconciliación.`));
          return;
        }

        const get = (row: any[], key: keyof PreviewRow): string => {
          const idx = colIndex[key];
          if (idx === undefined) return '-';
          const val = row[idx];
          if (val === null || val === undefined || val === '') return '-';
          if (typeof val === 'number') return val.toString();
          return String(val).trim();
        };

        const parsed: PreviewRow[] = rows.slice(1)
          .filter(row => row.some((cell: any) => cell !== ''))
          .map(row => ({
            polizaPadre:      get(row, 'polizaPadre'),
            polizaCobranza:   get(row, 'polizaCobranza'),
            numRecibo:        get(row, 'numRecibo'),
            montoEsperado:    get(row, 'montoEsperado'),
            monto:            get(row, 'monto'),
            montoTransaccion: get(row, 'montoTransaccion'),
            estado:           get(row, 'estado'),
          }));

        resolve(parsed);
      } catch (err: any) {
        reject(new Error('Error leyendo el archivo. Verifica que sea un .xlsx válido.'));
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsArrayBuffer(file);
  });
}

export function BulkUploadPanel({ isOpen, onClose, onUpload }: BulkUploadPanelProps) {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      setError('Solo se aceptan archivos .xlsx');
      return;
    }
    setError(null);
    setFileName(file.name);
    try {
      const rows = await parseExcel(file);
      setPreview(rows);
    } catch (err: any) {
      setError(err.message);
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleConfirm = () => {
    if (!preview) return;
    onUpload(preview);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40 transition-opacity" onClick={() => { reset(); onClose(); }} />
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cargar Resultado Excel</h2>
            <p className="text-[11px] font-normal text-gray-500 mt-1">
              Sube el archivo de reconciliación generado por el script
            </p>
          </div>
          <button
            onClick={() => { reset(); onClose(); }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Instructions */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-[10px] text-purple-800 leading-relaxed font-normal">
              Sube el <strong>.xlsx</strong> generado por <code className="bg-purple-100 px-1 rounded">reconcile.py</code>.
              Se leerá automáticamente la hoja <strong>{TARGET_SHEET}</strong> y se importarán
              Póliza Padre, Póliza, Recibo, montos y estatus.
            </p>
          </div>

          {/* Drop zone */}
          {!preview && (
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-[#6b21a8] bg-purple-50'
                  : 'border-gray-200 hover:border-[#a87ebf] hover:bg-gray-50'
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-[12px] font-medium text-gray-600">
                Arrastra tu archivo aquí o <span className="text-[#6b21a8]">haz clic para seleccionar</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-1">Solo archivos .xlsx</p>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-[10px] font-normal whitespace-pre-wrap">{error}</span>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-[11px] font-medium">
                    {preview.length} recibos leídos de <em>{fileName}</em>
                  </span>
                </div>
                <button
                  onClick={reset}
                  className="text-[10px] text-gray-400 hover:text-gray-600 underline"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Mini table preview — first 5 rows */}
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Póliza Padre', 'Póliza', 'Recibo', 'Esperado', 'Pagado', 'Estado'].map(h => (
                        <th key={h} className="px-3 py-2 text-[9px] font-medium text-gray-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 text-[10px] text-gray-700">{row.polizaPadre}</td>
                        <td className="px-3 py-1.5 text-[10px] text-gray-700">{row.polizaCobranza}</td>
                        <td className="px-3 py-1.5 text-[10px] text-gray-700">{row.numRecibo}</td>
                        <td className="px-3 py-1.5 text-[10px] text-gray-500">{row.montoEsperado}</td>
                        <td className="px-3 py-1.5 text-[10px] text-gray-700">{row.monto}</td>
                        <td className="px-3 py-1.5 text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                            row.estado?.includes('OK')
                              ? 'bg-green-100 text-green-700'
                              : row.estado?.includes('DIFERENCIA')
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {row.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <div className="px-3 py-2 text-[9px] text-gray-400 border-t border-gray-100">
                    +{preview.length - 5} filas más
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <button
            onClick={handleConfirm}
            disabled={!preview}
            className="w-full py-3.5 text-[11px] font-normal text-white bg-[#6b21a8] hover:bg-[#581c87] disabled:bg-gray-200 disabled:text-gray-400 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {preview ? `Cargar ${preview.length} recibos` : 'Selecciona un archivo primero'}
          </button>
        </div>
      </div>
    </>
  );
}
