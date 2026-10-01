import {createRoot} from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';
(window as unknown as {__KALORE_STATIC__:boolean}).__KALORE_STATIC__=true;
createRoot(document.getElementById('root')!).render(<Home/>);

if ('serviceWorker' in navigator) window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{});});
