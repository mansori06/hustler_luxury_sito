/* ===== HUSTLER LUXURY — app.js (versione con restyling già integrato) ===== */

/* Dati fiscali e di contatto del negozio — MODIFICA QUI per cambiare i dati:
   sono usati da footer, pagine legali e link WhatsApp. */
const DATI_NEGOZIO = {
  ragione_sociale: 'HUSTLER LUXURY',
  forma_giuridica: 'ditta individuale',
  partita_iva: '02203530668',
  indirizzo: 'Via Roma 93, 67051 Avezzano (AQ)',
  email: 'info@hustlerluxury.it',
  whatsapp: '393792842837',
  instagram: 'https://www.instagram.com/hustler__luxury/',
  tiktok: 'https://www.tiktok.com/@hustler.luxury'
};

const WHATSAPP_NUMBER = DATI_NEGOZIO.whatsapp;
function formatWhatsApp() {
  const d = WHATSAPP_NUMBER.replace(/\D/g, '');
  if (d.startsWith('39') && d.length > 2) {
    const n = d.slice(2);
    const parts = (n.slice(0,3) + ' ' + n.slice(3,6) + ' ' + n.slice(6)).split(' ').filter(Boolean);
    return '+39 ' + parts.join(' ');
  }
  return d;
}
const SHIPPING_THRESHOLD = 100;
const SHIPPING_COST = 5.99;

const ICONE = {
  cerca: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  cuore: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-9-9.2C1.8 7.5 3.8 4 7.2 4c2 0 3.7 1.2 4.8 3 1.1-1.8 2.8-3 4.8-3 3.4 0 5.4 3.5 4.2 6.8C19 15.4 12 20 12 20z"/></svg>',
  carrello: '<svg viewBox="0 0 24 24"><path d="M3 4h2l2.5 11h11L20 7H6"/><circle cx="9" cy="19.5" r="1.2"/><circle cx="17" cy="19.5" r="1.2"/></svg>',
  confronta: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="6" height="12" rx="1"/><rect x="15" y="6" width="6" height="12" rx="1"/><path d="M9 12h6"/></svg>'
};

