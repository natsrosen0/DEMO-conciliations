import React, { useState } from 'react';
import { X, FileText, HelpCircle, Settings2, Plus, Minus } from 'lucide-react';

interface Rule {
  id: string;
  doc1Field: string;
  operator: string;
  doc2Field: string;
  tolerance: string;
  unit: string;
}

interface ReconciliationRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReconciliationRulesModal({ isOpen, onClose }: ReconciliationRulesModalProps) {
  const [rules, setRules] = useState<Rule[]>([
    { id: '1', doc1Field: 'POLIZA', operator: '=', doc2Field: 'POLIZA', tolerance: '0', unit: 'N/A' },
    { id: '2', doc1Field: 'RECIBO', operator: '=', doc2Field: 'NUM.RECIBO', tolerance: '0', unit: 'N/A' },
    { id: '3', doc1Field: 'PRIMA_TOTAL', operator: '=', doc2Field: 'IMPORTE TOTAL', tolerance: '0', unit: 'N/A' },
  ]);

  const [triggerA, setTriggerA] = useState(false);
  const [triggerB, setTriggerB] = useState(true);

  if (!isOpen) return null;

  const addRule = () => {
    const newRule: Rule = {
      id: Math.random().toString(36).substr(2, 9),
      doc1Field: '',
      operator: '=',
      doc2Field: '',
      tolerance: '0',
      unit: 'N/A'
    };
    setRules([...rules, newRule]);
  };

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const updateRule = (id: string, field: keyof Rule, value: string) => {
    setRules(rules.map(rule => rule.id === id ? { ...rule, [field]: value } : rule));
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900">Reglas de Conciliación</h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50">
            
            {/* Top Section: Resources */}
            <div className="flex items-center justify-between gap-8">
              {/* Resource A */}
              <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[#6b21a8]">Resource A</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Trigger</span>
                    <HelpCircle className="w-4 h-4" />
                    <button 
                      onClick={() => setTriggerA(!triggerA)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${triggerA ? 'bg-[#6b21a8]' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${triggerA ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                    <span>{triggerA ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <select className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none text-gray-700 font-medium">
                      <option>DOC 1</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500 mb-1.5">Reconcilable group</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Settings2 className="w-4 h-4 text-gray-400" />
                      </div>
                      <select className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none text-gray-700">
                        <option>Default</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crossover Button */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-sm text-gray-500 mb-2">Crossover 1:1</span>
                <button className="bg-[#6b21a8] hover:bg-[#581c87] text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm whitespace-nowrap">
                  Configure crossover
                </button>
              </div>

              {/* Resource B */}
              <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[#6b21a8]">Resource B</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Trigger</span>
                    <HelpCircle className="w-4 h-4" />
                    <button 
                      onClick={() => setTriggerB(!triggerB)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${triggerB ? 'bg-[#6b21a8]' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${triggerB ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                    <span className={triggerB ? 'text-gray-900 font-medium' : ''}>{triggerB ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <select className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none text-gray-700 font-medium">
                      <option>DOC 2</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-500 mb-1.5">Reconcilable group</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Settings2 className="w-4 h-4 text-gray-400" />
                      </div>
                      <select className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none text-gray-700">
                        <option>Default</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rules Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50 text-sm font-medium text-gray-500">
                <div className="col-span-4">DOC 1</div>
                <div className="col-span-4">DOC 2</div>
                <div className="col-span-2">Tolerance</div>
                <div className="col-span-2">Unit</div>
              </div>
              
              <div className="p-6 space-y-4">
                {rules.map((rule, index) => (
                  <div key={rule.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <select 
                        value={rule.doc1Field}
                        onChange={(e) => updateRule(rule.id, 'doc1Field', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none text-gray-700"
                      >
                        <option value="">Select field...</option>
                        <option value="POLIZA">POLIZA</option>
                        <option value="RECIBO">RECIBO</option>
                        <option value="PRIMA_TOTAL">PRIMA_TOTAL</option>
                      </select>
                    </div>
                    
                    <div className="col-span-4 flex items-center gap-2">
                      <select 
                        value={rule.operator}
                        onChange={(e) => updateRule(rule.id, 'operator', e.target.value)}
                        className="w-16 px-2 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none text-gray-700 text-center"
                      >
                        <option value="=">=</option>
                      </select>
                      <select 
                        value={rule.doc2Field}
                        onChange={(e) => updateRule(rule.id, 'doc2Field', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none text-gray-700"
                      >
                        <option value="">Select field...</option>
                        <option value="POLIZA">POLIZA</option>
                        <option value="NUM.RECIBO">NUM.RECIBO</option>
                        <option value="IMPORTE TOTAL">IMPORTE TOTAL</option>
                      </select>
                    </div>
                    
                    <div className="col-span-2">
                      <input 
                        type="number"
                        value={rule.tolerance}
                        onChange={(e) => updateRule(rule.id, 'tolerance', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none text-gray-700 text-center"
                      />
                    </div>
                    
                    <div className="col-span-2 flex items-center gap-3">
                      <select 
                        value={rule.unit}
                        onChange={(e) => updateRule(rule.id, 'unit', e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-[#6b21a8] focus:border-[#6b21a8] outline-none text-gray-700"
                      >
                        <option value="N/A">N/A</option>
                        <option value="%">%</option>
                        <option value="$">$</option>
                      </select>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => removeRule(rule.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        {index === rules.length - 1 && (
                          <button 
                            onClick={addRule}
                            className="p-1.5 text-gray-400 hover:text-[#6b21a8] hover:bg-purple-50 rounded transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Results Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-[#6b21a8]">Review reconciliation results</h3>
                <button className="text-green-600 border border-green-600 hover:bg-green-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  CONFIGURE
                </button>
              </div>

              <div className="grid grid-cols-2 gap-12">
                {/* DOC 1 Results */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <FileText className="w-5 h-5" />
                      DOC 1
                    </div>
                    <span className="font-bold text-gray-900">100%</span>
                  </div>
                  
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-[#6b21a8] w-full rounded-full"></div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Reconciled</span>
                      </div>
                      <span className="font-medium">110</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Unreconciled</span>
                      </div>
                      <span className="font-medium">0</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-6 border-t border-gray-100 text-gray-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span>Total reconcilable</span>
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900">110</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span>Adjusted</span>
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900">0</span>
                    </div>
                  </div>
                </div>

                {/* DOC 2 Results */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <FileText className="w-5 h-5" />
                      DOC 2
                    </div>
                    <span className="font-bold text-gray-900">29.56%</span>
                  </div>
                  
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-green-500 w-[29.56%] rounded-full"></div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Reconciled</span>
                      </div>
                      <span className="font-medium">110</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span>Unreconciled</span>
                      </div>
                      <span className="font-medium">262</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-6 border-t border-gray-100 text-gray-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span>Total reconcilable</span>
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900">372</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span>Adjusted</span>
                        <HelpCircle className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-gray-900">0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
}
