// 크리스마스 어드벤트 마을 — "마을이 곧 달력 상자"
// 창문·문에 붙은 숫자 1~24를 하루에 하나씩 열면 불이 켜지고 선물이 나와요. 선물은 트리에 달리고, 25일엔 별이 올라가요.
(() => {
  'use strict';
  const V = window.VILLAGE, MASK = window.HITMASKS || {};
  const desk = window.desk || null;           // 설치형(Electron)일 때만 있음
  const $ = (s, r = document) => r.querySelector(s);
  const A = f => 'assets/' + f;
  const u = n => `calc(${n}px*var(--s))`;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const HC = V.scene.h, NCELL = V.cells.length;

  document.body.classList.add(desk ? 'desk' : 'web');
  if (!desk) $('#webnote').hidden = false;
  if (matchMedia('(hover:none)').matches) document.body.classList.add('touch');

  /* ───────── 저장 ───────── */
  const KEY = 'advent-village-v2';
  const fresh = () => ({ v: 2, season: V.season, lastUnlocked: 0, opened: {}, orn: {}, notes: {}, made: {}, extra: [], knits: [],
                         settings: { scale: 1, align: 'right', top: false, fx: true, weather: 'snow', nums: 'today', frame: true, full: true, sky: false } });
  const WEATHERS = ['clear', 'snow', 'heavy', 'rain'];
  function valid(s) {
    return s && s.v === 2 && s.opened && typeof s.opened === 'object' && s.orn && typeof s.orn === 'object' && s.notes && typeof s.notes === 'object';
  }
  function load() {
    try {
      const raw = desk ? desk.load() : localStorage.getItem(KEY);
      const s = raw ? JSON.parse(raw) : null;
      if (valid(s)) {
        s.settings = Object.assign(fresh().settings, s.settings); if (!s.made || typeof s.made !== 'object') s.made = {};
        s.chars = (Array.isArray(s.chars) ? s.chars : []).filter(x => x && typeof x.img === 'string' && x.img.startsWith('data:image/')).slice(0, 3);
        s.knits = (Array.isArray(s.knits) ? s.knits : []).filter(x => x && typeof x.img === 'string' && x.img.startsWith('data:image/') && x.x >= -3 && x.x <= 4 && x.y >= -.5 && x.y <= 1.5).slice(-10);
        s.extra = (Array.isArray(s.extra) ? s.extra : []).filter(x => x && V.days[x.day] && typeof x.img === 'string' && x.x >= -1 && x.x <= 2 && x.y >= -.5 && x.y <= 1.5).slice(-8);
        for (const k of Object.keys(s.orn)) if (V.days[k] && V.days[k].place) delete s.orn[k];
        if (!WEATHERS.includes(s.settings.weather)) s.settings.weather = 'snow';
        for (const k of Object.keys(s.orn)) { const o = s.orn[k]; if (!o || !V.days[k] || !(o.x >= -1 && o.x <= 2 && o.y >= -.5 && o.y <= 1.5)) delete s.orn[k]; }
        return s;
      }
    } catch (e) { /* 손상된 저장은 버리고 새로 시작 */ }
    return fresh();
  }
  function save() {
    const raw = JSON.stringify(state);
    try { desk ? desk.save(raw) : localStorage.setItem(KEY, raw); } catch (e) { /* 저장 못 해도 화면은 계속 */ }
  }
  let state = load();
  window.__paperFlakes = Array.isArray(state.paperFlakes) ? state.paperFlakes : [];
  // 1~24일 칸에서 나오는 놀이·장식은 사람마다 순서가 달라요(처음 한 번 섞어서 저장). 25일은 모두 같아요. 이야기 편지는 날짜 순서 그대로.
  {
    const SH = 24, ok = a => Array.isArray(a) && a.length === SH && a.every((k, i) => k >= 1 && k <= SH && a.indexOf(k) === i);
    if (!ok(state.order)) {
      const fixed = Object.keys(state.opened || {}).map(Number).filter(n => n >= 1 && n <= SH);   // 이미 연 칸은 그대로 두고 나머지만 섞음
      const rest = []; for (let k = 1; k <= SH; k++) if (!fixed.includes(k)) rest.push(k);
      const r = crypto.getRandomValues(new Uint32Array(rest.length));
      for (let i = rest.length - 1; i > 0; i--) { const j = r[i] % (i + 1); [rest[i], rest[j]] = [rest[j], rest[i]]; }
      state.order = []; for (let n = 1, q = 0; n <= SH; n++) state.order.push(fixed.includes(n) ? n : rest[q++]);
      save();
    }
    const orig = Object.assign({}, V.days);
    for (let n = 1; n <= SH; n++) V.days[n] = orig[state.order[n - 1]];
    if (V.intro) V.days[1] = Object.assign({}, V.days[1], { text: [V.intro].concat(V.days[1].text) });
  }
  if (!state.letters || typeof state.letters !== 'object') {
    state.letters = {}; const op = Object.keys(state.opened || {}).map(Number).filter(n => V.letters[n]).sort((a, b) => a - b);
    op.forEach((n, i) => { state.letters[n] = i === op.length - 1 ? 0 : 1; }); save();
  }
  // 하늘을 뺀 모양(집들이 작업표시줄 위에 서 있음)인지. 눈 쌓이는 층도 같은 모양의 그림을 씀
  const CUT = !!V.strip && !!V.cutImg && state.settings.sky !== true;
  if (CUT) { V.snowImg = V.cutSnowImg; document.body.classList.add('cut'); }
  if (false) {                                                       // 탁자가 생김: 코코아·촛불·쿠키를 탁자 위로 한 번 옮겨 줌
    let i = 0; for (const k of Object.keys(state.orn)) { const d = V.days[k]; if (d && ['cocoa', 'candle', 'cookie'].includes(d.gift) && i < 3) { const g = V.groundSlots[i++]; state.orn[k] = Object.assign(state.orn[k], { x: g.x, y: g.y }); } }
  }
  if (state.ground !== 18) {
    { let ti = 0, gi = 6; for (const k of Object.keys(state.orn)) { const d = V.days[k], it = d && V.items[d.gift]; if (!it || !(it.on === 'ground' || it.on === 'table')) continue; const tbl = it.on === 'table' && ti < 6, g = V.groundSlots[tbl ? ti++ : gi++ % V.groundSlots.length]; state.orn[k] = Object.assign({ x: g.x, y: g.y }, tbl ? { s: TABLE_S } : {}); } }   // 탁자 물건은 탁자로, 큰 물건은 눈밭으로
    for (const o of Object.values(state.orn)) if (o.y > .93 && o.y < 1.0) o.y = 1.0;       // 눈밭에 놓았던 것은 새 바닥선으로
    if (state.ground) state.ground = 18;
  }
  if (false) {                                                       // 탁자 위 물건은 작게
    for (const o of Object.values(state.orn)) if (!o.s && V.groundSlots.slice(0, 5).some(g => Math.hypot(g.x - o.x, g.y - o.y) < .02)) o.s = .34;
    if (state.ground) state.ground = 3;
  }
  // 예전 저장: 트리에 달려 있던 촛불·목도리 같은 것들을 트리 곁 바닥으로 한 번 옮겨 줌
  if (!state.ground) {
    state.ground = 18;
    for (const k of Object.keys(state.orn)) if (isGnd(V.items[V.days[k].gift]) && state.orn[k].y < .84) {
      const used = Object.values(state.orn), s = V.groundSlots.find(g => !used.some(o => Math.hypot(o.x - g.x, o.y - g.y) < .06)); if (s) state.orn[k] = { x: s.x, y: s.y };
    }
  }

  /* ───────── 날짜 ───────── */
  function realDay(now = new Date()) {
    const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
    if (y > V.season) return 25;
    if (y < V.season || m < 11) return 0;
    return Math.min(d, 25);
  }
  function unlockedDay() {
    let n = realDay();
    if (V.previewUnlock) n = Math.max(n, 1);
    n = Math.max(n, state.lastUnlocked || 0);      // 날짜를 되돌려도 다시 잠기지 않음
    if (n !== state.lastUnlocked) { state.lastUnlocked = n; save(); }
    return n;
  }
  const openedCount = () => Object.keys(state.opened).filter(k => +k <= NCELL).length;

  /* ───────── 마을 그리기 ───────── */
  const village = $('#village'), scene = $('#scene');
  const sprites = {};
  let ambient = null, lampLight = null; const lightEls = [], cellEls = [];
  function buildScene() {
    scene.textContent = '';
    for (const p of V.sprites) {
      const el = document.createElement('div');
      el.className = 'sprite'; el.dataset.id = p.id;
      if (p.shadow) el.classList.add('shadow');
      const file = CUT && p.id === 'island' ? V.cutImg : p.img;
      const img = new Image(); img.className = 'body'; img.alt = ''; img.src = A(file);
      el.appendChild(img); el.style.zIndex = p.z;
      for (const s0 of p.smokes || []) {
        const sm = document.createElement('span'); sm.className = 'smoke'; sm.innerHTML = '<i></i><i></i><i></i>';
        sm.style.cssText = `left:${s0.x * 100}%;top:${s0.y * 100}%`;
        sm.querySelectorAll('i').forEach(n => n.style.animationDelay = (-Math.random() * 7).toFixed(2) + 's');
        el.appendChild(sm);
      }
      scene.appendChild(el); sprites[p.id] = { p, el, img, mask: file.replace(/\.\w+$/, '') };
      const place = () => {
        const ratio = img.naturalWidth / img.naturalHeight || 1, w = p.w || p.h * ratio;
        el.style.cssText += `;left:${u(p.x - w / 2)};bottom:${u(p.base)};width:${u(w)};height:${u(p.h)}`;
      };
      img.complete && img.naturalWidth ? place() : img.addEventListener('load', place, { once: true });
    }
    // 밝은 그림(낮), 가로등 불빛, 칸마다의 창문 불빛. 눈 쌓이는 층(snow.js)은 창문 불빛 바로 아래에 끼워짐
    const host = sprites.island.el;
    if (V.dayImg) { ambient = new Image(); ambient.className = 'ambient'; ambient.alt = ''; ambient.src = A(CUT ? V.dayCutImg : V.dayImg); host.appendChild(ambient); }
    if (!CUT) host.dataset.hit = '';                                          // 하늘이 있는 띠는 전체가 눌리는 자리. 하늘을 뺀 모양은 집과 눈밭만 눌림
    for (let n = 1; n <= NCELL; n++) {
      const im = new Image(), c = V.cells[n - 1]; im.className = 'light'; im.alt = ''; im.src = A(`win_${String(n).padStart(2, '0')}.png`);
      im.style.cssText = `inset:auto;left:${c.lx / V.scene.w * 100}%;top:${c.ly / V.scene.h * 100}%;width:${c.lw / V.scene.w * 100}%;height:${c.lh / V.scene.h * 100}%`;
      im.style.setProperty('--d', rnd(2.2, 4.4).toFixed(2) + 's'); im.style.setProperty('--dl', (-rnd(0, 4)).toFixed(2) + 's');
      host.appendChild(im); lightEls[n] = im;
    }
    // 숫자 칸
    const mk = (n, c) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'cell' + (n === 25 ? ' star' : ''); b.dataset.hit = ''; b.dataset.n = n; b.textContent = n;
      b.style.left = u(c.x); b.style.top = u(c.y);
      b.addEventListener('click', e => { e.stopPropagation(); onCell(n); });
      scene.appendChild(b); cellEls[n] = b;
    };
    V.cells.forEach((c, i) => mk(i + 1, c)); mk(25, V.star);
    // 우체통(누르는 자리), 트리, 고양이
    const hit = document.createElement('button');
    hit.id = 'mailHit'; hit.type = 'button'; hit.dataset.hit = ''; hit.title = '우체통'; hit.setAttribute('aria-label', '우체통 — 엽서와 친구');
    hit.addEventListener('click', openMail); scene.appendChild(hit);
    { const m = V.mailbox; hit.style.cssText = `left:${u(m.x - m.w / 2 - 4)};bottom:${u(HC - m.y - 2)};width:max(26px,${u(m.w + 8)});height:max(30px,${u(m.h + 6)})`; }
    const tree = sprites.tree.el; tree.dataset.hit = '';
    tree.addEventListener('click', e => { shakeTree(e); setTimeout(() => { if (layers.every(l => l.hidden)) openTree(); }, 380); });
    buildCat();
    paintCells(); renderTree(); paintTime(); renderSnowman(); renderHunt(); renderChars();
  }
  let curS = 1;
  function fit() {
    const root = document.documentElement, sw = V.scene.w, sh = V.scene.h, narrow = innerWidth < 700;
    const tb = desk ? 0 : (narrow ? 34 : 44);                               // 미리보기에서는 가짜 작업표시줄 위에 올림
    const pref = Math.max(.3, Math.min(1, +state.settings.scale || 1));       // 마을 크기 = 화면 폭의 몇 %인지
    let s = V.strip ? Math.min(pref * innerWidth / sw, (innerHeight - tb) * V.fitH / sh) : pref * Math.min(1.6, Math.max(.3, (innerHeight - tb) * (V.fitH || .345) / sh));
    const maxW = V.strip ? innerWidth : narrow ? innerWidth - 12 : innerWidth - 70;                // 화면보다 넓어지면 폭에 맞춰 줄임
    if (sw * s > maxW) s = maxW / sw;
    root.style.setProperty('--sw', sw + 'px'); root.style.setProperty('--sh', sh + 'px');
    curS = s; root.style.setProperty('--s', s.toFixed(4));
    document.body.classList.toggle('stripfull', !!V.strip && sw * s >= innerWidth - 2);     // 띠가 화면 끝에서 끝까지 닿았는지
    root.style.setProperty('--vw', (sw * s).toFixed(1) + 'px'); root.style.setProperty('--tb', tb + 'px');
    village.dataset.align = narrow ? 'center' : state.settings.align;
    if (window.__snow && window.__snow.resize) requestAnimationFrame(window.__snow.resize);
  }
  addEventListener('resize', fit);

  /* ───────── 달력 칸 ───────── */
  function paintCells() {
    const max = unlockedDay();
    for (let n = 1; n <= 25; n++) {
      const b = cellEls[n]; if (!b) continue;
      const opened = !!state.opened[n], can = n <= max;
      b.classList.toggle('opened', opened); b.classList.toggle('locked', !can && !opened);
      b.classList.toggle('ready', can && !opened); b.classList.toggle('today', can && !opened && n === max);
      b.classList.toggle('next', n === max + 1 && !!state.opened[max]);          // 오늘 칸을 열고 나면 내일 칸이 살짝 덜컹거림
      const what = n === 25 ? '트리 꼭대기' : '창문';
      b.setAttribute('aria-label', opened ? `12월 ${n}일 ${what} — 다시 보기` : can ? `12월 ${n}일 ${what} 열기` : `12월 ${n}일 — 아직 열리지 않음`);
      b.title = opened ? `${n}일 다시 보기` : can ? `${n}일 칸 열기` : `12월 ${n}일에 열려요`;
      if (lightEls[n]) lightEls[n].classList.toggle('on', opened);
    }
    document.body.classList.toggle('finale', !!state.opened[25]);
    buildTwinkles(); buildTrain(); renderDecos(); window.__adventOpened = openedCount();
    if (!window.__preDone && window.__preloadPlays) { window.__preDone = 1; setTimeout(() => window.__preloadPlays(), 2500); }
  }
  // 창문을 열 때마다 마을에 장식이 하나씩 늘어나요
  let newDeco = null; const decoEls = {};
  function renderDecos() {
    for (let n = 1; n <= NCELL; n++) {
      const d = V.days[n], D = d && V.decos && V.decos[d.play]; if (!D) continue;
      if (!state.opened[n]) { if (decoEls[n]) { decoEls[n].remove(); delete decoEls[n]; } continue; }
      if (decoEls[n]) continue;
      const im = new Image(); im.className = 'vdeco' + (D.sky ? ' sky' : ''); im.alt = ''; im.src = A(D.img); im.draggable = false;
      im.style.height = u(D.h); im.style.bottom = u(HC - D.y); im.style.left = u(D.x);
      im.style.zIndex = D.sky ? 2 : 300 + Math.round(D.y); if (D.rot) im.style.setProperty('--r', D.rot + 'deg');
      if (newDeco === n) { im.classList.add('pop'); newDeco = null; }
      scene.appendChild(im); decoEls[n] = im;
    }
  }
  function onCell(n) {
    const c0 = n === 25 ? V.star : V.cells[n - 1];                                // 말풍선은 누른 칸 바로 위에
    if (n === unlockedDay() + 1 && state.opened[n - 1]) return say(c0.x, c0.y - 30, '내일 열리는 창문이에요. 안에서 달그락 소리가 나요.');
    if (n > unlockedDay()) return state.settings.nums === 'all' ? say(c0.x, c0.y - 30, `12월 ${n}일에 열려요.`) : undefined;
    if (state.opened[n]) return showGift(n, false);
    state.opened[n] = true; newDeco = n;
    if (V.letters && V.letters[n] && !(n in state.letters)) state.letters[n] = 0;   // 이야기 편지가 우체통에 옴
    if (n <= NCELL && !V.days[n].place) state.orn[n] = freeSlot(n);
    save();
    const c = n === 25 ? V.star : V.cells[n - 1];
    paintCells(); renderTree(n); burst(c.x, c.y);
    const L = lightEls[n]; if (L) { L.classList.add('pop'); setTimeout(() => L.classList.remove('pop'), 1700); }
    placeCat(); paintTime(); paintMail();
    setTimeout(() => showGift(n, true), 180);
  }
  function burst(x, y) {
    for (let i = 0; i < 9; i++) {
      const sp = document.createElement('i'); sp.className = 'spark'; const a = rnd(0, 6.28), d = rnd(14, 34);
      sp.style.left = u(x); sp.style.top = u(y); sp.style.setProperty('--dx', (Math.cos(a) * d).toFixed(1)); sp.style.setProperty('--dy', (Math.sin(a) * d - 8).toFixed(1));
      sp.style.animationDelay = rnd(0, .18).toFixed(2) + 's'; scene.appendChild(sp); setTimeout(() => sp.remove(), 1500);
    }
  }
  // 25일을 열면 마을 곳곳이 반짝임
  let twinkled = false;
  function buildTwinkles() {
    const want = !!state.opened[25]; if (want === twinkled) return; twinkled = want;
    scene.querySelectorAll('.twinkle').forEach(n => n.remove());
    if (!want) return;
    for (let i = 0; i < 26; i++) {
      const t = document.createElement('i'); t.className = 'twinkle';
      t.style.left = u(rnd(.04, .96) * V.scene.w); t.style.top = u(rnd(.08, .8) * V.scene.h); t.style.animationDelay = (-rnd(0, 4)).toFixed(2) + 's'; t.style.animationDuration = rnd(2.4, 4.6).toFixed(2) + 's';
      scene.appendChild(t);
    }
  }

  /* ───────── 시간대: 낮엔 밝고, 저녁·밤엔 어둑해지며 연 창문만 환하게 ───────── */
  let timePreview = '';
  function tod() {
    if (timePreview) return timePreview;
    const h = new Date().getHours();
    return h >= 8 && h < 16 ? 'day' : (h >= 16 && h < 19) || (h >= 6 && h < 8) ? 'eve' : 'night';
  }
  function paintTime() {
    const t = tod(), amb = { day: .82, eve: .55, night: .36 }[t] + (state.opened[25] ? .08 : 0);
    if (ambient) ambient.style.opacity = V.strip ? { day: 1, eve: .42, night: 0 }[t] : amb.toFixed(2);     // 띠: 낮엔 낮 그림, 저녁엔 반쯤, 밤엔 밤 그림
    if (lampLight) lampLight.style.opacity = t === 'day' ? .3 : 1;
    window.__amb = amb;                                  // 눈 쌓인 층의 밝기를 맞추는 데 씀(snow.js)
    for (const k of ['day', 'eve', 'night']) document.body.classList.toggle('tod-' + k, k === t);
  }
  function applyFx() {
    const on = state.settings.fx !== false;
    document.body.classList.toggle('fx-smoke', on); document.body.classList.toggle('fx-sway', on);
    document.body.classList.toggle('nums-all', state.settings.nums === 'all');
    document.body.classList.toggle('noframe', state.settings.frame === false);    // 마을 뒤에 자기 배경(하늘·눈밭)이 있는 판을 깔지      // 숫자를 전부 보일지, 열 수 있는 칸만 보일지
  }

  /* ───────── 말풍선·알림 ───────── */
  let toastT;
  function closeBtn(fn) {
    const x = document.createElement('button'); x.type = 'button'; x.className = 'bx'; x.textContent = '×'; x.setAttribute('aria-label', '닫기'); x.title = '닫기';
    x.addEventListener('click', e => { e.stopPropagation(); fn(); }); return x;
  }
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('on'); t.dataset.hit = '';
    t.appendChild(closeBtn(() => { clearTimeout(toastT); t.classList.remove('on'); }));
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 5200);
  }
  function say(x, y, text) {
    scene.querySelectorAll('.bubble').forEach(b => b.remove());
    const b = document.createElement('div'); b.className = 'bubble'; b.dataset.hit = '';
    const p = document.createElement('p'); p.textContent = text; b.appendChild(p);
    b.style.left = u(Math.max(70, Math.min(V.scene.w - 70, x))); b.style.bottom = u(HC - y);
    b.appendChild(closeBtn(() => b.remove()));
    scene.appendChild(b); setTimeout(() => b.remove(), 5200);
  }

  /* ───────── 겹쳐 뜨는 화면 열고 닫기 ───────── */
  const layers = [...document.querySelectorAll('.layer')];
  let lastFocus = null;
  function open(layer, focusSel) {
    if (layers.every(l => l.hidden)) lastFocus = document.activeElement;
    layers.forEach(l => l.hidden = l !== layer); layer._openedAt = performance.now();
    clearTimeout(toastT); $('#toast').classList.remove('on');          // 알림이 버튼을 가리지 않게
    desk && desk.setIgnore(false);
    const f = layer.querySelector(focusSel || 'button'); f && f.focus({ preventScroll: true });
  }
  function closeAll() {
    layers.forEach(l => l.hidden = true); settlePending();
    if (curPlay) { curPlay.inst.stop(); curPlay = null; $('#playBoard').textContent = ''; }
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
    refreshIgnore();
  }
  layers.forEach(l => l.addEventListener('pointerdown', e => { if (e.target === l && performance.now() - (l._openedAt || 0) > 700) closeAll(); }));   // 막 열린 창은 겹쳐 누른 클릭으로 닫히지 않음
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeAll));
  addEventListener('keydown', e => { if (e.key === 'Escape' && layers.some(l => !l.hidden)) closeAll(); });

  /* ───────── 오늘의 칸: 선물과 편지 ───────── */
  let curDay = 0;
  function showGift(n, isNew) {
    const d = V.days[n]; if (!d) return toast('이 칸의 선물은 아직 준비 중이에요.');
    const it = V.items[d.gift]; curDay = n;
    $('#giftDay').textContent = `12월 ${n}일`;
    const pic = $('#giftPic'); pic.src = A(it.img); pic.alt = it.name;
    pic.classList.remove('pop'); if (isNew) { void pic.offsetWidth; pic.classList.add('pop'); }
    $('#giftTitle').textContent = d.title;
    const body = $('#giftBody'); body.textContent = '';
    d.text.forEach(t => { const p = document.createElement('p'); p.textContent = t; body.appendChild(p); });
    $('#giftFrom').textContent = d.from;
    const note = state.notes[n];
    $('#giftNote').hidden = !note; $('#giftNoteText').textContent = note || '';
    $('#giftOrn').textContent = n === 25 ? '트리 꼭대기에 별이 올라갔어요.' : `오늘의 선물 · ${it.name}${isNew ? (isGnd(it) ? ' — 트리 곁에 놓였어요.' : ' — 트리에 달렸어요.') : ''}`;
    const canWrite = n === unlockedDay() && n < 25;
    $('#giftWrite').hidden = !canWrite; if (canWrite) $('#giftText').value = state.notes[n + 1] || '';
    const P = d.play && (window.__plays[d.play] || STREET_PLAYS[d.play]), bp = $('#btnGiftPlay');
    bp.hidden = !P; if (P) { bp.textContent = !state.made[n] ? P.title : P.multi ? '하나 더 만들기' : `${P.title} 다시 하기`; $('#giftOrn').textContent = `오늘의 놀잇감 · ${P.title}`; }
    $('#btnGiftTree').hidden = !!d.place; $('#btnGiftTree').classList.toggle('primary', !P);
    open($('#giftLayer'), P ? '#btnGiftPlay' : '#btnGiftTree');
  }
  function leaveNote(text, forDay) {
    const t = text.trim().slice(0, 80);
    if (t) state.notes[forDay] = t; else delete state.notes[forDay];
    save(); return t;
  }
  $('#btnGiftSend').addEventListener('click', () => {
    const t = leaveNote($('#giftText').value, curDay + 1);
    toast(t ? '남겨 뒀어요. 내일 칸을 열면 함께 나와요.' : '남긴 글을 지웠어요.');
  });
  $('#giftText').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#btnGiftSend').click(); } });
  $('#btnGiftTree').addEventListener('click', () => openTree(curDay));

  /* ───────── 오늘의 놀잇감: 손으로 해 보고, 결과가 마을에 남음 ───────── */
  let curPlay = null;
  let testMode = false;
  function openPlay(n, test) {
    testMode = !!test;
    const d = V.days[n], P = window.__plays[d.play];
    if (STREET_PLAYS[d.play]) { closeAll(); return STREET_PLAYS[d.play].start(n); }
    if (!P) return;
    const itD = V.items[d.gift] || {}, dest = d.place || P.forceLabel ? P.doneLabel : itD.on === 'table' ? '탁자에 올리기' : isGnd(itD) ? '트리 곁에 두기' : '트리에 달기';   // 끝 버튼 이름은 놓이는 곳에 맞춰 하나로
    $('#playTitle').textContent = P.title; $('#btnPlayDone').textContent = dest; $('#btnPlayDone').disabled = true;
    const board = $('#playBoard'); board.textContent = '';
    open($('#playLayer'), '#btnPlayAgain');
    const inst = P.start(board, { guide: t => { $('#playGuide').textContent = t; }, ready: on => { $('#btnPlayDone').disabled = !on; }, mine: () => Object.keys(state.made).filter(k => +k !== n && state.made[k] && state.made[k].img && V.days[k]).map(k => ({ day: +k, img: state.made[k].img, one: state.made[k].one, play: V.days[k].play, name: (V.items[V.days[k].gift] || {}).name || '' })) });
    curPlay = { n, P, inst };
  }
  $('#btnGiftPlay').addEventListener('click', () => openPlay(curDay));
  // 시험장: 25일치 놀이를 날짜와 상관없이 해 보기
  function openTest() {
    const L = $('#testList'); L.textContent = '';
    for (let n = 1; n <= 25; n++) { const d = V.days[n]; if (!d || !d.play) continue; const P = window.__plays[d.play] || STREET_PLAYS[d.play];
      const b = document.createElement('button'); b.type = 'button'; b.className = 'trow' + (state.made && state.made[n] ? ' done' : '');
      const num = document.createElement('b'); num.textContent = n; const tt = document.createElement('span'); tt.textContent = (P && P.title) || d.title;
      const sm = document.createElement('small'), ttl = tt.textContent; sm.textContent = STREET_PLAYS[d.play] ? '마을에서' : (d.title && d.title !== ttl && !ttl.includes(d.title) && !d.title.includes(ttl) ? d.title : ''); b.append(num, tt); if (sm.textContent) b.append(sm);
      b.addEventListener('click', () => { closeAll(); openPlay(n, true); }); L.append(b); }
    open($('#testLayer'));
  }
  $('#btnTestAll').addEventListener('click', openTest);
  // 언제나 놀이: 저장하는 결과 없이 그냥 즐기는 놀이
  const FREE = [['mandarin', '귤 까기', '껍질을 벗기고 한 쪽씩 먹어요'], ['stove', '드럼통 난로', '장작을 넣고 부채질해서 고구마를 구워요'], ['cake', '크리스마스 케이크', '돌림판을 돌리며 크림을 바르고 장식해요']];
  function openFree(key) {
    const P = window.__plays[key]; if (!P) return; testMode = false;
    $('#playTitle').textContent = P.title; $('#btnPlayDone').textContent = '다 했어요'; $('#btnPlayDone').disabled = true;
    const board = $('#playBoard'); board.textContent = ''; open($('#playLayer'), '#btnPlayAgain');
    const inst = P.start(board, { guide: t => { $('#playGuide').textContent = t; }, ready: on => { $('#btnPlayDone').disabled = !on; }, mine: () => [] });
    curPlay = { n: 0, P, inst, free: true };
  }
  $('#btnFree').addEventListener('click', e => { e.stopPropagation(); const L = $('#freeList'); L.textContent = '';
    FREE.forEach(([k, t, d], i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'trow'; const num = document.createElement('b'); num.textContent = i + 1; const tt = document.createElement('span'); tt.textContent = t; const sm = document.createElement('small'); sm.textContent = d; b.append(num, tt, sm);
      b.addEventListener('click', () => { closeAll(); openFree(k); }); L.append(b); });
    open($('#freeLayer')); });
  $('#playLayer [data-close]').addEventListener('click', () => { if (testMode) { testMode = false; setTimeout(openTest, 0); } });
  $('#btnPlayAgain').addEventListener('click', () => curPlay && curPlay.inst.reset());
  $('#btnPlayDone').addEventListener('click', () => {
    if (!curPlay) return; const { n, P, inst } = curPlay, r = inst.result(); if (!r) return;
    if (curPlay.free) { closeAll(); toast(P.doneMsg); return; }
    if (testMode && !$('#testSave').checked) { closeAll(); openTest(); toast(`${P.title} — 시험이라 저장하지 않았어요.`); return; }
    if (P.multi) {                                                               // 여러 개 만들 수 있는 것: 트리 화면을 열어 달 자리를 직접 정함
      let key = String(n);
      if (P === window.__plays.snowflake && r.img) { if (!Array.isArray(state.paperFlakes)) state.paperFlakes = []; state.paperFlakes.push(r.img); if (state.paperFlakes.length > 12) state.paperFlakes.shift(); window.__paperFlakes = state.paperFlakes; setTimeout(() => { window.__snow && window.__snow.paperShower && window.__snow.paperShower(4); toast('내가 오린 눈꽃이 이제 마을 하늘에서도 가끔 내려와요. 하나 더 오리면 더 자주 볼 수 있어요.'); }, 900); }
      if (!state.made[n]) state.made[n] = r;
      else { if (state.extra.length >= EXTRA_MAX) state.extra.shift(); state.extra.push({ day: n, img: r.img, x: 0, y: 0 }); key = 'x' + (state.extra.length - 1); }
      const p = posOf(key); p.x = clampX(-.5); p.y = .35;                                 // 트리 옆 허공에서 시작
      save(); closeAll(); renderTree(); return openTree(key, true);
    }
    state.made[n] = r; save(); closeAll(); renderTree(n);
    if (P === window.__plays.wax && r.img) setTimeout(() => sendSealed(r.img), 700);
    if (n === 24) setTimeout(openSanta, 1200);
    if (!V.days[n].place && posOf(String(n))) return openTree(String(n), true);   // 만든 것은 트리 화면에서 내가 원하는 자리에 직접 놓음
    if (V.days[n].place === 'pond') say((V.track.x1 + V.track.x2) / 2, V.track.y - 22, P.doneMsg); else { const o = state.orn[n], t = sprites.tree.p; say(t.x + ((o ? o.x : .5) - .5) * 53, HC - t.base - t.h * (1 - (o ? o.y : .2)) - 14, P.doneMsg); }
    if (V.days[n].place === 'pond') runTrain(r.laps || 1);
  });

  // 우체통: 언제든 내일의 나에게 한 줄
  function openNote() {
    const max = unlockedDay();
    if (max >= 25) return toast('올해 달력의 마지막 날이에요. 남길 글은 여기까지예요.');
    $('#noteText').value = state.notes[max + 1] || '';
    open($('#noteLayer'), '#noteText');
  }
  $('#btnNoteSend').addEventListener('click', () => {
    const t = leaveNote($('#noteText').value, unlockedDay() + 1);
    closeAll(); say(V.mailbox.x, V.mailbox.y - V.mailbox.h - 4, t ? '우체통에 넣었어요. 내일 칸을 열면 함께 나와요.' : '우체통을 비웠어요.');
  });

  /* ───────── 트리: 칸에서 나온 장식이 달리고, 큰 화면에서 자리를 옮길 수 있음 ───────── */
  // 큰 트리 화면 안에서 트리가 차지하는 자리(비율). 장식 위치는 트리 상자 기준(0~1, 그 밖은 트리 둘레)
  const TV = Object.assign({ tx: .3, ty: 0, tw: .4, th: .941 }, V.treeView || {});
  const TABLE_S = .4;
  const isGnd = it => it && (it.on === 'ground' || it.on === 'table');
  const onGround = n => isGnd(V.items[V.days[n].gift]);
  const onTable = n => V.items[V.days[n].gift].on === 'table';
  function freeSlot(n) { const r = freeSlot0(n), sc = V.items[V.days[n].gift].s; if (sc && !r.s) r.s = sc; return r; }
  function freeSlot0(n) {
    const used = Object.values(state.orn).concat(state.extra, state.knits || []);
    const list = onGround(n) ? V.groundSlots : V.slots;
    // 먹을 것·작은 것은 탁자부터, 큰 것은 눈밭부터
    for (let i = onGround(n) && !onTable(n) ? 6 : 0; i < list.length; i++) { const s = list[i]; if (!used.some(o => Math.hypot(o.x - s.x, o.y - s.y) < .06)) return onGround(n) && i < 6 ? { x: s.x, y: s.y, s: TABLE_S } : { x: s.x, y: s.y }; }   // 탁자·의자 위에는 작게 놓임
    return onGround(n) ? { x: +rnd(-.5, 1.5).toFixed(3), y: +rnd(.9, 1).toFixed(3) } : { x: +rnd(.3, .7).toFixed(3), y: +rnd(.3, .8).toFixed(3) };
  }
  // 트리에 놓인 것들의 목록: 날마다의 선물(열쇠 = 날짜) + 내가 더 만든 것(열쇠 = x0, x1 …)
  const EXTRA_MAX = 8;
  function ornList() {
    const L = [];
    for (const k of Object.keys(state.orn)) { const d = V.days[k], it = V.items[d.gift]; L.push({ sm: state.made[k] && state.made[k].img && it.sMade || 0, key: k, day: +k, pos: state.orn[k], img: (state.made[k] && state.made[k].img) || A(it.img), name: it.name, gnd: isGnd(it), steam: !!(d.steam && state.made[k]), lit: !!(state.made[k] && state.made[k].lit) }); }
    state.extra.forEach((x, i) => { const it = V.items[V.days[x.day].gift]; L.push({ key: 'x' + i, day: x.day, pos: x, img: x.img, name: it.name, gnd: isGnd(it), extra: true }); });
    (state.knits || []).forEach((x, i) => L.push({ key: 'k' + i, day: 0, pos: x, img: x.img, name: x.name || '내가 뜬 것', gnd: true, extra: true }));   // 뜨개질로 만든 것
    return L.sort((p, q) => p.pos.y - q.pos.y);                                  // 아래쪽에 있는 것이 앞에 보이게
  }
  const posOf = key => key[0] === 'x' ? state.extra[+key.slice(1)] : key[0] === 'k' ? (state.knits || [])[+key.slice(1)] : state.orn[key];
  // 예전에 트리 밖 허공에 놓였던 장식은 트리 안으로 들여놓음
  for (const k of Object.keys(state.orn)) { const d = V.days[k], it = d && V.items[d.gift], o = state.orn[k]; if (it && !isGnd(it) && o) { o.x = Math.max(.12, Math.min(.88, o.x)); o.y = Math.max(.08, Math.min(.95, o.y)); } }
  state.extra.forEach(o => { const d = V.days[o.day], it = d && V.items[d.gift]; if (isGnd(it)) return; o.x = Math.max(.12, Math.min(.88, o.x)); o.y = Math.max(.08, Math.min(.95, o.y)); });
  // 장식 크기 기준을 키움: 예전 최대(2.2배)가 이제 보통(1). 예전에 저장한 크기는 한 번만 같은 비율로 줄여 맞춤
  // 마을 그림을 양옆으로 넓힘(끝을 자연스럽게): 예전 자리에 있던 것들을 같은 만큼 옮김
  if ((state.offX || (state.off2 ? 120 : 0)) !== 336) { const O = 336 - (state.offX || (state.off2 ? 120 : 0)), S = state.snowman; if (S) { if (S.bx) S.bx += O; if (S.ball) S.ball.x += O; } (state.snowmen || []).forEach(m => m.bx += O); (state.chars || []).forEach(c => { if (c.x) c.x += O; }); delete state.vsnow; state.offX = 336; state.off2 = 1; }
  if (!state.sz2) { const f = (o, g) => { if (o && o.s) o.s = +(o.s / (g ? 1.6 : 2.2)).toFixed(3); }, gOf = day => { const d = V.days[day]; return isGnd(d && V.items[d.gift]); };
    Object.keys(state.orn).forEach(k => f(state.orn[k], gOf(k))); state.extra.forEach(o => f(o, gOf(o.day))); (state.knits || []).forEach(o => f(o, true)); state.sz2 = 1; }   // 바닥 물건은 1.6배만
  function renderTree(popKey) {
    const host = sprites.tree.el; host.querySelectorAll('.orn').forEach(n => n.remove());
    for (const o of ornList()) {
      const im = new Image(); im.className = 'orn' + (o.gnd ? ' gnd' : '') + (o.lit ? ' lit' : ''); im.alt = ''; im.src = o.img;
      im.style.left = o.pos.x * 100 + '%'; im.style.top = (o.gnd ? Math.min(o.pos.y, 1.02) : o.pos.y) * 100 + '%'; im.style.setProperty('--os', o.pos.s || o.sm || 1); if (o.key === String(popKey)) im.classList.add('pop'); host.appendChild(im);
      if (o.steam) { const sm = document.createElement('span'); sm.className = 'smoke orn mini'; sm.innerHTML = '<i></i><i></i>'; sm.style.left = o.pos.x * 100 + '%'; sm.style.top = (o.pos.y - .2) * 100 + '%'; sm.lastChild.style.animationDelay = '-3.5s'; host.appendChild(sm); }
    }
    if (state.opened[25]) { const im = new Image(); im.className = 'orn top' + (popKey === 25 ? ' pop' : ''); im.alt = ''; im.src = A(V.items.star.img); host.appendChild(im); }
  }
  const board = $('#treeBoard'), bx = x => (TV.tx + x * TV.tw) * 100, by = y => (TV.ty + y * TV.th) * 100;
  const clampX = x => Math.max((.03 - TV.tx) / TV.tw, Math.min((.97 - TV.tx) / TV.tw, x)), clampY = y => Math.max((.05 - TV.ty) / TV.th, Math.min((.995 - TV.ty) / TV.th, y));
  const tvSrc = () => { if (V.treeView) board.querySelector('.tbody').src = A(document.body.classList.contains('tod-day') && V.treeView.imgDay ? V.treeView.imgDay : V.treeView.img); };   // 낮에는 낮 배경, 저녁·밤에는 밤 배경
  if (V.treeView) { tvSrc(); board.style.aspectRatio = V.treeView.ratio; board.classList.add('photo'); }
  // 하나 더 만들 수 있는 놀잇감(눈꽃)이 열려 있으면 그 날짜
  const multiDay = () => +Object.keys(V.days).find(k => state.opened[k] && V.days[k].play && window.__plays[V.days[k].play] && window.__plays[V.days[k].play].multi) || 0;
  let pending = null;                                                             // 방금 만들어서 아직 자리를 안 정한 것
  function openTree(popKey, placing, finale) {
    tvSrc(); board.querySelectorAll('.fstar,.fcv,.orn.top').forEach(n => n.remove());
    board.querySelectorAll('.orn').forEach(n => n.remove()); selectOrn(null);
    const L = ornList(); pending = placing ? String(popKey) : null;
    for (const o of L) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'orn' + (o.gnd ? ' gnd' : '') + (o.lit ? ' lit' : ''); b.dataset.key = o.key; b.title = o.extra ? `${o.name} (내가 만든 것)` : `${o.day}일 · ${o.name}`; b.setAttribute('aria-label', `${b.title}. 끌어서 옮기기`);
      const im = new Image(); im.alt = ''; im.src = o.img; b.appendChild(im);
      b.style.left = bx(o.pos.x) + '%'; b.style.top = by(o.pos.y) + '%'; b.style.setProperty('--os', o.pos.s || o.sm || 1);
      if (o.key === String(popKey)) b.classList.add(placing ? 'new' : 'pop');
      board.appendChild(b);
    }
    if (state.opened[25] && !finale) { const im = new Image(); im.className = 'orn top' + (popKey === 25 ? ' pop' : ''); im.alt = '별'; im.src = A(V.items.star.img); board.appendChild(im); }
    if (finale) setTimeout(() => startFinale(), 60);
    // 탁자와 의자: 거리에서와 같은 자리에(트리 상자 기준으로 환산)
    const tp = (V.sprites.find(q => q.id === 'table') || null), tr = sprites.tree;
    if (tp && !board.querySelector('.tbl')) { const ti = sprites.table.img, w = tp.h * ti.naturalWidth / (ti.naturalHeight || 1), tw0 = tr.p.h * tr.img.naturalWidth / tr.img.naturalHeight, tl = tr.p.x - tw0 / 2, tt = HC - tr.p.base - tr.p.h;
      const im = new Image(); im.className = 'tbl'; im.alt = ''; im.src = A(tp.img); im.style.cssText = `left:${bx((tp.x - w / 2 - tl) / tw0)}%;top:${by((HC - tp.base - tp.h - tt) / tr.p.h)}%;width:${w / tw0 * TV.tw * 100}%`; board.insertBefore(im, board.querySelector('.tbody').nextSibling); }
    // 트리 가까이에 세워 둔 눈사람도 같이 보임(누르면 눈사람 꾸미기)
    board.querySelectorAll('.tsm').forEach(n => n.remove());
    { const S = state.snowman, tr0 = sprites.tree, tw1 = tr0.p.h * tr0.img.naturalWidth / (tr0.img.naturalHeight || 1), tl1 = tr0.p.x - tw1 / 2, tt1 = HC - tr0.p.base - tr0.p.h;
      const xu = S && S.hr ? (S.bx - tl1) / tw1 : 9;
      if (xu > (0 - TV.tx) / TV.tw - .1 && xu < (1 - TV.tx) / TV.tw + .1) {
        const gy = V.track.y, put = (el, sx, sy, w, rot, flip) => { el.className = 'tsm'; el.alt = ''; el.style.cssText = `left:${bx((sx - tl1) / tw1)}%;top:${by((sy - tt1) / tr0.p.h)}%;width:${w / tw1 * TV.tw * 100}%;transform:translate(-50%,-50%) rotate(${rot || 0}deg)${flip ? ' scaleX(-1)' : ''}`; board.appendChild(el); return el; };
        const ball = (cy, r, rot) => { const im = new Image(); im.src = A('sm_ball.png'); put(im, S.bx, cy, r * 2, rot); im.classList.add('hit'); im.addEventListener('click', () => openSnow()); };
        ball(gy - S.br * .92, S.br, 34); ball(gy - S.br * 1.78 - S.hr * .8, S.hr, 109);
        for (const it of S.items) { const k = SM_KIT[it.k]; if (!k) continue; const im = new Image(); im.src = A(k.f); put(im, S.bx + it.x * S.br, gy - it.y * S.br, k.w * S.br, k.rot, k.flip); }
      } }
    $('#treeInfo').textContent = L.length ? `받은 선물 ${L.length}개` : '';
    $('#treeHint').textContent = placing ? '방금 만든 것이 트리 옆에서 반짝이고 있어요. 달고 싶은 자리로 끌어다 놓으세요.'
      : L.length ? '끌어서 옮기고, 누른 뒤 위의 막대로 크기를 바꿀 수 있어요.' : '아직 비어 있어요. 숫자가 반짝이는 창문을 열면 하나씩 생겨요.';
    const more = $('#btnTreeMore'), md = multiDay(); more.hidden = !md; if (md) more.textContent = `${V.items[V.days[md].gift].name} 하나 더 만들기`;
    open($('#treeLayer'), placing ? '.orn.new' : 'button');
    if (finale) $('#treeHint').textContent = '마지막 날이에요! 아래의 금빛 별을 끌어서 트리 꼭대기에 올려 주세요.';
  }
  // 자리를 안 정하고 닫으면 빈 자리에 알아서 달아 줌
  function settlePending() {
    if (!pending) return; const p = posOf(pending); pending = null; if (!p) return;
    const s = freeSlot(1); p.x = s.x; p.y = s.y; save(); renderTree();
  }
  $('#btnTreeMore').addEventListener('click', () => { const md = multiDay(); if (md) { settlePending(); openPlay(md); } });
  // 장식을 누르면 고른 것으로 표시되고, 위의 막대로 크기를 바꿀 수 있음
  let selEl = null;
  function selectOrn(b) {
    if (selEl) selEl.classList.remove('sel'); selEl = b; $('#sizeRow').hidden = !b;
    if (b) { b.classList.add('sel'); $('#sizeRange').value = (posOf(b.dataset.key) || {}).s || 1; }
  }
  $('#sizeRange').addEventListener('input', e => { if (!selEl) return; const p = posOf(selEl.dataset.key); if (!p) return; p.s = +e.target.value; selEl.style.setProperty('--os', p.s); });
  $('#sizeRange').addEventListener('change', () => { save(); renderTree(); });
  let grab = null;
  board.addEventListener('pointerdown', e => {
    const b = e.target.closest('button.orn'); if (!b) return selectOrn(null);
    selectOrn(b);
    e.preventDefault(); b.setPointerCapture(e.pointerId); b.classList.add('held'); b.classList.remove('pop', 'new'); grab = b;
    if (b.dataset.key === pending) { pending = null; $('#treeHint').textContent = '끌어서 옮길 수 있어요. 트리에 달아도 되고, 트리 둘레 바닥에 놓아도 돼요.'; }
  });
  board.addEventListener('pointermove', e => {
    if (!grab) return; const r = board.getBoundingClientRect(), p = posOf(grab.dataset.key);
    const x = clampX(((e.clientX - r.left) / r.width - TV.tx) / TV.tw), y = clampY(((e.clientY - r.top) / r.height - TV.ty) / TV.th);
    grab.style.left = bx(x) + '%'; grab.style.top = by(y) + '%'; p.x = +x.toFixed(3); p.y = +y.toFixed(3);
  });
  const landGround = p => {                                                       // 탁자 근처면 탁자(또는 긴 의자) 위, 아니면 눈밭
    const T = V.groundSlots.slice(0, 6), top = T.slice(0, 4), bench = T.slice(4), xs = T.map(q => q.x), x0 = Math.min(...xs) - .1, x1 = Math.max(...xs) + .1;
    const nearest = L => L.reduce((a, q) => Math.abs(q.x - p.x) < Math.abs(a.x - p.x) ? q : a, L[0]);
    const by2 = bench[0].y;
    if (p.x >= x0 && p.x <= x1 && p.y < by2 + .05) { p.y = (p.y > by2 - .03 ? nearest(bench) : nearest(top)).y; if (!p.s) p.s = TABLE_S; }
    else p.y = Math.max(1, Math.min(clampY(9), p.y));   // 눈밭: 앞쪽(아래)으로 더 내려놓을 수 있음
  };
  const drop = () => { if (!grab) return; const key = grab.dataset.key, o = ornList().find(q => q.key === key); if (o && !o.gnd) { o.pos.x = Math.max(.12, Math.min(.88, o.pos.x)); o.pos.y = Math.max(.08, Math.min(.95, o.pos.y)); }   // 트리 장식은 트리 밖 허공에 못 둠: 가장 가까운 가지로
    if (o && o.gnd) { landGround(o.pos); grab.style.left = bx(o.pos.x) + '%'; grab.style.top = by(o.pos.y) + '%'; } grab.classList.remove('held'); grab = null; save(); renderTree(); };
  board.addEventListener('pointerup', drop); board.addEventListener('pointercancel', drop);
  // 키보드로도 옮길 수 있게: 초점을 두고 화살표
  board.addEventListener('keydown', e => {
    const b = e.target.closest('button.orn'), mv = { ArrowLeft: [-.02, 0], ArrowRight: [.02, 0], ArrowUp: [0, -.02], ArrowDown: [0, .02] }[e.key]; if (!b || !mv) return;
    e.preventDefault(); const o = posOf(b.dataset.key); if (b.dataset.key === pending) pending = null; b.classList.remove('new');
    o.x = +clampX(o.x + mv[0] * 2).toFixed(3); o.y = +clampY(o.y + mv[1]).toFixed(3);
    b.style.left = bx(o.x) + '%'; b.style.top = by(o.y) + '%'; save(); renderTree();
  });
  $('#btnTree').addEventListener('click', () => openTree());
  function shakeTree(e) {
    e.stopPropagation(); const tree = sprites.tree.el;
    tree.classList.remove('shake'); void tree.offsetWidth; tree.classList.add('shake');
    for (let i = 0; i < 9; i++) { const f = document.createElement('i'); f.className = 'puff'; f.style.left = rnd(20, 80) + '%'; f.style.top = rnd(10, 60) + '%'; f.style.animationDelay = rnd(0, .25) + 's'; tree.appendChild(f); setTimeout(() => f.remove(), 1600); }
  }

  /* ───────── 태엽 기차: 감아 주면 연못 둘레를 돎 ───────── */
  let trainEl = null, trainBusy = false;
  const trainDay = +Object.keys(V.days).find(k => V.days[k].place === 'pond') || 0;
  function trainAt(th) {
    // th가 한 바퀴(2π) 도는 동안 거리를 한 번 왕복: 가운데서 출발 → 왼쪽 끝 → 오른쪽 끝 → 가운데
    const T = V.track, X2 = document.body.classList.contains('stripfull') ? Math.max(T.x2, village.clientWidth / curS - 60) : T.x2;   // 띠가 화면 끝까지면 기차도 끝까지 감
    const mid = (T.x1 + X2) / 2, half = (X2 - T.x1) / 2, x = mid - half * Math.sin(th - Math.PI / 2);
    trainEl.style.left = u(x); trainEl.style.bottom = u(HC - T.y); trainEl.style.zIndex = 600; trainEl.style.setProperty('--k', .8);
    trainEl.classList.toggle('flip', Math.cos(th - Math.PI / 2) < 0);             // 오른쪽으로 달릴 땐 뒤집어 줌
  }
  function buildTrain() {
    const want = trainDay && !!state.opened[trainDay];
    if (!want) { if (trainEl) { trainEl.remove(); trainEl = null; } return; }
    if (trainEl) return;
    trainEl = document.createElement('button'); trainEl.type = 'button'; trainEl.className = 'vtrain'; trainEl.dataset.hit = ''; trainEl.title = '기차 한 바퀴 돌리기'; trainEl.setAttribute('aria-label', '장난감 기차 한 바퀴 돌리기');
    const im = new Image(); im.alt = ''; im.src = A(V.items[V.days[trainDay].gift].img); trainEl.appendChild(im);
    trainEl.addEventListener('click', e => { e.stopPropagation(); runTrain(1); });
    scene.appendChild(trainEl); trainAt(Math.PI / 2);
  }
  function runTrain(laps) {
    if (!trainEl || trainBusy) return; trainBusy = true; trainEl.classList.add('run');
    const dur = laps * 14000, t0 = performance.now();
    const step = t => {
      if (!trainEl) { trainBusy = false; return; }
      const p = Math.min(1, (t - t0) / dur), e = p < .5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);     // 천천히 출발해서 천천히 멈춤
      trainAt(Math.PI / 2 + e * Math.PI * 2 * laps);
      if (p < 1) requestAnimationFrame(step); else { trainBusy = false; trainEl.classList.remove('run'); }
    };
    requestAnimationFrame(step);
  }

  /* ───────── 눈사람: 거리에서 눈덩이를 굴려 키우고 올려 쌓은 뒤, 큰 화면에서 재료를 붙여 꾸밈. 다 만든 눈사람은 끌어서 옮길 수 있음 ───────── */
  const SM = { base: 27.6, head: 18, gy: () => V.track.y };
  // 재료: w = 너비, x·y = 처음 붙는 자리. 단위는 몸통 반지름(1), 원점은 눈사람 발밑 가운데, y는 위쪽
  const SM_KIT = {
    carrot: { f: 'sm_carrot.png', n: '당근 코', w: .62, x: .3, y: 2.3, rot: 8 }, coal: { f: 'sm_coal.png', n: '숯', w: .2, multi: 10 },
    armL: { f: 'sm_twig1.png', n: '왼팔', w: .34, x: -1.2, y: 1.45, rot: -52 }, armR: { f: 'sm_twig2.png', n: '오른팔', w: .34, x: 1.2, y: 1.45, rot: 52, flip: 1 },
    top: { f: 'sm_tophat.png', n: '신사 모자', w: 1.3, x: 0, y: 3.36, rot: -5 }, bobble: { f: 'sm_bobble.png', n: '털모자', w: 1.08, x: 0, y: 3.42, rot: 4 },
    scarf: { f: 'sm_scarf.png', n: '목도리', w: .9, x: .12, y: 1.2 },   // 늘어진 목도리: 매듭이 목에 오게
  };
  const COAL_POS = [[-.2, 2.52], [.2, 2.52], [0, 1.4], [0, 1.0], [0, .6], [-.3, 2.1], [0, 2.02], [.3, 2.1], [-.5, 1.2], [.5, 1.2]];
  let smBox = null, smDrag = null, smTray = false;
  // 새 눈사람 시작: 다 만든 눈사람은 거리에 세워 둔 채로 남김(최대 3개)
  function newSnowman(day) {
    const S = state.snowman; if (!Array.isArray(state.snowmen)) state.snowmen = [];
    if (S && S.hr) { state.snowmen.push({ bx: S.bx, br: S.br, hr: S.hr, items: S.items }); if (state.snowmen.length > 3) state.snowmen.shift(); }
    const used = [S && S.hr ? S.bx : null].concat(state.snowmen.map(m => m.bx)).filter(x => x !== null), T = V.track;
    let x0 = T.x1 + 20; for (let k = 0; k < 12 && used.some(x => Math.abs(x - x0) < 60); k++) x0 += 70; x0 = Math.min(T.x2 - 20, x0);
    state.snowman = { day, bx: 0, br: 0, hr: 0, ball: { x: x0, r: 8, a: 0 }, items: [], fit2: 1, big: 1, sw: 1, sw2: 1, sw3: 1, wide: 1, wide2: 1 }; save(); renderSnowman();
  }

  // ── 25일: 내가 꾸민 트리 꼭대기에 별을 끌어 올리면 불빛이 위에서부터 켜지고 축하가 펼쳐짐
  function startFinale() {
    const ghost = new Image(); ghost.className = 'orn top fghost'; ghost.alt = ''; ghost.src = A(V.items.star.img); board.appendChild(ghost);
    const st = new Image(); st.className = 'fstar'; st.alt = '별'; st.src = A(V.items.star.img); board.appendChild(st);
    let drag = null;
    const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    st.addEventListener('pointerdown', e => { e.preventDefault(); st.setPointerCapture(e.pointerId); const r = board.getBoundingClientRect(), c = center(st); drag = { dx: e.clientX - c.x, dy: e.clientY - c.y, r }; st.classList.add('drag'); });
    st.addEventListener('pointermove', e => { if (!drag) return; const r = drag.r; st.style.left = ((e.clientX - drag.dx - r.left) / r.width * 100) + '%'; st.style.top = ((e.clientY - drag.dy - r.top) / r.height * 100) + '%'; st.style.bottom = 'auto'; });
    st.addEventListener('pointerup', () => { if (!drag) return; drag = null; st.classList.remove('drag'); const a = center(st), b = center(ghost), r = board.getBoundingClientRect();
      if (Math.hypot(a.x - b.x, a.y - b.y) < r.width * .09) { st.remove(); ghost.classList.remove('fghost'); ghost.classList.add('pop'); celebrate(ghost); }
      else { st.style.left = ''; st.style.top = ''; st.style.bottom = ''; $('#treeHint').textContent = '조금만 더 위로! 트리 맨 꼭대기 반짝이는 자리에 올려요.'; } });
  }
  function celebrate(starEl) {
    // 25일 마지막 장면: 방 불이 살짝 어두워지고, 별에서 빛이 번지며 꼬마전구가 위에서부터 나선을 따라 켜져요. 큰 글씨·불꽃놀이 대신 조용하고 따뜻하게.
    board.classList.add('finale'); document.querySelectorAll('.treeboard .orn.sel').forEach(e => e.classList.remove('sel'));
    setTimeout(() => window.__snow && window.__snow.paperShower && window.__snow.paperShower(Math.min(16, (state.paperFlakes || []).length * 3)), 2600);   // 그동안 오린 눈꽃이 한꺼번에 내려요
    const c = document.createElement('canvas'), r = board.getBoundingClientRect(), K = 2, W = c.width = Math.round(r.width * K), H = c.height = Math.round(r.height * K), g = c.getContext('2d'); c.className = 'fcv'; board.appendChild(c);
    const sr = starEl.getBoundingClientRect(), sx = (sr.left + sr.width / 2 - r.left) * K, sy = (sr.top + sr.height / 2 - r.top) * K, baseY = H * .9, half = W * .16;
    // 트리를 감은 전구 줄(나선). 뒤쪽은 어둡게, 앞쪽은 밝게
    const bulbs = []; const N = 150; for (let i = 0; i < N; i++) { const t = i / (N - 1), y = sy + H * .06 + (baseY - sy - H * .1) * t, ang = t * Math.PI * 2 * 5.5, w = half * (.12 + .88 * t), x = sx + Math.sin(ang) * w, front = Math.cos(ang); if (front < -.35) continue; bulbs.push({ x, y, t, front, c: i % 7 === 3 ? '#ff9f8a' : i % 7 === 5 ? '#9fd4ff' : '#ffd99a', p: Math.random() * 6 }); }
    const motes = Array.from({ length: 60 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 6 + Math.random() * 14, r: .8 + Math.random() * 1.8, p: Math.random() * 6 }));
    const bokeh = Array.from({ length: 14 }, () => ({ x: Math.random() * W, y: H * (.1 + Math.random() * .8), r: W * (.015 + Math.random() * .03), p: Math.random() * 6, c: ['255,214,150', '255,170,150', '170,210,255'][Math.floor(Math.random() * 3)] }));
    const t0 = performance.now(); let last = t0;
    // 오르골 소리로 '고요한 밤' 첫 소절 (작게)
    try { const AC = new (window.AudioContext || window.webkitAudioContext)(), F = { G4: 392, A4: 440, E4: 329.63, D5: 587.33, B4: 493.88, C5: 523.25 }, N2 = [['G4', .9], ['A4', .3], ['G4', .6], ['E4', 1.6], ['G4', .9], ['A4', .3], ['G4', .6], ['E4', 1.6], ['D5', 1.2], ['D5', .6], ['B4', 1.6], ['C5', 1.2], ['C5', .6], ['G4', 1.8]]; let tt = AC.currentTime + 1.2;
      for (const [n, d] of N2) { for (const [m, v] of [[2, .035], [4, .012], [8.4, .004]]) { const o = AC.createOscillator(), gn = AC.createGain(); o.type = 'sine'; o.frequency.value = F[n] * m; gn.gain.setValueAtTime(v, tt); gn.gain.exponentialRampToValueAtTime(.0004, tt + 1.8); o.connect(gn); gn.connect(AC.destination); o.start(tt); o.stop(tt + 1.9); } tt += d * .62; } } catch (e) { /* 소리 없음 */ }
    $('#treeHint').textContent = '별이 올라갔어요. 트리에 하나둘 불이 켜져요…';
    (function frame(now) { const T = (now - t0) / 1000, dt = Math.min(.05, (now - last) / 1000); last = now; if (!c.isConnected) return; g.clearRect(0, 0, W, H);
      // 방 불이 살짝 어두워짐 (트리 둘레는 덜 어둡게)
      const dim = Math.min(1, T / 1.6); const vg = g.createRadialGradient(sx, H * .58, W * .08, sx, H * .58, W * .62); vg.addColorStop(0, `rgba(8,12,28,${.18 * dim})`); vg.addColorStop(1, `rgba(8,12,28,${.55 * dim})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
      // 흐릿한 빛망울
      for (const b of bokeh) { const a = Math.min(1, Math.max(0, (T - 2) / 2)) * (.10 + .06 * Math.sin(T * .8 + b.p)); const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); gr.addColorStop(0, `rgba(${b.c},${a})`); gr.addColorStop(1, `rgba(${b.c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill(); }
      // 별빛: 은은한 후광과 가는 빛줄기 몇 개
      const sh = Math.min(1, T / 1.2); const halo = g.createRadialGradient(sx, sy, 2, sx, sy, W * .12); halo.addColorStop(0, `rgba(255,246,210,${.85 * sh})`); halo.addColorStop(.25, `rgba(255,226,150,${.35 * sh})`); halo.addColorStop(1, 'rgba(255,220,140,0)'); g.fillStyle = halo; g.beginPath(); g.arc(sx, sy, W * .12, 0, 7); g.fill();
      g.save(); g.translate(sx, sy); g.rotate(T * .06); for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); const len = W * (i % 2 ? .08 : .14) * sh * (.9 + .1 * Math.sin(T * 2 + i)); const gr = g.createLinearGradient(0, 0, 0, -len); gr.addColorStop(0, `rgba(255,240,190,${.5 * sh})`); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-1.5 * K, 0); g.lineTo(0, -len); g.lineTo(1.5 * K, 0); g.fill(); } g.restore();
      // 위에서부터 차례로 켜지는 전구
      for (const L of bulbs) { const on = T - (1.2 + L.t * 3.2); if (on <= 0) continue; const k = Math.min(1, on / .35), tw = .78 + .22 * Math.sin(T * 2.4 + L.p), lum = (.45 + .55 * Math.max(0, L.front)) * k * tw, rr = 9 * K * (.6 + .4 * Math.max(0, L.front));
        const gl = g.createRadialGradient(L.x, L.y, 0, L.x, L.y, rr); gl.addColorStop(0, L.c); gl.addColorStop(.25, L.c); gl.addColorStop(1, 'rgba(255,220,160,0)'); g.globalAlpha = lum * .55; g.fillStyle = gl; g.beginPath(); g.arc(L.x, L.y, rr, 0, 7); g.fill();
        g.globalAlpha = lum; g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(L.x, L.y, 1.4 * K, 0, 7); g.fill(); } g.globalAlpha = 1;
      // 공기 중에 떠다니는 작은 금빛 먼지
      if (T > 2.5) for (const p of motes) { p.y -= p.v * dt * .3; p.x += Math.sin(T * .7 + p.p) * .2; if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; } g.globalAlpha = Math.min(1, (T - 2.5) / 2) * (.25 + .25 * Math.sin(T * 3 + p.p)); g.fillStyle = '#ffe7b0'; g.beginPath(); g.arc(p.x, p.y, p.r * K * .6, 0, 7); g.fill(); } g.globalAlpha = 1;
      // 아래쪽에 손글씨로 조용히
      if (T > 5.2) { const a = Math.min(1, (T - 5.2) / 1.6); g.globalAlpha = a; g.textAlign = 'center'; g.shadowColor = 'rgba(255,214,140,.7)'; g.shadowBlur = 14 * K; g.fillStyle = '#fff6e0'; g.font = `${Math.round(W * .042)}px "Gaegu","Gowun Batang",serif`; g.fillText('메리 크리스마스', W * .22, H * .46); g.shadowBlur = 0; g.font = `${Math.round(W * .02)}px "Gowun Batang",serif`; g.fillStyle = 'rgba(255,246,224,.85)'; g.fillText('25일 동안 함께해 줘서 고마워요', W * .22, H * .46 + W * .036); g.globalAlpha = 1; }
      requestAnimationFrame(frame); })(t0);
    state.made[25] = { done: 1 }; save();
    let i = 0; const lt = setInterval(() => { i++; if (i > 24) { clearInterval(lt); return; } const L = lightEls[i]; if (L) { L.classList.add('pop'); setTimeout(() => L.classList.remove('pop'), 1700); } }, 220);   // 마을 창문 불빛도 차례로 반짝
    setTimeout(() => { if (playMusicboxSong()) $('#treeHint').textContent = '오르골에서 내가 만든 노래가 흘러나와요. 마을 모두가 귀 기울여요.'; }, 11000);
    if (state.santa) setTimeout(santaReply, 17000);
    setTimeout(() => { const w = state.made[24] && state.made[24].text; $('#treeHint').textContent = w ? `어제 단 소원 쪽지가 펼쳐졌어요: “${w}”` : '마을 창문마다 불이 켜졌어요. 메리 크리스마스!'; }, 6500);
  }
  // 실링 왁스로 봉인한 편지를 친구에게: 엽서 앞면에 붙여서 보내요
  function sendSealed(img) {
    if (!(state.friends || []).length) { toast('봉인한 편지는 친구에게 보낼 수 있어요. 우체통 → 친구 탭에서 친구를 추가하면 엽서 앞면으로 골라 보낼 수 있어요.'); return; }
    PW.bg = img; openWrite(); toast('봉인한 편지를 엽서 앞면에 붙였어요. 뒷면에 한마디 적어 친구에게 보내요.');
  }
  // 24일 밤: 내가 구운 쿠키를 산타 할아버지께 (25일 아침에 답장이 와요)
  const santaCv = $('#santaCv'), sg = santaCv.getContext('2d'), plateI = new Image(), stockI = new Image(); plateI.src = A('ck_plate.png'); stockI.src = A('it_stocking.png');
  let SA = null;
  function openSanta() {
    const ck = Object.keys(state.made).map(k => state.made[k]).find(m => m && m.one);
    SA = { ck: ck ? ck.one : A('it_cookie.png'), mine: !!ck, on: [], milk: false, im: new Image(), t0: performance.now() }; SA.im.src = SA.ck; $('#santaNote').value = '';
    const row = $('#santaRow'); row.textContent = '';
    const bc = document.createElement('button'); bc.type = 'button'; bc.innerHTML = `<img src="${SA.ck}" alt=""> ${ck ? '내가 구운 쿠키' : '빵집 쿠키'}`; bc.addEventListener('click', addCookie); row.append(bc);
    const bm = document.createElement('button'); bm.type = 'button'; bm.innerHTML = '🥛 우유 한 잔'; bm.addEventListener('click', () => { SA.milk = true; bm.disabled = true; santaReady(); }); row.append(bm);
    $('#santaHint').textContent = ck ? '6일에 구운 쿠키를 눌러 접시에 올려요. 우유도 한 잔 따라 두면 좋아요.' : '빵집 할머니가 쿠키를 나눠 주셨어요. 눌러서 접시에 올려요.';
    open($('#santaLayer'), '#santaRow button'); santaDraw();
  }
  function addCookie() { if (!SA || SA.on.length >= 5) return; const i = SA.on.length, A2 = [[-70, -8, -.3], [60, -14, .25], [-6, 16, .1], [-40, 30, -.5], [40, 26, .4]][i]; SA.on.push({ x: A2[0], y: A2[1], r: A2[2], t: performance.now() }); santaReady(); }
  function santaReady() { $('#btnSanta').disabled = !SA.on.length; }
  function santaDraw() { if (!SA || $('#santaLayer').hidden) return; requestAnimationFrame(santaDraw); const W = santaCv.width, H = santaCv.height, t = performance.now();
    const bgG = sg.createLinearGradient(0, 0, 0, H); bgG.addColorStop(0, '#1f2e3a'); bgG.addColorStop(.62, '#2b3b46'); bgG.addColorStop(.62, '#6a4a32'); bgG.addColorStop(1, '#4e3422'); sg.fillStyle = bgG; sg.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const x = (i * 97) % W, y = (i * 53) % (H * .55), a = .3 + .3 * Math.sin(t / 700 + i); sg.fillStyle = `rgba(255,240,200,${a.toFixed(2)})`; sg.fillRect(x, y, 2, 2); }   // 창밖 별
    const gl = sg.createRadialGradient(W * .78, H * .3, 10, W * .78, H * .3, 260); gl.addColorStop(0, 'rgba(255,200,120,.35)'); gl.addColorStop(1, 'rgba(255,200,120,0)'); sg.fillStyle = gl; sg.fillRect(0, 0, W, H);
    if (stockI.complete) sg.drawImage(stockI, W * .08, H * .12, 70, 70 * stockI.naturalHeight / (stockI.naturalWidth || 1));
    const px = W * .42, py = H * .73; sg.fillStyle = 'rgba(0,0,0,.3)'; sg.beginPath(); sg.ellipse(px + 6, py + 26, 190, 34, 0, 0, 7); sg.fill();
    if (plateI.complete) sg.drawImage(plateI, px - 170, py - 120, 340, 340 * 170 / 185);
    for (const c of SA.on) { const k = Math.min(1, (t - c.t) / 260), s = 92 * (1.2 - .2 * k); if (!SA.im.complete) continue; sg.save(); sg.translate(px + c.x, py + c.y - (1 - k) * 60); sg.rotate(c.r); sg.globalAlpha = k; sg.drawImage(SA.im, -s / 2, -s / 2, s, s); sg.restore(); }
    if (SA.milk) { const gx = W * .66, gy = H * .82; sg.fillStyle = 'rgba(0,0,0,.25)'; sg.beginPath(); sg.ellipse(gx + 4, gy + 4, 36, 8, 0, 0, 7); sg.fill(); sg.fillStyle = '#fbf7ee'; sg.beginPath(); sg.moveTo(gx - 30, gy - 100); sg.lineTo(gx - 26, gy); sg.lineTo(gx + 26, gy); sg.lineTo(gx + 30, gy - 100); sg.fill(); sg.strokeStyle = 'rgba(255,255,255,.9)'; sg.lineWidth = 3; sg.beginPath(); sg.moveTo(gx - 33, gy - 124); sg.lineTo(gx - 26, gy); sg.lineTo(gx + 26, gy); sg.lineTo(gx + 33, gy - 124); sg.stroke(); sg.beginPath(); sg.ellipse(gx, gy - 124, 33, 6, 0, 0, 7); sg.stroke(); sg.fillStyle = '#fff'; sg.beginPath(); sg.ellipse(gx, gy - 100, 30, 5, 0, 0, 7); sg.fill(); }
  }
  $('#btnSanta').addEventListener('click', () => { state.santa = { n: SA.on.length, milk: SA.milk, note: $('#santaNote').value.trim(), ck: SA.mine }; save(); closeAll(); toast('쿠키 접시를 트리 곁에 두었어요. 내일 아침이 기다려져요.'); });
  // 25일 아침: 산타 할아버지의 답장 (엽서처럼 뒤집어 읽어요)
  function santaReply() { const S = state.santa; if (!S) return;
    $('#letPic').src = A('star_top1.png'); $('#letFrom').textContent = '산타 할아버지'; $('#letDay').textContent = '12월 25일'; $('#letFront').src = A('pc_f5.jpg');
    const body = $('#letBody'); body.textContent = ''; const L = ['(쿠키 부스러기가 묻어 있어요)', `쿠키 ${S.n}개, 하나도 안 남기고 맛있게 먹었단다.${S.ck ? ' 직접 구운 거라 더 맛있었어.' : ''}${S.milk ? ' 우유도 고마워.' : ''}`];
    if (S.note) L.push(`“${S.note}” 쪽지도 잘 읽었단다.`); L.push('별을 찾아 준 네 덕분에 올해 크리스마스가 더 반짝여. 메리 크리스마스! — 산타'); L.forEach(t => { const p = document.createElement('p'); p.textContent = t; body.appendChild(p); });
    $('#letCount').textContent = ''; $('#letPrev').disabled = $('#letNext').disabled = true; $('#letCard').classList.remove('flip'); $('#letHint').textContent = '엽서를 눌러 뒤집어 보세요'; open($('#letterLayer'), '#letCard'); }
  // 25일 파티: 내가 오르골로 만든 노래가 흘러나와요
  function playMusicboxSong() { const k = Object.keys(state.made).find(d => V.days[d] && V.days[d].play === 'musicbox' && state.made[d] && Array.isArray(state.made[d].song) && state.made[d].song.length); if (!k) return false;
    const NOTES = [523, 587, 659, 698, 784, 880, 988, 1047], H = state.made[k].song;
    try { const AC = new (window.AudioContext || window.webkitAudioContext)(); let tt = AC.currentTime + .3; const maxC = Math.max(...H.map(h => Math.floor(h / 8))) + 1;
      for (let c = 0; c < Math.min(32, maxC); c++) { for (const h of H.filter(x => Math.floor(x / 8) === c)) { const f = NOTES[h % 8]; for (const [m, v] of [[1, .05], [2, .02], [4.2, .007]]) { const o = AC.createOscillator(), gn = AC.createGain(); o.type = 'sine'; o.frequency.value = f * m; gn.gain.setValueAtTime(v, tt); gn.gain.exponentialRampToValueAtTime(.0006, tt + 1.4); o.connect(gn); gn.connect(AC.destination); o.start(tt); o.stop(tt + 1.5); } } tt += .3; } } catch (e) { return false; }
    return true; }
  window.__dbgSanta = { open: openSanta, reply: santaReply, song: playMusicboxSong, fin: () => { const gh = document.querySelector('.fghost'); const st = document.querySelector('.fstar'); st && st.remove(); gh.classList.remove('fghost'); celebrate(gh); } };
  const STREET_PLAYS = { snowman: { title: '눈사람 만들기', start(n) { delete state.made[n]; newSnowman(n); } }, star: { title: '별 올리기', start(n) { openTree(25, false, true); } } };
  $('#btnSnow').addEventListener('click', e => {
    e.stopPropagation(); const S = state.snowman;
    if (!state.opened[3]) { toast('3일 창문을 열면 눈사람 재료가 도착해요. 그때부터 언제든 거리에서 눈사람을 만들 수 있어요.'); return; }
    if (S && S.ball) { toast('굴리던 눈덩이가 거리에 있어요. 잡고 옆으로 굴려 보세요.'); return; }
    if (!window.__snow || window.__snow.ground() < .15) { toast('바닥에 쌓인 눈이 거의 없어요. 눈이 좀 더 쌓이면 굴릴 수 있어요.'); return; }
    newSnowman(0); toast('거리에 작은 눈덩이가 생겼어요. 잡고 옆으로 굴리면 바닥 눈을 묻히며 커져요.');
  });
  // ── 눈 속 보물찾기(23일): 거리의 눈 더미를 문질러 쓸어 내면 묻혀 있던 물건이 나온다
  const HUNT = [['lost_1.png', '빨간 장갑', 1116], ['lost_3.png', '낡은 열쇠', 1646], ['lost_4.png', '은방울', 636], ['lost_5.png', '파란 털모자', 1466], ['lost_2.png', '금화', 896]];
  let huntBox = null;
  STREET_PLAYS.hunt = { title: '눈 속 보물찾기', start(n) { state.hunt = { day: n, rub: [0, 0, 0, 0, 0], got: [0, 0, 0, 0, 0] }; delete state.made[n]; save(); renderHunt(); say(300, 150, '거리에 눈 더미가 다섯 군데 생겼어요. 꾹 누르고 좌우로 문질러 쓸어 보세요.'); } };
  function renderHunt() {
    if (huntBox) huntBox.remove(); huntBox = null; const Hs = state.hunt; if (!Hs || !Array.isArray(Hs.rub) || !Array.isArray(Hs.got)) return;
    huntBox = document.createElement('div'); huntBox.className = 'hunt'; scene.appendChild(huntBox); const gy = 207;
    HUNT.forEach(([f, name, x], i) => {
      if (Hs.got[i]) return;
      const it = new Image(); it.src = A(f); it.className = 'hitem'; it.alt = name; it.draggable = false; it.style.left = u(x); it.style.top = u(gy - 2); it.style.height = u(40); it.dataset.hit = '';
      const pile = new Image(); pile.src = A('pile_1.png'); pile.className = 'hpile'; pile.alt = '눈 더미'; pile.draggable = false; pile.style.left = u(x); pile.style.top = u(gy + 2); pile.style.width = u(64); pile.dataset.hit = '';
      const paint = () => { const k = Math.max(0, 1 - Hs.rub[i] / 100), gone = k < .04; pile.style.opacity = gone ? 0 : .4 + .6 * k; pile.style.transform = `translate(-50%,-100%) scale(${.55 + .45 * k},${.3 + .7 * k})`; pile.style.pointerEvents = gone ? 'none' : 'auto'; it.classList.toggle('found', gone); };
      let lastX = null;
      pile.addEventListener('pointerdown', e => { pile.setPointerCapture(e.pointerId); lastX = e.clientX; e.preventDefault(); });
      pile.addEventListener('pointermove', e => { if (lastX === null) return; const d = Math.abs(e.clientX - lastX) / curS; lastX = e.clientX; Hs.rub[i] = Math.min(100, Hs.rub[i] + d * .5); paint(); if (Hs.rub[i] >= 100) { lastX = null; save(); say(x, gy - 34, `눈 속에서 ${name}이(가) 나왔어요! 눌러서 주워요.`); refreshIgnore(); } });
      const up = () => { if (lastX !== null) { lastX = null; save(); } }; pile.addEventListener('pointerup', up); pile.addEventListener('pointercancel', up);
      it.addEventListener('click', () => { if (Hs.rub[i] < 100) return; Hs.got[i] = 1; const left = Hs.got.filter(v => !v).length; if (!left) { state.made[Hs.day] = { done: 1 }; say(x, gy - 34, '다섯 개를 다 찾았어요! 주인들에게 돌려줬더니 무척 고마워해요.'); } else say(x, gy - 34, `${name}을(를) 주웠어요. 남은 건 ${left}개예요.`); save(); renderHunt(); });
      huntBox.append(it, pile); paint();
    });
  }
  // ── 내 캐릭터: 그림을 넣으면 배경을 지우고 마을 거리를 돌아다님(최대 3명)
  const CH_Y = 213, CH_H = 46;
  let walkers = [], walkRaf = 0;
  // 캐릭터 배경 지우기: 가장자리에서부터 비슷한 색을 따라 번지며 지우고, 남은 곳은 눌러서 더 지움
  const CE = { w: 0, h: 0, src: null, gone: null, hist: [] };
  function chrGrow(seeds, tol) {                                                 // 이웃끼리 색이 비슷하면 계속 번짐(그러데이션 배경도 따라감)
    const { w, h, src } = CE, gone = CE.gone, N = w * h, d = src, q = [], ref = [0, 0, 0];
    seeds.forEach(i => { ref[0] += d[i * 4]; ref[1] += d[i * 4 + 1]; ref[2] += d[i * 4 + 2]; }); ref.forEach((v, k) => ref[k] = v / Math.max(1, seeds.length));
    const far = (i, r) => Math.hypot(d[i * 4] - r[0], d[i * 4 + 1] - r[1], d[i * 4 + 2] - r[2]);
    const step = (a, b) => Math.hypot(d[a * 4] - d[b * 4], d[a * 4 + 1] - d[b * 4 + 1], d[a * 4 + 2] - d[b * 4 + 2]);
    for (const i of seeds) if (!gone[i] && d[i * 4 + 3] > 0 && far(i, ref) < tol * 1.1) { gone[i] = 1; q.push(i); }
    while (q.length) { const i = q.pop(), x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) if (j >= 0 && j < N && !gone[j] && (d[j * 4 + 3] < 20 || (step(i, j) < tol * .34 && far(j, ref) < tol * 1.25))) { gone[j] = 1; q.push(j); } }
  }
  function chrAuto() {
    const { w, h } = CE; CE.gone = new Uint8Array(w * h); CE.hist = [];
    let hasAlpha = 0; for (let i = 0; i < w * h; i++) if (CE.src[i * 4 + 3] < 200) { CE.gone[i] = 1; hasAlpha++; }
    if (hasAlpha < w * h * .02) { CE.gone.fill(0); const edge = []; for (let x = 0; x < w; x++) edge.push(x, (h - 1) * w + x); for (let y = 0; y < h; y++) edge.push(y * w, y * w + w - 1);
      const groups = {}; for (const i of edge) { const k = [0, 1, 2].map(c => CE.src[i * 4 + c] >> 5).join(); (groups[k] = groups[k] || []).push(i); }   // 가장자리 색을 몇 무리로 나눠 각각 번지게
      Object.values(groups).filter(g => g.length > edge.length * .03).forEach(g => chrGrow(g, +$('#chrTol').value)); }
    chrPaint();
  }
  function chrPaint() {
    const { w, h, src, gone } = CE, c = $('#chrCanvas'), g = c.getContext('2d'), D = g.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { D.data[i * 4] = src[i * 4]; D.data[i * 4 + 1] = src[i * 4 + 1]; D.data[i * 4 + 2] = src[i * 4 + 2];
      let a = gone[i] ? 0 : src[i * 4 + 3];
      if (!gone[i]) { const x = i % w; let n = 0; if (x > 0 && gone[i - 1]) n++; if (x < w - 1 && gone[i + 1]) n++; if (i >= w && gone[i - w]) n++; if (i + w < w * h && gone[i + w]) n++; if (n) a = Math.min(a, 255 - n * 45); }   // 가장자리 부드럽게
      D.data[i * 4 + 3] = a; }
    g.putImageData(D, 0, 0);
  }
  function chrOpen(url) {
    const im = new Image();
    im.onload = () => {
      const k = Math.min(1, 420 / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.max(1, Math.round(im.naturalWidth * k)), h = Math.max(1, Math.round(im.naturalHeight * k));
      const c = $('#chrCanvas'); c.width = w; c.height = h; const g = c.getContext('2d', { willReadFrequently: true }); g.clearRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h);
      Object.assign(CE, { w, h, src: g.getImageData(0, 0, w, h).data }); chrAuto(); open($('#chrLayer'), '#chrOk');
    };
    im.onerror = () => toast('그림을 열지 못했어요.'); im.src = url;
  }
  $('#chrCanvas').addEventListener('pointerdown', e => { const c = $('#chrCanvas'), r = c.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) / r.width * CE.w), y = Math.floor((e.clientY - r.top) / r.height * CE.h);
    if (x < 0 || y < 0 || x >= CE.w || y >= CE.h) return; CE.hist.push(CE.gone.slice()); if (CE.hist.length > 20) CE.hist.shift(); chrGrow([y * CE.w + x], +$('#chrTol').value); chrPaint(); });
  $('#chrUndo').addEventListener('click', () => { if (CE.hist.length) { CE.gone = CE.hist.pop(); chrPaint(); } });
  $('#chrAuto').addEventListener('click', chrAuto);
  $('#chrTol').addEventListener('change', () => { if (!CE.hist.length) chrAuto(); });
  $('#chrOk').addEventListener('click', () => {
    const { w, h, gone } = CE, c = $('#chrCanvas'); let x0 = w, y0 = h, x1 = 0, y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!gone[y * w + x] && CE.src[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0 || y1 <= y0) { toast('캐릭터가 다 지워졌어요. 되돌리기를 눌러 보세요.'); return; }
    const o = document.createElement('canvas'), kk = Math.min(1, 220 / Math.max(x1 - x0 + 1, y1 - y0 + 1)); o.width = Math.round((x1 - x0 + 1) * kk); o.height = Math.round((y1 - y0 + 1) * kk);
    o.getContext('2d').drawImage(c, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, o.width, o.height);
    const url = o.toDataURL('image/png'); if (CE.done) { const f = CE.done; CE.done = null; return f(url); }
    if (!Array.isArray(state.chars)) state.chars = []; state.chars.push({ img: url }); save(); closeAll(); renderChars(); toast('마을에 새 친구가 왔어요!');
  });
  // 캐릭터를 누르면: 인사, 하트, 빙글 돌기, 손 흔들기 중 하나. 시간대에 맞는 말도 함
  function chrPop(w, txt, n, cls) {
    for (let k = 0; k < n; k++) { const sp = document.createElement('span'); sp.className = 'chrfx ' + (cls || ''); sp.textContent = txt; sp.style.left = u(w.x + (Math.random() - .5) * 20); sp.style.top = u(CH_Y - CH_H * .7); sp.style.animationDelay = k * .14 + 's'; sp.style.setProperty('--dx', (Math.random() - .5) * 40 + 'px'); scene.appendChild(sp); setTimeout(() => sp.remove(), 2200 + k * 140); }
  }
  function chrReact(w) {
    const h = new Date().getHours(), night = h >= 22 || h < 6, D = state.lastUnlocked || 0;
    const greet = night ? ['아직 안 자?', '졸려…', '별이 예쁘다'] : h < 11 ? ['좋은 아침!', '잘 잤어?', '오늘도 힘내!'] : h < 18 ? ['안녕!', '눈이 와!', '산책 중이야'] : ['오늘 하루 수고했어', '코코아 마실래?', '불빛 예쁘다'];
    if (D && !state.opened[D]) greet.push(`오늘은 ${D}번 창문 열었어?`);
    const pick = Math.floor(Math.random() * 4); w.pause = 2; w.el.classList.remove('wave', 'spin'); void w.el.offsetWidth;
    if (pick === 0) { w.hop = 1; say(w.x, CH_Y - CH_H - 6, greet[Math.floor(Math.random() * greet.length)]); }
    else if (pick === 1) { chrPop(w, '♥', 5, 'heart'); }
    else if (pick === 2) { w.el.classList.add('spin'); chrPop(w, '✦', 3, 'star'); }
    else { w.el.classList.add('wave'); say(w.x, CH_Y - CH_H - 6, '안녕~ 👋'); }
    w.hearts = (w.hearts || 0) + 1;
  }
  function renderChars() {
    walkers.forEach(w => { w.el.remove(); w.tag && w.tag.remove(); }); walkers = [];
    (state.chars || []).forEach((ch, i) => {
      const el = new Image(); el.src = ch.img; el.className = 'walker'; el.alt = '내 캐릭터'; el.draggable = false; el.dataset.hit = '';
      el.style.height = u(CH_H); el.style.top = u(CH_Y); scene.appendChild(el);
      const w = { el, x: ch.x || (V.track.x1 - 220 + i * 260), dir: Math.random() < .5 ? -1 : 1, speed: 9 + Math.random() * 5, pause: 0, hop: 0 };
      el.addEventListener('click', () => chrReact(w));
      walkers.push(w);
    });
    (state.friends || []).forEach((f, i) => {                                     // 등록한 친구도 마을을 걸어다님(이름표 달고)
      const el = new Image(); el.src = f.img; el.className = 'walker friend'; el.alt = f.name; el.draggable = false; el.dataset.hit = '';
      el.style.height = u(CH_H * .92); el.style.top = u(CH_Y); scene.appendChild(el);
      const tag = document.createElement('span'); tag.className = 'wtag'; tag.textContent = f.name; tag.style.top = u(CH_Y - CH_H * .92 - 3); scene.appendChild(tag);
      const w = { el, tag, friend: f, x: 160 + ((i * 377 + 230) % (V.scene.w - 320)), dir: Math.random() < .5 ? -1 : 1, speed: 7 + Math.random() * 5, pause: 0, hop: 0 };
      el.addEventListener('click', () => friendTap(w));
      walkers.push(w);
    });
    if (walkers.length && !walkRaf) { let t0 = performance.now(); const step = now => {
      const dt = Math.min(.1, (now - t0) / 1000); t0 = now; if (!walkers.length) { walkRaf = 0; return; }
      const still = document.body.classList.contains('nofx');
      for (const w of walkers) {
        if (!still) {
          if (w.pause > 0) w.pause -= dt; else { w.x += w.dir * w.speed * dt; if (Math.random() < dt * .08) w.pause = 1 + Math.random() * 3; if (Math.random() < dt * .04) w.dir *= -1; }
          if (w.x < 70) { w.x = 70; w.dir = 1; } if (w.x > V.scene.w - 70) { w.x = V.scene.w - 70; w.dir = -1; }
        }
        const walking = w.pause <= 0 && !still, bob = walking ? Math.abs(Math.sin(now / 140)) * 1.6 : 0; if (w.hop > 0) w.hop = Math.max(0, w.hop - dt * 2.2);
        const lift = bob + Math.sin(w.hop * Math.PI) * 8;
        if (w.tag) w.tag.style.left = u(w.x);
        w.el.style.left = u(w.x); w.el.style.transform = `translate(-50%,calc(-100% - ${lift}px*var(--s))) scaleX(${w.dir < 0 ? -1 : 1}) rotate(${walking ? Math.sin(now / 140) * 3 : 0}deg)`;
      }
      walkRaf = requestAnimationFrame(step);
    }; walkRaf = requestAnimationFrame(step); }
    const L = $('#chrList'); if (L) { L.textContent = ''; (state.chars || []).forEach((ch, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chrthumb'; b.title = '빼기'; b.setAttribute('aria-label', `캐릭터 ${i + 1} 빼기`); const t = new Image(); t.src = ch.img; t.alt = ''; b.append(t); b.addEventListener('click', () => { state.chars.splice(i, 1); save(); renderChars(); }); L.append(b); }); }
    const add = $('#btnChrAdd'); if (add) add.disabled = (state.chars || []).length >= 3;
    refreshIgnore();
  }
  $('#btnChrAdd').addEventListener('click', () => { CE.done = null; $('#chrFile').click(); });
  $('#chrFile').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (!f || !/^image\//.test(f.type)) return;
    const rd = new FileReader(); rd.onload = () => chrOpen(rd.result); rd.readAsDataURL(f); });

  /* ───────── 우체통: 친구 코드 · 그림 엽서 ─────────
     지금은 내 컴퓨터 안에서만 움직이는 시안이에요. 서버(Supabase)를 붙이면 보내기·받기만 실제로 오가게 바뀌어요. */
  const PC_PRESETS = [
    { src: 'postcard.jpg', name: '눈 오는 마을' }, { src: 'treeview.jpg', name: '트리' }, { src: 'co_mug.jpg', name: '따뜻한 우유' },
    { src: 'cat_pet.jpg', name: '낮잠 고양이' }, { src: 'hill.jpg', name: '눈 언덕' }, { src: 'cd_lit.jpg', name: '촛불' }];
  const PC_COLORS = ['#3b2a22', '#b8262c', '#2f6b3a', '#2c5d9e', '#e8b53a', '#ffffff'];
  const FRIEND_MAX = 6, INBOX_MAX = 40;
  const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function newCode() { const r = crypto.getRandomValues(new Uint8Array(8)); let c = ''; r.forEach((v, i) => { c += CODE_ABC[v % CODE_ABC.length]; if (i === 3) c += '-'; }); return c; }
  if (!state.me || !/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(state.me.code)) {
    const sec = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
    state.me = { code: newCode(), secret: sec }; save();                         // 비밀값은 나중에 서버에서 "내 엽서는 나만 열기"에 씀
  }
  state.friends = (Array.isArray(state.friends) ? state.friends : []).filter(f => f && /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(f.code) && typeof f.name === 'string' && typeof f.img === 'string').slice(0, FRIEND_MAX);
  state.inbox = (Array.isArray(state.inbox) ? state.inbox : []).filter(m => m && typeof m.front === 'string' && typeof m.text === 'string').slice(-INBOX_MAX);
  const friendOf = code => (state.friends || []).find(f => f.code === code);
  const fromName = m => (friendOf(m.from) || {}).name || m.fromName || '모르는 친구';
  const unread = () => state.inbox.filter(m => !m.read);
  const unreadLetters = () => Object.keys(state.letters || {}).filter(k => !state.letters[k]).map(Number).sort((a, b) => a - b);
  const frontSrc = m => m.front.startsWith('data:image/') ? m.front : A(m.front);

  // 새 엽서가 오면: 우체통이 반짝이고, 위에 편지지 모양 말풍선이 떠요
  let mailFx = null;
  function paintMail() {
    if (mailFx) { mailFx.remove(); mailFx = null; }
    const n = unread().length + unreadLetters().length, m = V.mailbox;
    if (n) {
      mailFx = document.createElement('div'); mailFx.className = 'mailfx';
      mailFx.style.left = u(m.x); mailFx.style.bottom = u(HC - m.y + m.h * .2);
      for (let k = 0; k < 6; k++) { const sp = document.createElement('i'); sp.className = 'spark'; sp.style.setProperty('--a', (k * 60 + 15) + 'deg'); sp.style.animationDelay = (k * .37).toFixed(2) + 's'; mailFx.appendChild(sp); }
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mailbub'; b.dataset.hit = ''; b.title = '새 편지';
      b.setAttribute('aria-label', `새 편지 ${n}장 — 눌러서 읽기`);
      b.innerHTML = '<span class="paper"><i></i><i></i><i></i><b class="seal">♥</b></span>' + (n > 1 ? `<em>${n}</em>` : '');
      b.addEventListener('click', e => { e.stopPropagation(); openMail(); });
      mailFx.appendChild(b); mailFx.style.setProperty('--h', u(m.h + 8));
      scene.appendChild(mailFx);
    }
    const c = state.inbox.length, cnt = $('#pcBoxCount'); if (cnt) cnt.textContent = c ? `받은 엽서 ${c}장${n ? ` · 새 엽서 ${n}장` : ''}` : '받은 엽서가 아직 없어요';
    refreshIgnore();
  }

  // 이야기 편지 읽기
  let letterN = 0;
  function openLetter(n) {
    const L = V.letters[n]; if (!L) return; letterN = n;
    const who = V.people[L.by] || V.people.mail;
    $('#letPic').src = A(who.img); $('#letFrom').textContent = who.name; $('#letDay').textContent = `12월 ${n}일`;
    $('#letFront').src = A(`pc_f${(n - 1) % 6 + 1}.jpg`); $('#letCard').classList.remove('flip'); $('#letHint').textContent = '엽서를 눌러 뒤집어 보세요';
    const body = $('#letBody'); body.textContent = '';
    L.text.forEach(t => { const p = document.createElement('p'); p.textContent = t; body.appendChild(p); });
    const got = Object.keys(state.letters).map(Number).sort((a, b) => a - b), i = got.indexOf(n);
    $('#letPrev').disabled = i <= 0; $('#letNext').disabled = i < 0 || i >= got.length - 1;
    $('#letCount').textContent = `${i + 1} / ${got.length}`;
    if (!state.letters[n]) { state.letters[n] = 1; save(); paintMail(); }
    open($('#letterLayer'), '#letNext');
  }
  const letStep = d => { const got = Object.keys(state.letters).map(Number).sort((a, b) => a - b), i = got.indexOf(letterN) + d; if (got[i]) openLetter(got[i]); };
  const letFlip = () => { const c = $('#letCard'); c.classList.toggle('flip'); $('#letHint').textContent = c.classList.contains('flip') ? '다시 누르면 그림 쪽이 보여요' : '엽서를 눌러 뒤집어 보세요'; };
  $('#letCard').addEventListener('click', letFlip); $('#letCard').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); letFlip(); } });
  $('#letPrev').addEventListener('click', () => letStep(-1));
  $('#btnLetters').addEventListener('click', () => { const got = Object.keys(state.letters).map(Number).sort((a, b) => a - b); if (!got.length) return toast('아직 받은 편지가 없어요. 창문을 열면 편지가 와요.'); openLetter(unreadLetters()[0] || got[got.length - 1]); });
  $('#letNext').addEventListener('click', () => letStep(1));
  function openMail() {
    if (unreadLetters().length) return openLetter(unreadLetters()[0]);
    if (unread().length) return openRecv(unread()[0], true);
    mbTab('post'); open($('#mailLayer'), '#btnPcWrite');
  }
  function mbTab(t) {
    document.querySelectorAll('#mailLayer .mbtabs button').forEach(b => { b.classList.toggle('on', b.dataset.tab === t); b.setAttribute('aria-selected', b.dataset.tab === t); });
    document.querySelectorAll('#mailLayer .mbpane').forEach(p => p.hidden = p.dataset.pane !== t);
    if (t === 'friends') paintFriends();
  }
  document.querySelectorAll('#mailLayer .mbtabs button').forEach(b => b.addEventListener('click', () => mbTab(b.dataset.tab)));
  $('#btnNoteOpen').addEventListener('click', openNote);
  $('#btnPcWrite').addEventListener('click', () => openWrite());
  $('#btnPcBox').addEventListener('click', openBox);

  // ── 친구: 코드 주고받기 → 내가 별명과 캐릭터를 정해서 등록
  const fNew = { img: null };
  function paintFriends() {
    $('#myCode').textContent = state.me.code;
    const L = $('#friendList'); L.textContent = '';
    if (!state.friends.length) { const p = document.createElement('p'); p.className = 'fempty'; p.textContent = '아직 등록한 친구가 없어요.'; L.append(p); }
    state.friends.forEach((f, i) => {
      const row = document.createElement('div'); row.className = 'frow';
      const im = new Image(); im.src = f.img; im.alt = '';
      const nm = document.createElement('b'); nm.textContent = f.name;
      const cd = document.createElement('small'); cd.textContent = f.code;
      const wr = document.createElement('button'); wr.type = 'button'; wr.textContent = '엽서'; wr.addEventListener('click', () => openWrite(f.code));
      const rm = document.createElement('button'); rm.type = 'button'; rm.className = 'rm'; rm.textContent = '×'; rm.title = '친구 빼기'; rm.setAttribute('aria-label', `${f.name} 빼기`);
      rm.addEventListener('click', () => { state.friends.splice(i, 1); save(); paintFriends(); renderChars(); });
      const tx = document.createElement('span'); tx.append(nm, cd);
      row.append(im, tx, wr, rm); L.append(row);
    });
    $('#friendAdd').hidden = state.friends.length >= FRIEND_MAX;
    const P = $('#fChrPick'); P.textContent = '';
    const opts = [A('snowman.png'), A('catc_1.png')].concat((state.chars || []).map(c => c.img)); if (fNew.img && !opts.includes(fNew.img)) opts.push(fNew.img);
    if (!fNew.img) fNew.img = opts[0];
    opts.forEach(src => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chrthumb' + (src === fNew.img ? ' on' : ''); const t = new Image(); t.src = src; t.alt = ''; b.append(t);
      b.addEventListener('click', () => { fNew.img = src; paintFriends(); }); P.append(b); });
  }
  $('#fCode').addEventListener('input', e => { let v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); if (v.length > 4) v = v.slice(0, 4) + '-' + v.slice(4); e.target.value = v; $('#fErr').textContent = ''; });
  $('#btnFChrImg').addEventListener('click', () => $('#fChrFile').click());
  $('#fChrFile').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (!f || !/^image\//.test(f.type)) return;
    const rd = new FileReader(); rd.onload = () => { CE.done = url => { fNew.img = url; open($('#mailLayer')); mbTab('friends'); }; chrOpen(rd.result); }; rd.readAsDataURL(f); });
  $('#btnFAdd').addEventListener('click', () => {
    const code = $('#fCode').value.trim(), name = $('#fName').value.trim(), err = t => { $('#fErr').textContent = t; };
    if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code)) return err('친구 코드는 4자리-4자리예요. 예) SNOW-4K2P');
    if (code === state.me.code) return err('내 코드예요. 친구 코드를 넣어 주세요.');
    if (friendOf(code)) return err('이미 등록한 친구예요.');
    if (!name) return err('별명을 지어 주세요.');
    state.friends.push({ code, name, img: fNew.img || A('snowman.png') }); save();
    $('#fCode').value = ''; $('#fName').value = ''; fNew.img = null; err('');
    paintFriends(); renderChars(); $('#fErr').textContent = ''; const ok = $('#fOk'); ok.textContent = `${name}이(가) 마을에 놀러 왔어요!`; clearTimeout(ok._t); ok._t = setTimeout(() => ok.textContent = '', 4000);
  });
  $('#btnCopyCode').addEventListener('click', async () => {
    const msg = `🎄 크리스마스 마을 친구 코드: ${state.me.code}\n내 코드를 마을 우체통 → 친구 → 친구 등록에 넣어 줘!`;
    try { await navigator.clipboard.writeText(msg); toast('복사했어요. 카톡에 붙여 넣으면 돼요.'); }
    catch (e) { toast(`내 코드: ${state.me.code}`); }
  });
  // 마을을 걷는 친구를 누르면: 반가워하고, 엽서 쓰기 말풍선
  function friendTap(w) {
    w.pause = 3; w.hop = 1; chrPop(w, '♥', 3, 'heart');
    scene.querySelectorAll('.bubble').forEach(b => b.remove());
    const b = document.createElement('div'); b.className = 'bubble fbub'; b.dataset.hit = '';
    const p = document.createElement('p'); p.textContent = `${w.friend.name}`;
    const go = document.createElement('button'); go.type = 'button'; go.textContent = '✉ 엽서 쓰기'; go.addEventListener('click', e => { e.stopPropagation(); b.remove(); openWrite(w.friend.code); });
    b.append(p, go, closeBtn(() => b.remove()));
    b.style.left = u(Math.max(70, Math.min(V.scene.w - 70, w.x))); b.style.bottom = u(HC - CH_Y + CH_H + 8);
    scene.appendChild(b); setTimeout(() => b.remove(), 6000);
  }

  // ── 엽서 쓰기: 앞면(그림 고르기 + 직접 그리기) → 뒷면(타자로 쓰면 손글씨처럼)
  const PW = { to: null, bg: 'postcard.jpg', strokes: [], cur: null, color: PC_COLORS[0], size: 8, side: 'front' };
  const pcv = $('#pcwCanvas'), pcg = pcv.getContext('2d');
  const bgCache = {};
  function bgImg(src, cb) { if (bgCache[src] && bgCache[src].complete) return cb(bgCache[src]); const im = bgCache[src] || new Image(); bgCache[src] = im; im.onload = () => cb(im); if (!im.src) im.src = /^(data:|blob:|assets\/)/.test(src) ? src : A(src); }
  function drawCover(g, im, W, H) { const k = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k; g.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); }
  function pcPaint() {
    const W = pcv.width, H = pcv.height; pcg.fillStyle = '#f6eedd'; pcg.fillRect(0, 0, W, H);
    const fin = () => { pcg.lineCap = 'round'; pcg.lineJoin = 'round';
      for (const s of PW.strokes) { pcg.strokeStyle = s.c; pcg.lineWidth = s.w; pcg.beginPath(); s.p.forEach((q, i) => i ? pcg.lineTo(q[0], q[1]) : pcg.moveTo(q[0], q[1])); if (s.p.length === 1) pcg.lineTo(s.p[0][0] + .1, s.p[0][1]); pcg.stroke(); } };
    if (PW.bg) { const im = bgCache[PW.bg]; if (im && im.complete) { if (PC_PRESETS.some(p => p.src === PW.bg)) drawCover(pcg, im, W, H); else { const k = Math.min(W * .86 / im.naturalWidth, H * .86 / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k; pcg.save(); pcg.shadowColor = 'rgba(60,40,20,.3)'; pcg.shadowBlur = 14; pcg.shadowOffsetY = 6; pcg.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); pcg.restore(); } fin(); } else bgImg(PW.bg, pcPaint); } else fin();
  }
  function pcPresets() {
    const P = $('#pcwPresets'); P.textContent = '';
    const blank = document.createElement('button'); blank.type = 'button'; blank.className = 'pp blank' + (!PW.bg ? ' on' : ''); blank.innerHTML = '<span>빈 종이</span>';
    blank.addEventListener('click', () => { PW.bg = null; pcPresets(); pcPaint(); }); P.append(blank);
    const mineP = Object.keys(state.made || {}).filter(k => state.made[k] && state.made[k].img && V.days[k]).map(k => ({ src: state.made[k].img, name: '내가 만든 ' + (V.days[k].title || '것') })).slice(-6);
    mineP.concat(PC_PRESETS).forEach(p => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pp' + (PW.bg === p.src ? ' on' : ''); b.title = p.name;
      const im = new Image(); im.src = /^(data:|blob:|assets\/)/.test(p.src) ? p.src : A(p.src); im.alt = p.name; b.append(im); b.addEventListener('click', () => { PW.bg = p.src; pcPresets(); pcPaint(); }); P.append(b); });
  }
  function pcTools() {
    const C = $('#pcwColors'); C.textContent = '';
    PC_COLORS.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.className = 'sw' + (PW.color === c ? ' on' : ''); b.style.background = c; b.setAttribute('aria-label', '색 ' + c); b.addEventListener('click', () => { PW.color = c; pcTools(); }); C.append(b); });
    const S = $('#pcwSizes'); S.textContent = '';
    [4, 8, 16].forEach(z => { const b = document.createElement('button'); b.type = 'button'; b.className = 'sz' + (PW.size === z ? ' on' : ''); b.innerHTML = `<i style="width:${4 + z / 2}px;height:${4 + z / 2}px"></i>`; b.setAttribute('aria-label', '굵기 ' + z); b.addEventListener('click', () => { PW.size = z; pcTools(); }); S.append(b); });
  }
  function pcTo() {
    const L = $('#pcToList'); L.textContent = '';
    if (!state.friends.length) { const b = document.createElement('button'); b.type = 'button'; b.className = 'tochip none'; b.textContent = '먼저 친구를 등록해 주세요 →'; b.addEventListener('click', () => { open($('#mailLayer')); mbTab('friends'); }); L.append(b); }
    state.friends.forEach(f => { const b = document.createElement('button'); b.type = 'button'; b.className = 'tochip' + (PW.to === f.code ? ' on' : ''); const im = new Image(); im.src = f.img; im.alt = ''; b.append(im, f.name);
      b.addEventListener('click', () => { PW.to = f.code; pcTo(); }); L.append(b); });
    $('#pcwToName').textContent = (friendOf(PW.to) || {}).name || '친구';
  }
  function pcSide(side) {
    PW.side = side;
    document.querySelectorAll('#pcWriteLayer .pcsides button').forEach(b => b.classList.toggle('on', b.dataset.side === side));
    $('#pcwFront').hidden = side !== 'front'; $('#pcwBack').hidden = side !== 'back';
    $('#pcwFrontTools').hidden = side !== 'front'; $('#pcwBackTools').hidden = side !== 'back';
    $('#btnPcNext').hidden = side !== 'front'; $('#btnPcSend').hidden = side !== 'back';
    if (side === 'back') { $('#pcwStamp').style.backgroundImage = `url(${pcv.toDataURL('image/jpeg', .6)})`; setTimeout(() => $('#pcwText').focus(), 50); }
  }
  function openWrite(to) {
    PW.to = to || (state.friends[0] || {}).code || null; PW.strokes = []; $('#pcwText').value = ''; $('#pcwLeft').textContent = 140;
    pcTo(); pcPresets(); pcTools(); pcPaint(); pcSide('front');
    open($('#pcWriteLayer'), '#btnPcNext');
  }
  document.querySelectorAll('#pcWriteLayer .pcsides button').forEach(b => b.addEventListener('click', () => pcSide(b.dataset.side)));
  $('#btnPcNext').addEventListener('click', () => pcSide('back'));
  $('#pcwText').addEventListener('input', e => { $('#pcwLeft').textContent = 140 - e.target.value.length; });
  const pcPt = e => { const r = pcv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * pcv.width, (e.clientY - r.top) / r.height * pcv.height]; };
  pcv.addEventListener('pointerdown', e => { e.preventDefault(); pcv.setPointerCapture(e.pointerId); PW.cur = { c: PW.color, w: PW.size * 1.5, p: [pcPt(e)] }; PW.strokes.push(PW.cur); pcPaint(); });
  pcv.addEventListener('pointermove', e => { if (!PW.cur) return; const q = pcPt(e), l = PW.cur.p[PW.cur.p.length - 1]; if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 2) { PW.cur.p.push(q); pcPaint(); } });
  const pcEnd = () => { PW.cur = null; }; pcv.addEventListener('pointerup', pcEnd); pcv.addEventListener('pointercancel', pcEnd);
  $('#pcwUndo').addEventListener('click', () => { PW.strokes.pop(); pcPaint(); });
  $('#pcwClear').addEventListener('click', () => { PW.strokes = []; pcPaint(); });
  $('#btnPcSend').addEventListener('click', () => {
    const f = friendOf(PW.to); if (!f) { toast('받는 친구를 골라 주세요.'); return; }
    const text = $('#pcwText').value.trim(); if (!text) { toast('뒷면에 한마디 적어 주세요.'); $('#pcwText').focus(); return; }
    const card = $('#pcWriteLayer .pcw-card'); card.classList.add('fly');                    // 엽서가 접혀서 우체통으로 쏙
    setTimeout(() => { card.classList.remove('fly'); closeAll(); say(V.mailbox.x, V.mailbox.y - V.mailbox.h - 4, `${f.name}에게 엽서를 보냈어요. (시안이라 지금은 실제로 가지 않아요)`); }, 700);
  });

  // ── 엽서 받기: 날아와서 펼쳐지고, 누르면 뒤집혀서 글이 보임
  let recvCur = null;
  function openRecv(m, fresh) {
    recvCur = m;
    $('#pcrFront').src = frontSrc(m); $('#pcrText').textContent = m.text; $('#pcrFrom').textContent = fromName(m);
    const d = new Date(m.at || Date.now()); $('#pcrDate').textContent = `${d.getMonth() + 1}월 ${d.getDate()}일`;
    $('#pcrStamp').style.backgroundImage = `url(${frontSrc(m)})`;
    $('#pcrInner').classList.remove('flip'); $('#pcrHint').textContent = '엽서를 누르면 뒤집혀요';
    const card = $('#pcrCard'); card.classList.remove('arrive'); void card.offsetWidth; if (fresh) card.classList.add('arrive');
    $('#btnPcKeep').textContent = m.read ? '상자로 돌아가기' : '엽서 상자에 넣기';
    $('#btnPcToss').hidden = !m.read; $('#btnPcReply').hidden = !friendOf(m.from);
    open($('#pcRecvLayer'), '#btnPcKeep');
    if (fresh) { mailFx && mailFx.classList.add('go'); }
  }
  $('#pcrCard').addEventListener('click', () => { const f = $('#pcrInner').classList.toggle('flip'); $('#pcrHint').textContent = f ? '한 번 더 누르면 그림이 보여요' : '엽서를 누르면 뒤집혀요'; });
  $('#btnPcKeep').addEventListener('click', () => {
    if (!recvCur) return closeAll(); const was = recvCur.read; recvCur.read = true; save(); paintMail();
    if (was) return openBox();
    const next = unread()[0]; if (next) return openRecv(next, true);
    closeAll(); say(V.mailbox.x, V.mailbox.y - V.mailbox.h - 4, '엽서 상자에 넣었어요.');
  });
  $('#btnPcReply').addEventListener('click', () => { if (!recvCur) return; recvCur.read = true; save(); paintMail(); openWrite(recvCur.from); });
  $('#btnPcToss').addEventListener('click', () => { const i = state.inbox.indexOf(recvCur); if (i >= 0) state.inbox.splice(i, 1); save(); paintMail(); openBox(); });

  // ── 엽서 상자: 받은 엽서가 쌓여 있고, 눌러서 다시 읽기
  function openBox() {
    const G = $('#pcBoxGrid'); G.textContent = ''; const list = state.inbox.filter(m => m.read).slice().reverse();
    $('#pcBoxN').textContent = list.length ? `${list.length}장` : '';
    if (!list.length) { const p = document.createElement('p'); p.className = 'fempty'; p.textContent = '아직 받은 엽서가 없어요. 친구에게 내 코드를 보내 보세요.'; G.append(p); }
    list.forEach((m, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pcthumb'; b.style.setProperty('--r', (((i * 37) % 9) - 4) + 'deg');
      const im = new Image(); im.src = frontSrc(m); im.alt = ''; const nm = document.createElement('span'); nm.textContent = fromName(m);
      b.append(im, nm); b.addEventListener('click', () => openRecv(m, false)); G.append(b); });
    open($('#pcBoxLayer'), '#btnBoxBack');
  }
  $('#btnBoxBack').addEventListener('click', () => { mbTab('post'); open($('#mailLayer'), '#btnPcWrite'); });

  // 시험용: 친구가 보낸 엽서가 도착한 것처럼
  $('#btnFakeMail').addEventListener('click', () => {
    const f = state.friends[Math.floor(Math.random() * state.friends.length)];
    const texts = ['오늘 마을에 눈이 펑펑 왔어! 따뜻하게 입고 다녀 ☃', '코코아 한 잔 같이 마시고 싶다. 메리 크리스마스!', '오늘 내 창문에서는 낮잠 자는 고양이가 나왔어 🐈 너는 뭐 나왔어?', '올해도 고마웠어. 내년에도 잘 부탁해!'];
    state.inbox.push({ id: Date.now(), from: f ? f.code : 'SANT-A2026', fromName: f ? undefined : '산타 할아버지', front: pick(PC_PRESETS).src, text: pick(texts), at: Date.now(), read: false });
    if (state.inbox.length > INBOX_MAX) state.inbox.shift();
    save(); closeAll(); paintMail();
  });

  function renderSnowman() {
    const RX1 = (V.roll || V.track).x1, RX2 = (V.roll || V.track).x2;   // 굴릴 수 있는 범위
    if (smBox) smBox.remove(); smBox = null; const S = state.snowman; if (!S) return; if (!Array.isArray(S.items)) S.items = [];
    if (!S.big) { S.big = 1; S.br *= 1.2; S.hr *= 1.2; }
    if (!S.sw) { S.sw = 1; S.sw2 = 1; if (S.br) S.bx = 482; }
    if (!S.sw2) { S.sw2 = 1; if (S.br && Math.abs(S.bx - 468) < 20) S.bx = 482; }   // 눈사람은 트리 왼쪽, 탁자는 오른쪽으로 자리 바꿈   // 눈사람 1.2배
    if (!S.wide) { S.wide = 1; S.wide2 = 1; if (S.sw3) { if (S.br) S.bx += 482.67; if (S.ball) S.ball.x += 482.67; } }
    if (!S.wide2) { S.wide2 = 1; if (S.br) S.bx += 83.34; if (S.ball) S.ball.x += 83.34; }   // 양 끝이 늘어난 새 마을 그림: 예전 자리를 그만큼 옮김
    if (!S.sw3) { S.sw3 = 1; if (S.br) S.bx = 990; if (S.ball) S.ball.x = Math.max(RX1, Math.min(RX2, S.ball.x)); }   // 광장 단 위로 올라감
    if (!S.fit2) { S.fit2 = 1; for (const it of S.items) if (['scarf', 'bobble', 'top'].includes(it.k)) { it.x = SM_KIT[it.k].x; it.y = SM_KIT[it.k].y; } S.items.sort((p, q) => (q.k === 'scarf') - (p.k === 'scarf')); }   // 예전에 붙인 모자·목도리를 새 크기에 맞는 자리로
    smBox = document.createElement('div'); smBox.className = 'snowman'; scene.appendChild(smBox);
    (state.snowmen || []).forEach(M => {                                         // 전에 만들어 세워 둔 눈사람들
      const g = SM.gy(), mk = (cy, r, a) => { const d = document.createElement('div'); d.className = 'sball done old'; d.innerHTML = '<i></i>'; d.firstChild.style.transform = `rotate(${a}rad)`; d.style.left = u(M.bx - r); d.style.top = u(cy - r); d.style.width = d.style.height = u(r * 2); smBox.appendChild(d); };
      mk(g - M.br * .92, M.br, .6); mk(g - M.br * 1.78 - M.hr * .8, M.hr, 1.9);
      for (const it of M.items || []) { const k = SM_KIT[it.k]; if (!k) continue; const im = new Image(); im.className = 'spart'; im.alt = ''; im.src = A(k.f); im.style.transform = `translate(-50%,-50%) rotate(${k.rot || 0}deg)${k.flip ? ' scaleX(-1)' : ''}`; im.style.left = u(M.bx + it.x * M.br); im.style.top = u(g - it.y * M.br); im.style.width = u(k.w * M.br); smBox.appendChild(im); }
    });
    const gy = SM.gy(), put = (el, x, y, w, h) => { el.style.left = u(x - w / 2); el.style.top = u(y - h / 2); el.style.width = u(w); if (h) el.style.height = u(h); smBox.appendChild(el); return el; };
    const ball = (x, cy, r, a, cls) => { const b = document.createElement('div'); b.className = 'sball ' + cls; b.innerHTML = '<i></i>'; b.firstChild.style.transform = `rotate(${a}rad)`; return put(b, x, cy, r * 2, r * 2); };
    if (S.br) {
      const body = ball(S.bx, gy - S.br * .92, S.br, .6, 'done'); body.dataset.hit = '';
      if (S.hr) {
        const head = ball(S.bx, gy - S.br * 1.78 - S.hr * .8, S.hr, 1.9, 'done'); head.dataset.hit = '';
        for (const it of S.items) { const k = SM_KIT[it.k]; if (!k) continue; const im = new Image(); im.className = 'spart'; im.alt = ''; im.src = A(k.f);
          im.style.transform = `translate(-50%,-50%) rotate(${k.rot || 0}deg)${k.flip ? ' scaleX(-1)' : ''}`; im.style.left = u(S.bx + it.x * S.br); im.style.top = u(gy - it.y * S.br); im.style.width = u(k.w * S.br); smBox.appendChild(im); }
        // 누르면 크게 보며 꾸미기, 끌면 자리 옮기기
        let sx = null, dx = 0;
        const down = e => { e.preventDefault(); e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); sx = e.clientX; dx = 0; document.body.classList.add('rolling'); };
        const move = e => { if (sx === null) return; dx = Math.max(RX1 - S.bx, Math.min(RX2 - S.bx, (e.clientX - sx) / curS)); smBox.style.transform = `translateX(${u(dx)})`; };
        const upS = () => { if (sx === null) return; sx = null; document.body.classList.remove('rolling'); if (Math.abs(dx) < 2) { smBox.style.transform = ''; openSnow(); } else { S.bx += dx; save(); renderSnowman(); } refreshIgnore(); };
        for (const el of [body, head]) { el.title = '누르면 꾸미기 · 끌면 옮기기'; el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', upS); el.addEventListener('pointercancel', upS); }
      }
    }
    if (S.ball) {                                                                 // 굴리는 중인 눈덩이
      const b = ball(S.ball.x, gy - S.ball.r * .92, S.ball.r, S.ball.a, 'roll'); b.dataset.hit = ''; b.title = '잡고 옆으로 굴리기'; b.tabIndex = 0; b.setAttribute('role', 'button'); b.setAttribute('aria-label', '눈덩이. 잡고 옆으로 굴리기');
      const hint = document.createElement('div'); hint.className = 'smhint'; smBox.appendChild(hint); let hintT = 0;      // 안내: 눈덩이 위에 계속 떠 있음
      const paintHint = () => {
        const need = S.br ? SM.head * .7 : SM.base * .72, pct = Math.min(100, Math.round(S.ball.r / need * 100));
        hint.textContent = S.ball.bare && pct < 100 ? '여기는 눈이 없어요. 눈 덮인 곳으로 굴려요' : !S.br ? (pct < 100 ? `◀ 잡고 옆으로 끌어서 굴려요 ▶  ${pct}%` : '다 컸어요! 손을 떼면 몸통이 돼요')
          : (pct < 100 ? `◀ 머리가 될 눈덩이예요. 굴려서 키워요 ▶  ${pct}%` : '이제 몸통 위로 가져가요');
        hint.style.left = u(Math.max(120, Math.min(V.scene.w - 120, S.ball.x))); hint.style.top = u(gy - S.ball.r * 2 - 5);
        hint.classList.add('on'); clearTimeout(hintT); hintT = setTimeout(() => { if (smDrag === null) hint.classList.remove('on'); }, 2600);   // 만질 때만 잠깐 보임
      };
      let moved = 0;
      const settle = () => {
        const B = S.ball;
        if (!S.br) { if (B.r >= SM.base * .72) { S.bx = B.x; S.br = B.r; S.ball = { x: Math.max(RX1, Math.min(RX2, B.x + (B.x > (RX1 + RX2) / 2 ? -110 : 110))), r: 7.5, a: 0 }; } }
        else if (Math.abs(B.x - S.bx) < S.br + 4 && B.r >= SM.head * .7) { S.hr = Math.min(B.r, S.br * .78); S.ball = null; if (S.day) state.made[S.day] = { done: 1 }; setTimeout(() => { if (layers.every(l => l.hidden)) openSnow(); }, 500); }
        save(); renderSnowman();
      };
      const roll = dx => {
        const max = S.br ? SM.head + 1 : SM.base; S.ball.x = Math.max(RX1, Math.min(RX2, S.ball.x + dx));
        const got = window.__snow ? window.__snow.take(S.ball.x, Math.abs(dx) * .006) : 1; S.ball.r = Math.min(max, S.ball.r + Math.abs(dx) * (S.br ? .024 : .034) * got); S.ball.bare = got < .25;   // 바닥 눈이 있는 만큼만 커지고, 굴린 자리 눈은 줄어듦 S.ball.a += dx / Math.max(4, S.ball.r); moved += Math.abs(dx);
        b.style.left = u(S.ball.x - S.ball.r); b.style.top = u(gy - S.ball.r * 1.92); b.style.width = b.style.height = u(S.ball.r * 2); b.firstChild.style.transform = `rotate(${S.ball.a}rad)`; paintHint();
        if (S.br && S.ball.r >= SM.head * .7 && Math.abs(S.ball.x - S.bx) < S.br * .7) { smDrag = null; document.body.classList.remove('rolling'); settle(); }   // 머리는 닿으면 저절로 올라감
      };
      const nudge = () => {                                                       // 끌지 않고 눌러만 봐도 조금 굴러감
        const dir = S.br ? Math.sign(S.bx - S.ball.x) || 1 : (S.ball.x < (RX1 + RX2) / 2 ? 1 : -1); let left = S.br ? Math.min(90, Math.abs(S.bx - S.ball.x)) : 90;
        const step = () => { if (!S.ball || smDrag !== null || left <= 0 || !b.isConnected) { if (b.isConnected && S.ball && smDrag === null) { save(); if (!S.br && S.ball.r >= SM.base * .72) settle(); } return; } const d = Math.min(left, 3.2); left -= d; roll(dir * d); requestAnimationFrame(step); };
        requestAnimationFrame(step);
      };
      paintHint();
      b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.setPointerCapture(e.pointerId); smDrag = e.clientX; moved = 0; document.body.classList.add('rolling'); });
      b.addEventListener('pointermove', e => { if (smDrag === null) return; const d = (e.clientX - smDrag) / curS; smDrag = e.clientX; roll(d); });
      const end = () => { if (smDrag === null) return; smDrag = null; document.body.classList.remove('rolling'); if (moved < 2) nudge(); else settle(); refreshIgnore(); };
      b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
      b.addEventListener('keydown', e => { const d = { ArrowLeft: -14, ArrowRight: 14 }[e.key]; if (d) { e.preventDefault(); roll(d); } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); settle(); } });
    }
  }
  // 눈사람을 크게 보며 꾸미는 화면
  const smBoard = $('#smBoard'), smPal = $('#smPal'), BW = 5, BH = 4.9, GY = 4.5, bpx = x => (BW / 2 + x) / BW * 100, bpy = y => (GY - y) / BH * 100;
  function paintBoard(newIdx) {
    const S = state.snowman; smBoard.textContent = ''; if (!S || !S.hr) return; const hr = S.hr / S.br;
    const bb = (cy, r, rot) => { const im = new Image(); im.className = 'bb'; im.alt = ''; im.src = A('sm_ball.png'); im.style.cssText = `left:${bpx(-r)}%;top:${bpy(cy + r)}%;width:${2 * r / BW * 100}%;height:${2 * r / BH * 100}%;transform:rotate(${rot}rad)`; smBoard.appendChild(im); };
    bb(.92, 1, .6); bb(1.78 + hr * .8, hr, 1.9);
    S.items.forEach((it, i) => { const k = SM_KIT[it.k]; if (!k) return; const b = document.createElement('button'); b.type = 'button'; b.className = 'bi' + (i === newIdx ? ' pop' : ''); b.dataset.i = i; b.title = k.n; b.setAttribute('aria-label', k.n + '. 끌어서 옮기기');
      const im = new Image(); im.alt = ''; im.src = A(k.f); im.style.transform = `rotate(${k.rot || 0}deg)${k.flip ? ' scaleX(-1)' : ''}`; b.appendChild(im); b.style.cssText = `left:${bpx(it.x)}%;top:${bpy(it.y)}%;width:${k.w / BW * 100}%`; smBoard.appendChild(b); });
    smPal.querySelectorAll('button').forEach(b => { const k = SM_KIT[b.dataset.k]; if (!k.multi) b.setAttribute('aria-pressed', String(S.items.some(it => it.k === b.dataset.k))); });
  }
  for (const key of Object.keys(SM_KIT)) {
    const k = SM_KIT[key], b = document.createElement('button'); b.type = 'button'; b.dataset.k = key; const im = new Image(); im.alt = ''; im.src = A(k.f); b.append(im, document.createTextNode(k.n));
    b.addEventListener('click', () => {
      const S = state.snowman, n = S.items.filter(it => it.k === key).length; let idx = -1;
      if (k.multi) { if (n < k.multi) { const p = COAL_POS[n % COAL_POS.length]; S.items.push({ k: key, x: p[0], y: p[1] }); idx = S.items.length - 1; } }
      else if (n) S.items = S.items.filter(it => it.k !== key);                 // 한 번 더 누르면 떼어짐
      else if (key === 'scarf') { S.items.unshift({ k: key, x: k.x, y: k.y }); idx = 0; }      // 목도리는 다른 재료 밑에 깔림
      else { S.items.push({ k: key, x: k.x, y: k.y }); idx = S.items.length - 1; }
      save(); paintBoard(idx); renderSnowman();
    });
    smPal.appendChild(b);
  }
  let smGrab = null;
  smBoard.addEventListener('pointerdown', e => { const b = e.target.closest('.bi'); if (!b) return; e.preventDefault(); b.setPointerCapture(e.pointerId); b.classList.add('held'); b.classList.remove('pop'); smGrab = b; });
  smBoard.addEventListener('pointermove', e => {
    if (!smGrab) return; const r = smBoard.getBoundingClientRect(), it = state.snowman.items[+smGrab.dataset.i];
    it.x = +((e.clientX - r.left) / r.width * BW - BW / 2).toFixed(3); it.y = +(GY - (e.clientY - r.top) / r.height * BH).toFixed(3);
    smGrab.style.left = bpx(it.x) + '%'; smGrab.style.top = bpy(it.y) + '%'; smGrab.classList.toggle('out', Math.abs(it.x) > BW / 2 - .1 || it.y < -.25 || it.y > GY + .3);
  });
  const smDrop = () => { if (!smGrab) return; const S = state.snowman, i = +smGrab.dataset.i, out = smGrab.classList.contains('out'); smGrab = null; if (out) S.items.splice(i, 1); save(); paintBoard(); renderSnowman(); };
  smBoard.addEventListener('pointerup', smDrop); smBoard.addEventListener('pointercancel', smDrop);
  function openSnow() { if (!state.snowman || !state.snowman.hr) return; paintBoard(); open($('#snowLayer'), '#smPal button'); }

  /* ───────── 고양이: 날마다 다른 자리에 앉아 있음 ───────── */
  let cat = null, catSpot = null;
  function buildCat() {
    cat = document.createElement('button'); cat.type = 'button'; cat.className = 'cat'; cat.dataset.hit = ''; cat.title = '고양이 쓰다듬기'; cat.setAttribute('aria-label', '고양이 쓰다듬기');
    const sp = document.createElement('span'); sp.style.backgroundImage = `url(${A('ch_' + V.cat.sheet + '.png')})`; cat.appendChild(sp);
    cat.addEventListener('click', e => {
      e.stopPropagation(); cat.classList.remove('purr'); void cat.offsetWidth; cat.classList.add('purr');
      say(catSpot.x, catSpot.y - 30 * (catSpot.k || 1), pick(V.cat.lines));
    });
    scene.appendChild(cat); placeCat();
  }
  function placeCat() {
    if (!cat) return;
    const n = Math.max(1, unlockedDay()); catSpot = V.catSpots[(n - 1) % V.catSpots.length];
    const k = catSpot.k || 1;
    cat.style.left = u(catSpot.x); cat.style.bottom = u(HC - catSpot.y); cat.style.setProperty('--k', k); cat.style.zIndex = 100 + Math.round(catSpot.y);
    cat.firstChild.style.backgroundPosition = `${(catSpot.f || 0) / 3 * 100}% 0`;
  }

  /* ───────── 설정 ───────── */
  function seg(id, cur, on) {
    const box = $('#' + id);
    const paint = v => box.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
    box.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; paint(b.dataset.v); on(b.dataset.v); });
    paint(cur()); return () => paint(cur());
  }
  const paints = [
    (() => { const r = $('#scaleRange'), o = $('#scaleOut'), show = () => { const v = Math.round(Math.max(.3, Math.min(1, +state.settings.scale || 1)) * 100); r.value = v; o.textContent = v + '%'; };
      r.addEventListener('input', () => { state.settings.scale = +r.value / 100; o.textContent = r.value + '%'; fit(); paintRows(); }); r.addEventListener('change', () => save()); return show; })(),
    seg('segSky', () => state.settings.sky === true ? 1 : 0, v => { state.settings.sky = v === '1'; save(); location.reload(); }),
    seg('segAlign', () => state.settings.align, v => { state.settings.align = v; save(); fit(); }),
    seg('segWeather', () => state.settings.weather, v => { state.settings.weather = v; save(); }),
    seg('segFrame', () => state.settings.frame === false ? 0 : 1, v => { state.settings.frame = v === '1'; save(); applyFx(); }),
    seg('segNums', () => state.settings.nums === 'all' ? 'all' : 'today', v => { state.settings.nums = v; save(); applyFx(); }),
    seg('segFx', () => state.settings.fx === false ? 0 : 1, v => { state.settings.fx = v === '1'; save(); applyFx(); }),
    seg('segTime', () => timePreview, v => { timePreview = v; paintTime(); }),
    seg('segTop', () => state.settings.top ? 1 : 0, v => { state.settings.top = v === '1'; save(); desk && desk.setTop(state.settings.top); }),
  ];
  const paintNow = () => { $('#nowDay').textContent = `지금 12월 ${unlockedDay()}일`; $('#btnNextDay').disabled = unlockedDay() >= 25; };
  $('#rowNext').hidden = !V.previewUnlock;
  const paintRows = () => { $('#rowSky').hidden = !V.strip; $('#rowFull').hidden = true; $('#rowAlign').hidden = document.body.classList.contains('stripfull'); };
  paintRows();
  if (V.strip) { document.body.classList.add('strip'); $('#segFrame').closest('.row').hidden = true; }
  $('#btnSet').addEventListener('click', () => { $('#resetConfirm').hidden = true; paints.forEach(p => p()); paintNow(); open($('#setLayer')); });
  $('#btnNextDay').addEventListener('click', () => {
    const n = Math.min(25, unlockedDay() + 1); state.lastUnlocked = n; save();
    paintCells(); placeCat(); closeAll(); const c = n === 25 ? V.star : V.cells[n - 1];
    say(c.x, c.y - 30, n === 25 ? '12월 25일이에요. 여기를 눌러 보세요.' : `12월 ${n}일이 됐어요. 오늘은 이 창문이에요.`);
  });
  $('#btnReset').addEventListener('click', () => { $('#resetConfirm').hidden = false; });
  $('#btnResetNo').addEventListener('click', () => { $('#resetConfirm').hidden = true; });
  $('#btnResetYes').addEventListener('click', () => {
    const keep = state.settings; const me = state.me, fr = state.friends, ib = state.inbox, od = state.order; state = fresh(); Object.assign(state, { me, friends: fr, inbox: ib, order: od }); state.settings = Object.assign(keep, { weather: 'snow' });
    if (window.__snow) window.__snow.init(); save();
    trainBusy = false; paintCells(); renderTree(); placeCat(); paintTime(); renderSnowman(); closeAll(); toast('처음 상태로 돌아왔어요.');
  });
  $('#btnQuit').addEventListener('click', () => desk && desk.quit());

  /* ───────── 설치형: 빈 곳은 클릭이 바탕화면으로 통과 ───────── */
  function solidAt(x, y) {
    if (document.body.classList.contains('sweeping') || document.body.classList.contains('rolling')) return true;
    const openL = layers.filter(l => !l.hidden);
    // 창이 열려 있어도 창 바깥(빈 곳)은 클릭이 뒤의 다른 프로그램으로 통과해요. 그래서 다른 창을 눌러도 열려 있던 창이 닫히지 않아요.
    if (openL.length) { for (const el of document.elementsFromPoint(x, y)) { if (el.closest('.layer .panel-wrap, .layer.dim, #toast')) return true; } }
    for (const el of document.elementsFromPoint(x, y)) {
      if (openL.length && el.closest('.layer')) continue;
      if (el.closest('[data-hit]')) return true;
      const sp = el.closest('.sprite'); if (!sp) continue;
      const m = MASK[(sprites[sp.dataset.id] || {}).mask];
      if (!m) return true;
      const r = sp.getBoundingClientRect();
      const mx = Math.floor((x - r.left) / r.width * m.w), my = Math.floor((y - r.top) / r.height * m.h);
      if (mx >= 0 && my >= 0 && mx < m.w && my < m.h && m.d[my * m.w + mx] === '1') return true;
    }
    return false;
  }
  let lastPt = null, ignoring = null;
  function refreshIgnore() {
    if (!desk) return;
    const ig = lastPt ? !solidAt(lastPt.x, lastPt.y) : true;
    if (ig !== ignoring) { ignoring = ig; desk.setIgnore(ig); }
  }
  if (desk) {
    addEventListener('mousemove', e => { lastPt = { x: e.clientX, y: e.clientY }; refreshIgnore(); }, { passive: true });
    document.addEventListener('mouseleave', () => { lastPt = null; refreshIgnore(); });
    desk.setTop(!!state.settings.top);
  }

  // 자정이 지나면 새 숫자가 반짝이고, 시간대에 따라 밝기가 바뀜
  let lastMax = unlockedDay();
  setInterval(() => {
    paintTime(); const max = unlockedDay();
    if (max !== lastMax) { lastMax = max; if (layers.every(l => l.hidden)) { paintCells(); placeCat(); } }
  }, 60 * 1000);

  fit(); buildScene(); applyFx(); paintMail();
  // snow.js(눈·빗자루)와 점검 도구가 쓰는 연결 통로
  window.__village = { state: () => state, save, toast, refreshIgnore: () => refreshIgnore(), solidAt, onCell, openTree, openPlay, runTrain, unlockedDay,
                       openLayer: open, renderTree: () => renderTree(), setDay: n => { state.lastUnlocked = n; save(); paintCells(); placeCat(); }, setTime: v => { timePreview = v; paintTime(); } };
})();
