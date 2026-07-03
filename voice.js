function startVoiceCommands(app){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    app.showToast?.('Comando de voz indisponível neste navegador. Use Chrome.');
    app.speak?.('Comando de voz indisponível neste navegador.');
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = 'pt-BR';
  rec.continuous = false;
  rec.interimResults = false;

  app.showToast?.('Ouvindo comando...');
  app.speak?.('Pode falar o comando.');
  rec.start();

  rec.onresult = event => {
    const cmd = event.results[0][0].transcript.toLowerCase();
    app.showToast?.(`Comando: ${cmd}`);

    if(cmd.includes('próxima') || cmd.includes('proxima') || cmd.includes('avançar') || cmd.includes('avancar')) app.nextSlide();
    else if(cmd.includes('anterior') || cmd.includes('voltar')) app.prevSlide();
    else if(cmd.includes('ampliar') || cmd.includes('zoom mais') || cmd.includes('aumentar')) app.zoomIn();
    else if(cmd.includes('reduzir') || cmd.includes('zoom menos') || cmd.includes('diminuir')) app.zoomOut();
    else if(cmd.includes('resetar') || cmd.includes('normal')) app.resetZoom();
    else if(cmd.includes('pdf') || cmd.includes('gerar')) app.generatePDF();
    else if(cmd.includes('baixar') || cmd.includes('instalar') || cmd.includes('app')) app.installApp();
    else if(cmd.includes('ler') || cmd.includes('narrar')) app.read();
    else if(cmd.includes('imagens') || cmd.includes('atlas')) app.goImages();
    else if(cmd.includes('início') || cmd.includes('inicio') || cmd.includes('capa')) app.goHome();
    else if(cmd.includes('limpar') || cmd.includes('apagar')) app.clearAll();
    else app.speak?.('Comando não reconhecido.');
  };

  rec.onerror = () => {
    app.showToast?.('Não foi possível reconhecer o comando.');
    app.speak?.('Não foi possível reconhecer o comando.');
  };
}
