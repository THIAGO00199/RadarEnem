import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const root=fileURLToPath(new URL('.',import.meta.url));
const run=promisify(execFile);
async function generate(script:string){
 const {stdout}=await run(process.execPath,[root+'scripts/'+script]);
 if(stdout)process.stdout.write(stdout);
}
export default defineConfig({
 root:root+'portable',base:'./',plugins:[react(),{
  name:'kalore-editorial-bank-dev',
  async configureServer(){await generate('build-essay-ideas.mjs')},
 },{
 name:'kalore-generated-materials-and-offline',apply:'build',
  async buildStart(){await generate('build-materials.mjs');await generate('build-essay-ideas.mjs')},
  async closeBundle(){await generate('build-standalone.mjs');await generate('build-offline.mjs')},
 }],
 resolve:{alias:{'@':root}},
 build:{outDir:root+'docs',emptyOutDir:true},
 server:{host:'127.0.0.1'},
});
