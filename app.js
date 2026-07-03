const TOTAL = 25;
let current = 1;
let scale = 1;
let translateX = 0;
let translateY = 0;
let dragging = false;
let startX = 0;
let startY = 0;
let startTX = 0;
let startTY = 0;
let lastTap = 0;

const home = document.getElementById('home');
const viewer = document.getElementById('viewer');
const stage = document.getElementById('stage');
const img = document.getElementById('slideImage');
const slideLabel = document.getElementById('slideLabel');
const noteTitle = document.getElementById('noteTitle');
const noteText = document.getElementById('noteText');
const thumbStrip = document.getElementById('thumbStrip');
const toast = document.getElementById('toast');
const checks = {
  identified: document.getElementById('identifiedCheck'),
  reviewed: document.getElementById('reviewedCheck'),
  exam: document.getElementById('examCheck')
};

function clickSound(){
  try{
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 720; gain.gain.value = .075;
    osc.start(); osc.stop(ctx.currentTime + .08);
  }catch(e){}
}

document.addEventListener('click', e => { if(e.target.closest('button')) clickSound(); });

function showToast(text){
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(()=> toast.hidden = true, 2400);
}

function speak(text){
  if(!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'pt-BR'; u.rate = .95; u.pitch = 1;
  speechSynthesis.speak(u);
}

function storageKey(i){ return `atlasRespiratorio.slide.${i}`; }
function getSlideData(i){
  return JSON.parse(localStorage.getItem(storageKey(i)) || '{"note":"","identified":false,"reviewed":false,"exam":false}');
}
function saveCurrent(){
  const data = { note: noteText.value, identified: checks.identified.checked, reviewed: checks.reviewed.checked, exam: checks.exam.checked };
  localStorage.setItem(storageKey(current), JSON.stringify(data));
}
function loadCurrent(){
  const data = getSlideData(current);
  noteText.value = data.note || '';
  checks.identified.checked = !!data.identified;
  checks.reviewed.checked = !!data.reviewed;
  checks.exam.checked = !!data.exam;
}

function applyTransform(){
  img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}
function resetZoom(){ scale = 1; translateX = 0; translateY = 0; applyTransform(); }
function zoom(delta){ scale = Math.max(1, Math.min(8, +(scale + delta).toFixed(2))); applyTransform(); showToast(`Zoom ${Math.round(scale*100)}%`); }
function setSlide(n, narrate=false){
  saveCurrent();
  current = Math.max(1, Math.min(TOTAL, n));
  img.src = `imagens/${current}.png`;
  img.alt = `Imagem ${current}`;
  slideLabel.textContent = `Imagem ${current} de ${TOTAL}`;
  noteTitle.textContent = `Observações da imagem ${current}`;
  resetZoom();
  loadCurrent();
  document.querySelectorAll('.thumb').forEach((t,idx)=>t.classList.toggle('active', idx+1 === current));
  document.querySelector(`.thumb[data-n="${current}"]`)?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});
  if(narrate) speak(`Imagem ${current} de ${TOTAL}.`);
}
function nextSlide(){ setSlide(current + 1, true); }
function prevSlide(){ setSlide(current - 1, true); }

function openViewer(){ home.classList.remove('active'); viewer.classList.add('active'); setSlide(current, true); }
function openHome(){ saveCurrent(); viewer.classList.remove('active'); home.classList.add('active'); }

for(let i=1;i<=TOTAL;i++){
  const b = document.createElement('button');
  b.className = 'thumb'; b.dataset.n = i; b.title = `Imagem ${i}`;
  b.innerHTML = `<img src="imagens/${i}.png" alt="Miniatura ${i}">`;
  b.addEventListener('click',()=>setSlide(i,true));
  thumbStrip.appendChild(b);
}

document.getElementById('startBtn').onclick = openViewer;
document.getElementById('backHomeBtn').onclick = openHome;
document.getElementById('nextBtn').onclick = nextSlide;
document.getElementById('prevBtn').onclick = prevSlide;
document.getElementById('zoomInBtn').onclick = ()=>zoom(.25);
document.getElementById('zoomOutBtn').onclick = ()=>zoom(-.25);
document.getElementById('resetZoomBtn').onclick = resetZoom;
document.getElementById('readBtn').onclick = ()=> speak(noteText.value || `Imagem ${current}. Nenhuma observação registrada.`);
document.getElementById('pdfBtn').onclick = ()=>generateAtlasPDF(TOTAL, getSlideData, speak, showToast);
document.getElementById('pdfHomeBtn').onclick = ()=>generateAtlasPDF(TOTAL, getSlideData, speak, showToast);
document.getElementById('fullBtn').onclick = ()=>{ if(!document.fullscreenElement) stage.requestFullscreen?.(); else document.exitFullscreen?.(); };

noteText.addEventListener('input', saveCurrent);
Object.values(checks).forEach(c=>c.addEventListener('change', saveCurrent));

stage.addEventListener('pointerdown', e=>{ dragging=true; startX=e.clientX; startY=e.clientY; startTX=translateX; startTY=translateY; stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', e=>{ if(!dragging || scale<=1) return; translateX=startTX+(e.clientX-startX); translateY=startTY+(e.clientY-startY); applyTransform(); });
stage.addEventListener('pointerup', ()=> dragging=false);
stage.addEventListener('pointercancel', ()=> dragging=false);
stage.addEventListener('wheel', e=>{ e.preventDefault(); zoom(e.deltaY < 0 ? .2 : -.2); }, {passive:false});
stage.addEventListener('dblclick', ()=>{ scale = scale === 1 ? 2.5 : 1; translateX = 0; translateY = 0; applyTransform(); });
stage.addEventListener('touchend', ()=>{ const now=Date.now(); if(now-lastTap<280){ scale = scale === 1 ? 2.5 : 1; translateX=0; translateY=0; applyTransform(); } lastTap=now; });

let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredPrompt=e; installBtn.hidden=false; });
async function installApp(){
  if(!deferredPrompt){ showToast('Instalação disponível quando o navegador liberar o PWA.'); speak('Instalação disponível quando o navegador liberar o aplicativo.'); return; }
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; installBtn.hidden=true;
}
installBtn.onclick = installApp;

function clearAll(){
  if(confirm('Apagar todas as observações e marcações?')){
    for(let i=1;i<=TOTAL;i++) localStorage.removeItem(storageKey(i));
    loadCurrent(); showToast('Informações apagadas.'); speak('Informações apagadas.');
  }
}

window.AtlasApp = { nextSlide, prevSlide, zoomIn:()=>zoom(.25), zoomOut:()=>zoom(-.25), resetZoom, generatePDF:()=>generateAtlasPDF(TOTAL, getSlideData, speak, showToast), installApp, read:()=>speak(noteText.value || `Imagem ${current}. Nenhuma observação registrada.`), goImages:()=>openViewer(), goHome:openHome, clearAll, speak, showToast };

document.getElementById('voiceBtn').onclick = ()=>startVoiceCommands(window.AtlasApp);

if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
setSlide(1,false);
