async function loadImageAsDataURL(src){
  const response = await fetch(src);
  const blob = await response.blob();
  return await new Promise(resolve=>{
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function imageDimensions(dataUrl){
  return new Promise(resolve=>{
    const img = new Image();
    img.onload = () => resolve({width: img.width, height: img.height});
    img.src = dataUrl;
  });
}

async function generateAtlasPDF(total, getSlideData, speak, showToast){
  if(!window.jspdf){ alert('Biblioteca jsPDF não carregou. Verifique a internet na primeira execução.'); return; }
  speak?.('Gerando PDF. Aguarde.');
  showToast?.('Gerando PDF sem cortes...');

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p','mm','a4');
  const pageW = 210;
  const pageH = 297;
  const margin = 12;
  const maxW = pageW - margin*2;
  const maxImgH = 178;

  for(let i=1;i<=total;i++){
    if(i>1) pdf.addPage();

    pdf.setFillColor(49,46,129);
    pdf.rect(0,0,pageW,25,'F');
    pdf.setTextColor(255,255,255);
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(16);
    pdf.text(`Sistema Respiratório — Imagem ${i} de ${total}`, margin, 16);

    try{
      const dataUrl = await loadImageAsDataURL(`imagens/${i}.png`);
      const dim = await imageDimensions(dataUrl);
      let w = maxW;
      let h = dim.height * w / dim.width;
      if(h > maxImgH){ h = maxImgH; w = dim.width * h / dim.height; }
      const x = (pageW - w)/2;
      pdf.addImage(dataUrl, 'PNG', x, 34, w, h, undefined, 'FAST');
    }catch(e){
      pdf.setTextColor(180,0,0);
      pdf.setFontSize(13);
      pdf.text('Imagem não encontrada. Verifique o arquivo na pasta imagens.', margin, 50);
    }

    const data = getSlideData(i);
    const y = 220;
    pdf.setTextColor(17,24,39);
    pdf.setFont('helvetica','bold');
    pdf.setFontSize(13);
    pdf.text('Observações:', margin, y);

    pdf.setFont('helvetica','normal');
    pdf.setFontSize(11);
    const note = data.note?.trim() || 'Sem observações registradas.';
    const lines = pdf.splitTextToSize(note, maxW);
    pdf.text(lines, margin, y+8);

    pdf.setFont('helvetica','bold');
    pdf.setFontSize(10);
    const tags = [];
    if(data.identified) tags.push('Identificada');
    if(data.reviewed) tags.push('Revisada');
    if(data.exam) tags.push('Cai na prova');
    pdf.text(`Status: ${tags.length ? tags.join(' • ') : 'Sem marcações'}`, margin, 286);
  }

  pdf.save('atlas-respiratorio-completo.pdf');
  speak?.('PDF gerado com sucesso.');
  showToast?.('PDF gerado com sucesso.');
}
