// 뜨개질 손맛 시험판: 고리를 누르고 당기면 실이 고무줄처럼 늘어나다가, 놓으면 "톡" 하고 한 코가 떠진다.
// 얼마나 당겼는지가 코 크기(헐렁/딱 좋음/빡빡)로 남는다. 그림은 임시(선으로 그린 것)이고, 동작만 먼저 확인하는 용도.
(() => {
  const A = f => 'assets/' + f, $ = s => document.querySelector(s), VG = () => window.__village;
  const YARN = [['red', [202, 58, 48]], ['cream', [236, 208, 170]], ['green', [73, 105, 84]], ['white', [250, 247, 240]], ['yellow', [221, 163, 66]], ['blue', [150, 195, 217]], ['pink', [242, 170, 176]]];
  const W = 640, H = 400, N = 5, CELL = 38, FX = 150, FY = 196;
  const LN = { a: [36, 158], b: [336, 120] };                                    // 왼쪽 바늘: 손잡이 → 끝
  const REST = [372, 150], RV = [226, -66];                                      // 오른쪽 바늘: 쉬는 자리의 끝, 끝→손잡이 방향
  const STEPS = ['찌르기', '감기', '빼기', '넘기기'];
  let cv, cx, raf = 0, built = false, ball = null, yarn = 0, ang = 0;
  let left, right, rows, cur, tip = REST.slice(), mouse = REST.slice(), step = 0, anchor = null, wrap = 0, prevA = null, msg = '', msgT = 0, pops = [], turnT = 0, count = 0, ac = null, dropT = 0;

  const rgb = (c, k = 1) => `rgb(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)})`;
  const onL = t => [LN.a[0] + (LN.b[0] - LN.a[0]) * t, LN.a[1] + (LN.b[1] - LN.a[1]) * t];
  const loopL = i => onL(1 - .07 - i * .095);
  const loopR = i => [tip[0] + RV[0] * (.1 + i * .1), tip[1] + RV[1] * (.1 + i * .1)];
  const hole = () => { const a = loopL(0); return [a[0], a[1] + 12]; };            // 맨 끝 고리의 구멍 자리
  function reset() { left = Array(N).fill(yarn); right = []; rows = []; cur = []; tip = REST.slice(); step = 0; wrap = 0; msg = ''; pops = []; turnT = 0; count = 0; }
  function beep(f, d, type, vol) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'triangle'; o.frequency.setValueAtTime(f, ac.currentTime); o.frequency.exponentialRampToValueAtTime(f * .6, ac.currentTime + d);
      g.gain.setValueAtTime(vol || .12, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
    } catch (err) { /* 소리가 안 나도 놀이는 됨 */ }
  }
  const say = t => { msg = t; msgT = 80; };
  function pos(ev) { const b = cv.getBoundingClientRect(); return [(ev.clientX - b.left) * W / b.width, (ev.clientY - b.top) * H / b.height]; }
  function move(ev) { mouse = pos(ev); }
  const fail = (to, t) => { step = to; wrap = 0; prevA = null; say(t); beep(150, .1, 'sine', .08); };

  // 한 코 = 찌르기 → 감기 → 빼기 → 넘기기. 바늘 끝은 마우스를 따라다닌다.
  function stepLogic() {
    if (turnT || !left.length) return;
    const h = hole(), dx = mouse[0] - h[0], dy = mouse[1] - h[1], d = Math.hypot(dx, dy);
    if (step === 0) {                                                            // 찌르기: 바늘 끝을 고리 구멍에 넣는다
      if (d < 15) { step = 1; anchor = h; wrap = 0; prevA = null; beep(620, .05, 'sine', .07); say('들어갔어요. 이제 실을 한 바퀴 감아요'); }
    } else if (step === 1) {                                                     // 감기: 구멍 둘레로 한 바퀴 돌린다
      if (d > 120) return fail(0, '바늘이 고리에서 빠졌어요. 다시 찔러 넣어요');
      if (d > 14) { const a = Math.atan2(dy, dx); if (prevA !== null) { let da = a - prevA; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; wrap += da; } prevA = a; }
      if (Math.abs(wrap) >= 5.4) { step = 2; beep(760, .05, 'sine', .07); say('감겼어요. 아래로 당겨서 실을 빼내요'); }
    } else if (step === 2) {                                                     // 빼기: 감은 실을 고리 사이로 끌어낸다(아래쪽으로)
      if (dy > 48) { step = 3; beep(520, .06, 'sine', .08); say('새 코가 생겼어요. 오른쪽으로 밀어 헌 고리를 벗겨요'); }
      else if (d > 90 && dy < 12) fail(1, '실이 풀렸어요. 다시 한 바퀴 감아요');
    } else if (step === 3) {                                                     // 넘기기: 오른쪽으로 밀어 헌 고리를 왼쪽 바늘에서 벗긴다
      if (mouse[0] > LN.b[0] + 22) {
        const c = left.shift(); right.push(c); cur.push({ c, s: 1 }); count++; ang += .5; step = 0; wrap = 0; pops.push({ x: tip[0], y: tip[1], t: 0 }); beep(440, .16, 'triangle', .16); say(['한 코!', '좋아요', '그렇지!'][count % 3]);
        if (!left.length) turnT = 46;
      } else if (dy > 150 || mouse[0] < h[0] - 130) { dropT = 30; fail(0, '앗, 코가 빠졌어요. 다시 걸어야 해요'); }
    }
  }
  function tickStep() {
    stepLogic();
    let goal = mouse;
    if (step === 1 && anchor) { const dx = mouse[0] - anchor[0], dy = mouse[1] - anchor[1], d = Math.hypot(dx, dy) || 1, k = Math.min(1, 13 / d); goal = [anchor[0] + dx * k, anchor[1] + dy * k]; }   // 감는 동안 끝은 고리 안에 머묾
    tip[0] += (goal[0] - tip[0]) * .42; tip[1] += (goal[1] - tip[1]) * .42;
    if (turnT && --turnT === 0) { rows.unshift(cur); if (rows.length > 6) rows.pop(); cur = []; left = Array(N).fill(yarn); right = []; say('한 줄 끝! 뒤집어서 다음 줄'); beep(520, .22, 'sine', .1); }
    if (msgT) msgT--; if (dropT) dropT--;
    pops = pops.filter(p => ++p.t < 16);
  }

  function stick(a, b) {
    cx.lineCap = 'round'; cx.strokeStyle = '#8a5a2e'; cx.lineWidth = 9; cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(b[0], b[1]); cx.stroke();
    cx.strokeStyle = '#c98d4f'; cx.lineWidth = 5; cx.beginPath(); cx.moveTo(a[0], a[1] - 1); cx.lineTo(b[0], b[1] - 1); cx.stroke();
    cx.fillStyle = '#b77a3f'; cx.beginPath(); cx.arc(a[0], a[1], 10, 0, 7); cx.fill();
  }
  function loop(p, c, k) {                                                        // 바늘에 걸린 고리
    cx.lineCap = 'round'; cx.strokeStyle = rgb(c, .72); cx.lineWidth = 11 * k; cx.beginPath(); cx.ellipse(p[0], p[1] + 9 * k, 9 * k, 15 * k, 0, 0, 7); cx.stroke();
    cx.strokeStyle = rgb(c); cx.lineWidth = 7 * k; cx.beginPath(); cx.ellipse(p[0], p[1] + 9 * k, 9 * k, 15 * k, 0, 0, 7); cx.stroke();
  }
  function vst(x, y, c, s) {                                                      // 천에 떠진 코(V자)
    const w = 15 * s, h = 24 * s;
    for (const [col, lw] of [[rgb(c, .7), 12 * s], [rgb(c), 8 * s]]) { cx.strokeStyle = col; cx.lineWidth = lw; cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.beginPath(); cx.moveTo(x - w, y - h / 2); cx.lineTo(x, y + h / 2); cx.lineTo(x + w, y - h / 2); cx.stroke(); }
  }
  function draw() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    const c = YARN[yarn][1], h = hole();
    // 단계 표시
    STEPS.forEach((t, i) => { const x = 150 + i * 92, on = i === step && left.length && !turnT; cx.fillStyle = on ? '#c0392b' : i < step ? '#b9a48c' : '#e3d7c3'; cx.beginPath(); cx.roundRect(x, 14, 80, 26, 13); cx.fill(); cx.fillStyle = on || i < step ? '#fff' : '#9a8672'; cx.font = '600 13px sans-serif'; cx.textAlign = 'center'; cx.fillText(`${i + 1} ${t}`, x + 40, 32); });
    // 실뭉치와 실 가닥: 감기 전에는 고리 옆에 늘어져 있고, 감으면 바늘 끝을 돌아 나감
    const bx = 566, by = 322; if (ball && ball.complete && ball.naturalWidth) { cx.save(); cx.translate(bx, by); cx.rotate(ang); cx.drawImage(ball, -46, -46, 92, 92); cx.restore(); }
    cx.strokeStyle = rgb(c, .85); cx.lineWidth = 4; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(bx - 30, by - 30); cx.quadraticCurveTo(470, 270, step >= 2 ? tip[0] + 4 : h[0] + 34, step >= 2 ? tip[1] + 2 : h[1] + 6); cx.stroke();
    // 떠진 천
    [cur].concat(rows).forEach((row, r) => row.forEach((st, i) => { const flip = (rows.length - r) % 2 === 1, col = flip ? i : N - 1 - i; vst(FX + col * CELL + CELL / 2, FY + r * 30, YARN[st.c][1], st.s); }));
    // 왼쪽 바늘과 고리(맨 끝 고리는 찔러 넣으면 벌어짐)
    stick(LN.a, LN.b); left.forEach((lc, i) => { if (i === 0 && step === 3) { const k = Math.min(1, Math.max(0, (mouse[0] - h[0]) / (LN.b[0] + 22 - h[0]))), a = loopL(0); loop([a[0] + (LN.b[0] + 6 - a[0]) * k, a[1] + (LN.b[1] - a[1]) * k], YARN[lc][1], 1); } else loop(loopL(i), YARN[lc][1], i === 0 && step >= 1 ? 1.18 : 1); });
    const knobR = [tip[0] + RV[0], tip[1] + RV[1]];
    if (step === 1 && left.length) {                                             // 감기는 실
      const p = Math.min(1, Math.abs(wrap) / 5.4), sgn = wrap < 0 ? -1 : 1, a0 = -.3;
      cx.strokeStyle = rgb(c); cx.lineWidth = 6; cx.lineCap = 'round'; cx.beginPath(); cx.arc(tip[0], tip[1], 11, a0, a0 + sgn * p * Math.PI * 2, sgn < 0); cx.stroke();
      cx.strokeStyle = 'rgba(192,57,43,.55)'; cx.lineWidth = 2; cx.setLineDash([5, 5]); cx.beginPath(); cx.arc(h[0], h[1], 46, 0, 7); cx.stroke(); cx.setLineDash([]);   // 돌리는 길 안내
      cx.fillStyle = '#c0392b'; cx.font = '12px sans-serif'; cx.textAlign = 'center'; cx.fillText(`${Math.round(p * 100)}%`, h[0], h[1] - 54);
    }
    if (step === 2 && left.length) { cx.strokeStyle = rgb(c); cx.lineWidth = 6; cx.beginPath(); cx.arc(tip[0], tip[1], 11, 0, 7); cx.stroke(); cx.strokeStyle = rgb(c, .8); cx.lineWidth = 5; cx.beginPath(); cx.moveTo(h[0], h[1]); cx.lineTo(tip[0], tip[1]); cx.stroke(); cx.fillStyle = '#c0392b'; cx.font = '20px sans-serif'; cx.textAlign = 'center'; cx.fillText('↓', h[0], h[1] + 74); }
    if (step === 3 && left.length) { loop([tip[0] + RV[0] * .05, tip[1] + RV[1] * .05], c, .92); cx.fillStyle = '#c0392b'; cx.font = '20px sans-serif'; cx.textAlign = 'center'; cx.fillText('→', LN.b[0] + 40, LN.b[1] + 6); }
    stick(knobR, tip); right.forEach((rc, i) => loop(loopR(i + (step === 3 ? 1 : 0)), YARN[rc][1], .92));
    for (const p of pops) { cx.strokeStyle = `rgba(255,240,200,${1 - p.t / 16})`; cx.lineWidth = 3; cx.beginPath(); cx.arc(p.x, p.y, 8 + p.t * 2.4, 0, 7); cx.stroke(); }
    if (step === 0 && left.length && !turnT) { cx.strokeStyle = 'rgba(190,70,55,.9)'; cx.lineWidth = 2; cx.setLineDash([5, 4]); cx.beginPath(); cx.arc(h[0], h[1], 17 + Math.sin(Date.now() / 200) * 2, 0, 7); cx.stroke(); cx.setLineDash([]); }
    if (msgT) { cx.globalAlpha = Math.min(1, msgT / 20); cx.fillStyle = dropT ? '#c0392b' : '#5b4636'; cx.font = '600 16px sans-serif'; cx.textAlign = 'center'; cx.fillText(msg, 334, 72); cx.globalAlpha = 1; }
    cx.fillStyle = '#8a7868'; cx.font = '13px sans-serif'; cx.textAlign = 'left'; cx.fillText(`뜬 코 ${count}개`, 16, H - 14);
  }
  function tick() { tickStep(); draw(); raf = $('#knit2Layer').hidden ? 0 : requestAnimationFrame(tick); }

  function build() {
    built = true; cv = $('#kn2Canvas'); cx = cv.getContext('2d');
    cv.addEventListener('pointermove', move); cv.addEventListener('pointerdown', move);
    YARN.forEach(([k], i) => {
      const b = document.createElement('button'); b.type = 'button'; b.title = '실 색'; b.setAttribute('aria-label', '실 색 ' + (i + 1)); const im = new Image(); im.src = A(`kn_${k}.png`); im.alt = ''; b.appendChild(im);
      b.addEventListener('click', () => { yarn = i; left = left.map(() => i); ball.src = A(`kn_${k}.png`); document.querySelectorAll('#kn2Yarn button').forEach((x, j) => x.setAttribute('aria-pressed', j === i)); });
      b.setAttribute('aria-pressed', i === 0); $('#kn2Yarn').appendChild(b);
    });
    $('#kn2Reset').addEventListener('click', reset);
    ball = new Image(); ball.src = A('kn_red.png');
  }
  function open() { if (!built) build(); if (!left) reset(); VG().openLayer($('#knit2Layer'), '#kn2Yarn button'); if (!raf) raf = requestAnimationFrame(tick); }
  window.__knit2 = { open, state: () => ({ left: left.length, right: right.length, rows: rows.length, cur: cur.length, count, step, wrap }) };
  const bind = () => { const b = $('#btnKnit'); b && b.addEventListener('click', open); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})();
