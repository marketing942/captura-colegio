/* =========================================================
   Colégio CPPEM — Página de contato
   Formulário de contato → Google Sheets
   + redirect imediato para o WhatsApp na mesma aba
   ========================================================= */

/* ---------- CONFIGURAÇÕES ---------- */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxdFplWVSfhTjvyIA7HIWb645xRjGNhBVhTdTf5UMjo0lSpW_A_jCuys0qB4uImKXPQ/exec?aba=COLEGIO";

const WHATSAPP_GROUP = "https://chat.whatsapp.com/Huxe6eDXGCc2HZxqy2GxlW?mode=gi_t";

const form = document.getElementById("lead-form");

/* ---------- Validação ---------- */

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

function validate() {
  let ok = true;

  ["nome", "email", "telefone"].forEach(clearError);

  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const tel = form.telefone.value.replace(/\D/g, "");

  if (nome.length < 3) {
    setError("nome", "Informe seu nome completo.");
    ok = false;
  }

  if (!isEmail(email)) {
    setError("email", "Informe um e-mail válido.");
    ok = false;
  }

  if (tel.length < 10) {
    setError("telefone", "Informe um telefone válido com DDD.");
    ok = false;
  }

  return ok;
}

/* ---------- Máscara de telefone ---------- */

const telefoneInput = document.getElementById("telefone");

if (telefoneInput) {
  telefoneInput.addEventListener("input", () => {
    const v = telefoneInput.value.replace(/\D/g, "").slice(0, 11);
    let out = "";

    if (v.length > 0) out = "(" + v.slice(0, 2);
    if (v.length >= 2) out += ") ";
    if (v.length > 2) out += v.slice(2, 7);
    if (v.length > 7) out += "-" + v.slice(7, 11);

    telefoneInput.value = out;
  });
}

/* ---------- Envio ---------- */

if (form) {
  const btn = document.getElementById("lead-submit");
  const success = document.getElementById("form-success");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validate()) return;

    btn.disabled = true;
    btn.textContent = "ENVIANDO...";

    const payload = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefone: form.telefone.value.trim(),
    };

    try {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      /* ---------- Evento de Lead do Pixel X ---------- */

      if (
        window.pixel_x_app &&
        typeof window.pixel_x_app.send_event === "function"
      ) {
        try {
          await window.pixel_x_app.send_event({
            event_name: "Lead",
            lead_name: payload.nome,
            lead_email: payload.email,
            lead_phone: payload.telefone,
          });
        } catch (_) {
          /*
            Não bloqueia o fluxo.
            Mesmo que o Pixel X falhe, o lead já foi enviado para a planilha.
          */
        }
      }

      /* ---------- Sucesso + redirect imediato ---------- */

      form.querySelectorAll(".field, .note").forEach((el) => {
        el.style.display = "none";
      });

      btn.style.display = "none";

      if (success) {
        success.hidden = false;
        success.innerHTML = `
          ✅ Dados enviados!<br>
          Em breve entraremos em contato com você.
        `;
        success.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }

      /*
        Redireciona na mesma aba.
        Não abre nova janela.
        Não tem contagem de 3 segundos.
      */
      window.location.href = WHATSAPP_GROUP;

    } catch (err) {
      setError("telefone", "Erro ao enviar. Tente novamente.");

      btn.disabled = false;
      btn.textContent = "QUERO ENTRAR EM CONTATO";
    }
  });
}
