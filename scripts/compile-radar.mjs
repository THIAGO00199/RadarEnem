import ts from 'typescript';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

// Compile the three shared data modules without a second implementation.
export async function loadRadar(){
 const dir=await mkdtemp(join(tmpdir(),'kalore-radar-'));
 for(const name of ['radar-data','radar-model','collector']){
  const source=await readFile(new URL('../lib/'+name+'.ts',import.meta.url),'utf8');
  const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
  const output=outputText.replace(/from (['"])\.\/(radar-data|radar-model)\1/g,'from \'./$2.mjs\'');
  await writeFile(join(dir,name+'.mjs'),output);
 }
 return {
  data:await import(pathToFileURL(join(dir,'radar-data.mjs')).href),
  model:await import(pathToFileURL(join(dir,'radar-model.mjs')).href),
  collector:await import(pathToFileURL(join(dir,'collector.mjs')).href),
 };
}
export const projectRoot=fileURLToPath(new URL('..',import.meta.url));
