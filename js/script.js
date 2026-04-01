
const addDependentBtn = document.getElementById("addDependentBtn");
const dependentesContainer = document.getElementById("dependentesContainer");
const dependentTemplate = document.getElementById("dependentTemplate");

const cepInput = document.getElementById("cepTitular");
const enderecoInput = document.getElementById("enderecoTitular");
const bairroInput = document.getElementById("bairroTitular");
const complementoInput = document.getElementById("complementoTitular");

const paymentButtons = document.querySelectorAll(".payment-toggle");
const paymentCards = document.querySelectorAll(".payment-card");

const autoDateTriggers = document.querySelectorAll(".auto-date-trigger");
const locationModal = document.getElementById("locationModal");
const confirmLocationBtn = document.getElementById("confirmLocationBtn");
const cancelLocationBtn = document.getElementById("cancelLocationBtn");

const cidadeAtual = document.getElementById("cidadeAtual");
const ufAtual = document.getElementById("ufAtual");
const diaAtual = document.getElementById("diaAtual");
const mesAtual = document.getElementById("mesAtual");
const anoAtual = document.getElementById("anoAtual");

const submitFormBtn = document.getElementById("submitFormBtn");
const captureArea = document.getElementById("captureArea");

let modalAlreadyShown = false;

/* ---------------------------
   DEPENDENTES
---------------------------- */
function updateDependentsTitles() {
    const dependentCards = dependentesContainer.querySelectorAll(".dependent-card");

    dependentCards.forEach((card, index) => {
        const title = card.querySelector(".dependent-title");
        const number = String(index + 1).padStart(2, "0");
        title.textContent = `Dependente ${number}`;
    });
}

function addDependent() {
    const clone = dependentTemplate.content.cloneNode(true);
    dependentesContainer.appendChild(clone);
    updateDependentsTitles();
}

function removeDependent(button) {
    const card = button.closest(".dependent-card");
    if (card) {
        card.remove();
        updateDependentsTitles();
    }
}

addDependentBtn.addEventListener("click", addDependent);

dependentesContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-dependent-btn")) {
        removeDependent(event.target);
    }
});

/* ---------------------------
   CEP VIA API
---------------------------- */
function limparCep(valor) {
    return valor.replace(/\D/g, "");
}

async function buscarCep(cep) {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            alert("CEP não encontrado.");
            return;
        }

        enderecoInput.value = data.logradouro || "";
        bairroInput.value = data.bairro || "";
        complementoInput.value = data.complemento || "";
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        alert("Erro ao consultar o CEP.");
    }
}

cepInput.addEventListener("blur", () => {
    const cep = limparCep(cepInput.value);
    if (cep.length === 8) {
        buscarCep(cep);
    }
});

/* ---------------------------
   PAGAMENTO - ACCORDION / FAQ
---------------------------- */
paymentButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        const targetCard = document.getElementById(targetId);
        const isActive = targetCard.classList.contains("active");

        paymentButtons.forEach((btn) => btn.classList.remove("active"));
        paymentCards.forEach((card) => card.classList.remove("active"));

        if (!isActive) {
            button.classList.add("active");
            targetCard.classList.add("active");
        }
    });
});

/* ---------------------------
   MODAL DE LOCALIZAÇÃO E DATA
---------------------------- */
function openLocationModal() {
    locationModal.classList.add("active");
}

function closeLocationModal() {
    locationModal.classList.remove("active");
}

autoDateTriggers.forEach((input) => {
    input.addEventListener("focus", () => {
        if (!modalAlreadyShown) {
            openLocationModal();
            modalAlreadyShown = true;
        }
    });
});

cancelLocationBtn.addEventListener("click", () => {
    closeLocationModal();
});

confirmLocationBtn.addEventListener("click", async () => {
    await preencherLocalizacaoEDataAtual();
    closeLocationModal();
});

async function preencherLocalizacaoEDataAtual() {
    try {
        const now = new Date();

        const dia = String(now.getDate()).padStart(2, "0");
        const mes = String(now.getMonth() + 1).padStart(2, "0");
        const ano = now.getFullYear();

        diaAtual.value = dia;
        mesAtual.value = mes;
        anoAtual.value = ano;

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
                        );
                        const data = await response.json();

                        const city =
                            data.address.city ||
                            data.address.town ||
                            data.address.village ||
                            data.address.municipality ||
                            "";

                        const stateCode = data.address.state_code || "";

                        cidadeAtual.value = city;
                        ufAtual.value = stateCode;
                    } catch (error) {
                        console.error("Erro ao buscar localização reversa:", error);
                        alert("Não foi possível buscar a cidade e UF automaticamente.");
                    }
                },
                (error) => {
                    console.error("Erro de geolocalização:", error);
                    alert("Permissão de localização negada ou indisponível.");
                }
            );
        } else {
            alert("Geolocalização não suportada neste navegador.");
        }
    } catch (error) {
        console.error("Erro ao preencher data/localização:", error);
    }
}

/* ---------------------------
   PRINT DA TELA PREENCHIDA
---------------------------- */
submitFormBtn.addEventListener("click", async () => {
    try {
        document.body.classList.add("screenshot-mode");

        const canvas = await html2canvas(captureArea, {
            scale: 2,
            useCORS: true,
            scrollY: -window.scrollY
        });

        const image = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.href = image;
        link.download = "formulario-preenchido.png";
        link.click();

        document.body.classList.remove("screenshot-mode");
        alert("Print da tela gerado com sucesso.");
    } catch (error) {
        document.body.classList.remove("screenshot-mode");
        console.error("Erro ao gerar print:", error);
        alert("Não foi possível gerar o print da tela.");
    }
});

/* ---------------------------
   MÁSCARA VISUAL DO CEP
---------------------------- */
cepInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 5) {
        value = value.slice(0, 5) + "-" + value.slice(5, 8);
    }
    e.target.value = value;
});