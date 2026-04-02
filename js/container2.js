
/* ---------------------------
   TROCA DE CONTAINERS
---------------------------- */
const initialContainer = document.getElementById("initialContainer");
const container1 = document.getElementById("container1");
const container2 = document.getElementById("container2");

const openExistingContainerBtn = document.getElementById("openExistingContainerBtn");
const openContainer2Btn = document.getElementById("openContainer2Btn");

if (openExistingContainerBtn) {
    openExistingContainerBtn.addEventListener("click", () => {
        initialContainer.style.display = "none";
        container1.style.display = "block";
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

if (openContainer2Btn) {
    openContainer2Btn.addEventListener("click", () => {
        initialContainer.style.display = "none";
        container2.style.display = "block";
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

/* ---------------------------
   CEP CONTAINER 2
---------------------------- */
const cepContratante = document.getElementById("cepContratante");
const enderecoCorrespondencia = document.getElementById("enderecoCorrespondencia");
const cidadeContratante = document.getElementById("cidadeContratante");
const estadoContratante = document.getElementById("estadoContratante");
const complementoContratante = document.getElementById("complementoContratante");

function limparSomenteNumeros(valor) {
    return valor.replace(/\D/g, "");
}

async function buscarCepContratante(cep) {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (data.erro) {
            alert("CEP não encontrado.");
            return;
        }

        enderecoCorrespondencia.value = data.logradouro || "";
        cidadeContratante.value = data.localidade || "";
        estadoContratante.value = data.uf || "";
        complementoContratante.value = data.complemento || "";
    } catch (error) {
        console.error("Erro ao buscar CEP da contratante:", error);
        alert("Erro ao consultar o CEP.");
    }
}

if (cepContratante) {
    cepContratante.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 5) {
            value = value.slice(0, 5) + "-" + value.slice(5, 8);
        }
        e.target.value = value;
    });

    cepContratante.addEventListener("blur", () => {
        const cep = limparSomenteNumeros(cepContratante.value);
        if (cep.length === 8) {
            buscarCepContratante(cep);
        }
    });
}

/* ---------------------------
   MODAL ENDEREÇO FATURAMENTO
---------------------------- */
const enderecoFaturamento = document.getElementById("enderecoFaturamento");
const billingModal = document.getElementById("billingModal");
const confirmBillingBtn = document.getElementById("confirmBillingBtn");
const cancelBillingBtn = document.getElementById("cancelBillingBtn");

function openBillingModal() {
    billingModal.classList.add("active");
}

function closeBillingModal() {
    billingModal.classList.remove("active");
}

if (enderecoFaturamento) {
    enderecoFaturamento.addEventListener("focus", () => {
        if (enderecoCorrespondencia && enderecoCorrespondencia.value.trim() !== "") {
            openBillingModal();
        }
    });
}

if (confirmBillingBtn) {
    confirmBillingBtn.addEventListener("click", () => {
        enderecoFaturamento.value = enderecoCorrespondencia.value;
        closeBillingModal();
    });
}

if (cancelBillingBtn) {
    cancelBillingBtn.addEventListener("click", () => {
        closeBillingModal();
    });
}

/* ---------------------------
   LOCAL E DATA - CONTAINER 2
---------------------------- */
const autoDateTriggers2 = document.querySelectorAll(".auto-date-trigger-2");
const cidadeAtual2 = document.getElementById("cidadeAtual2");
const ufAtual2 = document.getElementById("ufAtual2");
const diaAtual2 = document.getElementById("diaAtual2");
const mesAtual2 = document.getElementById("mesAtual2");
const anoAtual2 = document.getElementById("anoAtual2");

let modalAlreadyShown2 = false;

autoDateTriggers2.forEach((input) => {
    input.addEventListener("focus", () => {
        if (!modalAlreadyShown2) {
            locationModal.classList.add("active");
            modalAlreadyShown2 = true;
        }
    });
});

async function preencherLocalizacaoEDataAtual2() {
    try {
        const now = new Date();

        diaAtual2.value = String(now.getDate()).padStart(2, "0");
        mesAtual2.value = String(now.getMonth() + 1).padStart(2, "0");
        anoAtual2.value = now.getFullYear();

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

                        const stateCode = data.address.state_code || data.address.region_code || "";

                        cidadeAtual2.value = city;
                        ufAtual2.value = stateCode.replace("BR-", "");
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
        }
    } catch (error) {
        console.error(error);
    }
}

/* reaproveitando os mesmos botões do modal já existente */
if (confirmLocationBtn) {
    confirmLocationBtn.addEventListener("click", async () => {
        if (container2.style.display === "block") {
            await preencherLocalizacaoEDataAtual2();
        }
    });
}

/* ---------------------------
   PRINT CONTAINER 2
---------------------------- */
const submitFormBtn2 = document.getElementById("submitFormBtn2");

if (submitFormBtn2) {
    submitFormBtn2.addEventListener("click", async () => {
        try {
            document.body.classList.add("screenshot-mode");

            const canvas = await html2canvas(container2, {
                scale: 2,
                useCORS: true,
                scrollY: -window.scrollY
            });

            const image = canvas.toDataURL("image/png");

            const link = document.createElement("a");
            link.href = image;
            link.download = "formulario-empresarial-preenchido.png";
            link.click();

            document.body.classList.remove("screenshot-mode");
            alert("Print da tela gerado com sucesso.");
        } catch (error) {
            document.body.classList.remove("screenshot-mode");
            console.error("Erro ao gerar print:", error);
            alert("Não foi possível gerar o print da tela.");
        }
    });
}