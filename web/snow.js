// 날씨: 화면에 눈·비가 내리고, 눈은 마을 그림 위에 조금씩 쌓임(정해진 만큼까지만). 빗자루를 쥐면 쓸어 낼 수 있음.
(() => {
  'use strict';
  const cv = document.createElement('canvas'); cv.id = 'sky'; cv.setAttribute('aria-hidden', 'true'); (document.querySelector('#village') || document.body).appendChild(cv);   // 눈은 마을 판 안에서만 내림
  const ctx = cv.getContext('2d'), still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let W = 0, H = 0, dpr = 1, flakes = [], puffs = [], windT = 0, last = 0;
  const vil = () => window.__village, st = () => (vil() ? vil().state() : null);
  const mode = () => { const s = st(); if (!s) return 'off'; return s.settings.weather || 'clear'; };
  const moving = () => { const s = st(); return s && s.settings.fx !== false && !still; };

  /* ── 마을에 쌓이는 눈: 67×44칸마다 쌓인 정도(0~1)를 기억 ── */
  const VCFG = window.VILLAGE || {}, GW = (VCFG.snowGrid || [67, 44])[0], GH = (VCFG.snowGrid || [67, 44])[1], RATE = { snow: 1 / 150, heavy: 1 / 50, clear: -1 / 600, rain: -1 / 90 };   // 1초에 쌓이는 양(음수는 녹음)
  const VW = (VCFG.scene || { w: 603 }).w, VH = (VCFG.scene || { h: 396 }).h;       // 눈 쌓이는 층의 크기 = 장면 크기
  let lastFilter = '';
  let amt = new Float32Array(GW * GH), grain = new Float32Array(GW * GH), vcv = null, vctx = null, island = null, dirty = true, lastPaint = 0, lastSave = 0;
  const mask = document.createElement('canvas'); mask.width = GW; mask.height = GH; const mctx = mask.getContext('2d'), md = mctx.createImageData(GW, GH);
  const snowImg = new Image(); snowImg.src = 'assets/' + (VCFG.snowImg || 'island_snow.png'); snowImg.onload = () => { dirty = true; };
  const snowDay = VCFG.snowDayImg ? new Image() : null; if (snowDay) { snowDay.src = 'assets/' + VCFG.snowDayImg; snowDay.onload = () => { dirty = true; }; }   // 낮 그림 색의 눈(낮/밤 그림이 섞이는 만큼 같이 섞음)
  let lastDayW = -1; const dayW = () => { const am = document.querySelector('.sprite>img.ambient'); return am ? +getComputedStyle(am).opacity || 0 : 0; };
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) grain[y * GW + x] = .75 + .5 * (Math.sin(x * 1.7 + y * .9) * .5 + .5) * (Math.sin(x * .45 - y * 1.3 + 2) * .5 + .5) + (y / GH < .5 ? .15 : 0);
  // 처음 켰을 때: 눈이 소복이 덮인 마을에서 시작
  function initial() { amt.fill(1); dirty = true; }   // 바닥이 눈으로 다 덮인 채 시작
  function attach() {
    island = document.querySelector('.sprite[data-id=island]'); if (!island) return false;
    vcv = document.createElement('canvas'); vcv.className = 'vsnow'; vcv.width = VW * 2; vcv.height = VH * 2; vctx = vcv.getContext('2d');
    island.insertBefore(vcv, island.querySelector('.light') || null);
    const s = st(); if (s && typeof s.vsnow === 'string' && s.vsnow.length === GW * GH) for (let i = 0; i < amt.length; i++) amt[i] = (s.vsnow.charCodeAt(i) - 48) / 9; else initial();
    return true;
  }
  function paintVillage(t) {
    const dw = snowDay ? Math.round(dayW() * 50) / 50 : 0; if (dw !== lastDayW) { lastDayW = dw; dirty = true; }
    if (!vctx || !snowImg.complete || !dirty || t - lastPaint < 90) return; dirty = false; lastPaint = t;
    for (let i = 0; i < amt.length; i++) { const a = Math.max(0, Math.min(1, (amt[i] - .08) / .7)); md.data[i * 4 + 3] = a * a * (3 - 2 * a) * 255; }
    mctx.putImageData(md, 0, 0);
    const CW = vcv.width, CH = vcv.height; vctx.globalCompositeOperation = 'source-over'; vctx.globalAlpha = 1; vctx.clearRect(0, 0, CW, CH); vctx.drawImage(snowImg, 0, 0, CW, CH);
    if (snowDay && snowDay.complete && dw > 0) { vctx.globalAlpha = dw; vctx.drawImage(snowDay, 0, 0, CW, CH); vctx.globalAlpha = 1; }
    vctx.globalCompositeOperation = 'destination-in'; vctx.imageSmoothingEnabled = true; vctx.drawImage(mask, 0, 0, CW, CH);
  }
  function stepVillage(dt, t) {
    const s = st(); if (!s) return; const r = RATE[mode()] || 0; let sum = 0;
    if (r) { for (let i = 0; i < amt.length; i++) { const v = amt[i] + r * dt * (r > 0 ? grain[i] : 1); amt[i] = v < 0 ? 0 : v > 1 ? 1 : v; } dirty = true; }
    for (let i = 0; i < amt.length; i++) sum += amt[i];
    s.snowAmt = sum / amt.length; s.snowAt = Date.now();                              // 눈더미·눈사람이 쓰는 값
    // 눈 층은 낮·밤 그림의 눈을 그대로 떼어 온 것이라 따로 밝기를 바꾸지 않음
    if (t - lastSave > 15000) { lastSave = t; let str = ''; for (let i = 0; i < amt.length; i++) str += String.fromCharCode(48 + Math.round(amt[i] * 9)); s.vsnow = str; vil().save && vil().save(); }
  }

  /* ── 빗자루 ── */
  let broom = null, sweeping = false, lastSweep = null;
  function setSweep(on) {
    sweeping = on; document.body.classList.toggle('sweeping', on); const b = document.querySelector('#btnBroom'); if (b) b.setAttribute('aria-pressed', String(on));
    if (!broom) { broom = document.createElement('div'); broom.id = 'broom'; broom.innerHTML = '<svg viewBox="0 0 40 60" aria-hidden="true"><path d="M30 3 16 34" stroke="#8a5a3a" stroke-width="3.4" stroke-linecap="round"/><path d="M9 33 22 39 18 57 2 50Z" fill="#e0b860"/><path d="M9 33 22 39" stroke="#b8392e" stroke-width="3.6" stroke-linecap="round"/><path d="M7 40 5 51M11 42 9 54M15 44 14 56" stroke="#b98f3c" stroke-width="1.2"/></svg>'; document.body.appendChild(broom); }
    broom.hidden = !on; lastSweep = null;
    if (vil() && vil().refreshIgnore) vil().refreshIgnore();
    if (on && vil() && vil().toast) vil().toast('빗자루를 쥐었어요. 마을 위를 지나가면 눈이 쓸려요. 다른 곳을 누르면 내려놓아요.');
  }
  addEventListener('mousemove', e => {
    if (!sweeping) return; broom.style.left = e.clientX + 'px'; broom.style.top = e.clientY + 'px';
    if (!island) return; const r = island.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    if (fx < 0 || fy < 0 || fx > 1 || fy > 1) { lastSweep = null; return; }
    const cx = fx * GW, cy = fy * GH, R = 3.2, vx = lastSweep ? e.clientX - lastSweep.x : 0; lastSweep = { x: e.clientX, y: e.clientY }; let took = 0;
    for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(GH - 1, Math.ceil(cy + R)); y++) for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(GW - 1, Math.ceil(cx + R)); x++) {
      const d = Math.hypot(x - cx, y - cy); if (d > R) continue; const i = y * GW + x, k = amt[i] * (.75 * (1 - d / R) + .2); amt[i] -= k; took += k; }
    if (took > .15) { dirty = true; for (let i = 0; i < Math.min(7, took * 4) && puffs.length < 240; i++) puffs.push({ x: e.clientX - cv.getBoundingClientRect().left + (Math.random() - .5) * 20, y: e.clientY - cv.getBoundingClientRect().top + 6, vx: vx * 5 + (Math.random() - .5) * 110, vy: -50 - Math.random() * 110, r: 1 + Math.random() * 2, life: 1 }); }
  }, { passive: true });
  addEventListener('click', e => { if (e.target.closest('#btnBroom')) return setSweep(!sweeping); if (sweeping && !e.target.closest('#tools')) { setSweep(false); e.stopPropagation(); e.preventDefault(); } }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape' && sweeping) setSweep(false); });

  /* ── 화면에 내리는 눈·비 ── */
  function resize() { dpr = Math.min(2, devicePixelRatio || 1); const r0 = cv.getBoundingClientRect(); W = Math.max(50, r0.width); H = Math.max(50, r0.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); flakes = []; }
  function newFlake(anywhere) {
    const n = Math.random(), z = n < .08 ? 2 : n < .45 ? 1 : 0;
    return { x: Math.random() * (W + 200) - 100, y: anywhere ? Math.random() * H : -10 - Math.random() * 40, z, r: [1.1, 1.9, 3.4][z] * (.7 + Math.random() * .7), v: [22, 38, 62][z] * (.8 + Math.random() * .5), ph: Math.random() * 6.28, ps: .6 + Math.random() * 1.2, a: [.55, .8, .5][z] };
  }
  function frame(t) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = 0; return; }
    if (t - last < 28) return;
    const dt = Math.min(.08, (t - (last || t)) / 1000), first = !last; last = t;
    if (!vcv && !attach()) return;
    stepVillage(dt, t); paintVillage(t);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const m = mode(), show = moving(), k = W * H / (1920 * 1040), want = !show ? 0 : m === 'heavy' ? 420 * k : m === 'snow' ? 190 * k : 0;
    windT += dt; const wind = Math.sin(windT * .13) * 16 + Math.sin(windT * .41 + 1) * 8;
    while (flakes.length < want) flakes.push(newFlake(first || flakes.length < want * .5));
    if (flakes.length > want) flakes.length = Math.max(Math.floor(want), flakes.length - 4);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i]; f.ph += f.ps * dt; f.x += (wind * (.5 + f.z * .4) + Math.sin(f.ph) * 9) * dt; f.y += f.v * dt;
      if (f.y > H + 6 || f.x < -120 || f.x > W + 120) { flakes[i] = newFlake(false); continue; }
      ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.2832); ctx.fill();
    }
    // 내가 오린 종이 눈꽃: 가끔 마을 하늘에서 천천히 빙글빙글 내려와요
    const PF = window.__paperFlakes || []; if (PF.length) { pfT -= dt; if (pfT <= 0 && paper.length < 2) { pfT = 25 + Math.random() * 25; paper.push(newPaper(PF)); } }
    for (let i = paper.length - 1; i >= 0; i--) { const p = paper[i]; p.ph += dt; p.y += p.v * dt; p.x += (wind * .3 + Math.sin(p.ph * .8) * 14) * dt; p.rot += p.vr * dt; if (p.y > H + 40) { paper.splice(i, 1); continue; }
      if (!p.im.complete || !p.im.naturalWidth) continue; const sq = .55 + .45 * Math.abs(Math.cos(p.ph * .9)); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, sq); ctx.globalAlpha = .96; ctx.shadowColor = 'rgba(0,30,60,.25)'; ctx.shadowBlur = 4; ctx.drawImage(p.im, -p.r, -p.r, p.r * 2, p.r * 2); ctx.restore(); }
    for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.vy += 320 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.1; if (p.life <= 0) { puffs.splice(i, 1); continue; } ctx.globalAlpha = Math.min(1, p.life * 1.4); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill(); }
    ctx.globalAlpha = 1;
    if (show && m === 'rain') { ctx.strokeStyle = '#dbe6f5'; ctx.lineWidth = 1; ctx.globalAlpha = .35; ctx.beginPath(); for (let i = 0; i < 90; i++) { const x = (i * 97 + t * .5) % (W + 60) - 30, y = (i * 53 + t * .9) % H; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 16); } ctx.stroke(); ctx.globalAlpha = 1; }
  }
  let paper = [], pfT = 12; const pfImgs = new Map();
  function newPaper(PF, x) { const src = PF[Math.floor(Math.random() * PF.length)]; let im = pfImgs.get(src); if (!im) { im = new Image(); im.src = src; pfImgs.set(src, im); } return { im, x: x !== undefined ? x : Math.random() * W, y: -40 - Math.random() * 60, r: 20 + Math.random() * 12, v: 13 + Math.random() * 9, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 1.2, ph: Math.random() * 6.28 }; }
  function paperShower(n) { const PF = window.__paperFlakes || []; if (!PF.length) return; for (let i = 0; i < n; i++) { const p = newPaper(PF); p.y = -40 - i * 70 - Math.random() * 40; paper.push(p); } }
  addEventListener('resize', resize); resize(); requestAnimationFrame(frame);
  // 눈사람 눈덩이: 거리(장면 x, 바닥 줄)에서 눈을 떠 감. 돌려주는 값은 그 자리에 눈이 있던 정도(0~1)
  function take(sx, k) {
    const gyS = (VCFG.track && VCFG.track.y) || VH * .9, cx = sx / VW * GW, cy = Math.min(GH - 1, gyS / VH * GH); let have = 0, n = 0;
    for (let y = Math.max(0, Math.floor(cy - 2)); y <= Math.min(GH - 1, Math.ceil(cy + 1)); y++) for (let x = Math.max(0, Math.floor(cx - 1.5)); x <= Math.min(GW - 1, Math.ceil(cx + 1.5)); x++) { const i = y * GW + x; have += amt[i]; n++; amt[i] = Math.max(0, amt[i] - k * (.6 + Math.random() * .8)); }
    dirty = true; return n ? Math.min(1, have / n / .6) : 0;
  }
  const ground = () => { const gyS = (VCFG.track && VCFG.track.y) || VH * .9, r = Math.min(GH - 1, Math.round(gyS / VH * GH)); let s = 0; for (let x = 0; x < GW; x++) s += amt[r * GW + x]; return s / GW; };
  window.__snow = { paperShower, take, ground, avg: () => amt.reduce((a, b) => a + b, 0) / amt.length, fill: v => { amt.fill(v); dirty = true; }, count: () => flakes.length, sweep: setSweep, resize, init: () => { initial(); const s = st(); if (s) delete s.vsnow; } };
})();
