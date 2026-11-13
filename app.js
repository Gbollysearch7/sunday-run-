(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const P = window.PRODUCTS, money = n => '£' + n.toFixed(2);
  const interleave = l => { const w = l.filter(p => p.colour === 'white'), b = l.filter(p => p.colour !== 'white'), o = [];
    for (let i = 0; i < Math.max(w.length, b.length); i++) { if (w[i]) o.push(w[i]); if (b[i]) o.push(b[i]); } return o; };
  const NEW = new Set(interleave(P).slice(0, 12).map(p => p.id));   // first twelve of the mixed grid carry the "New" badge
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  // gender: 'all' = Shop All, led by the owner's own main/hover picks; 'women' / 'men' lead with the matching model
  const state = { type: 'all', colour: null, sort: 'featured', q: '', onlyNew: false, gender: 'all' };
  let bag = [];
  try { bag = JSON.parse(localStorage.getItem('bag') || '[]'); } catch (e) {}

  const img = (p, kind) => `img/${p.id}-${kind}.jpg`;
  const typeName = p => p.type === 'tee' ? 'Tee' : p.type === 'hoodie' ? 'Hoodie' : 'Sweatshirt';
  const label = p => `${p.title} ${typeName(p)}`;
  const pair = p => state.gender === 'women' ? ['her', 'him'] : state.gender === 'men' ? ['him', 'her'] : ['main', 'hover'];
  const TITLES = { all: 'Shop All', women: 'Women', men: 'Men' };

  // photos for a card: the lead and hover shots first, then the rest of this section's gallery, the print close-up last
  function cardShots(p, a, b) {
    const lead = [img(p, a), img(p, b)], rest = gallery(p).filter(s => s !== p.flat);
    return [...lead, ...rest.slice(2)];
  }
  function render() {
    let list = P.filter(p => (state.type === 'all' || p.type === state.type) && (!state.colour || p.colour === state.colour)
      && (!state.onlyNew || NEW.has(p.id)) && (!state.q || (label(p) + ' ' + p.colour).toLowerCase().includes(state.q)));
    if (state.sort === 'featured') {   // owner: alternate white and black garments down the grid
      const wh = list.filter(p => p.colour === 'white'), bl = list.filter(p => p.colour !== 'white'), mix = [];
      for (let i = 0; i < Math.max(wh.length, bl.length); i++) { if (wh[i]) mix.push(wh[i]); if (bl[i]) mix.push(bl[i]); }
      list = mix;
    }
    if (state.sort === 'low') list = [...list].sort((a, b) => a.price - b.price);
    if (state.sort === 'high') list = [...list].sort((a, b) => b.price - a.price);
    if (state.sort === 'az') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    $('#grid').innerHTML = list.map(p => {
      const [a, b] = pair(p);
      return `<article class="card">
        <div class="mw">
          <a class="media" href="#${p.id}" data-open="${p.id}" aria-label="View ${label(p)}">
            ${NEW.has(p.id) ? '<span class="badge">New</span>' : ''}
            <div class="slides">${cardShots(p, a, b).map((s, i) => `<img${i === 1 ? ' class="alt"' : i > 1 ? ' class="more"' : ''} src="${s}" alt="${i ? '' : label(p) + ' in ' + p.colour}" loading="lazy" width="960" height="1200">`).join('')}</div>
            <div class="sdots">${cardShots(p, a, b).map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>
          </a>
          <div class="quick"><span>Quick add</span>${SIZES.map(s => `<button data-add="${p.id}" data-size="${s}" aria-label="Add ${label(p)} size ${s}">${s}</button>`).join('')}</div>
        </div>
        <div class="info"><h3><a href="#${p.id}" data-open="${p.id}">${label(p)}</a></h3><p>${money(p.price)}</p></div>
      </article>`;
    }).join('');
    $('#count').textContent = list.length + (list.length === 1 ? ' product' : ' products');
    $('#empty').hidden = list.length > 0;
    $$('#filters [data-type]').forEach(b => b.classList.toggle('on', b.dataset.type === state.type));
    $$('#filters [data-colour]').forEach(b => b.classList.toggle('on', b.dataset.colour === state.colour));
    const sub = state.onlyNew ? 'New In' : ({ all: '', tee: 'Tees', hoodie: 'Hoodies', sweatshirt: 'Sweatshirts' })[state.type];
    $('#collTitle').textContent = state.gender === 'all' ? (sub || 'Shop All') : TITLES[state.gender] + (sub ? ' · ' + sub : '');
    $$('[data-gender]').forEach(b => b.classList.toggle('current', b.dataset.gender === state.gender));
  }

  // ---- product page: Vaara-style stacked gallery, the print close-up last ----
  function gallery(p) {
    const g = p.gallery.slice();
    if (state.gender === 'women') g.sort((a, b) => (a.g === 'w' ? 0 : 1) - (b.g === 'w' ? 0 : 1));
    if (state.gender === 'men') g.sort((a, b) => (a.g === 'm' ? 0 : 1) - (b.g === 'm' ? 0 : 1));
    const seen = new Set(); const out = [];
    for (const x of g) if (!seen.has(x.src)) { seen.add(x.src); out.push(x.src); }
    return [...out, p.flat, p.detail];
  }
  let current = null, chosenSize = null;
  function openProduct(id) {
    const p = P.find(x => x.id === id); if (!p) return;
    current = p; chosenSize = null;
    const shots = gallery(p);
    $('#pdpGallery').innerHTML = shots.map((s, i) => `<figure><img src="${s}" alt="${label(p)}, ${i === shots.length - 1 ? 'close-up of the print' : i === shots.length - 2 ? 'flat-lay' : 'on model'}" loading="${i < 2 ? 'eager' : 'lazy'}" width="960" height="1200"></figure>`).join('');
    $('#pdpDots').innerHTML = shots.map((_, i) => `<button type="button" data-dot="${i}" aria-label="Photo ${i + 1}"></button>`).join('');
    $('#pdpTitle').textContent = label(p);
    $('#pdpPrice').textContent = money(p.price);
    $('#pdpColour').textContent = p.colour === 'white' ? 'Optical white' : 'Jet black';
    $('#pdpDesc').textContent = `${p.title}, ${p.side === 'back' ? 'printed large across the back' : 'printed on the chest'} of an oversized, heavyweight ${typeName(p).toLowerCase()}. Dropped shoulders, straight full-length cut, made to order in the UK.`;
    $('#pdpSizes').innerHTML = SIZES.map(s => `<button type="button" data-size-pick="${s}">${s}</button>`).join('');
    $('#pdpAdd').textContent = 'Select a size';
    $('#pdp').hidden = false; document.body.classList.add('locked');
    $('#pdpGallery').scrollTo({ top: 0, left: 0 }); $('#pdpClose').focus(); updateDots();
    if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  }
  function closeProduct() { $('#pdp').hidden = true; document.body.classList.remove('locked'); current = null; history.replaceState(null, '', location.pathname); }
  function updateDots() {
    const g = $('#pdpGallery'); const horiz = g.scrollWidth > g.clientWidth + 4;
    const i = horiz ? Math.round(g.scrollLeft / g.clientWidth) : 0;
    $$('#pdpDots button').forEach((b, k) => b.classList.toggle('on', k === i));
  }
  $('#pdpGallery').addEventListener('scroll', updateDots, { passive: true });

  function renderBag() {
    try { localStorage.setItem('bag', JSON.stringify(bag)); } catch (e) {}
    $('#bagCount').textContent = bag.reduce((n, l) => n + l.qty, 0);
    $('#bagTotal').textContent = money(bag.reduce((n, l) => n + l.qty * P.find(p => p.id === l.id).price, 0));
    $('#bagItems').innerHTML = bag.length ? bag.map((l, i) => {
      const p = P.find(x => x.id === l.id);
      return `<div class="line"><img src="${img(p, 'flat')}" alt=""><div>${label(p)}<small>${p.colour} / ${l.size} / qty ${l.qty}</small><button class="rm" data-rm="${i}">Remove</button></div><span>${money(p.price * l.qty)}</span></div>`;
    }).join('') : '<p class="none">Your shopping bag is empty.</p>';
  }
  const addToBag = (id, size) => { const l = bag.find(x => x.id === id && x.size === size); l ? l.qty++ : bag.push({ id, size, qty: 1 }); renderBag(); open('bag'); };

  const open = id => { $('#' + id).hidden = false; $('#scrim').hidden = false; };
  const closeAll = () => { $$('.drawer').forEach(d => d.hidden = true); $('#scrim').hidden = true; };

  document.addEventListener('click', e => {
    const t = e.target.closest('button, a'); if (!t) return;
    if (t.dataset.open) { e.preventDefault(); openProduct(t.dataset.open); }
    else if (t.dataset.gender) {
      e.preventDefault(); state.gender = t.dataset.gender; state.onlyNew = false; state.type = 'all';
      $$('.nav a[data-nav]').forEach(a => a.classList.remove('current'));
      closeAll(); render(); scrollTo({ top: 0 });
    }
    else if (t.dataset.sizePick) {
      chosenSize = t.dataset.sizePick; $$('#pdpSizes button').forEach(b => b.classList.toggle('on', b === t));
      $('#pdpAdd').textContent = `Add to bag · ${chosenSize}`;
    }
    else if (t.id === 'pdpAdd') { if (current && chosenSize) addToBag(current.id, chosenSize); else $('#pdpSizes').classList.add('nudge'), setTimeout(() => $('#pdpSizes').classList.remove('nudge'), 600); }
    else if (t.id === 'pdpClose') closeProduct();
    else if (t.id === 'pdpHome' || t.classList.contains('logo')) {   // logo = back to the home page (Shop All, top)
      e.preventDefault(); if (!$('#pdp').hidden) closeProduct();
      Object.assign(state, { type: 'all', colour: null, q: '', onlyNew: false, gender: 'all' }); closeAll(); render(); scrollTo({ top: 0 });
    }
    else if (t.dataset.dot) { const g = $('#pdpGallery'); const k = +t.dataset.dot; g.scrollWidth > g.clientWidth + 4 ? g.scrollTo({ left: k * g.clientWidth, behavior: 'smooth' }) : g.children[k].scrollIntoView({ behavior: 'smooth' }); }
    else if (t.dataset.type) { state.type = t.dataset.type; state.onlyNew = false; render(); }
    else if (t.dataset.colour) { state.colour = state.colour === t.dataset.colour ? null : t.dataset.colour; render(); }
    else if (t.dataset.cols) { $('#grid').dataset.cols = t.dataset.cols; $$('.views button').forEach(b => b.classList.toggle('on', b === t)); }
    else if (t.dataset.add) addToBag(t.dataset.add, t.dataset.size);
    else if (t.dataset.rm) { bag.splice(+t.dataset.rm, 1); renderBag(); }
    else if (t.dataset.nav) {
      e.preventDefault(); const n = t.dataset.nav;
      state.onlyNew = n === 'new'; state.type = n === 'new' || n === 'all' ? 'all' : n; state.colour = null; if (n === 'all' || n === 'new') state.gender = 'all';
      $$('.nav a[data-nav]').forEach(a => a.classList.toggle('current', a.dataset.nav === (n === 'new' ? 'new' : 'all')));
      closeAll(); render(); scrollTo({ top: 0 });
    }
    else if ('close' in t.dataset) closeAll();
    else if (t.id === 'bagBtn') open('bag');
    else if (t.id === 'burger') open('menu');
    else if (t.id === 'searchBtn') { $('#searchbar').hidden = false; $('#search').focus(); }
    else if (t.id === 'searchClose') { $('#searchbar').hidden = true; $('#search').value = ''; state.q = ''; render(); }
    else if (t.id === 'reset') { Object.assign(state, { type: 'all', colour: null, q: '', onlyNew: false }); $('#search').value = ''; render(); }
  });
  $('#scrim').addEventListener('click', closeAll);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#pdp').hidden) closeProduct(); else closeAll(); } });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
  $('#search').addEventListener('input', e => { state.q = e.target.value.trim().toLowerCase(); render(); });
  $('#news').addEventListener('submit', e => { e.preventDefault(); $('#newsNote').textContent = 'Thank you. The mailing list is not connected yet.'; e.target.reset(); });

  const msgs = $$('#announce span'); let m = 0;
  setInterval(() => { msgs[m].classList.remove('on'); m = (m + 1) % msgs.length; msgs[m].classList.add('on'); }, 4500);

  document.addEventListener('scroll', e => {
    const s = e.target; if (!(s instanceof Element) || !s.classList.contains('slides')) return;
    const i = Math.round(s.scrollLeft / s.clientWidth);
    s.parentElement.querySelectorAll('.sdots i').forEach((d, k) => d.classList.toggle('on', k === i));
  }, true);
  render(); renderBag();
  const startId = location.hash.slice(1); if (startId && P.some(p => p.id === startId)) openProduct(startId);
})();
