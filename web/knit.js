// 뜨개질: 하루 한 번이 아니라 언제든 열어서 이어 뜨는 놀이.
// 실 색을 고르고, 바늘 아래 줄을 따라 좌우로 쓸면 한 코씩 떠진다. 색은 뜨는 도중에 언제든 바꿀 수 있다.
(() => {
  const A = f => 'assets/' + f, $ = s => document.querySelector(s), VG = () => window.__village;
  const YARN = [
    { k: 'red', n: '빨강', c: [202, 58, 48] }, { k: 'cream', n: '크림', c: [236, 208, 170] }, { k: 'green', n: '초록', c: [73, 105, 84] },
    { k: 'white', n: '하양', c: [250, 247, 240] }, { k: 'yellow', n: '노랑', c: [221, 163, 66] }, { k: 'blue', n: '하늘', c: [150, 195, 217] }, { k: 'pink', n: '분홍', c: [242, 170, 176] },
  ];
  const rep = (s, n) => Array(n).fill(s);
  // 모양: 위에서 아래로 적은 줄. '#'이 뜨는 자리. 뜰 때는 맨 아랫줄부터 위로 올라간다.
  const SHAPES = {
    scarf:  { name: '목도리', rows: rep('#########', 20) },
    hat:    { name: '털모자', rows: ['....###....', '...#####...', '..#######..', '.#########.', ...rep('###########', 7)] },
    sock:   { name: '양말', rows: [...rep('######....', 8), '#######...', '#########.', '##########', '##########', '.#########'] },
    mitten: { name: '장갑', rows: ['..####...', '.######..', '.######..', '.######..', '.######.#', '.########', '.########', '.#######.', '.######..', '.######..', '.######..'] },
    square: { name: '네모 조각', rows: rep('#############', 13) },
    big20:  { name: '큰 네모 20코', rows: rep('#'.repeat(20), 20) },
    big30:  { name: '큰 네모 30코', rows: rep('#'.repeat(30), 30) },
  };
  // 도안: 점이 찍힌 자리에서 다른 색을 쓰면 무늬가 된다.
  const MOTIF = {
    heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
    tree:  ['...#...', '..###..', '..###..', '.#####.', '.#####.', '#######', '...#...'],
    snow:  ['#..#..#', '.#.#.#.', '..###..', '#######', '..###..', '.#.#.#.', '#..#..#'],
  };
  const GUIDES = [['none', '도안 없이'], ['stripe', '줄무늬'], ['check', '체크'], ['heart', '하트'], ['tree', '트리'], ['snow', '눈송이']];
  let CW = 24, CH = 18; const PADX = 46, PADT = 34, PADB = 14, MAXK = 10;

  let S = null, shape = null, order = [], yarn = 0, tiles = [], knob = null, drag = null, lastPc = null, cv, cx, built = false;

  const cols = () => shape.rows[0].length, rowsN = () => shape.rows.length;
  function setShape(k) {
    shape = SHAPES[k]; order = [];
    CW = Math.max(12, Math.min(24, Math.floor(560 / shape.rows[0].length))); CH = Math.round(CW * .75);   // 코가 많으면 칸을 작게
    let dir = 1;
    for (let r = rowsN() - 1; r >= 0; r--) {
      const cs = []; for (let c = 0; c < cols(); c++) if (shape.rows[r][c] === '#') cs.push(c);
      if (dir < 0) cs.reverse(); for (const c of cs) order.push({ c, r, d: dir }); dir = -dir;
    }
  }
  function guideAt(c, r) {
    const g = S.guide; if (!g || g === 'none' || g === 'chart') return false;
    if (g === 'stripe') return Math.floor((rowsN() - 1 - r) / 2) % 2 === 1;
    if (g === 'check') return (Math.floor(c / 2) + Math.floor(r / 2)) % 2 === 1;
    const m = MOTIF[g], mw = m[0].length, mh = m.length, ox = Math.floor((cols() - mw) / 2);
    const span = mh + 3, top = S.shape === 'scarf' ? 2 : Math.max(0, Math.floor((rowsN() - mh) / 2) + (S.shape === 'hat' ? 2 : 0));
    let rr = r - top; if (S.shape === 'scarf') { if (rr < 0) return false; rr = rr % span; }
    return rr >= 0 && rr < mh && c - ox >= 0 && c - ox < mw && m[rr][c - ox] === '#';
  }
  const fresh = k => ({ shape: k, guide: 'none', col: [] });
  const chartAt = (c, r) => S.guide === 'chart' && S.chart && S.chart.length === cols() * rowsN() ? +S.chart[r * cols() + c] : -1;
  // 불러온 그림을 코 수에 맞게 줄이고, 칸마다 가진 실 색 중 가장 가까운 색으로 바꿈
  function makeChart(done) {
    if (!S.src) { delete S.chart; return done && done(); }
    const im = new Image();
    im.onload = () => {
      const w = cols(), h = rowsN(), t = document.createElement('canvas'); t.width = w; t.height = h; const x = t.getContext('2d', { willReadFrequently: true });
      const one = document.createElement('canvas'); one.width = one.height = 1; const ox = one.getContext('2d'); ox.drawImage(im, 0, 0, 1, 1, 0, 0, 1, 1); const bg = ox.getImageData(0, 0, 1, 1).data;
      x.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`; x.fillRect(0, 0, w, h);
      const k = Math.min(w / im.naturalWidth, h / im.naturalHeight), dw = im.naturalWidth * k, dh = im.naturalHeight * k;
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
      const d = x.getImageData(0, 0, w, h).data; let out = '';
      for (let i = 0; i < w * h; i++) { let best = 0, bd = 1e9; YARN.forEach((y, j) => { const e = (d[i * 4] - y.c[0]) ** 2 + (d[i * 4 + 1] - y.c[1]) ** 2 + (d[i * 4 + 2] - y.c[2]) ** 2; if (e < bd) { bd = e; best = j; } }); out += best; }
      S.chart = out; done && done();
    };
    im.onerror = () => { delete S.src; delete S.chart; if (S.guide === 'chart') S.guide = 'none'; done && done(); };
    im.src = S.src;
  }
  function loadFile(f) {
    if (!f || !/^image\//.test(f.type)) return;
    const rd = new FileReader();
    rd.onload = () => { const im = new Image(); im.onload = () => {                 // 원본은 작게 줄여서만 보관
      const k = Math.min(1, 96 / Math.max(im.naturalWidth, im.naturalHeight)), t = document.createElement('canvas'); t.width = Math.max(1, Math.round(im.naturalWidth * k)); t.height = Math.max(1, Math.round(im.naturalHeight * k));
      const x = t.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, t.width, t.height); x.drawImage(im, 0, 0, t.width, t.height);
      S.src = t.toDataURL('image/png'); S.guide = 'chart'; makeChart(() => { refresh(); persist(); });
    }; im.src = rd.result; };
    rd.readAsDataURL(f);
  }

  // 한 코 그림(유화 붓 자국)을 실 색으로 물들인 조각을 미리 만들어 둠
  const tint = {};
  function tinted(ci, v) {
    const key = ci + '_' + v; if (tint[key]) return tint[key];
    const t = document.createElement('canvas'); t.width = 58; t.height = 46; const x = t.getContext('2d'), c = YARN[ci].c;
    x.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; x.fillRect(0, 0, 58, 46);
    x.globalCompositeOperation = 'multiply'; x.drawImage(tiles[v], 0, 0);
    return tint[key] = t;
  }
  const cellXY = (c, r) => [PADX + c * CW, PADT + r * CH];

  function draw(target, plain) {
    const W = PADX * 2 + cols() * CW, H = PADT + rowsN() * CH + PADB, x = target || cx;
    if (!target) { const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    x.clearRect(0, 0, W, H);
    const n = S.col.length;
    if (!plain) for (let i = n; i < order.length; i++) {                           // 아직 안 뜬 자리: 옅은 칸 + 도안 점
      const o = order[i], [px, py] = cellXY(o.c, o.r);
      x.fillStyle = 'rgba(120,100,80,.08)'; x.fillRect(px + 1, py + 1, CW - 2, CH - 2);
      if (guideAt(o.c, o.r)) { x.fillStyle = 'rgba(150,60,50,.55)'; x.beginPath(); x.arc(px + CW / 2, py + CH / 2, 2.6, 0, 7); x.fill(); }
      const cc = chartAt(o.c, o.r);                                                // 불러온 도안: 그 칸에 쓸 실 색 점
      if (cc >= 0) { const c = YARN[cc].c; x.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; x.strokeStyle = 'rgba(90,70,60,.45)'; x.lineWidth = 1; x.beginPath(); x.arc(px + CW / 2, py + CH / 2, Math.max(2.5, CW * .24), 0, 7); x.fill(); x.stroke(); }
    }
    for (let i = 0; i < n; i++) {                                                 // 뜬 코
      const o = order[i], [px, py] = cellXY(o.c, o.r);
      x.drawImage(tinted(S.col[i], (o.c * 7 + o.r * 3) % tiles.length), px - 1, py - 1, CW + 2, CH + 2);
    }
    if (plain) return;
    if (n < order.length) {                                                       // 바늘은 지금 뜨는 줄 위에
      const o = order[n], ny = PADT + o.r * CH - 7;
      if (knob) { x.drawImage(knob, 100, 20, 18, 50, 30, ny - 5, W - 36, 11); x.drawImage(knob, 0, 0, 100, 87, 6, ny - 13, 30, 26); }
      const [px, py] = cellXY(o.c, o.r);
      x.strokeStyle = 'rgba(190,70,55,.95)'; x.lineWidth = 2; x.setLineDash([4, 3]); x.strokeRect(px + 1, py + 1, CW - 2, CH - 2); x.setLineDash([]);
      x.fillStyle = 'rgba(190,70,55,.9)'; x.font = '12px sans-serif'; x.textAlign = 'center'; x.fillText(o.d > 0 ? '▶' : '◀', px + CW / 2 + o.d * (CW * .9), py + CH / 2 + 4);
    }
  }

  function status() {
    const n = S.col.length, done = n >= order.length;
    $('#knGuide').textContent = done ? `${shape.name} 완성! 트리 곁에 놓거나, 하나 더 떠 보세요.`
      : S.guide === 'chart' && S.chart ? `불러온 도안의 색 점대로 떠 보세요. '도안 색 자동'을 켜 두면 실 색이 알아서 바뀌어요. · ${order.length}코 중 ${n}코`
      : n === 0 ? '실 색을 고르고, 빨간 점선 칸부터 화살표 쪽으로 줄을 따라 쓸어 주세요. 색은 뜨다가 언제든 바꿀 수 있어요.'
      : `${order.length}코 중 ${n}코 · 닫아도 그대로 남아요. 다음에 이어 뜰 수 있어요.`;
    $('#knPlace').hidden = !done; $('#knMore').hidden = !done; $('#knOne').hidden = done; $('#knUndo').disabled = n === 0;
    document.querySelectorAll('#knShapes button').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === S.shape));
    document.querySelectorAll('#knGuides button').forEach(b => { b.setAttribute('aria-pressed', b.dataset.k === S.guide); if (b.dataset.k === 'chart') b.hidden = !S.chart; });
    $('#knAutoWrap').hidden = !(S.guide === 'chart' && S.chart);
    document.querySelectorAll('#knYarn button').forEach((b, i) => b.setAttribute('aria-pressed', i === yarn));
  }
  const persist = () => { const st = VG().state(); st.knit = S; st.knitYarn = yarn; VG().save(); };
  function knitOne() { const o = order[S.col.length]; if (!o) return false; const cc = chartAt(o.c, o.r); S.col.push(cc >= 0 && $('#knAuto').checked ? cc : yarn); return true; }
  function refresh() { draw(); status(); }

  function pcOf(e) { const b = cv.getBoundingClientRect(); return Math.floor(((e.clientX - b.left) * (cv.offsetWidth / b.width) - PADX) / CW); }
  function sweep(pc) {                                                            // 손이 지나간 칸까지 차례로 뜸
    let did = false;
    for (;;) {
      const o = order[S.col.length]; if (!o) break;
      const lo = Math.min(lastPc, pc), hi = Math.max(lastPc, pc);
      if (o.c < lo || o.c > hi) break;
      knitOne(); did = true;
    }
    lastPc = pc; if (did) { refresh(); persist(); }
  }

  function shelf() {
    const st = VG().state(), box = $('#knShelf'); box.textContent = '';
    const list = st.knits || []; $('#knShelfWrap').hidden = !list.length;
    list.forEach((k, i) => {
      const w = document.createElement('span'); w.className = 'knitem';
      const im = new Image(); im.src = k.img; im.alt = k.name; w.appendChild(im);
      const b = document.createElement('button'); b.type = 'button'; b.textContent = '✕'; b.title = `${k.name} 치우기`; b.setAttribute('aria-label', b.title);
      b.addEventListener('click', () => { st.knits.splice(i, 1); VG().save(); VG().renderTree(); shelf(); });
      w.appendChild(b); box.appendChild(w);
    });
  }
  function resultImage() {
    const W = PADX * 2 + cols() * CW, H = PADT + rowsN() * CH + PADB, t = document.createElement('canvas'); t.width = W; t.height = H;
    draw(t.getContext('2d'), true);
    const o = document.createElement('canvas'), w = cols() * CW + 4, h = rowsN() * CH + 4, k = Math.min(1, 150 / Math.max(w, h));
    o.width = Math.round(w * k); o.height = Math.round(h * k); o.getContext('2d').drawImage(t, PADX - 2, PADT - 2, w, h, 0, 0, o.width, o.height);
    return o.toDataURL('image/png');
  }
  function start(k, keepGuide) { const g = keepGuide && S ? S.guide : 'none', src = keepGuide && S ? S.src : null; S = fresh(k); S.guide = g; if (src) S.src = src; setShape(k); $('#knAsk').hidden = true; makeChart(() => { if (S.guide === 'chart' && !S.chart) S.guide = 'none'; refresh(); persist(); }); }

  function build() {
    built = true; cv = $('#knCanvas'); cx = cv.getContext('2d');
    const mk = (box, list, on) => list.forEach(([k, label]) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = k; b.textContent = label; b.addEventListener('click', () => on(k)); box.appendChild(b); });
    let pending = null;
    mk($('#knShapes'), Object.keys(SHAPES).map(k => [k, SHAPES[k].name]), k => {
      if (k === S.shape) return;
      if (S.col.length && S.col.length < order.length) { pending = k; $('#knAskText').textContent = `뜨던 ${shape.name}은(는) 풀리고, ${SHAPES[k].name}을(를) 새로 시작해요.`; $('#knAsk').hidden = false; }
      else start(k, true);
    });
    $('#knAskYes').addEventListener('click', () => pending && start(pending, true));
    $('#knAskNo').addEventListener('click', () => { $('#knAsk').hidden = true; });
    mk($('#knGuides'), GUIDES.concat([['chart', '불러온 도안']]), k => { S.guide = k; refresh(); persist(); });
    $('#knLoad').addEventListener('click', () => $('#knFile').click());
    $('#knFile').addEventListener('change', e => { loadFile(e.target.files[0]); e.target.value = ''; });
    YARN.forEach((y, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.title = y.n + ' 실'; b.setAttribute('aria-label', b.title);
      const im = new Image(); im.src = A(`kn_${y.k}.png`); im.alt = ''; b.appendChild(im);
      b.addEventListener('click', () => { yarn = i; status(); persist(); }); $('#knYarn').appendChild(b);
    });
    cv.addEventListener('pointerdown', e => { if (S.col.length >= order.length) return; drag = e.pointerId; cv.setPointerCapture(e.pointerId); lastPc = pcOf(e); sweep(lastPc); e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (drag === e.pointerId) sweep(pcOf(e)); });
    const end = e => { if (drag === e.pointerId) drag = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    $('#knOne').addEventListener('click', () => { if (knitOne()) { refresh(); persist(); } });
    $('#knUndo').addEventListener('click', () => { if (S.col.length) { S.col.pop(); refresh(); persist(); } });
    $('#knReset').addEventListener('click', () => start(S.shape, true));
    $('#knMore').addEventListener('click', () => start(S.shape, true));
    $('#knPlace').addEventListener('click', () => {
      const st = VG().state(); if (!Array.isArray(st.knits)) st.knits = [];
      if (st.knits.length >= MAXK) st.knits.shift();
      st.knits.push({ img: resultImage(), name: '내가 뜬 ' + shape.name, x: .15 + (st.knits.length % 5) * .18, y: 1.0 });
      const key = 'k' + (st.knits.length - 1); const keep = { g: S.guide, src: S.src, chart: S.chart }; S = fresh(S.shape); S.guide = keep.g; if (keep.src) { S.src = keep.src; S.chart = keep.chart; } setShape(S.shape); persist(); VG().renderTree(); VG().openTree(key, true);
    });
  }

  function openKnit() {
    const go = () => {
      if (!built) build();
      const st = VG().state(); S = st.knit && SHAPES[st.knit.shape] && Array.isArray(st.knit.col) ? st.knit : fresh('scarf');
      yarn = Number.isInteger(st.knitYarn) && YARN[st.knitYarn] ? st.knitYarn : 0;
      setShape(S.shape); S.col = S.col.filter(v => YARN[v]).slice(0, order.length); if (S.chart && S.chart.length !== cols() * rowsN()) delete S.chart; if (S.guide === 'chart' ? !S.chart : !GUIDES.some(g => g[0] === S.guide)) S.guide = 'none';
      $('#knAsk').hidden = true; shelf(); refresh(); VG().openLayer($('#knitLayer'), '#knYarn button');
    };
    if (tiles.length) return go();
    let left = 4; const done = () => { if (--left === 0) go(); };
    [1, 2, 3].forEach(i => { const im = new Image(); im.onload = done; im.onerror = done; im.src = A(`kn_st${i}.png`); tiles.push(im); });
    knob = new Image(); knob.onload = done; knob.onerror = () => { knob = null; done(); }; knob.src = A('kn_needle.png');
  }
  window.__knit = { open: openKnit };
  document.addEventListener('DOMContentLoaded', () => { const b = $('#btnKnit'); b && b.addEventListener('click', openKnit); });
  if (document.readyState !== 'loading') { const b = $('#btnKnit'); b && b.addEventListener('click', openKnit); }
})();
