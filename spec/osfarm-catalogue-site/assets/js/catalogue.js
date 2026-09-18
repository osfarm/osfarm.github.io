/* OSFarm — catalogue formation & conseil
 * 1. filtrage par famille
 * 2. ouverture d'un module via ancre (#module-a1)
 * 3. envoi de la demande de devis vers le webhook n8n
 * Aucune dépendance.
 */
(function () {
  'use strict';

  // >>> À RENSEIGNER : URL du webhook n8n (production)
  var WEBHOOK = 'https://automation.osfarm.org/webhook/catalogue-demande';
  var FALLBACK_MAIL = 'contact@osfarm.org';

  var root = document.querySelector('.osf-cat');
  if (!root) return;
  var lang = root.getAttribute('data-lang') || 'fr';
  var T = {
    fr: { sending: 'Envoi…', ok: 'Demande envoyée. L\u2019opérateur vous répond sous 5 jours ouvrés.',
          ko: 'L\u2019envoi a échoué. Écrivez-nous à ' + FALLBACK_MAIL + ' en précisant la référence.' },
    en: { sending: 'Sending…', ok: 'Request sent. The operator will reply within 5 working days.',
          ko: 'Sending failed. Please email ' + FALLBACK_MAIL + ' with the reference.' }
  }[lang] || {};

  /* ---- 1. filtres ---- */
  var chips = root.querySelectorAll('.osf-chip');
  var fams = root.querySelectorAll('.osf-fam');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-famille');
      chips.forEach(function (c) { c.classList.toggle('is-on', c === chip); });
      fams.forEach(function (block) {
        block.hidden = !(f === '*' || block.getAttribute('data-famille') === f);
      });
    });
  });

  /* ---- 2. ancre profonde ---- */
  function openFromHash() {
    var h = location.hash;
    if (!h) return;
    var el = document.querySelector(h);
    if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView({ block: 'center' }); }
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  /* ---- 3. demande de devis ---- */
  var dlg = document.getElementById('osf-devis');
  var form = document.getElementById('osf-devis-form');
  if (!dlg || !form) return;
  var title = document.getElementById('osf-devis-title');
  var refField = document.getElementById('osf-devis-ref');
  var status = form.querySelector('.osf-dlg__status');

  root.addEventListener('click', function (e) {
    var btn = e.target.closest('.js-devis');
    if (!btn) return;
    refField.value = btn.getAttribute('data-ref');
    title.textContent = btn.getAttribute('data-ref') + ' — ' + btn.getAttribute('data-titre');
    status.textContent = ''; status.removeAttribute('data-state');
    if (typeof dlg.showModal === 'function') { dlg.showModal(); } else { dlg.setAttribute('open', ''); }
  });

  form.querySelector('.js-close').addEventListener('click', function () { dlg.close(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (form.site_web.value) return;            // piège à robots
    var data = {};
    new FormData(form).forEach(function (v, k) { if (k !== 'site_web') data[k] = v; });
    data.page = location.href;
    data.envoye_le = new Date().toISOString();

    status.textContent = T.sending; status.removeAttribute('data-state');
    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      status.textContent = T.ok; status.setAttribute('data-state', 'ok');
      form.reset();
      setTimeout(function () { dlg.close(); }, 2500);
    }).catch(function () {
      status.textContent = T.ko; status.setAttribute('data-state', 'ko');
    });
  });
})();
