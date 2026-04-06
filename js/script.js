const App = (() => {
  const toast = document.getElementById('toast');
  const locationModal = document.getElementById('locationModal');
  const confirmLocationBtn = document.getElementById('confirmLocationBtn');
  const cancelLocationBtn = document.getElementById('cancelLocationBtn');

  let activeDateTarget = null;
  let toastTimer = null;

  let alertState = {
    container1: { locationShown: false },
    container2: { locationShown: false, billingShown: false }
  };

  const cityByState = (address = {}) => (
    address.city || address.town || address.village || address.municipality || ''
  );

  function showToast(message, type = 'error') {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.className = 'toast';
    }, 3500);
  }

  function setModalState(modal, isActive) {
    if (!modal) return;
    modal.classList.toggle('active', isActive);
    document.body.classList.toggle('modal-open', isActive);
  }

  function openLocationModal(targetKey) {
    activeDateTarget = targetKey;
    setModalState(locationModal, true);
  }

  function closeLocationModal() {
    activeDateTarget = null;
    setModalState(locationModal, false);
  }

  function closeAllKnownModals() {
    closeLocationModal();
    const billingModal = document.getElementById('billingModal');
    if (billingModal) setModalState(billingModal, false);
  }

  function resetAlerts(scope = 'all') {
    if (scope === 'container1') {
      alertState.container1.locationShown = false;
      return;
    }
    if (scope === 'container2') {
      alertState.container2.locationShown = false;
      alertState.container2.billingShown = false;
      return;
    }
    alertState = {
      container1: { locationShown: false },
      container2: { locationShown: false, billingShown: false }
    };
  }

  function hasShownAlert(containerKey, alertKey) {
    return Boolean(alertState?.[containerKey]?.[alertKey]);
  }

  function markAlertShown(containerKey, alertKey) {
    if (!alertState[containerKey]) return;
    alertState[containerKey][alertKey] = true;
  }

  async function getCurrentPlaceAndDate() {
    const now = new Date();
    const dateData = {
      dia: String(now.getDate()).padStart(2, '0'),
      mes: String(now.getMonth() + 1).padStart(2, '0'),
      ano: String(now.getFullYear())
    };

    if (!('geolocation' in navigator)) {
      return { cidade: '', uf: '', ...dateData };
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
    }).catch(() => null);

    if (!position) {
      return { cidade: '', uf: '', ...dateData };
    }

    try {
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`
      );
      const data = await response.json();
      const city = cityByState(data.address);
      const stateCode = (data.address.state_code || data.address.region_code || '').replace('BR-', '');
      return { cidade: city, uf: stateCode, ...dateData };
    } catch (error) {
      return { cidade: '', uf: '', ...dateData };
    }
  }

  function fillDateFields(targetKey, payload) {
    const map = {
      container1: ['cidadeAtual', 'ufAtual', 'diaAtual', 'mesAtual', 'anoAtual'],
      container2: ['cidadeAtual2', 'ufAtual2', 'diaAtual2', 'mesAtual2', 'anoAtual2']
    };
    const ids = map[targetKey];
    if (!ids) return;
    const [cidadeId, ufId, diaId, mesId, anoId] = ids;
    const cidade = document.getElementById(cidadeId);
    const uf = document.getElementById(ufId);
    const dia = document.getElementById(diaId);
    const mes = document.getElementById(mesId);
    const ano = document.getElementById(anoId);
    if (cidade) cidade.value = payload.cidade || '';
    if (uf) uf.value = payload.uf || '';
    if (dia) dia.value = payload.dia || '';
    if (mes) mes.value = payload.mes || '';
    if (ano) ano.value = payload.ano || '';
  }

  function clearInvalidMarks(scope) {
    if (!scope) return;
    scope.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
  }

  function markInvalid(element) {
    if (!element) return;
    element.classList.add('invalid');
  }

  function isFilled(value) {
    return String(value || '').trim() !== '';
  }

  function validateInputs(ids = []) {
    const empty = [];
    ids.forEach((id) => {
      const field = document.getElementById(id);
      if (!field) return;
      if (!isFilled(field.value)) {
        markInvalid(field);
        empty.push(field);
      }
    });
    return empty;
  }

  function validateRadioGroup(name, wrapperSelector = null, scope = document) {
    const radios = Array.from(scope.querySelectorAll(`input[name="${name}"]`));
    if (!radios.length) return null;
    const hasChecked = radios.some((input) => input.checked);
    if (hasChecked) return null;
    const wrapper = wrapperSelector
      ? document.querySelector(wrapperSelector)
      : radios[0].closest('.choice-group, .radio-inline-group, .whatsapp-box, .form-group');
    markInvalid(wrapper);
    return wrapper;
  }

  function validateCheckboxGroup(name, wrapperSelector = null, scope = document) {
    const checks = Array.from(scope.querySelectorAll(`input[name="${name}"]`));
    if (!checks.length) return null;
    const hasChecked = checks.some((input) => input.checked);
    if (hasChecked) return null;
    const wrapper = wrapperSelector
      ? document.querySelector(wrapperSelector)
      : checks[0].closest('.choice-group, .checkbox-inline-group, .form-group');
    markInvalid(wrapper);
    return wrapper;
  }

  async function captureContainer(element, filename) {
    document.body.classList.add('screenshot-mode');
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: element.scrollHeight
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = filename;
      link.click();
    } finally {
      document.body.classList.remove('screenshot-mode');
    }
  }

  function addMask(input, formatter) {
    if (!input || typeof formatter !== 'function') return;
    input.addEventListener('input', (event) => {
      event.target.value = formatter(event.target.value);
    });
  }

  function numeric(value) {
    return String(value || '').replace(/\D/g, '');
  }

  const formatters = {
    cep: (value) => {
      const digits = numeric(value).slice(0, 8);
      return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    },
    cpf: (value) => {
      const digits = numeric(value).slice(0, 11);
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    },
    cnpj: (value) => {
      const digits = numeric(value).slice(0, 14);
      return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    },
    phone: (value) => {
      const digits = numeric(value).slice(0, 11);
      if (digits.length <= 10) {
        return digits
          .replace(/(\d{2})(\d)/, '($1) $2')
          .replace(/(\d{4})(\d)/, '$1-$2');
      }
      return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  };

  async function fetchViaCep(cep) {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    if (data.erro) throw new Error('CEP não encontrado');
    return data;
  }

  function setupSignature(canvasId, boxId) {
    const canvas = document.getElementById(canvasId);
    const box = document.getElementById(boxId);
    if (!canvas || !box) return null;

    const ctx = canvas.getContext('2d');
    let drawing = false;
    let hasSignature = false;
    let lastPoint = null;
    let resizeObserver = null;

    function getCssHeight() {
      const height = parseFloat(getComputedStyle(canvas).height);
      return Number.isFinite(height) && height > 0 ? height : 180;
    }

    function redrawFromDataUrl(dataUrl, width, height) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = dataUrl;
    }

    function resizeCanvas(force = false) {
      const rect = box.getBoundingClientRect();
      if (!force && (!rect.width || !rect.height)) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const cssWidth = Math.max(rect.width || box.clientWidth || 0, 1);
      const cssHeight = Math.max(getCssHeight(), 140);
      const previousImage = hasSignature ? canvas.toDataURL() : null;

      canvas.width = Math.round(cssWidth * ratio);
      canvas.height = Math.round(cssHeight * ratio);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#111827';
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      if (previousImage) {
        redrawFromDataUrl(previousImage, cssWidth, cssHeight);
      }
    }

    function getPosition(event) {
      const rect = canvas.getBoundingClientRect();
      if (event.touches && event.touches.length > 0) {
        return {
          x: event.touches[0].clientX - rect.left,
          y: event.touches[0].clientY - rect.top
        };
      }
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    function startDrawing(event) {
      event.preventDefault();
      if (!canvas.width || !canvas.height) resizeCanvas(true);
      drawing = true;
      lastPoint = getPosition(event);
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(lastPoint.x + 0.01, lastPoint.y + 0.01);
      ctx.stroke();
      hasSignature = true;
      box.classList.remove('invalid');
    }

    function draw(event) {
      if (!drawing) return;
      event.preventDefault();
      const pos = getPosition(event);
      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPoint = pos;
      hasSignature = true;
    }

    function stopDrawing(event) {
      if (event) event.preventDefault();
      drawing = false;
      lastPoint = null;
      ctx.closePath();
    }

    function clear() {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width || canvas.width, rect.height || canvas.height);
      hasSignature = false;
      box.classList.remove('invalid');
    }

    function isEmpty() {
      return !hasSignature;
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDrawing, { passive: false });
    canvas.addEventListener('touchcancel', stopDrawing, { passive: false });

    window.addEventListener('resize', () => resizeCanvas(true));
    window.addEventListener('orientationchange', () => resizeCanvas(true));

    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(() => resizeCanvas(true));
      resizeObserver.observe(box);
    }

    requestAnimationFrame(() => resizeCanvas(true));

    return { canvas, box, clear, isEmpty, resize: () => resizeCanvas(true) };
  }

  const signaturePad1 = setupSignature('signatureCanvas1', 'signatureBox1');
  const signaturePad2 = setupSignature('signatureCanvas2', 'signatureBox2');

  function refreshSignaturePads() {
    if (signaturePad1) signaturePad1.resize();
    if (signaturePad2) signaturePad2.resize();
  }

  document.querySelectorAll('.signature-clear-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.signature;
      if (target === '1' && signaturePad1) signaturePad1.clear();
      if (target === '2' && signaturePad2) signaturePad2.clear();
    });
  });

  if (confirmLocationBtn) {
    confirmLocationBtn.addEventListener('click', async () => {
      const payload = await getCurrentPlaceAndDate();
      fillDateFields(activeDateTarget, payload);
      closeLocationModal();
      showToast('Campos de local e data atualizados.', 'success');
    });
  }

  if (cancelLocationBtn) {
    cancelLocationBtn.addEventListener('click', closeLocationModal);
  }

  const addDependentBtn = document.getElementById('addDependentBtn');
  const dependentesContainer = document.getElementById('dependentesContainer');
  const dependentTemplate = document.getElementById('dependentTemplate');
  const cepInput = document.getElementById('cepTitular');
  const enderecoInput = document.getElementById('enderecoTitular');
  const bairroInput = document.getElementById('bairroTitular');
  const complementoInput = document.getElementById('complementoTitular');
  const paymentButtons = document.querySelectorAll('#container1 .payment-toggle');
  const paymentCards = document.querySelectorAll('#container1 .payment-card');
  const submitFormBtn = document.getElementById('submitFormBtn') || document.getElementById('submitFormBtn1');
  const container1 = document.getElementById('container1');

  function updateDependentsTitles() {
    if (!dependentesContainer) return;
    dependentesContainer.querySelectorAll('.dependent-card').forEach((card, index) => {
      const title = card.querySelector('.dependent-title');
      if (title) title.textContent = `Dependente ${String(index + 1).padStart(2, '0')}`;
    });
  }

  function addDependent() {
    if (!dependentTemplate || !dependentesContainer) return;
    dependentesContainer.appendChild(dependentTemplate.content.cloneNode(true));
    updateDependentsTitles();
  }

  if (addDependentBtn) addDependentBtn.addEventListener('click', addDependent);

  if (dependentesContainer) {
    dependentesContainer.addEventListener('click', (event) => {
      if (event.target.classList.contains('remove-dependent-btn')) {
        event.target.closest('.dependent-card')?.remove();
        updateDependentsTitles();
      }
    });
  }

  if (cepInput) {
    addMask(cepInput, formatters.cep);
    cepInput.addEventListener('blur', async () => {
      const cep = numeric(cepInput.value);
      if (cep.length !== 8) return;
      try {
        const data = await fetchViaCep(cep);
        if (enderecoInput) enderecoInput.value = data.logradouro || '';
        if (bairroInput) bairroInput.value = data.bairro || '';
        if (complementoInput) complementoInput.value = data.complemento || '';
      } catch (error) {
        showToast('Não foi possível localizar o CEP informado.');
      }
    });
  }

  paymentButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const targetCard = document.getElementById(targetId);
      if (!targetCard) return;
      const alreadyActive = targetCard.classList.contains('active');
      paymentButtons.forEach((btn) => btn.classList.remove('active'));
      paymentCards.forEach((card) => card.classList.remove('active'));
      if (!alreadyActive) {
        button.classList.add('active');
        targetCard.classList.add('active');
      }
    });
  });

  document.querySelectorAll('.auto-date-trigger').forEach((input) => {
    input.addEventListener('focus', () => {
      if (!hasShownAlert('container1', 'locationShown')) {
        markAlertShown('container1', 'locationShown');
        openLocationModal('container1');
      }
    });
  });

  [['cpfTitular', formatters.cpf], ['telefoneTitular', formatters.phone], ['celularTitular', formatters.phone]].forEach(([id, formatter]) => {
    addMask(document.getElementById(id), formatter);
  });

  function getActivePaymentPanel() {
    return Array.from(paymentCards).find((card) => card.classList.contains('active')) || null;
  }

  function validateContainer1() {
    if (!container1) return false;
    clearInvalidMarks(container1);
    const requiredIds = [
      'nomeTitular', 'nomeMaeTitular', 'dataNascimentoTitular', 'profissaoTitular', 'localTrabalhoTitular',
      'matriculaTitular', 'rgTitular', 'orgaoEmissorTitular', 'cpfTitular', 'cnsTitular', 'telefoneTitular',
      'celularTitular', 'emailTitular', 'cepTitular', 'enderecoTitular', 'numeroTitular', 'bairroTitular',
      'complementoTitular', 'cidadeAtual', 'ufAtual', 'diaAtual', 'mesAtual', 'anoAtual'
    ];
    validateInputs(requiredIds);
    validateRadioGroup('whatsapp', null, container1);

    const activePayment = getActivePaymentPanel();
    if (!activePayment) {
      showToast('Selecione uma forma de pagamento antes de enviar.');
      return false;
    }

    if (activePayment.id === 'boletoCard') {
      validateRadioGroup('vencimentoBoleto', '#boletoCard .radio-inline-group', container1);
    }
    if (activePayment.id === 'cartaoCard') {
      validateInputs(['nomeCartao', 'numeroCartao', 'validadeCartao', 'cvvCartao']);
    }
    if (activePayment.id === 'debitoCard') {
      validateInputs(['nomeBanco', 'codBanco', 'agenciaBanco', 'contaCorrente']);
    }
    if (activePayment.id === 'folhaCard') {
      validateInputs(['matriculaFolha', 'orgaoFolha']);
      const hasTipoOrgao = container1.querySelectorAll('input[name="tipoOrgao"]').length > 0;
      const hasFolhaEscolha = container1.querySelectorAll('input[name="folhaEscolha"]').length > 0;
      if (hasTipoOrgao) {
        validateCheckboxGroup('tipoOrgao', '#folhaCard .checkbox-inline-group', container1);
      } else if (hasFolhaEscolha) {
        validateCheckboxGroup('folhaEscolha', '#folhaCard .checkbox-inline-group', container1);
      }
    }

    const invalidElement = container1.querySelector('.invalid');
    if (invalidElement) {
      invalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Preencha todos os campos obrigatórios do formulário antes de enviar.');
      return false;
    }

    if (signaturePad1 && signaturePad1.isEmpty()) {
      signaturePad1.box.classList.add('invalid');
      signaturePad1.box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Faça a assinatura digital antes de enviar o formulário.');
      return false;
    }
    return true;
  }

  if (submitFormBtn) {
    submitFormBtn.addEventListener('click', async () => {
      if (!validateContainer1()) return;
      try {
        await captureContainer(container1, 'formulario-individual-preenchido.png');
        showToast('Print do formulário individual gerado com sucesso.', 'success');
      } catch (error) {
        showToast('Não foi possível gerar o print do formulário.');
      }
    });
  }

  return {
    showToast,
    setModalState,
    openLocationModal,
    closeLocationModal,
    closeAllKnownModals,
    clearInvalidMarks,
    validateInputs,
    validateRadioGroup,
    validateCheckboxGroup,
    captureContainer,
    addMask,
    formatters,
    numeric,
    fetchViaCep,
    isFilled,
    resetAlerts,
    hasShownAlert,
    markAlertShown,
    signaturePad1,
    signaturePad2,
    refreshSignaturePads
  };
})();