/* ===== Storage helpers ===== */
const storage = {
  get(key) { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};

const cart = {
  get() { return storage.get('hustler_cart'); },
  set(items) { storage.set('hustler_cart', items); },
  add(id, size) {
    if (!size) {
      if (document.getElementById('size-selector')) { showToast('Seleziona una taglia'); return; }
      window.location.href = window.URLS.detailBase + encodeURIComponent(id) + '/';
      return;
    }
    const items = this.get();
    const existing = items.find(i => i.id === id && i.size === size);
    if (existing) existing.qty += 1;
    else items.push({ id, size, qty: 1 });
    this.set(items);
    this.notifier();
  },
  update(id, size, qty) {
    const items = this.get();
    const item = items.find(i => i.id === id && i.size === size);
    if (item) { item.qty = Math.max(1, parseInt(qty) || 1); this.set(items); }
  },
  remove(id, size) {
    const items = cart.get().filter(i => !(i.id === id && i.size === size));
    this.set(items);
  },
  total() {
    return this.get().reduce((sum, i) => {
      const p = products.findById(i.id);
      return sum + (p ? p.prezzo * i.qty : 0);
    }, 0);
  },
  shipping() {
    const total = this.total();
    return total >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  },
  notifier() { this.onUpdate && this.onUpdate(); },
  onUpdate() {}
};

const fav = {
  get() { return storage.get('hustler_fav'); },
  set(ids) { storage.set('hustler_fav', ids); },
  toggle(id) {
    const ids = this.get();
    const idx = ids.indexOf(id);
    if (idx > -1) ids.splice(idx, 1);
    else ids.push(id);
    this.set(ids);
  },
  has(id) { return this.get().includes(id); }
};

/* ===== Products loader ===== */
const products = {
  all: [],
  loaded: false,
  onLoad: [],
  findById(id) { const s = String(id).trim(); return this.all.find(p => String(p.id).trim() === s); },
  async load() {
    /* Usa i dati globali forniti da Django (context processor) al posto del
       fetch di products.json; mantiene comunque il fallback fetch. */
    if (window.PRODUCTS_DATA) {
      this.all = window.PRODUCTS_DATA;
      this.render();
    } else {
      try {
        const res = await fetch(window.PRODUCTS_URL || 'data/products.json');
        this.all = await res.json();
        this.render();
      } catch (err) { console.error('Products load failed', err); }
    }
    this.loaded = true;
    this.onLoad.forEach(cb => cb());
    return true;
  },
  render() {
    const grid = document.getElementById('product-grid');
    if (grid) grid.innerHTML = this.all.map(p => this.card(p)).join('');
    /* Dettaglio prodotto: lo slug è letto da data-slug (template prodotto.html)
       oppure dall'url ?id= (retrocompatibile). */
    const detail = document.getElementById('product-detail');
    if (detail) {
      const pid = new URLSearchParams(location.search).get('id');
      const slug = detail.dataset ? detail.dataset.slug : null;
      const id = pid || slug;
      if (id) {
        const p = this.findById(id);
        if (p) { detail.innerHTML = this.detail(p); }
      }
    }
  },
  card(p) {
    const on = fav.has(p.id);
    const sconto = p.prezzoBarrato ? Math.round((1 - p.prezzo / p.prezzoBarrato) * 100) : 0;
    const badge = sconto ? '<span class="badge-percent">-' + sconto + '%</span>' : (p.novita ? '<span class="badge-nuovo">Nuovo</span>' : '');
    const prezzo = p.prezzoBarrato
      ? '<span class="product-price sale"><span class="old">€' + fmtPrice(p.prezzoBarrato) + '</span>€' + fmtPrice(p.prezzo) + '</span>'
      : '<span class="product-price">€' + fmtPrice(p.prezzo) + '</span>';
    const img2 = p.immagini[1] ? '<img class="img2" src="' + p.immagini[1] + '" alt="" loading="lazy">' : '';
    const durl = window.URLS.detailBase + p.id + '/';
    return '<div class="product-card" data-id="' + p.id + '">' + badge +
      '<button class="fav-toggle' + (on ? ' on' : '') + '" aria-label="Preferiti" onclick="toggleFavCard(this,\'' + p.id + '\')">' + ICONE.cuore + '</button>' +
      '<button class="compare-toggle" aria-label="Confronta" onclick="toggleCompare(this)">' + ICONE.confronta + '</button>' +
      '<div class="product-img"><a href="' + durl + '" aria-label="' + p.nome + '"><img src="' + p.immagini[0] + '" alt="' + p.nome + '" loading="lazy">' + img2 + '</a>' +
        '<div class="card-actions"><a href="' + durl + '">Vista rapida</a><a href="#" onclick="quickBuy(this);return false">Acquisto rapido</a></div></div>' +
      '<div class="product-info"><div class="product-name">' + p.nome + '</div>' + prezzo + '</div></div>';
  },
  detail(p) {
    const priceHtml = p.prezzoBarrato
      ? `<div class="detail-price"><span class="old">€${p.prezzoBarrato.toFixed(2)}</span> €${p.prezzo.toFixed(2)}</div>`
      : `<div class="detail-price">€${p.prezzo.toFixed(2)}</div>`;
    const sizeBtns = p.taglie.map(t => `<button type="button" class="size-btn" data-size="${t}" onclick="selectSize(this)">${t}</button>`).join('');
    return `
      <div class="detail-gallery">
        <div class="gallery-main"><img src="${p.immagini[0]}" alt="${p.nome}" id="gallery-main"></div>
        <div class="gallery-thumbs">${p.immagini.slice(1).map(img => `<img src="${img}" alt="${p.nome}" onclick="swapMain('${img}')" loading="lazy">`).join('')}</div>
      </div>
      <div class="detail-info">
        <h1>${p.nome}</h1>
        <div class="detail-meta">
          <span class="detail-category">${p.categoria}</span>
          ${fav.has(p.id) ? '<span class="detail-category">★ Preferito</span>' : ''}
        </div>
        ${priceHtml}
        <p class="mt-sm" style="color:var(--gray-text);font-size:0.85rem;margin-bottom:16px">${p.descrizione}</p>
        <div class="size-selector" id="size-selector">${sizeBtns}</div>
        <div class="qty-selector">
          <button onclick="decQty()">−</button>
          <input type="number" id="qty-input" value="1" min="1">
          <button onclick="incQty()">+</button>
        </div>
        <div class="detail-actions">
          <button class="btn btn-lg" onclick="addToCartFromDetail('${p.id}')">Aggiungi al carrello</button>
          <button class="btn btn-lg btn-outline" onclick="fav.toggle('${p.id}');refreshFav()">Preferisci</button>
        </div>
        <button class="btn mt-md" onclick="orderWhatsApp('${p.nome}')">Ordina su WhatsApp</button>
      </div>`;
  }
};

/* Detail page helpers */
window.swapMain = (src) => { document.getElementById('gallery-main').src = src; };
window.addToCartFromDetail = (id) => {
  const active = document.querySelector('#size-selector .size-btn.active');
  const size = active ? active.getAttribute('data-size') : null;
  if (!size) { showToast('Seleziona una taglia'); return; }
  const q = Math.max(1, Math.min(10, parseInt(document.getElementById('qty-input').value) || 1));
  const prima = cart.get().find(i => i.id === id && i.size === size);
  const base = prima ? prima.qty : 0;
  cart.add(id, size);
  cart.update(id, size, base + q);
  cart.notifier();
  showToast('Aggiunto al carrello');
};
let qty = 1;
window.incQty = () => { qty = Math.min(10, qty + 1); document.getElementById('qty-input').value = qty; };
window.decQty = () => { qty = Math.max(1, qty - 1); document.getElementById('qty-input').value = qty; };
window.selectSize = (btn) => {
  document.querySelectorAll('#size-selector .size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
};
window.orderWhatsApp = (name) => {
  const msg = encodeURIComponent(`Ciao! Vorrei ordinare: ${name}`);
  window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g,'')}/?text=${msg}`, '_blank');
};

/* Favorites helpers */
window.toggleFavCard = (btn, id) => {
  fav.toggle(id);
  btn.classList.toggle('on', fav.has(id));
  window.updateFavCount();
};
window.refreshFav = () => { window.updateFavCount(); products.render(); };
/* Confronto (icona visiva) e acquisto rapido dalla card */
window.toggleCompare = (btn) => btn.classList.toggle('on');
window.quickBuy = (btn) => { const id = btn.closest('.product-card').dataset.id; cart.add(id); };

/* ===== Header / Footer ===== */
/* Nota: header e footer sono ora inclusi in modo statico in base.html;
   questi oggetti sono mantenuti per riferimento ma non più iniettati. */
const header = {
  render() {
    const links = [
      { href: window.URLS.index, label: 'Home' },
      { href: window.URLS.collection, label: 'Shop', badge: 'New' },
      { href: window.URLS.collection, label: 'Prodotti' },
      { href: window.URLS.index + '#promo', label: 'In offerta', badge: 'Sale', sale: true }
    ];
    const cartQty = cart.get().reduce((s, i) => s + (i.qty || 0), 0);
    const fc = fav.get().length;
    const msgs = ['Spedizione gratuita da 100€', 'Nuovi drop ogni settimana', 'Ordina anche su WhatsApp'];
    const track = [0, 1, 2, 3].map(() => msgs.map(m => '<span>' + m + '</span>').join('')).join('');
    return '<div class="announcement-bar"><div class="marquee">' + track + '</div></div>' +
    '<header><div class="header-top">' +
      '<div class="menu-toggle" onclick="toggleMenu()"><span></span><span></span><span></span></div>' +
      '<nav class="header-nav nav-main">' + links.map(l =>
        '<a href="' + l.href + '">' + l.label + (l.badge ? '<span class="nav-badge' + (l.sale ? ' sale' : '') + '">' + l.badge + '</span>' : '') + '</a>').join('') + '</nav>' +
      '<a href="' + window.URLS.index + '" class="logo">HUSTLER LUXURY</a>' +
      '<div class="header-icons">' +
        '<button type="button" class="icon-btn search-toggle" onclick="openSearch()" aria-label="Cerca">' + ICONE.cerca + '</button>' +
        '<a href="' + window.URLS.collection + '" class="icon-btn" id="pref-link" aria-label="Preferiti">' + ICONE.cuore + '<span class="fav-count" id="fav-count" style="display:' + (fc ? 'block' : 'none') + '">(' + fc + ')</span></a>' +
        '<a href="' + window.URLS.cart + '" class="icon-btn" aria-label="Carrello">' + ICONE.carrello + '<span class="cart-count" id="cart-count" style="display:' + (cartQty ? 'block' : 'none') + '">' + cartQty + ' / €' + fmtPrice(cart.total()) + '</span></a>' +
      '</div>' +
      '<div class="mobile-menu" id="mobile-menu"><span class="menu-close" onclick="toggleMenu()">×</span>' +
        links.map(l => '<a href="' + l.href + '">' + l.label + '</a>').join('') + '</div>' +
    '</header>';
  }
};
const footer = {
  render() {
    const wa = WHATSAPP_NUMBER.replace(/\D/g, '');
    const d = DATI_NEGOZIO;
    return '<a class="wa-float" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">Assistenza</a>' +
    '<footer><div class="footer-grid">' +
      '<div class="footer-col"><h3>HUSTLER LUXURY</h3><p style="color:var(--gray-text);font-size:0.85rem">Streetwear da Avezzano.</p></div>' +
      '<div class="footer-col"><h3>Shop</h3><ul><li><a href="' + window.URLS.index + '">Home</a></li><li><a href="' + window.URLS.collection + '">Collezione</a></li><li><a href="' + window.URLS.cart + '">Carrello</a></li></ul></div>' +
      '<div class="footer-col"><h3>Contatti</h3><ul>' +
        '<li style="font-size:.85rem"><strong>' + d.ragione_sociale + ' ' + d.forma_giuridica + '</strong></li>' +
        '<li style="font-size:.85rem">' + d.indirizzo + '</li><li style="font-size:.85rem">P.IVA ' + d.partita_iva + '</li>' +
        '<li style="font-size:.85rem">' + d.email + '</li>' +
        '<li><a href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + formatWhatsApp() + '</a></li></ul></div>' +
      '<div class="footer-col"><h3>Informazioni</h3><ul><li><a href="' + window.URLS.index + 'privacy/">Privacy</a></li><li><a href="' + window.URLS.index + 'termini/">Termini di vendita</a></li><li><a href="' + window.URLS.index + 'resi/">Spedizioni e resi</a></li><li><a href="' + window.URLS.index + 'recesso/">Modulo di recesso</a></li></ul></div>' +
      '<div class="footer-col"><h3>Social</h3><div class="social-links"><a href="' + d.instagram + '" target="_blank" rel="noopener noreferrer">Instagram</a><a href="' + d.tiktok + '" target="_blank" rel="noopener noreferrer">TikTok</a></div></div>' +
    '</div><div class="footer-bottom">© ' + new Date().getFullYear() + ' HUSTLER LUXURY — Tutti i diritti riservati</div></footer>';
  }
};
window.toggleMenu = () => document.getElementById('mobile-menu').classList.toggle('open');

/* ===== Cart page ===== */
function normalizeCart() {
  if (products.all.length === 0) return cart.get();
  const items = cart.get();
  let changed = false;
  const valid = [];
  items.forEach(i => {
    const p = products.findById(i.id);
    if (!p) { changed = true; return; }
    const size = i.size || (p.taglie && p.taglie.length ? p.taglie[0] : 'Unica');
    if (i.size !== size) { i.size = size; changed = true; }
    valid.push(i);
  });
  if (changed) cart.set(valid);
  return valid;
}
window.updateCartView = () => {
  const items = cart.get();
  const wrapper = document.getElementById('cart-wrapper');
  const empty = document.getElementById('empty-cart');
  if (!wrapper) return;
  if (items.length === 0) { wrapper.style.display = 'none'; if (empty) empty.style.display = 'block'; }
  else { wrapper.style.display = 'block'; if (empty) empty.style.display = 'none'; }
};
window.updateCartCount = () => {
  const valid = normalizeCart();
  const count = document.getElementById('cart-count');
  if (!count) return;
  const q = valid.reduce((s, i) => s + (i.qty || 0), 0);
  count.style.display = q ? 'block' : 'none';
  count.textContent = q + ' / €' + fmtPrice(cart.total());
};
function renderCart() {
  const list = document.getElementById('cart-list');
  const items = normalizeCart();
  if (!list) return;
  if (items.length === 0) { list.innerHTML = '<p style="text-align:center;color:var(--gray-text)">Il tuo carrello è vuoto.</p>'; return; }
  list.innerHTML = items.map(i => {
    const p = products.findById(i.id);
    if (!p) return '';
    return `<tr class="cart-item-row" data-id="${p.id}">
      <td><div class="cart-item"><img src="${p.immagini[0]}" alt="${p.nome}"><div><div class="cart-item-name">${p.nome}</div><div class="cart-item-meta">Taglia ${i.size || (p.taglie && p.taglie.length ? p.taglie[0] : 'Unica')}</div></div></div></td>
      <td class="cart-price">€${p.prezzo.toFixed(2)}</td>
      <td class="cart-qty"><button class="qty-sm" onclick="changeQty('${p.id}', '${i.size}', ${i.qty - 1})">&#8722;</button><input type="number" min="1" value="${i.qty}" onchange="updateCart('${p.id}', '${i.size}', this.value)"><button class="qty-sm" onclick="changeQty('${p.id}', '${i.size}', ${i.qty + 1})">&#43;</button><div class="row-subtotal">€${(p.prezzo * i.qty).toFixed(2)}</div></td>
      <td><span class="remove-item" onclick="removeFromCart('${p.id}', '${i.size}')">×</span></td>
    </tr>`;
  }).join('');
  const subtotal = cart.total();
  const ship = cart.shipping();
  const grand = subtotal + ship;
  let summary = `<div class="cart-summary">
    <div class="summary-row"><span>Subtotale</span><span>€${subtotal.toFixed(2)}</span></div>
    <div class="summary-row"><span>Spedizione</span><span>${ship===0?'GRATIS':'€'+ship.toFixed(2)}</span></div>
    <div class="summary-row summary-total"><span>Totale</span><span>€${grand.toFixed(2)}</span></div>
  </div>`;
  const existing = document.getElementById('cart-summary');
  if (existing) existing.innerHTML = summary;
  else list.parentNode.insertAdjacentHTML('beforeend', `<div id="cart-summary">${summary}</div>`);
}
window.updateCart = (id, size, val) => { cart.update(id, size, parseInt(val)||1); renderCart(); };
window.removeFromCart = (id, size) => { cart.remove(id, size); renderCart(); cart.notifier(); };
window.changeQty = (id, size, delta) => { const items = cart.get(); const i = items.find(x => x.id === id && x.size === size); if (i) { i.qty = Math.max(1, delta); cart.set(items); renderCart(); cart.notifier(); } };

function fmtPrice(n) { return n.toFixed(2).replace('.', ','); }

function buildOrderMessage() {
  const items = cart.get();
  if (items.length === 0) return '';
  const nome = document.getElementById('cliente-nome')?.value.trim() || '...';
  const telefono = document.getElementById('cliente-telefono')?.value.trim() || '...';
  const indirizzo = document.getElementById('cliente-indirizzo')?.value.trim() || '...';
  const citta = document.getElementById('cliente-citta')?.value.trim() || '...';
  const cap = document.getElementById('cliente-cap')?.value.trim() || '...';
  const note = document.getElementById('cliente-note')?.value.trim() || '';
  const pagamento = document.querySelector('input[name="pagamento"]:checked')?.value || 'Non specificato';
  const lines = [];
  lines.push('Nuovo ordine HUSTLER LUXURY');
  lines.push('Cliente: ' + nome);
  lines.push('Telefono: ' + telefono);
  lines.push('Indirizzo: ' + indirizzo + ', ' + cap + ' ' + citta);
  lines.push('Pagamento: ' + pagamento.charAt(0).toUpperCase() + pagamento.slice(1));
  lines.push('');
  lines.push('Articoli:');
  let idx = 1;
  items.forEach(item => {
    const p = products.findById(item.id);
    if (!p) return;
    const taglia = item.size || (p.taglie && p.taglie.length ? p.taglie[0] : 'Unica');
    const rowTot = p.prezzo * item.qty;
    lines.push(idx + ') ' + p.nome + ' - Taglia ' + taglia + ' - x' + item.qty + ' - ' + fmtPrice(rowTot) + '\u20ac');
    idx++;
  });
  const subtotal = cart.total();
  const ship = cart.shipping();
  const grand = subtotal + ship;
  lines.push('');
  lines.push('Subtotale: \u20ac' + fmtPrice(subtotal));
  lines.push('Spedizione: ' + (ship === 0 ? 'GRATIS' : '\u20ac' + fmtPrice(ship)));
  lines.push('TOTALE: \u20ac' + fmtPrice(grand));
  if (note) lines.push('Note: ' + note);
  return lines.join('\n');
}

window.checkoutWhatsApp = () => {
  const items = cart.get();
  if (items.length === 0) return showToast('Carrello vuoto');
  const nome = document.getElementById('cliente-nome')?.value.trim();
  const telefono = document.getElementById('cliente-telefono')?.value.trim();
  const indirizzo = document.getElementById('cliente-indirizzo')?.value.trim();
  const citta = document.getElementById('cliente-citta')?.value.trim();
  const cap = document.getElementById('cliente-cap')?.value.trim();
  const pagamento = document.querySelector('input[name="pagamento"]:checked')?.value;
  if (!nome || !telefono || !indirizzo || !citta || !cap || !pagamento) {
    showToast('Compila tutti i campi obbligatori');
    return;
  }
  const msg = encodeURIComponent(buildOrderMessage());
  window.open('https://wa.me/' + WHATSAPP_NUMBER.replace(/\D/g,'') + '/?text=' + msg, '_blank');
};

window.copyOrder = () => {
  if (cart.get().length === 0) return showToast('Carrello vuoto');
  const txt = buildOrderMessage();
  navigator.clipboard.writeText(txt).then(() => showToast('Ordine copiato negli appunti'), () => showToast('Copia fallita'));
};

window.clearCartConfirmed = () => {
  if (!confirm('Sicuro di voler svuotare il carrello?')) return;
  cart.set([]);
  cart.notifier();
  showToast('Carrello svuotato');
};

/* ===== Toast ===== */
function showToast(text) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2000);
}

/* ===== Back to top ===== */
function initBackTop() {
  const btn = document.getElementById('back-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 300));
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ===== Header scroll shadow ===== */
function initHeaderScroll() {
  const hdr = document.querySelector('header');
  if (!hdr) return;
  const onScroll = () => { hdr.style.boxShadow = window.scrollY > 10 ? '0 4px 16px rgba(0,0,0,0.35)' : ''; };
  onScroll();
  window.addEventListener('scroll', onScroll);
}

/* ===== Search overlay (porta a collezione.html?q=...) ===== */
let searchOverlay = null;
window.openSearch = () => {
  if (!searchOverlay) {
    searchOverlay = document.createElement('div');
    searchOverlay.className = 'search-overlay';
    const modal = document.createElement('div');
    modal.style.cssText = 'width:90%;max-width:430px;margin:auto;display:flex;gap:8px;';
    const input = document.createElement('input');
    input.type = 'text'; input.id = 'search-input'; input.placeholder = 'Cerca prodotti…';
    input.style.cssText = 'flex:1;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius);';
    const go = document.createElement('button'); go.className = 'btn btn-sm'; go.textContent = '→';
    const submit = () => { const q = input.value.trim(); if (q) window.location.href = window.URLS.collection + '?q=' + encodeURIComponent(q); };
    go.onclick = submit;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') window.closeSearch(); });
    modal.appendChild(input); modal.appendChild(go);
    Object.assign(searchOverlay.style, { position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.88)', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 2000 });
    searchOverlay.appendChild(modal);
    searchOverlay.addEventListener('click', e => { if (e.target === searchOverlay) window.closeSearch(); });
    document.body.appendChild(searchOverlay);
  }
  searchOverlay.style.display = 'flex';
  searchOverlay.querySelector('#search-input').focus();
};
window.closeSearch = () => { if (searchOverlay) searchOverlay.style.display = 'none'; };

/* ===== Favorites counter ===== */
window.updateFavCount = () => {
  const fc = document.getElementById('fav-count');
  if (!fc) return;
  const n = fav.get().length;
  fc.style.display = n ? 'block' : 'none';
  fc.textContent = '(' + n + ')';
};

/* ===== Scroll reveal (IntersectionObserver) ===== */
let revealObserver = null;
function createRevealObserver() {
  revealObserver = new IntersectionObserver((entries, o) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); o.unobserve(e.target); } });
  }, { threshold: 0.1 });
}
function observeCards() {
  if (!revealObserver) createRevealObserver();
  document.querySelectorAll('.product-card:not(.visible)').forEach(c => revealObserver.observe(c));
}
function initReveal() {
  const revealT = document.querySelectorAll('.reveal:not(.visible)');
  const cardT = document.querySelectorAll('.product-card:not(.visible)');
  if (!revealT.length && !cardT.length) return;
  if (typeof IntersectionObserver === 'undefined') { revealT.forEach(t => t.classList.add('visible')); cardT.forEach(c => c.classList.add('visible')); return; }
  if (!revealObserver) createRevealObserver();
  revealT.forEach(t => revealObserver.observe(t));
  cardT.forEach(c => revealObserver.observe(c));
}

/* ===== Init ===== */
/* L'header, il footer, il back-top e la bottom-nav sono ora inclusi
   staticamente in base.html, quindi non vengono più iniettati da JS. */
document.addEventListener('DOMContentLoaded', () => {
  cart.onUpdate = () => { renderCart(); updateCartView(); updateCartCount(); window.updateFavCount(); };
  products.load().then(() => { updateCartCount(); window.updateFavCount(); if (document.getElementById('cart-list')) { renderCart(); updateCartView(); } initReveal(); });
  const wa = document.getElementById('whatsapp-link');
  if (wa) wa.href = 'https://wa.me/' + WHATSAPP_NUMBER.replace(/\D/g,'');
  initBackTop();
  initHeaderScroll();
});
