/* =========================================================
   Colégio CPPEM — Página de contato
   Formulário → Google Sheets → WhatsApp

   Estrutura espelhada do captura-cppem (TRACKING.md). Quem dispara o Lead é a
   regra de conversão do painel da PixelX, vinculada ao id do <form>. Este
   arquivo NÃO emite conversão — ele só valida, grava na planilha, e evita os
   três jeitos conhecidos de atrapalhar: preventDefault no clique válido,
   stopPropagation quando válido, e sair da página cedo demais.
   ========================================================= */

/* ---------- CONFIGURAÇÕES ---------- */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxdFplWVSfhTjvyIA7HIWb645xRjGNhBVhTdTf5UMjo0lSpW_A_jCuys0qB4uImKXPQ/exec?aba=COLEGIO";

const WHATSAPP_GROUP = "https://wa.me/558194086174?text=Ol%C3%A1,%20gostaria%20de%20falar%20sobre%20o%20Col%C3%A9gio%20Cppem.";

/* Tempo antes de redirecionar. A conversão da PixelX é assíncrona (debounce de
   ~1500 ms); navegar antes disso cancela a requisição e o Lead se perde,
   principalmente no mobile. Antes daqui o redirect era imediato. §7.6. */
const REDIRECT_DELAY_MS = 1500;

/* Identificador deste site no painel — o mesmo valor do id do <form>. */
const PIXELX_ID = "eiBtTROiAlNexbHXklSc";

/* ---------- Elementos ---------- */

const form = document.getElementById(PIXELX_ID);

/* Referências explícitas em vez de acesso nomeado (`form.nome`): com
   name="name", o acesso `form.name` colide com a propriedade nativa
   HTMLFormElement.name — mesma família de armadilha do §7.3. */
const nomeInput = document.getElementById("lead_name");
const emailInput = document.getElementById("lead_email");
const telefoneInput = document.getElementById("lead_phone");
const btn = document.getElementById("lead_submit");
const success = document.getElementById("form-success");

/* Falha barulhenta em vez de silenciosa (§8.1). */
if (!form) {
  console.error(
    `[tracking] Formulário "${PIXELX_ID}" não encontrado. Este id é o ` +
    `identificador do painel e precisa estar no <form>.`
  );
}
if (document.querySelectorAll(`[id="${PIXELX_ID}"]`).length > 1) {
  console.error(`[tracking] id "${PIXELX_ID}" duplicado na página.`);
}

/* ---------- Validação ----------
   A chave do erro é o valor de data-error-for (= atributo name do campo). */

function fieldOf(name) {
  return form.querySelector(`[name="${name}"]`).closest(".field");
}

function setError(name, msg) {
  fieldOf(name).classList.add("invalid");
  form.querySelector(`[data-error-for="${name}"]`).textContent = msg;
}

function clearError(name) {
  fieldOf(name).classList.remove("invalid");
  form.querySelector(`[data-error-for="${name}"]`).textContent = "";
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* Conta DÍGITOS, não caracteres, e remove o "+55" da máscara pelo "+" literal
   antes de contar (§7.7). O "+55" é texto FIXO da máscara: aparece desde o
   primeiro caractere digitado e somaria 2 dígitos, deixando passar número
   incompleto. Remover pelos dígitos seria ambíguo — o DDD 55 existe. */
const isPhone = (v) => {
  const nacional = v.trim().replace(/^\+\s*55\s*/, "");
  const d = nacional.replace(/\D/g, "");

  return d.length === 11 && d[2] === "9";
};

function validate() {
  let ok = true;

  ["name", "email", "phone"].forEach(clearError);

  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const tel = telefoneInput.value.trim();

  if (nome.length < 3) {
    setError("name", "Informe seu nome completo.");
    ok = false;
  }

  if (!isEmail(email)) {
    setError("email", "Informe um e-mail válido.");
    ok = false;
  }

  if (!isPhone(tel)) {
    setError("phone", "Informe seu WhatsApp com DDD — ex: (81) 90000-0000.");
    ok = false;
  }

  return ok;
}

/* ---------- Envio ---------- */

let enviando = false;

async function enviar() {
  if (enviando) return;
  enviando = true;

  if (btn) {
    btn.disabled = true;
    btn.textContent = "ENVIANDO...";
  }

  const payload = {
    nome: nomeInput.value.trim(),
    email: emailInput.value.trim(),
    telefone: telefoneInput.value.trim(),
    origem: "captura_colegio",
    pagina: window.location.href,
    data_envio: new Date().toISOString(),
  };

  try {
    await fetch(SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    enviando = false; // planilha falhou → libera nova tentativa
    setError("phone", "Erro ao enviar. Tente novamente.");

    if (btn) {
      btn.disabled = false;
      btn.textContent = "QUERO ENTRAR EM CONTATO";
    }
    return;
  }

  /* ---------- Sucesso ----------
     NÃO chamar form.reset() aqui: a PixelX lê os campos no blur, e limpar o
     formulário antes de ela concluir faz gravar valores vazios. §7.6. */

  form.querySelectorAll(".field, .note").forEach((el) => {
    el.style.display = "none";
  });

  if (btn) btn.style.display = "none";

  if (success) {
    success.hidden = false;
    success.innerHTML = `
      ✅ Dados enviados!<br>
      Em breve entraremos em contato com você.
    `;
    success.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  setTimeout(() => {
    window.location.href = WHATSAPP_GROUP;
  }, REDIRECT_DELAY_MS);
}

/* PRIMEIRA BARREIRA — no clique do botão, fase de captura. §7.8.
   Se os dados forem inválidos, o preventDefault cancela a ação padrão do botão
   e o navegador NUNCA chega a disparar o evento "submit" — é isso que impede a
   PixelX de registrar uma conversão incompleta. O Enter também passa por aqui,
   via submissão implícita. */
btn?.addEventListener(
  "click",
  (e) => {
    if (!validate()) e.preventDefault();
  },
  true
);

/* SEGUNDA BARREIRA — "submit" capturado no DOCUMENT, em fase de captura. §7.8.
   Roda SEMPRE antes de qualquer listener registrado no próprio <form>,
   independente de quem registrou primeiro — a PixelX registra o dela de dentro
   de um start() assíncrono, então não há outra forma de garantir a ordem.

   - Inválido -> stopImmediatePropagation(): o evento morre aqui e nunca chega
                 à PixelX.
   - Válido   -> deixamos propagar para ela registrar a conversão.
   Em ambos os casos o preventDefault impede o recarregamento da página. */
document.addEventListener(
  "submit",
  (e) => {
    if (!form || e.target !== form) return;

    e.preventDefault();

    if (!validate()) {
      e.stopImmediatePropagation();
      return;
    }

    enviar();
  },
  true
);
