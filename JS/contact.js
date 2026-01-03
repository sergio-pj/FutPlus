// ...new file...
(function () {
  const FORM_KEY = 'futplus_contacts';
  const DEFAULT_TO = window.CONTACT_TO || 'sergiopaulo.almeida04@gmail.com';

  // EmailJS config
  const EMAILJS_SERVICE = 'service_pe0femc';
  const EMAILJS_TEMPLATE = 'template_r4l7jqa';
  const EMAILJS_USER = window.EMAILJS_USER_ID || '5SqI5DF2CuwmfVMo4'; // seu Public Key

  function el(id) { return document.getElementById(id); }

  function showMessage(text, type = 'success') {
    const m = el('contact-msg');
    if (!m) return;
    m.innerText = text;
    m.className = 'contact-msg ' + type;
    setTimeout(() => { if (m) { m.innerText = ''; m.className = 'contact-msg'; } }, 6000);
  }

  function validate(name, email, message) {
    if (!name || name.trim().length < 2) return 'Nome inválido';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'E-mail inválido';
    if (!message || message.trim().length < 6) return 'Mensagem muito curta';
    return null;
  }

  function saveLocal(payload) {
    const arr = JSON.parse(localStorage.getItem(FORM_KEY) || '[]');
    arr.push(Object.assign({ ts: Date.now() }, payload));
    localStorage.setItem(FORM_KEY, JSON.stringify(arr));
  }

  function sendMailto(payload) {
    const to = DEFAULT_TO;
    const subject = `Contato FutPlus: ${payload.name}`;
    const bodyLines = [
      `Nome: ${payload.name}`,
      `E-mail: ${payload.email}`,
      `Mensagem:`,
      payload.message
    ];
    const body = bodyLines.join('\n');

    if (to.toLowerCase().endsWith('@gmail.com') || to.toLowerCase().endsWith('@googlemail.com')) {
      const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(url, '_blank');
      return;
    }
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
  }

  function initEmailJS() {
    if (!EMAILJS_USER) return false;
    if (window.emailjs && !window._emailjsInitialized) {
      try {
        // v4 init
        emailjs.init(EMAILJS_USER);
        window._emailjsInitialized = true;
      } catch (e) {
        console.warn('EmailJS init falhou', e);
        return false;
      }
    }
    return !!window._emailjsInitialized;
  }

  async function sendWithEmailJS(payload) {
    if (!initEmailJS()) throw new Error('EmailJS Public Key não configurado.');
    const templateParams = {
      name: payload.name,
      email: payload.email,
      message: payload.message
    };
    try {
      // passa public key como 4º argumento para garantir
      const res = await emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams, EMAILJS_USER);
      console.info('EmailJS send ok', res);
      return res;
    } catch (err) {
      console.error('EmailJS send erro', err);
      // propaga para tratamento no submit
      throw err;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = el('contact-form');
    if (!form) {
      console.warn('contact-form não encontrado na página');
      return;
    }
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const btn = el('contact-submit');
      if (btn) btn.disabled = true;

      const name = (el('contact-name')?.value || '').trim();
      const email = (el('contact-email')?.value || '').trim();
      const message = (el('contact-message')?.value || '').trim();

      const err = validate(name, email, message);
      if (err) {
        showMessage(err, 'error');
        if (btn) btn.disabled = false;
        return;
      }

      const payload = { name, email, message };
      try {
        if (EMAILJS_USER) {
          await sendWithEmailJS(payload);
          showMessage('Mensagem enviada com sucesso!', 'success');
        } else {
          sendMailto(payload);
          showMessage('Mensagem preparada para envio (abrirá seu cliente de e‑mail).', 'success');
        }
        saveLocal(payload);
        form.reset();
      } catch (e) {
        console.error('Envio contato erro', e);
        showMessage('Erro ao enviar: ' + (e.message || e), 'error');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  });
})();