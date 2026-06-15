import { getGroupKey, getSidebar, groupsSummary } from '../src/data/groups.js';

console.log('=== groupsSummary ===');
console.log(JSON.stringify(groupsSummary, null, 2));

const decoded = '/מעקות-אלומיניום-בנתניה/';
const encoded = encodeURI(decoded);
console.log('\ndecoded route key:', getGroupKey(decoded));
console.log('encoded route key:', getGroupKey(encoded));
console.log('\nsidebar(decoded).title:', getSidebar(decoded).title, '| items:', getSidebar(decoded).items.length);
console.log('sidebar(encoded).title:', getSidebar(encoded).title, '| items:', getSidebar(encoded).items.length);
