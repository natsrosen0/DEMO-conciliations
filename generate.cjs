const fs = require('fs');

const data = `56,754,813.15	26-Feb-26
31,496,003.30	26-Feb-26
12,905,315.37	26-Feb-26
8,671,932.41	26-Feb-26
5,380,059.10	26-Feb-26
4,339,390.20	26-Feb-26
2,475,813.99	26-Feb-26
2,157,614.71	26-Feb-26
1,942,263.81	26-Feb-26
1,709,198.27	26-Feb-26
1,578,006.39	26-Feb-26
1,349,183.17	26-Feb-26
1,293,832.38	26-Feb-26
1,137,329.13	26-Feb-26
1,035,940.38	26-Feb-26
695,377.00	26-Feb-26
653,474.06	26-Feb-26
598,014.00	26-Feb-26
580,749.95	26-Feb-26
473,257.09	26-Feb-26
469,311.29	26-Feb-26
442,001.93	26-Feb-26
436,573.96	26-Feb-26
406,829.66	26-Feb-26
328,524.15	26-Feb-26
297,848.92	26-Feb-26
270,577.00	26-Feb-26
240,472.34	26-Feb-26
238,318.11	26-Feb-26
227,135.88	26-Feb-26
224,381.00	26-Feb-26
210,883.86	26-Feb-26
205,964.06	26-Feb-26
148,829.94	26-Feb-26
143,346.96	26-Feb-26
125,578.99	26-Feb-26
114,098.52	26-Feb-26
112,627.76	26-Feb-26
109,532.27	26-Feb-26
108,979.99	26-Feb-26
106,135.19	26-Feb-26
103,775.17	26-Feb-26
103,493.87	26-Feb-26
99,958.59	26-Feb-26
96,426.41	13-Feb-26
96,209.46	26-Feb-26
94,938.11	26-Feb-26
94,547.86	26-Feb-26
84,346.22	26-Feb-26
83,835.41	13-Feb-26
72,210.68	25-Feb-26
67,405.62	26-Feb-26
60,090.91	26-Feb-26
55,903.57	26-Feb-26
55,082.51	26-Feb-26
54,663.97	26-Feb-26
47,798.87	26-Feb-26
45,461.84	26-Feb-26
44,595.38	26-Feb-26
41,209.13	26-Feb-26
37,369.29	26-Feb-26
36,614.87	26-Feb-26
34,503.50	26-Feb-26
34,428.28	26-Feb-26
34,296.11	26-Feb-26
31,949.51	13-Feb-26
31,443.56	26-Feb-26
30,954.87	26-Feb-26
29,567.64	26-Feb-26
29,042.76	27-Feb-26
26,374.06	26-Feb-26
22,383.21	26-Feb-26
21,353.44	26-Feb-26
20,978.53	26-Feb-26
19,636.14	26-Feb-26
16,734.36	26-Feb-26
16,266.23	26-Feb-26
15,471.65	26-Feb-26
14,838.34	26-Feb-26
11,869.45	26-Feb-26
11,554.48	26-Feb-26
10,995.50	26-Feb-26
10,599.80	26-Feb-26
9,704.29	26-Feb-26
9,270.99	26-Feb-26
9,134.17	26-Feb-26
8,665.80	26-Feb-26
7,693.35	26-Feb-26
7,368.34	26-Feb-26
6,770.75	26-Feb-26
6,716.22	26-Feb-26
6,709.91	26-Feb-26
6,141.70	26-Feb-26
6,091.27	26-Feb-26
6,037.11	26-Feb-26
5,911.94	26-Feb-26
5,758.82	26-Feb-26
5,665.75	26-Feb-26
5,081.12	26-Feb-26
5,014.68	26-Feb-26
3,072.32	26-Feb-26
1,507.94	26-Feb-26
1,157.69	26-Feb-26
1,024.76	26-Feb-26
908.47	26-Feb-26
705.18	26-Feb-26
529.62	26-Feb-26
528.25	26-Feb-26
201.22	26-Feb-26
197.36	26-Feb-26
181.22	26-Feb-26
150.67	26-Feb-26
82.87	26-Feb-26
0.07	29-Jul-25
0.05	29-Jul-25
0.01	29-Jul-25
0.01	29-Jul-25
0.02	29-Jul-25`;

const lines = data.split('\n').filter(l => l.trim());
let out = `export interface MonthlyTransaction {
  id: string;
  fecha: string;
  numRecibos: number;
  montoRecibido: string;
  montoEsperado: string;
  diferencia: string;
  estado: 'Conciliado' | 'No conciliado';
}

export const hoteleraTransactions: MonthlyTransaction[] = [\n`;

lines.forEach((line, i) => {
  const [amount, dateStr] = line.split('\t');
  const [day, month, year] = dateStr.split('-');
  const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  const formattedDate = `${day.padStart(2, '0')}/${monthMap[month]}/20${year}`;
  const idNum = String(i + 1).padStart(3, '0');
  out += `  { id: 'TXN-H${idNum}', fecha: '${formattedDate}', numRecibos: 1, montoRecibido: '$${amount}', montoEsperado: '$${amount}', diferencia: '+$0.00', estado: 'Conciliado' },\n`;
});
out += '];\n';

fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/hoteleraTransactions.ts', out);
