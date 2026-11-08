// Build Vercel : copie web/ vers public/, ajoute supabase-js (fichier local, utile hors connexion) et version.json.
import { cpSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
rmSync('public', { recursive: true, force: true });
cpSync('web', 'public', { recursive: true });
mkdirSync('public/vendor', { recursive: true });
cpSync('node_modules/@supabase/supabase-js/dist/umd/supabase.js', 'public/vendor/supabase.js');
writeFileSync('public/sw.js', readFileSync('public/sw.js', 'utf8').replace('__VERSION__', version));
writeFileSync('public/version.json', JSON.stringify({ version, built: new Date().toISOString() }));
console.log('public/ prêt, version', version);
