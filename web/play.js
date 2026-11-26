// 칸에서 나오는 작은 놀잇감들. 하나에 30초쯤, 손으로 해 보는 놀이예요.
// 각 놀이: start(board, api) → { reset(), result(), stop() }.  result()가 값을 돌려주면 "다 했어요"가 됨.
(() => {
  'use strict';
  const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
  // 놀잇감 아래 도구 영역: 이름표가 붙은 줄(종이 색 · 무늬 · 펜 …) + 오른쪽 아래 다음 단계 버튼
  const tools = host => { host.className = 'tools'; host.textContent = '';
    const T = {
      tabs(list, cur, fn) { const r = mk('div', 'ttabs'); list.forEach(([k, t]) => { const b = mk('button', k === cur ? 'on' : '', t); b.type = 'button'; b.setAttribute('aria-pressed', k === cur); b.addEventListener('click', () => fn(k)); r.append(b); }); host.append(r); return r; },
      row(label) { const r = mk('div', 'trow'); if (label) r.append(mk('span', 'tl', label)); const c = mk('div', 'tc'); r.append(c); host.append(r); return c; },
      sw(c, color, on, label, fn) { const b = mk('button', 'tsw' + (on ? ' on' : '')); b.type = 'button'; b.style.setProperty('--c', color); b.title = b.ariaLabel = label; b.setAttribute('aria-pressed', !!on); b.addEventListener('click', fn); c.append(b); return b; },
      chip(c, text, fn, on) { const b = mk('button', 'tchip' + (on ? ' on' : ''), text); b.type = 'button'; b.setAttribute('aria-pressed', !!on); b.addEventListener('click', fn); c.append(b); return b; },
      icon(c, src, label, fn) { const b = mk('button', 'ticon'); b.type = 'button'; b.title = b.ariaLabel = label; const im = new Image(); im.src = src; im.alt = ''; b.append(im); b.addEventListener('click', fn); c.append(b); return b; },
      seg(c, list, cur, fn) { const g2 = mk('div', 'tseg'); list.forEach(([k, t]) => { const b = mk('button', k === cur ? 'on' : '', t); b.type = 'button'; b.setAttribute('aria-pressed', k === cur); b.addEventListener('click', () => fn(k)); g2.append(b); }); c.append(g2); return g2; },
      acts() { const a = mk('div', 'tact'); host.append(a); return a; },
      go(a, text, fn) { const b = mk('button', 'go', text); b.type = 'button'; b.addEventListener('click', fn); a.append(b); return b; },
      sub(a, text, fn) { const b = mk('button', 'sub', text); b.type = 'button'; b.addEventListener('click', fn); a.append(b); return b; },
    }; return T; };
  const cv = (w, h, cls) => { const c = mk('canvas', cls); c.width = w; c.height = h; return c; };
  const at = (e, c) => { const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * c.width, y: (e.clientY - r.top) / r.height * c.height }; };
  const rnd = (a, b) => a + Math.random() * (b - a);
  const plays = {};

  /* ───────── 종이 눈꽃 오리기 ───────── */
  plays.snowflake = {
    title: '종이 눈꽃 오리기', doneLabel: '펼쳐서 트리에 달기', doneMsg: '눈꽃을 펼쳐서 트리에 달았어요.', multi: true,
    start(board, api) {
      board.className = 'pboard flake';
      const cut = cv(400, 220, 'cutcv'), prev = cv(240, 240, 'prevcv'); board.append(cut, mk('div', 'prevwrap')); board.lastChild.append(prev);
      const c = cut.getContext('2d'), p = prev.getContext('2d');
      const R = 180, P = 10, wedge = cv(200, 110), w = wedge.getContext('2d');      // 접힌 종이 한 조각(30도). 펼치면 12장이 됨
      let len = 0, last = null, bits = [], dirty = true, alive = true;
      // 가이드: 점선을 따라 오리면 예쁜 무늬가 나오는 본보기 세 가지. "내 마음대로"를 고르면 점선 없이 자유롭게.
      const GUIDES = [
        [[[30, 10], [27, 21]], [[52, 10], [60, 27], [68, 10]], [[98, 10], [110, 35], [122, 10]], [[70, 44.600], [85, 37], [93, 58]], [[172, 34], [150, 44], [157, 56]]],
        [[[46, 10], [60, 30]], [[78, 10], [96, 38]], [[114, 10], [130, 38]], [[152, 12], [150, 40]], [[52, 34], [64, 24]], [[100, 62], [108, 46]]],
        [[[70, 21], [83, 28], [70, 35], [57, 28], [70, 21]], [[115, 24], [131, 34], [115, 46], [99, 34], [115, 24]], [[150, 10], [158, 25], [166, 10]], [[34, 10], [38, 18], [30, 21.500]], [[140, 78], [136, 62], [150, 66]]],
      ];
      let guideOn = true, gi = 0; const gcv = cv(200, 110), gx = gcv.getContext('2d');
      const bar = mk('div', 'pbar'), bG = mk('button', '', '가이드 따라 하기'), bF = mk('button', '', '내 마음대로'), bN = mk('button', '', '다른 무늬'); bG.type = bF.type = bN.type = 'button';
      const paintBar = () => { bG.setAttribute('aria-pressed', String(guideOn)); bF.setAttribute('aria-pressed', String(!guideOn)); bN.hidden = !guideOn; };
      bG.addEventListener('click', () => { guideOn = true; paintBar(); fold(); }); bF.addEventListener('click', () => { guideOn = false; paintBar(); fold(); }); bN.addEventListener('click', () => { gi = (gi + 1) % GUIDES.length; fold(); });
      bar.append(bG, bF, bN); board.append(bar); paintBar();
      function fold() {
        w.globalCompositeOperation = 'source-over'; w.clearRect(0, 0, 200, 110); w.fillStyle = '#fdfdfb';
        w.beginPath(); w.moveTo(P, P); w.lineTo(P + R, P); w.lineTo(P + R * .8 * Math.cos(Math.PI / 6), P + R * .8 * Math.sin(Math.PI / 6)); w.closePath(); w.fill();      // 끝이 뾰족한 조각 → 펼치면 여섯 갈래
        len = 0; dirty = true; chunks = []; api.ready(false); api.guide(guideOn ? '빨간 점선을 따라 누른 채 움직여 오려 보세요. 다 따라 하지 않아도 괜찮아요.' : '접힌 종이 위를 누른 채 움직이면 가위로 오려져요. 가장자리를 파내면 무늬가 생겨요.');
      }
      function snip(a, b) {
        w.globalCompositeOperation = 'destination-out'; w.lineWidth = 7; w.lineCap = 'round'; w.lineJoin = 'round';
        w.beginPath(); w.moveTo(a.x, a.y); w.lineTo(b.x + .01, b.y); w.stroke();
        const d = Math.hypot(b.x - a.x, b.y - a.y); len += d + 2; dirty = true;
        if (bits.length < 60 && Math.random() < .5 + d / 12) bits.push({ x: b.x * 2, y: b.y * 2, vx: rnd(-40, 40), vy: rnd(-60, -10), r: rnd(0, 6.28), s: rnd(3, 7), life: 1 });
        if (len > 50) { api.ready(true); if (len < 60) api.guide('좋아요. 더 오려도 되고, 다 됐으면 펼쳐서 트리에 달아 보세요.'); }
      }
      // 잘려서 떨어져 나온 조각은 종이에서 빼고 아래로 떨어뜨림 (가장 큰 덩어리만 남김)
      let chunks = [], lastDrop = 0;
      function dropLoose() {
        const W = 200, H = 110, im = w.getImageData(0, 0, W, H), d = im.data, lab = new Int32Array(W * H), sizes = [0], boxes = [null], st = [];
        let n = 0;
        for (let i = 0; i < W * H; i++) {
          if (lab[i] || d[i * 4 + 3] <= 8) continue;
          n++; let sz = 0, x0 = W, y0 = H, x1 = 0, y1 = 0; lab[i] = n; st.push(i);
          while (st.length) {
            const j = st.pop(), x = j % W, y = (j - x) / W; sz++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
            if (x > 0 && !lab[j - 1] && d[(j - 1) * 4 + 3] > 8) { lab[j - 1] = n; st.push(j - 1); }
            if (x < W - 1 && !lab[j + 1] && d[(j + 1) * 4 + 3] > 8) { lab[j + 1] = n; st.push(j + 1); }
            if (y > 0 && !lab[j - W] && d[(j - W) * 4 + 3] > 8) { lab[j - W] = n; st.push(j - W); }
            if (y < H - 1 && !lab[j + W] && d[(j + W) * 4 + 3] > 8) { lab[j + W] = n; st.push(j + W); }
          }
          sizes.push(sz); boxes.push([x0, y0, x1, y1]);
        }
        if (n < 2) return;
        let keep = 1; for (let k = 2; k <= n; k++) if (sizes[k] > sizes[keep]) keep = k;
        for (let k = 1; k <= n; k++) {
          if (k === keep) continue; const [x0, y0, x1, y1] = boxes[k], cw = x1 - x0 + 1, ch = y1 - y0 + 1;
          if (sizes[k] > 12 && chunks.length < 12) {                                 // 떨어지는 조각 그림
            const pc = cv(cw, ch), pd = pc.getContext('2d').createImageData(cw, ch);
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const j = y * W + x; if (lab[j] === k) { const o = ((y - y0) * cw + (x - x0)) * 4; pd.data[o] = pd.data[o + 1] = pd.data[o + 2] = 253; pd.data[o + 3] = d[j * 4 + 3]; } }
            pc.getContext('2d').putImageData(pd, 0, 0);
            chunks.push({ c: pc, x: (x0 + cw / 2) * 2, y: (y0 + ch / 2) * 2, vx: rnd(-30, 30), vy: rnd(-40, 0), r: 0, vr: rnd(-3, 3), life: 1 });
          }
        }
        for (let i = 0; i < W * H; i++) if (lab[i] !== keep) d[i * 4 + 3] = 0;       // 남길 덩어리 말고는 지움
        w.putImageData(im, 0, 0); dirty = true;
      }
      const wp = e => { const q = at(e, cut); return { x: q.x / 2, y: q.y / 2 }; };
      cut.addEventListener('pointerdown', e => { e.preventDefault(); cut.setPointerCapture(e.pointerId); last = wp(e); snip(last, last); });
      cut.addEventListener('pointermove', e => { if (!last) return; const q = wp(e); if (Math.hypot(q.x - last.x, q.y - last.y) < 1.2) return; snip(last, q); last = q; if (e.timeStamp - lastDrop > 140) { lastDrop = e.timeStamp; dropLoose(); } });
      const up = () => { if (last) dropLoose(); last = null; }; cut.addEventListener('pointerup', up); cut.addEventListener('pointercancel', up);
      function flake(g, size) {                                                    // 펼친 모습 그리기
        g.clearRect(0, 0, size, size); g.save(); g.translate(size / 2, size / 2); const k = size / 2 / (R + 6); g.scale(k, k);
        g.shadowColor = 'rgba(110,160,215,.75)'; g.shadowBlur = 5;
        for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * Math.PI / 3); g.drawImage(wedge, -P, -P); g.scale(1, -1); g.drawImage(wedge, -P, -P); g.restore(); }
        g.restore();
      }
      let t0 = 0;
      function frame(t) {
        if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (t - (t0 || t)) / 1000); t0 = t;
        if (!dirty && !bits.length && !chunks.length) return;
        c.clearRect(0, 0, 400, 220);
        c.fillStyle = '#2f4a40'; c.beginPath(); c.roundRect(0, 0, 400, 220, 16); c.fill();                      // 재단 매트
        c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = 1; c.beginPath(); for (let x = 20; x < 400; x += 20) { c.moveTo(x, 0); c.lineTo(x, 220); } for (let y = 20; y < 220; y += 20) { c.moveTo(0, y); c.lineTo(400, y); } c.stroke();
        c.save(); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 10; c.shadowOffsetY = 4; c.drawImage(wedge, 0, 0, 400, 220); c.restore();
        if (guideOn) {                                                             // 점선은 종이가 남아 있는 곳에만 보임 → 오리면 사라짐
          gx.globalCompositeOperation = 'source-over'; gx.clearRect(0, 0, 200, 110); gx.strokeStyle = '#d9483b'; gx.lineWidth = 1.5; gx.setLineDash([4, 3]); gx.lineJoin = 'round';
          for (const path of GUIDES[gi]) { gx.beginPath(); path.forEach((q, i) => i ? gx.lineTo(q[0], q[1]) : gx.moveTo(q[0], q[1])); gx.stroke(); }
          gx.globalCompositeOperation = 'destination-in'; gx.drawImage(wedge, 0, 0); c.drawImage(gcv, 0, 0, 400, 220);
        }
        for (let i = chunks.length - 1; i >= 0; i--) { const k = chunks[i]; k.vy += 520 * dt; k.x += k.vx * dt; k.y += k.vy * dt; k.r += k.vr * dt; k.life -= dt * 1.1; if (k.life <= 0 || k.y > 260) { chunks.splice(i, 1); continue; }
          c.save(); c.globalAlpha = Math.min(1, k.life * 2.5); c.translate(k.x, k.y); c.rotate(k.r); c.drawImage(k.c, -k.c.width, -k.c.height, k.c.width * 2, k.c.height * 2); c.restore(); }
        c.fillStyle = '#fff';
        for (let i = bits.length - 1; i >= 0; i--) { const b = bits[i]; b.vy += 420 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.r += 6 * dt; b.life -= dt * 1.3; if (b.life <= 0) { bits.splice(i, 1); continue; }
          c.save(); c.globalAlpha = Math.min(1, b.life * 2); c.translate(b.x, b.y); c.rotate(b.r); c.fillRect(-b.s / 2, -b.s / 3, b.s, b.s * .66); c.restore(); }
        if (dirty) { flake(p, 240); dirty = false; }
      }
      fold(); requestAnimationFrame(frame);
      return {
        reset: fold,
        result() { if (len <= 50) return null; const o = cv(96, 96); flake(o.getContext('2d'), 96); return { img: o.toDataURL('image/png') }; },
        stop() { alive = false; },
      };
    },
  };

  /* ───────── 코코아 젓기 (유화로 그린 컵·숟가락·마시멜로) ───────── */
  const pic = f => { const im = new Image(); im.src = 'assets/' + f; return im; };
  /* ───────── 크리스마스 카페: 마을 사람들 주문대로 핫초코·아이스초코를 만들어 건네요 ───────── */
  plays.cocoa = {
    title: '크리스마스 카페', doneLabel: '카페 문 닫기', doneMsg: '오늘 카페 문을 닫았어요. 따뜻한 코코아 한 잔이 트리 곁에 놓였어요.',
    start(board, api) {
      board.className = 'pboard cocoa cafe'; const pwC = board.closest('.panel-wrap'); pwC && pwC.classList.add('xwide');
      const W = 900, H = 600, can = cv(W, H, 'cafecv'), g = can.getContext('2d'); board.append(can);
      const bar = mk('div', 'pbar cafebar'), bar2 = mk('div', 'pbar cafebar'); board.append(bar, bar2);
      const mugI = pic('cf_mug.png'), mmI = pic('co_mallow.png'), powI = pic('co_powder.png'), spoonI = pic('co_spoon.png');
      const PP = (window.VILLAGE && window.VILLAGE.people) || {};
      const WHO = [
        { k: 'nuni', like: { t: 'hot', top: ['mm'] }, ok: '우와, 마시멜로 동동! 별 찾으러 갈 힘이 났어요!', so: '음… 그래도 따뜻해서 좋아요!' },
        { k: 'baker', like: { t: 'hot', top: ['cin'] }, ok: '시나몬 향이 우리 빵집 냄새 같네. 고마워요, 새 이웃.', so: '내가 말한 거랑 조금 다르지만, 마음은 고맙게 받을게요.' },
        { k: 'cat', like: { t: 'ice', top: [] }, ok: '혀 안 데어서 좋다옹. 너는 좋은 이웃이다옹.', so: '이건 내 거 아니다옹… 그래도 마신다옹.' },
        { k: 'mail', like: { t: 'hot', top: ['whip'] }, ok: '하루 종일 편지 나르느라 손이 꽁꽁 얼었는데, 덕분에 녹았어요.', so: '허허, 조금 다르지만 따뜻하네요.' },
        { k: 'ice', like: { t: 'ice', top: ['whip'] }, ok: '얼음 조각가는 차가운 걸 좋아하죠. 완벽해요!', so: '흠, 얼음이 좀 아쉽지만 괜찮아요.' },
        { k: 'bell', like: { t: 'hot', top: ['candy'] }, ok: '종 치러 올라가기 전에 딱 좋네요. 크리스마스가 더 기다려져요.', so: '조금 다르지만, 고마워요.' },
      ];
      const TOPS = { mm: '마시멜로', whip: '휘핑크림', cin: '시나몬', candy: '사탕지팡이' };
      const SLOTX = [150, 450, 750];
      let cup, tool, orders, queue, coins, served, good, popups, steam, pouring, ptr, stirLast, alive = true, t0 = 0, nextIn, closed, flash;
      const mkB = (row, k, label, fn) => { const b = mk('button', 'cfbtn', label); b.type = 'button'; b.dataset.k = k; b.addEventListener('click', fn || (() => { tool = k; paint(); hint(); })); row.append(b); return b; };
      mkB(bar, 'newhot', '☕ 머그컵 (따뜻하게)', () => { cup = newCup('hot'); tool = 'powder'; paint(); hint(); tone(500, .05, .04, 'triangle'); });
      mkB(bar, 'newice', '🧊 유리컵 (시원하게)', () => { cup = newCup('ice'); tool = 'ice'; paint(); hint(); tone(700, .05, .04, 'triangle'); });
      mkB(bar, 'powder', '코코아 가루'); mkB(bar, 'syrup', '초코 시럽'); mkB(bar, 'ice', '얼음'); mkB(bar, 'hotmilk', '따뜻한 우유'); mkB(bar, 'coldmilk', '차가운 우유'); mkB(bar, 'stir', '스푼으로 젓기');
      mkB(bar2, 'whip', '휘핑크림'); mkB(bar2, 'mm', '마시멜로'); mkB(bar2, 'cin', '시나몬'); mkB(bar2, 'candy', '사탕지팡이');
      mkB(bar2, 'toss', '🗑 버리기', () => { cup = null; tone(160, .1, .05, 'square'); paint(); hint(); });
      function paint() { const has = !!cup; [...bar.children, ...bar2.children].forEach(b => { const k = b.dataset.k; b.setAttribute('aria-pressed', String(k === tool)); if (['newhot', 'newice'].includes(k)) b.disabled = has; else b.disabled = !has || closed; if (k === 'ice' || k === 'syrup' || k === 'coldmilk') b.hidden = has && cup.t === 'hot'; if (k === 'powder' || k === 'hotmilk') b.hidden = has && cup.t === 'ice'; }); }
      function newCup(t) { return { t, powder: 0, syrup: 0, milk: 0, ice: 0, stir: 0, tops: [], mm: [] }; }
      const fill = () => cup ? Math.min(1.1, cup.milk + cup.syrup) : 0;
      const chocAmt = () => cup ? Math.min(1, cup.powder * .3 + cup.syrup * 2.2) : 0;
      function hint() { if (closed) return;
        if (!cup) return api.guide(orders.length ? '주문표를 보고 머그컵(따뜻하게)이나 유리컵(시원하게)을 골라요.' : '곧 손님이 와요. 문에 달린 종이 딸랑거려요.');
        const h = { powder: '컵을 눌러 코코아 가루를 한 숟갈씩 넣어요. 두 숟갈이면 딱 좋아요.', syrup: '컵 위를 누르고 있으면 초코 시럽이 주르륵 흘러요. 조금만!', ice: '컵을 눌러 얼음을 하나씩 넣어요. 세 개쯤.', hotmilk: '컵 위를 누르고 있으면 따뜻한 우유가 부어져요. 금색 선까지 채워요.', coldmilk: '컵 위를 누르고 있으면 차가운 우유가 부어져요. 금색 선까지 채워요.', stir: '컵 안을 누른 채 빙글빙글 저어요. 색이 고르게 섞일 때까지.', whip: '컵 위를 눌러 휘핑크림을 올려요.', mm: '컵을 눌러 마시멜로를 띄워요.', cin: '컵을 눌러 시나몬 가루를 톡톡 뿌려요.', candy: '컵을 눌러 사탕지팡이를 꽂아요.' };
        api.guide((h[tool] || '') + ' 다 만들었으면 주문한 손님을 눌러 건네요.'); }
      function reset() { cup = null; tool = null; orders = []; queue = WHO.slice().sort(() => Math.random() - .5); coins = 0; served = 0; good = 0; popups = []; steam = []; pouring = false; ptr = null; stirLast = null; nextIn = 1.2; closed = false; flash = 0; api.ready(false); paint(); hint(); }
      // 컵 자리
      const CUPX = 450, CUPB = 572;
      function cupGeo() { if (!cup) return null; if (cup.t === 'hot') { const w = 300, h = w * 636 / 855, x = CUPX - w * .44, y = CUPB - h; return { x, y, w, h, rx: w * .366 * .93, ry: w * .144 * .9, cx: x + w * .377, cy: y + h * .22, depth: h * .62 }; }
        const w = 170, h = 250, x = CUPX - w / 2, y = CUPB - h; return { x, y, w, h, top: y, bot: CUPB - 10, cx: CUPX }; }
      function overCup(q) { const c = cupGeo(); if (!c) return false; return q.x > c.x - 30 && q.x < c.x + c.w + 30 && q.y > c.y - 140 && q.y < CUPB; }
      can.addEventListener('pointerdown', e => { const q = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId); ptr = q;
        if (q.y < 190) { const i = SLOTX.findIndex((x, j) => orders[j] && Math.abs(q.x - x) < 140); if (i >= 0) serve(i); return; }
        if (!cup || closed || !overCup(q)) return;
        if (tool === 'powder') { if (cup.powder < 5) { cup.powder++; cup.stir = Math.max(0, cup.stir - .35); puffs(14, '#7a4a2a'); tone(220, .05, .05, 'triangle'); } }
        else if (tool === 'ice') { if (cup.ice < 5) { cup.ice++; tone(1400 + cup.ice * 90, .08, .05, 'sine'); tone(900, .04, .04, 'square'); } }
        else if (tool === 'syrup' || tool === 'hotmilk' || tool === 'coldmilk') pouring = true;
        else if (tool === 'stir') stirLast = q;
        else if (TOPS[tool]) { if (!fill()) { api.guide('먼저 음료를 담아요.'); return; } if (tool === 'mm') { cup.mm.push({ a: rnd(0, 6.28), r: rnd(0, .6), s: rnd(.85, 1.1) }); if (!cup.tops.includes('mm')) cup.tops.push('mm'); }
          else if (!cup.tops.includes(tool)) cup.tops.push(tool); tone(660, .06, .04, 'triangle'); if (tool === 'cin') puffs(10, '#9a5a2a'); } });
      can.addEventListener('pointermove', e => { ptr = at(e, can); if (stirLast && cup && tool === 'stir') { const d = Math.hypot(ptr.x - stirLast.x, ptr.y - stirLast.y); if (overCup(ptr)) { cup.stir = Math.min(1, cup.stir + d / 2200); if (Math.random() < .08) tone(rnd(1800, 2400), .02, .02, 'sine'); } stirLast = ptr; } });
      const up = () => { pouring = false; stirLast = null; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up); can.addEventListener('pointerleave', () => { ptr = null; pouring = false; });
      const sparkle = [];
      function puffs(n, c) { const g2 = cupGeo(); for (let i = 0; i < n; i++) steam.push({ x: (g2.cx || CUPX) + rnd(-30, 30), y: (g2.cy || g2.top) - 10, vx: rnd(-30, 30), vy: rnd(-60, -20), life: 1, c, s: rnd(2, 5) }); }
      function judge(o) { const c = cup, f = fill(); let ok = c.t === o.like.t, why = '';
        if (!ok) why = c.t === 'hot' ? '따뜻한 거 말고 시원한 걸 원했어요' : '시원한 거 말고 따뜻한 걸 원했어요';
        if (ok && f < .62) { ok = false; why = '양이 너무 적어요'; }
        if (ok && f > 1.04) { ok = false; why = '넘칠 것 같아요'; }
        if (ok && chocAmt() < .5) { ok = false; why = '초코 맛이 너무 연해요'; }
        if (ok && c.stir < .7) { ok = false; why = '덜 섞였어요'; }
        if (ok && c.t === 'ice' && c.ice < 2) { ok = false; why = '얼음이 부족해요'; }
        const miss = o.like.top.filter(t => !c.tops.includes(t)); if (ok && miss.length) { ok = false; why = TOPS[miss[0]] + '이(가) 빠졌어요'; }
        return { ok, why }; }
      function serve(i) { const o = orders[i]; if (!o || closed) return; if (!cup) { api.guide(`${o.name}: 주문한 걸 먼저 만들어 주세요.`); return; }
        const r = judge(o), tip = r.ok && o.wait < o.max * .5 ? 3 : 0, pay = r.ok ? 5 + tip : 2; coins += pay; served++; if (r.ok) good++;
        popups.push({ x: SLOTX[i] - 78, y: 40, t: 0, s: r.ok ? `+${pay} 🪙${tip ? ' 팁!' : ''}` : `+${pay} 🪙` });
        orders[i] = { ...o, leaving: 0, msg: r.ok ? o.ok : `${r.why}. ${o.so}`, happy: r.ok };
        cup = null; tool = null; tone(r.ok ? 880 : 300, .12, .06, 'triangle'); if (r.ok) setTimeout(() => tone(1320, .1, .05, 'triangle'), 110);
        if (served >= 3) api.ready(true); if (!queue.length && orders.every(x => !x || x.leaving !== undefined)) setTimeout(closeShop, 2600); paint(); hint(); }
      function closeShop() { if (closed) return; closed = true; api.ready(served > 0); flash = 1; api.guide(`오늘 카페 마감! 손님 ${served}명, 딱 맞게 만든 건 ${good}잔, 동전 ${coins}개를 모았어요. 마을이 조금 더 따뜻해졌어요.`); paint(); }
      function addOrder() { const j = [0, 1, 2].find(k => !orders[k]); if (j === undefined || !queue.length) return; const w = queue.shift(), p = PP[w.k] || { name: w.k, img: '' }, im = new Image(); im.src = 'assets/' + p.img;
        const extra = w.like.t === 'hot' && Math.random() < .4 && !w.like.top.includes('mm') ? ['mm'] : []; orders[j] = { ...w, like: { t: w.like.t, top: [...w.like.top, ...extra] }, name: p.name, im, wait: 0, max: 60, in: 0 }; tone(1568, .25, .05, 'sine'); setTimeout(() => tone(2093, .3, .04, 'sine'), 120); hint(); }
      function roundImg(im, x, y, r) { g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); if (im.complete && im.naturalWidth) g.drawImage(im, x - r, y - r, r * 2, r * 2); else { g.fillStyle = '#d9c9b0'; g.fill(); } g.restore(); g.strokeStyle = '#fff8ec'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); }
      function bubble(x, y, w, h) { g.fillStyle = 'rgba(255,250,240,.96)'; g.strokeStyle = 'rgba(140,100,70,.35)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(x, y, w, h, 12); g.fill(); g.stroke(); }
      function drawScene(t) {
        const wall = g.createLinearGradient(0, 0, 0, 330); wall.addColorStop(0, '#2f4a46'); wall.addColorStop(1, '#3d5b55'); g.fillStyle = wall; g.fillRect(0, 0, W, 330);
        for (let i = 0; i < 9; i++) { const x = 50 + i * 100, y = 18 + Math.sin(i * 1.7) * 6, on = .6 + .4 * Math.sin(t / 500 + i); g.fillStyle = ['#ffcf6a', '#ff8a7a', '#9fe0a8', '#a8d4ff'][i % 4]; g.globalAlpha = on; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); g.globalAlpha = on * .3; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); g.globalAlpha = 1; }   // 꼬마전구
        g.strokeStyle = 'rgba(20,30,28,.6)'; g.lineWidth = 1.5; g.beginPath(); for (let x = 0; x <= W; x += 10) g.lineTo(x, 14 + Math.sin(x / 100 * 1.7) * 6); g.stroke();
        const ct = g.createLinearGradient(0, 330, 0, H); ct.addColorStop(0, '#9a6a44'); ct.addColorStop(.08, '#7c5236'); ct.addColorStop(1, '#5c3a24'); g.fillStyle = ct; g.fillRect(0, 330, W, H - 330);
        g.fillStyle = 'rgba(255,230,190,.18)'; g.fillRect(0, 330, W, 6); for (let i = 0; i < 7; i++) { g.strokeStyle = 'rgba(40,20,10,.15)'; g.beginPath(); g.moveTo(0, 360 + i * 36); g.lineTo(W, 352 + i * 37); g.stroke(); }
        g.save(); g.translate(690, 200); g.fillStyle = '#5a3b26'; g.beginPath(); g.roundRect(-8, -8, 196, 126, 8); g.fill(); g.fillStyle = '#26352f'; g.beginPath(); g.roundRect(0, 0, 180, 110, 4); g.fill();   // 칠판 메뉴
        g.fillStyle = 'rgba(255,250,235,.92)'; g.textAlign = 'center'; g.font = '700 17px "Gaegu","Gowun Batang",serif'; g.fillText('오늘의 메뉴', 90, 26); g.font = '15px "Gaegu","Gowun Batang",serif'; g.fillText('☕ 핫초코   🧊 아이스초코', 90, 54); g.fillText('마시멜로 · 휘핑 · 시나몬', 90, 78); g.fillStyle = 'rgba(255,214,120,.9)'; g.fillText('★ 메리 크리스마스 ★', 90, 100); g.restore();
        g.save(); g.translate(150, 250); g.strokeStyle = '#2f5a3a'; g.lineWidth = 16; g.beginPath(); g.arc(0, 0, 46, 0, 7); g.stroke(); g.strokeStyle = '#3d7449'; g.lineWidth = 6; g.setLineDash([4, 6]); g.beginPath(); g.arc(0, 0, 46, 0, 7); g.stroke(); g.setLineDash([]); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28; g.fillStyle = '#c8322e'; g.beginPath(); g.arc(Math.cos(a) * 46, Math.sin(a) * 46, 5, 0, 7); g.fill(); } g.fillStyle = '#c8322e'; g.beginPath(); g.moveTo(0, -46); g.lineTo(-18, -62); g.lineTo(-14, -40); g.closePath(); g.moveTo(0, -46); g.lineTo(18, -62); g.lineTo(14, -40); g.closePath(); g.fill(); g.restore(); }   // 리스
      function drawCup(t) { const c = cupGeo(); if (!c) { g.fillStyle = 'rgba(255,240,215,.5)'; g.font = '17px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText('위에서 컵을 골라요', CUPX, 470); return; }
        const f = Math.min(1, fill()), ch = chocAmt(), mixT = cup.stir, milkC = [246, 238, 226], chocC = [92, 52, 30], mixC = milkC.map((v, i) => v + (chocC[i] - v) * Math.min(1, ch * .95)), topC = cup.stir < .7 && ch > .05 ? milkC.map((v, i) => v + (mixC[i] - v) * mixT) : mixC, col = a => `rgb(${a.map(v => v | 0).join(',')})`;
        g.save(); g.fillStyle = 'rgba(30,15,5,.35)'; g.filter = 'blur(8px)'; g.beginPath(); g.ellipse(CUPX, CUPB - 4, cup.t === 'hot' ? 150 : 95, 14, 0, 0, 7); g.fill(); g.restore();
        if (cup.t === 'hot') { if (mugI.complete) g.drawImage(mugI, c.x, c.y, c.w, c.h);
          if (f > 0) { const lvl = c.cy + c.depth * (1 - f) * .62, sc = .78 + .22 * f; g.save(); g.beginPath(); g.ellipse(c.cx, c.cy + 4, c.rx, c.ry, 0, 0, 7); g.clip(); g.fillStyle = col(topC); g.beginPath(); g.ellipse(c.cx, lvl, c.rx * sc, c.ry * sc, 0, 0, 7); g.fill();
            if (cup.stir < .7 && ch > .05) { g.strokeStyle = col(chocC); g.globalAlpha = (1 - cup.stir) * .8; g.lineWidth = 6; g.beginPath(); for (let k = 0; k < 40; k++) { const a = k / 40 * 12.5 + t / 900, r = k / 40; g.lineTo(c.cx + Math.cos(a) * c.rx * sc * r * .9, lvl + Math.sin(a) * c.ry * sc * r * .9); } g.stroke(); g.globalAlpha = 1; }
            if (cup.powder && cup.stir < .4) { g.fillStyle = 'rgba(110,70,40,.8)'; for (let k = 0; k < cup.powder * 30; k++) { const a = k * 2.39, r = Math.sqrt((k * .618) % 1) * .7; g.fillRect(c.cx + Math.cos(a) * c.rx * sc * r, lvl + Math.sin(a) * c.ry * sc * r, 2.4, 2); } }
            const hl = g.createLinearGradient(c.cx - c.rx, lvl - c.ry, c.cx + c.rx, lvl + c.ry); hl.addColorStop(0, 'rgba(255,255,255,.18)'); hl.addColorStop(.5, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.beginPath(); g.ellipse(c.cx, lvl, c.rx * sc, c.ry * sc, 0, 0, 7); g.fill();
            tops(c.cx, lvl, c.rx * sc, c.ry * sc, t); g.restore(); }
          else if (cup.powder) { g.save(); g.beginPath(); g.ellipse(c.cx, c.cy + 4, c.rx, c.ry, 0, 0, 7); g.clip(); if (powI.complete) g.drawImage(powI, c.cx - 50, c.cy + c.ry * .2, 100, 60); g.restore(); }
          // 금색 눈금(이만큼 채우기)
          g.strokeStyle = 'rgba(255,215,120,.0)'; }
        else { const L = c.x, R = c.x + c.w, top = c.top, bot = c.bot, ins = 12, inner = y => { const u = (y - top) / (bot - top); return [L + ins * .6 + u * 10, R - ins * .6 - u * 10]; };
          const lt = bot - (bot - top - 22) * f;
          if (f > 0) { const [a1, b1] = inner(lt), [a2, b2] = inner(bot - 6); const lg = g.createLinearGradient(0, lt, 0, bot); if (cup.stir < .6 && cup.syrup > 0) { lg.addColorStop(0, col(milkC)); lg.addColorStop(Math.max(.05, .9 - cup.syrup * 3 * (1 - cup.stir)), col(topC)); lg.addColorStop(1, col(chocC)); } else { lg.addColorStop(0, col(mixC)); lg.addColorStop(1, col(mixC.map(v => v * .85))); }
            g.fillStyle = lg; g.beginPath(); g.moveTo(a1, lt); g.lineTo(b1, lt); g.lineTo(b2, bot - 6); g.quadraticCurveTo((a2 + b2) / 2, bot + 2, a2, bot - 6); g.closePath(); g.fill(); g.fillStyle = col(topC.map(v => Math.min(255, v + 12))); g.beginPath(); g.ellipse((a1 + b1) / 2, lt, (b1 - a1) / 2, 7, 0, 0, 7); g.fill(); }
          for (let k = 0; k < cup.ice; k++) { const x = CUPX + [-26, 22, -2, 30, -30][k], y = f > 0 ? lt + 4 + (k % 3) * 10 : bot - 26 - Math.floor(k / 2) * 28, s = 34; g.save(); g.translate(x, y); g.rotate([.3, -.2, .1, -.4, .25][k]); g.fillStyle = 'rgba(232,246,255,.6)'; g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 2; g.beginPath(); g.roundRect(-s / 2, -s / 2, s, s, 7); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(-s / 2 + 5, -s / 2 + 5, 9, 4); g.restore(); }
          if (f > 0) tops(CUPX, lt, (c.w - 30) / 2, 7, t);
          g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3; g.beginPath(); g.moveTo(L, top); g.lineTo(L + 10, bot); g.quadraticCurveTo(CUPX, bot + 12, R - 10, bot); g.lineTo(R, top); g.stroke();
          g.fillStyle = 'rgba(220,240,255,.14)'; g.beginPath(); g.moveTo(L, top); g.lineTo(L + 10, bot); g.quadraticCurveTo(CUPX, bot + 12, R - 10, bot); g.lineTo(R, top); g.fill();
          g.strokeStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(CUPX, top, c.w / 2, 9, 0, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(L + 14, top + 20, 8, bot - top - 50);
          g.strokeStyle = 'rgba(255,214,120,.9)'; g.setLineDash([6, 5]); g.lineWidth = 2; const gy = bot - (bot - top - 22) * .85; g.beginPath(); g.moveTo(R - 8, gy); g.lineTo(R + 14, gy); g.stroke(); g.setLineDash([]); }
        if (cup.t === 'hot' && f > .2 && Math.random() < .3) steam.push({ x: c.cx + rnd(-40, 40), y: c.cy - 10, vx: rnd(-6, 6), vy: rnd(-40, -25), life: 1.4, c: 'steam', s: rnd(10, 18) }); }
      function tops(cx, y, rx, ry, t) { if (!cup) return;
        if (cup.tops.includes('whip')) { for (let k = 0; k < 6; k++) { const rr = rx * (.62 - k * .09), yy = y - 6 - k * 8; const gr = g.createRadialGradient(cx - rr * .3, yy - 4, 2, cx, yy, rr); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#ece2d4'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, yy, rr, Math.max(4, ry * .55 + 6 - k), 0, 0, 7); g.fill(); } g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx - 6, y - 50); g.quadraticCurveTo(cx, y - 66, cx + 6, y - 50); g.fill(); }
        for (const m of cup.mm) { const x = cx + Math.cos(m.a) * rx * m.r, yy = y + Math.sin(m.a) * ry * m.r - 4, s = 34 * m.s; if (mmI.complete) g.drawImage(mmI, x - s / 2, yy - s * .5, s, s * .73); }
        if (cup.tops.includes('cin')) { g.fillStyle = 'rgba(140,80,40,.85)'; for (let k = 0; k < 70; k++) { const a = k * 2.4, r = Math.sqrt((k * .618) % 1); g.fillRect(cx + Math.cos(a) * rx * .6 * r, y - (cup.tops.includes('whip') ? 30 : 0) + Math.sin(a) * ry * .6 * r, 2, 2); } }
        if (cup.tops.includes('candy')) { g.save(); g.translate(cx + rx * .45, y - 10); g.rotate(.25); g.lineCap = 'round'; g.lineWidth = 10; g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(0, 30); g.lineTo(0, -60); g.arc(-14, -60, 14, 0, Math.PI, true); g.stroke(); g.strokeStyle = '#d33'; g.lineWidth = 10; g.setLineDash([7, 9]); g.beginPath(); g.moveTo(0, 30); g.lineTo(0, -60); g.arc(-14, -60, 14, 0, Math.PI, true); g.stroke(); g.setLineDash([]); g.restore(); } }
      function drawOrders(t) { orders.forEach((o, i) => { if (!o) return; const x = SLOTX[i], inA = Math.min(1, o.in), y = 96 + (1 - inA) * -120; o.in += .04;
          const lv = o.leaving !== undefined; if (lv) { o.leaving += .012; } g.save(); g.globalAlpha = lv ? Math.max(0, 1 - Math.max(0, o.leaving - 1.6) * 2) : 1;
          roundImg(o.im, x - 78, y, 50); g.fillStyle = '#fff8ec'; g.font = '700 14px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText(o.name, x - 78, y + 70);
          if (lv) { bubble(x - 20, y - 52, 158, 108); g.fillStyle = '#4a2e1e'; g.font = '13.5px "Gaegu","Gowun Batang",serif'; g.textAlign = 'left'; wrapText(o.msg, x - 10, y - 30, 140, 18); g.font = '26px serif'; g.fillText(o.happy ? '💛' : '🙂', x + 102, y + 48); }
          else { bubble(x - 20, y - 50, 150, 96); g.textAlign = 'left'; g.fillStyle = '#4a2e1e'; g.font = '700 16px "Gowun Batang",serif'; g.fillText(o.like.t === 'hot' ? '☕ 핫초코' : '🧊 아이스초코', x - 8, y - 22);
            g.font = '14px "Gowun Batang",serif'; g.fillText(o.like.top.length ? '+ ' + o.like.top.map(k => TOPS[k]).join(', ') : '그냥 기본으로', x - 8, y + 2, 132);
            const pr = 1 - o.wait / o.max; g.fillStyle = 'rgba(80,50,30,.15)'; g.fillRect(x - 8, y + 22, 126, 7); g.fillStyle = pr > .5 ? '#6aa86a' : pr > .25 ? '#e0a83a' : '#d0573f'; g.fillRect(x - 8, y + 22, 126 * Math.max(0, pr), 7); }
          g.restore(); if (lv && o.leaving > 2.2) orders[i] = null; }); }
      function wrapText(s, x, y, w, lh) { let line = ''; for (const ch of s) { const tt = line + ch; if (g.measureText(tt).width > w) { g.fillText(line, x, y); y += lh; line = ch; } else line = tt; } g.fillText(line, x, y); }
      function frame(t) { if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (t - (t0 || t)) / 1000); t0 = t;
        if (!closed) { nextIn -= dt; if (nextIn <= 0) { addOrder(); nextIn = rnd(9, 14); }
          orders.forEach((o, i) => { if (o && o.leaving === undefined) { o.wait += dt; if (o.wait > o.max) { orders[i] = { ...o, leaving: 0, msg: '너무 오래 기다려서 다음에 올게요…', happy: false }; served++; if (served >= 3) api.ready(true); } } });
          if (!queue.length && orders.every(o => !o) && served) closeShop(); }
        if (pouring && cup && ptr && overCup(ptr)) { const k = tool === 'syrup' ? 'syrup' : 'milk', rate = tool === 'syrup' ? .12 : .32; cup[k] += rate * dt; if (tool !== 'syrup' && cup.t === 'hot' !== (tool === 'hotmilk')) {} cup.stir = Math.max(0, cup.stir - dt * .4); if (Math.random() < .2) tone(rnd(300, 500), .03, .02, 'sine'); if (fill() > 1.05 && Math.random() < .05) api.guide('넘쳐요! 손을 떼요.'); }
        g.clearRect(0, 0, W, H); drawScene(t); drawCup(t);
        if (pouring && cup && ptr) { const c = cupGeo(), ty = cup.t === 'hot' ? c.cy + 10 : c.bot - (c.bot - c.top - 22) * Math.min(1, fill()), col = tool === 'syrup' ? '#4a2614' : '#f8f2e8'; g.strokeStyle = col; g.lineWidth = tool === 'syrup' ? 6 : 11; g.lineCap = 'round'; g.beginPath(); g.moveTo(ptr.x, ptr.y - 40); g.quadraticCurveTo(ptr.x, (ptr.y + ty) / 2, (c.cx || CUPX) + (ptr.x - (c.cx || CUPX)) * .3, ty); g.stroke();
          g.save(); g.translate(ptr.x, ptr.y - 40); g.rotate(-.9); g.fillStyle = tool === 'syrup' ? '#6b3a1e' : tool === 'hotmilk' ? '#d8d2c8' : '#cfe3f0'; g.beginPath(); g.roundRect(-26, -70, 52, 80, 10); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-18, -60, 8, 56); g.fillStyle = '#3a2a20'; g.font = '700 12px sans-serif'; g.textAlign = 'center'; g.fillText(tool === 'syrup' ? '초코' : '우유', 0, -26); g.restore(); }
        if (tool === 'stir' && ptr && cup && spoonI.complete) { const sw = 200, sh = sw * spoonI.naturalHeight / spoonI.naturalWidth; g.save(); g.translate(ptr.x, ptr.y); g.rotate(2.09 + Math.sin(performance.now() / 160) * (stirLast ? .12 : 0)); g.drawImage(spoonI, -sw + 26, -sh / 2, sw, sh); g.restore(); }   // 숟가락 머리는 컵 안, 손잡이는 위로
        for (let i = steam.length - 1; i >= 0; i--) { const s = steam[i]; s.life -= dt * .7; if (s.life <= 0) { steam.splice(i, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; if (s.c === 'steam') { g.fillStyle = `rgba(255,255,255,${(s.life * .12).toFixed(3)})`; g.beginPath(); g.arc(s.x + Math.sin(t / 300 + i) * 4, s.y, s.s * (1.6 - s.life * .4), 0, 7); g.fill(); } else { g.fillStyle = s.c; g.globalAlpha = s.life; g.beginPath(); g.arc(s.x, s.y, s.s, 0, 7); g.fill(); g.globalAlpha = 1; } }
        drawOrders(t);
        for (let i = popups.length - 1; i >= 0; i--) { const p = popups[i]; p.t += dt; if (p.t > 1.6) { popups.splice(i, 1); continue; } g.fillStyle = `rgba(255,214,90,${1 - p.t / 1.6})`; g.font = '700 22px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText(p.s, p.x, p.y - p.t * 40); }
        g.fillStyle = 'rgba(30,20,12,.55)'; g.beginPath(); g.roundRect(W - 168, H - 46, 156, 34, 17); g.fill(); g.fillStyle = '#ffe6a8'; g.font = '700 17px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText(`🪙 ${coins}   ☕ ${good}/${served}`, W - 90, H - 23);
        if (closed) { flash = Math.max(0, flash - dt * .3); g.fillStyle = 'rgba(20,14,10,.55)'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.font = '700 34px "Gowun Batang",serif'; g.fillText('오늘 카페 마감', W / 2, H / 2 - 30); g.font = '19px "Gowun Batang",serif'; g.fillText(`손님 ${served}명 · 딱 맞은 잔 ${good}잔 · 동전 ${coins}개`, W / 2, H / 2 + 12); g.font = '16px "Gaegu","Gowun Batang",serif'; g.fillText('따뜻한 한 잔 덕분에 마을이 조금 더 포근해졌어요.', W / 2, H / 2 + 46); }
      }
      reset(); requestAnimationFrame(frame);
      return { reset, result() { return served ? { mallows: 1, served, coins } : null; }, stop() { alive = false; pwC && pwC.classList.remove('xwide'); } };
    },
  };
  plays.candle = {
    title: '촛불 켜기', doneLabel: '켜 두기', doneMsg: '촛불을 켜 뒀어요. 트리 곁에서 일렁여요.',
    start(board, api) {
      board.className = 'pboard candle';
      const can = cv(800, 780, 'cdcv'), g = can.getContext('2d'); board.append(can);
      const bar = mk('div', 'pbar'), bBlow = mk('button', '', '성냥 후 불어 끄기'); bBlow.type = 'button'; bBlow.disabled = true; bar.append(bBlow); board.append(bar);
      const unlit = pic('cd_unlit.jpg'), litIm = pic('cd_lit_nf.jpg'), flameI = pic('cd_flame.png'), matchIm = pic('cd_match.png'), boxIm = pic('cd_box.png'), trayI = pic('cd_tray.png');
      const WICK = { x: 358, y: 62 }, BOX = { x: 6, y: 569, w: 220, h: 205 }, HOME = { x: 470, y: 706 }, Z = { x: 230, y: 190, w: 360, h: 335 };
      const SL = { w: 410, h: 382, cx: 206.95, cy: 190.6, len: 454, tw: 435, th: 390 }, U = { x: -.731, y: .682 };   // 겉상자 그림 크기·가운데·긴 쪽 길이, 서랍이 나오는 방향(왼쪽 아래)
      const amap = new Map(), alphaAt = (im, r, q) => { if (!im.complete || !im.naturalWidth) return 0; let c = amap.get(im); if (!c) { c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0); c.d = cx.getImageData(0, 0, c.width, c.height).data; amap.set(im, c); }
        const x = Math.floor((q.x - r.x) / r.w * c.width), y = Math.floor((q.y - r.y) / r.h * c.height); return x < 0 || y < 0 || x >= c.width || y >= c.height ? 0 : c.d[(y * c.width + x) * 4 + 3]; };
      const ST = [.964, .282, .447, .893];   // 성냥갑 옆면 까만 띠(상자 그림 안의 비율 좌표)
      let guard = { st: 'off', n: 0, next: 3, gust: null, hp: 1 }, hand = null, lean = 0, gusts = [], mx, my, vx, ang, held, heat, wear, burn, flare, warm, on, fade, sparks, smoke, last, lastT, lastRub, lastScr, marks = [], flash = 0, alive = true, t0 = 0, has, burnt, zoom, zt, tray, trayGo, drag, left, shakes = 0, lastDir = 0, lastShake = 0;
      const lerp = (p, q, k) => p + (q - p) * k, ease = k => 1 - (1 - k) ** 3;
      const BURN = 14, CL = x => -12 + (x - 20) * (20 / 220);                     // 성냥 한 개 타는 시간(초), 성냥 그림 안 막대 가운데 줄(머리 x≈20 → 손잡이 x≈240)
      const burnX = () => 20 + 172 * Math.min(1, Math.max(0, 1 - burn / BURN)) ** 2.2;   // 불이 막대를 따라 손 쪽으로 타 들어간 자리(성냥 안 좌표)
      const toW = (lx, ly) => ({ x: mx + Math.cos(ang) * lx - Math.sin(ang) * ly, y: my + Math.sin(ang) * lx + Math.cos(ang) * ly });   // 성냥 안 좌표 → 화면 좌표
      const flamePt = () => { const bx = burnX(); return toW(bx - 4, CL(bx) - 4); };
      const R = () => { const k = ease(zt); return { x: lerp(BOX.x, Z.x, k), y: lerp(BOX.y, Z.y, k), w: lerp(BOX.w, Z.w, k), h: lerp(BOX.h, Z.h, k) }; };   // 성냥갑이 제자리에서 커지며 다가옴
      const trayRect = r => { const k = r.w / SL.w, w = SL.tw * k * .96, h = SL.th * k * .96, d = tray * SL.len * k * .62, cx = r.x + SL.cx * k + U.x * d, cy = r.y + SL.cy * k + U.y * d; return { x: cx - w / 2, y: cy - h / 2, w, h }; };   // 속 서랍이 겉 상자 긴 쪽을 따라 왼쪽 아래로 밀려 나옴
      const putOut = () => { if (burn <= 0) return; burn = 0; burnt = true; bBlow.disabled = true; for (let i = 0; i < 7; i++) smoke.push({ x: mx + rnd(-4, 4), y: my - 10, vx: rnd(-12, 12), vy: rnd(-70, -35), r: rnd(6, 11), life: 1 }); api.guide(on ? '성냥을 껐어요. 촛불은 계속 타고 있어요.' : '성냥을 껐어요. 성냥갑을 눌러 새 성냥을 꺼내요.'); };
      bBlow.addEventListener('click', putOut);
      function reset() { guard = { st: 'off', n: 0, next: 3, gust: null, hp: 1 }; lean = 0; gusts = []; marks = []; flash = 0; mx = HOME.x; my = HOME.y; vx = 0; ang = .25; held = false; has = false; zoom = 0; zt = 0; tray = 0; trayGo = null; drag = null; left = 8; heat = 0; wear = 0; burn = 0; flare = 9; warm = 0; on = false; fade = 0; sparks = []; smoke = []; last = null; burnt = false; bBlow.disabled = true; api.ready(false); api.guide('성냥갑을 눌러 가까이 가져와요. 속 서랍을 밀어 열고 성냥을 한 개 집어요.'); }
      const inR = (q, r) => q.x > r.x && q.x < r.x + r.w && q.y > r.y && q.y < r.y + r.h;
      const near = q => has && Math.hypot(q.x - mx, q.y - my) < 60;
      can.addEventListener('pointerdown', e => { const q = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId); last = q; lastT = e.timeStamp;
        if (zoom === 1 && zt > .9) { const r = R(), tr = trayRect(r);
          if (!has && tray > .45 && left > 0 && alphaAt(trayI, tr, q) > 100 && alphaAt(boxIm, r, q) < 60) { left--; has = true; burnt = false; burn = 0; heat = 0; wear = 0; held = true; mx = q.x; my = q.y; ang = .05; trayGo = 0; tone(900, .04, .03, 'triangle'); api.guide('성냥을 집었어요. 서랍이 닫히면 옆면 까만 띠에 대고 쓱 그어요.'); return; }   // 집으면 서랍은 스르륵 닫힘
          if (!has && inR(q, { x: r.x - r.w * .7, y: r.y - 40, w: r.w * 1.7, h: r.h + r.w * .8 })) { drag = { x0: q.x, y0: q.y, t0: tray }; return; }
          if (has && near(q)) { held = true; return; }
          if (!has && !inR(q, { x: r.x - r.w * .8, y: r.y - 60, w: r.w * 1.9, h: r.h + r.w * .9 })) { zoom = -1; } return; }
        if (zoom) return;
        if ((!has || (burnt && burn <= 0)) && inR(q, BOX)) { zoom = 1; has = false; tray = 0; tone(420, .08, .05, 'sine'); api.guide('속 서랍을 왼쪽 아래로 밀어서 열어요.'); return; }
        if (near(q)) held = true; });
      can.addEventListener('pointermove', e => { hand = at(e, can); }); can.addEventListener('pointerleave', () => { hand = null; });
      can.addEventListener('pointermove', e => { const q = at(e, can), dtm = Math.max(1, e.timeStamp - (lastT || e.timeStamp)); lastT = e.timeStamp;
        if (drag) { const r = R(); tray = Math.max(0, Math.min(1, drag.t0 + ((q.x - drag.x0) * U.x + (q.y - drag.y0) * U.y) / (SL.len * r.w / SL.w * .62))); if (Math.abs(q.x - last.x) > 2 && e.timeStamp - (lastScr || 0) > 60) { lastScr = e.timeStamp; scratch(.06, .025, 900); } last = q; return; }
        if (!held) return; const sp = Math.hypot(q.x - last.x, q.y - last.y), ddx = q.x - last.x, pv = { x: mx, y: my }; vx = ddx / dtm * 16; last = q; mx = q.x; my = q.y;
        if (burn > 0 && flare > 2.5 && Math.abs(ddx) > 9) { const dir = Math.sign(ddx); if (dir !== lastDir) { shakes = e.timeStamp - lastShake < 450 ? shakes + 1 : 1; lastShake = e.timeStamp; lastDir = dir; if (shakes >= 4) { shakes = 0; putOut(); } } }
        if (burn > 0 || burnt) return;
        const r = zoom === 1 ? R() : BOX, ax = r.x + r.w * ST[0], ay = r.y + r.h * ST[1], bx = r.x + r.w * ST[2], by = r.y + r.h * ST[3];
        const tt = Math.max(0, Math.min(1, ((mx - ax) * (bx - ax) + (my - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2))), d = Math.hypot(mx - (ax + tt * (bx - ax)), my - (ay + tt * (by - ay)));
        if (d < r.w * .07 && tt > 0 && tt < 1 && sp > 5) {   // 머리가 까만 띠를 문지르는 중
          const speed = sp / dtm * 16; heat += speed * (speed > 14 ? 1 : .3); wear = Math.min(1, wear + speed * .0006); lastRub = e.timeStamp;
          if (pv) { marks.push([(pv.x - r.x) / r.w, (pv.y - r.y) / r.h, (mx - r.x) / r.w, (my - r.y) / r.h, Math.min(.5, .12 + speed * .01)]); if (marks.length > 160) marks.shift(); }   // 까만 띠에 남는 긁힌 자국
          if (e.timeStamp - (lastScr || 0) > 35) { lastScr = e.timeStamp; scratch(.07, Math.min(.12, .02 + speed * .004), 2400 + speed * 40); }   // 사각사각 마찰 소리
          if (speed > 10) for (let i = 0; i < 1 + (speed > 25); i++) sparks.push({ x: mx - 8, y: my, vx: -ddx * rnd(4, 9) + rnd(-40, 40), vy: rnd(-120, -20), life: rnd(.15, .35) });
          if (heat > 420 && speed > 16) { burn = BURN; flare = 0; flash = 1; heat = 0; shakes = 0; bBlow.disabled = false; scratch(.35, .22, 1500); tone(180, .3, .05, 'sawtooth');   // 칙! 하고 확 타오름
            for (let i = 0; i < 14; i++) sparks.push({ x: mx - 8, y: my - 4, vx: rnd(-160, 160), vy: rnd(-220, -40), life: rnd(.2, .5) }); for (let i = 0; i < 4; i++) smoke.push({ x: mx - 6, y: my - 14, vx: rnd(-15, 15), vy: rnd(-60, -30), r: rnd(5, 9), life: .8 });
            if (zoom === 1) setTimeout(() => { if (zoom === 1) zoom = -1; }, 900);
            api.guide(on ? '불이 붙었어요.' : '불이 붙었어요! 꺼지기 전에 초의 심지에 가져다 대세요.'); }
        } else if (e.timeStamp - lastRub > 400) heat = Math.max(0, heat - 40); });
      const up = () => { held = false; drag = null; if (zoom === 1 && !has && tray > .45) api.guide(`성냥 머리 쪽을 눌러 한 개 집어요. (남은 성냥 ${left})`); }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function flame(x, y, s, t, f) {   // f: 막 붙은 순간(0→1) — 하얗게 확 부풀었다가 작게 가라앉음
        const boom = f < 1 ? 1 + 1.4 * (1 - f) ** 2 : 1, fl = 1 + Math.sin(t / 70) * .08 + Math.sin(t / 31) * .05, gr = g.createRadialGradient(x, y - 14 * s, 2, x, y - 14 * s, 70 * s * fl * boom);
        gr.addColorStop(0, `rgba(255,${f < 1 ? 230 : 190},${f < 1 ? 160 : 90},${f < 1 ? .8 : .55})`); gr.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = gr; g.fillRect(x - 160 * s, y - 180 * s, 320 * s, 330 * s);
        g.save(); g.translate(x, y); g.rotate(-ang * .6 + (vx || 0) * -.004); g.scale(s * boom * (1 + Math.sin(t / 53) * .06), s * fl * boom);
        g.fillStyle = f < .4 ? '#ffe6a8' : '#ffb347'; g.beginPath(); g.moveTo(0, -46); g.bezierCurveTo(13, -22, 12, -2, 0, 4); g.bezierCurveTo(-12, -2, -13, -22, 0, -46); g.fill();
        g.fillStyle = f < .4 ? '#ffffff' : '#fff3c4'; g.beginPath(); g.moveTo(0, -28); g.bezierCurveTo(6, -14, 6, -2, 0, 1); g.bezierCurveTo(-6, -2, -6, -14, 0, -28); g.fill();
        g.fillStyle = 'rgba(70,110,200,.55)'; g.beginPath(); g.ellipse(0, 1, 5, 3.5, 0, 0, 7); g.fill(); g.restore(); }
      function drawMatch(x, y, a, lit) { if (!matchIm.complete) return; g.save(); g.translate(x, y); g.rotate(a); g.shadowColor = 'rgba(10,20,40,.45)'; g.shadowBlur = held ? 12 : 3; g.shadowOffsetY = held ? 9 : 2; g.drawImage(matchIm, -10, -27); g.shadowColor = 'transparent';
        if (wear > 0 && !lit && !burnt) { g.fillStyle = `rgba(40,25,20,${wear * .5})`; g.beginPath(); g.ellipse(4, -10, 9, 6, 0, 0, 7); g.fill(); }   // 문지른 자국
        const hk = !lit && !burnt ? Math.min(1, heat / 420) : 0;                    // 문지를수록 머리가 달아올라 붉어짐
        if (hk > .15) { g.fillStyle = `rgba(255,${120 - hk * 60 | 0},40,${(hk * .65).toFixed(3)})`; g.beginPath(); g.ellipse(4, -10, 12, 9, 0, 0, 7); g.fill(); }
        if (burnt || lit) { const bx = lit ? burnX() : Math.max(burnX(), 60);       // 머리부터 탄 자리까지 까맣게, 끝은 숯불처럼 빨갛게
          g.fillStyle = '#231a16'; g.beginPath(); g.ellipse(4, -11, 12, 8, 0, 0, 7); g.fill();
          g.strokeStyle = '#2c211b'; g.lineCap = 'round'; g.lineWidth = 11; g.beginPath(); g.moveTo(14, CL(14)); g.lineTo(bx, CL(bx)); g.stroke();
          g.strokeStyle = 'rgba(120,110,100,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(16, CL(16) - 3); g.lineTo(bx - 6, CL(bx - 6) - 3); g.stroke();   // 재가 하얗게
          if (lit) { const eg = g.createRadialGradient(bx, CL(bx), 1, bx, CL(bx), 12); eg.addColorStop(0, 'rgba(255,170,60,.95)'); eg.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = eg; g.beginPath(); g.arc(bx, CL(bx), 12, 0, 7); g.fill(); } }
        // 손 그림은 그리지 않음 (마우스가 곧 손)

        g.restore(); }
      function frame(t) {
        if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (t - (t0 || t)) / 1000); t0 = t;
        g.clearRect(0, 0, 800, 780); if (!unlit.complete || !unlit.naturalWidth) return;
        if (zoom === 1) zt = Math.min(1, zt + dt * 3.2); else if (zoom === -1) { zt = Math.max(0, zt - dt * 3.2); tray = Math.max(0, tray - dt * 3); if (zt <= 0) zoom = 0; }
        if (trayGo !== null) { tray = Math.max(trayGo, tray - dt * 2.2); if (tray <= trayGo) trayGo = null; }
        vx *= .85; ang += ((held ? .32 : .2) + Math.max(-.35, Math.min(.35, vx * .01)) - ang) * Math.min(1, dt * 9);   // 움직이는 방향 따라 성냥이 살짝 기울어짐
        g.drawImage(unlit, 0, 0);
        if (on) { fade = Math.min(1, fade + dt * 1.6); g.globalAlpha = fade * (.94 + Math.sin(t / 90) * .03 + Math.sin(t / 37) * .03); if (litIm.complete) g.drawImage(litIm, 0, 0);
          if (flameI.complete && flameI.naturalWidth) { const fl = 1 + Math.sin(t / 70) * .05 + Math.sin(t / 23) * .03, hpS = .55 + .45 * guard.hp; g.save(); g.translate(359, 92); g.transform(1, 0, -lean * .9, 1, 0, 0); g.scale(1 + (1 - hpS) * .2, fl * hpS * (1 - Math.abs(lean) * .25)); g.drawImage(flameI, -21, -94, 42, 94); g.restore(); }
          g.globalAlpha = 1; }
        // 창틈 바람: 바람 오는 쪽을 손으로 감싸면 불꽃이 버텨요
        if (guard.st === 'wait' && on && fade >= 1) { guard.next -= dt; if (guard.next <= 0) { guard.st = 'run'; guard.next = 1.5; } }
        if (guard.st === 'run' && on) {
          if (!guard.gust) { guard.next -= dt; if (guard.next <= 0) { const dir = Math.random() < .5 ? 1 : -1; guard.gust = { dir, t: 0, dur: rnd(2.2, 3.2) }; api.guide(dir > 0 ? '왼쪽에서 바람이 와요! 불꽃 왼쪽을 손으로 감싸요.' : '오른쪽에서 바람이 와요! 불꽃 오른쪽을 손으로 감싸요.'); for (let i = 0; i < 4; i++) tone(rnd(90, 140), .5, .025, 'sawtooth'); } }
          else { const G = guard.gust; G.t += dt; const pr = !!hand && Math.hypot(hand.x - 359, hand.y - 60) < 170 && (hand.x - 359) * G.dir < -20, str = Math.sin(Math.min(1, G.t / G.dur) * Math.PI);
            lean += ((pr ? .12 : .85) * G.dir * str - lean) * Math.min(1, dt * 6); if (!pr) guard.hp -= dt * .55 * str; else guard.hp = Math.min(1, guard.hp + dt * .1);
            if (Math.random() < .5) gusts.push({ x: G.dir > 0 ? -20 : 820, y: rnd(10, 260), v: G.dir * rnd(500, 800), life: 1 });
            if (guard.hp <= 0) { on = false; fade = 0; guard.st = 'out'; guard.gust = null; guard.hp = 1; lean = 0; for (let i = 0; i < 8; i++) smoke.push({ x: 359 + rnd(-4, 4), y: 40, vx: rnd(-12, 12), vy: rnd(-70, -35), r: rnd(6, 11), life: 1 }); tone(200, .2, .05, 'sine'); api.guide('훅, 바람에 꺼졌어요. 성냥으로 다시 켜고, 이번엔 손으로 꼭 감싸요.'); }
            else if (G.t >= G.dur) { guard.gust = null; guard.n++; guard.next = rnd(2.5, 4.5); tone(660 + guard.n * 80, .15, .04, 'sine');
              if (guard.n >= 4) { guard.st = 'done'; lean = 0; api.ready(true); api.guide('바람이 멎었어요. 지켜 낸 촛불이 창가에서 조용히 빛나요. 오늘 밤 늦게 돌아오는 우체부 아저씨가 이 불빛을 보고 길을 찾을 거예요.'); }
              else api.guide(`잘 지켰어요! (${guard.n}/4) 또 바람이 올지 몰라요.`); } } }
        if (!guard.gust) lean *= Math.pow(.05, dt);
        if (guard.st === 'run' && hand && on) { g.save(); g.globalAlpha = .35; g.fillStyle = '#f2d7b8'; g.beginPath(); g.ellipse(hand.x, hand.y, 34, 46, (hand.x - 359) * .004, 0, 7); g.fill(); g.restore(); }   // 감싸는 손
        for (let i = gusts.length - 1; i >= 0; i--) { const w = gusts[i]; w.x += w.v * dt; w.life -= dt * .9; if (w.life <= 0 || w.x < -80 || w.x > 880) { gusts.splice(i, 1); continue; } g.strokeStyle = `rgba(255,255,255,${(w.life * .45).toFixed(3)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(w.x, w.y); g.bezierCurveTo(w.x - w.v * .05, w.y - 8, w.x - w.v * .1, w.y + 8, w.x - w.v * .15, w.y); g.stroke(); }
        if (guard.st === 'done') { g.fillStyle = 'rgba(255,214,140,.10)'; g.beginPath(); g.arc(359, 60, 220 + Math.sin(t / 400) * 10, 0, 7); g.fill(); }
        if (burn > 0) { burn -= dt; flare += dt / .55; const fp = flamePt(); if (!on && Math.hypot(fp.x - WICK.x, fp.y - (WICK.y - 4)) < 34) { warm += dt; if (warm > .9) { on = true; api.ready(true); tone(520, .25, .04, 'sine'); api.guide('촛불이 켜졌어요. 성냥은 좌우로 흔들거나 아래 버튼으로 후 불어 꺼 주세요.'); } } else warm = Math.max(0, warm - dt * 1.5);
          if (burn > 0 && burn < BURN * .06) { putOut(); tone(300, .12, .05, 'square'); api.guide(on ? '앗, 뜨거워요! 손끝까지 타서 얼른 껐어요.' : '앗, 뜨거워요! 손끝까지 타서 얼른 껐어요. 성냥갑을 눌러 새 성냥을 꺼내요.'); }
          if (burn <= 0 && !burnt) { burnt = true; bBlow.disabled = true; if (!on) api.guide('성냥이 다 탔어요. 성냥갑을 눌러 새 성냥을 꺼내요.'); } }
        if (!on && warm > 0) { const k = Math.min(1, warm / .9); flame(WICK.x, WICK.y + 6, .12 + .32 * k, t, 1); }   // 심지에 불이 옮겨붙으며 조금씩 커짐
        const r = R();
        if (zt > 0) { g.fillStyle = `rgba(28,22,18,${.55 * ease(zt)})`; g.fillRect(0, 0, 800, 780); }
        if (tray > 0 && trayI.complete) { const tr = trayRect(r); g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 10 * zt; g.shadowOffsetY = 6 * zt; g.drawImage(trayI, tr.x, tr.y, tr.w, tr.h); g.restore(); }   // 서랍(겉 상자 뒤에 그려서 상자 끝에서 나오는 것처럼)
        if (boxIm.complete) { g.save(); g.shadowColor = 'rgba(10,20,40,.5)'; g.shadowBlur = 14 + 14 * zt; g.shadowOffsetY = 8 + 6 * zt; g.drawImage(boxIm, r.x, r.y, r.w, r.h); g.restore();
          g.lineCap = 'round'; for (const m of marks) { g.strokeStyle = `rgba(30,18,12,${m[4]})`; g.lineWidth = r.w * .011; g.beginPath(); g.moveTo(r.x + m[0] * r.w, r.y + m[1] * r.h); g.lineTo(r.x + m[2] * r.w, r.y + m[3] * r.h); g.stroke(); } }
        if (zt > .9 && zoom === 1) { g.fillStyle = 'rgba(255,250,240,.95)'; g.font = '20px "Gowun Batang",serif'; g.textAlign = 'center';
          g.fillText(burn > 0 ? '불이 붙었어요!' : has ? '성냥 머리를 옆면 까만 띠에 대고 쓱 그어요' : tray < .45 ? '↙ 속 서랍을 왼쪽 아래로 밀어서 열어요' : left > 0 ? `성냥 머리를 눌러 한 개 집어요 (남은 ${left})` : '성냥을 다 썼어요', 400, 170);
          if (!has) { g.font = '15px "Gowun Batang",serif'; g.fillText('바깥을 누르면 내려놓아요', 400, 700); } }
        if (has) drawMatch(mx, my, ang, burn > 0);
        if (burn > 0) { const fp = flamePt(); flame(fp.x, fp.y, (.55 + .3 * zt) * Math.min(1, burn / 1.5) * (1 - .25 * (1 - burn / BURN)), t, Math.min(1, flare));
          if (flare < 1 && Math.random() < .6) sparks.push({ x: fp.x, y: fp.y, vx: rnd(-120, 120), vy: rnd(-200, -60), life: rnd(.12, .3) }); }   // 막 붙은 순간 유황이 타닥타닥 튐
        if (flash > 0) { g.fillStyle = `rgba(255,236,190,${(flash * .32).toFixed(3)})`; g.fillRect(0, 0, 800, 780); flash = Math.max(0, flash - dt * 4); }   // 칙! 하고 번쩍
        for (let i = smoke.length - 1; i >= 0; i--) { const s = smoke[i]; s.life -= dt * .7; if (s.life <= 0) { smoke.splice(i, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; s.r += 14 * dt; g.fillStyle = `rgba(225,228,235,${(s.life * .45).toFixed(3)})`; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.28); g.fill(); }
        for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt; if (s.life <= 0) { sparks.splice(i, 1); continue; } s.vy += 600 * dt; const ox = s.x, oy = s.y; s.x += s.vx * dt; s.y += s.vy * dt; g.strokeStyle = `rgba(255,${190 + rnd(0, 50) | 0},110,${Math.min(1, s.life * 4)})`; g.lineWidth = 2; g.beginPath(); g.moveTo(ox, oy); g.lineTo(s.x, s.y); g.stroke(); }   // 짧은 불티 줄
      }
      
      reset(); requestAnimationFrame(frame);
      return { reset, result() { return on ? { lit: 1 } : null; }, stop() { alive = false; } };
    },
  };

  /* ───────── 쿠키 굽기: 틀로 찍고 → 굽고 → 아이싱으로 그리기 ───────── */
  plays.cookie = {
    title: '쿠키 굽기', doneLabel: '접시에 담기', doneMsg: '구운 쿠키를 탁자에 올려 뒀어요.',
    start(board, api) {
      board.className = 'pboard cookie';
      const W = 800, H = 533, can = cv(W, H, 'ckcv'), g = can.getContext('2d'); board.append(can);
      const bar = mk('div', 'pbar'); board.append(bar);
      const plateIm = pic('ck_plate.png'), dough = pic('ck_dough2.jpg'), ovenIm = pic('oven_in2.jpg'), SH = ['star', 'heart', 'round', 'tree'], NAME = { star: '별', heart: '하트', round: '동그라미', tree: '나무' }, ims = {}; SH.forEach(k => { ims[k] = pic('ck_' + k + '.png'); });
      const ST = 132, COLORS = [['#ffffff', '흰색'], ['#d94a3d', '빨강'], ['#3f8f5a', '초록'], ['#f2c94c', '노랑'], ['#f4a7c0', '분홍'], ['#7fb7e6', '하늘']];
      let stage, shape, cuts, bake, baking, tool, last, hover, alive = true, t0 = 0, focus = -1, lineW = 9;
      const btn = (label, fn, cls) => { const b = mk('button', cls || '', label); b.type = 'button'; b.addEventListener('click', fn); bar.append(b); return b; };
      const sized = k => { const im = ims[k]; return { w: ST, h: ST * (im.naturalHeight || 1) / (im.naturalWidth || 1) }; };
      // 틀 테두리(은색)·자른 선 모양을 쿠키 그림의 윤곽에서 만들어요
      const ringCache = {};
      function ring(k, px, col) { const key = k + px + col; if (ringCache[key]) return ringCache[key]; const im = ims[k], s = sized(k), c = cv(ST + 20, ST + 20), x = c.getContext('2d'), m = cv(ST + 20, ST + 20), mx = m.getContext('2d');
        mx.drawImage(im, 10, 10 + (ST - s.h) / 2, s.w, s.h); mx.globalCompositeOperation = 'source-in'; mx.fillStyle = '#000'; mx.fillRect(0, 0, ST + 20, ST + 20);
        for (let a = 0; a < 16; a++) x.drawImage(m, Math.cos(a / 16 * 6.28) * px, Math.sin(a / 16 * 6.28) * px);
        x.globalCompositeOperation = 'destination-out'; x.drawImage(m, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, ST + 20, ST + 20); if (im.complete && im.naturalWidth) ringCache[key] = c; return c; }
      // 굽기 정도에 따라: 허연 반죽 → 노릇노릇 → 갈색 → 탐
      const bakeFilter = b => b < .85 ? `sepia(${(.72 - .4 * b / .85).toFixed(3)}) brightness(${(.98 + .02 * b / .85).toFixed(3)}) saturate(${(.85 + .25 * b / .85).toFixed(3)})` : b <= 1.12 ? `sepia(${(.32 + (b - .85) * .6).toFixed(3)}) saturate(${(1.1 + (b - .85) * 2).toFixed(3)}) brightness(${(1 - (b - .85) * .55).toFixed(3)})` : `sepia(.85) saturate(${Math.max(.9, 1.6 - (b - 1.12) * 1.2).toFixed(3)}) brightness(${Math.max(.28, .85 - (b - 1.12) * 1.4).toFixed(3)})`;
      function cookieCanvas(c, size) {                                            // 쿠키 한 개(구운 색 + 아이싱)
        const im = ims[c.k], s = sized(c.k), o = cv(size, size), x = o.getContext('2d'), k = size / (ST + 20);
        x.filter = 'grayscale(1) brightness(1.25) contrast(.85)'; x.drawImage(im, 10 * k, (10 + (ST - s.h) / 2) * k, s.w * k, s.h * k); x.filter = 'none';
        { const T = [[0, [246, 228, 196]], [.5, [240, 206, 150]], [.85, [244, 174, 86]], [1.1, [204, 118, 48]], [1.35, [104, 58, 30]], [1.7, [50, 32, 24]]]; let j = 0; while (j < T.length - 2 && bake > T[j + 1][0]) j++; const a = T[j], b2 = T[j + 1], u = Math.max(0, Math.min(1, (bake - a[0]) / (b2[0] - a[0]))), tc = a[1].map((v, i) => v + (b2[1][i] - v) * u | 0);
          x.globalCompositeOperation = 'multiply'; x.fillStyle = `rgb(${tc})`; x.fillRect(0, 0, size, size); x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 10 * k, (10 + (ST - s.h) / 2) * k, s.w * k, s.h * k); x.globalCompositeOperation = 'source-over'; }   // 굽는 정도만큼 색을 입힘
        if (c.ice) { x.globalCompositeOperation = 'source-atop'; x.drawImage(c.ice, 0, 0, size, size); x.globalCompositeOperation = 'source-over'; }
        return o;
      }
      const ICE = 360;
      function setStage(s) {
        stage = s; bar.textContent = ''; hover = null; last = null;
        if (s === 1) {
          SH.forEach(k => { const b = btn('', () => { shape = k; paint(); }, 'ckpick cutter'); b.dataset.k = k; b.title = b.ariaLabel = NAME[k] + ' 쿠키틀'; const c = cv(64, 64); b.append(c); b._c = c; });
          btn('오븐에 넣기 ▶', () => { if (cuts.length) setStage(2); }, 'ckoven');
          api.guide('쿠키틀을 골라 반죽을 꾹 눌러 찍어요. 네 개까지 찍을 수 있어요.'); paint();
        } else if (s === 2) {
          bake = 0; baking = true; btn('🧤 꺼내기', takeOut, 'primary');
          api.guide('오븐 창으로 지켜보다가 가장자리가 노릇노릇해지면 꺼내요. 너무 오래 두면 타요.');
        } else if (s === 3) {
          api.ready(true); focus = -1; api.guide('식힌 쿠키예요. 아이싱할 쿠키를 눌러서 크게 봐요.');
        } else if (s === 4) {
          COLORS.forEach(([c, n]) => { const b = btn('', () => { tool = c; paint(); }, 'ckcol'); b.dataset.c = c; b.title = b.ariaLabel = n + ' 아이싱'; b.style.setProperty('--c', c); });
          const sp = btn('알갱이', () => { tool = 'sprinkle'; paint(); }, 'cksp'); sp.dataset.c = 'sprinkle';
          const th = btn('가늘게', () => { lineW = lineW === 9 ? 5 : lineW === 5 ? 14 : 9; th.textContent = lineW === 5 ? '가늘게' : lineW === 9 ? '보통' : '굵게'; }); th.textContent = lineW === 5 ? '가늘게' : lineW === 9 ? '보통' : '굵게';
          btn('지우기', () => { const c = cuts[focus]; c.ice = null; c.iceL = null; c.spr = null; });
          btn('← 다른 쿠키', () => setStage(3));
          if (!tool) tool = '#ffffff'; paint();
          api.guide('짤주머니로 짜듯이 누른 채 그려요. 알갱이는 톡톡 눌러 뿌려요.');
        }
      }
      function paint() {
        bar.querySelectorAll('.ckpick').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.k === shape)); const x = b._c.getContext('2d'); x.clearRect(0, 0, 64, 64); const r = ring(b.dataset.k, 3, '#9aa3ab'); x.drawImage(r, 2, 2, 60, 60); });
        bar.querySelectorAll('.ckcol,.cksp').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.c === tool)));
        const o = bar.querySelector('.ckoven'); if (o) o.disabled = !cuts.length;
      }
      function takeOut() {
        if (!baking) return; baking = false;
        if (bake < .55) { baking = true; return api.guide('아직 허여멀개요. 조금만 더 기다려요.'); }
        api.guide(bake > 1.3 ? '앗, 많이 탔어요. 그래도 아이싱으로 덮으면 괜찮아요! "처음부터"로 다시 구울 수도 있어요.' : bake > 1.12 ? '조금 진하게 구워졌어요. 바삭하겠어요!' : bake < .78 ? '살짝 덜 구워졌지만 말랑해서 맛있어요.' : '노릇노릇 딱 좋아요!');
        setTimeout(() => alive && setStage(3), 1300); bar.textContent = '';
      }
      window.__ckBake = v => { if (v !== undefined) bake = v; return bake; };
      function reset() { cuts = []; shape = 'star'; bake = 0; baking = false; tool = '#ffffff'; api.ready(false); setStage(1); }
      // 위치
      const traySlot = i => ({ x: W / 2 + (i - (cuts.length - 1) / 2) * 150, y: 300 });
      const plateSlot = i => ({ x: W / 2 + (i - (cuts.length - 1) / 2) * 170, y: 280 });
      function stamp(q) {
        if (cuts.length >= 4) return api.guide('네 개를 다 찍었어요. 이제 오븐에 넣어 볼까요?');
        if (q.x < 150 || q.x > 650 || q.y < 95 || q.y > 440) return api.guide('반죽 안쪽을 눌러 주세요.');
        if (cuts.some(c => Math.hypot(c.x - q.x, c.y - q.y) < ST * .85)) return api.guide('이미 찍은 자리와 겹쳐요. 옆의 빈 반죽에 찍어 보세요.');
        cuts.push({ k: shape, x: q.x, y: q.y, ice: null, press: 1 }); paint(); tone(180, .12, .08, 'triangle');
        api.guide(cuts.length < 4 ? `${cuts.length}개 찍었어요. 더 찍거나 오븐에 넣어요.` : '네 개를 다 찍었어요. 오븐에 넣어요.');
      }
      function icePt(e) { const q = at(e, can), z = 380; return { x: (q.x - (W / 2 - z / 2)) / z * ICE, y: (q.y - (H / 2 - z / 2 - 10)) / z * ICE }; }
      // 아이싱: 같은 색끼리는 한 덩어리로 녹아 합쳐지고, 그 덩어리 전체에 한 번만 그림자·윤기를 넣어요
      const tintC = cv(ICE, ICE), tintG = tintC.getContext('2d'), tmpC = cv(ICE, ICE), tmpG = tmpC.getContext('2d');
      function tint(m, col, dx, dy, cut, cdx, cdy) { tintG.globalCompositeOperation = 'source-over'; tintG.clearRect(0, 0, ICE, ICE); tintG.drawImage(m, dx || 0, dy || 0); tintG.globalCompositeOperation = 'source-in'; tintG.fillStyle = col; tintG.fillRect(0, 0, ICE, ICE); if (cut) { tintG.globalCompositeOperation = 'destination-out'; tintG.drawImage(m, cdx, cdy); } tintG.globalCompositeOperation = 'source-over'; return tintC; }
      function composeIce(c) {
        if (!c.ice) c.ice = cv(ICE, ICE); const x = c.ice.getContext('2d'); x.clearRect(0, 0, ICE, ICE);
        for (const L of c.iceL || []) {
          x.save(); x.filter = 'blur(1.6px)'; x.drawImage(tint(L.m, 'rgba(70,32,10,.42)', 1, 2.8), 0, 0); x.restore();               // 쿠키 위에 살짝 뜬 그림자
          x.drawImage(tint(L.m, L.col), 0, 0);                                                                                       // 한 덩어리로 합쳐진 아이싱
          x.save(); x.globalAlpha = .26; x.filter = 'blur(1.6px)'; x.drawImage(tint(L.m, '#3a2414', 0, 0, true, -2.2, -3.2), 0, 0); x.restore(); x.save(); x.globalCompositeOperation = 'destination-over'; x.restore();   // 아래쪽 도톰한 그늘
          x.save(); x.globalAlpha = .6; x.filter = 'blur(.9px)'; x.drawImage(tint(L.m, '#ffffff', 0, 0, true, 1.8, 2.6), 0, 0); x.restore();  // 위쪽 가장자리 윤기
          { tintG.clearRect(0, 0, ICE, ICE); tintG.drawImage(L.m, 0, 0); tintG.globalCompositeOperation = 'source-in'; const gg = tintG.createLinearGradient(0, 0, ICE, ICE); gg.addColorStop(0, 'rgba(255,255,255,.28)'); gg.addColorStop(.45, 'rgba(255,255,255,.04)'); gg.addColorStop(.7, 'rgba(255,255,255,.16)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); tintG.fillStyle = gg; tintG.fillRect(0, 0, ICE, ICE); tintG.globalCompositeOperation = 'source-over'; x.drawImage(tintC, 0, 0); }   // 매끈한 표면 광택
        }
        if (c.spr) x.drawImage(c.spr, 0, 0);
      }
      // 손을 떼면 젖은 아이싱이 살짝 퍼지며 가까운 선 사이 틈이 메워져 매끈한 한 면이 돼요
      function settle(c) { const L = c && c.iceL && c.iceL[c.iceL.length - 1]; if (!L) return; const r = Math.max(3, lineW * .55);
        tmpG.clearRect(0, 0, ICE, ICE); tmpG.filter = `blur(${r}px)`; tmpG.drawImage(L.m, 0, 0); tmpG.filter = 'none';
        const id = tmpG.getImageData(0, 0, ICE, ICE), d = id.data; for (let i = 3; i < d.length; i += 4) { const a = d[i], v = a < 104 ? 0 : a > 152 ? 255 : (a - 104) / 48 * 255; /* 가운데(128) 기준이라 누를 때마다 아이싱이 번져 커지지 않음 */ d[i - 3] = d[i - 2] = d[i - 1] = 0; d[i] = v; }
        const mg = L.m.getContext('2d'); mg.clearRect(0, 0, ICE, ICE); tmpG.putImageData(id, 0, 0); mg.drawImage(tmpC, 0, 0); composeIce(c); }
      function ice(a, b) {
        const c = cuts[focus];
        if (tool === 'sprinkle') { if (!c.spr) c.spr = cv(ICE, ICE); const x = c.spr.getContext('2d'), cs = ['#d94a3d', '#3f8f5a', '#f2c94c', '#ffffff', '#f4a7c0', '#6fb6e0']; for (let i = 0; i < 6; i++) { x.save(); x.translate(b.x + rnd(-18, 18), b.y + rnd(-18, 18)); x.rotate(rnd(0, 3.14)); x.shadowColor = 'rgba(60,30,10,.3)'; x.shadowOffsetY = 1; x.shadowBlur = 1; x.fillStyle = cs[i % cs.length]; x.beginPath(); x.roundRect(-5, -1.8, 10, 3.6, 1.8); x.fill(); x.restore(); } composeIce(c); return; }
        if (!c.iceL) c.iceL = []; let L = c.iceL[c.iceL.length - 1]; if (!L || L.col !== tool) { L = { col: tool, m: cv(ICE, ICE) }; c.iceL.push(L); }
        const x = L.m.getContext('2d'); x.lineCap = x.lineJoin = 'round'; x.strokeStyle = '#000'; x.lineWidth = lineW; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x + .01, b.y); x.stroke();
        composeIce(c);
      }
      can.addEventListener('pointerdown', e => {
        const q = at(e, can); e.preventDefault();
        if (stage === 1) stamp(q);
        else if (stage === 3) { const i = cuts.findIndex((c, i) => { const p = plateSlot(i); return Math.hypot(q.x - p.x, q.y - p.y) < 80; }); if (i >= 0) { focus = i; setStage(4); } }
        else if (stage === 4) { can.setPointerCapture(e.pointerId); last = icePt(e); ice(last, last); }
      });
      can.addEventListener('pointermove', e => { const q = at(e, can); hover = q; if (stage === 4 && last && tool !== 'sprinkle') { const p = icePt(e); ice(last, p); last = p; } });
      const up = () => { if (last && stage === 4 && tool !== 'sprinkle' && focus >= 0) settle(cuts[focus]); last = null; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up); can.addEventListener('pointerleave', () => { hover = null; });
      function frame(t) {
        if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (t - (t0 || t)) / 1000); t0 = t;
        g.clearRect(0, 0, W, H);
        if (stage === 1) {
          if (dough.complete && dough.naturalWidth) g.drawImage(dough, 0, 0, W, H);   // 굽기 전 연한 크림색 반죽
          for (const c of cuts) { const r = ring(c.k, 2.2, 'rgba(84,48,24,.85)'), r2 = ring(c.k, 3, 'rgba(255,255,255,.22)'); c.press = Math.max(0, c.press - dt * 3);
            g.drawImage(r2, c.x - (ST + 20) / 2 - 1, c.y - (ST + 20) / 2 - 1); g.drawImage(r, c.x - (ST + 20) / 2, c.y - (ST + 20) / 2); }      // 찍어 낸 반죽: 자른 선만 보여요
          if (hover && cuts.length < 4) { const r = ring(shape, 4, '#b9c1c8'), r3 = ring(shape, 4, 'rgba(0,0,0,.25)'); g.drawImage(r3, hover.x - (ST + 20) / 2 + 4, hover.y - (ST + 20) / 2 + 8); g.drawImage(r, hover.x - (ST + 20) / 2, hover.y - (ST + 20) / 2); }
          return;
        }
        if (stage === 2) {                                                        // 따뜻한 오븐 속
          if (baking) { bake += dt / 13; if (bake > 1.6) { api.guide('연기가 나요! 얼른 꺼내요!'); } }
          const fl = .9 + Math.sin(t / 180) * .05 + Math.sin(t / 67) * .03;
          // 오븐 안을 가까이 들여다본 화면 (영상처럼 쿠키가 크게 보이고 뒤는 살짝 흐림)
          if (ovenIm.complete && ovenIm.naturalWidth) { const kx = ovenIm.naturalWidth / 1200; g.save(); g.filter = 'blur(2.4px)'; g.drawImage(ovenIm, 290 * kx, 345 * kx, 600 * kx, 400 * kx, 0, 0, W, H); g.restore(); } else { g.fillStyle = '#c8601f'; g.fillRect(0, 0, W, H); }
          const TY = 262, SQ = .42, rise = bake < .35 ? Math.sin(bake / .35 * Math.PI / 2) : bake < .8 ? 1 - (bake - .35) / .45 * .6 : .4, puff = 1 + rise * .07, thick = 3 + rise * 6;   // 반죽이 부풀었다가 살짝 꺼짐
          const edge = Math.max(0, Math.min(1, (bake - .45) / .7));   // 가장자리부터 갈색으로
          cuts.forEach((c, i) => { const n = cuts.length, gap = Math.min(190, 720 / Math.max(1, n)), x = W / 2 + (i - (n - 1) / 2) * gap, sz = Math.min(176, gap * .92) * puff, o = cookieCanvas(c, 176);
            const t2 = cv(176, 176), tg = t2.getContext('2d'); tg.drawImage(o, 0, 0); tg.globalCompositeOperation = 'source-atop'; const rg = tg.createRadialGradient(88, 88, 30, 88, 88, 92); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(.62, 'rgba(0,0,0,0)'); rg.addColorStop(1, `rgba(110,48,12,${.65 * edge})`); tg.fillStyle = rg; tg.fillRect(0, 0, 176, 176);
            g.save(); g.filter = 'blur(5px)'; g.fillStyle = 'rgba(50,15,5,.35)'; g.beginPath(); g.ellipse(x + 2, TY + 6, sz * .36, sz * SQ * .3, 0, 0, 7); g.fill(); g.restore();   // 팬에 닿은 그림자
            const sc = bake < .85 ? [216 - 40 * bake / .85, 190 - 60 * bake / .85, 150 - 70 * bake / .85] : bake < 1.15 ? [182 - 40 * (bake - .85) / .3, 130 - 40 * (bake - .85) / .3, 80 - 30 * (bake - .85) / .3] : [Math.max(50, 142 - (bake - 1.15) * 200), Math.max(36, 90 - (bake - 1.15) * 120), Math.max(28, 50 - (bake - 1.15) * 50)];
            const side = cv(176, 176), sg2 = side.getContext('2d'); sg2.drawImage(t2, 0, 0); sg2.globalCompositeOperation = 'source-in'; const sgr = sg2.createLinearGradient(0, 0, 0, 176); sgr.addColorStop(0, `rgb(${sc.map(v => v * .82 | 0).join(',')})`); sgr.addColorStop(1, `rgb(${sc.map(v => v * .58 | 0).join(',')})`); sg2.fillStyle = sgr; sg2.fillRect(0, 0, 176, 176);
            for (let d = thick; d > 0; d -= 1) { g.save(); g.translate(x, TY - d + thick); g.scale(1, SQ); g.globalAlpha = 1; g.drawImage(side, -sz / 2, -sz / 2, sz, sz); g.restore(); }   // 쿠키 옆면(두께)
            g.save(); g.translate(x, TY - thick); g.scale(1, SQ * (1 + rise * .1)); g.drawImage(t2, -sz / 2, -sz / 2, sz, sz);
            g.globalCompositeOperation = 'soft-light'; const hl = g.createRadialGradient(-sz * .18, -sz * .22, 2, 0, 0, sz * .6); hl.addColorStop(0, 'rgba(255,236,190,.7)'); hl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = hl; g.globalAlpha = .9; g.beginPath(); g.ellipse(0, 0, sz * .45, sz * .45, 0, 0, 7); g.fill(); g.restore(); });
          // 오븐 불빛
          const heat = g.createRadialGradient(W * .3, 60, 30, W / 2, 200, 520); heat.addColorStop(0, `rgba(255,190,100,${.2 * fl})`); heat.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = heat; g.fillRect(0, 0, W, H);
          // 뜨거운 공기가 아른아른 올라옴
          if (baking) { g.save(); g.globalAlpha = .05; for (let k = 0; k < 6; k++) { const hx = 200 + k * 80 + Math.sin(t / 300 + k) * 12, hy = 330 - ((t / 12 + k * 40) % 140); g.strokeStyle = 'rgba(255,230,190,1)'; g.lineWidth = 3; g.beginPath(); g.moveTo(hx, hy + 40); g.bezierCurveTo(hx - 10, hy + 25, hx + 10, hy + 15, hx, hy); g.stroke(); } g.restore(); }
          // 오븐 문 유리 반사
          if (0) { g.save(); g.globalAlpha = .06; const gl = g.createLinearGradient(100, 90, 500, 420); gl.addColorStop(0, '#fff'); gl.addColorStop(.3, 'rgba(255,255,255,0)'); gl.addColorStop(.55, 'rgba(255,255,255,.6)'); gl.addColorStop(.62, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(85, 95, 630, 365); g.restore(); }
          if (bake > 1.45) { g.fillStyle = `rgba(60,50,45,${Math.min(.5, (bake - 1.45) * 1.2)})`; g.fillRect(0, 0, W, H); }
          return;
        }
        // 식힘·아이싱
        g.fillStyle = '#efe4d2'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(160,120,80,.08)'; for (let y = 0; y < H; y += 26) g.fillRect(0, y, W, 13);
        if (stage === 3) {
          cuts.forEach((c, i) => { const p = plateSlot(i), o = cookieCanvas(c, 160), hov = hover && Math.hypot(hover.x - p.x, hover.y - p.y) < 80; g.save(); g.shadowColor = 'rgba(60,35,15,.35)'; g.shadowBlur = hov ? 18 : 8; g.shadowOffsetY = hov ? 10 : 4; g.drawImage(o, p.x - 80, p.y - 80 - (hov ? 6 : 0), 160, 160); g.restore(); });
          g.fillStyle = 'rgba(80,55,35,.7)'; g.font = '20px Gowun Batang,serif'; g.textAlign = 'center'; g.fillText('아이싱할 쿠키를 눌러요', W / 2, 470);
        } else if (stage === 4 && cuts[focus]) {
          const z = 380, o = cookieCanvas(cuts[focus], z); g.save(); g.shadowColor = 'rgba(60,35,15,.35)'; g.shadowBlur = 16; g.shadowOffsetY = 8; g.drawImage(o, W / 2 - z / 2, H / 2 - z / 2 - 10, z, z); g.restore();
          cuts.forEach((c, i) => { const o2 = cookieCanvas(c, 60); g.globalAlpha = i === focus ? 1 : .55; g.drawImage(o2, 20 + i * 66, H - 74, 60, 60); g.globalAlpha = 1; });
        }
      }
      reset(); requestAnimationFrame(frame);
      return {
        reset,
        result() {
          if (stage < 3) return null; const o = cv(170, 160), c = o.getContext('2d'), at2 = [[22, 26], [80, 20], [26, 76], [82, 70]];   // 내가 구운 쿠키를 접시에 담아서
          if (plateIm.complete && plateIm.naturalWidth) c.drawImage(plateIm, 0, 0, 170, 157);
          cuts.forEach((cu, i) => c.drawImage(cookieCanvas(cu, 140), at2[i][0] - 4, at2[i][1] - 4, 72, 72));
          return { img: o.toDataURL('image/png'), one: cuts[0] ? cookieCanvas(cuts[0], 140).toDataURL('image/png') : null };
        },
        stop() { alive = false; },
      };
    },
  };

  /* ───────── 태엽 기차 ───────── */
  plays.train = {
    title: '태엽 기차 감기', doneLabel: '마을에서 달리게 하기', doneMsg: '기차가 연못 둘레를 달려요. 기차를 누르면 언제든 한 바퀴 더 돌아요.',
    start(board, api) {
      board.className = 'pboard train';
      const rail = mk('div', 'rail'), tr = new Image(); tr.src = 'assets/it_train.png'; tr.alt = '장난감 기차'; tr.className = 'ptrain'; rail.append(tr);
      const low = mk('div', 'windrow'), key = mk('button', 'key', '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="13" fill="#c9a24a" stroke="#8a6a25" stroke-width="3"/><path d="M50 37V16M50 63v21" stroke="#8a6a25" stroke-width="7" stroke-linecap="round"/><ellipse cx="50" cy="13" rx="17" ry="10" fill="none" stroke="#c9a24a" stroke-width="7"/><ellipse cx="50" cy="87" rx="17" ry="10" fill="none" stroke="#c9a24a" stroke-width="7"/></svg>');
      key.type = 'button'; key.setAttribute('aria-label', '태엽. 누른 채 시계 방향으로 돌리기');
      const side = mk('div', 'windside'), gauge = mk('div', 'gauge', '<i></i><b></b>'), go = mk('button', 'go', '놓기'); go.type = 'button'; side.append(gauge, go); low.append(key, side); board.append(rail, low);
      const TURNS = 4; let total, ran, lastA = null, g = 0, laps = 0, timer = 0;
      const paint = () => {
        g = total / (Math.PI * 2 * TURNS); key.firstChild.style.transform = `rotate(${total}rad)`;
        gauge.firstChild.style.width = Math.min(100, g * 100) + '%'; gauge.classList.toggle('good', g >= .6 && g <= 1); gauge.classList.toggle('hot', g > .9);
        gauge.lastChild.textContent = g > .9 ? '조심, 거의 다 감겼어요' : g >= .6 ? '딱 좋아요' : g > .05 ? '감는 중…' : '';
        go.disabled = g < .15 || ran;
      };
      function reset() { clearTimeout(timer); total = 0; ran = false; laps = 0; tr.className = 'ptrain'; tr.style.transition = 'none'; tr.style.transform = ''; api.ready(false); paint(); api.guide('열쇠를 누른 채 시계 방향으로 빙글빙글 돌려 태엽을 감아 주세요. 끝까지 감으면 안 돼요.'); }
      function wind(d) {
        if (ran || d <= 0) return; const before = Math.floor(total / (Math.PI / 4)); total += d;
        if (Math.floor(total / (Math.PI / 4)) !== before) { key.classList.remove('tick'); void key.offsetWidth; key.classList.add('tick'); }
        if (total > Math.PI * 2 * TURNS * 1.08) {                                  // 너무 감으면 팅 하고 풀림
          total = 0; board.classList.remove('snap'); void board.offsetWidth; board.classList.add('snap'); api.guide('앗, 너무 감아서 태엽이 팅 하고 풀렸어요. 살살 다시 감아 보세요.');
        }
        paint();
      }
      const ka = e => { const r = key.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); };
      let moved = false;
      key.addEventListener('pointerdown', e => { e.preventDefault(); key.setPointerCapture(e.pointerId); lastA = ka(e); moved = false; });
      key.addEventListener('pointermove', e => { if (lastA === null) return; const a = ka(e); let d = a - lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; lastA = a; if (Math.abs(d) > .02) moved = true; wind(d); });
      key.addEventListener('pointerup', () => { if (lastA !== null && !moved) wind(Math.PI / 4); lastA = null; });       // 끌지 않고 눌러도 조금씩 감김
      key.addEventListener('pointercancel', () => { lastA = null; });
      key.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); wind(Math.PI / 4); } });
      go.addEventListener('click', () => {
        if (ran || g < .15) return; ran = true; laps = 1 + Math.round(Math.min(1, g) * 2); go.disabled = true;
        const dur = 2.6 - Math.min(1, g) * 1.2; tr.classList.add('run'); tr.style.transition = `transform ${dur}s cubic-bezier(.3,0,.7,1)`; tr.style.transform = `translateX(calc(-1 * (${rail.clientWidth}px + 110%)))`;
        const unwind = setInterval(() => { total = Math.max(0, total - Math.PI * 2 * TURNS / (dur * 30)); key.firstChild.style.transform = `rotate(${total}rad)`; gauge.firstChild.style.width = Math.min(100, total / (Math.PI * 2 * TURNS) * 100) + '%'; if (total <= 0) clearInterval(unwind); }, 33);
        timer = setTimeout(() => { clearInterval(unwind); api.ready(true); api.guide(`칙칙폭폭! 이만큼 감았으면 연못을 ${laps}바퀴 돌 수 있어요.`); }, dur * 1000);
      });
      reset();
      return { reset, result() { return laps ? { laps } : null; }, stop() { clearTimeout(timer); } };
    },
  };


  // ── 엽서 조각 맞추기: 흩어진 조각을 끌어다 맞추면 딱 붙는다. 조각 수를 골라 오래 할 수도 있다.
  plays.puzzle = {
    title: '엽서 조각 맞추기', doneLabel: '엽서 간직하기', doneMsg: '마을 엽서를 탁자에 올려 뒀어요.',
    start(board, api) {
      board.className = 'pboard puzzle';
      const AW = 1200, AH = 780, W = 780, H = 520, FX = 210, FY = 40;            // 놀이판, 엽서 크기, 엽서 자리
      const area = mk('div', 'pzarea'), bar = mk('div', 'pbar'), img = pic('postcard.jpg'); board.append(area, bar);
      let cols = 4, rows = 3, left = 0, alive = true, top = 5;
      const sizes = [[4, 3, '12조각'], [6, 4, '24조각'], [8, 6, '48조각']];
      sizes.forEach(([c, r, t]) => { const b = mk('button', '', t); b.type = 'button'; b.addEventListener('click', () => { cols = c; rows = r; build(); }); bar.append(b); });
      function edge(g, x1, y1, x2, y2, t, k) {                                    // 한 변: t가 1이면 볼록, -1이면 오목, 0이면 반듯
        if (!t) return g.lineTo(x2, y2);
        const L = Math.hypot(x2 - x1, y2 - y1), dx = (x2 - x1) / L, dy = (y2 - y1) / L, nx = dy, ny = -dx, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const ax = mx - dx * k * .5, ay = my - dy * k * .5, bx = mx + dx * k * .5, by = my + dy * k * .5, h = t * k * 2.1;
        g.lineTo(ax, ay); g.bezierCurveTo(ax - dx * k * .7 + nx * h, ay - dy * k * .7 + ny * h, bx + dx * k * .7 + nx * h, by + dy * k * .7 + ny * h, bx, by); g.lineTo(x2, y2);
      }
      function build() {
        area.textContent = ''; top = 5;
        const frame = mk('div', 'pzframe'); frame.style.cssText = `left:${FX / AW * 100}%;top:${FY / AH * 100}%;width:${W / AW * 100}%;height:${H / AH * 100}%`; area.append(frame);
        [...bar.children].forEach((b, i) => b.setAttribute('aria-pressed', sizes[i][0] === cols));
        const pw = W / cols, ph = H / rows, k = Math.min(pw, ph) * .22, m = Math.ceil(k * 1.7);
        const V = [], Hh = []; for (let r = 0; r < rows; r++) { V.push([]); Hh.push([]); for (let c = 0; c < cols; c++) { V[r].push(Math.random() < .5 ? 1 : -1); Hh[r].push(Math.random() < .5 ? 1 : -1); } }
        left = cols * rows; api.ready(false); api.guide(`조각을 끌어다 제자리에 놓으면 딱 붙어요. 남은 조각 ${left}개`);
        const make = () => {
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const can = cv(Math.round(pw + m * 2), Math.round(ph + m * 2), 'pz'), g = can.getContext('2d');
            g.beginPath(); g.moveTo(m, m);
            edge(g, m, m, m + pw, m, r > 0 ? -Hh[r - 1][c] : 0, k); edge(g, m + pw, m, m + pw, m + ph, c < cols - 1 ? V[r][c] : 0, k);
            edge(g, m + pw, m + ph, m, m + ph, r < rows - 1 ? Hh[r][c] : 0, k); edge(g, m, m + ph, m, m, c > 0 ? -V[r][c - 1] : 0, k); g.closePath();
            g.save(); g.clip(); g.drawImage(img, m - c * pw, m - r * ph, W, H); g.restore();
            g.strokeStyle = 'rgba(255,250,240,.55)'; g.lineWidth = 1.5; g.stroke();
            const tx = FX + c * pw - m, ty = FY + r * ph - m; let x, y;
            do { x = rnd(0, AW - can.width); y = rnd(0, AH - can.height); } while (x > FX - pw * .7 && x < FX + W - pw * .3 && y < FY + H - ph * .6);   // 엽서 자리 밖에 흩어 놓기
            const put = () => { can.style.left = x / AW * 100 + '%'; can.style.top = y / AH * 100 + '%'; };
            can.style.width = can.width / AW * 100 + '%'; put(); area.append(can);
            let d = null;
            can.addEventListener('pointerdown', e => { const q = area.getBoundingClientRect(); d = { id: e.pointerId, ox: (e.clientX - q.left) / q.width * AW - x, oy: (e.clientY - q.top) / q.height * AH - y }; can.setPointerCapture(e.pointerId); can.style.zIndex = ++top; can.classList.add('hold'); e.preventDefault(); });
            can.addEventListener('pointermove', e => { if (!d || d.id !== e.pointerId) return; const q = area.getBoundingClientRect(); x = Math.max(-m, Math.min(AW - can.width + m, (e.clientX - q.left) / q.width * AW - d.ox)); y = Math.max(-m, Math.min(AH - can.height + m, (e.clientY - q.top) / q.height * AH - d.oy)); put(); });
            const up = e => {
              if (!d || d.id !== e.pointerId) return; d = null; can.classList.remove('hold');
              if (Math.hypot(x - tx, y - ty) < Math.max(18, pw * .22)) {                // 제자리 근처면 딱 붙음
                x = tx; y = ty; put(); can.classList.add('fit'); can.style.zIndex = 2; left--;
                api.guide(left ? `딱! 남은 조각 ${left}개` : '다 맞췄어요! 마을 엽서가 완성됐어요.'); if (!left) { area.classList.add('donepz'); api.ready(true); }
              }
            };
            can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
          }
        };
        if (img.complete && img.naturalWidth) make(); else img.addEventListener('load', () => alive && make(), { once: true });
      }
      build();
      return { reset: build, result() { return left === 0 ? { done: 1, pieces: cols * rows } : null; }, stop() { alive = false; } };
    },
  };

  // ── 붕어빵 굽기: 국자로 반죽을 주르륵 부으면 붓는 자리부터 퍼져 차오르고(넘치면 틀 위로 흘러넘침) → 팥 → 덮기 → 뚜껑 닫고 굽기(지글지글, 김, 기포) → 뒤집기 → 꺼내기
  plays.bungeo = {
    title: '붕어빵 굽기', doneLabel: '탁자에 올리기', doneMsg: '갓 구운 붕어빵 봉투를 탁자에 올려 뒀어요.',
    start(board, api) {
      board.className = 'pboard bpp'; const pw = board.closest('.panel-wrap'); pw && pw.classList.add('xwide');
      const W = 900, H = 600, can = cv(W, H, 'bpcv'), g = can.getContext('2d'), side = mk('div', 'bpside'); board.append(can, side);
      const mold = pic('bp_mold.jpg'), fishI = pic('bp_fish.png'), bagI = pic('bp_bag.png');
      const CAV = [[141, 94, 204, 144], [348, 94, 191, 130], [539, 87, 195, 134], [151, 248, 204, 134], [358, 231, 195, 137], [556, 228, 194, 130], [157, 389, 208, 130], [368, 375, 195, 144], [570, 365, 194, 131]];
      const SPILL = cv(W, H), sg = SPILL.getContext('2d');
      let C, tool = 'batter', fk = 'bean', pipe = null, shop = false, orders = [], coins = 0, served = 0, nextOrder = 3, popups = [], lid = false, down = 0, flipT = 0, ptr = null, press = false, bag = [], pack = [], alive = true, t0 = 0, steam = [], drops = [], lastSz = 0, lastPour = 0, peek = 0;
      function shape(c) { if (c.sh || !fishI.complete) return c.sh; const [, , w, h] = c.b, t = cv(w, h); t.getContext('2d').drawImage(fishI, 0, 0, w, h); const d = t.getContext('2d').getImageData(0, 0, w, h).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 100) n++; c.area = n; return (c.sh = t); }
      const newCav = b => { const [, , w, h] = b, m = cv(w, h), fc = cv(w, h); return { b, m, mg: m.getContext('2d'), fc, fg: fc.getContext('2d'), fillN: 0, kinds: {}, sx: 0, sy: 0, cov: 0, over: 0, bean: 0, beanCov: 0, ck: [0, 0], out: false, bub: [] }; };
      function coverage(c) { const [, , w, h] = c.b, d = c.mg.getImageData(0, 0, w, h).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 100) n++; return Math.min(1, n / (c.area || 1)); }
      const reset = () => { C = CAV.map(newCav); sg.clearRect(0, 0, W, H); lid = false; down = 0; bag = []; pack = []; tool = 'batter'; peek = 0; orders = []; coins = 0; served = 0; nextOrder = 3; ui(); api.ready(false); api.guide('주전자를 칸 위에서 누르고 있으면 반죽이 주르륵 흘러요. 칸을 반쯤 채우고 짤주머니로 팥이나 슈크림을 짠 다음 다시 덮어요.'); };
      const hit = q => C.findIndex(c => !c.out && q.x > c.b[0] && q.x < c.b[0] + c.b[2] && q.y > c.b[1] && q.y < c.b[1] + c.b[3]);
      can.addEventListener('pointerdown', e => { ptr = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId); press = true; const k = hit(ptr);
        if (lid || flipT) return;
        if (shop && !lid) { const oi = orderAt(ptr); if (oi >= 0) { serve(oi); return; }
          const ri = rackAt(ptr); if (ri >= 0) { pack.push(bag.splice(ri, 1)[0]); tone(520 + pack.length * 40, .08, .05, 'triangle'); scratch(.06, .04, 1800); api.guide(`봉투에 ${pack.length}마리 담았어요. 주문한 손님 카드를 누르면 봉투째 건네요.`); return; }
          if (ptr.x > 770 && ptr.y > 420 && pack.length) { bag.push(...pack); pack = []; tone(300, .1, .05, 'sine'); api.guide('봉투를 비워서 보온대에 다시 올렸어요.'); return; } }
        if (tool === 'fill' && k >= 0) { const c = C[k]; if (c.cov < .3) api.guide('먼저 반죽을 반쯤 부어요.'); else if ((c.top || 0) > 0) api.guide('이미 반죽으로 덮었어요. 다른 칸에 짜요.'); else { pipe = { k, last: { x: ptr.x - c.b[0], y: ptr.y - c.b[1] } }; squeeze(c, pipe.last, pipe.last); } }
        if (tool === 'take' && k >= 0) { const c = C[k]; if (c.cov > .5 && c.ck[0] > .3 && c.ck[1] > .3) { c.out = true; if (bag.length >= 14) { c.out = false; api.guide('보온대가 꽉 찼어요. 손님에게 먼저 건네요.'); return; } bag.push({ ck: [...c.ck], fill: fillOf(c) }); tone(660, .1, .06, 'sine'); ui(); api.ready(bag.length + served >= 3); if (shop) api.guide('보온대에 올려 따뜻하게 두었어요. 손님이 오면 보온대의 붕어빵을 눌러 봉투에 담아요.'); } else api.guide('아직 덜 익었어요. 뚜껑을 닫고 양쪽을 다 구워요.'); } });
      can.addEventListener('pointermove', e => { ptr = at(e, can); if (pipe && press) { const c = C[pipe.k], q = { x: ptr.x - c.b[0], y: ptr.y - c.b[1] }; if (Math.hypot(q.x - pipe.last.x, q.y - pipe.last.y) > 2) { squeeze(c, pipe.last, q); pipe.last = q; } } });
      // 짤주머니: 누른 채 움직이는 대로 팥·슈크림이 짜져 나와요 (붕어빵 모양 안에만)
      function squeeze(c, a, b2) { shape(c); const x = c.fg, d = Math.hypot(b2.x - a.x, b2.y - a.y), n = Math.max(1, Math.ceil(d / 3)), bean = fk === 'bean';
        for (let i = 0; i <= n; i++) { const px = a.x + (b2.x - a.x) * i / n, py = a.y + (b2.y - a.y) * i / n, r = 9 + Math.sin((c.fillN + i) * .7) * 1.5;
          if (bean) { x.fillStyle = '#4a201c'; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); x.fillStyle = 'rgba(120,50,45,.85)'; for (let k = 0; k < 2; k++) { x.beginPath(); x.arc(px + rnd(-r, r) * .6, py + rnd(-r, r) * .6, rnd(1.8, 3.2), 0, 7); x.fill(); } x.fillStyle = 'rgba(255,220,210,.25)'; x.beginPath(); x.arc(px - r * .3, py - r * .35, r * .25, 0, 7); x.fill(); }
          else { const gr = x.createRadialGradient(px - r * .3, py - r * .3, 1, px, py, r); gr.addColorStop(0, '#fff3c4'); gr.addColorStop(.6, '#f2cf72'); gr.addColorStop(1, '#d9a948'); x.fillStyle = gr; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); } }
        x.globalCompositeOperation = 'destination-in'; x.drawImage(c.sh, 0, 0); x.globalCompositeOperation = 'source-over';
        c.sx = (c.sx * c.fillN + b2.x * d) / (c.fillN + d || 1); c.sy = (c.sy * c.fillN + b2.y * d) / (c.fillN + d || 1); c.fillN += d + .5; c.kinds[fk] = 1; c.bean = 1; c.top = 0; c.bx = c.sx; c.by = c.sy;
        if (Math.random() < .35) tone(bean ? rnd(150, 190) : rnd(260, 320), .06, .03, 'sine'); }
      const up = () => { press = false; if (pipe) { const c = C[pipe.k]; pipe = null; api.guide(c.fillN > 160 ? '듬뿍 짰어요! 주전자로 반죽을 부어 위를 덮어요.' : '조금 더 짜도 돼요. 다 짰으면 반죽으로 덮어요.'); } }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      const kettleI = pic('bp_kettle.png'), TILT = -.5, spoutTip = () => { const a = press ? TILT : 0, lx = -122, ly = 96; return { x: ptr.x + lx * Math.cos(a) - ly * Math.sin(a), y: ptr.y + lx * Math.sin(a) + ly * Math.cos(a) }; }, spout = () => { const t = spoutTip(); return { x: t.x, y: t.y + 40 }; };   // 양은 주전자를 기울이면 주둥이에서 반죽이 흘러내림
      const look = v => v < .35 ? 'brightness(1.25) saturate(.35) sepia(.25)' : v < .8 ? `brightness(${1.18 - (v - .35) * .4}) saturate(${.5 + (v - .35) * 1.1})` : v < 1.35 ? 'none' : v < 1.8 ? `brightness(${1 - (v - 1.35) * 1.1}) saturate(1.15)` : 'brightness(.38) saturate(.7)';
      function pour(dt) { const P = spout(), k = hit(P);   // 주전자 주둥이에서 떨어진 자리
        drops.push({ x: P.x + rnd(-3, 3), y: ptr.y + 12, vy: 260, t: 0 });
        if (k < 0) { sg.fillStyle = 'rgba(236,212,160,.95)'; sg.beginPath(); sg.ellipse(P.x, P.y, rnd(5, 9), rnd(4, 7), 0, 0, 7); sg.fill(); return; }   // 칸 밖은 틀 위로 흘러내림
        const c = C[k]; shape(c); const lx = P.x - c.b[0], ly = P.y - c.b[1];
        if (c.bean && c.top < 1) { c.top = Math.min(1, (c.top || 0) + dt * .9); if (c.top >= 1) api.guide('팥이 반죽에 폭 덮였어요. 뚜껑을 닫고 구워요.'); return; }   // 팥 위로 반죽을 덮음
        if (c.cov < .93) { c.r = (c.r || 6) + dt * 16; c.mg.fillStyle = '#000'; for (let i = 0; i < 3; i++) { c.mg.beginPath(); c.mg.arc(lx + rnd(-c.r, c.r) * .6, ly + rnd(-c.r, c.r) * .45, c.r * rnd(.5, 1), 0, 7); c.mg.fill(); }   // 붓는 자리부터 퍼짐
          c.mg.globalCompositeOperation = 'destination-in'; c.mg.drawImage(c.sh, 0, 0); c.mg.globalCompositeOperation = 'source-over'; c.cov = coverage(c); }
        else { c.over += dt; const [x0, y0, w0, h0] = c.b; if (!c.tint) { c.tint = cv(w0, h0); const tg = c.tint.getContext('2d'); tg.drawImage(c.sh, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = 'rgb(234,208,156)'; tg.fillRect(0, 0, w0, h0); }
          const sc = 1 + Math.min(.32, c.over * .07), ox = (lx - w0 / 2) * .08 + rnd(-3, 3), oy = (ly - h0 / 2) * .08 + rnd(-3, 3); sg.save(); sg.filter = 'blur(1.2px)'; sg.globalAlpha = .5; sg.drawImage(c.tint, x0 + w0 / 2 - w0 * sc / 2 + ox, y0 + h0 / 2 - h0 * sc / 2 + oy, w0 * sc, h0 * sc); sg.restore();   // 가장자리 넘어 둥글게 번져 나감
          if (Math.random() < dt * 3) { const a = rnd(0, 6.28), ex = x0 + w0 / 2 + Math.cos(a) * w0 * .5 * sc, ey = y0 + h0 / 2 + Math.sin(a) * h0 * .5 * sc; sg.fillStyle = 'rgba(234,208,156,.9)'; sg.beginPath(); sg.ellipse(ex, ey, rnd(5, 10), rnd(4, 8), a, 0, 7); sg.fill(); }
          if (c.over > .3 && !c.warned) { c.warned = 1; api.guide('앗, 넘쳤어요! 반죽이 틀 밖으로 흘러넘쳐요.'); } } }
      function frame(now) { if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (now - (t0 || now)) / 1000); t0 = now;
        if (press && tool === 'batter' && !lid && !flipT && ptr) { pour(dt); if (now - lastPour > 90) { lastPour = now; tone(rnd(140, 200), .05, .025, 'sine'); } } else C.forEach(c => { c.r = Math.max(6, (c.r || 6) - dt * 20); });
        let cooking = 0, burning = 0;
        for (const c of C) if (!c.out && c.cov > .05) { if (lid) c.ck[down] += dt * .12; else c.ck[down] = Math.min(c.ck[down] + dt * .015, Math.max(c.ck[down], .22));   // 열어 둔 동안엔 살짝만 굳고, 뚜껑을 닫아야 제대로 구워짐 cooking++; if (c.ck[down] > 1.4) burning++;
          if (!lid && down === 0 && c.ck[0] > .15 && c.ck[0] < 1 && Math.random() < dt * 4 * c.cov) c.bub.push({ x: rnd(.25, .8), y: rnd(.25, .75), t: 0, r: rnd(2, 4) });   // 날반죽 위로 기포가 올라왔다 터짐
          c.bub = c.bub.filter(q => (q.t += dt) < .9);
          if (Math.random() < dt * (lid ? 2.5 : 1.2)) steam.push({ x: c.b[0] + c.b[2] * rnd(.2, .8), y: c.b[1] + (lid ? 0 : c.b[3] * .3), t: 0, smoke: c.ck[down] > 1.4 }); }
        if (cooking && now - lastSz > 70) { lastSz = now; tone(rnd(2200, 5200), .02, .012 + Math.min(.02, cooking * .002), 'square'); }   // 지글지글
        if (flipT) flipT = Math.max(0, flipT - dt * 2.2);
        g.fillStyle = '#cfe0ec'; g.fillRect(0, 0, W, H);
        const fs = flipT ? Math.abs(Math.cos((1 - flipT) * Math.PI)) : 1; g.save(); g.translate(W / 2, H / 2); g.scale(1, Math.max(.05, fs)); g.translate(-W / 2, -H / 2);
        if (mold.complete) g.drawImage(mold, 0, 0, W, H);
        g.save(); g.filter = look(Math.min(...C.map(c => c.ck[0])) + .6); g.drawImage(SPILL, 0, 0); g.restore();   // 흘러넘친 반죽(같이 익음)
        if (lid && mold.complete) { g.save(); g.shadowColor = 'rgba(20,15,10,.45)'; g.shadowBlur = 18; g.shadowOffsetY = 8; g.translate(W, 0); g.scale(-1, 1); g.filter = 'brightness(.72) contrast(1.12) saturate(.9)'; g.drawImage(mold, 0, 0, W, H); g.restore(); }   // 뚜껑(틀의 다른 쪽)을 덮으면 안이 안 보임
        if (!lid) for (const c of C) { if (c.out || c.cov <= 0 || !fishI.complete) continue; const [x, y, w, h] = c.b, sh = shape(c), t = cv(w, h), tg = t.getContext('2d');
          const done = c.cov > .5 && c.ck[0] > .3 && c.ck[1] > .3, v = Math.max(c.ck[0], c.ck[1]);
          if (done) { if (!c.doneT) { c.doneT = now; tone(880, .12, .05, 'sine'); for (let i = 0; i < 6; i++) steam.push({ x: x + w * rnd(.2, .8), y: y + h * .4, t: rnd(0, .3), smoke: false }); }   // 다 익으면 그제서야 붕어빵 모양이 드러남
            const pop = Math.min(1, (now - c.doneT) / 400); tg.globalAlpha = pop; tg.filter = look((c.ck[0] + c.ck[1]) / 2); tg.drawImage(sh, 0, 0); tg.filter = 'none'; tg.globalAlpha = 1; }
          else { const e = v < .2 ? [240, 223, 180] : v < 1 ? [240 - (v - .2) * 50, 223 - (v - .2) * 110, 180 - (v - .2) * 150] : v < 1.4 ? [200, 135, 60] : [200 - (v - 1.4) * 250, 135 - (v - 1.4) * 170, 60 - (v - 1.4) * 70];   // 날반죽(차 오른 반죽) → 가장자리부터 노릇
            tg.fillStyle = `rgb(${e.map(n => Math.max(40, n | 0)).join(',')})`; tg.fillRect(0, 0, w, h);
            const sc = Math.max(.45, 1 - v * .45); tg.save(); tg.filter = 'blur(7px)'; tg.globalAlpha = Math.max(0, 1 - v * .7); tg.fillStyle = '#f3e3ba'; tg.beginPath(); tg.ellipse(w / 2, h / 2, w * .46 * sc, h * .4 * sc, 0, 0, 7); tg.fill(); tg.restore();
            tg.fillStyle = `rgba(255,255,255,${.35 * Math.max(0, 1 - v * 1.2)})`; tg.beginPath(); tg.ellipse(w * .42, h * .32, w * .22, h * .07, -.15, 0, 7); tg.fill();   // 액체 반죽 윤기
            if (c.cov < .93) { tg.strokeStyle = 'rgba(255,248,225,.5)'; tg.lineWidth = 2; tg.beginPath(); tg.arc((ptr ? spout().x - x : w / 2), (ptr ? spout().y - y : h / 2), (c.r || 6) * .9, 0, 7); tg.stroke(); } }   // 붓는 자리 물결
          tg.globalCompositeOperation = 'destination-in'; tg.drawImage(c.m, 0, 0); g.drawImage(t, x, y);
          if (c.bean && (c.top || 0) < 1) { const tp = c.top || 0; g.save(); g.globalAlpha = 1 - tp * .85; g.shadowColor = 'rgba(40,20,10,.35)'; g.shadowBlur = 3; g.shadowOffsetY = 1.5; g.drawImage(c.fc, x, y); g.restore();
            if (tp > 0) { g.save(); g.globalAlpha = Math.min(1, tp * 1.3); g.fillStyle = '#f0dfb4'; g.filter = 'blur(2px)'; g.beginPath(); g.ellipse(x + c.bx, y + c.by, w * .2 * (.3 + tp * .7), h * .19 * (.3 + tp * .7), 0, 0, 7); g.fill(); g.restore(); } }   // 부은 만큼 반죽이 팥 위로 번져 덮음
          if (!(c.cov > .5 && c.ck[0] > .3 && c.ck[1] > .3)) for (const q of c.bub) { const a2 = 1 - q.t / .9; g.strokeStyle = `rgba(255,250,235,${a2 * .8})`; g.lineWidth = 1.2; g.beginPath(); g.arc(x + q.x * w, y + q.y * h, q.r * (1 + q.t), 0, 7); g.stroke(); } }
        g.restore();
        steam = steam.filter(q => (q.t += dt) < 1.8); for (const q of steam) { const a2 = (1 - q.t / 1.8) * (q.smoke ? .45 : .32); g.fillStyle = q.smoke ? `rgba(90,80,75,${a2})` : `rgba(255,255,255,${a2})`; g.beginPath(); g.arc(q.x + Math.sin(q.t * 3) * 10, q.y - q.t * 70, 8 + q.t * 16, 0, 7); g.fill(); }
        drops = drops.filter(d => { d.t += dt; d.y += d.vy * dt; return d.t < .15; });
        if (ptr && !lid) { if (tool === 'batter') { const tp = spoutTip(), P = spout(); if (press) { g.strokeStyle = 'rgba(238,214,162,.95)'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(tp.x, tp.y); g.quadraticCurveTo(tp.x - 3 + Math.sin(now / 60) * 1.5, (tp.y + P.y) / 2, P.x, P.y); g.stroke(); }
            g.save(); g.translate(ptr.x, ptr.y); g.rotate(press ? TILT : 0); g.scale(1.5, 1.5); g.shadowColor = 'rgba(40,30,20,.35)'; g.shadowBlur = 12; g.shadowOffsetY = 8;
            if (kettleI.complete && kettleI.naturalWidth) g.drawImage(kettleI, -83, -1, 130, 130 * kettleI.naturalHeight / kettleI.naturalWidth);   // 손잡이 꼭대기를 잡은 자리
            else { const gr = g.createLinearGradient(-34, -30, 34, 30); gr.addColorStop(0, '#f3d98c'); gr.addColorStop(.5, '#c99a3e'); gr.addColorStop(1, '#8a6424'); g.fillStyle = gr;   // 노란 양은 주전자(그림 오기 전 임시)
              g.beginPath(); g.moveTo(-26, -6); g.quadraticCurveTo(-44, -10, -58, -8); g.lineTo(-58, -3); g.quadraticCurveTo(-42, 2, -26, 8); g.fill();
              g.beginPath(); g.ellipse(0, 6, 36, 26, 0, 0, 7); g.fill(); g.shadowColor = 'transparent'; g.fillStyle = '#d8b462'; g.beginPath(); g.ellipse(0, -16, 22, 7, 0, 0, 7); g.fill(); g.fillStyle = '#a57b30'; g.beginPath(); g.arc(0, -22, 5, 0, 7); g.fill();
              g.strokeStyle = '#3a2a1c'; g.lineWidth = 5; g.beginPath(); g.moveTo(-22, -16); g.quadraticCurveTo(0, -56, 22, -16); g.stroke(); g.fillStyle = 'rgba(255,250,220,.4)'; g.beginPath(); g.ellipse(-12, 0, 8, 14, -.4, 0, 7); g.fill(); }
            g.restore(); }
          else if (tool === 'fill') { g.save(); g.translate(ptr.x, ptr.y); g.rotate(-.35); const sq = press && pipe ? .9 : 1; g.shadowColor = 'rgba(40,30,20,.3)'; g.shadowBlur = 10; g.shadowOffsetY = 6;
            g.fillStyle = 'rgba(245,245,240,.92)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-30 * sq, -88); g.quadraticCurveTo(0, -104, 30 * sq, -88); g.closePath(); g.fill(); g.shadowColor = 'transparent';
            g.fillStyle = fk === 'bean' ? 'rgba(80,34,28,.85)' : 'rgba(240,205,110,.9)'; g.beginPath(); g.moveTo(-4, -10); g.lineTo(-24 * sq, -80); g.quadraticCurveTo(0, -92, 24 * sq, -80); g.lineTo(4, -10); g.closePath(); g.fill();
            g.fillStyle = '#c9c9c4'; g.beginPath(); g.moveTo(-5, -8); g.lineTo(5, -8); g.lineTo(1.5, 2); g.lineTo(-1.5, 2); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.15)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-30 * sq, -88); g.lineTo(0, 0); g.lineTo(30 * sq, -88); g.stroke(); g.restore(); } }
        can.style.cursor = !lid && (tool === 'batter' || tool === 'fill') && ptr && ptr.x < 760 ? 'none' : 'pointer';   // 도구를 그려 줄 때만 마우스를 숨김
        if (shop) drawShop(now, dt);
        if (shop) drawRack();
        if (shop && bagI.complete) { g.drawImage(bagI, 770, 420, 130, 117); g.fillStyle = 'rgba(255,250,240,.92)'; g.fillRect(780, 395 + 20, 110, 22); g.fillStyle = '#6b4a3a'; g.font = '14px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText(pack.length ? `봉투에 ${pack.length}마리` : '빈 봉투', 835, 431); }
        if (!shop && bagI.complete) { g.drawImage(bagI, 770, 420, 130, 117); if (bag.length) { g.fillStyle = 'rgba(255,250,240,.92)'; g.fillRect(780, 395, 110, 24); g.fillStyle = '#6b4a3a'; g.font = '14px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText(`봉투 속 ${bag.length}마리`, 835, 412); g.font = '11px "Gowun Dodum",sans-serif'; g.fillText(['bean', 'cream', 'mix'].map(k => [k, bag.filter(b2 => b2.fill === k).length]).filter(([, n]) => n).map(([k, n]) => `${FN[k]} ${n}`).join(' · '), 835, 432); } }
        if (lid) { const k = C.filter(c => !c.out && c.cov > .05), avg = k.length ? k.reduce((a2, c) => a2 + c.ck[down], 0) / k.length : 0; g.fillStyle = 'rgba(255,250,240,.92)'; g.fillRect(16, 16, 270, 46); g.fillStyle = '#6b4a3a'; g.font = '16px "Gowun Batang",serif'; g.textAlign = 'left';
          g.fillText(avg > 1.4 ? '탄내가 나요! 얼른 뒤집거나 열어요' : avg > .8 ? '고소한 냄새가 나요' : avg > .3 ? '지글지글 익는 중…' : '틀이 데워지는 중…', 28, 45); } }
      const fillOf = c => { const k = Object.keys(c.kinds); return k.length === 2 ? 'mix' : k[0] || 'none'; };
      const FN = { bean: '팥', cream: '슈크림', mix: '반반', none: '속 없는' };
      const NAMES = ['꼬마 손님', '산타 할아버지', '눈사람 아저씨', '우체부 아줌마', '고양이 손님', '할머니', '종지기 아저씨'];
      const cardBox = i => ({ x: 12 + i * 222, y: 8, w: 212, h: 92 });
      const orderAt = q => orders.findIndex((o, i) => { const b2 = cardBox(i); return q.x > b2.x && q.x < b2.x + b2.w && q.y > b2.y && q.y < b2.y + b2.h; });
      const rackSlot = i => ({ x: 774 + (i % 2) * 60, y: 112 + Math.floor(i / 2) * 42, w: 56, h: 38 });
      const rackAt = q => bag.findIndex((b2, i) => { const r = rackSlot(i); return q.x > r.x && q.x < r.x + r.w && q.y > r.y && q.y < r.y + r.h; });
      function drawRack() {   // 다 구운 붕어빵을 올려 두는 보온대 (아래 따뜻한 불빛)
        g.save(); g.fillStyle = 'rgba(60,40,28,.88)'; g.beginPath(); g.roundRect(764, 84, 130, 318, 12); g.fill();
        const gl = g.createLinearGradient(0, 360, 0, 400); gl.addColorStop(0, 'rgba(255,150,60,0)'); gl.addColorStop(1, 'rgba(255,150,60,.45)'); g.fillStyle = gl; g.fillRect(764, 300, 130, 102);
        g.fillStyle = '#ffe9c4'; g.font = 'bold 14px "Gowun Dodum",sans-serif'; g.textAlign = 'center'; g.fillText('보온대', 829, 104);
        g.strokeStyle = 'rgba(220,200,170,.5)'; g.lineWidth = 1.5; for (let r = 0; r < 7; r++) { const y = 112 + r * 42 + 38; g.beginPath(); g.moveTo(770, y); g.lineTo(888, y); g.stroke(); }
        bag.forEach((b2, i) => { const r = rackSlot(i); if (!fishI.complete) return; g.save(); g.filter = look((b2.ck[0] + b2.ck[1]) / 2); g.drawImage(fishI, r.x, r.y, r.w, r.h); g.restore(); g.fillStyle = b2.fill === 'bean' ? '#4a201c' : b2.fill === 'cream' ? '#e0b04f' : '#a7774a'; g.beginPath(); g.arc(r.x + r.w - 6, r.y + r.h - 6, 5, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.2; g.stroke(); });
        if (Math.random() < .08 && bag.length) steam.push({ x: 780 + Math.random() * 100, y: 380, t: 0, smoke: false });
        g.restore(); }
      function newOrder() { const n = 1 + Math.floor(Math.random() * (served < 3 ? 2 : 3)), items = Array.from({ length: n }, () => Math.random() < .55 ? 'bean' : 'cream'); orders.push({ who: NAMES[Math.floor(Math.random() * NAMES.length)], items, wait: 0, max: 55 + n * 15, mood: 0 }); tone(1320, .12, .05, 'triangle'); setTimeout(() => tone(1760, .15, .05, 'triangle'), 120); }
      function serve(i) { const o = orders[i], pool = pack.slice(), use = []; if (!pack.length) { api.guide(`${o.who}: "${o.items.map(t => FN[t]).join(', ')} 붕어빵 주세요!" — 보온대의 붕어빵을 눌러 봉투에 담아 주세요.`); tone(220, .15, .05, 'square'); return; } for (const it of o.items) { const j = pool.findIndex(b2 => b2.fill === it || b2.fill === 'mix'); if (j < 0) { api.guide(`${o.who}: "${FN[it]} 붕어빵이 봉투에 없어요." 봉투를 누르면 비울 수 있어요.`); tone(220, .15, .05, 'square'); return; } use.push(pool.splice(j, 1)[0]); } if (pool.length) { api.guide(`${o.who}: "${o.items.length}마리만 주세요! 봉투에 ${pack.length}마리나 있어요." 봉투를 누르면 비울 수 있어요.`); tone(220, .15, .05, 'square'); return; }
        let pay = 0, burnt = 0, perfect = 0; use.forEach(b2 => { const v = (b2.ck[0] + b2.ck[1]) / 2; if (b2.ck.some(x => x > 1.6)) burnt++; else { pay += 500; if (b2.ck.every(x => x > .75 && x < 1.4)) { perfect++; pay += 200; } } });
        const tip = o.wait < o.max * .4 ? 300 : 0; pay += tip; coins += pay; served++; pack = []; orders.splice(i, 1);
        popups.push({ x: cardBox(i).x + 100, y: 118, t: 0, txt: burnt ? `탄 건 싫어요… +${pay}원` : `+${pay}원${perfect === use.length ? ' 노릇노릇!' : ''}` });
        [784, 988, 1175, 1568].forEach((f, k) => setTimeout(() => tone(f, .18, .05, 'triangle'), k * 80)); api.ready(true); ui(); }
      function drawShop(now, dt) { nextOrder -= dt; if (nextOrder <= 0 && orders.length < 3) { newOrder(); nextOrder = 14 + Math.random() * 8; }
        orders.forEach((o, i) => { o.wait += dt; const b2 = cardBox(i), k = o.wait / o.max; if (k >= 1) { o.gone = 1; popups.push({ x: b2.x + 90, y: 100, t: 0, txt: '기다리다 가 버렸어요…' }); tone(180, .25, .05, 'square'); return; }
          g.save(); g.shadowColor = 'rgba(40,30,20,.3)'; g.shadowBlur = 10; g.shadowOffsetY = 4; g.fillStyle = 'rgba(255,251,240,.96)'; g.beginPath(); g.roundRect(b2.x, b2.y, b2.w, b2.h, 12); g.fill(); g.restore();
          g.fillStyle = '#6b4a3a'; g.font = 'bold 18px "Gowun Dodum",sans-serif'; g.textAlign = 'left'; g.fillText((k > .7 ? '😣 ' : k > .4 ? '🙂 ' : '😊 ') + o.who, b2.x + 10, b2.y + 22);
          o.items.forEach((it, j) => { const cx = b2.x + 30 + j * 62, cy = b2.y + 52; if (fishI.complete) { g.save(); g.filter = 'brightness(1.02)'; g.drawImage(fishI, cx - 24, cy - 16, 48, 33); g.restore(); } g.fillStyle = it === 'bean' ? '#4a201c' : '#e0b04f'; g.beginPath(); g.arc(cx + 14, cy + 8, 6, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = '#6b4a3a'; g.font = '14px "Gowun Dodum",sans-serif'; g.fillText(FN[it], cx - 14, b2.y + 84); });
          g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(b2.x + 10, b2.y + b2.h - 6, b2.w - 20, 3); g.fillStyle = k > .7 ? '#d9534f' : k > .4 ? '#e8a33d' : '#5aa65a'; g.fillRect(b2.x + 10, b2.y + b2.h - 6, (b2.w - 20) * (1 - k), 3); });
        orders = orders.filter(o => !o.gone);
        g.fillStyle = 'rgba(255,251,240,.95)'; g.beginPath(); g.roundRect(W - 170, 10, 156, 40, 20); g.fill(); g.fillStyle = '#6b4a3a'; g.font = 'bold 20px "Gowun Dodum",sans-serif'; g.textAlign = 'center'; g.fillText(`💰 ${coins}원`, W - 92, 37);
        popups = popups.filter(p => (p.t += dt) < 1.6); popups.forEach(p => { g.globalAlpha = 1 - p.t / 1.6; g.fillStyle = '#b5482f'; g.font = 'bold 18px "Gowun Dodum",sans-serif'; g.textAlign = 'center'; g.fillText(p.txt, p.x, p.y + 20 - p.t * 30); g.globalAlpha = 1; }); }
      function ui() { const T = tools(side);
        const r = T.row('도구'); [['batter', '주전자(반죽)'], ['fill', '짤주머니'], ['take', '꺼내기']].forEach(([k, n]) => T.chip(r, n, () => { tool = k; ui(); }, tool === k));
        if (tool === 'fill') { const rf = T.row('속'); [['bean', '팥'], ['cream', '슈크림']].forEach(([k, n]) => T.chip(rf, n, () => { fk = k; ui(); }, fk === k)); }
        const rs = T.row('가게'); T.chip(rs, shop ? '🧾 손님 받는 중' : '🧾 손님 받기', () => { shop = !shop; if (shop) { orders = []; nextOrder = 1.5; } ui(); }, shop); if (shop) rs.append(mk('span', 'thint', ` 💰 ${coins}원 · 손님 ${served}명`));
        const r2 = T.row('틀'); T.chip(r2, lid ? '뚜껑 열기' : '뚜껑 닫기', () => { lid = !lid; tone(lid ? 140 : 220, .12, .07, 'square'); ui(); }, lid); T.chip(r2, '↻ 뒤집기', () => { if (!lid) { api.guide('뚜껑을 닫은 다음에 뒤집어요.'); return; } down = 1 - down; flipT = 1; tone(110, .15, .08, 'square'); setTimeout(() => tone(90, .1, .07, 'square'), 200); });
        const n = bag.length, good = bag.filter(b => b.ck.every(v => v > .75 && v < 1.4)).length;
        side.append(mk('p', 'thint', shop ? '위쪽 주문표를 보고 주문대로 구워요. 꺼낸 붕어빵은 오른쪽 보온대에서 따뜻하게 기다려요. 보온대의 붕어빵을 눌러 주문한 개수만큼 봉투에 담고, 손님 주문표를 누르면 봉투째 건네요. 봉투를 누르면 다시 비울 수 있어요. 오래 기다리게 하면 손님이 가 버려요!' : tool === 'batter' ? '주전자를 칸 위에서 누르고 있으면 기울어지며 반죽이 주르륵 흘러 붓는 자리부터 퍼져요. 속을 넣은 칸은 그 위에 부어 덮어요. 가득 찬 칸에 계속 부으면 틀 밖으로 넘쳐요.' : tool === 'fill' ? '반죽을 반쯤 부은 칸 위에서 누른 채 움직이면 그린 대로 속이 짜져 나와요. 하트도, 지그재그도, 듬뿍도 마음대로요. 팥과 슈크림을 섞어도 돼요.' : '양쪽이 노릇하게 익은 붕어빵을 눌러 봉투에 담아요.'));
        side.append(mk('p', 'thint', `열어 둔 동안엔 반죽이 살짝 굳으며 기포만 올라와요. 팥을 넣고 덮은 다음 뚜껑을 닫아야 노릇하게 구워지고, 김 색과 냄새로 익은 정도를 알 수 있어요. 뒤집어서 반대쪽도 구워요. ${n ? `봉투 ${n}마리 (노릇노릇 ${good})` : ''}`)); }
      reset(); requestAnimationFrame(frame);
      window.__bp = { fill: () => C.forEach(c => { shape(c); c.mg.drawImage(c.sh, 0, 0); c.cov = 1; }), cook: (a, b) => C.forEach(c => { c.ck = [a, b]; }), down: d => { down = d; }, take: () => C.forEach((c, i) => { if (i < 4) { c.out = true; bag.push({ ck: [...c.ck] }); } }) };
      return { reset, result() { if (bag.length < 3) return null; const o = cv(220, 220), x = o.getContext('2d'); if (bagI.complete) x.drawImage(bagI, 10, 40, 200, 180); if (fishI.complete) bag.slice(0, 3).forEach((b, i) => { x.save(); x.translate(60 + i * 45, 60 - (i % 2) * 10); x.rotate(-.9 + i * .25); x.filter = look((b.ck[0] + b.ck[1]) / 2); x.drawImage(fishI, -45, -30, 90, 62); x.restore(); }); return { img: o.toDataURL('image/png') }; }, stop() { alive = false; pw && pw.classList.remove('xwide'); } };
    },
  };

  // ── 리본 묶기(영상): 단계마다 리본이 묶이는 영상을 내 손으로 앞뒤로 움직임. 표시된 길을 따라 끄는 만큼 영상이 진행됨
  plays.ribbonv = {
    title: '리본 묶기', doneLabel: '트리 곁에 두기', doneMsg: '직접 묶은 리본 선물을 트리 곁에 뒀어요.',
    start(board, api) {
      board.className = 'pboard rbp'; const pw = board.closest('.panel-wrap'); pw && pw.classList.add('xwide');
      const W = 640, H = 640, can = cv(W, H, 'rbcv'), g = can.getContext('2d'), side = mk('div', 'rbside'); board.append(can, side);
      const ST = (window.VILLAGE.ribbonSteps || [
        { t: '엇갈리기', h: '두 끝을 X자로 엇갈려요.', path: [[200, 420], [320, 330], [440, 230]] },
        { t: '한 번 묶기', h: '한쪽 끝을 밑으로 넣었다가 쭉 빼요.', path: [[430, 240], [330, 360], [220, 230]] },
        { t: '첫 번째 고리', h: '한쪽 끝으로 토끼 귀 고리를 만들어요.', path: [[340, 320], [460, 250], [500, 330], [360, 340]] },
        { t: '감고 빼기', h: '다른 끝으로 고리를 감고 구멍으로 빼요.', path: [[300, 330], [330, 220], [420, 300], [330, 400], [200, 320]] },
        { t: '당겨 조이기', h: '두 고리를 양쪽으로 당겨 꽉 조여요.', path: [[320, 320], [520, 300]] },
      ]).map((o, i) => ({ ...o, v: (() => { const v = document.createElement('video'); v.src = 'assets/v_rb_' + (i + 1) + '.mp4'; v.muted = true; v.playsInline = true; v.preload = 'auto'; return v; })() }));
      let stage = 0, prog = 0, shown = 0, drag = false, ptr = null, alive = true, done = false, lastS = 0;
      const plen = P => { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; };
      function project(P, q) { let best = null, acc = 0; const L = plen(P);   // 길 위에서 손에 가장 가까운 자리(0~1)
        for (let i = 1; i < P.length; i++) { const [ax, ay] = P[i - 1], [bx, by] = P[i], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy), u = Math.max(0, Math.min(1, ((q.x - ax) * dx + (q.y - ay) * dy) / (l * l))), x = ax + dx * u, y = ay + dy * u, d = Math.hypot(q.x - x, q.y - y);
          if (!best || d < best.d) best = { d, t: (acc + u * l) / L }; acc += l; } return best; }
      can.addEventListener('pointerdown', e => { ptr = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId); const p = project(ST[stage].path, ptr); if (p.d < 60 && Math.abs(p.t - prog) < .2) drag = true; });
      can.addEventListener('pointermove', e => { ptr = at(e, can); if (!drag) return; const p = project(ST[stage].path, ptr); if (p.d > 110) { drag = false; return; } if (Math.abs(p.t - prog) < .15) prog = Math.max(0, Math.min(1, p.t)); });   // 길을 따라 조금씩만(건너뛰기 없음)
      const up = () => { drag = false; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function frame(now) { if (!alive) return; requestAnimationFrame(frame); const S = ST[stage], v = S.v;
        shown += (prog - shown) * .25;
        if (v.readyState >= 1 && v.duration) { const t = shown * (v.duration - .05); if (Math.abs(v.currentTime - t) > .03) v.currentTime = t; }
        if (Math.abs(shown - lastS) > .04 && drag) { lastS = shown; tone(rnd(2600, 4200), .02, .015, 'triangle'); }   // 사각사각 천 소리
        g.fillStyle = '#cfe0ec'; g.fillRect(0, 0, W, H); if (v.readyState >= 2) g.drawImage(v, 0, 0, W, H); else { g.fillStyle = '#8a7a6a'; g.font = '18px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText('리본 영상을 불러오는 중…', W / 2, H / 2); }
        if (!done) { const P = S.path; g.save(); g.lineCap = 'round'; g.setLineDash([8, 9]); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 4; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.setLineDash([]);
          let acc = 0, L = plen(P), hx = P[0][0], hy = P[0][1]; for (let i = 1; i < P.length; i++) { const l = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if ((acc + l) / L >= shown) { const u = (shown * L - acc) / l; hx = P[i - 1][0] + (P[i][0] - P[i - 1][0]) * u; hy = P[i - 1][1] + (P[i][1] - P[i - 1][1]) * u; break; } acc += l; }
          const e2 = P[P.length - 1], pulse = .5 + .5 * Math.sin(now / 260); g.fillStyle = 'rgba(192,57,43,.55)'; g.beginPath(); g.arc(e2[0], e2[1], 9, 0, 7); g.fill();
          g.strokeStyle = `rgba(255,220,120,${.55 + .4 * pulse})`; g.lineWidth = 4; g.beginPath(); g.arc(hx, hy, 18 + pulse * 4, 0, 7); g.stroke(); g.fillStyle = 'rgba(255,240,200,.8)'; g.beginPath(); g.arc(hx, hy, 7, 0, 7); g.fill(); g.restore(); }
        if (prog >= .995 && !drag && !done) { if (stage < ST.length - 1) { stage++; prog = shown = 0; [523, 659, 784].forEach((f, k) => setTimeout(() => tone(f, .16, .06, 'sine'), k * 80)); ui(); } else { done = true; api.ready(true); tone(1047, .3, .07, 'sine'); ui(); } } }
      function ui() { const T = tools(side); const st = mk('div', 'rbsteps'); ST.forEach((S, i) => st.append(mk('span', i < stage || done ? 'done' : i === stage ? 'on' : '', `${i + 1}. ${S.t}`))); side.append(st);
        side.append(mk('p', 'thint', done ? '예쁘게 묶였어요!' : ST[stage].h + ' 노란 동그라미를 잡고 하얀 점선을 따라 끌어요. 끄는 만큼 리본이 움직이고, 되돌리면 풀려요.'));
        const a2 = T.acts(); T.sub(a2, '처음부터', () => reset()); }
      const reset = () => { stage = 0; prog = shown = 0; done = false; ui(); api.ready(false); api.guide('리본 끝을 직접 움직여 나비 모양으로 묶어 봐요.'); };
      reset(); requestAnimationFrame(frame);
      window.__rbv = { finish: () => { stage = ST.length - 1; prog = 1; } };
      return { reset, result() { if (!done) return null; const o = cv(240, 240); o.getContext('2d').drawImage(can, 0, 0, W, H, 0, 0, 240, 240); return { img: o.toDataURL('image/png') }; }, stop() { alive = false; ST.forEach(s2 => { s2.v.removeAttribute('src'); s2.v.load(); }); pw && pw.classList.remove('xwide'); } };
    },
  };

  // ── 리본 묶기: 진짜 리본처럼 끝을 끌어 엇갈리고 → 한 번 묶고 → 고리 → 감아서 빼고 → 당겨 조이기
  plays.ribbon = {
    title: '리본 묶기', doneLabel: '트리 곁에 두기', doneMsg: '직접 묶은 리본 선물을 트리 곁에 뒀어요.',
    start(board, api) {
      board.className = 'pboard rbp'; const pw = board.closest('.panel-wrap'); pw && pw.classList.add('xwide');
      const W = 700, H = 640, can = cv(W, H, 'rbcv'), g = can.getContext('2d'), side = mk('div', 'rbside'); board.append(can, side);
      const box = pic('rb_box.png'), texI = pic('rb_red.jpg');
      const COLS = { red: ['빨강', 'none'], green: ['초록', 'hue-rotate(120deg) saturate(.7) brightness(.85)'], gold: ['금색', 'hue-rotate(38deg) saturate(.75) brightness(1.25)'], navy: ['남색', 'hue-rotate(215deg) saturate(.6) brightness(.8)'], pink: ['분홍', 'hue-rotate(-18deg) saturate(.55) brightness(1.35)'] };
      let col = 'red', tex = null;
      const mkTex = () => { if (!texI.complete) return null; const c = cv(texI.naturalWidth, texI.naturalHeight), x = c.getContext('2d'); x.filter = COLS[col][1]; x.drawImage(texI, 0, 0); return c; };
      const K = { x: 350, y: 270 }, RW = 30, SEG = 10;
      // 줄(위에서 본 리본 끝): 0번 마디는 매듭 자리에 고정
      const rope = (n, ang) => Array.from({ length: n }, (_, i) => { const x = K.x + Math.cos(ang) * i * SEG + Math.sin(i * .4) * 6, y = K.y + Math.sin(ang) * i * SEG; return { x, y, px: x, py: y }; });
      let A, B, stage, cp, grab = null, ptr = null, alive = true, t0 = 0, loops = {}, tails = {}, tight = 0, scissors = false, cuts = {}, hist = [];
      const STAGES = [
        { who: 'A', t: '엇갈리기', h: '왼쪽 리본 끝을 잡아 오른쪽 위로 넘겨 X자로 엇갈려요.', cps: [[420, 230], [520, 160]] },
        { who: 'A', t: '한 번 묶기', h: '넘긴 끝을 가운데 아래로 집어넣었다가(밑으로 통과) 왼쪽 위로 쭉 빼요.', cps: [[350, 300], [290, 250], [190, 150]] },
        { who: 'B', t: '첫 번째 고리', h: '오른쪽 끝으로 토끼 귀 같은 고리를 만들어 가운데로 다시 가져와요.', cps: [[460, 220], [540, 270], [460, 330], [370, 285]] },
        { who: 'A', t: '감고 빼기', h: '왼쪽 끝으로 고리 둘레를 한 바퀴 감고, 가운데 구멍으로 밀어 넣어 두 번째 고리를 빼내요.', cps: [[350, 200], [410, 270], [350, 340], [300, 280], [200, 270]] },
        { who: 'loops', t: '당겨 조이기', h: '두 고리를 양쪽으로 당겨서 꽉 조여요. 고리 크기와 꼬리 길이도 끌어서 맞춰요.', cps: [] },
      ];
      function reset() { A = rope(30, 2.35); B = rope(30, .75); stage = 0; cp = 0; loops = {}; tails = {}; tight = 0; scissors = false; cuts = {}; ui(); api.ready(false); api.guide('리본 두 끝을 직접 끌어서 나비 모양으로 묶어 봐요.'); }
      const R = w => w === 'A' ? A : B;
      function sim(r) { const held = grab && grab.r === r, damp = held ? .55 : .2; for (let i = 1; i < r.length; i++) { const p = r[i], vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy; }
        for (let it = 0; it < 12; it++) { r[0].x = r[0].x * .5 + K.x * .5; r[0].y = r[0].y * .5 + K.y * .5;
          if (grab && grab.r === r && ptr) { const p = r[grab.i]; p.x += (ptr.x - p.x) * .6; p.y += (ptr.y - p.y) * .6; }
          for (let i = 0; i < r.length - 1; i++) { const a2 = r[i], b2 = r[i + 1], dx = b2.x - a2.x, dy = b2.y - a2.y, d = Math.hypot(dx, dy) || 1, k = (d - SEG) / d; if (i === 0) { b2.x -= dx * k; b2.y -= dy * k; } else { a2.x += dx * k * .5; a2.y += dy * k * .5; b2.x -= dx * k * .5; b2.y -= dy * k * .5; } }
          if (held) for (let i = 1; i < r.length - 1; i++) { const a2 = r[i - 1], b2 = r[i + 1], p = r[i], d = Math.hypot(b2.x - a2.x, b2.y - a2.y); if (d < SEG * 1.2) { const mx = (a2.x + b2.x) / 2, my = (a2.y + b2.y) / 2; p.x += (mx - p.x) * .15; p.y += (my - p.y) * .15; } }   // 너무 접히지 않게 살짝 폄(끌 때만)
          for (const p of r) { p.x = Math.max(10, Math.min(W - 10, p.x)); p.y = Math.max(10, Math.min(H - 10, p.y)); } } }
      // 리본 그리기: 점을 따라 그림 천을 휘어 붙임
      function band(pts, under, len0) { if (!tex) tex = mkTex(); if (!tex || pts.length < 2) return; let acc = len0 || 0;
        for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1], dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy); if (l < .5) continue; const a2 = Math.atan2(dy, dx);
          g.save(); g.translate(p.x, p.y); g.rotate(a2);
          if (i === 0 || i % 1 === 0) { g.fillStyle = 'rgba(40,20,10,.18)'; g.fillRect(0, -RW / 2 + 3, l + 1, RW); }
          const sx = acc % (tex.width - 40); g.drawImage(tex, sx, 0, Math.max(1, l), tex.height, 0, -RW / 2, l + 1.2, RW);
          const prev = pts[Math.max(0, i - 1)], bend = Math.atan2(dy, dx) - Math.atan2(p.y - prev.y, p.x - prev.x); const sh = Math.max(-.35, Math.min(.35, Math.sin(bend) * 2));   // 꺾이는 곳 명암
          if (sh || under) { g.fillStyle = sh > 0 ? `rgba(255,240,230,${sh * .6})` : `rgba(30,10,10,${(-sh) * .7 + (under ? .25 : 0)})`; g.fillRect(0, -RW / 2, l + 1, RW); }
          g.restore(); acc += l; } }
      // 고리: 매듭에서 나가서 끝점 P를 돌아 다시 매듭으로
      function loopPts(side, P) { const out = [], dx = P.x - K.x, dy = P.y - K.y, L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0, wv = L0 * .55;
        for (let t = 0; t <= 1.0001; t += 1 / 40) { const u = Math.sin(t * Math.PI), s2 = Math.sin(t * Math.PI * 2) * (side === 'R' ? 1 : -1); out.push({ x: K.x + dx * u + nx * wv * s2 * .9, y: K.y + dy * u + ny * wv * s2 * .9 }); } return out; }
      can.addEventListener('pointerdown', e => { const p = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId); ptr = p;
        if (stage < 4) { const r = R(STAGES[stage].who); let bi = -1, bd = 40; r.forEach((q, i) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (i > 3 && d < bd) { bd = d; bi = i; } }); if (bi >= 0) grab = { r, i: bi }; else { const o = R(STAGES[stage].who === 'A' ? 'B' : 'A'); o.forEach((q, i) => { if (i > 3 && Math.hypot(q.x - p.x, q.y - p.y) < 30) grab = { r: o, i }; }); } return; }
        if (scissors) { for (const k of ['A', 'B']) { const t = tails[k]; if (!t) continue; t.forEach((q, i) => { if (i > 4 && Math.hypot(q.x - p.x, q.y - p.y) < 22) { tails[k] = t.slice(0, i + 1); cuts[k] = 1; tone(1400, .05, .06, 'square'); setTimeout(() => tone(900, .05, .05, 'square'), 60); } }); } scissors = false; ui(); return; }
        for (const k of ['L', 'R']) if (Math.hypot(p.x - loops[k].x, p.y - loops[k].y) < 50) { grab = { loop: k }; return; }
        for (const k of ['A', 'B']) { const t = tails[k]; let bi = -1, bd = 34; t.forEach((q, i) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (i > 2 && d < bd) { bd = d; bi = i; } }); if (bi >= 0) { grab = { r: t, i: bi }; return; } } });
      can.addEventListener('pointermove', e => { ptr = at(e, can); });
      const up = () => { grab = null; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function advance() { const S = STAGES[stage]; if (stage >= 4 || !grab || grab.r !== R(S.who) || grab.i < R(S.who).length - 6) return; const tip = R(S.who)[R(S.who).length - 1], c = S.cps[cp];
        if (Math.hypot(tip.x - c[0], tip.y - c[1]) < 38) { cp++; tone(600 + cp * 90, .08, .05, 'sine');
          if (cp >= S.cps.length) { stage++; cp = 0; grab = null; [523, 659, 784].forEach((f, k) => setTimeout(() => tone(f, .18, .06, 'sine'), k * 90));
            if (stage === 3) { loops.R = { x: 520, y: 250 }; B = B.slice(0, 14); }
            if (stage === 4) { loops.L = { x: 190, y: 250 }; tails.A = rope(14, 2.0); tails.B = rope(14, 1.1); A = []; B = []; }
            ui(); } } }
      function frame(now) { if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (now - (t0 || now)) / 1000); t0 = now;
        g.fillStyle = '#cfe0ec'; g.fillRect(0, 0, W, H); if (box.complete) { g.save(); g.shadowColor = 'rgba(40,60,90,.3)'; g.shadowBlur = 24; g.shadowOffsetY = 10; g.drawImage(box, 70, 90, 560, 507); g.restore(); }
        // 상자에 감긴 리본(십자)
        band([{ x: K.x, y: 96 }, { x: K.x, y: 460 }], false, 0); band([{ x: 78, y: K.y }, { x: 622, y: K.y }], false, 300);
        if (stage < 4) { sim(A); sim(B); advance();
          const aTop = stage >= 1; if (aTop) { band(B, false); band(A, false); } else { band(A, false); band(B, false); }
          if (stage >= 3) band(loopPts('R', loops.R), false, 80);
          if (stage >= 1) { g.save(); g.translate(K.x, K.y); g.fillStyle = 'rgba(40,10,10,.25)'; g.beginPath(); g.ellipse(0, 3, 22, 16, 0, 0, 7); g.fill(); g.restore(); }
          const S = STAGES[stage], tip = R(S.who)[R(S.who).length - 1], rest = S.cps.slice(cp);
          g.save(); g.setLineDash([7, 7]); g.strokeStyle = 'rgba(192,57,43,.75)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(tip.x, tip.y); rest.forEach(c => g.lineTo(c[0], c[1])); g.stroke(); g.setLineDash([]);
          rest.forEach((c, i) => { g.fillStyle = i === 0 ? 'rgba(192,57,43,.9)' : 'rgba(192,57,43,.4)'; g.beginPath(); g.arc(c[0], c[1], i === 0 ? 9 + Math.sin(now / 200) * 2 : 6, 0, 7); g.fill(); });
          const pulse = .5 + .5 * Math.sin(now / 260); g.strokeStyle = `rgba(255,220,120,${.5 + .4 * pulse})`; g.lineWidth = 3; g.beginPath(); g.arc(tip.x, tip.y, 22 + pulse * 4, 0, 7); g.stroke(); g.restore(); }
        else { if (grab && grab.loop && ptr) { const lp = loops[grab.loop]; lp.x += (ptr.x - lp.x) * .25; lp.y += (ptr.y - lp.y) * .25; const d = Math.hypot(lp.x - K.x, lp.y - K.y); if (d > 230) { lp.x = K.x + (lp.x - K.x) / d * 230; lp.y = K.y + (lp.y - K.y) / d * 230; }
            const t = tails[grab.loop === 'L' ? 'A' : 'B']; const want = Math.max(5, Math.round(18 - d / 16)); while (t.length > want) t.pop(); while (t.length < want) { const q = t[t.length - 1]; t.push({ x: q.x, y: q.y + 4, px: q.x, py: q.y + 4 }); } }   // 고리를 키우면 꼬리가 짧아짐
          const dL = Math.hypot(loops.L.x - K.x, loops.L.y - K.y), dR = Math.hypot(loops.R.x - K.x, loops.R.y - K.y), pull = grab && grab.loop ? 1 : 0;
          if (pull && dL > 110 && dR > 110) tight = Math.min(1, tight + dt * .8); if (tight >= 1 && !api._t) { api._t = 1; tone(784, .2, .07, 'sine'); setTimeout(() => tone(1047, .25, .07, 'sine'), 120); api.ready(true); ui(); }
          sim(tails.A); sim(tails.B);
          band(tails.A, false, 40); band(tails.B, false, 200);
          for (const k of ['A', 'B']) if (cuts[k]) { const t = tails[k], p = t[t.length - 1], q = t[t.length - 2], a2 = Math.atan2(p.y - q.y, p.x - q.x); g.save(); g.translate(p.x, p.y); g.rotate(a2); g.fillStyle = '#cfe0ec'; g.beginPath(); g.moveTo(2, -RW / 2 - 1); g.lineTo(-10, 0); g.lineTo(2, RW / 2 + 1); g.closePath(); g.fill(); g.restore(); }   // V자로 자른 끝
          band(loopPts('L', loops.L), false, 500); band(loopPts('R', loops.R), false, 80);
          const ks = 1 - tight * .35; g.save(); g.translate(K.x, K.y); g.scale(ks, ks); g.rotate(Math.PI / 2); g.translate(-K.x, -K.y); band([{ x: K.x - 18, y: K.y }, { x: K.x + 18, y: K.y }], false, 700); g.restore();   // 매듭
          if (!tight || tight < 1) { for (const k of ['L', 'R']) { const lp = loops[k], pulse = .5 + .5 * Math.sin(now / 260 + (k === 'L' ? 0 : 1.5)); g.strokeStyle = `rgba(255,220,120,${.4 + .4 * pulse})`; g.lineWidth = 3; g.beginPath(); g.arc(lp.x, lp.y, 20 + pulse * 4, 0, 7); g.stroke(); } }
          g.fillStyle = 'rgba(255,250,240,.9)'; g.fillRect(16, 16, 200, 40); g.fillStyle = '#6b4a3a'; g.font = '16px "Gowun Batang",serif'; g.textAlign = 'left'; g.fillText(tight >= 1 ? '꽉 묶였어요 ✓' : `조이기 ${Math.round(tight * 100)}%`, 28, 42); } }
      function ui() { const T = tools(side);
        const st = mk('div', 'rbsteps'); STAGES.forEach((S, i) => { const sp = mk('span', i < stage ? 'done' : i === stage ? 'on' : '', `${i + 1}. ${S.t}`); st.append(sp); }); side.append(st);
        const r = T.row('리본 색'); Object.entries(COLS).forEach(([k, [n, f]]) => { const b2 = T.chip(r, n, () => { col = k; tex = null; ui(); }, k === col); b2.style.setProperty('--f', f); });
        side.append(mk('p', 'thint', stage < 4 ? STAGES[stage].h + ' 반짝이는 끝을 잡고 빨간 점을 차례로 따라가요.' : (tight >= 1 ? '예쁘게 묶였어요. 고리를 끌어 크기를 바꾸면 꼬리 길이도 바뀌어요. 가위로 꼬리 끝을 V자로 다듬을 수도 있어요.' : STAGES[4].h)));
        if (stage >= 4) T.chip(T.row('다듬기'), scissors ? '✂ 꼬리를 눌러 자르기' : '✂ 가위', () => { scissors = !scissors; ui(); }, scissors);
        const a2 = T.acts(); T.sub(a2, '처음부터', () => { api._t = 0; reset(); }); }
      reset(); requestAnimationFrame(frame);
      window.__rb = { jump: n => { while (stage < n) { const S = STAGES[stage]; cp = S.cps.length - 1; const r = R(S.who); grab = { r, i: r.length - 1 }; const c = S.cps[cp]; r[r.length - 1].x = c[0]; r[r.length - 1].y = c[1]; advance(); } }, pull: () => { loops.L = { x: 140, y: 230 }; loops.R = { x: 560, y: 230 }; tight = 1; api.ready(true); api._t = 1; } };
      return { reset, result() { if (tight < 1) return null; const sv = g.getImageData(0, 0, W, H); frame.call ? 0 : 0; const o = cv(220, 200); o.getContext('2d').drawImage(can, 60, 80, 580, 530, 0, 0, 220, 200); return { img: o.toDataURL('image/png') }; }, stop() { alive = false; pw && pw.classList.remove('xwide'); } };
    },
  };

  // ── 겨울 새 모이 주기: 씨앗 자루에서 숟가락으로 떠서 새집 받침에 부으면 새들이 하나둘 날아와 쪼아 먹음
  plays.birds = {
    title: '겨울 새 모이 주기', doneLabel: '트리에 달기', doneMsg: '모이를 먹으러 온 겨울 새들을 트리에 앉혀 뒀어요.',
    start(board, api) {
      board.className = 'pboard bdp'; const pw = board.closest('.panel-wrap'); pw && pw.classList.add('xwide');
      const W = 900, H = 600, can = cv(W, H, 'bdcv'), g = can.getContext('2d'), side = mk('div', 'bdside'); board.append(can, side);
      const bg = pic('bd_bg.jpg'), sack = pic('bd_sack.png'), scoopI = pic('bd_scoop.png');
      const SP = { robin: { n: '울새', im: pic('bird_robin.png') }, sparrow: { n: '참새', im: pic('bird_sparrow.png') }, chick: { n: '박새', im: pic('bird_chick.png') } }, KINDS = Object.keys(SP);
      const LEDGE = { x0: 348, x1: 562, y: 404 }, SPOTS = [372, 432, 492, 548].map(x => ({ x, y: LEDGE.y })), SACK = { x: 770, y: 490 };
      let seeds = [], held = false, scoop = 0, ptr = null, lp = null, spd = 0, birds = [], visits = [], alive = true, t0 = 0, spawnT = 2, falling = [];
      const FR = (im, i) => ({ sx: i * 150, sw: 150 });
      function drawBird(b) { const im = SP[b.k].im; if (!im.complete) return; let fi;
        if (b.st === 'idle') fi = Math.floor(b.t * 6) % 16; else if (b.st === 'in') fi = 16 + 4 + Math.floor(b.t * 18) % 6; else fi = 16 + Math.min(9, Math.floor(b.t * 14)); 
        const s = 150, h = s; g.save(); g.translate(b.x, b.y); if (b.flip) g.scale(-1, 1); g.drawImage(im, fi * 150, 0, 150, 150, -s / 2, -h * .86, s, h); g.restore(); }
      function spawn() { const free = SPOTS.filter(p => !birds.some(b => b.spot === p)); if (!free.length) return; const spot = free[Math.floor(Math.random() * free.length)], k = KINDS[Math.floor(Math.random() * KINDS.length)], fromL = Math.random() < .5;
        birds.push({ k, spot, st: 'in', t: 0, x: fromL ? -60 : W + 60, y: rnd(60, 160), sx: fromL ? -60 : W + 60, sy: rnd(40, 160), flip: !fromL }); tone(1800, .05, .04, 'sine'); setTimeout(() => tone(2200, .05, .04, 'sine'), 90); }
      can.addEventListener('pointerdown', e => { const p = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId); ptr = p;
        if (Math.hypot(p.x - SACK.x, p.y - SACK.y) < 110) { held = true; scoop = 1; tone(240, .08, .05, 'triangle'); for (let i = 0; i < 6; i++) tone(rnd(2500, 4000), .02, .02, 'square'); ui(); } });
      can.addEventListener('pointermove', e => { const p = at(e, can); ptr = p; });
      const up = () => { held = false; ui(); }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function frame(now) { if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (now - (t0 || now)) / 1000); t0 = now;
        if (ptr) { if (lp) spd = spd * .7 + Math.hypot(ptr.x - lp.x, ptr.y - lp.y) / dt * .3; lp = { x: ptr.x, y: ptr.y }; }
        // 붓기: 숟가락이 받침 위에 있으면 씨앗이 쏟아짐
        const over = held && ptr && ptr.x + 30 > LEDGE.x0 && ptr.x + 30 < LEDGE.x1 && ptr.y + 90 < LEDGE.y && ptr.y + 90 > LEDGE.y - 170;
        if (over && scoop > 0) { for (let i = 0; i < 3; i++) falling.push({ x: ptr.x + 32 + rnd(-6, 6), y: ptr.y + 96, vx: rnd(-20, 20), vy: rnd(0, 40), c: ['#7a5a3a', '#c9a46a', '#3b2f2a', '#e8d9b0'][Math.floor(Math.random() * 4)] }); scoop = Math.max(0, scoop - dt * .35); if (Math.random() < dt * 20) tone(rnd(3000, 5000), .015, .02, 'square'); }
        falling = falling.filter(f => { f.vy += 900 * dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.y >= LEDGE.y - 2 && f.x > LEDGE.x0 && f.x < LEDGE.x1) { if (seeds.length < 160) seeds.push({ x: f.x, y: LEDGE.y - rnd(0, 5), c: f.c }); return false; } return f.y < H; });
        // 새: 모이가 있으면 하나둘 날아옴. 손을 확 휘저으면 놀라 날아감
        spawnT -= dt; const cap = Math.min(SPOTS.length, Math.floor(seeds.length / 25) + (seeds.length > 8 ? 1 : 0));
        if (spawnT <= 0 && birds.filter(b => b.st !== 'out').length < cap) { spawn(); spawnT = rnd(2.5, 5); }
        for (const b of birds) { b.t += dt;
          if (b.st === 'in') { const k = Math.min(1, b.t / 1.6), e2 = 1 - (1 - k) * (1 - k); b.x = b.sx + (b.spot.x - b.sx) * e2; b.y = b.sy + (b.spot.y - b.sy) * e2 - Math.sin(k * Math.PI) * 50; if (k >= 1) { b.st = 'idle'; b.t = 0; visits.push(b.k); ready(); ui(); } }
          else if (b.st === 'idle') { if (Math.random() < dt * .8 && seeds.length) { const i = seeds.findIndex(q => Math.abs(q.x - b.x) < 24); if (i >= 0) seeds.splice(i, 1); tone(rnd(2600, 3200), .02, .02, 'square'); }
            if (ptr && spd > 1300 && Math.hypot(ptr.x - b.x, ptr.y - (b.y - 40)) < 170) { b.st = 'out'; b.t = 0; b.vx = (b.x > W / 2 ? 1 : -1) * rnd(260, 360); b.flip = b.vx < 0; tone(900, .08, .05, 'triangle'); }
            if (!seeds.some(q => Math.abs(q.x - b.x) < 40) && b.t > 4) { b.st = 'out'; b.t = 0; b.vx = (Math.random() < .5 ? -1 : 1) * 260; b.flip = b.vx < 0; } }
          else { if (b.t > .45) { b.x += b.vx * dt; b.y -= 220 * dt; } } }
        birds = birds.filter(b => b.st !== 'out' || (b.y > -150 && b.x > -150 && b.x < W + 150));
        // 그리기
        if (bg.complete) g.drawImage(bg, 0, 0, W, H);
        for (const q of seeds) { g.fillStyle = q.c; g.beginPath(); g.ellipse(q.x, q.y, 2.4, 1.6, .4, 0, 7); g.fill(); }
        for (const b of birds) drawBird(b);
        for (const f of falling) { g.fillStyle = f.c; g.fillRect(f.x, f.y, 2.6, 2); }
        if (sack.complete) g.drawImage(sack, SACK.x - 115, SACK.y - 103, 230, 206);
        if (held && ptr && scoopI.complete) { g.save(); g.translate(ptr.x, ptr.y); g.rotate(over ? -.35 : 0); g.drawImage(scoopI, -14, -8, 70, 116); if (scoop > 0) { g.fillStyle = 'rgba(110,80,52,.9)'; g.beginPath(); g.ellipse(36, 82, 13 * scoop + 2, 16 * scoop + 1, -.45, 0, 7); g.fill(); } g.restore(); }
        g.fillStyle = 'rgba(255,250,240,.9)'; g.fillRect(16, 16, 250, 44); g.fillStyle = '#6b4a3a'; g.font = '16px "Gowun Batang",serif'; g.textAlign = 'left'; g.fillText(`받침의 모이 ${Math.min(100, Math.round(seeds.length / 1.6))}% · 다녀간 새 ${visits.length}마리`, 28, 44); }
      const ready = () => api.ready(visits.length >= 3);
      function ui() { const T = tools(side); const r = T.row('찾아온 새'); KINDS.forEach(k => { const n = visits.filter(v => v === k).length; T.chip(r, `${SP[k].n} ${n ? '×' + n : '·'}`, () => {}, n > 0); });
        side.append(mk('p', 'thint', held ? '숟가락을 새집 받침 위로 가져가면 씨앗이 쏟아져요.' : '오른쪽 아래 씨앗 자루를 눌러 숟가락으로 떠요. 새집 받침에 부어 두면 새들이 하나둘 날아와요. 손을 확 휘저으면 놀라서 날아가니 살살 움직여요. 새가 세 번 다녀가면 끝!')); }
      const reset = () => { seeds = []; birds = []; visits = []; falling = []; scoop = 0; held = false; spawnT = 2; ui(); api.ready(false); api.guide('겨울이라 새들이 배고파요. 새집 받침에 모이를 부어 줘요.'); };
      reset(); requestAnimationFrame(frame);
      window.__bd = { fill: () => { for (let i = 0; i < 120; i++) seeds.push({ x: rnd(LEDGE.x0, LEDGE.x1), y: LEDGE.y - rnd(0, 5), c: '#7a5a3a' }); }, spawn, visits: () => visits.length };
      return { reset, result() { return visits.length >= 3 ? { birds: visits.length } : null; }, stop() { alive = false; pw && pw.classList.remove('xwide'); } };
    },
  };

  // ── 고양이: ① 깨지 않게 담요 덮어 주기 ② 깃털 장난감 놀이 ③ 숨바꼭질
  plays.cat = {
    title: '낮잠 자는 고양이', doneLabel: '자게 두기', doneMsg: '고양이가 새근새근 자고 있어요.',
    start(board, api) {
      board.className = 'pboard catp'; const pw = board.closest('.panel-wrap'); pw && pw.classList.add('xwide');
      const W = 900, H = 600, can = cv(W, H, 'catcv'), g = can.getContext('2d'), side = mk('div', 'catside'); board.append(can, side);
      const I = {}; ['cat_pet.jpg', 'cat_cover.jpg', 'cat_wake.jpg', 'cat_room.jpg', 'cat_ready.png', 'cat_peek.png', 'cat_jump.png', 'cat_back.png', 'cat_toy.png', 'cat_blanket.png', 'it_cookie.png'].forEach(f => I[f.split('.')[0]] = pic(f));
      const vid = src => { const v = document.createElement('video'); v.src = 'assets/' + src; v.muted = true; v.playsInline = true; v.preload = 'auto'; return v; };
      const VW = vid('v_cat_wake.mp4'), VR = vid('v_cat_room.mp4'); VR.loop = true; VR.play().catch(() => {});
      const room = (x2) => { if (VR.readyState >= 2) x2.drawImage(VR, RX * .72, 0, W * .72, 432, 0, 0, W, H); else if (I.cat_room.complete) x2.drawImage(I.cat_room, RX, 0, W, H, 0, 0, W, H); };
      let tab = 'blanket', alive = true, t0 = 0, done = { blanket: false, toy: 0, seek: 0 }, ptr = null, zz = [];
      // ── ① 담요
      const MK = cv(W, H), mg = MK.getContext('2d'), HEAD = { x: 300, y: 215 }, BODY = { x: 560, y: 320, rx: 340, ry: 230 };
      let bl = null, wake = 0, woke = 0, cover = 0, lastP = null, lastT = 0, finished = 0;
      const blHome = () => ({ x: 790, y: 500, held: false });
      function coverage() { const d = mg.getImageData(0, 0, W, H).data; let n = 0, k = 0; for (let y = BODY.y - BODY.ry; y < BODY.y + BODY.ry; y += 20) for (let x = BODY.x - BODY.rx; x < BODY.x + BODY.rx; x += 20) { if (((x - BODY.x) / BODY.rx) ** 2 + ((y - BODY.y) / BODY.ry) ** 2 > 1) continue; n++; if (d[(Math.round(y) * W + Math.round(x)) * 4 + 3] > 140) k++; } return n ? k / n : 0; }
      function brush(p) { const r = 80, gr = mg.createRadialGradient(p.x, p.y, r * .3, p.x, p.y, r); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); mg.fillStyle = gr; mg.beginPath(); mg.arc(p.x, p.y, r, 0, 7); mg.fill(); }
      // ── ② 깃털
      let toy = { x: 450, y: 200 }, cat2 = null, excite = 0;
      const resetToy = () => { cat2 = { st: 'watch', x: 450, t: 0 }; excite = 0; };
      // ── ③ 숨바꼭질
      const SPOTS = [{ n: '안락의자', x: 230, y: 330 }, { n: '선물 더미', x: 490, y: 440 }, { n: '트리 뒤', x: 470, y: 250 }, { n: '바구니', x: 690, y: 400 }, { n: '벽난로 옆', x: 860, y: 380 }, { n: '커튼 뒤', x: 70, y: 240 }];
      let hide = 0, found = null, pokes = [], rustle = 0;
      const newHide = () => { let k; do k = Math.floor(Math.random() * SPOTS.length); while (k === hide); hide = k; found = null; rustle = 1.5; };
      const RX = 150;   // 방 그림 1200폭 중 가운데 900만 보여 줌
      can.addEventListener('pointerdown', e => { const p = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId); ptr = p;
        if (tab === 'blanket' && !finished && !woke && bl && Math.hypot(p.x - bl.x, p.y - bl.y) < 120) { bl.held = true; bl.ox = p.x - bl.x; bl.oy = p.y - bl.y; lastP = p; lastT = performance.now(); }
        if (tab === 'seek' && !found) { const k = SPOTS.findIndex(s2 => Math.hypot(p.x - s2.x, p.y - s2.y) < 80); if (k < 0) return;
          if (k === hide) { found = { k, t: 0 }; done.seek++; tone(880, .15, .08, 'sine'); setTimeout(() => tone(1175, .2, .08, 'sine'), 120); ready(); ui(); setTimeout(() => { if (alive && tab === 'seek') { newHide(); ui(); } }, 2200); }
          else { pokes.push({ x: SPOTS[k].x, y: SPOTS[k].y, t: 0 }); tone(200, .08, .05, 'triangle'); } } });
      can.addEventListener('pointermove', e => { const p = at(e, can); ptr = p;
        if (tab === 'blanket' && bl && bl.held) { const now = performance.now(), dtm = Math.max(8, now - lastT), v = Math.hypot(p.x - lastP.x, p.y - lastP.y) / dtm * 1000; lastP = p; lastT = now;
          bl.x = p.x - bl.ox; bl.y = p.y - bl.oy;
          const nearHead = Math.hypot(bl.x - HEAD.x, bl.y - HEAD.y) < 150;
          wake = Math.min(1, wake + Math.max(0, v - 650) / 26000 + (nearHead ? .012 + v / 60000 : 0));
          if (((bl.x - BODY.x) / BODY.rx) ** 2 + ((bl.y - BODY.y) / BODY.ry) ** 2 < 1.1 && !nearHead) { brush(bl); cover = coverage(); if (cover > .86) finishBlanket(); }
          if (wake >= 1) wakeUp(); }
        if (tab === 'toy') { toy.x = p.x; toy.y = Math.min(H - 60, p.y); } });
      const up = () => { if (bl) bl.held = false; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function wakeUp() { woke = 1.6; bl = null; mg.clearRect(0, 0, W, H); cover = 0; tone(330, .12, .08, 'triangle'); setTimeout(() => tone(260, .2, .08, 'triangle'), 110); api.guide('앗, 깼어요! 고양이가 담요를 차 버렸어요. 다시 잠들면 더 천천히 덮어 주세요.'); ui(); }
      function finishBlanket() { finished = 1; bl = null; done.blanket = true; mg.fillStyle = '#000'; mg.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) setTimeout(() => tone(110 + (i % 2) * 8, .35, .05, 'sine'), i * 380); api.guide('담요를 폭 덮어 줬어요. 골골… 새근새근.'); ready(); ui(); }
      const ready = () => api.ready(done.blanket || done.toy >= 3 || done.seek >= 3);
      function drawBlanket(dt, now) {
        const base = I.cat_pet, cov = I.cat_cover; if (base.complete) g.drawImage(base, 0, 0, W, H);
        if (cov.complete) { const t = cv(W, H), x = t.getContext('2d'); x.drawImage(cov, 0, 0, W, H); x.globalCompositeOperation = 'destination-in'; x.filter = 'blur(6px)'; x.drawImage(MK, 0, 0); g.drawImage(t, 0, 0); }
        if (woke > 0) { woke -= dt; wake = Math.max(wake, woke > .4 ? 1 : woke / .4); if (woke <= 0) { woke = 0; wake = 0; bl = blHome(); api.guide('다시 잠들었어요. 이번엔 살금살금 덮어 줘요.'); } }
        else if (!(bl && bl.held)) wake = Math.max(0, wake - dt * .35); else wake = Math.max(0, wake - dt * .12);
        if (wake > .3 && VW.paused && !VW.ended) VW.play().catch(() => {}); if (wake <= .02 && !VW.paused) { VW.pause(); } if (wake <= .02 && VW.currentTime > 0 && VW.paused) VW.currentTime = 0;
        const wsrc = VW.readyState >= 2 && VW.currentTime > 0 ? VW : (I.cat_wake.complete ? I.cat_wake : null);
        if (wake > .05 && wsrc) { const t = cv(W, H), x = t.getContext('2d'); x.drawImage(wsrc, 0, 0, W, H); x.globalCompositeOperation = 'destination-in'; const gr = x.createRadialGradient(HEAD.x, HEAD.y, 60, HEAD.x, HEAD.y, 190); gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, W, H); g.save(); g.globalAlpha = Math.min(1, wake * 1.3); g.drawImage(t, 0, 0); g.restore(); }
        if (bl && I.cat_blanket.complete) { const im = I.cat_blanket, sc = (bl.held ? 1.05 : 1) * (1 - cover * .45), w = 240 * sc, h = w * im.naturalHeight / im.naturalWidth; g.save(); g.shadowColor = 'rgba(40,30,20,.35)'; g.shadowBlur = bl.held ? 22 : 10; g.shadowOffsetY = bl.held ? 16 : 6; g.drawImage(im, bl.x - w / 2, bl.y - h / 2, w, h); g.restore(); }
        // 깨는 정도(가슴이 콩닥)
        if (!finished) { g.fillStyle = 'rgba(255,250,240,.85)'; g.fillRect(20, 20, 220, 50); g.fillStyle = '#6b4a3a'; g.font = '15px "Gowun Batang",serif'; g.textAlign = 'left'; g.fillText('뒤척임', 32, 50); g.fillStyle = '#eadfce'; g.fillRect(90, 38, 135, 14); g.fillStyle = wake > .6 ? '#c0392b' : '#d9a441'; g.fillRect(90, 38, 135 * wake, 14);
          g.fillText(`덮은 만큼 ${Math.round(cover * 100)}%`, 32, 92); }
        if (finished && Math.random() < dt * 1.5) zz.push({ x: HEAD.x + 60, y: HEAD.y - 40, t: 0 });
      }
      function drawToy(dt, now) { room(g); g.fillStyle = 'rgba(255,245,230,.18)'; g.fillRect(0, 0, W, H);
        const c = cat2, gy = H - 30; c.t += dt;
        const spd = ptr && c.lp ? Math.hypot(toy.x - c.lp.x, toy.y - c.lp.y) / dt : 0; c.lp = { x: toy.x, y: toy.y };
        if (c.st === 'watch') { c.x += (Math.max(160, Math.min(W - 160, toy.x)) - c.x) * dt * .8; if (Math.abs(toy.x - c.x) < 380) excite = Math.min(1, excite + Math.min(spd, 1500) / 1500 * dt * 1.4); excite = Math.max(0, excite - dt * .18);
          if (excite >= .97 && toy.y > 230) { c.st = 'jump'; c.t = 0; c.from = { x: c.x, y: gy - 120 }; c.to = { x: toy.x, y: toy.y + 40 }; excite = 0; tone(520, .06, .06, 'triangle'); } }
        else if (c.st === 'jump' && c.t > .5) { const hit = Math.hypot(toy.x - c.to.x, toy.y + 40 - c.to.y) < 120; c.st = hit ? 'caught' : 'miss'; c.t = 0; if (hit) { done.toy++; [660, 880, 990].forEach((f, k) => setTimeout(() => tone(f, .15, .07, 'sine'), k * 90)); ready(); ui(); } else tone(240, .1, .05, 'triangle'); }
        else if ((c.st === 'caught' && c.t > 1.6) || (c.st === 'miss' && c.t > .9)) { c.st = 'watch'; c.t = 0; }
        const draw = (P, a) => { const im = P.im; if (!im.complete) return; const h = P.w * im.naturalHeight / im.naturalWidth; g.save(); g.globalAlpha = a; g.translate(P.x, P.y); g.rotate(P.rot || 0); g.scale((P.flip ? -1 : 1) * (P.sx || 1), P.sy || 1); g.drawImage(im, -P.w / 2, -h, P.w, h); g.restore(); };
        const flip = toy.x > c.x; let P;   // 장난감 쪽을 바라보게
        if (c.st === 'watch') { const wig = excite > .5 ? Math.sin(now / 50) * excite * .03 : 0, crouch = 1 - excite * .06; P = { im: I.cat_ready, x: c.x, y: gy, w: 330, rot: wig, flip, sx: 1 + excite * .04, sy: crouch }; }
        else if (c.st === 'jump') { const k = Math.min(1, c.t / .5), e2 = 1 - (1 - k) * (1 - k), x = c.from.x + (c.to.x - c.from.x) * e2, y = c.from.y + (c.to.y - c.from.y) * e2 - Math.sin(k * Math.PI) * 120, st2 = 1 + Math.sin(k * Math.PI) * .12;
          P = { im: I.cat_jump, x, y: y + 200, w: 260, rot: (c.to.x - c.from.x) / 900, sx: 1 / st2, sy: st2 }; }
        else if (c.st === 'caught') { const k = Math.min(1, c.t / .25), sq = k < 1 ? 1 - Math.sin(k * Math.PI) * .12 : 1; P = { im: I.cat_back, x: c.to.x, y: gy, w: 330, sx: 2 - sq, sy: sq }; }
        else { const k = Math.min(1, c.t / .3); P = { im: I.cat_jump, x: c.to ? c.to.x : c.x, y: gy + 40 * (1 - k), w: 230, sy: .92 + .08 * k }; }
        // 자세가 바뀔 때 0.25초 동안 앞 자세와 겹쳐 부드럽게 넘어감
        if (c.lastSt !== c.st) { c.prevP = c.curP; c.fade = 0; c.lastSt = c.st; } c.fade = Math.min(1, (c.fade || 0) + dt / .25); c.curP = P;
        if (c.prevP && c.fade < 1) draw(c.prevP, 1 - c.fade);
        draw(P, c.prevP ? c.fade : 1);
        if (c.st === 'miss' && c.t > .3) c.x = c.to ? c.to.x : c.x;
        // 장난감 + 줄
        const tx = c.st === 'caught' ? c.to.x - 20 : toy.x, ty = c.st === 'caught' ? gy - 220 : toy.y;
        g.strokeStyle = 'rgba(250,240,220,.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(tx + 120, -10); g.quadraticCurveTo(tx + 60, ty / 2, tx, ty); g.stroke();
        if (I.cat_toy.complete) { const sw = Math.sin(now / 160) * .12 + Math.max(-.5, Math.min(.5, spd / 3000)); g.save(); g.translate(tx, ty); g.rotate(sw); g.drawImage(I.cat_toy, -96 * .7, -120 * .7, 240 * .7, 253 * .7); g.restore(); }
        if (c.st === 'watch') { g.fillStyle = 'rgba(255,250,240,.85)'; g.fillRect(20, 20, 220, 40); g.fillStyle = '#6b4a3a'; g.font = '15px "Gowun Batang",serif'; g.textAlign = 'left'; g.fillText('두근두근', 32, 45); g.fillStyle = '#eadfce'; g.fillRect(100, 33, 125, 14); g.fillStyle = '#d98a41'; g.fillRect(100, 33, 125 * excite, 14); }
      }
      function drawSeek(dt, now) { room(g);
        rustle -= dt; if (rustle <= 0 && !found) rustle = 3.5 + Math.random() * 2;
        const sp = SPOTS[hide];
        if (!found && rustle > 3) { const k = rustle - 3; g.fillStyle = `rgba(255,250,235,${k})`; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(sp.x + Math.sin(now / 70 + i) * 26, sp.y - 30 - i * 6 + Math.cos(now / 90 + i) * 6, 2.5, 0, 7); g.fill(); } }
        if (found) { found.t += dt; const k = Math.min(1, found.t / .35), im = I.cat_peek; if (im.complete) { const w = 200, h = w * im.naturalHeight / im.naturalWidth, e2 = 1 - (1 - k) * (1 - k), t = cv(w, h), tg = t.getContext('2d'); tg.drawImage(im, 0, 0, w, h); tg.globalCompositeOperation = 'destination-in'; const gr = tg.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#000'); gr.addColorStop(.62, '#000'); gr.addColorStop(.92, 'rgba(0,0,0,0)'); tg.fillStyle = gr; tg.fillRect(0, 0, w, h);   // 아래쪽은 물건 뒤로 스며들게
            g.save(); g.globalAlpha = Math.min(1, k * 1.5); g.drawImage(t, sp.x - w / 2, sp.y + 30 - h * (.35 + .65 * e2), w, h); g.restore(); }
          if (I.it_cookie.complete && found.t > .4) { const c2 = Math.min(1, (found.t - .4) / .4); g.globalAlpha = c2; g.drawImage(I.it_cookie, sp.x + 70, sp.y - 70 - c2 * 20, 50, 50); g.globalAlpha = 1; } }
        pokes = pokes.filter(q => (q.t += dt) < .8); for (const q of pokes) { g.fillStyle = `rgba(255,255,255,${.8 - q.t})`; g.font = '18px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText('여긴 없어요', q.x, q.y - 40 - q.t * 30); }
        g.fillStyle = 'rgba(255,250,240,.88)'; g.fillRect(20, 20, 210, 40); g.fillStyle = '#6b4a3a'; g.font = '15px "Gowun Batang",serif'; g.textAlign = 'left'; g.fillText(`찾은 횟수 ${done.seek} · 간식 ${done.seek}개`, 32, 46); }
      function frame(now) { if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (now - (t0 || now)) / 1000); t0 = now;
        if (tab === 'blanket') drawBlanket(dt, now); else if (tab === 'toy') drawToy(dt, now); else drawSeek(dt, now);
        zz = zz.filter(z => (z.t += dt) < 2.4); for (const z of zz) { if (tab !== 'blanket') break; g.fillStyle = `rgba(90,80,120,${.8 * (1 - z.t / 2.4)})`; g.font = `${18 + z.t * 8}px "Gowun Batang",serif`; g.fillText('z', z.x + z.t * 30 + Math.sin(z.t * 3) * 8, z.y - z.t * 50); } }
      function ui() { const T = tools(side);
        T.tabs([['blanket', '① 담요 덮기'], ['toy', '② 깃털 놀이'], ['seek', '③ 숨바꼭질']], tab, k => { tab = k; if (k === 'toy') resetToy(); if (k === 'seek' && !found) newHide(); api.guide({ blanket: '깨지 않게 살금살금 담요를 덮어 줘요.', toy: '깃털을 흔들어 고양이와 놀아 줘요.', seek: '숨은 고양이를 찾아 간식을 줘요.' }[k]); ui(); });
        const st = mk('div', 'catst'); st.innerHTML = `<span${done.blanket ? ' class="on"' : ''}>담요 ${done.blanket ? '✓' : ''}</span><span${done.toy >= 3 ? ' class="on"' : ''}>깃털 ${done.toy}/3</span><span${done.seek >= 3 ? ' class="on"' : ''}>숨바꼭질 ${done.seek}/3</span>`; side.append(st);
        if (tab === 'blanket') { side.append(mk('p', 'thint', finished ? '폭 덮어 줬어요. 고양이가 새근새근 자요.' : '오른쪽 아래 담요를 집어서 고양이 몸 위로 살살 끌어요. 빨리 움직이거나 얼굴 가까이 가면 뒤척여요. 몸을 다 덮으면 끝!'));
          if (finished) T.chip(T.row(''), '다시 해 보기', () => { finished = 0; done.blanket = done.blanket; mg.clearRect(0, 0, W, H); cover = 0; wake = 0; bl = blHome(); ui(); }); }
        if (tab === 'toy') side.append(mk('p', 'thint', '마우스를 움직이면 깃털이 따라가요. 살랑살랑 흔들어 두근두근을 채운 다음 바닥 가까이에서 멈추면 고양이가 덮쳐요. 세 번 잡게 해 주세요.'));
        if (tab === 'seek') side.append(mk('p', 'thint', '고양이가 방 어딘가에 숨었어요. 가끔 숨은 곳이 바스락거려요. 안락의자·선물·바구니 같은 곳을 눌러 찾아보세요. 찾으면 간식을 줘요.')); }
      const reset = () => { tab = 'blanket'; done = { blanket: false, toy: 0, seek: 0 }; mg.clearRect(0, 0, W, H); cover = 0; wake = 0; woke = 0; finished = 0; bl = blHome(); resetToy(); newHide(); ui(); api.ready(false); api.guide('고양이가 낮잠을 자요. 깨지 않게 담요를 덮어 주고, 일어나면 같이 놀아 줘요.'); };
      reset(); requestAnimationFrame(frame);
      window.__cat = { tab: k => { tab = k; if (k === 'toy') resetToy(); ui(); }, cover: () => { for (let x = 300; x <= 880; x += 30) for (let y = 120; y <= 540; y += 30) brush({ x, y }); cover = coverage(); if (cover > .86) finishBlanket(); return cover; }, toy: (x, y) => { toy.x = x; toy.y = y; }, excite: () => { excite = 1; }, hide: () => hide, spots: SPOTS };
      return { reset, result() { return (done.blanket || done.toy >= 3 || done.seek >= 3) ? { purr: 1 } : null; }, stop() { alive = false; VW.pause(); VR.pause(); VR.removeAttribute('src'); VR.load(); pw && pw.classList.remove('xwide'); } };
    },
  };

  // ── 마시멜로 굽기: 앞뒤를 돌려 가며 천천히 굽는다. 불꽃 속에 오래 두면 불이 붙고, 흔들어서 꺼야 한다. 가끔 불이 확 커진다.
  plays.marsh = {
    title: '마시멜로 굽기', doneLabel: '탁자에 올려 두기', doneMsg: '구운 마시멜로를 탁자에 올려 뒀어요.',
    start(board, api) {
      board.className = 'pboard marsh';
      const can = cv(720, 720, 'mmcv'), g = can.getContext('2d'), fire = pic('mm_fire.jpg'), im = { w: pic('mm_white.png'), g: pic('mm_gold.png'), b: pic('mm_burnt.png') };
      const bar = mk('div', 'pbar'), bFlip = mk('button', '', '뒤집기 (눌러도 돼요)'); bFlip.type = 'button'; bar.append(bFlip); board.append(can, bar);
      let heat = [0, 0], side = 0, flipT = 0, px = 600, py = 130, alive = true, flame = null, t0 = performance.now(), puffs = [], core = 0, lit = false, surge = 0, nextSurge = 7, shake = 0, lastX = 600, lastDir = 0, clock = 0;
      const tone = h => h < .3 ? '하얘요' : h < .7 ? '살짝 노릇' : h < 1.35 ? '노릇노릇' : h < 1.55 ? '좀 탔어요' : '새까매요';
      const reset = () => { heat = [0, 0]; side = 0; puffs = []; lit = false; core = 0; clock = 0; nextSurge = 7; api.ready(false); };
      const flip = () => { if (flipT <= 0) { flipT = .32; side = 1 - side; } };
      const mv = e => { const p = at(e, can); px = p.x; py = p.y; const dir = Math.sign(px - lastX); if (dir && dir !== lastDir && Math.abs(px - lastX) > 6) { shake += 1; lastDir = dir; } lastX = px; };
      can.addEventListener('pointermove', mv); can.addEventListener('pointerdown', e => { mv(e); flip(); }); bFlip.addEventListener('click', flip);
      const loop = now => {
        if (!alive) return; const dt = Math.min(.05, (now - t0) / 1000); t0 = now; clock += dt;
        if (clock > nextSurge) { surge = 1.6; nextSurge = clock + rnd(6, 11); }                 // 가끔 불이 확 커짐
        const big = surge > 0; if (big) surge -= dt;
        const d = Math.hypot(px - 360, py - 310) / (big ? 1.5 : 1), rate = d < 70 ? .2 : d < 160 ? .085 : d < 240 ? .03 : 0;
        core = d < 70 ? core + dt : Math.max(0, core - dt * 2); if (core > 3 && !lit) { lit = true; shake = 0; }
        if (lit) { heat[side] = Math.min(1.7, heat[side] + .22 * dt); heat[1 - side] = Math.min(1.7, heat[1 - side] + .1 * dt); if (shake >= 3) { lit = false; core = 0; puffs.push({ x: px, y: py - 30, t: 0 }, { x: px + 14, y: py - 44, t: .1 }); } }
        else heat[side] = Math.min(1.7, heat[side] + rate * dt);
        shake = Math.max(0, shake - dt * 2.2); if (flipT > 0) flipT -= dt;
        if (heat[side] > 1.15 && (rate || lit) && Math.random() < .2) puffs.push({ x: px + rnd(-20, 20), y: py - 30, t: 0 });
        const ok = heat[0] >= .55 && heat[1] >= .55; api.ready(ok);
        api.guide(lit ? '불이 붙었어요! 꼬치를 좌우로 빠르게 흔들어서 꺼요!' : big && d < 260 ? '불이 확 커졌어요. 잠깐 뒤로 빼요!' : !ok && heat[side] >= .8 ? '이쪽은 다 됐어요. 눌러서 뒤집어요.' : ok ? `앞: ${tone(heat[0])} · 뒤: ${tone(heat[1])} — 이제 빼도 돼요.` : rate ? `굽는 중… 지금 면: ${tone(heat[side])}` : '꼬치를 불 가까이 가져가요. 한쪽이 노릇해지면 눌러서 뒤집어요. 불꽃 속에 오래 두면 불이 붙어요.');
        g.drawImage(fire, 0, 0, 720, 720);
        g.globalAlpha = (big ? .45 : .12) + .08 * Math.sin(now / 90); const k = big ? 70 : 8; g.drawImage(fire, -k, -k * 2 - 6 * Math.sin(now / 140), 720 + k * 2, 720 + k * 2); g.globalAlpha = 1;
        const w = 150, h = w * 520 / 250, sx = flipT > 0 ? Math.abs(Math.cos((1 - flipT / .32) * Math.PI)) : 1, hh = heat[flipT > .16 ? 1 - side : side];
        g.save(); g.translate(px, py); g.rotate(-.5); g.scale(Math.max(.08, sx) * (side ? -1 : 1), 1);
        const drawM = (i, al) => { if (al <= 0 || !i.complete) return; g.globalAlpha = al; g.drawImage(i, -w / 2, -h * .13, w, h); };
        drawM(im.w, 1); drawM(im.g, Math.min(1, hh / .95)); drawM(im.b, Math.min(1, (hh - 1.3) / .35)); g.restore(); g.globalAlpha = 1;
        if (lit) {                                                                 // 마시멜로에 붙은 불: 불꽃 그림을 둥글게 잘라 얹음
          if (!flame && fire.complete) { flame = cv(300, 330); const fg = flame.getContext('2d'); fg.drawImage(fire, 210, 60, 300, 330, 0, 0, 300, 330); fg.globalCompositeOperation = 'destination-in'; const m = fg.createRadialGradient(150, 190, 20, 150, 180, 150); m.addColorStop(0, '#000'); m.addColorStop(.55, 'rgba(0,0,0,.9)'); m.addColorStop(1, 'rgba(0,0,0,0)'); fg.fillStyle = m; fg.fillRect(0, 0, 300, 330); }
          if (flame) { const fl = 150 + 14 * Math.sin(now / 60); g.drawImage(flame, px - fl / 2, py - fl * .95, fl, fl * 1.1); }
        }
        else if (rate > .1) { g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(px, py, 5, px, py, 90); gr.addColorStop(0, 'rgba(255,170,60,.3)'); gr.addColorStop(1, 'rgba(255,170,60,0)'); g.fillStyle = gr; g.fillRect(px - 90, py - 90, 180, 180); g.globalCompositeOperation = 'source-over'; }
        puffs = puffs.filter(p => (p.t += dt) < 1.2); for (const p of puffs) { g.fillStyle = `rgba(200,200,205,${.3 * (1 - p.t / 1.2)})`; g.beginPath(); g.arc(p.x, p.y - p.t * 70, 10 + p.t * 16, 0, 7); g.fill(); }
        for (let i = 0; i < 2; i++) {                                              // 앞·뒤가 얼마나 익었는지 작은 점으로
          const hv = heat[i], c = hv < .3 ? '#f4efe6' : hv < .7 ? '#ecd3a0' : hv < 1.35 ? '#d59a4a' : hv < 1.55 ? '#7a4a28' : '#2c1c14';
          g.fillStyle = c; g.strokeStyle = i === side ? '#fff' : 'rgba(255,255,255,.35)'; g.lineWidth = i === side ? 3 : 1.5; g.beginPath(); g.arc(34 + i * 34, 686, 12, 0, 7); g.fill(); g.stroke();
        }
        g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '13px sans-serif'; g.fillText('앞    뒤', 22, 664);
        requestAnimationFrame(loop);
      };
      reset(); requestAnimationFrame(loop);
      return { reset, result() { if (heat[0] < .55 || heat[1] < .55) return null; const burnt = Math.max(heat[0], heat[1]) >= 1.35; return { kind: burnt ? 'burnt' : 'gold', img: 'assets/' + (burnt ? 'mm_burnt.png' : 'mm_gold.png') }; }, stop() { alive = false; } };
    },
  };

  // ── 스노우볼: 잡고 흔들면 눈이 휘날리고, 가만히 두면 천천히 가라앉는다. 안에 넣을 것도 고를 수 있다.
  plays.globe = {
    title: '스노우볼', doneLabel: '탁자에 올려 두기', doneMsg: '내가 꾸민 스노우볼을 탁자에 올려 뒀어요.',
    start(board, api) {
      board.className = 'pboard globe';
      const can = cv(800, 800, 'gbcv'), g = can.getContext('2d'), glass = pic('globe_cut2.png'), back = pic('globe_bg.jpg'), bar = mk('div', 'pbar'), bar2 = mk('div', 'pbar'); board.append(can, bar, bar2);
      const CX = 396, CY = 350, R = 240, FLOOR = 548;
      const VS = window.__village && window.__village.state ? window.__village.state() : null;
      const LIB = [['tree_cut.png', '트리', 200], ['tree2_cut.png', '작은 나무', 120], ['snowman.png', '눈사람', 150], ['it_gift.png', '선물', 70], ['it_train.png', '기차', 80], ['it_woodbird.png', '나무 새', 60], ['it_boots.png', '장화', 70], ['it_stocking.png', '양말', 80], ['it_star.png', '별', 60], ['catc_1.png', '고양이', 90]]
        .concat(((VS && VS.chars) || []).map((c, i) => [c.img, '내 캐릭터' + (i + 1), 110]));
      const SNOW = [['rgba(255,255,255,.95)', '눈', 'dot'], ['rgba(255,214,110,.95)', '금가루', 'fine'], ['rgba(230,232,240,.95)', '은가루', 'fine'], ['rgba(255,165,200,.95)', '분홍 가루', 'dot'], ['rgba(165,212,255,.95)', '하늘 가루', 'dot'],
        ['rgba(255,220,120,.98)', '별 반짝이', 'star'], ['rgba(240,110,130,.98)', '하트 반짝이', 'heart'], ['rgba(255,255,255,.98)', '눈송이', 'flake']];
      const AMT = [['적게', 400], ['보통', 750], ['많이', 1150], ['가득', 1600]];
      let mix = { 0: 1 }, amt = 1, tab = 'items';
      let items = [], sel = -1, drag = null, mode = 'deco', snow = 0, ox = 0, oy = 0, vx = 0, vy = 0, alive = true, shaken = false, t0 = performance.now(), gdrag = null;
      let P = [];
      function fill() {                                                              // 고른 반짝이들을 섞어서 채움
        const kinds = Object.keys(mix).filter(k => mix[k]).map(Number); if (!kinds.length) kinds.push(0); const n = AMT[amt][1], old = P; P = [];
        for (let i = 0; i < n; i++) { const k = kinds[i % kinds.length], sh = SNOW[k][2], o = old[i]; P.push({ x: o ? o.x : CX + rnd(-R * .75, R * .75), y: o ? o.y : FLOOR + 4 - rnd(0, 14), vx: 0, vy: 0, k, sh,
          r: sh === 'fine' ? rnd(1.3, 2.4) : sh === 'star' || sh === 'heart' || sh === 'flake' ? rnd(3.8, 6) : rnd(1.8, 4.2), ph: rnd(0, 6.28), rot: rnd(0, 6.28), vr: rnd(-.05, .05) }); }
      }
      fill(); window.__gbP = () => ({ n: P.length, top: P.filter(q => q.y < CY).length, floor: P.filter(q => q.y > FLOOR - 8).length });
      const imOf = src => { const im = new Image(); im.src = src.startsWith('data:') ? src : 'assets/' + src; return im; };
      function addItem(L) { if (items.length >= 8) return api.guide('여덟 개까지 넣을 수 있어요.'); const im = imOf(L[0]); items.push({ im, x: CX + rnd(-60, 60), y: FLOOR + 6, h: L[2] * 1.3, s: 1, r: 0, f: 1 }); sel = items.length - 1; paintBar(); }
      const tb = mk('div'); bar.replaceWith(tb); bar2.remove();
      function paintBar() {
        const T = tools(tb);
        if (mode === 'deco') {
          T.tabs([['items', '🎄 넣을 것'], ['glit', '✨ 반짝이']], tab, k => { tab = k; paintBar(); });
          if (tab === 'items') { const c = T.row(''); c.classList.add('ticons'); LIB.forEach(L => T.icon(c, L[0].startsWith('data:') ? L[0] : 'assets/' + L[0], L[1] + ' 넣기', () => addItem(L)));
            const r = T.row('고른 것'); if (items[sel]) { T.chip(r, '↔ 뒤집기', () => { items[sel].f *= -1; }); T.chip(r, '뒤로 보내기', () => { const it = items.splice(sel, 1)[0]; items.unshift(it); sel = 0; paintBar(); }); T.chip(r, '빼기', () => { items.splice(sel, 1); sel = -1; paintBar(); }); }
            else r.append(mk('span', 'thint', '넣은 걸 누르면 고를 수 있어요'));
            api.guide('넣고 싶은 걸 눌러 넣고 끌어서 옮겨요. 동그란 손잡이로 크기·기울기를 바꿔요.'); }
          else { const c = T.row('반짝이'); SNOW.forEach(([col, n], i) => T.sw(c, col, mix[i], n, () => { mix[i] = !mix[i]; if (!Object.values(mix).some(Boolean)) mix[0] = 1; fill(); paintBar(); }));
            const names = Object.keys(mix).filter(k => mix[k]).map(k => SNOW[k][1]).join(' · '); T.row('').append(mk('span', 'thint', names + ' 섞는 중'));
            T.seg(T.row('양'), AMT.map(([n], i) => [i, n]), amt, k => { amt = k; fill(); paintBar(); });
            api.guide('반짝이를 여러 개 눌러 섞고, 양을 정해요.'); }
          const a = T.acts(); T.go(a, '뚜껑 닫고 흔들기 ▶', () => { if (!items.length) return api.guide('먼저 안에 넣을 것을 골라요.'); mode = 'shake'; sel = -1; paintBar(); api.guide('스노우볼을 잡고 흔들어 보세요!'); });
        } else { const a = T.acts(); T.sub(a, '← 다시 꾸미기', () => { mode = 'deco'; paintBar(); }); }
      }
      const dims = it => { const h = it.h * it.s, w = h * (it.im.naturalWidth || 1) / (it.im.naturalHeight || 1); return { w, h }; };
      const local = (it, p) => { const c = Math.cos(-it.r), sn = Math.sin(-it.r), dx = p.x - it.x, dy = p.y - it.y; return { x: dx * c - dy * sn, y: dx * sn + dy * c }; };   // 물건 기준(바닥 가운데) 좌표
      const handlePt = it => { const { w, h } = dims(it), c = Math.cos(it.r), sn = Math.sin(it.r), hx = w / 2 + 10, hy = -h - 10; return { x: it.x + hx * c - hy * sn, y: it.y + hx * sn + hy * c }; };
      const hit = p => { for (let i = items.length - 1; i >= 0; i--) { const it = items[i], { w, h } = dims(it), q = local(it, p); if (q.x > -w / 2 && q.x < w / 2 && q.y > -h && q.y < 6) return i; } return -1; };
      const inDome = (x, y) => { const dx = x - CX, dy = y - CY, d = Math.hypot(dx, dy), m = R * .92; return d > m ? { x: CX + dx / d * m, y: CY + dy / d * m } : { x, y }; };
      can.addEventListener('pointerdown', e => { const p = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId);
        if (mode === 'deco') { if (items[sel]) { const hp = handlePt(items[sel]); if (Math.hypot(p.x - hp.x, p.y - hp.y) < 22) { const it = items[sel], { h } = dims(it); drag = { handle: 1, s0: it.s, r0: it.r, d0: Math.hypot(hp.x - it.x, hp.y - it.y), a0: Math.atan2(hp.y - it.y, hp.x - it.x) }; return; } }
          const i = hit(p); if (i !== sel) { sel = i; paintBar(); } if (i >= 0) { const it = items[i]; drag = { dx: p.x - it.x, dy: p.y - it.y }; } return; }
        gdrag = { id: e.pointerId, x: p.x - ox, y: p.y - oy }; });
      can.addEventListener('pointermove', e => { const p = at(e, can);
        if (mode === 'deco') { const it = items[sel]; if (!drag || !it) return;
          if (drag.handle) { const d = Math.hypot(p.x - it.x, p.y - it.y), a = Math.atan2(p.y - it.y, p.x - it.x); it.s = Math.max(.3, Math.min(2.6, drag.s0 * d / drag.d0)); it.r = drag.r0 + (a - drag.a0); return; }
          const q = inDome(p.x - drag.dx, p.y - drag.dy); it.x = q.x; it.y = Math.min(FLOOR + 14, q.y); return; }
        if (!gdrag || gdrag.id !== e.pointerId) return; const soft = (d, L) => L * Math.tanh(d / L), nx = soft(p.x - gdrag.x, 170), ny = soft(p.y - gdrag.y, 130); vx = nx - ox; vy = ny - oy; ox = nx; oy = ny;   // 끝에 딱 막히지 않고 고무줄처럼 부드럽게 버팀
        const k = Math.hypot(vx, vy); if (k > 3) { if (!shaken) { shaken = true; api.ready(true); api.guide('눈이 휘날려요. 가만히 두면 천천히 가라앉아요.'); } for (const q of P) { const lift = q.y > FLOOR - 30 ? 1.6 : 1; if (q.y > FLOOR - 12) { q.vy -= k * rnd(.25, .8); q.vx += rnd(-1, 1) * k * .3; } q.vx += (-vx * rnd(-.1, .5) + rnd(-1, 1) * k * .45) * lift; q.vy += (-vy * rnd(-.1, .45) + rnd(-1, .4) * k * .45) * lift; } } });
      const up = () => { drag = null; gdrag = null; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function drawFlakes(x) {
        for (const q of P) { x.fillStyle = SNOW[q.k][0];
          if (q.sh === 'star' || q.sh === 'heart' || q.sh === 'flake') { q.rot += q.vr * (Math.abs(q.vx) + Math.abs(q.vy) + .2); x.save(); x.translate(q.x, q.y); x.rotate(q.rot); x.font = `${(q.r * 3.2) | 0}px serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(q.sh === 'star' ? '★' : q.sh === 'heart' ? '♥' : '❄', 0, 0); x.restore(); }
          else { if (q.k === 0 || q.k === 2) { x.fillStyle = 'rgba(120,140,170,.35)'; x.beginPath(); x.arc(q.x + .6, q.y + .8, q.r + .4, 0, 7); x.fill(); x.fillStyle = SNOW[q.k][0]; }   // 흰 눈은 옅은 그림자로 또렷하게
            x.beginPath(); x.arc(q.x, q.y, q.r, 0, 7); x.fill(); if (q.sh === 'fine' && Math.random() < .04) { x.fillStyle = 'rgba(255,255,255,.95)'; x.beginPath(); x.arc(q.x, q.y, q.r * 1.6, 0, 7); x.fill(); } } }   // 가루는 가끔 반짝
      }
      function drawInside(x) {
        for (const [i, it] of items.entries()) { if (!it.im.complete || !it.im.naturalWidth) continue; const { w, h } = dims(it);
          x.save(); x.translate(it.x, it.y); x.rotate(it.r); x.scale(it.f, 1); x.drawImage(it.im, -w / 2, -h + 6, w, h); x.restore();
          if (mode === 'deco' && i === sel) { x.save(); x.translate(it.x, it.y); x.rotate(it.r); x.setLineDash([6, 5]); x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 2; x.strokeRect(-w / 2 - 4, -h + 2, w + 8, h + 8); x.setLineDash([]); x.restore();
            const hp = handlePt(it); x.fillStyle = '#fff'; x.strokeStyle = '#c0392b'; x.lineWidth = 3; x.beginPath(); x.arc(hp.x, hp.y, 11, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#c0392b'; x.font = '13px serif'; x.textAlign = 'center'; x.fillText('↻', hp.x, hp.y + 4.5); } }
      }
      const loop = now => {
        if (!alive) return; const dt = Math.min(2.5, (now - t0) / 16.7); t0 = now;
        if (!gdrag) { ox *= .86; oy *= .86; }
        for (const q of P) {                                                       // 물속 눈: 천천히 가라앉고 살랑살랑 흔들려요
          q.vy += .022 * dt * (q.r / 3); q.vx += Math.sin(now / 900 + q.ph) * .004 * dt + rnd(-1, 1) * .025 * dt; q.vy += rnd(-1, 1) * .012 * dt; q.vx *= Math.pow(.955, dt); q.vy *= Math.pow(.955, dt);
          const tv = .35 + q.r * .06; if (q.vy > tv) q.vy = tv; const sp = Math.hypot(q.vx, q.vy); if (sp > 5) { q.vx *= 5 / sp; q.vy *= 5 / sp; }                                        // 너무 빨리 떨어지지 않게
          q.x += q.vx * dt; q.y += q.vy * dt;
          const dx = q.x - CX, dy = q.y - CY, d = Math.hypot(dx, dy), lim = R - q.r - 3; if (d > lim) { const nx = dx / d, ny = dy / d, dot = q.vx * nx + q.vy * ny; q.x = CX + nx * (lim - 1); q.y = CY + ny * (lim - 1); if (dot > 0) { q.vx -= 1.2 * dot * nx; q.vy -= 1.2 * dot * ny; } q.vx -= nx * rnd(.3, .9); q.vy -= ny * rnd(.3, .9); q.vx += rnd(-.4, .4); }   // 유리에 붙지 않고 튕겨 나옴
          if (q.y > FLOOR + 4 - q.r) { q.y = FLOOR + 4 - q.r; q.vy = 0; q.vx *= .5; } }
        g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(back, 0, 0, 800, 800); g.translate(400 + ox, 700 + oy); g.rotate(ox / 900); if (mode !== 'deco') g.scale(.84, .84); g.translate(-400, -700); g.drawImage(glass, 0, 0, 800, 800);
        g.save(); g.beginPath(); g.arc(CX, CY, R, 0, 7); g.clip();
        const sky = g.createLinearGradient(0, CY - R, 0, FLOOR); sky.addColorStop(0, 'rgba(40,60,100,.35)'); sky.addColorStop(1, 'rgba(200,220,240,.15)'); g.fillStyle = sky; g.fillRect(CX - R, CY - R, R * 2, R * 2);
        g.fillStyle = 'rgba(250,252,255,.95)'; g.beginPath(); g.ellipse(CX, FLOOR + 10, R * .85, 26, 0, 0, 7); g.fill();          // 바닥 눈
        drawInside(g);
        drawFlakes(g);
        g.globalAlpha = .3; g.drawImage(glass, 0, 0, 800, 800); g.globalAlpha = 1; g.restore();
        requestAnimationFrame(loop);
      };
      paintBar(); api.ready(false); requestAnimationFrame(loop);
      return { reset() { shaken = false; items = []; sel = -1; mode = 'deco'; paintBar(); api.ready(false); P = []; fill(); },
        result() { if (!shaken) return null; const m = mode; mode = 'shake'; const b = cv(800, 800), x = b.getContext('2d'); x.drawImage(glass, 0, 0, 800, 800);     // 배경 없이 스노우볼만
          x.save(); x.beginPath(); x.arc(CX, CY, R, 0, 7); x.clip(); const sky = x.createLinearGradient(0, CY - R, 0, FLOOR); sky.addColorStop(0, 'rgba(40,60,100,.35)'); sky.addColorStop(1, 'rgba(200,220,240,.15)'); x.fillStyle = sky; x.fillRect(CX - R, CY - R, R * 2, R * 2);
          x.fillStyle = 'rgba(250,252,255,.95)'; x.beginPath(); x.ellipse(CX, FLOOR + 10, R * .85, 26, 0, 0, 7); x.fill(); drawInside(x); drawFlakes(x); x.globalAlpha = .3; x.drawImage(glass, 0, 0, 800, 800); x.restore(); mode = m;
          const o = cv(200, 262); o.getContext('2d').drawImage(b, 141, 95, 511, 673, 0, 0, 200, 262); return { img: o.toDataURL('image/png') }; }, stop() { alive = false; } };
    },
  };

  // 짧은 소리(없어도 놀이는 됨)
  let AC = null;
  const scratch = (d, vol, fq) => { vol *= VOL; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime, n = Math.ceil(AC.sampleRate * d), bf = AC.createBuffer(1, n, AC.sampleRate), ch = bf.getChannelData(0); for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n); const src = AC.createBufferSource(), fl = AC.createBiquadFilter(), gn = AC.createGain(); src.buffer = bf; fl.type = 'bandpass'; fl.frequency.value = fq || 2500; fl.Q.value = .8; gn.gain.value = vol; src.connect(fl); fl.connect(gn); gn.connect(AC.destination); src.start(t); } catch (e) { /* 소리 없음 */ } };   // 사각사각·칙 같은 마찰음
  const VOL = .55;   // 전체 소리 크기 (1이면 원래 크기)
  const tone = (f, d, vol, type, f2) => { vol *= VOL; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime; for (const [fr, v] of f2 ? [[f, vol], [f2, vol * .4]] : [[f, vol]]) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.value = fr; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d); } } catch (e) { /* 소리 없음 */ } };

  // ── 종 치기: 누르거나 쓸면 종이 울린다. 빛나는 종을 따라 치면 캐럴 한 소절이 된다.
  plays.bells = {
    title: '종 치기', doneLabel: '종 간직하기', doneMsg: '종을 트리에 달아 뒀어요.',
    start(board, api) {
      board.className = 'pboard bells'; const pwB = board.closest('.panel-wrap'); pwB && pwB.classList.add('xwide');
      const W = 1200, H = 600, can = cv(W, H, 'blcv'), g = can.getContext('2d'), bg = pic('bells_bg.jpg'), tb = mk('div'); board.append(can, tb);
      const BI = [{ x: 40, y: 24, w: 264, h: 485, px: 169, py: 28 }, { x: 296, y: 107, w: 243, h: 402, px: 396, py: 111 }, { x: 531, y: 83, w: 223, h: 426, px: 623, py: 87 }, { x: 746, y: 148, w: 223, h: 361, px: 840, py: 152 }, { x: 961, y: 86, w: 196, h: 418, px: 1039, py: 90 }];
      const ims = BI.map((_, i) => pic('bell_' + i + '.png')), F = [523.25, 587.33, 659.25, 698.46, 783.99], NAMES = ['도', '레', '미', '파', '솔'], KEYS = ['1', '2', '3', '4', '5'], KEYS2 = ['a', 's', 'd', 'f', 'g'];
      const LX = BI.map(b => b.px), HITY = 330;                                       // 음표가 종 몸통 가운데에 닿을 때 쳐요
      // 노래: [음 높이(미디 번호), 박자] — 짧게/길게. 종 다섯 개에는 낮은 음→높은 음 순서로 나눠 떨어져요
      const nC = 60, nD = 62, nE = 64, nF = 65, nG = 67, nA = 69, nB = 71, nC2 = 72, nD2 = 74, nE2 = 76, nF2 = 77;
      const JB1 = [[nE, 1], [nE, 1], [nE, 2], [nE, 1], [nE, 1], [nE, 2], [nE, 1], [nG, 1], [nC, 1.5], [nD, .5], [nE, 4]], JB2 = [[nF, 1], [nF, 1], [nF, 1.5], [nF, .5], [nF, 1], [nE, 1], [nE, 1], [nE, .5], [nE, .5], [nE, 1], [nD, 1], [nD, 1], [nE, 1], [nD, 2], [nG, 2]], JB3 = [[nF, 1], [nF, 1], [nF, 1.5], [nF, .5], [nF, 1], [nE, 1], [nE, 1], [nE, .5], [nE, .5], [nG, 1], [nG, 1], [nF, 1], [nD, 1], [nC, 4]];
      const TW1 = [[nC, 1], [nC, 1], [nG, 1], [nG, 1], [nA, 1], [nA, 1], [nG, 2], [nF, 1], [nF, 1], [nE, 1], [nE, 1], [nD, 1], [nD, 1], [nC, 2]], TW2 = [[nG, 1], [nG, 1], [nF, 1], [nF, 1], [nE, 1], [nE, 1], [nD, 2], [nG, 1], [nG, 1], [nF, 1], [nF, 1], [nE, 1], [nE, 1], [nD, 2]];
      const SN1 = [[nG, 1.5], [nA, .5], [nG, 1], [nE, 3], [nG, 1.5], [nA, .5], [nG, 1], [nE, 3], [nD2, 2], [nD2, 1], [nB, 3], [nC2, 2], [nC2, 1], [nG, 3]], SN2 = [[nA, 2], [nA, 1], [nC2, 1.5], [nB, .5], [nA, 1], [nG, 1.5], [nA, .5], [nG, 1], [nE, 3], [nA, 2], [nA, 1], [nC2, 1.5], [nB, .5], [nA, 1], [nG, 1.5], [nA, .5], [nG, 1], [nE, 3], [nD2, 2], [nD2, 1], [nF2, 1.5], [nD2, .5], [nB, 1], [nC2, 3], [nE2, 3], [nC2, 1], [nG, 1], [nE, 1], [nG, 1.5], [nF, .5], [nD, 1], [nC, 6]];
      const SONGS = { '징글벨': { short: JB1.concat(JB2), long: JB1.concat(JB2, JB1, JB3), beat: .42 }, '반짝반짝 작은 별': { short: TW1, long: TW1.concat(TW2, TW1), beat: .5 }, '고요한 밤': { short: SN1, long: SN1.concat(SN2), beat: .38 } };
      let songLen = 'short', midiSong = null;
      const hz = p2 => { let f = 440 * Math.pow(2, (p2 - 69) / 12); while (f < 480) f *= 2; while (f > 1700) f /= 2; return f; };
      function laneMap(ps) { const u = [...new Set(ps)].sort((x, y) => x - y); return p2 => Math.min(4, Math.floor(u.indexOf(p2) / u.length * 5)); }
      function buildNotes() { let list; if (songName === '__midi' && midiSong) list = midiSong.map(n => ({ t: n.t + 1.2, p: n.p }));
        else { const S = SONGS[songName], arr = S[songLen]; let at2 = 1.2; list = arr.map(([p2, d]) => { const o = { t: at2, p: p2 }; at2 += d * S.beat; return o; }); }
        const lm = laneMap(list.map(n => n.p)); return list.map(n => ({ n: lm(n.p), p: n.p, t: n.t, done: false })); }
      // 미디 파일 읽기: 모든 트랙에서 '가장 높은 음'만 골라 멜로디로(드럼은 빼요)
      function parseMidi(buf) { const d = new DataView(buf); let o = 0; const str = n => { let r = ''; for (let i = 0; i < n; i++) r += String.fromCharCode(d.getUint8(o + i)); return r; };
        if (str(4) !== 'MThd') throw 0; const div = d.getUint16(12); o = 8 + d.getUint32(4); const ev = [], tempos = [[0, 500000]];
        while (o < d.byteLength - 8) { if (str(4) !== 'MTrk') break; const len = d.getUint32(o + 4); let q = o + 8, end = q + len, tick = 0, run = 0;
          const vl = () => { let v = 0, b2; do { b2 = d.getUint8(q++); v = (v << 7) | (b2 & 127); } while (b2 & 128); return v; };
          while (q < end) { tick += vl(); let st = d.getUint8(q); if (st & 128) q++; else st = run; run = st;
            if (st === 0xff) { const ty = d.getUint8(q++), l = vl(); if (ty === 0x51) tempos.push([tick, (d.getUint8(q) << 16) | (d.getUint8(q + 1) << 8) | d.getUint8(q + 2)]); q += l; }
            else if (st === 0xf0 || st === 0xf7) q += vl();
            else { const hi = st & 0xf0, ch = st & 15, a1 = d.getUint8(q++), a2 = (hi === 0xc0 || hi === 0xd0) ? 0 : d.getUint8(q++); if (hi === 0x90 && a2 > 0 && ch !== 9) ev.push([tick, a1]); } }
          o = end; }
        tempos.sort((x, y) => x[0] - y[0]); const sec = tk => { let t2 = 0, lt = 0, us = 500000; for (const [tt, u] of tempos) { if (tt > tk) break; t2 += (tt - lt) / div * us / 1e6; lt = tt; us = u; } return t2 + (tk - lt) / div * us / 1e6; };
        ev.sort((x, y) => x[0] - y[0] || y[1] - x[1]); const out = []; for (const [tk, p2] of ev) { const t2 = sec(tk); const last = out[out.length - 1]; if (last && t2 - last.t < .16) { if (p2 > last.p && t2 - last.t < .03) last.p = p2; continue; } out.push({ t: t2, p: p2 }); }
        const t00 = out.length ? out[0].t : 0; return out.slice(0, 400).map(n => ({ t: n.t - t00, p: n.p })); }
      const midiIn = mk('input'); midiIn.type = 'file'; midiIn.accept = '.mid,.midi,audio/midi'; midiIn.hidden = true; board.append(midiIn);
      midiIn.addEventListener('change', () => { const f = midiIn.files[0]; midiIn.value = ''; if (!f) return; f.arrayBuffer().then(buf => { try { const m = parseMidi(buf); if (m.length < 4) throw 0; midiSong = m; songName = '__midi'; midiName = f.name.replace(/\.(mid|midi)$/i, ''); playing = false; notes = []; paint(); api.guide(`"${midiName}" 멜로디 ${m.length}음을 읽었어요. 시작을 눌러요.`); } catch (e) { api.guide('이 미디 파일은 읽지 못했어요. 다른 파일로 해 볼까요?'); } }); });
      let midiName = '';
      let rec = [], recOn = false, recT0 = 0, play2 = null, mode = 'song', songName = '징글벨', notes = [], t = 0, playing = false, score = { p: 0, g: 0, m: 0 }, combo = 0, popups = [], swing = BI.map(() => ({ a: 0, t: 9 })), glow = [0, 0, 0, 0, 0], alive = true, t0 = 0, rings = 0;
      const BEAT = .5, TRAVEL = 1.9;
      function startSong() { notes = buildNotes(); t = 0; playing = true; score = { p: 0, g: 0, m: 0 }; combo = 0; paint(); api.guide('음표가 종에 닿을 때 그 종을 눌러요. 키보드 1~5(또는 A S D F G)로 쳐도 돼요.'); }
      function ring(i, fromPlay) { if (recOn && !fromPlay) { if (!rec.length) recT0 = performance.now(); rec.push({ i, t: performance.now() - recT0 }); paint(); } swing[i] = { a: .16, t: 0 }; glow[i] = 1; rings++; let fq = F[i];
        if (mode === 'song' && playing) { let best = null, bd = 9; for (const nt of notes) if (!nt.done && nt.n === i) { const d = Math.abs(nt.t - t); if (d < bd) { bd = d; best = nt; } }
          if (best && bd < .26) { fq = hz(best.p); best.done = true; const perfect = bd < .11; perfect ? score.p++ : score.g++; combo++; popups.push({ x: LX[i], y: HITY - 60, txt: perfect ? '딱 맞아요!' : '좋아요', c: perfect ? '#ffe08a' : '#ffffff', t: 0 }); } }
        tone(fq, 1.4, .16, 'sine', fq * 2.76);
        if (mode === 'free' && rings >= 10) api.ready(true); }
      function playBack() { if (!rec.length) return; stopPlay(); const t0p = performance.now(); play2 = rec.map(r => setTimeout(() => ring(r.i, true), r.t)); play2.push(setTimeout(() => { play2 = null; paint(); }, rec[rec.length - 1].t + 900)); paint(); }
      function stopPlay() { if (play2) play2.forEach(clearTimeout); play2 = null; }
      const lane = p => { let b = -1, bd = 1e9; BI.forEach((bb, i) => { if (p.x > bb.x && p.x < bb.x + bb.w) { const d = Math.abs(p.x - bb.px); if (d < bd) { bd = d; b = i; } } }); return b; };
      can.addEventListener('pointerdown', e => { const i = lane(at(e, can)); if (i >= 0) ring(i); e.preventDefault(); });
      const kd = e => { const k = e.key.toLowerCase(); let i = KEYS.indexOf(k); if (i < 0) i = KEYS2.indexOf(k); if (i >= 0 && !e.repeat) { ring(i); e.preventDefault(); } }; addEventListener('keydown', kd);
      function paint() { const T = tools(tb);
        T.tabs([['song', '🎵 노래 따라 치기'], ['free', '🔔 마음대로 치기']], mode, k => { mode = k; playing = false; notes = []; paint(); api.guide(k === 'free' ? '종을 눌러서 마음대로 연주해요. 키보드 1~5로도 쳐요.' : '노래를 고르고 시작을 눌러요.'); });
        if (mode === 'song') { const r1 = T.row('노래'); T.seg(r1, Object.keys(SONGS).map(k => [k, k]).concat(midiSong ? [['__midi', '🎼 ' + (midiName.length > 10 ? midiName.slice(0, 10) + '…' : midiName)]] : []), songName, k => { songName = k; playing = false; notes = []; paint(); });
          const r2 = T.row('길이'); if (songName !== '__midi') T.seg(r2, [['short', '짧게'], ['long', '길게']], songLen, k => { songLen = k; playing = false; notes = []; paint(); }); else r2.append(mk('span', 'thint', `미디 멜로디 ${midiSong.length}음`));
          T.chip(r2, '🎼 미디 파일 넣기', () => midiIn.click());
          const a = T.acts(); if (score.p + score.g + score.m) a.append(mk('span', 'thint', `딱 맞아요 ${score.p} · 좋아요 ${score.g} · 놓침 ${score.m}`)); T.go(a, playing ? '처음부터 다시' : '▶ 시작', startSong); }
        else { const r = T.row('녹음'); r.append(mk('span', 'thint', recOn ? `⏺ 녹음 중… ${rec.length}번 쳤어요` : rec.length ? `녹음한 연주 ${rec.length}음 (${(rec[rec.length - 1].t / 1000).toFixed(1)}초)` : '녹음을 누르고 치면 내 연주가 저장돼요'));
          const a = T.acts();
          if (recOn) T.go(a, '■ 녹음 끝', () => { recOn = false; paint(); if (rec.length) api.guide('녹음했어요! "▶ 들어보기"로 내 연주를 들어 봐요.'); });
          else { T.sub(a, '⏺ ' + (rec.length ? '다시 녹음' : '녹음'), () => { stopPlay(); rec = []; recOn = true; recT0 = performance.now(); paint(); api.guide('녹음 중이에요. 종을 쳐서 연주해요.'); });
            if (rec.length) T.go(a, play2 ? '■ 멈추기' : '▶ 들어보기', () => { if (play2) { stopPlay(); paint(); } else playBack(); }); } }
      }
      function frame(now) {
        if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (now - (t0 || now)) / 1000); t0 = now;
        if (playing) { t += dt; for (const nt of notes) if (!nt.done && t - nt.t > .3) { nt.done = true; nt.miss = true; score.m++; combo = 0; }
          if (notes.length && notes.every(n => n.done) && t > notes[notes.length - 1].t + .6) { playing = false; const tot = notes.length, ok = score.p + score.g; api.ready(true); paint();
            api.guide(ok === tot ? `완벽해요! ${tot}개 모두 맞혔어요 🎄` : `노래 끝! ${tot}개 중 ${ok}개 맞혔어요. 다시 해 봐도 되고, "종 간직하기"를 눌러도 돼요.`); } }
        if (bg.complete && bg.naturalWidth) g.drawImage(bg, 0, 0, W, H);
        BI.forEach((b, i) => { const s2 = swing[i]; s2.t += dt; const ang = s2.a * Math.exp(-s2.t * 2.6) * Math.sin(s2.t * 16);
          if (glow[i] > 0) { const gr = g.createRadialGradient(b.px, 340, 20, b.px, 340, 200); gr.addColorStop(0, `rgba(255,225,150,${.45 * glow[i]})`); gr.addColorStop(1, 'rgba(255,225,150,0)'); g.fillStyle = gr; g.fillRect(b.px - 200, 140, 400, 400); glow[i] = Math.max(0, glow[i] - dt * 1.4); }
          if (ims[i].complete && ims[i].naturalWidth) { g.save(); g.translate(b.px, b.py); g.rotate(ang); g.drawImage(ims[i], b.x - b.px, b.y - b.py, b.w, b.h); g.restore(); }
          if (Math.abs(ang) > .02) { g.strokeStyle = `rgba(255,240,200,${Math.min(.7, Math.abs(ang) * 5)})`; g.lineWidth = 3; for (let k = 1; k <= 2; k++) { g.beginPath(); g.arc(b.px, HITY + 60, 90 + k * 26 + s2.t * 60, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); } } });
        if (mode === 'song') {
          g.fillStyle = 'rgba(30,40,70,.18)'; LX.forEach(x => g.fillRect(x - 34, 0, 68, HITY));                                   // 음표 길
          LX.forEach((x, i) => { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4; g.beginPath(); g.arc(x, HITY, 34, 0, 7); g.stroke(); g.fillStyle = 'rgba(60,40,25,.75)'; g.font = '700 20px Gowun Batang,serif'; g.textAlign = 'center'; g.fillText(NAMES[i], x, HITY + 62); });
          for (const nt of notes) { if (nt.done && !nt.miss) continue; const y = HITY - (nt.t - t) / TRAVEL * HITY; if (y < -40 || y > HITY + 40) continue; const x = LX[nt.n];
            g.globalAlpha = nt.miss ? .35 : 1; g.fillStyle = '#ffd56a'; g.strokeStyle = '#a5681d'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 26, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#6b3d10'; g.font = '700 26px serif'; g.fillText('♪', x, y + 9); g.globalAlpha = 1; }
          if (combo >= 3) { g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '700 30px Gowun Batang,serif'; g.textAlign = 'right'; g.fillText(`${combo} 연속!`, W - 30, 50); }
        }
        popups = popups.filter(p => (p.t += dt) < .9); for (const p of popups) { g.globalAlpha = 1 - p.t / .9; g.fillStyle = p.c; g.strokeStyle = 'rgba(60,35,10,.6)'; g.lineWidth = 5; g.font = '700 34px Gowun Batang,serif'; g.textAlign = 'center'; g.strokeText(p.txt, p.x, p.y - p.t * 50); g.fillText(p.txt, p.x, p.y - p.t * 50); g.globalAlpha = 1; }
      }
      paint(); api.ready(false); api.guide('노래를 고르고 시작을 눌러요. 음표가 종에 닿을 때 종을 눌러 쳐요.'); requestAnimationFrame(frame);
      return { reset() { playing = false; notes = []; rings = 0; api.ready(false); paint(); }, result() { return rings ? { rung: rings, song: rec.slice(0, 200) } : null; }, stop() { alive = false; stopPlay(); pwB && pwB.classList.remove('xwide'); removeEventListener('keydown', kd); } };
    },
  };

  // ── 얼음 조각 깎기: 끌을 대고 누르면 얼음이 떨어져 나간다. 오래 누를수록 세게 쳐서 크게 깨진다.
  plays.ice = {
    title: '얼음 조각 깎기', doneLabel: '광장에 세우기', doneMsg: '얼음 조각을 트리 곁에 세워 뒀어요.',
    start(board, api) {
      board.className = 'pboard ice';
      const W = 640, H = 700, can = cv(W, H, 'icecv'), g = can.getContext('2d'), L = cv(W, H), lg = L.getContext('2d', { willReadFrequently: true }), ice = pic('ice_block.png'), tool = pic('ice_chisel.png'), mallet = pic('ice_mallet.png'), bar = mk('div', 'pbar'); board.append(can, bar);
      const shapes = { star: '별', heart: '하트', tree: '나무' }; let shape = 'star', px = 500, py = 120, lastHit = 0, hold = null, alive = true, chips = [], cracks = [], falls = [], outPct = 100, inPct = 100, M = null;
      Object.entries(shapes).forEach(([k, t]) => { const b = mk('button', '', t); b.type = 'button'; b.dataset.k = k; b.addEventListener('click', () => { shape = k; reset(); }); bar.append(b); });
      function path(c) {
        const cx = 320, cy = 360; c.beginPath();
        if (shape === 'star') for (let i = 0; i < 10; i++) { const r = i % 2 ? 105 : 235, a = -Math.PI / 2 + i * Math.PI / 5; c[i ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + 10 + r * Math.sin(a)); }
        else if (shape === 'heart') { c.moveTo(cx, cy + 215); c.bezierCurveTo(cx - 330, cy - 10, cx - 170, cy - 290, cx, cy - 110); c.bezierCurveTo(cx + 170, cy - 290, cx + 330, cy - 10, cx, cy + 215); }
        else { c.moveTo(cx, cy - 250); c.lineTo(cx + 120, cy - 80); c.lineTo(cx + 60, cy - 80); c.lineTo(cx + 180, cy + 80); c.lineTo(cx + 90, cy + 80); c.lineTo(cx + 215, cy + 215); c.lineTo(cx + 40, cy + 215); c.lineTo(cx + 40, cy + 275); c.lineTo(cx - 40, cy + 275); c.lineTo(cx - 40, cy + 215); c.lineTo(cx - 215, cy + 215); c.lineTo(cx - 90, cy + 80); c.lineTo(cx - 180, cy + 80); c.lineTo(cx - 60, cy + 80); c.lineTo(cx - 120, cy - 80); }
        c.closePath();
      }
      function measure() {                                                        // 밑그림 밖에 남은 얼음, 안에 남은 얼음
        const d = lg.getImageData(0, 0, W, H).data; let o = 0, ot = 0, n = 0, nt = 0;
        for (let y = 4; y < H; y += 8) for (let x = 4; x < W; x += 8) { const idx = (y / 8 | 0) * 80 + (x / 8 | 0), had = M.base[idx]; if (!had) continue; const has = d[(y * W + x) * 4 + 3] > 60; if (M.inside[idx]) { nt++; if (has) n++; } else { ot++; if (has) o++; } }
        outPct = Math.round(o / Math.max(1, ot) * 100); inPct = Math.round(n / Math.max(1, nt) * 100);
        api.ready(outPct <= 14); api.guide(outPct <= 14 ? `다 깎았어요! 조각이 ${inPct}% 남았어요. 광장에 세울까요?` : `밑그림 밖의 얼음을 깎아 내요. 남은 얼음 ${outPct}% · 꾹 오래 누르면 세게 쳐요(조각이 깨질 수 있어요).`);
      }
      function reset() {
        [...bar.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === shape)); chips = []; cracks = []; falls = [];
        const go = () => { lg.clearRect(0, 0, W, H); lg.drawImage(ice, 32, 46, 576, 620); const m = cv(W, H), mg = m.getContext('2d'); path(mg); mg.fill(); const md = mg.getImageData(0, 0, W, H).data, bd = lg.getImageData(0, 0, W, H).data;
          M = { inside: new Uint8Array(80 * 88), base: new Uint8Array(80 * 88) }; for (let y = 4; y < H; y += 8) for (let x = 4; x < W; x += 8) { const idx = (y / 8 | 0) * 80 + (x / 8 | 0); M.inside[idx] = md[(y * W + x) * 4 + 3] > 128 ? 1 : 0; M.base[idx] = bd[(y * W + x) * 4 + 3] > 60 ? 1 : 0; } measure(); };
        if (ice.complete && ice.naturalWidth) go(); else ice.addEventListener('load', go, { once: true });
      }
      function strike(x, y, pw) {
        const r = 26 + 44 * pw; lg.save(); lg.globalCompositeOperation = 'destination-out'; lg.beginPath();
        for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, rr = r * rnd(.75, 1.2); lg[i ? 'lineTo' : 'moveTo'](x + rr * Math.cos(a), y + rr * Math.sin(a)); } lg.closePath(); lg.fill(); lg.restore();
        for (let i = 0; i < 7 + pw * 8; i++) chips.push({ x, y, vx: rnd(-3, 3), vy: rnd(-5, -1), r: rnd(2, 6), t: 0 });
        tone(pw > .7 ? 900 : 1400, .07, .1, 'square'); if (pw > .7) { tone(240, .18, .08, 'triangle'); const a = rnd(0, 7), l = rnd(40, 90); cracks.push([x, y, x + l * Math.cos(a), y + l * Math.sin(a)]); lg.save(); lg.globalCompositeOperation = 'destination-out'; lg.strokeStyle = '#000'; lg.lineWidth = 5; lg.beginPath(); lg.moveTo(x, y); lg.lineTo(x + l * Math.cos(a), y + l * Math.sin(a)); lg.stroke(); lg.restore(); }
        detach(); measure();
      }
      // 몸통과 떨어진 얼음 덩어리는 아래로 떨어져 사라짐(조각 모양과 가장 많이 겹치는 덩어리만 남김)
      function detach() {
        const GW = 80, GH = 88, d = lg.getImageData(0, 0, W, H).data, occ = new Uint8Array(GW * GH), comp = new Int32Array(GW * GH).fill(-1);
        for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) { const x = gx * 8 + 4, y = gy * 8 + 4; if (y < H && d[(y * W + x) * 4 + 3] > 60) occ[gy * GW + gx] = 1; }
        const comps = [];
        for (let i = 0; i < GW * GH; i++) { if (!occ[i] || comp[i] >= 0) continue; const id = comps.length, list = [i], st = [i]; comp[i] = id; let inn = 0;
          while (st.length) { const j = st.pop(), x = j % GW; if (M.inside[j]) inn++; for (const k of [x > 0 ? j - 1 : -1, x < GW - 1 ? j + 1 : -1, j - GW, j + GW]) if (k >= 0 && k < GW * GH && occ[k] && comp[k] < 0) { comp[k] = id; st.push(k); list.push(k); } }
          comps.push({ list, inn }); }
        if (comps.length < 2) return;
        let keep = 0; comps.forEach((c, i) => { if (c.inn > comps[keep].inn || (c.inn === comps[keep].inn && c.list.length > comps[keep].list.length)) keep = i; });
        comps.forEach((c, id) => { if (id === keep) return;
          const cells = new Set(c.list);
          for (const j of c.list) { const x = j % GW; for (const k of [j - 1, j + 1, j - GW, j + GW, j - GW - 1, j - GW + 1, j + GW - 1, j + GW + 1]) if (k >= 0 && k < GW * GH && !occ[k] && Math.abs((k % GW) - x) <= 1) { let nearKeep = false; const kx = k % GW; for (const q of [k - 1, k + 1, k - GW, k + GW]) if (q >= 0 && q < GW * GH && Math.abs((q % GW) - kx) <= 1 && comp[q] === keep) nearKeep = true; if (!nearKeep) cells.add(k); } }
          let x0 = 1e9, y0 = 1e9, x1 = 0, y1 = 0; for (const j of cells) { const x = (j % GW) * 8, y = (j / GW | 0) * 8; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 8); y1 = Math.max(y1, y + 8); }
          const cw = x1 - x0, ch = y1 - y0, pc = cv(cw, ch), px2 = pc.getContext('2d');
          px2.beginPath(); for (const j of cells) px2.rect((j % GW) * 8 - x0, (j / GW | 0) * 8 - y0, 8, 8); px2.clip(); px2.drawImage(L, -x0, -y0);
          lg.save(); lg.globalCompositeOperation = 'destination-out'; lg.beginPath(); for (const j of cells) lg.rect((j % GW) * 8, (j / GW | 0) * 8, 8, 8); lg.fill(); lg.restore();
          falls.push({ c: pc, x: x0 + cw / 2, y: y0 + ch / 2, vx: rnd(-1.2, 1.2), vy: rnd(-2, 0), rot: 0, vr: rnd(-.05, .05), t: 0 });
        });
        tone(330, .25, .09, 'triangle');
      }
      can.addEventListener('pointermove', e => { const p = at(e, can); px = p.x; py = p.y; });
      can.addEventListener('pointerdown', e => { const p = at(e, can); px = p.x; py = p.y; hold = performance.now(); can.setPointerCapture(e.pointerId); e.preventDefault(); });
      const up = () => { if (hold === null || !M) return; const pw = Math.min(1, (performance.now() - hold) / 650); hold = null; lastHit = performance.now(); strike(px, py, pw); }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', () => { hold = null; });
      const loop = () => {
        if (!alive) return; const bgG = g.createLinearGradient(0, 0, 0, H); bgG.addColorStop(0, '#1b2a4a'); bgG.addColorStop(.78, '#33496f'); bgG.addColorStop(.781, '#dfe9f2'); bgG.addColorStop(1, '#c4d3e2'); g.fillStyle = bgG; g.fillRect(0, 0, W, H);   // 밤 광장, 눈 바닥
        g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 40; i++) { const sx = (i * 137) % W, sy = ((i * 89 + performance.now() / 30) % (H * .78)); g.beginPath(); g.arc(sx, sy, 1.3, 0, 7); g.fill(); }
        g.fillStyle = 'rgba(30,50,90,.28)'; g.beginPath(); g.ellipse(330, 668, 300, 22, 0, 0, 7); g.fill(); g.drawImage(L, 0, 0);
        g.save(); path(g); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.setLineDash([10, 8]); g.stroke(); g.restore();
        chips = chips.filter(c => (c.t += 1) < 40); for (const c of chips) { c.vy += .35; c.x += c.vx; c.y += c.vy; g.fillStyle = `rgba(215,235,250,${1 - c.t / 40})`; g.fillRect(c.x, c.y, c.r, c.r); }
        falls = falls.filter(f => (f.t += 1) < 75); for (const f of falls) { f.vy += .45; f.x += f.vx; f.y += f.vy; f.rot += f.vr; g.save(); g.globalAlpha = Math.max(0, 1 - Math.max(0, f.t - 40) / 35); g.translate(f.x, f.y); g.rotate(f.rot); g.drawImage(f.c, -f.c.width / 2, -f.c.height / 2); g.restore(); }
        { const done = outPct <= 14, txt = done ? '다 깎았어요!' : `깎을 얼음 ${outPct}%`, bw = 270, bx = 16, by = 16;           // 남은 양 표시(크게)
          g.save(); g.fillStyle = 'rgba(255,250,240,.93)'; g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 10; g.beginPath(); g.roundRect(bx, by, bw, 80, 16); g.fill(); g.shadowColor = 'transparent';
          g.fillStyle = done ? '#3f7a45' : '#4a3328'; g.font = '700 32px Gowun Batang,serif'; g.textAlign = 'left'; g.fillText(txt, bx + 18, by + 40);
          const tw = bw - 36, pr = Math.max(0, Math.min(1, (100 - outPct) / 86)); g.fillStyle = 'rgba(74,51,40,.15)'; g.beginPath(); g.roundRect(bx + 18, by + 54, tw, 12, 6); g.fill();
          g.fillStyle = done ? '#5a9c5e' : '#c0623a'; g.beginPath(); g.roundRect(bx + 18, by + 54, Math.max(12, tw * pr), 12, 6); g.fill(); g.restore(); }
        if (hold !== null) { const pw = Math.min(1, (performance.now() - hold) / 650); g.strokeStyle = pw > .7 ? 'rgba(255,150,90,.95)' : 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(px, py, 26 + 44 * pw, 0, 7); g.stroke(); }
        if (tool.complete && tool.naturalWidth) { const jig = hold !== null ? Math.sin(performance.now() / 40) * 1.5 : 0, k = .34, rot = -.95, tx = 8, ty = 195;   // 끌 날 끝이 손가락 자리
          g.save(); g.translate(px + jig, py + jig); g.rotate(rot); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 8; g.shadowOffsetY = 4; g.drawImage(tool, -tx * k, -ty * k, tool.naturalWidth * k, tool.naturalHeight * k); g.restore();
          if (mallet.complete) { const hx = (560 - tx) * k, hy = (40 - ty) * k, H0 = { x: px + hx * Math.cos(rot) - hy * Math.sin(rot), y: py + hx * Math.sin(rot) + hy * Math.cos(rot) }, since = performance.now() - (lastHit || 0), raise = hold !== null ? -.25 - Math.min(1, (performance.now() - hold) / 650) * .75 : since < 160 ? -.9 * (since / 160) * (1 - since / 160) * 4 * .25 : -.35, mk2 = .33;
            g.save(); g.translate(H0.x + 18, H0.y - 6); g.rotate(rot + 1.2 + raise); g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 8; g.drawImage(mallet, -40 * mk2, -140 * mk2, mallet.naturalWidth * mk2, mallet.naturalHeight * mk2); g.restore(); } }
        requestAnimationFrame(loop);
      };
      reset(); requestAnimationFrame(loop);
      return { reset, result() { if (outPct > 14) return null; const o = cv(220, 240), x = o.getContext('2d');                  // 하늘색 배경에서도 보이게: 또렷하게 + 하얀 테두리 빛 + 아래 그림자
          x.filter = 'brightness(1.12) contrast(1.25) saturate(1.25)'; x.shadowColor = 'rgba(255,255,255,.95)'; x.shadowBlur = 7; x.drawImage(L, 0, 0, 640, 700, 10, 10, 200, 219);
          x.filter = 'none'; x.globalCompositeOperation = 'destination-over'; x.shadowColor = 'rgba(20,40,80,.55)'; x.shadowBlur = 3; x.shadowOffsetX = 2; x.shadowOffsetY = 2; x.drawImage(L, 0, 0, 640, 700, 10, 10, 200, 219);
          return { img: o.toDataURL('image/png'), kept: inPct }; }, stop() { alive = false; } };
    },
  };

  // ── 꾸미기 틀: 바탕 그림 위에 조각을 올리고 끌어 옮긴다(도장 방식이면 누를 때마다 찍힌다). 여러 날이 이 틀을 같이 쓴다.

  /* 꼬리표 꾸미기: 글씨·펜·도장 */
  const STAMP_SRC = [1, 2, 3, 4, 5, 6].map(i => 'assets/stamp_' + i + '.png');
  function tagEdit(board, tagImg, prev, done) {
    const K = 2, TW = tagImg.naturalWidth * K, TH = tagImg.naturalHeight * K;
    const ov = mk('div', 'tagEd'), box = mk('div', 'tagBox'), can = cv(TW, TH, 'tagCv'), g = can.getContext('2d'), side = mk('div');
    ov.append(box); box.append(mk('h4', '', '꼬리표 꾸미기'), mk('div', 'tagIn')); box.lastChild.append(can, side); board.append(ov);
    const ink = cv(TW, TH), ix = ink.getContext('2d'); if (prev) ix.drawImage(prev, 0, 0, TW, TH);   // 이전에 꾸민 것(꼬리표 포함)
    const fresh = !prev; let tab = 'text', col = '#7a2a22', pen = 6, stp = 0, stS = 1, texts = [], drag = null, last = null, hist = [];
    const stImgs = STAMP_SRC.map(src => { const im = new Image(); im.src = src; return im; });
    const COLS = [['#7a2a22', '빨강'], ['#2f5a3a', '초록'], ['#2c3e66', '남색'], ['#5b3f1c', '갈색'], ['#b8892e', '금색'], ['#222', '검정']];
    const SIZES = { s: 34, m: 50, l: 70 }; let tsz = 'm';
    const snap = () => { const c = cv(TW, TH); c.getContext('2d').drawImage(ink, 0, 0); hist.push({ c, t: JSON.stringify(texts) }); if (hist.length > 15) hist.shift(); };
    const font = n => `${n}px Gaegu, "Gowun Batang", cursive`;
    function draw() { g.clearRect(0, 0, TW, TH); if (fresh) g.drawImage(tagImg, 0, 0, TW, TH); g.drawImage(ink, 0, 0);
      g.save(); g.globalCompositeOperation = 'source-atop'; g.textAlign = 'center'; g.textBaseline = 'middle';
      texts.forEach(t => { g.fillStyle = t.col; g.font = font(t.n); t.s.split('\n').forEach((ln, i, a) => g.fillText(ln, t.x, t.y + (i - (a.length - 1) / 2) * t.n * 1.1)); }); g.restore();
      if (tab === 'text' && texts.length) { const t = texts[texts.length - 1]; g.font = font(t.n); const w = Math.max(...t.s.split('\n').map(l => g.measureText(l).width)) + 16, h = t.n * 1.1 * t.s.split('\n').length + 10; g.save(); g.setLineDash([6, 5]); g.strokeStyle = 'rgba(192,57,43,.7)'; g.lineWidth = 2; g.strokeRect(t.x - w / 2, t.y - h / 2, w, h); g.restore(); } }
    function stampAt(p) { const im = stImgs[stp]; if (!im.complete) return; snap(); const d = 70 * K * stS, c = cv(d, d), x = c.getContext('2d');
      x.drawImage(im, 0, 0, d, d); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, d, d);
      x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < d * d / 40; i++) { x.globalAlpha = Math.random() * .7; x.fillRect(Math.random() * d, Math.random() * d, rnd(1, 3), rnd(1, 3)); }   // 고무도장 얼룩
      ix.save(); ix.globalAlpha = rnd(.78, .92); ix.translate(p.x, p.y); ix.rotate(rnd(-.12, .12)); ix.drawImage(c, -d / 2, -d / 2); ix.restore(); clip(); tone(160, .06, .08, 'triangle'); draw(); }
    function clip() { ix.save(); ix.globalCompositeOperation = 'destination-in'; ix.drawImage(fresh ? tagImg : prev, 0, 0, TW, TH); ix.restore(); }
    const textAt = p => { for (let k = texts.length - 1; k >= 0; k--) { const t = texts[k]; g.font = font(t.n); const w = Math.max(...t.s.split('\n').map(l => g.measureText(l).width)) / 2 + 14, h = t.n * .6 * t.s.split('\n').length + 10; if (Math.abs(p.x - t.x) < w && Math.abs(p.y - t.y) < h) return k; } return -1; };
    can.addEventListener('pointerdown', e => { const p = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId);
      if (tab === 'stamp') return stampAt(p);
      if (tab === 'pen') { snap(); last = p; ix.fillStyle = col; ix.beginPath(); ix.arc(p.x, p.y, pen / 2, 0, 7); ix.fill(); clip(); draw(); return; }
      const k = textAt(p); if (k >= 0) { const t = texts.splice(k, 1)[0]; texts.push(t); drag = { ox: p.x - t.x, oy: p.y - t.y }; inp.value = t.s; draw(); } });
    can.addEventListener('pointermove', e => { const p = at(e, can);
      if (tab === 'pen' && last) { ix.strokeStyle = col; ix.lineWidth = pen; ix.lineCap = ix.lineJoin = 'round'; ix.beginPath(); ix.moveTo(last.x, last.y); ix.lineTo(p.x, p.y); ix.stroke(); last = p; clip(); draw(); }
      else if (drag && texts.length) { const t = texts[texts.length - 1]; t.x = p.x - drag.ox; t.y = p.y - drag.oy; draw(); } });
    const up = () => { last = null; drag = null; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
    const inp = mk('textarea', 'tagTxt'); inp.rows = 2; inp.maxLength = 24; inp.placeholder = '예) 엄마에게, Merry X-mas';
    inp.addEventListener('input', () => { const v = inp.value; if (!v.trim()) { if (texts.length && texts[texts.length - 1].live) texts.pop(); draw(); return; }
      let t = texts[texts.length - 1]; if (!t || !t.live) { snap(); t = { s: v, x: TW / 2, y: TH * .62, col, n: SIZES[tsz] * K / 2 * 1.3, live: 1 }; texts.push(t); } t.s = v; draw(); });
    function ui() { const T = tools(side);
      T.tabs([['text', '글씨'], ['pen', '펜'], ['stamp', '도장']], tab, k => { tab = k; texts.forEach(t => t.live = 0); inp.value = ''; ui(); draw(); });
      const cr = T.row('색'); COLS.forEach(([c, n]) => T.sw(cr, c, c === col, n, () => { col = c; if (tab === 'text' && texts.length && texts[texts.length - 1].live) texts[texts.length - 1].col = c; ui(); draw(); }));
      if (tab === 'text') { const r = T.row('글씨'); r.append(inp); inp.value = texts.length && texts[texts.length - 1].live ? texts[texts.length - 1].s : '';
        T.seg(T.row('크기'), [['s', '작게'], ['m', '보통'], ['l', '크게']], tsz, k => { tsz = k; const t = texts[texts.length - 1]; if (t && t.live) t.n = SIZES[k] * K / 2 * 1.3; ui(); draw(); });
        side.append(mk('p', 'thint', '쓴 글씨는 꼬리표 위에서 끌어 옮겨요. 다른 글씨를 더 쓰려면 탭을 다시 눌러요.')); }
      if (tab === 'pen') T.seg(T.row('굵기'), [[3, '가늘게'], [6, '보통'], [12, '굵게']], pen, k => { pen = k; ui(); });
      if (tab === 'stamp') { const r = T.row('모양'); stImgs.forEach((im, i) => { const b = T.icon(r, im.src, '도장 ' + (i + 1), () => { stp = i; ui(); }); if (i === stp) b.classList.add('on'); });
        T.seg(T.row('크기'), [[.6, '작게'], [1, '보통'], [1.5, '크게']], stS, k => { stS = k; ui(); });
        side.append(mk('p', 'thint', '꼬리표를 누르면 콩 찍혀요.')); }
      const a = T.acts(); T.sub(a, '되돌리기', () => { const h = hist.pop(); if (!h) return; ix.clearRect(0, 0, TW, TH); ix.drawImage(h.c, 0, 0); texts = JSON.parse(h.t); ui(); draw(); });
      T.sub(a, '닫기', () => ov.remove());
      T.go(a, '다 꾸몄어요', () => { texts.forEach(t => t.live = 0); tab = 'done'; draw(); const c = cv(TW, TH); c.getContext('2d').drawImage(can, 0, 0); done(c); ov.remove(); }); }
    ui(); draw(); (document.fonts && document.fonts.load ? document.fonts.load(font(40)) : Promise.resolve()).then(draw);
  }
  const deco = cfg => ({ title: cfg.title, doneLabel: cfg.doneLabel, doneMsg: cfg.doneMsg, start(board, api) {
    board.className = 'pboard deco';
    const W = cfg.W || 640, H = cfg.H || 640, can = cv(W, H, 'dccv'), g = can.getContext('2d'); board.append(can);
    const base = cfg.base ? pic(cfg.base.img) : null, shad = cfg.base && cfg.base.shadow ? pic(cfg.base.shadow) : null, bgi = cfg.bgImg ? pic(cfg.bgImg) : null, skins = (cfg.skins || []).map(pic), imgs = cfg.stickers.map(q => pic(q[0]));
    let items = [], sel = -1, stS = 1, stR = 0, skin = -1, cur = 0, drag = null, alive = true, txt = '', off = null, skinBar = null, input = null;
    const pal = mk('div', 'dcpal');
    let lidSkin = -1, lidBar = null, rib = -1, ribBar = null;
    const RIBS = [['#b3192b', '빨강'], ['#c9a03a', '금색'], ['#1f6b44', '초록'], ['#f2ece0', '흰색'], ['#2b4f9a', '파랑']];
    if (skins.length) { skinBar = mk('div', 'dcpal'); if (cfg.lidSkin) skinBar.append(mk('span', 'dclab', '상자'));
      skins.forEach((im, i) => { const b = mk('button'); b.type = 'button'; b.dataset.k = i; const t = new Image(); t.src = im.src; t.alt = '포장지 ' + (i + 1); b.append(t); b.addEventListener('click', () => { skin = i; off = null; mark(); }); skinBar.append(b); }); board.append(skinBar);
      if (cfg.lidSkin) { lidBar = mk('div', 'dcpal'); lidBar.append(mk('span', 'dclab', '뚜껑')); const same = mk('button', 'dcsame', '상자와 같게'); same.type = 'button'; same.dataset.k = -1; same.addEventListener('click', () => { lidSkin = -1; off = null; mark(); }); lidBar.append(same);
        skins.forEach((im, i) => { const b = mk('button'); b.type = 'button'; b.dataset.k = i; const t = new Image(); t.src = im.src; t.alt = '뚜껑 포장지 ' + (i + 1); b.append(t); b.addEventListener('click', () => { lidSkin = i; off = null; mark(); }); lidBar.append(b); }); board.append(lidBar); }
      if (cfg.ribbon) { ribBar = mk('div', 'dcpal'); ribBar.append(mk('span', 'dclab', '리본')); const none = mk('button', 'dcsame', '없음'); none.type = 'button'; none.dataset.k = -1; none.addEventListener('click', () => { rib = -1; tie = null; off = null; mark(); }); ribBar.append(none);
        RIBS.forEach(([c, n], i) => { const b = mk('button', 'dcrib'); b.type = 'button'; b.dataset.k = i; b.title = n + ' 리본'; const sw = mk('span'); sw.style.cssText = `display:block;width:100%;height:100%;border-radius:6px;background:linear-gradient(90deg,${c} 0 38%,rgba(255,255,255,.55) 50%,${c} 62%)`; b.append(sw);
          b.addEventListener('click', () => { rib = i; off = null; if (!tie) { tie = { step: 1, lL: 0, lR: 0, tight: 0 }; api.guide('리본을 묶어요! ① 뚜껑 가운데 매듭에서 왼쪽으로 끌어 고리를 하나 만들어요.'); } tone(660, .08, .04, 'triangle'); mark(); }); ribBar.append(b); }); board.append(ribBar); } }
    cfg.stickers.forEach((q, i) => { const b = mk('button'); b.type = 'button'; const t = new Image(); t.src = 'assets/' + q[0]; t.alt = '조각 ' + (i + 1); if (q[2]) t.style.filter = q[2]; b.append(t);
      b.addEventListener('click', () => { if (cfg.stamp) cur = i; else { items.push({ i, x: W / 2 + rnd(-70, 70), y: H / 2 + rnd(-70, 70), r: rnd(-.25, .25), s: 1, f: 1 }); sel = items.length - 1; paintSel(); } mark(); }); pal.append(b); });
    board.append(pal);
    // 고른 조각: 손잡이로 크기·회전, 뒤집기·빼기 / 도장: 찍을 크기·각도
    const selBar = mk('div', 'dcsel'); board.append(selBar);
    function paintSel() { selBar.textContent = '';
      if (cfg.stamp) { const mkR = (lab, min, max, val, fn) => { const w = mk('label', 'dcrng'); w.append(lab); const r = mk('input'); r.type = 'range'; r.min = min; r.max = max; r.step = 'any'; r.value = val; r.addEventListener('input', () => fn(+r.value)); w.append(r); selBar.append(w); };
        mkR('도장 크기', .5, 2.2, stS, v => { stS = v; }); mkR('기울기', -180, 180, stR * 180 / Math.PI, v => { stR = v * Math.PI / 180; }); return; }
      if (items[sel]) { const b1 = mk('button', '', '↔ 뒤집기'); b1.type = 'button'; b1.addEventListener('click', () => { items[sel].f *= -1; }); const b2 = mk('button', '', '빼기'); b2.type = 'button'; b2.addEventListener('click', () => { items.splice(sel, 1); sel = -1; paintSel(); mark(); });
        selBar.append(mk('span', 'thint', '고른 조각 · 모서리 ↻ 손잡이로 크기와 회전'), b1, b2);
        if (cfg.stickers[items[sel].i][3]) { const b3 = mk('button', 'dctag', '✎ 꼬리표 꾸미기'); b3.type = 'button'; const it = items[sel]; b3.addEventListener('click', () => tagEdit(board, imgs[it.i], it.cim, c => { it.cim = c; })); selBar.insertBefore(b3, selBar.children[1]); } }
      else selBar.append(mk('span', 'thint', '붙인 조각을 누르면 크기·회전을 바꿀 수 있어요')); }
    if (cfg.text) { input = mk('input', 'dctext'); input.type = 'text'; input.maxLength = cfg.text.max; input.placeholder = cfg.text.ph; input.addEventListener('input', () => { txt = input.value; mark(); }); board.append(input); }
    let inside = { things: [], note: '' };
    if (cfg.fill) {   // 포장 전에: 열린 상자에 선물(내가 만든 것·쪽지)을 넣고 뚜껑을 닫음
      const st = mk('div', 'fillst'); st.style.cssText = 'position:absolute;inset:0;z-index:5;background:#f1e8dc;display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px;overflow:auto';
      const fc = cv(658, 440, 'fillcv'); fc.style.cssText = 'width:min(100%,560px);height:auto;touch-action:none'; const fg = fc.getContext('2d'), openI = pic('ob_open2.png'), frontI = pic('ob_front2.png');
      const tray = mk('div', 'dcpal'), note = mk('input', 'dctext'), go = mk('button', 'dcgo', '뚜껑 닫고 포장하기'); go.type = 'button'; note.type = 'text'; note.maxLength = 40; note.placeholder = '상자 안에 넣을 쪽지 (선택)';
      // 진짜 선물할 법한 것만: 내가 구운 쿠키는 비닐에 넣고 리본으로 묶어서, 먹고 마시는 건 빼고
      const FOOD = ['cocoa', 'cake', 'bungeo', 'marsh', 'mandarin'], bagI = pic('gf_bag.png');
      const bagged = one => { const c = cv(232, 308), x = c.getContext('2d'), ck = new Image(); ck.onload = () => { x.drawImage(ck, 116 - 75, 190 - 75, 150, 150); if (bagI.complete) x.drawImage(bagI, 0, 0, 232, 308); else bagI.onload = () => x.drawImage(bagI, 0, 0, 232, 308); }; ck.src = one; return c; };
      const mine = (api.mine ? api.mine() : []).filter(o => !FOOD.includes(o.play)).map(o => o.one ? { day: o.day, name: '내가 구운 쿠키', cnv: bagged(o.one), w: 112 } : o)
        .concat([['gf_mitten.png', '털장갑', 130], ['gf_scarf.png', '목도리', 170], ['gf_candle.png', '향초', 78], ['gf_book.png', '책', 132]].map(([f, nm, w]) => ({ img: 'assets/' + f, name: nm, w })));
      const put = []; let anim = true, closing = 0;
      tray.append(mk('span', 'dclab', '넣을 것')); mine.forEach(o => { const b = mk('button'); b.type = 'button'; b.title = o.name; const t = new Image(); t.alt = o.name; if (o.cnv) setTimeout(() => { t.src = o.cnv.toDataURL(); }, 400); else t.src = o.img; b.append(t);
        b.addEventListener('click', () => { if (put.length >= 3) { api.guide('상자에는 세 개까지 넣을 수 있어요.'); return; } const im = o.cnv || new Image(); if (!o.cnv) im.src = o.img; const SL = [330, 440, 385].filter(x => !put.some(p => p.sx === x)); put.push({ o, im, sx: SL[0], x: SL[0] + rnd(-10, 10), y: -60, ty: 210 + rnd(-12, 12), r: rnd(-.3, .3), v: 0 }); tone(520, .06, .04, 'triangle'); }); tray.append(b); });
      fc.addEventListener('pointerdown', e => { const q = at(e, fc); for (let i = put.length - 1; i >= 0; i--) { const p = put[i]; if (Math.abs(q.x - p.x) < 50 && q.y > p.ty - 110 && q.y < p.ty + 10) { put.splice(i, 1); tone(300, .06, .04, 'triangle'); return; } } });
      note.addEventListener('input', () => { inside.note = note.value; });
      go.addEventListener('click', () => { inside.things = put.map(p => ({ day: p.o.day, img: p.o.cnv ? p.o.cnv.toDataURL() : p.o.img, name: p.o.name })); inside.note = note.value.trim(); closing = 1e-3; go.disabled = true; tone(160, .15, .07, 'square'); });
      const gb = mk('div', 'pbar'); gb.append(go); st.append(fc, tray, note, gb); board.style.position = 'relative'; board.append(st); setTimeout(() => api.guide('선물 상자에 넣을 것을 골라요. 넣은 것을 누르면 다시 꺼내요. 다 넣었으면 뚜껑을 닫아요.'), 0);
      (function loop(t) { if (!anim || !alive) return; requestAnimationFrame(loop); fg.clearRect(0, 0, 658, 440);
        if (openI.complete) fg.drawImage(openI, 0, 6);
        for (const p of put) { if (p.y < p.ty) { p.v += 2400 / 3600; p.y = Math.min(p.ty, p.y + p.v * 16); if (p.y >= p.ty) tone(240, .05, .04, 'triangle'); } if (!p.o.cnv && !p.im.complete) continue; const w = p.o.w || 110, h = w * (p.im.naturalHeight || p.im.height) / (p.im.naturalWidth || p.im.width || 1); fg.save(); fg.translate(p.x, p.y); fg.rotate(p.r); fg.drawImage(p.im, -w / 2, -h, w, h); fg.restore(); }   // 상자 안으로 쏙 떨어짐
        if (frontI.complete) fg.drawImage(frontI, 0, 6);   // 앞벽이 안에 든 것을 가림
        if (closing) { closing += .035; st.style.opacity = String(Math.max(0, 1 - closing)); if (closing >= 1) { anim = false; st.remove(); api.guide(cfg.guide); } } })(0);
    }
    const ok = () => items.length >= (cfg.min || 0) && (!skins.length || skin >= 0) && (!cfg.text || !cfg.text.need || txt.trim().length > 0);
    const mark = () => { if (cfg.stamp) [...pal.children].forEach((b, i) => b.setAttribute('aria-pressed', i === cur)); if (skinBar) skinBar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.k === skin)); if (lidBar) lidBar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.k === lidSkin)); if (ribBar) ribBar.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.k === rib)); api.ready(ok()); };
    const size = (i, sc) => { const im = imgs[i], w = cfg.stickers[i][1] * (sc || 1); return [w, w * (im.naturalHeight || 1) / (im.naturalWidth || 1)]; };
    const loc = (it, p) => { const c = Math.cos(-it.r), sn = Math.sin(-it.r), dx = p.x - it.x, dy = p.y - it.y; return { x: dx * c - dy * sn, y: dx * sn + dy * c }; };
    const hpt = it => { const [w, h] = size(it.i, it.s), c = Math.cos(it.r), sn = Math.sin(it.r), hx = w / 2 + 8, hy = -h / 2 - 8; return { x: it.x + hx * c - hy * sn, y: it.y + hx * sn + hy * c }; };
    const hit = p => { for (let k = items.length - 1; k >= 0; k--) { const it = items[k], [w, h] = size(it.i, it.s), q = loc(it, p); if (Math.abs(q.x) < w / 2 && Math.abs(q.y) < h / 2) return k; } return -1; };
    // 리본 묶기: 매듭에서 왼쪽으로 끌면 왼쪽 고리, 오른쪽으로 끌면 오른쪽 고리, 아래로 당기면 꽉 묶여요
    let tie = null, tieDrag = null;
    const knot = () => { const b2 = cfg.base, kx = b2.w / b2.iw, ky = b2.h / b2.ih, top = cfg.faces[2].p, cx = top.reduce((a, q) => a + q[0], 0) / 4, cy = top.reduce((a, q) => a + q[1], 0) / 4; return { x: b2.x + cx * kx, y: b2.y + cy * ky }; };
    can.addEventListener('pointerdown', e => { const p0 = at(e, can); if (rib >= 0 && tie && tie.step < 4) { const K = knot(); if (Math.hypot(p0.x - K.x, p0.y - K.y) < 95) { e.preventDefault(); e.stopImmediatePropagation(); tieDrag = { id: e.pointerId }; can.setPointerCapture(e.pointerId); return; } } }, true);
    can.addEventListener('pointermove', e => { if (!tieDrag || tieDrag.id !== e.pointerId || !tie) return; const p0 = at(e, can), K = knot(), dx = p0.x - K.x, dy = p0.y - K.y, cl = v => Math.max(0, Math.min(1, v));
      if (tie.step === 1) { tie.lL = Math.max(tie.lL, cl(-dx / 110)); if (tie.lL >= 1) { tie.step = 2; tone(700, .12, .05, 'triangle'); api.guide('② 이번엔 매듭에서 오른쪽으로 끌어 고리를 하나 더 만들어요.'); } }
      else if (tie.step === 2) { tie.lR = Math.max(tie.lR, cl(dx / 110)); if (tie.lR >= 1) { tie.step = 3; tone(820, .12, .05, 'triangle'); api.guide('③ 매듭을 아래로 쭉 당겨 꽉 묶어요.'); } }
      else if (tie.step === 3) { tie.tight = Math.max(tie.tight, cl(dy / 70)); if (tie.tight >= 1) { tie.step = 4; [660, 880, 1100].forEach((f, k) => setTimeout(() => tone(f, .25, .05, 'triangle'), k * 90)); scratch(.15, .05, 1400); api.guide('리본을 예쁘게 묶었어요! 꼬리표를 올려도 되고, 다 됐으면 아래 버튼을 눌러요.'); mark(); } }
      if (Math.random() < .2) scratch(.04, .02, 2200); e.stopImmediatePropagation(); }, true);
    const tieUp = e => { if (tieDrag && tieDrag.id === e.pointerId) { tieDrag = null; e.stopImmediatePropagation(); } }; can.addEventListener('pointerup', tieUp, true); can.addEventListener('pointercancel', tieUp, true);
    function drawBow(c) { if (rib < 0 || !tie) return; const K = knot(), col = RIBS[rib][0], tg = tie.tight, x = K.x, y = K.y - 6 * tg; c.save(); c.translate(x, y); c.scale(1.6, 1.6); c.translate(-x, -y);
      const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g2 = n >> 8 & 255, b = n & 255, f = v => Math.max(0, Math.min(255, Math.round(v * k))); return `rgb(${f(r)},${f(g2)},${f(b)})`; };
      const sat = (x0, y0, x1, y1) => { const gr = c.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, shade(col, .72)); gr.addColorStop(.45, shade(col, 1.18)); gr.addColorStop(.55, shade(col, 1.05)); gr.addColorStop(1, shade(col, .68)); return gr; };
      c.save(); c.lineJoin = 'round';
      // 꼬리 두 가닥
      const tl = 26 + 34 * tg; [[-1, .35], [1, -.3]].forEach(([sd, sw]) => { c.fillStyle = sat(x, y, x + sd * 30, y + tl); c.beginPath(); c.moveTo(x - 6 * sd, y); c.quadraticCurveTo(x + sd * (10 + sw * 20), y + tl * .55, x + sd * (18 + 8 * tg), y + tl); c.lineTo(x + sd * (30 + 8 * tg), y + tl - 9); c.quadraticCurveTo(x + sd * (20 + sw * 20), y + tl * .5, x + 6 * sd, y); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1; c.stroke(); });
      // 고리 (당길수록 살짝 작고 동그랗게)
      const loop = (sd, amt) => { if (amt <= 0) return; const L = (20 + 52 * amt) * (1 - .12 * tg), Hh = (12 + 22 * amt) * (1 - .1 * tg); c.fillStyle = sat(x, y - Hh, x + sd * L, y + Hh); c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + sd * L * .3, y - Hh * 1.5, x + sd * L * 1.05, y - Hh * 1.2, x + sd * L, y - 2); c.bezierCurveTo(x + sd * L * 1.02, y + Hh * .9, x + sd * L * .35, y + Hh * .9, x, y); c.fill(); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1.2; c.stroke();
        c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(x + sd * 4, y); c.bezierCurveTo(x + sd * L * .35, y - Hh * .5, x + sd * L * .75, y - Hh * .45, x + sd * L * .8, y); c.bezierCurveTo(x + sd * L * .7, y + Hh * .3, x + sd * L * .3, y + Hh * .25, x + sd * 4, y); c.fill(); };   // 고리 안쪽 그늘
      loop(-1, tie.lL); loop(1, tie.lR);
      // 매듭
      const kr = 13 - 4 * tg; c.fillStyle = sat(x - kr, y - kr, x + kr, y + kr); c.beginPath(); c.ellipse(x, y, kr, kr * .85, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.stroke();
      c.restore();
      if (tie.step < 4) { const t = performance.now() / 400, dir = tie.step === 1 ? -1 : tie.step === 2 ? 1 : 0, ax = x + dir * (40 + 14 * Math.sin(t)), ay = y + (dir ? -30 : 34 + 10 * Math.sin(t)); c.save(); c.fillStyle = 'rgba(255,255,255,.95)'; c.strokeStyle = 'rgba(120,80,50,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(ax, ay, 14, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#7a4a2a'; c.font = '700 16px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(dir < 0 ? '←' : dir > 0 ? '→' : '↓', ax, ay + 1); c.restore(); }   // 끌 방향 안내
      c.restore(); }
    can.addEventListener('pointerdown', e => { const p = at(e, can); e.preventDefault();
      if (cfg.stamp) { items.push({ i: cur, x: p.x, y: p.y, r: stR + rnd(-.05, .05), s: stS, f: 1, a: .95 }); tone(170, .07, .09, 'triangle'); return mark(); }
      if (items[sel]) { const hp = hpt(items[sel]); if (Math.hypot(p.x - hp.x, p.y - hp.y) < 20) { const it = items[sel]; drag = { id: e.pointerId, handle: 1, s0: it.s, r0: it.r, d0: Math.hypot(hp.x - it.x, hp.y - it.y), a0: Math.atan2(hp.y - it.y, hp.x - it.x) }; can.setPointerCapture(e.pointerId); return; } }
      const k = hit(p); if (k >= 0) { const it = items.splice(k, 1)[0]; items.push(it); sel = items.length - 1; drag = { id: e.pointerId, ox: p.x - it.x, oy: p.y - it.y }; can.setPointerCapture(e.pointerId); } else sel = -1; paintSel(); });
    can.addEventListener('pointermove', e => { if (!drag || drag.id !== e.pointerId) return; const p = at(e, can), it = items[sel]; if (!it) return; if (drag.handle) { it.s = Math.max(.3, Math.min(3, drag.s0 * Math.hypot(p.x - it.x, p.y - it.y) / drag.d0)); it.r = drag.r0 + Math.atan2(p.y - it.y, p.x - it.x) - drag.a0; return; } it.x = p.x - drag.ox; it.y = p.y - drag.oy; });
    const up = e => { if (!drag || drag.id !== e.pointerId) return; const hd = drag.handle; drag = null; const it = items[sel]; if (!hd && it && (it.x < 0 || it.x > W || it.y < 0 || it.y > H)) { items.splice(sel, 1); sel = -1; paintSel(); mark(); } };   // 판 밖으로 끌어내면 떼어짐
    can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
    // 면마다 방향·원근을 따라 포장지를 붙임(뚜껑은 따로 고를 수 있음)
    const hull = P => { const p = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
      for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
      for (const q of p.reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); } return lo.slice(0, -1).concat(up.slice(0, -1)); };
    function wrapFaces(o, b) { const kx = b.w / b.iw, ky = b.h / b.ih, M = q => [b.x + q[0] * kx, b.y + q[1] * ky];
      const lidPts = cfg.faces.filter(f => f.lid).flatMap(f => f.p.map(M)), lim = skins[lidSkin >= 0 ? lidSkin : skin];
      if (lidPts.length && lim && lim.complete) { const H2 = hull(lidPts), cx = H2.reduce((a, q) => a + q[0], 0) / H2.length, cy = H2.reduce((a, q) => a + q[1], 0) / H2.length;   // 뚜껑 전체 바탕을 먼저 뚜껑 포장지로 깔아 상자 색이 비치지 않게
        o.save(); o.beginPath(); H2.forEach((q, i) => { const d = Math.hypot(q[0] - cx, q[1] - cy) || 1, e = q[1] < cy ? 18 : 6, X = q[0] + (q[0] - cx) / d * e, Y = q[1] + (q[1] - cy) / d * e; i ? o.lineTo(X, Y) : o.moveTo(X, Y); }); o.closePath(); o.fillStyle = o.createPattern(lim, 'repeat'); o.fill(); o.restore(); }
      for (const f of cfg.faces) { const k = f.lid && lidSkin >= 0 ? lidSkin : skin, im = skins[k]; if (!im || !im.complete) continue;
        const P0 = f.p.map(M), cx0 = P0.reduce((a, q) => a + q[0], 0) / P0.length, cy0 = P0.reduce((a, q) => a + q[1], 0) / P0.length, P = f.lid ? P0.map(q => { const d = Math.hypot(q[0] - cx0, q[1] - cy0) || 1; return [q[0] + (q[0] - cx0) / d * 7, q[1] + (q[1] - cy0) / d * 7]; }) : P0, O = M(f.o || f.p[0]), U = M(f.u || f.p[1]), V = M(f.v || f.p[3]);
        const lu = Math.hypot(U[0] - O[0], U[1] - O[1]), lv = Math.hypot(V[0] - O[0], V[1] - O[1]), t = 1.15;      // 무늬 한 칸 크기
        o.save(); o.beginPath(); P.forEach((q, i) => i ? o.lineTo(q[0], q[1]) : o.moveTo(q[0], q[1])); o.closePath(); o.clip();
        o.transform((U[0] - O[0]) / lu * t, (U[1] - O[1]) / lu * t, (V[0] - O[0]) / lv * t, (V[1] - O[1]) / lv * t, O[0], O[1]);
        o.fillStyle = o.createPattern(im, 'repeat'); o.fillRect(-2000, -2000, 4000, 4000); o.restore(); } }
    // 리본: 각 면 가운데를 지나 상자를 십자로 감싸는 띠 (윤기 있는 새틴)
    function ribbons(o, b) { if (rib < 0) return; const kx = b.w / b.iw, ky = b.h / b.ih, M = q => [b.x + q[0] * kx, b.y + q[1] * ky], L = (a, c, t) => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t], col = RIBS[rib][0], w = .07;
      const band = (a0, a1, c0, c1) => { const P = [L(a0, a1, .5 - w), L(a0, a1, .5 + w), L(c0, c1, .5 + w), L(c0, c1, .5 - w)].map(M), g2 = o.createLinearGradient(P[0][0], P[0][1], P[1][0], P[1][1]);
        g2.addColorStop(0, col); g2.addColorStop(.42, col); g2.addColorStop(.5, 'rgba(255,255,255,.3)'); g2.addColorStop(.58, col); g2.addColorStop(1, col);
        o.save(); o.globalCompositeOperation = 'source-atop'; o.beginPath(); P.forEach((q, i) => i ? o.lineTo(q[0], q[1]) : o.moveTo(q[0], q[1])); o.closePath(); o.fillStyle = col; o.fill(); o.fillStyle = g2; o.globalAlpha = .55; o.fill(); o.globalAlpha = 1;
        o.strokeStyle = 'rgba(0,0,0,.18)'; o.lineWidth = 1.2; o.beginPath(); o.moveTo(P[0][0], P[0][1]); o.lineTo(P[3][0], P[3][1]); o.moveTo(P[1][0], P[1][1]); o.lineTo(P[2][0], P[2][1]); o.stroke(); o.restore(); };
      cfg.faces.forEach((f, i) => { const p = f.p; if (i === 2) { band(p[0], p[3], p[1], p[2]); band(p[0], p[1], p[3], p[2]); } else band(p[0], p[1], p[3], p[2]); }); }
    function paint(c, out) {
      c.clearRect(0, 0, W, H); if (cfg.bg && !out) { c.fillStyle = cfg.bg; c.fillRect(0, 0, W, H); } if (bgi && bgi.complete) c.drawImage(bgi, 0, 0, W, H);
      if (cfg.line) { c.strokeStyle = '#9a7b5a'; c.lineWidth = 3; c.beginPath(); c.moveTo(20, cfg.line); c.quadraticCurveTo(W / 2, cfg.line + 70, W - 20, cfg.line); c.stroke(); }
      if (base && base.complete && base.naturalWidth) { const b = cfg.base;
        if (cfg.ribbon) { const kx = b.w / b.iw, ky = b.h / b.ih, sx = b.x + 300 * kx, sy = b.y + 318 * ky, gr = c.createRadialGradient(sx, sy, 10, sx, sy, 250 * kx); gr.addColorStop(0, 'rgba(60,50,40,.38)'); gr.addColorStop(1, 'rgba(60,50,40,0)'); c.save(); c.translate(sx, sy); c.scale(1, .28); c.translate(-sx, -sy); c.fillStyle = gr; c.beginPath(); c.arc(sx, sy, 250 * kx, 0, 7); c.fill(); c.restore(); }
        else if (shad && shad.complete) { c.save(); c.globalCompositeOperation = out ? 'source-over' : 'multiply'; c.drawImage(shad, b.x, b.y, b.w, b.h); c.restore(); }
        if (skin >= 0 && skins[skin].complete) { if (!off) { off = cv(W, H); const o = off.getContext('2d'); o.drawImage(base, b.x, b.y, b.w, b.h); o.globalCompositeOperation = 'source-atop'; o.fillStyle = o.createPattern(skins[skin], 'repeat'); o.fillRect(0, 0, W, H); if (cfg.faces) { wrapFaces(o, b); ribbons(o, b); } o.globalCompositeOperation = 'multiply'; o.drawImage(base, b.x, b.y, b.w, b.h); o.globalCompositeOperation = 'destination-in'; o.drawImage(base, b.x, b.y, b.w, b.h); } c.drawImage(off, 0, 0); }
        else c.drawImage(base, b.x, b.y, b.w, b.h); }
      drawBow(c);
      for (const it of items) { const [w, h] = size(it.i, it.s), f = cfg.stickers[it.i][2]; c.save(); c.translate(it.x, it.y); c.rotate(it.r); c.scale(it.cim ? 1 : it.f || 1, 1); if (f) c.filter = f; c.globalAlpha = it.a || 1; c.drawImage(it.cim || imgs[it.i], -w / 2, -h / 2, w, h); c.restore(); }
      if (!out && !cfg.stamp && items[sel]) { const it = items[sel], [w, h] = size(it.i, it.s); c.save(); c.translate(it.x, it.y); c.rotate(it.r); c.setLineDash([6, 5]); c.strokeStyle = 'rgba(192,57,43,.8)'; c.lineWidth = 2; c.strokeRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8); c.restore(); c.setLineDash([]);
        const hp = hpt(it); c.fillStyle = '#fff'; c.strokeStyle = '#c0392b'; c.lineWidth = 3; c.beginPath(); c.arc(hp.x, hp.y, 12, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#c0392b'; c.font = '15px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('↻', hp.x, hp.y + 1); c.textBaseline = 'alphabetic'; }
      if (cfg.text && txt && !(out && cfg.text.hideOut)) { const t = cfg.text, per = t.per || 99, lines = []; for (let i = 0; i < txt.length; i += per) lines.push(txt.slice(i, i + per)); c.fillStyle = t.color || '#5b3a2e'; c.font = `${t.size || 30}px "Gowun Batang",serif`; c.textAlign = 'center'; lines.forEach((ln, i) => c.fillText(ln, t.x, t.y + i * (t.size || 30) * 1.35)); }
    }
    const loop = () => { if (!alive) return; paint(g, false); requestAnimationFrame(loop); };
    const reset = () => { items = []; sel = -1; skin = -1; lidSkin = -1; off = null; tie = null; tieDrag = null; txt = ''; if (input) input.value = ''; mark(); paintSel(); api.guide(cfg.guide); };
    reset(); requestAnimationFrame(loop);
    return { reset, result() { if (!ok()) return null; const o = cfg.out || { x: 0, y: 0, w: W, h: H }, t = cv(W, H); paint(t.getContext('2d'), true); const k = Math.min(1, (cfg.outSize || 190) / Math.max(o.w, o.h)), r = cv(Math.round(o.w * k), Math.round(o.h * k)); r.getContext('2d').drawImage(t, o.x, o.y, o.w, o.h, 0, 0, r.width, r.height); const res = cfg.noImg ? { done: 1 } : { img: r.toDataURL('image/png') }; if (cfg.text) res.text = txt.trim(); if (cfg.fill && (inside.things.length || inside.note)) res.inside = inside; return res; }, stop() { alive = false; } };
  } });
  const seq = (pre, n, w) => Array.from({ length: n }, (_, i) => [pre + (i + 1) + '.png', w]);
  plays.wreath = deco({ title: '리스 만들기', doneLabel: '트리에 달기', doneMsg: '내가 만든 리스를 트리에 걸어 뒀어요.', guide: '아래 재료를 누르면 리스 위에 올라가요. 끌어서 자리를 잡고, 판 밖으로 끌어내면 떼어져요. 네 개 이상 올려 보세요.', bg: '#e7eef3', base: { img: 'wr_base2.png', x: 70, y: 70, w: 500, h: 500 }, stickers: seq('wr_', 13, 120), min: 4 });
  plays.ginger = deco({ title: '진저브레드 집 꾸미기', doneLabel: '탁자에 올려 두기', doneMsg: '진저브레드 집을 탁자에 올려 뒀어요.', guide: '평평한 쿠키와 사탕을 눌러서 과자 집에 붙여요. 끌어서 옮기고, 판 밖으로 끌어내면 떼어져요. 다섯 개 이상 붙여 보세요.', bg: '#e7eef3', base: { img: 'gb_base2.png', x: 80, y: 90, w: 480, h: 480 }, stickers: [['gb_sq.png', 70], ['gb_rect.png', 96], ['gb_rect_ice.png', 96], ['gb_win.png', 64], ['gb_plank.png', 110], ['ck_round.png', 74], ['ck_heart.png', 70], ['ck_star.png', 74], ['ck_tree.png', 74], ['ck_star6.png', 70]].concat(seq('cd_s', 16, 62)), min: 5 });
  plays.wrap = deco({ fill: 1, ribbon: 1, title: '선물 포장하기', doneLabel: '트리 아래에 놓기', doneMsg: '포장한 선물을 트리 곁에 놓았어요.', guide: '포장지를 고르고, 리본 색을 고르면 상자에 리본이 둘러져요. 꼬리표도 올려 꾸며요.', bg: '#f1e8dc', base: { img: 'box_body2.png', shadow: 'box_shadow2.png', x: 90, y: 150, w: 460, h: 340, iw: 520, ih: 358 }, lidSkin: true, faces: [{ p: [[55, 112], [325, 152], [325, 350], [58, 300]] }, { p: [[325, 152], [508, 98], [508, 275], [325, 350]] }, { lid: 1, p: [[42, 55], [245, 4], [515, 34], [328, 90]], o: [42, 55], u: [245, 4], v: [328, 90] }, { lid: 1, p: [[42, 55], [328, 90], [326, 153], [44, 114]] }, { lid: 1, p: [[328, 90], [515, 34], [510, 99], [326, 153]] }], skins: ['paper_1.jpg', 'paper_2.jpg', 'paper_3.jpg', 'paper_4.jpg'], stickers: [['tag_1.png', 90, '', 1], ['tag_2.png', 90, '', 1], ['tag_3.png', 90, '', 1]], min: 1 });
  plays.card = deco({ title: '크리스마스 카드', doneLabel: '카드 간직하기', doneMsg: '카드를 탁자에 올려 뒀어요.', guide: '도장을 고르고 카드를 누르면 찍혀요. 아래 칸에 한마디도 적어 보세요. 도장을 두 번 이상 찍어요.', bg: '#e7eef3', W: 720, H: 520, base: { img: 'card_base1.png', x: 50, y: 30, w: 620, h: 460 }, stickers: seq('stamp_', 6, 96), stamp: true, min: 2, text: { x: 360, y: 430, max: 20, size: 28, ph: '카드에 적을 한마디 (20자까지)' }, out: { x: 50, y: 30, w: 620, h: 460 } });
  plays.holly = deco({ title: '호랑가시 묶기', doneLabel: '트리에 달기', doneMsg: '호랑가시 다발을 트리에 달아 뒀어요.', guide: '가지를 눌러 올리고 끌어서 모아요. 마지막에 리본을 올려 묶어요. 세 개 이상 올려 보세요.', bg: '#e7eef3', stickers: seq('ho_', 6, 250).concat([['wr_11.png', 170], ['bow.png', 170]]), min: 3 });
  plays.wish = deco({ title: '소원 쪽지', doneLabel: '접어서 트리에 달기', doneMsg: '소원 쪽지를 접어서 트리에 달았어요. 내일까지는 펼칠 수 없어요.', guide: '아래 칸에 소원을 적어요. 접어서 달면 내일 별을 올릴 때 펼쳐져요.', bg: '#e7eef3', W: 560, H: 420, base: { img: 'tag_1.png', x: 180, y: 10, w: 200, h: 400 }, stickers: seq('stamp_', 6, 44), stamp: true, min: 0, text: { x: 280, y: 220, max: 24, per: 8, size: 21, need: true, hideOut: true, ph: '소원을 적어요 (24자까지)' }, out: { x: 180, y: 10, w: 200, h: 400 }, outSize: 150 });

  // ── 유리 구슬: ① 무늬 고르기 → ② 칸마다 색유리 칠하기 → ③ 불빛 비추기 (유화로 그린 납선 구슬 위에 색을 입힘)
  plays.bauble = {
    title: '스테인드글라스 구슬', doneLabel: '트리에 달기', doneMsg: '빛이 비치는 유리 구슬을 트리에 달았어요.',
    start(board, api) {
      board.className = 'pboard sg'; const pw = board.closest('.panel-wrap'); pw && pw.classList.add('wide');
      const PAT = { diamond: { n: '마름모', w: 484, h: 600, cx: 242, cy: 358, r: 216 }, star: { n: '별', w: 484, h: 600, cx: 242, cy: 358, r: 216 }, flower: { n: '꽃', w: 484, h: 600, cx: 242, cy: 358, r: 216 }, grid: { n: '격자', w: 484, h: 600, cx: 242, cy: 358, r: 216 } };
      Object.keys(PAT).forEach(k => { PAT[k].img = pic('sg_' + k + '.jpg'); PAT[k].labI = pic('sg_' + k + '_lab.png'); });
      const W = 500, H = 600, can = cv(W, H, 'sgcv'), g = can.getContext('2d'), side = mk('div'); board.append(can, side);
      const GL = [['#b3192b', '루비'], ['#e09a16', '호박'], ['#17804a', '에메랄드'], ['#1f4fae', '사파이어'], ['#6d33a0', '자수정'], ['#e06a98', '장미'], ['#3fa6c4', '하늘'], ['#f0d872', '달빛']];
      let pk = 'flower', tab = 'pick', col = 0, mode = 'tap', fills = {}, lab = null, C = cv(W, H), cg = C.getContext('2d'), BR = cv(W, H), bg2 = BR.getContext('2d'), dirty = true, hist = [], lit = false, light = { x: 90, y: 120 }, dragL = false, last = null, alive = true;
      const P = () => PAT[pk];
      function loadLab() { const p = P(); lab = null; if (!p.labI.complete) return; const t = cv(p.w, p.h), x = t.getContext('2d', { willReadFrequently: true }); x.drawImage(p.labI, 0, 0); const d = x.getImageData(0, 0, p.w, p.h).data; lab = new Uint8Array(p.w * p.h); for (let i = 0; i < lab.length; i++) lab[i] = d[i * 4]; dirty = true; }
      const ox = () => (W - P().w) / 2;
      const labAt = q => { if (!lab) loadLab(); if (!lab) return 0; const p = P(), x = Math.round(q.x - ox()), y = Math.round(q.y); if (x < 0 || y < 0 || x >= p.w || y >= p.h) return 0; return lab[y * p.w + x]; };
      function buildColor() { const p = P(); if (!lab) loadLab(); cg.clearRect(0, 0, W, H); if (!lab) return; const t = cv(p.w, p.h), x = t.getContext('2d'), D = x.createImageData(p.w, p.h), d = D.data, rgb = {};
        Object.entries(fills).forEach(([k, h]) => rgb[k] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
        for (let i = 0; i < lab.length; i++) { const c = rgb[lab[i]]; if (!c) continue; d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255; }
        x.putImageData(D, 0, 0); cg.filter = 'blur(1.2px)'; cg.drawImage(t, ox(), 0); cg.filter = 'none'; cg.drawImage(BR, 0, 0); dirty = false; }
      const snap = () => { const b2 = cv(W, H); b2.getContext('2d').drawImage(BR, 0, 0); hist.push([JSON.stringify(fills), b2]); if (hist.length > 25) hist.shift(); };
      const painted = () => Object.keys(fills).length > 0 || brushN > 0; let brushN = 0;
      const ready = () => api.ready(Object.keys(fills).length >= 3 || brushN > 60);
      can.addEventListener('pointerdown', e => { const q = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId);
        if (tab === 'light') { lit = !lit; ui(); return; }
        if (tab !== 'paint') return;
        if (mode === 'tap') { const k = labAt(q); if (!k) return; snap(); if (col < 0) delete fills[k]; else fills[k] = GL[col][0]; dirty = true; tone(560 + (col < 0 ? -200 : col * 45), .2, .06, 'sine'); ready(); return; }
        snap(); last = q; stroke(q); });
      function stroke(q) { const p = P(); bg2.save(); bg2.beginPath(); bg2.arc(ox() + p.cx, p.cy, p.r, 0, 7); bg2.clip(); bg2.lineCap = bg2.lineJoin = 'round'; bg2.lineWidth = 18;
        if (col < 0) bg2.globalCompositeOperation = 'destination-out'; bg2.strokeStyle = bg2.fillStyle = col < 0 ? '#000' : GL[col][0];
        bg2.beginPath(); if (last && (last.x !== q.x || last.y !== q.y)) { bg2.moveTo(last.x, last.y); bg2.lineTo(q.x, q.y); bg2.stroke(); } else { bg2.arc(q.x, q.y, 9, 0, 7); bg2.fill(); } bg2.restore(); last = q; brushN++; dirty = true; ready(); }
      can.addEventListener('pointermove', e => { const q = at(e, can); if (dragL) { light = q; return; } if (last) stroke(q); });
      const up = () => { last = null; dragL = false; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function glassLayer() { const p = P(), t = cv(W, H), x = t.getContext('2d'); if (!p.img.complete) return t; x.drawImage(p.img, ox(), 0, p.w, p.h);
        x.globalCompositeOperation = 'multiply'; x.globalAlpha = .9; x.drawImage(C, 0, 0); x.globalAlpha = 1;   // 그림의 붓결·하이라이트에 색을 곱함
        x.globalCompositeOperation = 'destination-in'; x.drawImage(C, 0, 0); return t; }
      function paint(x, out, now) { const p = P(); if (dirty) buildColor(); x.clearRect(0, 0, W, H); if (!p.img.complete) return;
        x.drawImage(p.img, ox(), 0, p.w, p.h); const gl = glassLayer();
        if (lit && !out) { litPaint(x, now); return; }
        x.drawImage(gl, 0, 0); glassFinish(x, false);
        if (out) { x.globalCompositeOperation = 'destination-in'; x.beginPath(); x.arc(ox() + p.cx, p.cy, p.r + 6, 0, 7); x.rect(ox() + p.cx - 60, 0, 120, p.cy - p.r + 20); x.fill(); x.globalCompositeOperation = 'source-over'; } }
      // 색유리 결(손으로 만든 유리처럼 얼룩덜룩) + 둥근 구슬 그늘 + 반짝이는 하이라이트
      let texC = null; function glassTex() { if (texC) return texC; texC = cv(W, H); const x = texC.getContext('2d'), sm = cv(40, 48), sx = sm.getContext('2d'), D = sx.createImageData(40, 48);
        for (let i = 0; i < D.data.length; i += 4) { const v = 128 + (Math.random() - .5) * 150; D.data[i] = D.data[i + 1] = D.data[i + 2] = v; D.data[i + 3] = 255; } sx.putImageData(D, 0, 0);
        x.imageSmoothingQuality = 'high'; x.filter = 'blur(6px)'; x.drawImage(sm, -20, -20, W + 40, H + 40); x.filter = 'none';
        for (let i = 0; i < 900; i++) { x.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)'; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 2.6, 0, 7); x.fill(); }   // 작은 기포
        return texC; }
      function glassFinish(x, litOn) { const p = P(), cx = ox() + p.cx, cy = p.cy, R = p.r;
        tmpG.clearRect(0, 0, W, H); tmpG.drawImage(glassTex(), 0, 0); tmpG.globalCompositeOperation = 'destination-in'; tmpG.drawImage(C, 0, 0); tmpG.globalCompositeOperation = 'source-over';
        x.save(); x.globalCompositeOperation = 'overlay'; x.globalAlpha = litOn ? .55 : .42; x.drawImage(tmpC, 0, 0); x.restore();
        const ld = buildLead(); if (ld && !litOn) { x.save(); x.globalAlpha = .9; x.drawImage(ld, 0, 0); x.restore(); }
        x.save(); x.beginPath(); x.arc(cx, cy, R, 0, 7); x.clip();
        if (!litOn) { const sh = x.createRadialGradient(cx - R * .25, cy - R * .3, R * .2, cx, cy, R * 1.02); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.7, 'rgba(0,0,0,.05)'); sh.addColorStop(1, 'rgba(10,20,30,.38)'); x.fillStyle = sh; x.fillRect(cx - R, cy - R, R * 2, R * 2); }
        x.globalCompositeOperation = 'screen'; x.filter = 'blur(3px)'; x.strokeStyle = `rgba(255,255,255,${litOn ? .22 : .55})`; x.lineWidth = R * .07; x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy, R * .82, Math.PI * 1.08, Math.PI * 1.42); x.stroke();
        x.lineWidth = R * .03; x.beginPath(); x.arc(cx, cy, R * .9, Math.PI * 1.5, Math.PI * 1.6); x.stroke(); x.filter = 'none';
        x.fillStyle = `rgba(255,255,255,${litOn ? .35 : .8})`; x.beginPath(); x.ellipse(cx - R * .5, cy - R * .52, R * .045, R * .03, -.7, 0, 7); x.fill(); x.restore(); }
      // 불 켠 모습: 납선은 또렷하게, 색유리는 빛이 비쳐 환하게
      let leadC = null, leadFor = null, cellC = cv(W, H), cellG = cellC.getContext('2d'), tmpC = cv(W, H), tmpG = tmpC.getContext('2d');
      function buildLead() { const p = P(); if (!lab) loadLab(); if (!lab) return null; if (leadFor === pk && leadC) return leadC; const t = cv(p.w, p.h), x = t.getContext('2d'), D = x.createImageData(p.w, p.h), d = D.data;
        const ed = new Uint8Array(p.w * p.h); for (let y = 1; y < p.h - 1; y++) for (let xx = 1; xx < p.w - 1; xx++) { const i = y * p.w + xx, v = lab[i]; if (lab[i + 1] !== v || lab[i + p.w] !== v) ed[i] = 1; }
        const RD = 3; for (let y = 0; y < p.h; y++) for (let xx = 0; xx < p.w; xx++) { const i = y * p.w + xx, r = Math.hypot(xx - p.cx, y - p.cy); if (r > p.r + 1.5) continue; let on = r > p.r - 4;
          for (let dy = -RD; dy <= RD && !on; dy++) for (let dx = -RD; dx <= RD; dx++) { const yy = y + dy, x2 = xx + dx; if (dx * dx + dy * dy > RD * RD + 1 || yy < 0 || x2 < 0 || yy >= p.h || x2 >= p.w) continue; if (ed[yy * p.w + x2]) { on = true; break; } }
          if (on) { d[i * 4] = 28; d[i * 4 + 1] = 26; d[i * 4 + 2] = 30; d[i * 4 + 3] = 255; } }
        x.putImageData(D, 0, 0); leadC = cv(W, H); const lg = leadC.getContext('2d'); lg.filter = 'blur(.6px)'; lg.drawImage(t, ox(), 0); lg.filter = 'none';
        // 납선 윗면에 은은한 금속 빛
        lg.globalCompositeOperation = 'source-atop'; const mg = lg.createLinearGradient(0, p.cy - p.r, 0, p.cy + p.r); mg.addColorStop(0, 'rgba(120,115,110,.9)'); mg.addColorStop(.5, 'rgba(45,42,46,.9)'); mg.addColorStop(1, 'rgba(25,22,26,.9)'); lg.fillStyle = mg; lg.fillRect(0, 0, W, H); lg.globalCompositeOperation = 'source-over';
        leadFor = pk; return leadC; }
      function litPaint(x, now) { const p = P(), f = .9 + .1 * Math.sin(now / 110) * Math.sin(now / 43), cx = ox() + p.cx, cy = p.cy, R = p.r;
        // 같은 그림을 밤처럼 어둡게 (고리·뚜껑도 그대로)
        x.fillStyle = '#0b1216'; x.fillRect(0, 0, W, H); x.filter = 'brightness(.26) saturate(.75)'; x.drawImage(p.img, ox(), 0, p.w, p.h); x.filter = 'none';
        // 구슬 둘레로 번지는 색 빛
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = .3 * f; x.filter = 'blur(28px)'; x.drawImage(C, 0, 0); x.restore();
        // 구슬: 칠한 모습 그대로, 안에서 불이 켜진 듯 환하게
        tmpG.clearRect(0, 0, W, H); tmpG.save(); tmpG.beginPath(); tmpG.arc(cx, cy, R + 1, 0, 7); tmpG.clip(); tmpG.drawImage(p.img, ox(), 0, p.w, p.h); tmpG.drawImage(glassLayer(), 0, 0);
        const warm = tmpG.createRadialGradient(cx, cy + R * .12, 4, cx, cy + R * .12, R * 1.05); warm.addColorStop(0, `rgba(255,214,150,${.75 * f})`); warm.addColorStop(.6, `rgba(255,190,120,${.25 * f})`); warm.addColorStop(1, 'rgba(40,20,10,.35)');
        tmpG.globalCompositeOperation = 'soft-light'; tmpG.fillStyle = warm; tmpG.fillRect(0, 0, W, H);
        tmpG.globalCompositeOperation = 'lighter'; tmpG.globalAlpha = .22 * f; tmpG.drawImage(C, 0, 0); tmpG.globalAlpha = 1;
        const core = tmpG.createRadialGradient(cx, cy + R * .12, 0, cx, cy + R * .12, R * .55); core.addColorStop(0, `rgba(255,236,190,${.22 * f})`); core.addColorStop(1, 'rgba(255,236,190,0)'); tmpG.fillStyle = core; tmpG.fillRect(0, 0, W, H);
        tmpG.globalCompositeOperation = 'source-over'; const ed = tmpG.createRadialGradient(cx, cy, R * .62, cx, cy, R + 1); ed.addColorStop(0, 'rgba(0,0,0,0)'); ed.addColorStop(1, 'rgba(5,8,12,.5)'); tmpG.fillStyle = ed; tmpG.fillRect(0, 0, W, H); tmpG.restore();
        x.filter = 'saturate(1.25) brightness(1.05)'; x.drawImage(tmpC, 0, 0); x.filter = 'none'; glassFinish(x, true); }
      function ui() { const T = tools(side);
        T.tabs([['pick', '① 무늬'], ['paint', '② 색유리'], ['light', '③ 불빛']], tab, k => { tab = k; lit = k === 'light'; ui(); });
        if (tab === 'pick') { const r = T.row('무늬'); Object.entries(PAT).forEach(([k, p]) => { const b2 = T.icon(r, p.img.src, p.n, () => { if (k !== pk) { pk = k; fills = {}; bg2.clearRect(0, 0, W, H); brushN = 0; hist = []; loadLab(); ready(); } ui(); }); if (k === pk) b2.classList.add('on'); });
          side.append(mk('p', 'thint', '마음에 드는 납선 무늬를 골라요. 다른 무늬를 고르면 칠한 색은 지워져요.')); }
        if (tab === 'paint') { const r = T.row('색유리'); GL.forEach(([c, n], i) => T.sw(r, c, i === col, n, () => { col = i; ui(); })); T.chip(r, '지우개', () => { col = -1; ui(); }, col < 0);
          T.seg(T.row('칠하기'), [['tap', '칸 통째로'], ['brush', '붓으로']], mode, k => { mode = k; ui(); });
          side.append(mk('p', 'thint', mode === 'tap' ? '칸을 누르면 그 칸에 색유리가 끼워져요.' : '붓으로 칸 안을 직접 칠해요. 한 칸에 여러 색을 섞어도 돼요.')); }
        if (tab === 'light') { T.chip(T.row('불빛'), lit ? '불 끄기' : '불 켜기', () => { lit = !lit; ui(); }, lit); side.append(mk('p', 'thint', '구슬 안에 작은 촛불을 켜면 색유리가 환하게 빛나요. 구슬을 눌러도 켜고 끌 수 있어요.')); }
        const a2 = T.acts(); T.sub(a2, '되돌리기', () => { const h = hist.pop(); if (!h) return; fills = JSON.parse(h[0]); bg2.clearRect(0, 0, W, H); bg2.drawImage(h[1], 0, 0); dirty = true; ready(); }); T.sub(a2, '모두 지우기', () => { snap(); fills = {}; bg2.clearRect(0, 0, W, H); brushN = 0; dirty = true; ready(); }); }
      const loop = now => { if (!alive) return; paint(g, false, now); requestAnimationFrame(loop); };
      const reset = () => { pk = 'flower'; tab = 'pick'; fills = {}; bg2.clearRect(0, 0, W, H); brushN = 0; hist = []; lit = false; lab = null; ui(); api.ready(false); api.guide('① 무늬를 고르고 ② 칸마다 색유리를 끼운 다음 ③ 불을 비춰 보세요.'); };
      reset(); requestAnimationFrame(loop);
      window.__sg = { pick: k => { pk = k; loadLab(); }, setTab: k => { tab = k; lit = k === 'light'; ui(); }, fillAll: () => { if (!lab) loadLab(); let n = 0; for (const v of lab) if (v > n) n = v; for (let k = 1; k <= n; k++) fills[k] = GL[k % GL.length][0]; dirty = true; ready(); } };
      return { reset, result() { if (!(Object.keys(fills).length >= 3 || brushN > 60)) return null; const p = P(), t = cv(W, H); paint(t.getContext('2d'), true, 0); const cx = ox() + p.cx, o = cv(160, Math.round(160 * (p.cy + p.r + 6) / (2 * p.r + 12))); o.getContext('2d').drawImage(t, cx - p.r - 6, 0, 2 * p.r + 12, p.cy + p.r + 6, 0, 0, o.width, o.height); return { img: o.toDataURL('image/png') }; },
        stop() { alive = false; pw && pw.classList.remove('wide'); } };
    },
  };

  // ── 꼬마전구: ① 상자에서 엉킨 전구 줄 풀기 → ② 트리에 마음대로 두르고 불 켜기
  plays.bulbs = {
    title: '꼬마전구', doneLabel: '트리에 감기', doneMsg: '엉킨 줄을 풀어 트리에 전구를 감았어요.',
    start(board, api) {
      board.className = 'pboard blb'; const pw = board.closest('.panel-wrap'); pw && pw.classList.add('xwide');
      const W = 640, H = 900, can = cv(W, H, 'blbcv'), g = can.getContext('2d'), side = mk('div', 'blbside'); board.append(can, side);
      const crate = pic('lt_crate.jpg'), TREES = [1, 2, 3, 4].map(i => pic('lt_tree' + i + '.jpg')), tree = TREES[Math.floor(Math.random() * 4)], GI = pic('blb_3.png');
      const PALS = { 알록달록: [[214, 58, 48], [240, 196, 70], [60, 150, 90], [70, 120, 210], [230, 120, 170]], 따뜻한노랑: [[255, 214, 120], [255, 190, 90], [255, 230, 160]], 빨강초록: [[210, 50, 45], [50, 140, 80]], 파랑하양: [[120, 170, 240], [235, 240, 255], [80, 120, 210]] };
      let stage = 'box', pal = '알록달록', alive = true, t0 = 0, untangled = false, strands = [], drawing = null, on = false, mode = 'steady', everOn = false;
      // 작은 전구 그림(유화 전구에 색을 입힘)
      const mini = {}; function miniB(c) { const key = c.join(); if (mini[key]) return mini[key]; if (!GI.complete) return null; const t = cv(GI.naturalWidth, GI.naturalHeight), x = t.getContext('2d'); x.drawImage(GI, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = `rgb(${c})`; x.fillRect(0, 0, t.width, t.height); x.globalCompositeOperation = 'screen'; x.globalAlpha = .28; x.drawImage(GI, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'destination-in'; x.drawImage(GI, 0, 0);
        const m = cv(26, 44), y = m.getContext('2d'); y.translate(13, 44); y.rotate(Math.PI); y.drawImage(t, -13, 0, 26, 44); y.setTransform(1, 0, 0, 1, 0, 0); y.fillStyle = '#1f3326'; y.fillRect(8, 0, 10, 7); return (mini[key] = m); }
      // ── ① 엉킨 줄: 겹친 곳마다 두 줄이 맞닿아 있고, 줄은 그 자리를 통해서만 미끄러짐(당길수록 조여짐)
      let N = 110, L = 11, BE = 3, R = [], C = [], grab = -1, ptr = null, level = 'normal', tension = 0, lastTug = 0, pops = [];
      const LV = { easy: [80, 4, 6], normal: [110, 8, 11], hard: [150, 13, 18] }, CX = 320, CY = 450;
      const PT = s => { const k = Math.max(0, Math.min(R.length - 2, Math.floor(s))), f = Math.max(0, Math.min(1, s - k)); return { k, f, x: R[k].x + (R[k + 1].x - R[k].x) * f, y: R[k].y + (R[k + 1].y - R[k].y) * f }; };
      function segX(p1, p2, p3, p4) { const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x); if (Math.abs(d) < 1e-6) return null; const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d, v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d; return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? { u, v } : null; }
      function allX() { const out = []; for (let i = 0; i < R.length - 1; i++) for (let j = i + 2; j < R.length - 1; j++) { const q = segX(R[i], R[i + 1], R[j], R[j + 1]); if (q) out.push({ a: i + q.u, b: j + q.v, top: 'b' }); } return out; }
      function tangle() { N = LV[level][0];
        for (let tries = 0; tries < 400; tries++) { const sc = level === 'easy' ? .85 : level === 'hard' ? 1.15 : 1, TX = [1, 2, 3, 5].map(k => [k * rnd(.8, 1.3), rnd(70, 100) / Math.sqrt(k), rnd(0, 6)]), TY = [1, 2, 3, 4].map(k => [k * rnd(.8, 1.3), rnd(60, 90) / Math.sqrt(k), rnd(0, 6)]);   // 여러 물결을 겹친 구불구불한 길 → 넓은 고리들이 이리저리 겹침
          const at2 = t => ({ x: CX + sc * TX.reduce((v, [f, r, ph]) => v + r * Math.cos(f * t + ph), 0), y: CY + sc * TY.reduce((v, [f, r, ph]) => v + r * Math.sin(f * t + ph), 0) });
          R = []; let t = rnd(0, 6), q = at2(t); R.push({ x: q.x, y: q.y, px: q.x, py: q.y });
          while (R.length < N) { let t2 = t, q2 = q; while (Math.hypot(q2.x - q.x, q2.y - q.y) < L) { t2 += .002; q2 = at2(t2); } t = t2; q = q2; R.push({ x: q.x, y: q.y, px: q.x, py: q.y }); }
          C = allX(); if (C.length >= LV[level][1] && C.length <= LV[level][2]) break; }
        untangled = false; pops = []; }
      function nudge(s, dx, dy, w) { const { k, f } = PT(s), n = (1 - f) * (1 - f) + f * f || 1; R[k].x += dx * (1 - f) / n * w; R[k].y += dy * (1 - f) / n * w; R[k + 1].x += dx * f / n * w; R[k + 1].y += dy * f / n * w; }
      function step(dt) {
        const prev = R.map(p => [p.x, p.y]);
        for (const p of R) { const vx = (p.x - p.px) * .6, vy = (p.y - p.py) * .6; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy; }
        for (let it = 0; it < 16; it++) {
          if (grab >= 0 && ptr) { const p = R[grab], dx = ptr.x - p.x, dy = ptr.y - p.y, d = Math.hypot(dx, dy), m = Math.min(d, 7) / (d || 1); p.x += dx * m * .5; p.y += dy * m * .5; }   // 손은 줄을 살살 끌어당김(확 못 당김)
          for (let i = 0; i < R.length - 1; i++) { const a2 = R[i], b2 = R[i + 1], dx = b2.x - a2.x, dy = b2.y - a2.y, d = Math.hypot(dx, dy) || 1, k = (d - L) / d * .5; a2.x += dx * k; a2.y += dy * k; b2.x -= dx * k; b2.y -= dy * k; }
          for (const c of C) if (c.sep) { const A = PT(c.a), B = PT(c.b), dx = (B.x - A.x) * .5, dy = (B.y - A.y) * .5; nudge(c.a, dx, dy, .8); nudge(c.b, -dx, -dy, .8); }   // 맞닿은 자리가 벌어지려 하면 다시 붙임(떨어지지 않음)
          for (const p of R) { p.x = Math.max(16, Math.min(W - 16, p.x)); p.y = Math.max(30, Math.min(H - 16, p.y)); } }
        R.forEach((p, i) => { const dx = p.x - prev[i][0], dy = p.y - prev[i][1], d = Math.hypot(dx, dy), far = grab < 0 ? 99 : Math.abs(i - grab), cap = far < 4 ? 99 : Math.max(.6, 6 - far * .25); if (d > cap) { p.x = prev[i][0] + dx / d * cap; p.y = prev[i][1] + dy / d * cap; } });   // 바닥에 놓인 줄: 손에서 먼 곳은 잘 안 끌려옴(마찰)
        let tmax = 0;   // 줄이 맞닿은 자리를 통해 미끄러짐: 팽팽할수록 조금만(마찰)
        const str = s => { const k = Math.max(0, Math.min(R.length - 2, Math.floor(s))); return Math.max(0, Math.hypot(R[k + 1].x - R[k].x, R[k + 1].y - R[k].y) / L - 1); };
        const X = allX(), pairs = [];
        C.forEach((c, ci) => X.forEach((x, xi) => { const d = Math.abs(x.a - c.a) + Math.abs(x.b - c.b); if (d < 8) pairs.push([d, ci, xi]); }));
        pairs.sort((p, q) => p[0] - q[0]); const cm = new Map(), xm = new Set();
        for (const [d, ci, xi] of pairs) if (!cm.has(ci) && !xm.has(xi)) { cm.set(ci, xi); xm.add(xi); }
        const gone = new Set();
        C.forEach((c, ci) => { const tn = str(c.a) + str(c.b); tmax = Math.max(tmax, tn); c.t = tn;
          if (cm.has(ci)) { const x = X[cm.get(ci)], lim = Math.max(.03, .5 - tn * 4); c.a += Math.max(-lim, Math.min(lim, x.a - c.a)); c.b += Math.max(-lim, Math.min(lim, x.b - c.b)); c.sep = Math.abs(x.a - c.a) + Math.abs(x.b - c.b) > .3; c.miss = 0; }   // 팽팽하면 조금씩만 미끄러짐 = 꽉 조임
          else { c.sep = true; c.miss = (c.miss || 0) + 1; }
          // 풀리는 순간: ① 줄 끝이 빠져나감 ② 작은 꼬임이 펴짐
          const threaded = C.some(d => d !== c && ((d.a > c.a && d.a < c.b) || (d.b > c.a && d.b < c.b)));   // 고리 안으로 다른 줄이 지나가면 조여도 안 풀림(매듭)
          if (c.a < .5 || c.b > R.length - 1.5 || (c.b - c.a < 2.4 && !threaded) || (c.miss > 2 && (c.a < 3 || c.b > R.length - 4))) gone.add(ci);
          if (c.miss > 40) gone.add(ci); });
        // ② 고리째 빠짐: 같은 두 줄 사이의 두 자리가 만나면 함께 풀림
        C.forEach((c, i) => C.forEach((d, j) => { if (j > i && c.sep && d.sep && Math.abs(c.a - d.a) < 3 && Math.abs(c.b - d.b) < 3 && c.top === d.top) { gone.add(i); gone.add(j); } }));
        tension = tension * .8 + tmax * .2;
        if (grab >= 0 && tension > .08 && performance.now() - lastTug > 300) { lastTug = performance.now(); tone(150 + Math.random() * 30, .05, .05, 'triangle'); }
        if (gone.size) { [...gone].forEach(i => { const p = PT(C[i].a); pops.push({ x: p.x, y: p.y, t: 0 }); }); C = C.filter((c, i) => !gone.has(i)); tone(880, .12, .06, 'sine'); setTimeout(() => tone(1175, .1, .05, 'sine'), 70); ui(); }
        X.forEach((x, xi) => { if (xm.has(xi) || x.b - x.a < 3 || C.some(c => Math.min(Math.abs(c.a - x.a), Math.abs(c.b - x.b), Math.abs(c.a - x.b), Math.abs(c.b - x.a)) < 2.5)) return; const ka = Math.floor(x.a), kb = Math.floor(x.b), ang = Math.abs(Math.sin(Math.atan2(R[ka + 1].y - R[ka].y, R[ka + 1].x - R[ka].x) - Math.atan2(R[kb + 1].y - R[kb].y, R[kb + 1].x - R[kb].x))); if (ang < .4) return; const ga = grab >= 0 && Math.abs(grab - x.a) < Math.abs(grab - x.b); C.push({ a: x.a, b: x.b, top: ga ? 'a' : 'b' }); });   // 새로 겹친 곳: 끌고 가는 줄이 위로
        if (!untangled && C.length === 0 && grab < 0) { untangled = true; [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => tone(f, .25, .08, 'sine'), k * 110)); api.guide('다 풀었어요! 이제 트리에 둘러 볼까요?'); ui(); setTimeout(() => { if (alive && stage === 'untangle') { stage = 'tree'; ui(); } }, 1500); } }
      function drawRope(sc, ox, oy) { const P2 = PALS[pal]; g.save(); g.translate(ox, oy); g.scale(sc, sc); g.lineCap = g.lineJoin = 'round';
        const seg = (p, q) => { g.strokeStyle = 'rgba(10,20,14,.5)'; g.lineWidth = 9; g.beginPath(); g.moveTo(p.x, p.y + 2); g.lineTo(q.x, q.y + 2); g.stroke(); g.strokeStyle = '#22362a'; g.lineWidth = 6; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(q.x, q.y); g.stroke(); g.strokeStyle = 'rgba(140,180,140,.5)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(p.x - 1, p.y - 1.2); g.lineTo(q.x - 1, q.y - 1.2); g.stroke(); };
        for (let i = 0; i < R.length - 1; i++) seg(R[i], R[i + 1]);
        for (let i = 1; i < R.length - 1; i += BE) { const p = R[i - 1], q = R[i]; drawBulb({ x: q.x, y: q.y, a: 0, j: Math.atan2(q.y - p.y, q.x - p.x) + ((i / BE | 0) % 2 ? 0 : Math.PI) }, P2[(i / BE | 0) % P2.length], untangled, 1); }
        for (const c of C) { const s = c.top === 'a' ? c.a : c.b, k = Math.max(1, Math.min(R.length - 3, Math.floor(s)));   // 맞닿은 자리: 위에 놓인 줄을 다시 그려 위·아래가 보이게
          g.strokeStyle = 'rgba(10,20,14,.65)'; g.lineWidth = 11; g.beginPath(); g.moveTo(R[k - 1].x, R[k - 1].y); g.lineTo(R[k].x, R[k].y); g.lineTo(R[k + 1].x, R[k + 1].y); g.lineTo(R[k + 2].x, R[k + 2].y); g.stroke();
          g.strokeStyle = '#2a4232'; g.lineWidth = 6; g.stroke(); g.strokeStyle = 'rgba(160,200,160,.55)'; g.lineWidth = 1.4; g.stroke(); }
        for (const [e, e2, label] of [[R[0], R[1], '플러그'], [R[R.length - 1], R[R.length - 2], '끝']]) { const a2 = Math.atan2(e.y - e2.y, e.x - e2.x), pulse = .5 + .5 * Math.sin(performance.now() / 300);   // 양 끝을 크게, 반짝이는 고리로
          g.strokeStyle = `rgba(255,220,120,${.35 + .4 * pulse})`; g.lineWidth = 3; g.beginPath(); g.arc(e.x, e.y, 20 + pulse * 4, 0, 7); g.stroke();
          g.save(); g.translate(e.x, e.y); g.rotate(a2); g.fillStyle = '#2b3a2e'; g.fillRect(-4, -8, 18, 16); if (label === '플러그') { g.fillStyle = '#d8c48a'; g.fillRect(14, -6, 9, 3); g.fillRect(14, 3, 9, 3); } else { g.fillStyle = '#3d5546'; g.beginPath(); g.arc(14, 0, 8, 0, 7); g.fill(); } g.restore();
          g.fillStyle = 'rgba(255,250,235,.95)'; g.font = '15px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText(label, e.x, e.y - 28); }
        g.restore(); }
      // ── ② 트리에 두르기(그은 선을 따라 축 처지게 걸림)
      function place(st) { const P = st.pts, rs = [P[0]]; for (let i = 1; i < P.length; i++) { const a2 = rs[rs.length - 1], d = Math.hypot(P[i].x - a2.x, P[i].y - a2.y); for (let u = 4; u <= d; u += 4) rs.push({ x: a2.x + (P[i].x - a2.x) * u / d, y: a2.y + (P[i].y - a2.y) * u / d }); }
        const sm = rs.map((p, i) => { let x = 0, y = 0, n = 0; for (let j = Math.max(0, i - 6); j <= Math.min(rs.length - 1, i + 6); j++) { x += rs[j].x; y += rs[j].y; n++; } return { x: x / n, y: y / n }; });
        st.wire = sm.map((p, i) => ({ x: p.x, y: p.y + Math.sin(Math.PI * ((i % 18) / 18)) * 8 })); st.bulbs = []; for (let i = 3; i < st.wire.length - 1; i += 7) { const p = st.wire[i], q = st.wire[i + 1]; st.bulbs.push({ x: p.x, y: p.y, a: Math.atan2(q.y - p.y, q.x - p.x), j: rnd(-.25, .25) }); } }
      can.addEventListener('pointerdown', e => { const p = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId); ptr = p;
        if (stage === 'box') { if (Math.hypot(p.x - 330, p.y - 360) < 200) { stage = 'untangle'; tone(520, .1, .05, 'sine'); ui(); } return; }
        if (stage === 'untangle') { let best = -1, bd = 24; R.forEach((q, i) => { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = i; } }); grab = best; if (best >= 0) tone(700, .04, .04, 'sine'); return; }
        drawing = { pts: [p], bulbs: [], pal }; strands.push(drawing); });
      can.addEventListener('pointermove', e => { const p = at(e, can); ptr = p; if (drawing) { const l = drawing.pts[drawing.pts.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) > 6) { drawing.pts.push(p); place(drawing); } } });
      const up = () => { grab = -1; if (drawing) { if (drawing.bulbs.length < 3) strands.pop(); drawing = null; ui(); } ready(); }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function drawBulb(b2, c, lit, k) { const m = miniB(c), ang = (b2.a || 0) * .35 + (b2.j || 0), cx2 = b2.x - Math.sin(ang) * 10, cy2 = b2.y + Math.cos(ang) * 10;
        if (lit) { g.save(); g.globalCompositeOperation = 'screen'; const gr = g.createRadialGradient(cx2, cy2, 1, cx2, cy2, 26); gr.addColorStop(0, `rgba(${c},${.6 * k})`); gr.addColorStop(.4, `rgba(${c},${.2 * k})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(cx2 - 26, cy2 - 26, 52, 52); g.restore(); }
        if (m) { g.save(); g.translate(b2.x, b2.y); g.rotate(ang); g.globalAlpha = 1; if (!lit) g.filter = 'brightness(.75)'; g.drawImage(m, -6.5, -1, 13, 22); g.filter = 'none'; if (lit) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .35 * k; g.drawImage(m, -6.5, -1, 13, 22); } g.restore(); } }
      function frame(now) { if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (now - (t0 || now)) / 1000); t0 = now;
        if (stage === 'box') { if (crate.complete) g.drawImage(crate, -130, 0, 900, 900); drawRope(.42, 330 - CX * .42, 360 - CY * .42);
          const k = .5 + .5 * Math.sin(now / 350); g.strokeStyle = `rgba(255,230,150,${.3 + .4 * k})`; g.lineWidth = 3; g.setLineDash([8, 7]); g.beginPath(); g.arc(330, 360, 120, 0, 7); g.stroke(); g.setLineDash([]);
          g.fillStyle = 'rgba(60,45,35,.8)'; g.font = '21px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText('상자 속 엉킨 전구 줄을 눌러 보세요', W / 2, 90); return; }
        if (stage === 'untangle') { if (crate.complete) { g.save(); g.filter = 'blur(2px)'; g.drawImage(crate, 120, 260, 420, 420, -60, -60, W + 120, H + 120); g.restore(); g.fillStyle = 'rgba(255,248,236,.25)'; g.fillRect(0, 0, W, H); }
          step(dt); drawRope(1, 0, 0);
          if (grab >= 0 && ptr && tension > .05) { g.strokeStyle = `rgba(214,70,50,${Math.min(.8, tension * 6)})`; g.setLineDash([4, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(R[grab].x, R[grab].y); g.lineTo(ptr.x, ptr.y); g.stroke(); g.setLineDash([]); }
          if (!untangled) for (const c of C) { const p = PT(c.a), tight = Math.min(1, (c.t || 0) * 8); g.strokeStyle = `rgba(${200 + 40 * tight},${120 - 70 * tight},60,${.35 + .4 * tight})`; g.lineWidth = 2.5; g.beginPath(); g.arc(p.x, p.y, 14, 0, 7); g.stroke(); }
          pops = pops.filter(q => (q.t += dt) < .7); for (const q of pops) { g.strokeStyle = `rgba(255,230,140,${1 - q.t / .7})`; g.lineWidth = 3; g.beginPath(); g.arc(q.x, q.y, 14 + q.t * 50, 0, 7); g.stroke(); }
          g.fillStyle = 'rgba(255,250,240,.92)'; g.fillRect(16, 16, 230, 44); g.fillStyle = '#6b4a3a'; g.font = '17px "Gowun Batang",serif'; g.textAlign = 'left'; g.fillText(untangled ? '다 풀었어요 ✓' : `엉킨 곳 ${C.length}군데`, 30, 45); return; }
        if (tree.complete) g.drawImage(tree, 0, -30, W, 960);
        if (on) { g.fillStyle = 'rgba(12,16,34,.45)'; g.fillRect(0, 0, W, H); }
        let idx = 0; for (const st of strands) { const P2 = PALS[st.pal]; g.strokeStyle = 'rgba(20,32,24,.85)'; g.lineWidth = 1.6; g.beginPath(); (st.wire || st.pts).forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
          st.bulbs.forEach((b2, i) => { let k = 1; if (on) { if (mode === 'twinkle') k = .35 + .65 * (Math.sin(now / 180 + i * 2.7) * .5 + .5); if (mode === 'wave') k = .25 + .75 * (Math.sin(now / 200 - (idx + i) * .5) * .5 + .5); if (mode === 'alt') k = ((i + Math.floor(now / 500)) % 2) ? 1 : .2; } drawBulb(b2, P2[(idx + i) % P2.length], on, k); }); idx += st.bulbs.length; }
        if (!strands.length) { g.fillStyle = 'rgba(60,45,35,.75)'; g.font = '20px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText('트리 위에 쭉 그어서 전구 줄을 둘러요', W / 2, 60); } }
      const ready = () => api.ready(untangled && strands.length > 0 && everOn);
      function ui() { const T = tools(side);
        T.tabs([['untangle', '① 줄 풀기'], ['tree', '② 트리에 두르기']], stage === 'box' ? 'untangle' : stage, k => { if (k === 'tree' && !untangled) { api.guide('먼저 엉킨 줄을 다 풀어야 해요.'); return; } stage = k === 'untangle' && !untangled ? 'box' : k; ui(); });
        const r = T.row('전구 색'); Object.keys(PALS).forEach(k => { const b2 = T.chip(r, '', () => { pal = k; ui(); }, k === pal); b2.innerHTML = PALS[k].map(c => `<i class="blbdot" style="background:rgb(${c})"></i>`).join('') + ' ' + k.replace('노랑', ' 노랑').replace('초록', '·초록').replace('하양', '·하양'); });
        if (stage === 'box' || stage === 'untangle') { T.seg(T.row('난이도'), [['easy', '쉬움'], ['normal', '보통'], ['hard', '어려움']], level, k => { level = k; tangle(); ui(); }); T.chip(T.row('줄'), '다시 엉키기', () => { tangle(); ui(); });
          side.append(mk('p', 'thint', stage === 'box' ? '상자 속 엉킨 줄을 누르면 크게 보여요.' : '겹친 곳마다 줄이 서로 걸려 있어요. 세게 당기면 꽉 조여서 더 안 풀려요(빨간 점선). 고리를 느슨하게 벌리고, 반짝이는 플러그나 끝을 고리 사이로 살살 빼내면 한 군데씩 풀려요.')); }
        else { const r2 = T.row('스위치'); T.chip(r2, on ? '💡 끄기' : '💡 켜기', () => { on = !on; if (on && strands.length) { everOn = true; tone(660, .2, .07, 'sine'); } ready(); ui(); }, on);
          T.seg(T.row('불빛'), [['steady', '켜짐'], ['twinkle', '반짝'], ['wave', '물결'], ['alt', '번갈아']], mode, k => { mode = k; ui(); });
          const r3 = T.row('줄'); T.chip(r3, '마지막 줄 빼기', () => { strands.pop(); ui(); ready(); }); T.chip(r3, '모두 빼기', () => { strands = []; ui(); ready(); });
          side.append(mk('p', 'thint', '트리 위에 손가락(마우스)으로 그으면 그 길을 따라 전구가 걸려요. 빙글빙글 감아도 되고 여러 줄을 걸어도 돼요. 줄마다 색을 바꿀 수 있어요.')); } }
      const reset = () => { stage = 'box'; strands = []; on = false; everOn = false; tangle(); ui(); api.ready(false); api.guide('상자 속 전구 줄이 엉켜 있어요. 눌러서 꺼내 풀어 줘요.'); };
      reset(); requestAnimationFrame(frame);
      window.__blb = { open: () => { stage = 'untangle'; ui(); }, solve: () => { C = []; }, stage: k => { untangled = true; stage = k; ui(); }, line: pts => { const st = { pts, bulbs: [], pal }; place(st); strands.push(st); ui(); }, on: () => { on = true; everOn = true; ready(); ui(); }, crosses: () => C.length, ends: () => [R[0], R[R.length - 1]].map(p => ({ x: p.x, y: p.y })) };
      return { reset, result() { return untangled && strands.length && everOn ? { on: 1, colors: PALS[pal].map(c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join('')) } : null; }, stop() { alive = false; pw && pw.classList.remove('xwide'); } };
    },
  };

  // ── 오르골: ① 꾸미기(인형·장식) ② 악보 종이띠에 구멍 뚫기 ③ 손잡이를 돌려 연주 / 태엽 감아 두기
  plays.musicbox = {
    title: '오르골', doneLabel: '탁자에 올리기', doneMsg: '내가 꾸민 오르골을 트리 곁에 뒀어요.',
    start(board, api) {
      board.className = 'pboard mb2'; const pw = board.closest('.panel-wrap'); pw && pw.classList.add('xwide');
      const left = mk('div', 'mbl'), side = mk('div', 'mbside'), can = cv(800, 800, 'mbcv'), g = can.getContext('2d'), strip = cv(800, 268, 'mbstrip'), sg = strip.getContext('2d');
      left.append(can, strip); board.append(left, side);
      const img = pic('musicbox2.jpg'), mask = pic('mbox2_mask.png');
      const FIGS = [['mbf_ballerina.png', '발레리나', 168], ['mbf_tree.png', '트리', 118], ['mbf_carousel.png', '회전목마', 166], ['mbf_deer.png', '사슴', 168], ['mbf_snowman.png', '눈사람', 104]].map(([f, n, w]) => ({ im: pic(f), n, w: Math.round(w * 1.32) }));
      const STK = ['ho_1.png', 'ho_2.png', 'cd_s1.png', 'cd_s2.png', 'cd_s5.png', 'cd_s9.png', 'it_star.png', 'it_bell.png'].map(f => ({ f, im: pic(f) }));
      const NOTES = [523, 587, 659, 698, 784, 880, 988, 1047], NAMES = ['도', '레', '미', '파', '솔', '라', '시', '도'], COLS = 32, VIEW = 16;
      const SONGS = { '징글벨': [2, 2, 2, -1, 2, 2, 2, -1, 2, 4, 0, 1, 2, -1, -1, -1, 3, 3, 3, 3, 3, 2, 2, 2, 2, 1, 1, 2, 1, -1, 4, -1], '반짝반짝 작은 별': [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0, -1, 4, 4, 3, 3, 2, 2, 1, -1, 4, 4, 3, 3, 2, 2, 1, -1], '고요한 밤': [4, -1, 5, 4, 2, -1, -1, -1, 4, -1, 5, 4, 2, -1, -1, -1, 7, -1, 7, -1, 6, -1, -1, -1, 7, -1, 7, -1, 4, -1, -1, -1] };
      let tab = 'deco', fig = 0, stk = [], sel = -1, drag = null, holes = new Set(), off = 0, playMode = 'crank', wind = 0, crankA = null, winding = false, spin = 0, spd = 0, played = 0, notes = [], lights = [], alive = true, t0 = 0, lastCol = 0, punchMode = null;
      const setSong = arr => { holes = new Set(); arr.forEach((n, c) => n >= 0 && holes.add(c * 8 + n)); };
      setSong(SONGS['징글벨']);
      const KX = 656, KY = 598, BASE = { x: 407, y: 470 };
      // ── 상자 화면
      const stSize = it => { const im = STK[it.i].im, w = 64 * it.s; return [w, w * (im.naturalHeight || 1) / (im.naturalWidth || 1)]; };
      const stHit = p => { for (let k = stk.length - 1; k >= 0; k--) { const it = stk[k], [w, h] = stSize(it); if (Math.abs(p.x - it.x) < w / 2 && Math.abs(p.y - it.y) < h / 2) return k; } return -1; };
      can.addEventListener('pointerdown', e => { const p = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId);
        if (tab === 'deco') { const k = stHit(p); if (k >= 0) { sel = k; drag = { ox: p.x - stk[k].x, oy: p.y - stk[k].y }; } else sel = -1; ui(); return; }
        if (tab === 'play') { const d = Math.hypot(p.x - KX, p.y - KY); if (d < 150) { crankA = Math.atan2(p.y - KY, p.x - KX); winding = true; } } });
      can.addEventListener('pointermove', e => { const p = at(e, can);
        if (drag && stk[sel]) { stk[sel].x = p.x - drag.ox; stk[sel].y = p.y - drag.oy; return; }
        if (crankA !== null) { const a = Math.atan2(p.y - KY, p.x - KX); let da = a - crankA; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI; crankA = a;
          if (playMode === 'crank') { const dc = da / (2 * Math.PI) * 3.2; advance(dc); spd = Math.max(spd, Math.abs(dc) * 60); }   // 한 바퀴에 3칸 남짓
          else if (da > 0) wind = Math.min(1, wind + da / (2 * Math.PI) / 5); } });
      const up = () => { drag = null; crankA = null; winding = false; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      // 종이띠가 움직이면 빗살(빨간 선)을 지나는 구멍이 소리를 냄
      function advance(dc) { const prev = off; off += dc; if (dc <= 0) return; for (let c = Math.floor(prev) + 1; c <= Math.floor(off); c++) { const col = ((c % COLS) + COLS) % COLS; let any = false;
          for (let r = 0; r < 8; r++) if (holes.has(col * 8 + r)) { any = true; tone(NOTES[r] * 2, 1.1, .035, 'sine', NOTES[r] * 4); }
          if (any) { played++; notes.push({ x: 420 + rnd(-90, 90), y: 300, t: 0 }); if (played >= 8) api.ready(true); } lastCol = col; } }
      // ── 종이띠(악보)
      const CX0 = 70, CW = (800 - CX0 - 14) / VIEW, RH = 26, CY0 = 20, COMB = CX0 + CW * 2;
      const cellAt = e => { const p = at(e, strip), vc = Math.floor((p.x - CX0) / CW + (off % 1)), r = 7 - Math.floor((p.y - CY0) / RH); if (vc < 0 || vc >= VIEW + 1 || r < 0 || r > 7) return -1; const c = (((Math.floor(off) - 2 + vc) % COLS) + COLS) % COLS; return c * 8 + r; };
      strip.addEventListener('pointerdown', e => { if (tab !== 'song') return; const k = cellAt(e); if (k < 0) return; e.preventDefault(); strip.setPointerCapture(e.pointerId); punchMode = !holes.has(k); punch(k); });
      strip.addEventListener('pointermove', e => { if (punchMode === null) return; const k = cellAt(e); if (k >= 0) punch(k); });
      strip.addEventListener('pointerup', () => { punchMode = null; }); strip.addEventListener('pointercancel', () => { punchMode = null; });
      strip.addEventListener('wheel', e => { e.preventDefault(); off = Math.max(0, off + Math.sign(e.deltaY || e.deltaX) * .5); }, { passive: false });
      function punch(k) { if (punchMode && !holes.has(k)) { holes.add(k); tone(NOTES[k % 8] * 2, .5, .03, 'sine', NOTES[k % 8] * 4); tone(90, .03, .02, 'square'); } else if (!punchMode && holes.has(k)) holes.delete(k); }
      function drawStrip() { sg.fillStyle = '#3b2c22'; sg.fillRect(0, 0, 800, 268);
        sg.fillStyle = '#f1e6cf'; sg.fillRect(CX0 - 6, CY0 - 10, 800 - CX0, 8 * RH + 20);
        sg.font = '700 19px Gowun Batang,serif'; sg.textAlign = 'center'; sg.textBaseline = 'middle';
        for (let r = 0; r < 8; r++) { const y = CY0 + (7 - r) * RH + RH / 2; sg.fillStyle = 'rgba(245,230,200,.85)'; sg.fillText(NAMES[r], 34, y); sg.strokeStyle = 'rgba(120,90,55,.2)'; sg.lineWidth = 1; sg.beginPath(); sg.moveTo(CX0, y); sg.lineTo(790, y); sg.stroke(); }
        const fr = off % 1, base = Math.floor(off) - 2;
        for (let vc = 0; vc <= VIEW + 1; vc++) { const c = (((base + vc) % COLS) + COLS) % COLS, x = CX0 + (vc - fr) * CW; if (x < CX0 - CW || x > 800) continue;
          sg.strokeStyle = c % 4 ? 'rgba(120,90,55,.12)' : 'rgba(120,90,55,.38)'; sg.beginPath(); sg.moveTo(x, CY0); sg.lineTo(x, CY0 + 8 * RH); sg.stroke();
          if (c === 0) { sg.fillStyle = 'rgba(120,90,55,.6)'; sg.font = '12px sans-serif'; sg.fillText('처음', x + CW / 2, CY0 + 8 * RH + 6); sg.font = '700 19px Gowun Batang,serif'; }
          for (let r = 0; r < 8; r++) if (holes.has(c * 8 + r)) { const hx = x + CW / 2, hy = CY0 + (7 - r) * RH + RH / 2, hot = Math.abs(hx - COMB) < CW * .5;
            sg.fillStyle = hot ? '#c0392b' : '#3a2a20'; sg.beginPath(); const hr = Math.min(CW, RH) * .34; sg.arc(hx, hy, hr, 0, 7); sg.fill(); sg.strokeStyle = 'rgba(255,255,255,.18)'; sg.lineWidth = 1; sg.beginPath(); sg.arc(hx, hy + .6, hr, .2, 2.9); sg.stroke(); } }
        sg.fillStyle = '#3b2c22'; sg.fillRect(CX0 - 8, 0, 8, 268);
        sg.strokeStyle = 'rgba(192,57,43,.9)'; sg.lineWidth = 3; sg.beginPath(); sg.moveTo(COMB, CY0 - 12); sg.lineTo(COMB, CY0 + 8 * RH + 12); sg.stroke();
        sg.fillStyle = 'rgba(245,230,200,.8)'; sg.font = '13px Gowun Batang,serif'; sg.textAlign = 'left'; sg.fillText(tab === 'song' ? '칸을 눌러 구멍 뚫기 · 휠로 밀기' : '빨간 선을 지나는 구멍이 소리를 내요', CX0, 256); }
      // ── 그리기
      // 인형: 겉모습을 원통처럼 감아 돌림(납작하게 찌그러지지 않음)
      const spinCache = new Map();
      function prepSpin(im) { let P = spinCache.get(im); if (P) return P; const tw = im.naturalWidth, th = im.naturalHeight, c = cv(tw, th), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0); const src = x.getImageData(0, 0, tw, th);
        const rows = []; for (let y = 0; y < th; y++) { let l = -1, r = -1; for (let xx = 0; xx < tw; xx++) if (src.data[(y * tw + xx) * 4 + 3] > 40) { if (l < 0) l = xx; r = xx; } rows.push(l < 0 ? null : { l, r }); }
        let sx = 0, n = 0; rows.forEach(rw => { if (rw) { sx += rw.l + rw.r; n += 2; } }); const C = sx / n; rows.forEach(rw => { if (rw) rw.c = C; });
        P = { tw, th, src, rows, c, out: x.createImageData(tw, th), last: null }; spinCache.set(im, P); return P; }
      function spunImage(im, theta) { const P = prepSpin(im); if (P.last !== null && Math.abs(P.last - theta) < .01) return P.c; P.last = theta; const d = P.src.data, o = P.out.data; o.set(d);
        for (let y = 0; y < P.th; y++) { const rw = P.rows[y]; if (!rw) continue; const er = Math.max(1, rw.r - rw.c), el = Math.max(1, rw.c - rw.l);
          for (let xx = rw.l; xx <= rw.r; xx++) { const i = (y * P.tw + xx) * 4; if (d[i + 3] < 10) continue; let ph = Math.asin(Math.max(-1, Math.min(1, xx >= rw.c ? (xx - rw.c) / er : (xx - rw.c) / el))) + theta; ph = ((ph + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
            if (ph > Math.PI / 2) ph = Math.PI - ph; else if (ph < -Math.PI / 2) ph = -Math.PI - ph; const sn = Math.sin(ph), sx2 = Math.round(rw.c + sn * (sn >= 0 ? er : el)), j = (y * P.tw + Math.max(rw.l, Math.min(rw.r, sx2))) * 4;
            if (d[j + 3] < 40) continue; o[i] = d[j]; o[i + 1] = d[j + 1]; o[i + 2] = d[j + 2]; } }
        P.c.getContext('2d').putImageData(P.out, 0, 0); return P.c; }
      function drawFig(x2, out) { const F = FIGS[fig], im = F.im; if (!im.complete || !im.naturalWidth) return; const w = F.w, h = w * im.naturalHeight / im.naturalWidth, a = out ? 0 : spin % (Math.PI * 2), c = Math.cos(a), sx = Math.max(.06, Math.abs(c)) * (c < 0 ? -1 : 1);   // 회전판 위에서 빙글: 옆으로 줄었다가 뒤로 돌아감
        x2.save(); x2.translate(BASE.x, BASE.y); x2.fillStyle = 'rgba(60,35,20,.25)'; x2.beginPath(); x2.ellipse(0, -2, w * .42, 9, 0, 0, 7); x2.fill();
        x2.scale(sx, 1); if (c < 0) x2.filter = 'brightness(.82)'; x2.drawImage(im, -w / 2, -h, w, h); x2.filter = 'none';
        const shade = Math.sin(a); if (!out && Math.abs(shade) > .05) { x2.globalCompositeOperation = 'source-atop'; } x2.restore(); }
      function paint(x2, out) { if (img.complete) x2.drawImage(img, 0, 0, 800, 800); drawFig(x2, out);
        for (const it of stk) drawSticker(x2, it); }
      // 장식: 상자 면의 기울기를 따라 붙이고, 상자 그림의 붓결·명암이 비치게
      const FACES = [{ p: [[350, 493], [627, 447], [630, 617], [350, 670]], u: [277, -46], k: 1 }, { p: [[203, 443], [350, 493], [350, 670], [203, 583]], u: [147, 50], k: .62 }];
      const inPoly = (q, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > q.y) !== (yj > q.y) && q.x < (xj - xi) * (q.y - yi) / (yj - yi) + xi) c = !c; } return c; };
      const faceOf = it => FACES.find(f => inPoly(it, f.p)) || FACES[0];
      function drawSticker(x2, it) { const S2 = STK[it.i].im; if (!S2.complete) return; const [w, h] = stSize(it), f = faceOf(it), L = Math.hypot(f.u[0], f.u[1]), ux = f.u[0] / L * f.k, uy = f.u[1] / L * f.k;
        const t = cv(Math.ceil(w) + 4, Math.ceil(h) + 4), tg = t.getContext('2d'); tg.drawImage(S2, 2, 2, w, h);
        x2.save(); x2.beginPath(); f.p.forEach((q, i) => i ? x2.lineTo(q[0], q[1]) : x2.moveTo(q[0], q[1])); x2.closePath(); x2.clip();
        x2.transform(ux, uy, 0, 1, it.x, it.y); x2.rotate(it.r);
        x2.globalAlpha = .28; x2.filter = 'brightness(0) blur(2px)'; x2.drawImage(t, -w / 2 + 2, -h / 2 + 3); x2.filter = 'none'; x2.globalAlpha = .95; x2.drawImage(t, -w / 2, -h / 2);
        x2.restore();
        // 상자 결 입히기(장식 모양 안에서만)
        if (img.complete) { const o = cv(800, 800), og = o.getContext('2d'); og.save(); og.beginPath(); f.p.forEach((q, i) => i ? og.lineTo(q[0], q[1]) : og.moveTo(q[0], q[1])); og.closePath(); og.clip(); og.transform(ux, uy, 0, 1, it.x, it.y); og.rotate(it.r); og.drawImage(t, -w / 2, -h / 2); og.restore();
          og.globalCompositeOperation = 'source-in'; og.drawImage(img, 0, 0, 800, 800); x2.save(); x2.globalCompositeOperation = 'soft-light'; x2.globalAlpha = .7; x2.drawImage(o, 0, 0); x2.restore(); } }
      function frame(now) { if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (now - (t0 || now)) / 1000); t0 = now;
        if (tab === 'play' && playMode === 'wind' && !winding && wind > 0) { advance(dt * 2.8); wind = Math.max(0, wind - dt / 14); spd = 2.8; }
        spin += dt * spd * 1.2; spd *= Math.pow(.2, dt);
        if (spd > .4 && Math.random() < dt * 10) lights.push({ x: BASE.x + rnd(-70, 70), y: BASE.y - rnd(20, 200), t: 0, c: ['255,226,140', '255,170,150', '200,230,255'][Math.floor(Math.random() * 3)] });
        paint(g, false);
        lights = lights.filter(q => (q.t += dt) < 1.2); for (const q of lights) { const a2 = Math.sin(q.t / 1.2 * Math.PI), gr = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, 10); gr.addColorStop(0, `rgba(${q.c},${a2})`); gr.addColorStop(1, `rgba(${q.c},0)`); g.fillStyle = gr; g.fillRect(q.x - 11, q.y - 11, 22, 22); }
        if (tab === 'deco' && stk[sel]) { const it = stk[sel], [w, h] = stSize(it), f = faceOf(it), L = Math.hypot(f.u[0], f.u[1]); g.save(); g.transform(f.u[0] / L * f.k, f.u[1] / L * f.k, 0, 1, it.x, it.y); g.rotate(it.r); g.setLineDash([6, 5]); g.strokeStyle = 'rgba(192,57,43,.8)'; g.lineWidth = 2; g.strokeRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8); g.restore(); g.setLineDash([]); }
        if (tab === 'play') { g.save(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.setLineDash([10, 9]); g.beginPath(); g.arc(KX, KY, 95, 0, 7); g.stroke(); g.setLineDash([]);
          if (playMode === 'wind') { g.strokeStyle = '#c0392b'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.arc(KX, KY, 95, -Math.PI / 2, -Math.PI / 2 + wind * Math.PI * 2); g.stroke(); }
          else { const a2 = spin * 1.3; g.fillStyle = '#c0392b'; g.beginPath(); g.arc(KX + Math.cos(a2) * 95, KY + Math.sin(a2) * 95, 9, 0, 7); g.fill(); } g.restore(); }
        notes = notes.filter(n => (n.t += dt) < 2); g.font = '34px serif'; for (const n of notes) { g.fillStyle = `rgba(255,250,235,${1 - n.t / 2})`; g.fillText(n.t * 7 % 2 < 1 ? '♪' : '♫', n.x + Math.sin(n.t * 4) * 14, n.y - n.t * 110); }
        drawStrip(); }
      function ui() { const T = tools(side);
        T.tabs([['deco', '① 인형 고르기'], ['song', '② 악보'], ['play', '③ 연주']], tab, k => { tab = k; sel = -1; ui(); });
        if (tab === 'deco') { const r = T.row('인형'); FIGS.forEach((F, i) => { const b2 = T.icon(r, F.im.src, F.n, () => { fig = i; ui(); }); if (i === fig) b2.classList.add('on'); });
          side.append(mk('p', 'thint', '상자 안에서 돌아갈 인형을 골라요. 고른 뒤 ② 악보에서 노래를 만들어요.')); }
        if (tab === 'song') { const r = T.row('악보'); Object.keys(SONGS).forEach(k => T.chip(r, k, () => { setSong(SONGS[k]); off = 0; ui(); })); T.chip(r, '빈 종이', () => { holes = new Set(); off = 0; ui(); });
          const r2 = T.row('종이띠'); T.chip(r2, '◀ 앞으로', () => { off = Math.max(0, off - 4); }); T.chip(r2, '뒤로 ▶', () => { off += 4; });
          side.append(mk('p', 'thint', '아래 종이띠 칸을 눌러 구멍을 뚫어요. 다시 누르면 막혀요. 종이띠는 32칸이라 밀어 가며 끝까지 뚫을 수 있어요.')); }
        if (tab === 'play') { T.seg(T.row('방법'), [['crank', '손잡이 돌리기'], ['wind', '태엽 감아 두기']], playMode, k => { playMode = k; ui(); });
          side.append(mk('p', 'thint', playMode === 'crank' ? '오른쪽 손잡이 둘레를 누른 채 빙글빙글 돌려요. 돌리는 만큼 종이띠가 지나가며 노래가 나와요. 빨리 돌리면 빨라지고, 멈추면 멈춰요.' : '손잡이 둘레를 시계 방향으로 돌려 태엽을 감고 손을 떼면, 태엽이 풀릴 때까지 혼자 노래해요.')); }
        api.guide(tab === 'deco' ? '오르골 안에서 돌아갈 인형을 골라요. 그다음 ② 악보 → ③ 연주로 가요.' : tab === 'song' ? '종이띠에 구멍을 뚫어 노래를 만들어요.' : played ? `노래가 흘러나와요. (${played}음)` : '손잡이를 돌려 연주해 보세요.'); }
      const reset = () => { tab = 'deco'; fig = 0; stk = []; sel = -1; off = 0; wind = 0; played = 0; spd = 0; setSong(SONGS['징글벨']); ui(); api.ready(false); };
      reset(); requestAnimationFrame(frame);
      window.__mb = { tab: k => { tab = k; ui(); }, crank: n => advance(n), stick: i => { stk.push({ i, x: 400 + i * 30, y: 570, r: 0, s: 1 }); }, fig: i => { fig = i; } };
      return { reset, result() { if (played < 8) return null; const t = cv(800, 800), tg = t.getContext('2d'); spin = 0; paint(tg, true);
          if (mask.complete) { tg.globalCompositeOperation = 'destination-in'; tg.drawImage(mask, 0, 0, 800, 800); tg.globalCompositeOperation = 'source-over'; drawFig(tg, true); }
          const o = cv(230, 258); o.getContext('2d').drawImage(t, 100, 30, 620, 696, 0, 0, 230, 258); return { img: o.toDataURL('image/png'), song: [...holes] }; },
        stop() { alive = false; pw && pw.classList.remove('xwide'); } };
    },
  };

  // ── 썰매 타기: 꾹 눌러 힘을 모았다 놓으면 언덕을 미끄러져 내려간다. 둔덕에서는 붕 뜬다.
  plays.sled = {
    title: '썰매 타기', doneLabel: '썰매 세워 두기', doneMsg: '썰매를 트리 곁에 세워 뒀어요.',
    start(board, api) {
      board.className = 'pboard sled2'; const pwW = board.closest('.panel-wrap'); pwW && pwW.classList.add('xwide');
      const W = 800, H = 450, can = cv(W, H, 'sdcv'), g = can.getContext('2d'), bar = mk('div', 'pbar'); board.append(can, bar);
      const treeIm = pic('tree2_cut.png'), giftIm = pic('it_gift.png'), sledIm = pic('sled_side.png'), hill = pic('hill.jpg'), manIm = pic('snowman.png');
      const SX = 170, LIVES = 3;
      const groundY = x => 350 + Math.sin(x / 260) * 10 + Math.sin(x / 97) * 4;       // 출렁이는 눈길
      let objs, y, vy, onGround, v, dist, got, lives, inv, puffs, sparks, state, alive = true, t0 = 0, next, best = 0, bestGift = 0, rides = 0, holdJump = 0;
      const go = mk('button', 'primary', '출발!'); go.type = 'button'; bar.append(go);
      go.addEventListener('click', () => { if (state !== 'ride') { reset(); state = 'ride'; go.disabled = true; } });
      const tip = mk('span', 'lab', '누르거나 스페이스바: 점프 (꾹 누르면 더 높이)'); bar.append(tip);
      function reset() { objs = []; y = groundY(SX); vy = 0; onGround = true; v = 300; dist = 0; got = 0; lives = LIVES; inv = 0; puffs = []; sparks = []; state = 'ready'; next = 500; go.disabled = false;
        api.guide('나무와 눈사람은 점프해서 넘고, 하늘에 뜬 선물은 점프해서 주워요. 하트 세 개가 다 없어지면 끝나요.'); }
      function jump() { if (state === 'ready') { go.click(); return; } if (state !== 'ride' || !onGround) return; vy = -560; onGround = false; holdJump = .22; tone(520, .08, .05, 'triangle'); }
      const jumpOff = () => { holdJump = 0; };
      can.addEventListener('pointerdown', e => { e.preventDefault(); jump(); }); can.addEventListener('pointerup', jumpOff); can.addEventListener('pointercancel', jumpOff);
      const kd = e => { if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); if (!e.repeat) jump(); } }, ku = e => { if (e.code === 'Space' || e.key === 'ArrowUp') jumpOff(); };
      addEventListener('keydown', kd); addEventListener('keyup', ku);
      function spawn() {
        const x = W + 80 + dist, r = Math.random();
        if (r < .55) objs.push({ k: 'tree', x, w: 64 + rnd(-8, 16) });
        else if (r < .75) objs.push({ k: 'man', x, w: 52 });
        if (Math.random() < .6) objs.push({ k: 'gift', x: x + rnd(-120, 160), h: rnd(90, 190), w: 46 });
        next = rnd(330, 560) - Math.min(140, dist / 60);
      }
      function frame(t) {
        if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.04, (t - (t0 || t)) / 1000); t0 = t;
        if (state === 'ride') {
          v = Math.min(720, 300 + dist / 22); dist += v * dt; inv = Math.max(0, inv - dt);
          if ((next -= v * dt) <= 0) spawn();
          if (holdJump > 0) { holdJump -= dt; vy -= 1500 * dt; }                       // 꾹 누르면 조금 더 높이
          vy += 1900 * dt; y += vy * dt; const gy = groundY(SX + dist);
          if (y >= gy) { if (!onGround && vy > 300) for (let i = 0; i < 8; i++) puffs.push({ x: SX + rnd(-40, 40), y: gy, vx: rnd(-90, 60), vy: rnd(-120, -30), t: 0 }); y = gy; vy = 0; onGround = true; }
          else onGround = false;
          for (const o of objs) { const sx = o.x - dist; if (o.done) continue;
            if (o.k === 'gift') { const gyO = groundY(o.x) - o.h; if (Math.abs(sx - SX) < 50 && Math.abs(gyO - (y - 30)) < 46) { o.done = 1; got++; tone(988, .25, .1, 'sine', 1976); for (let i = 0; i < 10; i++) sparks.push({ x: sx, y: gyO, vx: rnd(-120, 120), vy: rnd(-180, -40), t: 0 }); } }
            else if (Math.abs(sx - SX) < o.w * .38 + 30 && y > groundY(o.x) - (o.k === 'tree' ? o.w * 1.05 : o.w * 1.2) + 18 && inv <= 0) {
              o.done = 1; lives--; inv = 1.4; tone(110, .35, .14, 'triangle'); for (let i = 0; i < 16; i++) puffs.push({ x: SX + rnd(-30, 30), y: y - 20, vx: rnd(-160, 160), vy: rnd(-200, -40), t: 0 });
              if (lives <= 0) { state = 'over'; rides++; best = Math.max(best, dist); bestGift = Math.max(bestGift, got); go.disabled = false; go.textContent = '다시 타기'; api.ready(true);
                api.guide(`하트를 다 썼어요! ${Math.round(dist / 10)}m를 내려가서 선물 ${got}개를 주웠어요.${rides > 1 ? ` (최고 ${Math.round(best / 10)}m · 선물 ${bestGift}개)` : ''}`); }
              else api.guide(`쿵! 하트가 ${lives}개 남았어요.`); } }
          objs = objs.filter(o => o.x - dist > -150);
          if (onGround && Math.random() < dt * 40) puffs.push({ x: SX - 60 + rnd(-6, 6), y: y - 2, vx: rnd(-120, -40), vy: rnd(-60, -10), t: 0, small: 1 });
        }
        // 배경: 먼 언덕(천천히) → 눈길(빠르게)
        const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#9fb8d8'); sky.addColorStop(1, '#e8eef6'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
        if (hill.complete && hill.naturalWidth) { const hw = hill.naturalWidth * (300 / hill.naturalHeight), off = (dist * .25) % (hw * 2); g.globalAlpha = .9; for (let x = -off, k = 0; x < W; x += hw, k++) { g.save(); if (k % 2) { g.translate(x + hw, 0); g.scale(-1, 1); g.drawImage(hill, 0, 20, hw, 300); } else g.drawImage(hill, x, 20, hw, 300); g.restore(); } g.globalAlpha = 1; }   // 이음새가 안 보이게 번갈아 뒤집어 이어 붙임
        g.fillStyle = 'rgba(232,240,248,.55)'; g.fillRect(0, 0, W, H);
        g.fillStyle = '#f8fbff'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 8) g.lineTo(x, groundY(x + dist)); g.lineTo(W, H); g.closePath(); g.fill();
        g.strokeStyle = 'rgba(150,175,205,.6)'; g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= W; x += 8) { const yy = groundY(x + dist); x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
        g.strokeStyle = 'rgba(170,190,215,.35)'; g.lineWidth = 2; for (let k = 0; k < 6; k++) { const x = ((k * 180 - dist * .9) % 1080 + 1080) % 1080 - 140; g.beginPath(); g.moveTo(x, groundY(x + dist) + 30 + k * 6); g.lineTo(x + 90, groundY(x + 90 + dist) + 30 + k * 6); g.stroke(); }
        // 물건
        for (const o of objs) { if (o.done && o.k !== 'tree' && o.k !== 'man') continue; const sx = o.x - dist, gy = groundY(o.x);
          if (o.k === 'gift') { const bob = Math.sin(t / 300 + o.x) * 5, im = giftIm, h = o.w * im.naturalHeight / (im.naturalWidth || 1); g.save(); g.shadowColor = 'rgba(255,220,120,.9)'; g.shadowBlur = 14; if (im.complete) g.drawImage(im, sx - o.w / 2, gy - o.h - h / 2 + bob, o.w, h); g.restore(); continue; }
          const im = o.k === 'tree' ? treeIm : manIm, h = o.w * (im.naturalHeight || 1) / (im.naturalWidth || 1); g.globalAlpha = o.done ? .45 : 1; if (im.complete) g.drawImage(im, sx - o.w / 2, gy - h + 6, o.w, h); g.globalAlpha = 1; }
        // 썰매
        if (sledIm.complete && sledIm.naturalWidth) { const slope = Math.atan2(groundY(SX + dist + 20) - groundY(SX + dist - 20), 40), sw = 150, sh = sw * sledIm.naturalHeight / sledIm.naturalWidth;
          if (!(inv > 0 && Math.floor(t / 90) % 2)) { g.save(); g.translate(SX, y); g.rotate(onGround ? slope : Math.max(-.35, Math.min(.35, vy / 1600))); g.drawImage(sledIm, -sw / 2, -sh + 4, sw, sh); g.restore(); } }
        puffs = puffs.filter(p => (p.t += dt) < (p.small ? .45 : .8)); for (const p of puffs) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; g.fillStyle = `rgba(255,255,255,${(1 - p.t / (p.small ? .45 : .8)) * .95})`; g.beginPath(); g.arc(p.x, p.y, p.small ? 3 : 6, 0, 6.29); g.fill(); }
        sparks = sparks.filter(p => (p.t += dt) < .8); for (const p of sparks) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; g.fillStyle = `rgba(255,205,90,${1 - p.t / .8})`; g.font = '20px serif'; g.fillText('✦', p.x, p.y); }
        // 하트·선물·거리
        g.fillStyle = 'rgba(255,255,255,.88)'; g.beginPath(); g.roundRect(14, 14, 300, 52, 14); g.fill();
        g.font = '28px serif'; g.textAlign = 'left'; for (let i = 0; i < LIVES; i++) { g.fillStyle = i < lives ? '#d23a3a' : 'rgba(120,100,100,.3)'; g.fillText('♥', 26 + i * 32, 50); }
        g.fillStyle = '#4a3328'; g.font = '700 22px Gowun Batang,serif'; g.fillText(`🎁 ${got}   ${Math.round(dist / 10)}m`, 136, 48);
        if (state === 'ready') { g.fillStyle = 'rgba(60,40,25,.65)'; g.font = '700 30px Gowun Batang,serif'; g.textAlign = 'center'; g.fillText('눌러서 출발!', W / 2, 200); }
        if (state === 'over') { g.fillStyle = 'rgba(30,20,15,.35)'; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = '700 34px Gowun Batang,serif'; g.textAlign = 'center'; g.fillText(`${Math.round(dist / 10)}m · 선물 ${got}개`, W / 2, 200); g.font = '20px Gowun Batang,serif'; g.fillText('"다시 타기"로 또 할 수 있어요', W / 2, 240); }
      }
      reset(); api.ready(false); requestAnimationFrame(frame);
      return { reset() { reset(); go.textContent = '출발!'; }, result() { return rides ? { rides, best: Math.round(best / 10), gifts: bestGift } : null; }, stop() { alive = false; pwW && pwW.classList.remove('xwide'); removeEventListener('keydown', kd); removeEventListener('keyup', ku); } };
    },
  };
  /* ───────── 실링 왁스: 녹이고 → 붓고 → 도장 찍기 (한 가지 색 / 섞어서 / 칠해서) ───────── */
  plays.wax = {
    title: '실링 왁스', doneLabel: '봉인 간직하기', doneMsg: '내가 만든 봉인을 탁자에 올려 뒀어요.',
    start(board, api) {
      board.className = 'pboard wax'; const pw = board.closest('.panel-wrap'); pw && pw.classList.add('wide');
      const W = 800, H = 520, can = cv(W, H, 'waxcv'), g = can.getContext('2d'); board.append(can);
      const COLORS = [['빨강', '#9e1f2a'], ['초록', '#2d5a3d'], ['금색', '#c79a3e'], ['크림', '#efe3c8'], ['남색', '#2a3b68'], ['분홍', '#d68a99'], ['보라', '#76579b'], ['검정', '#2a2422']];
      const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
      // 아래 조작 줄
      const modeBar = mk('div', 'pbar waxmode'), colorBar = mk('div', 'pbar waxcolors'), stampBar = mk('div', 'pbar waxstamps'), toolBar = mk('div', 'pbar waxtools');
      board.prepend(modeBar); board.append(colorBar, stampBar, toolBar);
      const MODES = [['mono', '한 가지 색'], ['marble', '섞어서'], ['paint', '도장에 칠해서']];
      const modeBtns = MODES.map(([k, t]) => { const b = mk('button', '', t); b.type = 'button'; b.addEventListener('click', () => { mode = k; reset(); }); modeBar.append(b); return [k, b]; });
      let curColor = COLORS[0][1];
      const colorBtns = COLORS.map(([n, c]) => { const b = mk('button', 'wxc'); b.type = 'button'; b.title = n; b.setAttribute('aria-label', n + ' 왁스'); b.style.setProperty('--c', c); b.style.setProperty('--bi', `url(assets/wx_bead${COLORS.findIndex(q => q[1] === c)}.png)`); b.addEventListener('click', () => pickColor(c)); colorBar.append(b); return [c, b]; });
      // 도장: 문양 = 도장에 파인 모양(256×256 알파 마스크)
      const MS = 256;
      function maskFromImg(im, fromPhoto) {
        const c = cv(MS, MS), x = c.getContext('2d', { willReadFrequently: true }), k = Math.min(MS * .8 / im.naturalWidth, MS * .8 / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
        x.drawImage(im, (MS - w) / 2, (MS - h) / 2, w, h);
        const D = x.getImageData(0, 0, MS, MS), d = D.data;
        if (fromPhoto) {                                                              // 사진·그림: 가장자리 색을 바탕으로 보고, 다른 색인 곳을 문양으로
          const bx0 = Math.round((MS - w) / 2) + 2, by0 = Math.round((MS - h) / 2) + 2, bx1 = Math.round((MS + w) / 2) - 3, by1 = Math.round((MS + h) / 2) - 3;
          let br = 0, bg = 0, bb = 0, bn = 0; const addB = (px, py) => { const i = (py * MS + px) * 4; if (d[i + 3] > 128) { br += d[i]; bg += d[i + 1]; bb += d[i + 2]; bn++; } };
          for (let px = bx0; px <= bx1; px += 2) { addB(px, by0); addB(px, by1); } for (let py = by0; py <= by1; py += 2) { addB(bx0, py); addB(bx1, py); }
          br /= bn || 1; bg /= bn || 1; bb /= bn || 1; let on = 0, hasA = 0;
          for (let py = by0; py <= by1; py += 2) for (let px = bx0; px <= bx1; px += 2) if (d[(py * MS + px) * 4 + 3] < 128) hasA++;
          hasA *= 4;
          for (let i = 0; i < d.length; i += 4) { const ink = hasA > w * h * .05 ? d[i + 3] > 128 : d[i + 3] > 128 && Math.hypot(d[i] - br, d[i + 1] - bg, d[i + 2] - bb) > 70; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = ink ? 255 : 0; if (ink) on++; }
          if (on > w * h * .5) for (let i = 3; i < d.length; i += 4) d[i] = 255 - d[i];   // 문양이 너무 넓으면 반대로
        } else for (let i = 0; i < d.length; i += 4) { const a = d[i + 3]; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = a > 60 ? 255 : 0; }
        x.putImageData(D, 0, 0);
        // 도장 둥근 테두리 안쪽만
        x.globalCompositeOperation = 'destination-in'; x.beginPath(); x.arc(MS / 2, MS / 2, MS * .47, 0, 6.28); x.fill(); return c;
      }
      const stamps = [];                                                               // { mask, thumb }
      function addStamp(src, fromPhoto, keep) {
        const im = new Image(); im.onload = () => { const m = maskFromImg(im, fromPhoto); stamps.push({ mask: m, mine: !!fromPhoto }); if (keep) cur = stamps.length - 1; paintStamps(); }; im.src = src;
      }
      for (let i = 1; i <= 6; i++) addStamp('assets/stamp_' + i + '.png', false);
      const VS = window.__village && window.__village.state ? window.__village.state() : null;
      ((VS && VS.stamps) || []).forEach(s => typeof s === 'string' && s.startsWith('data:image/') && addStamp(s, true));
      const fileIn = mk('input'); fileIn.type = 'file'; fileIn.accept = 'image/*'; fileIn.hidden = true; board.append(fileIn);
      fileIn.addEventListener('change', () => { const f = fileIn.files[0]; fileIn.value = ''; if (!f || !/^image\//.test(f.type)) return;
        const rd = new FileReader(); rd.onload = () => {
          // 저장은 작게 줄여서
          const im = new Image(); im.onload = () => { const c = cv(320, 320), x = c.getContext('2d'), k = Math.min(1, 320 / Math.max(im.naturalWidth, im.naturalHeight)); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); x.drawImage(im, 0, 0, c.width, c.height);
            const url = c.toDataURL('image/png'); addStamp(url, true, true);
            if (VS) { VS.stamps = (VS.stamps || []).concat(url).slice(-4); window.__village.save(); }
            api.guide('내 문양으로 도장을 만들었어요. 이 도장으로 찍어 보세요.'); };
          im.src = rd.result; }; rd.readAsDataURL(f); });
      let cur = 0;
      function paintStamps() {
        stampBar.textContent = ''; const lab = mk('span', 'lab', '도장'); stampBar.append(lab);
        stamps.forEach((s, i) => { const b = mk('button', 'wxs' + (i === cur ? ' on' : '')); b.type = 'button'; b.setAttribute('aria-label', '도장 ' + (i + 1));
          const c = cv(64, 64); const x = c.getContext('2d'); const fi = !s.mine && FACEI[i]; if (fi && fi.complete) x.drawImage(fi, 0, 0, 64, 64); else { x.fillStyle = '#c9a45e'; x.beginPath(); x.arc(32, 32, 30, 0, 6.28); x.fill(); x.drawImage(tint(s.mask, '#6b4a22'), 0, 0, 64, 64); if (fi) fi.onload = () => paintStamps(); } b.append(c);
          b.addEventListener('click', () => { if (stage === 'face' && W2.dirty) { api.guide('칠한 도장을 바꾸려면 "처음부터"를 눌러요.'); return; } cur = i; paintStamps(); }); stampBar.append(b); });
        const add = mk('button', 'wxadd', '＋ 내 문양으로 도장 만들기'); add.type = 'button'; add.addEventListener('click', () => fileIn.click()); stampBar.append(add);
      }
      const tintCache = new Map();
      function tint(mask, col) { const k = col; let m = tintCache.get(mask); if (!m) { m = {}; tintCache.set(mask, m); } if (m[k]) return m[k]; const c = cv(MS, MS), x = c.getContext('2d'); x.drawImage(mask, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, MS, MS); m[k] = c; return c; }

      // 숟가락 속 왁스(작은 격자): 알갱이가 녹으면 색이 번지고, 숟가락을 빙빙 돌리면 소용돌이 무늬
      const N = 48, NR = 22, field = new Float32Array(N * N * 4), owner = new Int16Array(N * N);
      const fc = cv(N, N), fx = fc.getContext('2d'), fimg = fx.createImageData(N, N);
      let beads, heat, melted, swirlTot, pourAmt, pourAt, puddle, cool, pressing, pressT, imprint, stage, sp, held, lastV, lastPourT, mode = 'mono', pressAt, paintTool, alive = true, t0 = 0;
      // 칠하기 판(도장 면) — 256 크기
      const W2 = { c: cv(MS, MS), dirty: false }; W2.x = W2.c.getContext('2d');
      const ENV = { x: 24, y: 40, w: 520, h: 364 }, SEAL = { x: 297, y: 278 }, FLAME = { x: 668, y: 300 }, REST = { x: 590, y: 468 };
      const envIm = pic('wx_env.png'), candleIm = pic('wx_tea.png'), spoonIm = pic('wx_spoon.png'), stampIm = pic('wx_stamp.png'), beadIm = [0, 1, 2, 3, 4, 5, 6, 7].map(i => pic('wx_bead' + i + '.png')), FACEI = ['tree', 'star', 'deer', 'snow', 'heart', 'holly'].map(n => pic('wx_face_' + n + '.png'));
      function reset() {
        beads = []; heat = 0; melted = false; swirlTot = 0; pourAmt = 0; pourAt = null; puddle = null; cool = 0; pressing = false; pressT = 0; imprint = null; held = false; lastV = null; lastPourT = 0; pressAt = null;
        field.fill(0); owner.fill(-1); sp = { x: REST.x, y: REST.y }; W2.x.clearRect(0, 0, MS, MS); W2.dirty = false; paintTool = 'drip';
        modeBtns.forEach(([k, b]) => b.classList.toggle('on', k === mode));
        stage = mode === 'paint' ? 'face' : 'melt';
        if (mode === 'paint') curColor = COLORS[5][1];
        paintColors(); paintTools(); api.ready(false);
        api.guide(mode === 'paint' ? '도장 면이에요. 색을 골라 파인 홈에 왁스를 떨어뜨리고, 나이프로 쓱 긁어서 평평하게 해요. 색마다 반복해요.'
          : mode === 'marble' ? '왁스 알갱이를 두세 가지 색으로 숟가락에 넣어요. 숟가락을 촛불 위에 대고 녹인 뒤, 빙빙 돌려서 섞어요.'
          : '색을 하나 골라 알갱이를 숟가락에 넣어요. 숟가락을 끌어서 촛불 위에 대고 녹여요.');
      }
      function paintColors() { colorBtns.forEach(([c, b]) => b.classList.toggle('on', c === curColor)); }
      function paintTools() {
        toolBar.textContent = '';
        const btn = (t, fn, on) => { const b = mk('button', on ? 'on' : '', t); b.type = 'button'; b.addEventListener('click', fn); toolBar.append(b); return b; };
        if (stage === 'face') {
          btn('💧 왁스 떨어뜨리기', () => { paintTool = 'drip'; paintTools(); }, paintTool === 'drip');
          btn('🔪 나이프로 긁기', () => { paintTool = 'knife'; paintTools(); }, paintTool === 'knife');
          btn('다 칠했어요 → 바탕 왁스', () => { stage = 'melt'; curColor = COLORS[3][1]; paintColors(); paintTools(); api.guide('이제 바탕색이에요. 한 가지 색 알갱이를 숟가락에 넣고 촛불에 녹여서 봉투에 부어요.'); });
        } else if (beads.length && !pourAmt) btn('알갱이 비우기', () => { beads = []; field.fill(0); owner.fill(-1); melted = false; heat = 0; });
      }
      function pickColor(c) {
        curColor = c; paintColors();
        if (stage === 'face') { paintTool = 'drip'; paintTools(); return; }
        if (stage !== 'melt' || pourAmt > 0) return;
        const max = mode === 'marble' ? 5 : 3;
        if ((mode === 'mono' || mode === 'paint') && beads.length && beads[0].hex !== c) { beads = []; field.fill(0); owner.fill(-1); melted = false; }   // 한 가지 색은 색을 바꾸면 새로
        if (beads.length >= max) { api.guide('숟가락이 가득 찼어요.'); return; }
        const a = rnd(0, 6.28), r = beads.length ? rnd(4, NR - 9) : rnd(0, 5);
        beads.push({ hex: c, c: hex(c), x: N / 2 + Math.cos(a) * r, y: N / 2 + Math.sin(a) * r, m: 0, id: beads.length }); melted = false; paintTools();
      }
      // ── 녹이기·섞기
      function meltStep(dt) {
        let all = true;
        for (const b of beads) {
          if (heat > 0 && b.m < 1) b.m = Math.min(1, b.m + dt * .42);
          if (b.m < 1) all = false;
          const rr = b.m * (mode === 'marble' ? 11 : 14) + (b.m > 0 ? 2 : 0);
          if (b.m > 0) for (let y = Math.max(0, b.y - rr | 0); y <= Math.min(N - 1, b.y + rr); y++) for (let x = Math.max(0, b.x - rr | 0); x <= Math.min(N - 1, b.x + rr); x++) {
            const i = y * N + x; if (Math.hypot(x - N / 2, y - N / 2) > NR) continue;
            if (Math.hypot(x - b.x, y - b.y) < rr && (owner[i] < 0 || owner[i] === b.id)) { owner[i] = b.id; field[i * 4] = b.c[0]; field[i * 4 + 1] = b.c[1]; field[i * 4 + 2] = b.c[2]; field[i * 4 + 3] = 1; }
          }
        }
        if (all && beads.length && !melted) {                                           // 다 녹으면 빈 곳도 채움(가장 가까운 색)
          melted = true;
          for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (Math.hypot(x - N / 2, y - N / 2) > NR || field[i * 4 + 3]) continue;
            let best = null, bd = 1e9; for (const b of beads) { const d = Math.hypot(x - b.x, y - b.y); if (d < bd) { bd = d; best = b; } } field[i * 4] = best.c[0]; field[i * 4 + 1] = best.c[1]; field[i * 4 + 2] = best.c[2]; field[i * 4 + 3] = 1; }
          if (mode === 'marble') { const st = swirlTot; for (let i = 0; i < 26; i++) swirl(.16); swirlTot = st; }   // 여러 색이 녹으며 저절로 줄무늬처럼 얽힘
          api.guide(mode === 'marble' ? '다 녹았어요! 숟가락을 빙빙 돌리면 색이 소용돌이쳐요. 적게 돌리면 무늬가 살고, 많이 돌리면 오묘하게 섞여요. 다 됐으면 봉투 위에 대고 부어요.'
            : '다 녹았어요. 숟가락을 봉투 가운데 위로 가져가서 잠깐 대고 있으면 부어져요.');
        }
      }
      const tmp = new Float32Array(N * N * 4);
      function swirl(da) {
        if (!beads.some(b => b.m > .2)) return; tmp.set(field); swirlTot += Math.abs(da);
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const dx = x - N / 2, dy = y - N / 2, r = Math.hypot(dx, dy); if (r > NR) continue;
          const a = -da * 1.6 * (r / NR) * (1 - r / NR * .55), ca = Math.cos(a), sa = Math.sin(a);
          const sx = Math.round(N / 2 + dx * ca - dy * sa), sy = Math.round(N / 2 + dx * sa + dy * ca);
          if (sx < 0 || sy < 0 || sx >= N || sy >= N) continue; const i = (y * N + x) * 4, j = (sy * N + sx) * 4; if (!tmp[j + 3]) continue;
          field[i] = tmp[j]; field[i + 1] = tmp[j + 1]; field[i + 2] = tmp[j + 2]; field[i + 3] = tmp[j + 3];
        }
        if (swirlTot > 40) {                                                            // 많이 돌리면 서서히 하나로 섞임
          tmp.set(field); const k = Math.min(.5, (swirlTot - 40) / 120);
          for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const i = (y * N + x) * 4; if (!tmp[i + 3]) continue;
            for (let c = 0; c < 3; c++) { let s = 0, n = 0; for (const o of [-4, 4, -N * 4, N * 4]) if (tmp[i + o + 3]) { s += tmp[i + o + c]; n++; } if (n) field[i + c] = tmp[i + c] * (1 - k) + s / n * k; } }
        }
      }
      function fieldCanvas() { const d = fimg.data; for (let i = 0; i < N * N; i++) { d[i * 4] = field[i * 4]; d[i * 4 + 1] = field[i * 4 + 1]; d[i * 4 + 2] = field[i * 4 + 2]; d[i * 4 + 3] = field[i * 4 + 3] * 255; } fx.putImageData(fimg, 0, 0); return fc; }
      // ── 붓고 굳은 왁스(봉인) 그리기
      const NZ = 64, nzT = new Float32Array(NZ * NZ).map(() => Math.random());
      const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx2 = x - xi, fy2 = y - yi, sx2 = fx2 * fx2 * (3 - 2 * fx2), sy2 = fy2 * fy2 * (3 - 2 * fy2), a = (xi & 63) + (yi & 63) * NZ, b2 = ((xi + 1) & 63) + (yi & 63) * NZ, c2 = (xi & 63) + ((yi + 1) & 63) * NZ, d2 = ((xi + 1) & 63) + ((yi + 1) & 63) * NZ;
        return (nzT[a] * (1 - sx2) + nzT[b2] * sx2) * (1 - sy2) + (nzT[c2] * (1 - sx2) + nzT[d2] * sx2) * sy2; };
      const fbm = (x, y) => vnoise(x, y) * .55 + vnoise(x * 2.1 + 7.3, y * 2.1 + 1.7) * .3 + vnoise(x * 4.3 + 3.1, y * 4.3 + 9.2) * .15 - .5;
      function makeWarp(P) {
        const c = SR / 2, rr = SR / 2 / 1.1, wp = new Float32Array(SR * SR * 2), cr = Math.cos(P.rot), sr = Math.sin(P.rot);
        const amp = mode === 'marble' ? .75 + Math.min(.8, swirlTot / 25) : .2, sw = mode === 'marble' ? 2.4 + Math.min(3, swirlTot / 12) : 0, ox = rnd(0, 40), oy = rnd(0, 40);
        for (let y = 0, k = 0; y < SR; y++) for (let x = 0; x < SR; x++, k += 2) {
          let px = (x - c) / rr, py = (y - c) / rr;
          const qx = px + amp * fbm(px * 2.2 + ox, py * 2.2 + oy), qy = py + amp * fbm(px * 2.2 + ox + 5.2, py * 2.2 + oy + 1.3);     // 1단 비틀기
          const rx = qx + amp * .7 * fbm(qx * 5 + ox + 1.7, qy * 5 + oy + 9.2), ry = qy + amp * .7 * fbm(qx * 5 + ox + 8.3, qy * 5 + oy + 2.8);   // 2단: 가는 결
          const rad = Math.hypot(rx, ry), ang = sw * (1 - Math.min(1, rad)) ;                                                                   // 가운데로 갈수록 소용돌이
          const ca = Math.cos(ang), sa = Math.sin(ang), ux = rx * ca - ry * sa, uy = rx * sa + ry * ca;
          const vx = ux * cr - uy * sr, vy = ux * sr + uy * cr;
          let wx = vx * NR * 1.02, wy = vy * NR * 1.02; const wl = Math.hypot(wx, wy), lim = NR - 1.8; if (wl > lim) { wx *= lim / wl; wy *= lim / wl; }   // 숟가락 밖(빈 곳)은 안 집어 옴
          wp[k] = N / 2 + wx; wp[k + 1] = N / 2 + wy; }
        return wp;
      }
      function makePuddle(x, y) { const edge = []; for (let i = 0; i < 28; i++) edge.push(1 + rnd(-.06, .06)); const tex = cv(N, N); tex.getContext('2d').drawImage(fieldCanvas(), 0, 0); return { x, y, r: 10, edge, tex, rot: rnd(0, 6.28) }; }
      function blob(x, cx, cy, r, edge) { x.beginPath(); for (let i = 0; i <= 56; i++) { const a = i / 56 * 6.283, e = edge[Math.floor(i / 2) % edge.length] * .5 + edge[Math.ceil(i / 2) % edge.length] * .5, rr = r * e; i ? x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); }
      // 봉인을 진짜 왁스처럼: 높낮이(볼록한 가장자리·눌린 자리·도드라진 문양)를 만들고 빛을 비춰서 그림
      const SR = 280, sC = cv(SR, SR), sCx = sC.getContext('2d', { willReadFrequently: true }), sH = cv(SR, SR), sHx = sH.getContext('2d', { willReadFrequently: true }), sA = cv(SR, SR), sAx = sA.getContext('2d', { willReadFrequently: true }), sOut = cv(SR, SR), sOx = sOut.getContext('2d');
      const LV = (() => { const l = [-.5, -.62, .6], n = Math.hypot(...l); return l.map(v => v / n); })(), HV = (() => { const h = [LV[0], LV[1], LV[2] + 1], n = Math.hypot(...h); return h.map(v => v / n); })();
      function renderSeal(P, imp, gloss) {
        const key = [P.r.toFixed(1), !!imp, imp && imp.q, (gloss * 10 | 0), P.ver || 0].join('|'); if (P._key === key) return sOut; P._key = key;
        const c = SR / 2, rr = SR / 2 / 1.1, ir = rr * .74, ds = ir * 2 / (MS * .94);
        // 색
        {                                                                           // 마블: 색 경계를 소용돌이처럼 비틀어서(물결 무늬) 부드럽게 섞음
          if (!P.warp) P.warp = makeWarp(P);
          const td = P.tex.getContext('2d').getImageData(0, 0, N, N).data, CI = sCx.createImageData(SR, SR), cd = CI.data, wp = P.warp;
          const samp = (x, y, ch) => { x = Math.max(0, Math.min(N - 1.001, x)); y = Math.max(0, Math.min(N - 1.001, y)); const x0 = x | 0, y0 = y | 0, fx2 = x - x0, fy2 = y - y0, i00 = (y0 * N + x0) * 4, i10 = i00 + 4, i01 = i00 + N * 4, i11 = i01 + 4;
            return (td[i00 + ch] * (1 - fx2) + td[i10 + ch] * fx2) * (1 - fy2) + (td[i01 + ch] * (1 - fx2) + td[i11 + ch] * fx2) * fy2; };
          for (let i = 0, k = 0; i < SR * SR; i++, k += 2) { const tx = wp[k], ty = wp[k + 1], o = i * 4; cd[o] = samp(tx, ty, 0); cd[o + 1] = samp(tx, ty, 1); cd[o + 2] = samp(tx, ty, 2); cd[o + 3] = 255; }
          sCx.setTransform(1, 0, 0, 1, 0, 0); sCx.putImageData(CI, 0, 0);
        }
        if (imp && imp.paint) sCx.drawImage(imp.paint, c - MS / 2 * ds, c - MS / 2 * ds, MS * ds, MS * ds);
        // 모양(가장자리)
        sAx.setTransform(1, 0, 0, 1, 0, 0); sAx.clearRect(0, 0, SR, SR); sAx.fillStyle = '#fff'; blob(sAx, c, c, rr, P.edge); sAx.fill();
        // 높이
        sHx.setTransform(1, 0, 0, 1, 0, 0); sHx.fillStyle = '#000'; sHx.fillRect(0, 0, SR, SR);
        sHx.filter = `blur(${(rr * .2).toFixed(1)}px)`; sHx.fillStyle = '#fff'; blob(sHx, c, c, rr * .96, P.edge); sHx.fill(); sHx.filter = 'none';
        if (imp) {
          sHx.globalCompositeOperation = 'source-over';
          sHx.filter = 'blur(3px)'; sHx.strokeStyle = 'rgba(255,255,255,.35)'; sHx.lineWidth = rr * .07; sHx.beginPath(); sHx.arc(c, c, ir + rr * .05, 0, 6.29); sHx.stroke();   // 눌려서 밀려 올라온 둘레
          sHx.filter = 'blur(1.5px)'; sHx.fillStyle = 'rgba(70,70,70,1)'; sHx.beginPath(); sHx.arc(c, c, ir, 0, 6.29); sHx.fill();                                      // 눌린 평평한 자리
          sHx.strokeStyle = 'rgba(150,150,150,1)'; sHx.lineWidth = rr * .025; sHx.beginPath(); sHx.arc(c, c, ir * .93, 0, 6.29); sHx.stroke();                          // 도장 테두리 선
          const q = imp.q, blurD = q === 'smear' ? 4 : 1.2; sHx.save(); sHx.filter = `blur(${blurD}px)`; sHx.globalAlpha = q === 'faint' ? .3 : .85;
          if (q === 'smear') { sHx.translate(c, c); sHx.rotate(.07); sHx.scale(1.07, .96); sHx.translate(-c, -c); }
          sHx.drawImage(imp.mask, c - MS / 2 * ds, c - MS / 2 * ds, MS * ds, MS * ds); sHx.restore(); sHx.filter = 'none';
        }
        const C = sCx.getImageData(0, 0, SR, SR).data, Hd = sHx.getImageData(0, 0, SR, SR).data, Ad = sAx.getImageData(0, 0, SR, SR).data, O = sOx.createImageData(SR, SR), o = O.data;
        const K = 9, sp = .25 + .55 * gloss;
        for (let y = 1; y < SR - 1; y++) for (let x = 1; x < SR - 1; x++) { const i = (y * SR + x) * 4; if (!Ad[i + 3]) continue;
          const nx = (Hd[i - 4] - Hd[i + 4]) / 255 * K, ny = (Hd[i - SR * 4] - Hd[i + SR * 4]) / 255 * K, nn = Math.hypot(nx, ny, 1);
          const dif = Math.max(0, (nx * LV[0] + ny * LV[1] + LV[2]) / nn), spc = Math.pow(Math.max(0, (nx * HV[0] + ny * HV[1] + HV[2]) / nn), 28) * sp, k = .42 + .78 * dif;
          o[i] = Math.min(255, C[i] * k + 255 * spc); o[i + 1] = Math.min(255, C[i + 1] * k + 255 * spc); o[i + 2] = Math.min(255, C[i + 2] * k + 255 * spc); o[i + 3] = Ad[i + 3]; }
        sOx.putImageData(O, 0, 0); return sOut;
      }
      function drawSeal(x, cx, cy, P, imp, gloss) {
        const im = renderSeal(P, imp, gloss), w = P.r * 2.2; x.save(); x.shadowColor = 'rgba(40,20,10,.38)'; x.shadowBlur = Math.max(4, P.r * .12); x.shadowOffsetY = Math.max(2, P.r * .05);
        x.drawImage(im, cx - w / 2, cy - w / 2, w, w); x.restore();
      }
      function avg(t) { const d = t.getContext('2d').getImageData(N / 2 - 6, N / 2 - 6, 12, 12).data; let r = 0, gg = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; } n = n || 1; return [r / n | 0, gg / n | 0, b / n | 0].join(','); }
      // ── 도장 면(칠하기): 좌우가 뒤집혀 보임(찍으면 바로 보이게)
      const FACE = { x: 400, y: 260, r: 200 };
      const faceXY = q => ({ x: MS / 2 - (q.x - FACE.x) / (FACE.r * 2 / (MS * .94)), y: MS / 2 + (q.y - FACE.y) / (FACE.r * 2 / (MS * .94)) });
      let faceLast = null;
      function facePaint(q) {
        const p = faceXY(q), L = faceLast || p; faceLast = p; const m = stamps[cur].mask;
        if (paintTool === 'drip') { W2.x.fillStyle = curColor; const n = Math.max(1, Math.ceil(Math.hypot(p.x - L.x, p.y - L.y) / 3)); for (let i = 0; i <= n; i++) { const u = i / n; W2.x.beginPath(); W2.x.arc(L.x + (p.x - L.x) * u, L.y + (p.y - L.y) * u, rnd(6, 9), 0, 6.28); W2.x.fill(); } W2.dirty = true; }
        else {                                                                          // 나이프: 홈 밖의 왁스만 긁혀 나감
          const B = cv(MS, MS), bx = B.getContext('2d'); bx.strokeStyle = '#000'; bx.lineWidth = 26; bx.lineCap = 'butt'; bx.beginPath(); bx.moveTo(L.x - 34, L.y + 6); bx.lineTo(L.x + 34, L.y - 6); bx.lineTo(p.x + 34, p.y - 6); bx.lineTo(p.x - 34, p.y + 6); bx.closePath(); bx.fill(); bx.stroke();
          bx.globalCompositeOperation = 'destination-out'; bx.drawImage(m, 0, 0);
          W2.x.globalCompositeOperation = 'destination-out'; W2.x.drawImage(B, 0, 0); W2.x.globalCompositeOperation = 'source-over';
        }
      }
      function drawFace(t) {
        const s = FACE.r * 2 / (MS * .94), m = stamps[cur] && stamps[cur].mask;
        g.fillStyle = '#e9e1d2'; g.fillRect(0, 0, W, H);
        g.save(); g.shadowColor = 'rgba(40,25,10,.4)'; g.shadowBlur = 18; g.shadowOffsetY = 8;
        const br = g.createRadialGradient(FACE.x - 60, FACE.y - 70, 20, FACE.x, FACE.y, FACE.r * 1.1); br.addColorStop(0, '#e2c27c'); br.addColorStop(.6, '#b8914b'); br.addColorStop(1, '#7d5c2a');
        g.fillStyle = br; g.beginPath(); g.arc(FACE.x, FACE.y, FACE.r + 14, 0, 6.28); g.fill(); g.restore();
        g.strokeStyle = 'rgba(70,45,15,.5)'; g.lineWidth = 3; g.beginPath(); g.arc(FACE.x, FACE.y, FACE.r, 0, 6.28); g.stroke();
        if (!m) return;
        g.save(); g.translate(FACE.x, FACE.y); g.scale(-1, 1); g.translate(-MS / 2 * s, -MS / 2 * s);
        g.drawImage(tint(m, '#5a3d17'), 0, 0, MS * s, MS * s);                         // 파인 홈(어두운 놋쇠)
        g.drawImage(tint(m, 'rgba(255,230,170,.35)'), 2, 2, MS * s, MS * s); g.drawImage(tint(m, '#6b4a1e'), 0, 0, MS * s, MS * s);
        // 넣은 왁스: 홈 안은 평평하게, 홈 밖은 볼록하게(긁어내야 함)
        const inn = cv(MS, MS), ix = inn.getContext('2d'); ix.drawImage(W2.c, 0, 0); ix.globalCompositeOperation = 'destination-in'; ix.drawImage(m, 0, 0);
        const out = cv(MS, MS), ox = out.getContext('2d'); ox.drawImage(W2.c, 0, 0); ox.globalCompositeOperation = 'destination-out'; ox.drawImage(m, 0, 0);
        g.drawImage(inn, 0, 0, MS * s, MS * s);
        g.save(); g.shadowColor = 'rgba(30,15,5,.55)'; g.shadowBlur = 5; g.shadowOffsetX = -2; g.shadowOffsetY = 3; g.drawImage(out, 0, 0, MS * s, MS * s); g.restore();
        g.globalAlpha = .22; g.drawImage(tint(out, '#fff'), -1.5, -1.5, MS * s, MS * s); g.globalAlpha = 1;
        g.restore();
        if (hover) {                                                                    // 손에 든 도구
          g.save(); g.translate(hover.x, hover.y);
          if (paintTool === 'knife') { g.rotate(-.17); g.fillStyle = '#d9dde2'; g.strokeStyle = '#7b828a'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(-70, -6, 140, 12, 3); g.fill(); g.stroke(); g.fillStyle = '#6b4a2a'; g.fillRect(-10, -60, 20, 54); }
          else { g.fillStyle = curColor; g.beginPath(); g.arc(0, 0, 14, 0, 6.28); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(-4, -4, 4, 0, 6.28); g.fill(); }
          g.restore();
        }
      }
      let hover = null;
      // ── 손 움직임
      const onSpoon = q => Math.hypot(q.x - sp.x, q.y - sp.y) < 44 || (q.x > sp.x && q.x < sp.x + 130 && Math.abs(q.y - (sp.y + (q.x - sp.x) * .35)) < 16);
      can.addEventListener('pointerdown', e => {
        const q = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId);
        if (stage === 'face') { faceLast = null; held = 'face'; facePaint(q); return; }
        if (stage === 'melt' && puddle && pourAmt > .15 && !onSpoon(q)) { stage = 'press'; sp = { x: REST.x, y: REST.y }; paintTools(); }
        if (stage === 'press' && puddle && Math.hypot(q.x - puddle.x, q.y - puddle.y) < Math.max(puddle.r * 1.8, 80)) { pressing = true; pressT = 0; pressAt = q; return; }
        if (stage === 'melt' && onSpoon(q)) { held = 'spoon'; lastV = null; }
      });
      can.addEventListener('pointermove', e => {
        const q = at(e, can); hover = q;
        if (held === 'face') { facePaint(q); return; }
        if (held !== 'spoon') return;
        const v = { x: q.x - sp.x, y: q.y - sp.y }, spd = Math.hypot(v.x, v.y); sp.x = Math.max(60, Math.min(W - 40, q.x)); sp.y = Math.max(40, Math.min(H - 30, q.y));
        if (spd > 1.5) { if (lastV) { const da = Math.atan2(lastV.x * v.y - lastV.y * v.x, lastV.x * v.x + lastV.y * v.y); if (Math.abs(da) < 1.2) swirl(da); } lastV = v; }
      });
      can.addEventListener('pointerleave', () => { hover = null; });
      const up = () => {
        if (pressing) { pressing = false; if (pressT > .3) { const q = cool < .12 ? 'smear' : cool > .88 ? 'faint' : 'good'; const paint = mode === 'paint' ? (() => { const c = cv(MS, MS); c.getContext('2d').drawImage(W2.c, 0, 0); return c; })() : null;
          imprint = { mask: stamps[cur].mask, q, paint }; stage = 'done'; api.ready(true);
          api.guide(q === 'smear' ? '아직 왁스가 뜨거워서 문양이 살짝 번졌어요. 이것도 손으로 만든 맛이에요!' : q === 'faint' ? '왁스가 너무 굳어서 문양이 흐리게 찍혔어요. 다음엔 조금 더 일찍 찍어 보세요.' : '꾹! 예쁘게 찍혔어요.'); }
          else api.guide('도장을 조금 더 오래 꾹 눌러 주세요.'); }
        if (held === 'spoon' && stage === 'melt' && !pourAmt) { /* 놓으면 그 자리에 둠 */ }
        held = false; faceLast = null;
      };
      can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function frame(t) {
        if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (t - (t0 || t)) / 1000); t0 = t;
        if (stage === 'face') return drawFace(t);
        g.fillStyle = '#e9e1d2'; g.fillRect(0, 0, W, H);
        if (envIm.complete && envIm.naturalWidth) { g.save(); g.shadowColor = 'rgba(40,25,10,.3)'; g.shadowBlur = 14; g.shadowOffsetY = 6; g.drawImage(envIm, ENV.x, ENV.y, ENV.w, ENV.h); g.restore(); }
        if (!puddle && stage === 'melt') { g.setLineDash([6, 6]); g.strokeStyle = 'rgba(120,80,40,.35)'; g.beginPath(); g.arc(SEAL.x, SEAL.y, 60, 0, 6.28); g.stroke(); g.setLineDash([]); }
        // 초와 불꽃
        if (candleIm.complete) { const k = .62; g.save(); g.shadowColor = 'rgba(40,25,10,.3)'; g.shadowBlur = 10; g.shadowOffsetY = 5; g.drawImage(candleIm, FLAME.x - 132 * k, FLAME.y + 8 - 7 * k, 257 * k, 215 * k); g.restore(); }
        { const fl = 1 + Math.sin(t / 70) * .06 + Math.sin(t / 23) * .03, sw = Math.sin(t / 130) * 2.5, fy = FLAME.y + 8;   // 살랑이는 불꽃
          const gr = g.createRadialGradient(FLAME.x, fy - 22, 2, FLAME.x, fy - 22, 70 * fl); gr.addColorStop(0, 'rgba(255,200,110,.55)'); gr.addColorStop(1, 'rgba(255,160,70,0)'); g.fillStyle = gr; g.fillRect(FLAME.x - 80, fy - 100, 160, 160);
          g.save(); g.translate(FLAME.x, fy); g.scale(1, fl); const fg = g.createRadialGradient(0, -12, 1, 0, -14, 22); fg.addColorStop(0, '#fffbe8'); fg.addColorStop(.35, '#ffe08a'); fg.addColorStop(.75, '#ff9a3c'); fg.addColorStop(1, 'rgba(255,120,40,0)');
          g.fillStyle = fg; g.beginPath(); g.moveTo(0, 2); g.bezierCurveTo(-9, -4, -8, -18, sw, -36); g.bezierCurveTo(8, -18, 9, -4, 0, 2); g.fill(); g.fillStyle = 'rgba(90,120,255,.35)'; g.beginPath(); g.ellipse(0, -2, 3, 4, 0, 0, 7); g.fill(); g.restore(); }
        // 불꽃은 초 그림에 그려져 있음
        // 숟가락이 불 위에 있으면 녹음
        heat = stage === 'melt' && Math.abs(sp.x - FLAME.x) < 85 && sp.y < FLAME.y + 15 && sp.y > FLAME.y - 190 ? 1 : 0;
        if (stage === 'melt') meltStep(dt);
        // 붓기: 다 녹은 숟가락을 봉투 위에 대고 있으면 흘러내림
        const overEnv = Math.hypot(sp.x - SEAL.x, sp.y + 45 - SEAL.y) < 85;
        const maxAmt = Math.max(1, beads.length) * .55;
        if (stage === 'melt' && melted && held === 'spoon' && overEnv && pourAmt < maxAmt) {
          if (!puddle) { puddle = makePuddle(SEAL.x, SEAL.y); api.guide('주르륵… 원하는 크기가 되면 숟가락을 떼요.'); paintTools(); }
          pourAmt = Math.min(maxAmt, pourAmt + dt * .55); lastPourT = t; puddle.tex.getContext('2d').drawImage(fieldCanvas(), 0, 0); puddle.ver = (puddle.ver || 0) + 1;
          g.strokeStyle = 'rgb(' + avg(puddle.tex) + ')'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(sp.x - 8, sp.y + 6); g.quadraticCurveTo(sp.x - 6, (sp.y + puddle.y) / 2, puddle.x, puddle.y); g.stroke();
        }
        if (puddle) puddle.r = 34 + 80 * Math.sqrt(pourAmt / 2.2);
        if (stage === 'melt' && puddle && (t - lastPourT > 450 || pourAmt >= maxAmt) && pourAmt > .15) { stage = 'press'; api.guide('이제 도장을 골라 왁스 위를 꾹 누르고 1초쯤 있다가 떼요. 너무 빨리 찍으면 번지고, 너무 늦으면 흐려요.'); sp = { x: REST.x, y: REST.y }; paintTools(); }
        if (stage === 'press' || stage === 'done') cool = Math.min(1, cool + dt / 9);
        if (puddle) drawSeal(g, puddle.x, puddle.y, puddle, imprint, 1 - cool);
        if (stage === 'press' && puddle) {                                              // 남은 시간 막대(굳는 정도)
          const bw = 120, bx = puddle.x - bw / 2, by = puddle.y + puddle.r + 18; g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(bx, by, bw, 6); g.fillStyle = cool < .12 ? '#d9822b' : cool > .88 ? '#8a8f99' : '#5a9c5e'; g.fillRect(bx, by, bw * cool, 6);
          g.fillStyle = 'rgba(60,40,25,.75)'; g.font = '13px Gowun Batang,serif'; g.textAlign = 'center'; g.fillText(cool < .12 ? '아직 뜨거워요' : cool > .88 ? '거의 굳었어요' : '지금 찍기 좋아요', puddle.x, by + 22);
        }
        // 숟가락
        if (stage === 'melt') {
          const x0 = sp.x, y0 = sp.y; g.save(); g.shadowColor = 'rgba(30,20,10,.35)'; g.shadowBlur = held ? 12 : 4; g.shadowOffsetY = held ? 10 : 3;
          if (spoonIm.complete) g.drawImage(spoonIm, x0 - 76 * .5, y0 - 52 * .5, 508 * .5, 128 * .5); g.restore();   // 놋쇠 숟가락(오목한 쪽에 왁스)
          g.save(); g.beginPath(); g.ellipse(x0, y0 - 4, 28, 13, 0, 0, 6.28); g.clip();
          const fk = 2.2 * (pourAmt ? Math.max(.25, 1 - pourAmt / maxAmt) : 1); if (beads.some(b => b.m > 0)) { g.imageSmoothingEnabled = true; g.drawImage(fieldCanvas(), x0 - N / 2 * 1.35, y0 - 4 - N / 2 * .7, N * 1.35, N * .7); }
          for (const b of beads) if (b.m < 1) { const bx = x0 + (b.x - N / 2) * 1.65, by = y0 - 4 + (b.y - N / 2) * .6, r = 6 * (1 - b.m * .6), bi = beadIm[COLORS.findIndex(c => c[1] === b.hex)]; g.save(); g.beginPath(); g.roundRect(bx - r, by - r * .85, r * 2, r * 1.7, r * .55); g.clip(); if (bi && bi.complete) g.drawImage(bi, bi.naturalWidth * .3 + (b.id * 13) % 30, bi.naturalHeight * .25, bi.naturalWidth * .3, bi.naturalHeight * .45, bx - r * 1.2, by - r * 1.1, r * 2.4, r * 2.2); else { g.fillStyle = b.hex; g.fill(); } g.restore(); }
          const hl = g.createLinearGradient(x0 - 36, y0 - 26, x0 + 20, y0 + 26); hl.addColorStop(0, 'rgba(255,255,255,.25)'); hl.addColorStop(.5, 'rgba(255,255,255,0)'); g.fillStyle = hl; g.fillRect(x0 - 40, y0 - 30, 80, 60); g.restore();
          if (heat && beads.some(b => b.m < 1)) { g.fillStyle = 'rgba(255,240,200,.6)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x0 + rnd(-20, 20), y0 - 30 - rnd(0, 20), rnd(1, 2.5), 0, 6.28); g.fill(); } }
        }
        // 도장(누르는 중이거나 손에 들었을 때)
        if ((stage === 'press' && hover) || pressing) {
          const p = pressing ? { x: puddle.x, y: puddle.y } : hover, rr = puddle ? puddle.r * .8 : 40; if (pressing) pressT += dt;
          if (pressing) { g.save(); g.strokeStyle = pressT > .3 ? 'rgba(80,140,80,.9)' : 'rgba(192,57,43,.85)'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.arc(p.x, p.y, rr + 22, -Math.PI / 2, -Math.PI / 2 + Math.min(1, pressT / .3) * Math.PI * 2); g.stroke(); g.restore(); }
          if (stampIm.complete) { const k = Math.max(.7, rr * 1.7 / 115), lift = pressing ? Math.max(0, 6 - pressT * 40) : 34;   // 손잡이 달린 놋쇠 도장을 위에서 눌러 찍음
            g.save(); g.fillStyle = `rgba(30,20,10,${pressing ? .3 : .18})`; g.beginPath(); g.ellipse(p.x, p.y + 4, 60 * k * .5, 14 * k * .5, 0, 0, 7); g.fill(); g.shadowColor = 'rgba(30,20,10,.35)'; g.shadowBlur = 10; g.shadowOffsetY = 6; g.drawImage(stampIm, p.x - 57 * k, p.y - (377 - 18) * k - lift, 115 * k, 377 * k); g.restore(); }
        }
      }
      paintStamps(); reset(); requestAnimationFrame(frame);
      return { reset, stop() { alive = false; pw && pw.classList.remove('wide'); },
        result() { if (!imprint || !puddle) return null; const R = puddle.r * 1.15, c = cv(260, 260), x = c.getContext('2d'), k = 120 / R; puddle._key = null;
          x.translate(130, 130); x.scale(k, k); x.translate(-puddle.x, -puddle.y); drawSeal(x, puddle.x, puddle.y, puddle, imprint, .2); return { img: c.toDataURL('image/png') }; } };
    },
  };

  /* ───────── 창문 성에에 손가락으로 그림 그리기 (입김을 불면 다시 뿌예져요) ───────── */
  plays.frost = {
    title: '창문 성에 그림', doneLabel: '📷 사진 찍기', forceLabel: true, doneMsg: '성에 낀 창문에 그린 그림을 사진으로 찍어 탁자 위 액자에 꽂아 뒀어요.',
    start(board, api) {
      board.className = 'pboard frost'; const pwW = board.closest('.panel-wrap'); pwW && pwW.classList.add('xwide');
      const W = 900, H = 756, can = cv(W, H, 'frcv'), g = can.getContext('2d'), bar = mk('div', 'pbar'); board.append(can, bar);
      const frostI = pic('fr_frost.jpg'), clearI = pic('fr_clear.jpg'), jarI = pic('gf_candle.png');
      const GLASS = { x: 77, y: 0, w: 735, h: 718 };   // 유리창 (창살 포함)
      const PANES = [[77, 334], [350, 547], [562, 812]].flatMap(([x0, x1]) => [[x0, 0, x1 - x0, 222], [x0, 239, x1 - x0, 744 - 239]]);
      const mask = cv(W, H), mx = mask.getContext('2d', { willReadFrequently: true }), comp = cv(W, H), cx2 = comp.getContext('2d');
      let drips = [], down = false, last = null, breath = false, bt = 0, alive = true, t0 = 0, cleared = 0, check = 0, flash = 0, fog = null;
      // 유리에만 끼는 뿌연 김 (나무 창틀·커튼에는 안 낌)
      function makeFog() { if (fog || !frostI.complete || !frostI.naturalWidth) return; const t = cv(W, H), x = t.getContext('2d'); const D = x.createImageData(W, H), d = D.data;
        for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { const i = (y * W + xx) * 4, n = Math.random() * 18 - 9, edge = Math.min(1, Math.min(xx - GLASS.x, GLASS.x + GLASS.w - xx, GLASS.y + GLASS.h - y, y + 60) / 150);
          d[i] = 236 + n; d[i + 1] = 242 + n; d[i + 2] = 248 + n; d[i + 3] = 140 + (1 - edge) * 80 + Math.random() * 22; }
        x.putImageData(D, 0, 0); fog = cv(W, H); const fg2 = fog.getContext('2d'); fg2.save(); fg2.beginPath(); PANES.forEach(([px, py, pw, ph]) => fg2.rect(px - 1, py - 1, pw + 2, ph + 2)); fg2.clip(); fg2.filter = 'blur(1.2px)'; fg2.drawImage(t, 0, 0); fg2.restore();
        fg2.globalCompositeOperation = 'destination-out'; PANES.forEach(([px, py, pw, ph]) => { const sh = fg2.createLinearGradient(0, py, 0, py + 14); sh.addColorStop(0, 'rgba(0,0,0,.4)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); fg2.fillStyle = sh; fg2.fillRect(px, py, pw, 14); }); fg2.globalCompositeOperation = 'source-over'; }
      function reset() { mx.clearRect(0, 0, W, H); drips = []; api.ready(false); api.guide('창문에 하얗게 성에가 꼈어요. 손가락으로 쓱쓱 그림이나 글씨를 써 봐요. 닦은 자리로 바깥 마을이 또렷하게 보여요. "후~ 입김"을 누르고 있으면 다시 뿌예져요.'); }
      function wipe(a, b2) { const n = Math.max(1, Math.ceil(Math.hypot(b2.x - a.x, b2.y - a.y) / 3));
        for (let i = 0; i <= n; i++) { const u = i / n, x = a.x + (b2.x - a.x) * u, y = a.y + (b2.y - a.y) * u, gr = mx.createRadialGradient(x, y, 3, x, y, 15); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.65, 'rgba(0,0,0,.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); mx.fillStyle = gr; mx.fillRect(x - 16, y - 16, 32, 32); }
        if (Math.random() < .03 && drips.length < 16) drips.push({ x: b2.x + rnd(-5, 5), y: b2.y + 9, v: rnd(12, 24), life: rnd(1.6, 3.4) }); }   // 녹은 물방울이 주르륵
      const inGlass = q => PANES.some(([px, py, pw, ph]) => q.x > px - 6 && q.x < px + pw + 6 && q.y > py - 6 && q.y < py + ph + 6);
      can.addEventListener('pointerdown', e => { const q = at(e, can); if (!inGlass(q)) return; e.preventDefault(); can.setPointerCapture(e.pointerId); down = true; last = q; wipe(q, q); });
      can.addEventListener('pointermove', e => { if (!down) return; const q = at(e, can); if (!inGlass(q)) { last = q; return; } wipe(last, q); last = q; if (Math.random() < .25) scratch(.04, .02, 6000); });
      const up = () => { down = false; last = null; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      const bb = mk('button', 'breath', '😮‍💨 후~ 입김 (누르고 있기)'); bb.type = 'button'; bar.append(bb);
      const bOn = e => { e.preventDefault(); breath = true; bt = 0; }, bOff = () => { breath = false; };
      bb.addEventListener('pointerdown', bOn); bb.addEventListener('pointerup', bOff); bb.addEventListener('pointerleave', bOff); bb.addEventListener('pointercancel', bOff);
      const kd = e => { if (e.code === 'Space' && !e.repeat) { breath = true; bt = 0; e.preventDefault(); } }, ku = e => { if (e.code === 'Space') breath = false; };
      addEventListener('keydown', kd); addEventListener('keyup', ku);
      function render(c) { c.fillStyle = '#e9dfcf'; c.fillRect(0, 0, W, H); if (frostI.complete) c.drawImage(frostI, 0, 0, W, H); makeFog(); if (fog) c.drawImage(fog, 0, 0);
        if (clearI.complete) { cx2.clearRect(0, 0, W, H); cx2.drawImage(clearI, 0, 0, W, H); cx2.globalCompositeOperation = 'destination-in'; cx2.drawImage(mask, 0, 0); cx2.globalCompositeOperation = 'source-over'; c.drawImage(comp, 0, 0); }
        for (const d of drips) { c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(d.x, d.y, 2.4, 0, 6.29); c.fill(); c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(d.x - .7, d.y - .8, .9, 0, 6.29); c.fill(); }
        if (jarI.complete && jarI.naturalWidth) { const jw = 176, jh = jw * jarI.naturalHeight / jarI.naturalWidth, jx = 636, jy = 766 - jh, tt = performance.now() / 1000, fl = 1 + Math.sin(tt * 9) * .06 + Math.sin(tt * 23) * .04, wx = jx + jw * .52, wy = jy + jh * .19;   // 창턱 위 유리병 촛불
          const gl = c.createRadialGradient(wx, wy - 14, 4, wx, wy - 14, 150 * fl); gl.addColorStop(0, 'rgba(255,214,140,.45)'); gl.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = gl; c.fillRect(wx - 160, wy - 170, 320, 320);
          c.save(); c.fillStyle = 'rgba(40,24,10,.35)'; c.filter = 'blur(6px)'; c.beginPath(); c.ellipse(jx + jw / 2 + 8, 748, jw * .5, 12, 0, 0, 7); c.fill(); c.restore(); c.drawImage(jarI, jx, jy, jw, jh);
          c.save(); c.translate(wx + Math.sin(tt * 3.1) * 1.2, wy); c.scale(1, fl); const fg = c.createRadialGradient(0, -10, 1, 0, -10, 18); fg.addColorStop(0, 'rgba(255,255,235,1)'); fg.addColorStop(.45, 'rgba(255,214,110,.95)'); fg.addColorStop(1, 'rgba(255,140,40,0)'); c.fillStyle = fg; c.beginPath(); c.moveTo(0, -34); c.bezierCurveTo(9, -18, 9, -4, 0, 2); c.bezierCurveTo(-9, -4, -9, -18, 0, -34); c.fill(); c.restore(); } }
      function frame(t) {
        if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (t - (t0 || t)) / 1000); t0 = t;
        if (breath) { bt += dt; const cx = GLASS.x + GLASS.w / 2, cy = GLASS.y + GLASS.h * .55, r = Math.min(560, 70 + bt * 480);   // 입김: 가운데부터 다시 뿌옇게
          mx.save(); mx.globalCompositeOperation = 'destination-out'; const gr = mx.createRadialGradient(cx, cy, r * .3, cx, cy, r); gr.addColorStop(0, `rgba(0,0,0,${Math.min(1, dt * 4)})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); mx.fillStyle = gr; mx.fillRect(0, 0, W, H); mx.restore(); }
        drips = drips.filter(d => (d.life -= dt) > 0); for (const d of drips) { const y0 = d.y; d.y += d.v * dt; d.v *= .995; mx.strokeStyle = 'rgba(0,0,0,.85)'; mx.lineWidth = 3; mx.lineCap = 'round'; mx.beginPath(); mx.moveTo(d.x, y0); mx.lineTo(d.x, d.y); mx.stroke(); }
        if ((check += dt) > .5) { check = 0; const D = mx.getImageData(GLASS.x, GLASS.y, GLASS.w, GLASS.h).data; let c = 0, n = 0; for (let i = 3; i < D.length; i += 4 * 41) { n++; if (D[i] > 120) c++; } cleared = c / n; api.ready(cleared > .03); }
        render(g);
        if (breath) { g.fillStyle = `rgba(255,255,255,${Math.min(.18, bt * .3)})`; g.fillRect(GLASS.x, GLASS.y, GLASS.w, GLASS.h); } }
      reset(); requestAnimationFrame(frame);
      return { reset, stop() { alive = false; pwW && pwW.classList.remove('xwide'); removeEventListener('keydown', kd); removeEventListener('keyup', ku); },
        result() { if (cleared < .03) return null; tone(1800, .05, .06, 'square'); setTimeout(() => tone(900, .12, .05, 'triangle'), 60);   // 찰칵
          const o = cv(240, 230), x = o.getContext('2d'); x.save(); x.shadowColor = 'rgba(40,30,20,.35)'; x.shadowBlur = 10; x.shadowOffsetY = 4; x.fillStyle = '#fbf8f1'; x.fillRect(10, 8, 220, 214); x.restore();   // 폴라로이드 사진
          const t2 = cv(W, H); render(t2.getContext('2d')); x.drawImage(t2, 40, 0, 820, 640, 22, 20, 196, 153); x.fillStyle = 'rgba(255,240,210,.12)'; x.fillRect(22, 20, 196, 153);
          x.fillStyle = '#8a6a50'; x.font = '15px "Gowun Dodum",sans-serif'; x.textAlign = 'center'; x.fillText('성에 낀 창문 · 12월', 120, 202); return { img: o.toDataURL('image/png') }; } };
    },
  };

  // 접은 종이 모양 그림 (고르는 칸에 쓰는 작은 그림: 면마다 빛이 다른 색종이)
  function oriIcon(k) { const S = 64, c = cv(S, S), x = c.getContext('2d'), col = { heart: ['#d8434b', '#b62f38', '#ef6a70'], dog: ['#c98a4b', '#a86c34', '#e0a76a'], cat: ['#e6a23c', '#c7842a', '#f4c060'], fox: ['#e0702c', '#bd561c', '#f39552'] }[k] || ['#ccc', '#aaa', '#eee'];
    const poly = (P, f) => { x.beginPath(); P.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fillStyle = f; x.fill(); x.strokeStyle = 'rgba(80,40,20,.28)'; x.lineWidth = 1; x.stroke(); };
    x.shadowColor = 'rgba(60,40,20,.25)'; x.shadowBlur = 4; x.shadowOffsetY = 2;
    if (k === 'heart') { poly([[32, 56], [8, 30], [8, 18], [16, 10], [26, 10], [32, 18], [38, 10], [48, 10], [56, 18], [56, 30]], col[0]); x.shadowColor = 'transparent'; poly([[32, 18], [32, 56], [8, 30], [8, 18]], col[1]); poly([[38, 10], [48, 10], [56, 18], [44, 22]], col[2]); }
    else if (k === 'dog') { poly([[12, 14], [52, 14], [32, 54]], col[0]); x.shadowColor = 'transparent'; poly([[12, 14], [24, 14], [16, 38], [6, 30]], col[1]); poly([[52, 14], [40, 14], [48, 38], [58, 30]], col[1]); poly([[26, 40], [38, 40], [32, 54]], col[2]); x.fillStyle = '#3a2416'; x.beginPath(); x.arc(32, 46, 3, 0, 7); x.fill(); x.beginPath(); x.arc(25, 28, 2, 0, 7); x.arc(39, 28, 2, 0, 7); x.fill(); }
    else if (k === 'cat') { poly([[10, 22], [54, 22], [50, 46], [32, 56], [14, 46]], col[0]); x.shadowColor = 'transparent'; poly([[10, 22], [14, 6], [26, 22]], col[1]); poly([[54, 22], [50, 6], [38, 22]], col[1]); poly([[10, 22], [54, 22], [32, 30]], col[2]); x.fillStyle = '#3a2416'; x.beginPath(); x.arc(24, 36, 2, 0, 7); x.arc(40, 36, 2, 0, 7); x.fill(); x.strokeStyle = '#3a2416'; x.lineWidth = 1; x.beginPath(); x.moveTo(30, 44); x.lineTo(32, 46); x.lineTo(34, 44); x.stroke(); }
    else { poly([[8, 16], [56, 16], [32, 56]], col[0]); x.shadowColor = 'transparent'; poly([[8, 16], [14, 4], [24, 16]], col[1]); poly([[56, 16], [50, 4], [40, 16]], col[1]); poly([[8, 16], [32, 34], [22, 40]], '#fbf3e6'); poly([[56, 16], [32, 34], [42, 40]], '#fbf3e6'); poly([[28, 50], [36, 50], [32, 56]], '#3a2416'); x.fillStyle = '#3a2416'; x.beginPath(); x.arc(25, 27, 2, 0, 7); x.arc(39, 27, 2, 0, 7); x.fill(); }
    return c; }

  /* ───────── 종이접기(네모 종이): 색·그림으로 꾸미고 → 점선을 따라 끌어서 접기 → 완성한 걸 실에 꿰어 줄로 ───────── */
  plays.pstars = {
    title: '종이접기 줄', doneLabel: '트리에 달기', doneMsg: '내가 접은 종이접기 줄을 트리에 달아 뒀어요.',
    start(board, api) {
      board.className = 'pboard origami';
      const W = 800, H = 560, can = cv(W, H, 'orcv'), g = can.getContext('2d'), bar = mk('div', 'pbar'), bar2 = mk('div', 'pbar'); board.append(can, bar, bar2);
      const PAPERS = ['#e8524a', '#f4c542', '#f39cc0', '#57a77a', '#5b8fd6', '#9b7ad6', '#f3ece0', '#d9a066'], PENS = ['#3a2a20', '#ffffff', '#c0392b', '#2f6b3a', '#2c5d9e', '#e8b53a'];
      const PT = 512, front = cv(PT, PT), fx = front.getContext('2d'), back = cv(PT, PT), bx = back.getContext('2d');
      const CX = 400, CY = 280, SIDE = 330;
      let hsel = -1, hdrag = null, paper = PAPERS[0], pen = PENS[0], model = null, step = 0, layers = [], phase = 'pick', grab = null, prog = 0, anim = null, made = [], deco = cv(W, H), dx2 = deco.getContext('2d'), last = null, alive = true, t0 = 0;
      function paintPaper() {
        fx.fillStyle = paper; fx.fillRect(0, 0, PT, PT); const D = fx.getImageData(0, 0, PT, PT), d = D.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n; } fx.putImageData(D, 0, 0);
        bx.fillStyle = '#fbf7ef'; bx.fillRect(0, 0, PT, PT); bx.fillStyle = paper; bx.globalAlpha = .18; bx.fillRect(0, 0, PT, PT); bx.globalAlpha = 1;
      }
      function pattern(k) { fx.save(); if (k === 'dot') { fx.fillStyle = 'rgba(255,255,255,.7)'; for (let x = 16; x < PT; x += 44) for (let y = 16; y < PT; y += 44) { fx.beginPath(); fx.arc(x + (y / 44 % 2) * 22, y, 7, 0, 6.29); fx.fill(); } }
        else if (k === 'check') { fx.fillStyle = 'rgba(255,255,255,.28)'; for (let x = 0; x < PT; x += 64) fx.fillRect(x, 0, 32, PT); for (let y = 0; y < PT; y += 64) fx.fillRect(0, y, PT, 32); }
        else if (k === 'flower') { fx.fillStyle = 'rgba(255,255,255,.7)'; fx.font = '30px serif'; for (let x = 10; x < PT; x += 64) for (let y = 40; y < PT; y += 64) fx.fillText('✿', x + (y / 64 % 2) * 32, y); }
        else if (k === 'snow') { fx.fillStyle = 'rgba(255,255,255,.75)'; fx.font = '28px serif'; for (let x = 8; x < PT; x += 60) for (let y = 36; y < PT; y += 60) fx.fillText('❄', x + (y / 60 % 2) * 30, y); }
        fx.restore(); }
      // ── 접는 계산: 종이 조각(다각형)마다 '종이 그림 → 화면' 변환을 들고 있음. 접으면 선을 기준으로 거울처럼 뒤집혀 위로 포개짐
      const P = (x, y) => [CX + x, CY + y];                                          // 가운데 기준 좌표
      const h = SIDE / 2, dg = SIDE / Math.SQRT2;                                    // 네모 반쪽, 마름모 반대각선
      const FX = (() => { const A = [0, 1], B = [-.55, 0], L = [-1, 0], l = Math.hypot(B[0] - A[0], B[1] - A[1]), d = [(B[0] - A[0]) / l, (B[1] - A[1]) / l], v = [L[0] - A[0], L[1] - A[1]], k = 2 * (v[0] * d[0] + v[1] * d[1]); return [-(A[0] + k * d[0] - v[0]), A[1] + k * d[1] - v[1]]; })();   // 여우 귀: 아래 꼭짓점을 지나는 선으로 접을 때 끝이 가는 자리
      const MODELS = {
        heart: { name: '하트', icon: '♥', start: 'diamond', back: true, steps: [
          { move: [P(0, -dg), P(0, 0)], say: '위 꼭짓점을 가운데까지 접어 내려요.' },
          { move: [P(0, dg), P(0, -dg / 2)], say: '아래 꼭짓점을 위쪽 가장자리까지 접어 올려요.' },
          { move: [P(dg * .5, dg / 4), P(0, -dg / 4)], say: '오른쪽 아래 가장자리를 가운데 선에 맞춰 비스듬히 올려 접어요.' },
          { move: [P(-dg * .5, dg / 4), P(0, -dg / 4)], say: '왼쪽도 가운데 선에 맞춰 올려 접으면 하트 완성!' }] },
        dog: { name: '강아지', icon: '🐶', start: 'diamond', back: true, steps: [
          { move: [P(0, -dg), P(0, dg)], say: '위쪽 꼭짓점을 아래 꼭짓점에 맞춰 반으로 접어요.' },
          { move: [P(-dg, 0), P(-dg * .7, dg * .58)], say: '왼쪽 끝을 아래로 접어서 귀를 만들어요.' }, { move: [P(dg, 0), P(dg * .7, dg * .58)], say: '오른쪽 귀도 아래로.' },
          { move: [P(0, dg), P(0, dg * .72)], say: '아래 뾰족한 끝을 살짝 올려서 코를 만들어요.' }], face: true },
        cat: { name: '고양이', icon: '🐱', start: 'diamond', back: true, steps: [
          { move: [P(0, dg), P(0, -dg)], say: '아래 꼭짓점을 위 꼭짓점에 맞춰 반으로 접어요.' },
          { move: [P(-dg, 0), P(-dg * .55, -dg * .72)], say: '왼쪽 끝을 비스듬히 올려 접어서 귀를 세워요.' }, { move: [P(dg, 0), P(dg * .55, -dg * .72)], say: '오른쪽 귀도 올려요.' },
          { move: [P(0, -dg), P(0, -dg * .45)], say: '맨 위 꼭짓점을 아래로 접어요.' }, { flip: true, say: '종이를 뒤집어요. (눌러서 뒤집기)' }], face: true },
        fox: { name: '여우', icon: '🦊', start: 'diamond', back: true, steps: [
          { move: [P(0, -dg), P(0, dg)], say: '위쪽 꼭짓점을 아래 꼭짓점에 맞춰 반으로 접어요.' },
          { move: [P(-dg, 0), P(-dg * FX[0], dg * FX[1])], say: '왼쪽 끝을 아래 꼭짓점 쪽 선을 따라 위로 접어 뾰족한 귀를 만들어요.' }, { move: [P(dg, 0), P(dg * FX[0], dg * FX[1])], say: '오른쪽 귀도 위로.' },
          { flip: true, say: '종이를 뒤집으면 여우 얼굴! (눌러서 뒤집기)' }], face: true },
      };
      function newPaper() {
        const s = SIDE / PT, m = model, rot = m.start === 'diamond' ? Math.PI / 4 : 0, mir = m.back ? -1 : 1, c = Math.cos(rot), sn = Math.sin(rot);
        const a = c * s * mir, b = sn * s * mir, cc = -sn * s, d = c * s;                       // 종이 그림(u,v) → 화면
        const T = [a, b, cc, d, CX - (a * PT / 2 + cc * PT / 2), CY - (b * PT / 2 + d * PT / 2)];
        const pt = (u, v) => [T[0] * u + T[2] * v + T[4], T[1] * u + T[3] * v + T[5]];
        layers = [{ poly: [pt(0, 0), pt(PT, 0), pt(PT, PT), pt(0, PT)], T, tag: 'base' }];
      }
      const lineOf = st => { const [X, Y] = st.move, mx = (X[0] + Y[0]) / 2, my = (X[1] + Y[1]) / 2, l = Math.hypot(X[0] - Y[0], X[1] - Y[1]); return { p: [mx, my], n: [(X[0] - Y[0]) / l, (X[1] - Y[1]) / l] }; };
      const side = (L, q) => (q[0] - L.p[0]) * L.n[0] + (q[1] - L.p[1]) * L.n[1];
      function clip(poly, L, keepPos) { const out = []; for (let i = 0; i < poly.length; i++) { const A = poly[i], B = poly[(i + 1) % poly.length], sa = side(L, A) * (keepPos ? 1 : -1), sb = side(L, B) * (keepPos ? 1 : -1);
          if (sa >= 0) out.push(A); if ((sa >= 0) !== (sb >= 0)) { const t = sa / (sa - sb); out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]); } } return out; }
      const area = p => { let s = 0; for (let i = 0; i < p.length; i++) { const A = p[i], B = p[(i + 1) % p.length]; s += A[0] * B[1] - B[0] * A[1]; } return Math.abs(s / 2); };
      const affine = (M, T) => [M[0] * T[0] + M[2] * T[1], M[1] * T[0] + M[3] * T[1], M[0] * T[2] + M[2] * T[3], M[1] * T[2] + M[3] * T[3], M[0] * T[4] + M[2] * T[5] + M[4], M[1] * T[4] + M[3] * T[5] + M[5]];
      const apply = (M, q) => [M[0] * q[0] + M[2] * q[1] + M[4], M[1] * q[0] + M[3] * q[1] + M[5]];
      function squash(L, k) { const [nx, ny] = L.n, f = 1 - k, pn = L.p[0] * nx + L.p[1] * ny; return [1 - f * nx * nx, -f * nx * ny, -f * nx * ny, 1 - f * ny * ny, f * pn * nx, f * pn * ny]; }   // k=1 그대로, -1 완전히 뒤집힘
      const applies = (st, ly) => !st.only || ly.tag === st.only;
      function split(st, L0) { const L = L0 || lineOf(st), stay = [], mov = []; layers.forEach((ly, i) => { if (!applies(st, ly)) { stay.push({ ...ly, i }); return; } const a = clip(ly.poly, L, false), b = clip(ly.poly, L, true);
          if (a.length > 2 && area(a) > 3) stay.push({ ...ly, poly: a, i }); if (b.length > 2 && area(b) > 3) mov.push({ ...ly, poly: b, i }); }); return { L, stay, mov }; }
      let grabL = null;
      function commit(st) {
        if (st.flip) { const M = [-1, 0, 0, 1, 2 * CX, 0]; layers = layers.slice().reverse().map(ly => ({ ...ly, poly: ly.poly.map(q => apply(M, q)).reverse(), T: affine(M, ly.T) })); }
        else { const { L, stay, mov } = split(st, grabL), R = squash(L, -1); layers = stay.map(({ i, ...ly }) => ly).concat(mov.reverse().map(({ i, ...ly }) => ({ poly: ly.poly.map(q => apply(R, q)), T: affine(R, ly.T), tag: st.tag || ly.tag }))); }
        step++; tone(300 + step * 40, .1, .07, 'triangle'); prog = 0; grab = null; grabL = null;
        if (step >= model.steps.length) finishFold(); else api.guide(`${step + 1}/${model.steps.length} · ${model.steps[step].say}`);
      }
      function drawLayer(x, ly, M) { const T = M ? affine(M, ly.T) : ly.T, poly = M ? ly.poly.map(q => apply(M, q)) : ly.poly, det = T[0] * T[3] - T[1] * T[2];
        x.save(); x.beginPath(); poly.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath();
        x.save(); x.shadowColor = 'rgba(40,25,10,.22)'; x.shadowBlur = 5; x.shadowOffsetY = 2; x.fillStyle = det > 0 ? paper : '#f4efe6'; x.fill(); x.restore();
        x.clip(); x.setTransform(T[0], T[1], T[2], T[3], T[4], T[5]); x.drawImage(det > 0 ? front : back, 0, 0); x.restore();
        x.save(); x.beginPath(); poly.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.strokeStyle = 'rgba(60,40,25,.28)'; x.lineWidth = 1.2; x.lineJoin = 'round'; x.stroke(); x.restore(); }
      function drawPaper(x) {
        const st = model && model.steps[step];
        if (phase === 'fold' && st && !st.flip && grab && grab.L) { const { L, stay, mov } = split(st, grab.L), R = squash(L, -1);           // 손으로 끄는 대로: 잡은 점이 손가락 자리로 오게 접힘
          stay.forEach(ly => drawLayer(x, ly)); x.save(); x.shadowColor = 'rgba(40,25,10,.35)'; x.shadowBlur = 14; x.shadowOffsetY = 6; mov.slice().reverse().forEach(ly => drawLayer(x, ly, R)); x.restore(); }
        else if (phase === 'fold' && st && st.flip && prog > 0) { const k = Math.cos(prog * Math.PI), M = [k, 0, 0, 1, CX * (1 - k), 0]; (k < 0 ? layers.slice().reverse() : layers).forEach(ly => drawLayer(x, ly, M)); }
        else layers.forEach(ly => drawLayer(x, ly));
      }
      function finishFold() { phase = model.face ? 'face' : 'done'; setBar();
        api.guide(model.face ? '완성! 펜으로 얼굴이나 장식을 그려 넣어도 돼요. 다 되면 "실에 꿰기"를 눌러요.' : '완성! "실에 꿰기"를 누르면 줄에 달려요.'); }
      function snapshot() { const o = cv(W, H), x = o.getContext('2d'); layers.forEach(ly => drawLayer(x, ly)); x.drawImage(deco, 0, 0);
        let x0 = W, y0 = H, x1 = 0, y1 = 0; layers.forEach(ly => ly.poly.forEach(q => { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }));
        const s = cv(150, 150), sx2 = s.getContext('2d'), w = x1 - x0, hh = y1 - y0, k = 140 / Math.max(w, hh); sx2.drawImage(o, x0, y0, w, hh, 75 - w * k / 2, 75 - hh * k / 2, w * k, hh * k); return s; }
      const tb = mk('div'); bar.replaceWith(tb); bar2.remove();
      const startFold = () => { newPaper(); step = 0; phase = 'fold'; dx2.clearRect(0, 0, W, H); setBar(); api.guide(`1/${model.steps.length} · ${model.steps[0].say} (점선은 추천이에요. 원하는 곳에 놓아도 돼요.)`); };
      const strPt = m => { const u = m.u, x = 20 + u * (W - 40), y = 60 + 2 * u * (1 - u) * 50; return { x, y }; };
      const hPt = m => { const p = strPt(m), sz = 100 * m.s, c = Math.cos(m.r), sn = Math.sin(m.r), hx = sz / 2 + 8, hy = sz + 8; return { x: p.x + hx * c - hy * sn, y: p.y + m.dy + hx * sn + hy * c }; };
      const hHit = q => { for (let i = made.length - 1; i >= 0; i--) { const m = made[i], p = strPt(m), sz = 100 * m.s, c = Math.cos(-m.r), sn = Math.sin(-m.r), dx = q.x - p.x, dy = q.y - p.y - m.dy, lx = dx * c - dy * sn, ly = dx * sn + dy * c; if (Math.abs(lx) < sz / 2 && ly > -10 && ly < sz) return i; } return -1; };
      function setBar() {
        const T = tools(tb);
        if (phase === 'pick') { const g2 = mk('div', 'tmodel'); tb.append(g2); Object.entries(MODELS).forEach(([key, m]) => { const e = mk('button', '', ''); e.append(oriIcon(key)); e.append(mk('span', '', m.name)); e.type = 'button'; e.addEventListener('click', () => { model = m; phase = 'paper'; paintPaper(); setBar(); api.guide(`${m.name}를 접어요. 종이를 꾸미고 "접기 시작"을 눌러요.`); }); g2.append(e); });
          if (made.length) { const r = T.row('고른 것'); if (made[hsel]) { T.chip(r, '빼기', () => { made.splice(hsel, 1); hsel = -1; if (!made.length) api.ready(false); setBar(); }); r.append(mk('span', 'thint', '끌어서 옮기고, ↻ 손잡이로 크기·회전')); } else r.append(mk('span', 'thint', '줄에 달린 걸 누르면 옮기거나 크기·회전을 바꿀 수 있어요')); tb.prepend(r.parentNode); }
          api.guide(made.length ? `줄에 ${made.length}개 달렸어요. 더 접거나 "트리에 달기"를 눌러요.` : '무엇을 접을까요?'); }
        else if (phase === 'paper') {
          const c1 = T.row('종이 색'); PAPERS.forEach(c => T.sw(c1, c, c === paper, '종이 색', () => { paper = c; paintPaper(); setBar(); }));
          const c2 = T.row('무늬'); [['dot', '물방울'], ['check', '체크'], ['flower', '꽃'], ['snow', '눈송이']].forEach(([k, n]) => T.chip(c2, n, () => pattern(k)));
          const c3 = T.row('펜'); PENS.forEach(c => T.sw(c3, c, c === pen, '펜 색', () => { pen = c; setBar(); })); c3.append(mk('span', 'thint', '종이 위에 그려요'));
          const a = T.acts(); T.sub(a, '다시 칠하기', () => paintPaper()); T.sub(a, '← 모양 다시 고르기', () => { phase = 'pick'; setBar(); }); T.go(a, '접기 시작 ▶', startFold);
        } else if (phase === 'fold') { const a = T.acts(); T.sub(a, '↺ 처음부터 다시 접기', startFold); }
        else if (phase === 'face' || phase === 'done') {
          if (phase === 'face') { const c = T.row('펜'); PENS.forEach(c2 => T.sw(c, c2, c2 === pen, '펜 색', () => { pen = c2; setBar(); })); c.append(mk('span', 'thint', '얼굴이나 장식을 그려요')); }
          const a = T.acts(); T.sub(a, '지우기', () => dx2.clearRect(0, 0, W, H)); T.go(a, '🧵 실에 꿰기', () => { made.push({ im: snapshot(), u: 0, s: 1, r: 0, dy: 0 }); made.forEach((m, i) => { m.u = (i + .5) / made.length; }); phase = 'pick'; hsel = made.length - 1; model = null; layers = []; dx2.clearRect(0, 0, W, H); api.ready(true); setBar(); });
        }
      }
      // ── 손 움직임
      const inPoly = (q, p) => { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) if ((p[i][1] > q[1]) !== (p[j][1] > q[1]) && q[0] < (p[j][0] - p[i][0]) * (q[1] - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) c = !c; return c; };
      const PV = { x: 144, y: 24, s: 512 };                                          // 꾸미기 화면의 종이 위치
      can.addEventListener('pointerdown', e => { const q = at(e, can), qq = [q.x, q.y]; e.preventDefault(); can.setPointerCapture(e.pointerId);
        if (phase === 'paper') { last = { x: (q.x - PV.x) / PV.s * PT, y: (q.y - PV.y) / PV.s * PT }; draw(last, last); return; }
        if (phase === 'face') { last = q; return; }
        if (phase === 'pick' && made.length) { const m = made[hsel]; if (m) { const hp = hPt(m); if (Math.hypot(q.x - hp.x, q.y - hp.y) < 20) { const p = strPt(m); hdrag = { handle: 1, s0: m.s, r0: m.r, d0: Math.hypot(hp.x - p.x, hp.y - p.y - m.dy), a0: Math.atan2(hp.y - p.y - m.dy, hp.x - p.x) }; return; } }
          const i = hHit(q); hsel = i; if (i >= 0) hdrag = { dx: q.x - strPt(made[i]).x, dy0: made[i].dy, y0: q.y }; setBar(); return; }
        if (phase !== 'fold' || anim) return; const st = model.steps[step];
        if (st.flip) { anim = { to: 1 }; return; }
        const cand = layers.filter(ly => applies(st, ly)), near = p => p.some((A, i) => { const B = p[(i + 1) % p.length], vx = B[0] - A[0], vy = B[1] - A[1], l2 = vx * vx + vy * vy || 1, u = Math.max(0, Math.min(1, ((qq[0] - A[0]) * vx + (qq[1] - A[1]) * vy) / l2)); return Math.hypot(qq[0] - A[0] - vx * u, qq[1] - A[1] - vy * u) < 18; });
        if (cand.some(ly => inPoly(qq, ly.poly) || near(ly.poly))) grab = { X: qq, L: null }; });
      can.addEventListener('pointermove', e => { const q = at(e, can);
        if (phase === 'paper' && last) { const p = { x: (q.x - PV.x) / PV.s * PT, y: (q.y - PV.y) / PV.s * PT }; draw(last, p); last = p; return; }
        if (phase === 'pick' && hdrag && made[hsel]) { const m = made[hsel], p = strPt(m);
          if (hdrag.handle) { m.s = Math.max(.4, Math.min(2.2, hdrag.s0 * Math.hypot(q.x - p.x, q.y - p.y - m.dy) / hdrag.d0)); m.r = hdrag.r0 + Math.atan2(q.y - p.y - m.dy, q.x - p.x) - hdrag.a0; }
          else { m.u = Math.max(.03, Math.min(.97, (q.x - hdrag.dx - 20) / (W - 40))); m.dy = Math.max(-20, Math.min(120, hdrag.dy0 + q.y - hdrag.y0)); } return; }
        if (phase === 'face' && last) { dx2.strokeStyle = pen; dx2.lineWidth = 6; dx2.lineCap = dx2.lineJoin = 'round'; dx2.beginPath(); dx2.moveTo(last.x, last.y); dx2.lineTo(q.x + .01, q.y); dx2.stroke(); last = q; return; }
        if (grab) { const X = grab.X, l = Math.hypot(X[0] - q.x, X[1] - q.y); grab.L = l > 8 ? { p: [(X[0] + q.x) / 2, (X[1] + q.y) / 2], n: [(X[0] - q.x) / l, (X[1] - q.y) / l] } : null; } });
      const up = () => { last = null; hdrag = null; if (grab) { if (grab.L) { grabL = grab.L; grab = null; commit(model.steps[step]); } else grab = null; } }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function draw(a, b) { fx.strokeStyle = pen; fx.lineWidth = 9; fx.lineCap = fx.lineJoin = 'round'; fx.beginPath(); fx.moveTo(a.x, a.y); fx.lineTo(b.x + .01, b.y); fx.stroke(); }
      function frame(t) {
        if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (t - (t0 || t)) / 1000); t0 = t;
        if (anim) { prog += (anim.to ? 1 : -1) * dt * 3.2; if (prog >= 1) { prog = 1; anim = null; commit(model.steps[step]); } else if (prog <= 0) { prog = 0; anim = null; } }
        g.fillStyle = '#efe6d6'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(160,120,80,.06)'; for (let y = 0; y < H; y += 24) g.fillRect(0, y, W, 12);
        if (phase === 'paper') { g.save(); g.shadowColor = 'rgba(60,35,15,.3)'; g.shadowBlur = 12; g.shadowOffsetY = 5; g.drawImage(front, PV.x, PV.y, PV.s, PV.s); g.restore(); }
        else if (phase === 'fold' || phase === 'face' || phase === 'done') {
          drawPaper(g); g.drawImage(deco, 0, 0);
          const st = phase === 'fold' && model.steps[step];
          if (st && !st.flip && !anim) { const L = lineOf(st), dxl = -L.n[1], dyl = L.n[0];                 // 접는 선(점선)과 화살표
            g.save(); g.setLineDash([12, 9]); g.strokeStyle = 'rgba(200,40,40,.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(L.p[0] - dxl * 600, L.p[1] - dyl * 600); g.lineTo(L.p[0] + dxl * 600, L.p[1] + dyl * 600); g.stroke(); g.setLineDash([]);
            if (grab) { g.restore(); } else { const { mov } = split(st); g.globalAlpha = .12 + .08 * Math.sin(t / 250); g.fillStyle = '#fff'; mov.forEach(ly => { g.beginPath(); ly.poly.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); }); g.globalAlpha = 1;
            const [X, Y] = st.move, mx = (X[0] + Y[0]) / 2 + dxl * 30, my = (X[1] + Y[1]) / 2 + dyl * 30; g.strokeStyle = 'rgba(60,40,25,.75)'; g.lineWidth = 3; g.beginPath(); g.moveTo(X[0], X[1]); g.quadraticCurveTo(mx, my, Y[0], Y[1]); g.stroke();
            const an = Math.atan2(Y[1] - my, Y[0] - mx); g.beginPath(); g.moveTo(Y[0], Y[1]); g.lineTo(Y[0] - 14 * Math.cos(an - .45), Y[1] - 14 * Math.sin(an - .45)); g.lineTo(Y[0] - 14 * Math.cos(an + .45), Y[1] - 14 * Math.sin(an + .45)); g.closePath(); g.fillStyle = 'rgba(60,40,25,.75)'; g.fill(); g.restore(); } }
          if (st && st.flip && !anim) { g.fillStyle = 'rgba(60,40,25,.7)'; g.font = '700 22px Gowun Batang,serif'; g.textAlign = 'center'; g.fillText('↔ 종이를 눌러서 뒤집어요', CX, H - 24); }
        }
        if (phase === 'pick' && !made.length) { g.fillStyle = 'rgba(80,55,35,.55)'; g.font = '700 26px Gowun Batang,serif'; g.textAlign = 'center'; g.fillText('아래에서 접을 모양을 골라요', W / 2, H / 2 - 10); g.font = '18px Gowun Batang,serif'; g.fillText('다 접으면 여기 실에 하나씩 꿰어져요', W / 2, H / 2 + 24); }
        if (made.length && phase === 'pick') { g.strokeStyle = 'rgba(120,90,60,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(20, 60); g.quadraticCurveTo(W / 2, 110, W - 20, 60); g.stroke();   // 다른 걸 접을 땐 줄을 숨김
          made.forEach((m, i) => { const p = strPt(m), sz = 100 * m.s; g.save(); g.translate(p.x, p.y + m.dy); g.rotate(m.r); g.drawImage(m.im, -sz / 2, -6, sz, sz); g.restore();
            if (i === hsel) { g.save(); g.translate(p.x, p.y + m.dy); g.rotate(m.r); g.setLineDash([6, 5]); g.strokeStyle = 'rgba(192,57,43,.8)'; g.lineWidth = 2; g.strokeRect(-sz / 2 - 4, -10, sz + 8, sz + 8); g.restore(); g.setLineDash([]);
              const hp = hPt(m); g.fillStyle = '#fff'; g.strokeStyle = '#c0392b'; g.lineWidth = 3; g.beginPath(); g.arc(hp.x, hp.y, 12, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#c0392b'; g.font = '15px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('↻', hp.x, hp.y + 1); g.textBaseline = 'alphabetic'; } }); }
      }
      window.__orLayers = () => layers.map(l => ({ tag: l.tag, poly: l.poly.map(q => q.map(v => Math.round(v))) }));
      window.__orStep = () => phase === 'fold' && model && model.steps[step] ? (model.steps[step].flip ? 'flip' : model.steps[step].move) : null;   // 시험용
      setBar(); api.ready(false); requestAnimationFrame(frame);
      return { reset() { made = []; phase = 'pick'; model = null; layers = []; dx2.clearRect(0, 0, W, H); api.ready(false); setBar(); }, stop() { alive = false; },
        result() { if (!made.length) return null; let y1 = 0; made.forEach(m => { y1 = Math.max(y1, strPt(m).y + m.dy + 110 * m.s); }); const o = cv(W, Math.min(H, y1 + 10)), x = o.getContext('2d');
          x.strokeStyle = 'rgba(120,90,60,.8)'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(20, 60); x.quadraticCurveTo(W / 2, 110, W - 20, 60); x.stroke();
          made.forEach(m => { const p = strPt(m), sz = 100 * m.s; x.save(); x.translate(p.x, p.y + m.dy); x.rotate(m.r); x.drawImage(m.im, -sz / 2, -6, sz, sz); x.restore(); });
          const k = 420 / W, r = cv(420, Math.round(o.height * k)); r.getContext('2d').drawImage(o, 0, 40, W, o.height - 40, 0, 40 * k - 16, 420, (o.height - 40) * k); return { img: r.toDataURL('image/png') }; } };
    },
  };
  /* ───────── 가랜드: 바늘에 꿴 실로 팝콘·크랜베리·말린 오렌지를 하나씩 꿰기 ───────── */
  plays.garland = {
    title: '가랜드 꿰기', doneLabel: '트리에 두르기', doneMsg: '내가 꿴 가랜드를 트리에 둘러 뒀어요.',
    start(board, api) {
      board.className = 'pboard garland2';
      const W = 800, H = 520, can = cv(W, H, 'gacv'), g = can.getContext('2d'), tb = mk('div'); board.append(can, tb);
      const KINDS = {
        pop: { name: '팝콘', r: 15, draw(x, X, Y, s) { x.fillStyle = '#fbf3df'; for (let k = 0; k < 5; k++) { const a = k * 1.26 + s, rr = 8; x.beginPath(); x.arc(X + Math.cos(a) * 6, Y + Math.sin(a) * 6, rr, 0, 7); x.fill(); } x.fillStyle = '#efd9a6'; x.beginPath(); x.arc(X + 2, Y + 3, 5, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(X - 4, Y - 5, 4, 0, 7); x.fill(); } },
        berry: { name: '크랜베리', r: 11, draw(x, X, Y) { const gr = x.createRadialGradient(X - 4, Y - 4, 1, X, Y, 12); gr.addColorStop(0, '#ff7a7a'); gr.addColorStop(.5, '#c4202e'); gr.addColorStop(1, '#6e0f18'); x.fillStyle = gr; x.beginPath(); x.arc(X, Y, 11, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.arc(X - 4, Y - 4, 2.5, 0, 7); x.fill(); } },
        orange: { name: '말린 오렌지', r: 19, draw(x, X, Y, s) { x.save(); x.translate(X, Y); x.rotate(s); x.fillStyle = '#c96a1b'; x.beginPath(); x.arc(0, 0, 19, 0, 7); x.fill(); x.fillStyle = '#f2a33a'; x.beginPath(); x.arc(0, 0, 16, 0, 7); x.fill(); x.strokeStyle = '#fbe0a6'; x.lineWidth = 1.6; for (let k = 0; k < 8; k++) { x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(k * .785) * 15, Math.sin(k * .785) * 15); x.stroke(); } x.fillStyle = '#fbe0a6'; x.beginPath(); x.arc(0, 0, 2.5, 0, 7); x.fill(); x.restore(); } },
        bead: { name: '금 구슬', r: 9, draw(x, X, Y) { const gr = x.createRadialGradient(X - 3, Y - 3, 1, X, Y, 10); gr.addColorStop(0, '#fff3c4'); gr.addColorStop(.5, '#d9a53c'); gr.addColorStop(1, '#7d5317'); x.fillStyle = gr; x.beginPath(); x.arc(X, Y, 9, 0, 7); x.fill(); } },
        star: { name: '나무 별', r: 14, draw(x, X, Y, s) { x.save(); x.translate(X, Y); x.rotate(s); x.fillStyle = '#b07a48'; x.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 6 : 14, a = -Math.PI / 2 + k * Math.PI / 5; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill(); x.strokeStyle = '#7d522c'; x.lineWidth = 1.2; x.stroke(); x.restore(); } },
      };
      const BOWLS = [['pop', 120], ['berry', 280], ['orange', 440], ['bead', 580], ['star', 700]], BOWLY = 450;
      let loose = [], beads = [], rope = [], needle = { x: 400, y: 240, a: 0 }, held = false, last = null, alive = true, t0 = 0, sparkles = [];
      const SEG = 9, NSEG = 70;
      function initRope() { rope = []; for (let i = 0; i < NSEG; i++) rope.push({ x: needle.x - i * SEG * .7, y: needle.y + i * 2, px: needle.x - i * SEG * .7, py: needle.y + i * 2 }); }
      function refill() { loose = loose.filter(o => !o.used); BOWLS.forEach(([k, bx]) => { const n = loose.filter(o => o.k === k).length; for (let i = n; i < 7; i++) loose.push({ k, x: bx + rnd(-46, 46), y: BOWLY + rnd(-20, 16), s: rnd(0, 6.28) }); }); }
      function paint() { const T = tools(tb), c = T.row('꿴 것'); c.append(mk('span', 'thint', beads.length ? `${beads.length}개 · ` + Object.entries(beads.reduce((m, b) => (m[b.k] = (m[b.k] || 0) + 1, m), {})).map(([k, n]) => `${KINDS[k].name} ${n}`).join(' · ') : '바늘을 잡고 그릇 속 재료를 콕 찔러 꿰어요'));
        const a = T.acts(); T.sub(a, '하나 빼기', () => { beads.pop(); paint(); api.ready(beads.length >= 6); }); T.sub(a, '모두 빼기', () => { beads = []; paint(); api.ready(false); }); }
      const eye = () => ({ x: needle.x - Math.cos(needle.a) * 46, y: needle.y - Math.sin(needle.a) * 46 });
      can.addEventListener('pointerdown', e => { const q = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId); held = true; last = q; needle.x = q.x; needle.y = q.y; poke(q); });
      can.addEventListener('pointermove', e => { const q = at(e, can); if (last) { const dx = q.x - last.x, dy = q.y - last.y; if (Math.hypot(dx, dy) > 2) { let d = Math.atan2(dy, dx) - needle.a; d = (d + Math.PI * 3) % (Math.PI * 2) - Math.PI; needle.a += d * .25; } } needle.x = q.x; needle.y = q.y; last = q; if (held) poke(q); });
      const up = () => { held = false; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function poke(q) {                                                              // 바늘 끝이 재료를 지나가면 쏙 꿰어짐
        if (beads.length >= 30) { api.guide('실이 가득 찼어요! "트리에 두르기"를 눌러요.'); return; }
        const nowT = performance.now(); if (nowT - (poke.last || 0) < 260) return;   // 하나씩 꿰어지게
        for (const o of loose) { if (o.used) continue; if (Math.hypot(o.x - q.x, o.y - q.y) < KINDS[o.k].r + 4) { poke.last = nowT; o.used = true; beads.push({ k: o.k, s: o.s, slide: 0 }); tone(o.k === 'bead' ? 1200 : o.k === 'berry' ? 520 : 380, .08, .06, 'triangle'); for (let i = 0; i < 6; i++) sparkles.push({ x: o.x, y: o.y, vx: rnd(-60, 60), vy: rnd(-80, -20), t: 0 }); setTimeout(refill, 600); paint(); if (beads.length >= 6) { api.ready(true); api.guide(`${beads.length}개 꿰었어요. 더 꿰거나 "트리에 두르기"를 눌러요.`); } break; } }
      }
      function stepRope(dt) { const e2 = eye(); rope[0].x = e2.x; rope[0].y = e2.y;
        for (let i = 1; i < rope.length; i++) { const p = rope[i], vx = (p.x - p.px) * .97, vy = (p.y - p.py) * .97; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + 900 * dt * dt; if (p.y > H - 8) p.y = H - 8; }
        for (let k = 0; k < 6; k++) for (let i = 1; i < rope.length; i++) { const a = rope[i - 1], b = rope[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, df = (d - SEG) / d; if (i === 1) { b.x -= dx * df; b.y -= dy * df; } else { a.x += dx * df * .5; a.y += dy * df * .5; b.x -= dx * df * .5; b.y -= dy * df * .5; } } }
      function frame(t) {
        if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.033, (t - (t0 || t)) / 1000); t0 = t;
        stepRope(dt); for (const b of beads) b.slide = Math.min(1, b.slide + dt * 3);
        g.fillStyle = '#efe6d6'; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(160,120,80,.06)'; for (let y = 0; y < H; y += 24) g.fillRect(0, y, W, 12);
        // 재료 그릇
        BOWLS.forEach(([k, bx]) => { g.fillStyle = 'rgba(120,80,50,.18)'; g.beginPath(); g.ellipse(bx, BOWLY + 36, 66, 12, 0, 0, 7); g.fill(); g.fillStyle = '#d9c3a0'; g.beginPath(); g.ellipse(bx, BOWLY, 64, 30, 0, 0, Math.PI); g.lineTo(bx - 64, BOWLY); g.fill(); g.fillStyle = 'rgba(80,55,35,.65)'; g.font = '15px Gowun Batang,serif'; g.textAlign = 'center'; g.fillText(KINDS[k].name, bx, BOWLY + 58); });
        for (const o of loose) if (!o.used) KINDS[o.k].draw(g, o.x, o.y, o.s);
        g.fillStyle = 'rgba(208,186,150,.92)'; BOWLS.forEach(([k, bx]) => { g.beginPath(); g.ellipse(bx, BOWLY + 10, 64, 22, 0, 0, Math.PI); g.fill(); });              // 그릇 앞면
        // 실
        g.strokeStyle = '#c9b48a'; g.lineWidth = 2; g.beginPath(); rope.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
        // 꿴 재료: 실을 따라 줄지어
        let idx = 2; beads.forEach((b, i) => { const r = KINDS[b.k].r, step2 = Math.max(1, Math.round((r * 2 + 2) / SEG)); idx += step2 / 2; const target = Math.min(rope.length - 1, Math.round(idx) + Math.round((beads.length - 1 - i) * 0)), p = rope[Math.min(rope.length - 1, Math.round(idx))]; idx += step2 / 2; KINDS[b.k].draw(g, p.x, p.y, b.s); });
        // 바늘
        const e2 = eye(); g.strokeStyle = '#aab3bc'; g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(needle.x, needle.y); g.lineTo(e2.x, e2.y); g.stroke(); g.strokeStyle = '#e8edf2'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(needle.x - Math.cos(needle.a) * 4, needle.y - Math.sin(needle.a) * 4 - 1); g.lineTo(e2.x, e2.y - 1); g.stroke();
        g.strokeStyle = '#7d858d'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(e2.x, e2.y, 3.5, 2, needle.a, 0, 7); g.stroke();
        sparkles = sparkles.filter(p => (p.t += dt) < .5); for (const p of sparkles) { p.x += p.vx * dt; p.y += p.vy * dt; g.fillStyle = `rgba(255,215,120,${1 - p.t / .5})`; g.font = '14px serif'; g.fillText('✦', p.x, p.y); }
      }
      initRope(); refill(); paint(); api.ready(false); api.guide('바늘을 잡고(누른 채) 그릇 속 재료 위로 지나가면 쏙 꿰어져요. 순서를 마음대로 섞어 보세요.'); requestAnimationFrame(frame);
      return { reset() { beads = []; loose = []; refill(); paint(); api.ready(false); }, stop() { alive = false; },
        result() { if (beads.length < 6) return null; const o = cv(420, 170), x = o.getContext('2d'), n = beads.length, pts = [];
          for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([10 + u * 400, 20 + Math.sin(u * Math.PI) * 110]); }
          x.strokeStyle = '#c9b48a'; x.lineWidth = 2; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke();
          beads.forEach((b, i) => { const u = (i + .5) / n, p = pts[Math.round(u * 60)]; KINDS[b.k].draw(x, p[0], p[1], b.s); }); return { img: o.toDataURL('image/png') }; } };
    },
  };
  /* ───────── 귤 껍질 모양 까기: 한 번에 이어지게 칼집 → 펼치면 모양이 나와요 ───────── */
  plays.mandarin = {
    title: '귤 껍질 모양 까기', doneLabel: '귤 작품 남기기', doneMsg: '귤 껍질을 펼쳐 작품을 만들었어요! 창가 귤 바구니 옆에 놓아 뒀어요.',
    start(board, api) {
      // 귤 껍질 소리: 손톱으로 껍질을 누르며 지나가는 부드러운 "스윽", 펼칠 때는 껍질이 살살 떨어지는 소리
      let lastPeel = 0;
      const peelSnd = big => { const now = performance.now(); if (!big && now - lastPeel < 85) return; lastPeel = now;
        try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const t = AC.currentTime, d = big ? .55 : rnd(.07, .11), n = Math.ceil(AC.sampleRate * d), bf = AC.createBuffer(1, n, AC.sampleRate), ch = bf.getChannelData(0);
          let b = 0; for (let i = 0; i < n; i++) { const u = i / n, env = big ? Math.sin(u * Math.PI) * (.6 + .4 * Math.random()) * (Math.random() < .015 ? 2.2 : 1) : Math.sin(u * Math.PI); b = b * .82 + (Math.random() * 2 - 1) * .18; ch[i] = b * env; }   // 부드러운(갈색) 잡음
          const src = AC.createBufferSource(), lp = AC.createBiquadFilter(), gn = AC.createGain(); src.buffer = bf; lp.type = 'lowpass'; lp.frequency.setValueAtTime(big ? 1800 : rnd(1100, 1600), t); if (big) lp.frequency.linearRampToValueAtTime(700, t + d); lp.Q.value = .5;
          gn.gain.value = (big ? .5 : .32) * VOL; src.connect(lp); lp.connect(gn); gn.connect(AC.destination); src.start(t);
          if (!big && Math.random() < .25) { const o = AC.createOscillator(), g2 = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(rnd(180, 240), t); o.frequency.exponentialRampToValueAtTime(90, t + .06); g2.gain.setValueAtTime(.025 * VOL, t); g2.gain.exponentialRampToValueAtTime(.0005, t + .07); o.connect(g2); g2.connect(AC.destination); o.start(t); o.stop(t + .08); }   // 즙이 살짝 나는 톡
        } catch (e) { /* 소리 없음 */ } };
      board.className = 'pboard mdshape';
      const W = 800, H = 540, can = cv(W, H, 'mdcv'), g = can.getContext('2d'); board.append(can);
      const fruitI = pic('md_whole.jpg'), fleshI = pic('md_open.jpg');
      const SRC = { x: 328, y: 326, r: 196 }, FL = { x: 300, y: 300, r: 232 }, CX = 400, CY = 272, R = 100, ZC = 2.05, ST = 1.55 * R, PR = 258, T2 = Math.PI * 2;
      /* 모양 도우미 (u: 옆, v: 밖으로, 귤 반지름 단위) */
      const arcU = (cx, cy, r, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => { const t = a0 + (a1 - a0) * i / n; return [cx + Math.cos(t) * r, cy + Math.sin(t) * r]; });
      const mir = P => P.map(([u, v]) => [-u, v]).reverse();
      function limb(wb, wt, len, o = {}) { const off = o.off || (() => 0), n = 16, L = [], Rr = [];
        for (let i = 0; i <= n; i++) { const v = len * i / n, w = (wb + (wt - wb) * i / n) / 2; L.push([off(v) - w, v]); Rr.push([off(v) + w, v]); }
        const cx = off(len), r = wt / 2; let tip;
        if (o.hand) tip = [[cx - r, len], [cx - r * 1.6, len + r * .9], [cx - r * .9, len + r * 1.2], [cx - r * .55, len + r * 2.1], [cx - r * .05, len + r * 1.4], [cx + r * .35, len + r * 2.3], [cx + r * .8, len + r * 1.3], [cx + r * 1.6, len + r * 1.4], [cx + r, len]];
        else if (o.foot) tip = arcU(cx + r * .45, len, r * 1.35, Math.PI, 0, 12);
        else if (o.point) tip = [[cx, len + o.point]];
        else tip = arcU(cx, len, r, Math.PI, 0, 10);
        return L.concat(tip, Rr.reverse()); }
      // 목 + 동그란 머리 (+ 귀)
      function head(nw, nl, hr, ear) { const a = Math.asin(Math.min(.99, nw / 2 / hr)), c = nl + hr * Math.cos(a), out = [[-nw / 2, 0], [-nw / 2, nl]];
        for (let i = 0; i <= 60; i++) { const t = -(Math.PI - a) + 2 * (Math.PI - a) * i / 60; let r = hr; if (ear) { const d = Math.abs(Math.abs(t) - ear.a); if (d < ear.w) r += ear.h * (ear.round ? Math.sqrt(1 - (d / ear.w) ** 2) : 1 - d / ear.w); } out.push([Math.sin(t) * r, c + Math.cos(t) * r]); }
        return out.concat([[nw / 2, nl], [nw / 2, 0]]); }
      function petal(wb, wm, len) { const n = 18, L = [], Rr = []; for (let i = 0; i <= n; i++) { const t = i / n, w = (wb / 2) * (1 - t) + (wm / 2) * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (1 - t * .35); L.push([-w, len * t]); Rr.push([w, len * t]); } return L.concat([[0, len * 1.06]], Rr.reverse()); }
      const eleHead = (() => { const ear = arcU(-.36, .5, .27, -.45, -5.2, 30), out = [[-.1, 0], [-.1, .2]].concat(ear, [[-.07, .74], [-.07, 1.02], [-.13, 1.16], [-.05, 1.24], [.04, 1.19], [.07, 1.02], [.07, .74]]);
        return out.concat(mir(ear), [[.1, .2], [.1, 0]]); })();
      const F = (a, pts, face) => ({ a, pts, face });
      const dot = (u, v) => [[u, v], [u, v + .005]];
      const SHAPES = [
        { key: 'person', name: '사람', side: 'pith', cap: 'flesh', flaps: [F(0, head(.3, .14, .36), [dot(-.12, .58), dot(.12, .58), [[-.14, .43], [-.07, .37], [0, .35], [.07, .37], [.14, .43]]]), F(1.4, limb(.3, .2, .82, { hand: 1 })), F(-1.4, mir(limb(.3, .2, .82, { hand: 1 }))), F(2.62, limb(.46, .36, .72, { foot: 1 })), F(-2.62, mir(limb(.46, .36, .72, { foot: 1 })))] },
        { key: 'turtle', name: '거북이', side: 'skin', cap: 'keep', flaps: [F(0, head(.2, .1, .2), [dot(-.08, .34), dot(.08, .34)]), ...[.92, -.92, 2.28, -2.28].map(a => F(a, petal(.3, .44, Math.abs(a) < 2 ? .56 : .46))), F(Math.PI, limb(.18, .02, .2, { point: .03 }))] },
        { key: 'snowman', name: '눈사람', side: 'skin', cap: 'keep', capFace: [[[-22, -6], [-22, -4]], [[22, -6], [22, -4]], [[0, 20], [0, 22]], [[0, 44], [0, 46]]], flaps: [F(0, head(.3, .12, .4), [[[-.2, .62], [-.14, .68], [-.08, .62]], [[.08, .62], [.14, .68], [.2, .62]], [[-.03, .52], [0, .47], [.03, .52]], [[-.15, .38], [-.07, .33], [0, .32], [.07, .33], [.15, .38]]]), F(1.45, limb(.12, .06, 1.0)), F(-1.45, limb(.12, .06, 1.0))] },
        { key: 'flower', name: '꽃', side: 'pith', cap: 'roll', flaps: Array.from({ length: 8 }, (_, i) => F(i * Math.PI / 4, petal(.36, .56, .72))) },
        { key: 'elephant', name: '코끼리', side: 'skin', cap: 'keep', flaps: [F(0, eleHead, [dot(-.12, .58), dot(.12, .58)]), F(2.25, limb(.3, .28, .34)), F(-2.25, limb(.3, .28, .34)), F(2.85, limb(.3, .28, .34)), F(-2.85, limb(.3, .28, .34)), F(1.55, limb(.08, .05, .36))] },
        { key: 'snake', name: '뱀', spiral: true },
        { key: 'cat', name: '고양이', side: 'skin', cap: 'keep', flaps: [F(0, head(.28, .1, .34, { a: .62, w: .3, h: .22 }), [[[-.17, .5], [-.12, .55], [-.07, .5]], [[.07, .5], [.12, .55], [.17, .5]], [[-.03, .42], [.03, .42], [0, .39], [-.03, .42]], [[-.36, .44], [-.14, .42]], [[.36, .44], [.14, .42]], [[-.36, .36], [-.14, .38]], [[.36, .36], [.14, .38]]]), F(1.25, limb(.22, .18, .34)), F(-1.25, limb(.22, .18, .34)), F(2.45, limb(.26, .22, .34)), F(-2.45, limb(.26, .22, .34)), F(Math.PI, limb(.1, .07, .62, { off: v => .1 * Math.sin(v * 6) }))] },
        { key: 'bunny', name: '토끼', side: 'pith', cap: 'flesh', flaps: [F(0, head(.28, .1, .32, { a: .3, w: .14, h: .55, round: 1 }), [dot(-.11, .46), dot(.11, .46), [[-.05, .36], [0, .33], [.05, .36]]]), F(1.3, limb(.2, .17, .3)), F(-1.3, limb(.2, .17, .3)), F(2.5, limb(.3, .26, .36, { foot: 1 })), F(-2.5, mir(limb(.3, .26, .36, { foot: 1 }))), F(Math.PI, limb(.16, .16, .1))] },
        { key: 'star', name: '불가사리', side: 'skin', cap: 'flesh', flaps: Array.from({ length: 5 }, (_, i) => F(i * T2 / 5, limb(.7, .12, 1.12))) },
        { key: 'octopus', name: '문어', side: 'skin', cap: 'keep', capFace: [[[-26, -10], [-26, -6]], [[26, -10], [26, -6]], [[-10, 16], [0, 22], [10, 16]]], flaps: Array.from({ length: 8 }, (_, i) => F(Math.PI / 8 + i * Math.PI / 4, limb(.3, .08, 1.15, { off: v => .16 * Math.sin(v * 4.6 + i) }))) },
      ];
      /* ── 모양 → 이어진 칼집 한 줄 (θ, s) ── */
      const jit = i => Math.sin(i * 12.9898) * 43758.5453 % 1;
      function outline(sh) { const fl = sh.flaps.slice().sort((p, q) => ((p.a % T2) + T2) % T2 - ((q.a % T2) + T2) % T2), n = fl.length, out = [];
        for (let i = 0; i < n; i++) { const f = fl[i], a = ((f.a % T2) + T2) % T2, prev = ((fl[(i - 1 + n) % n].a % T2) + T2) % T2, next = ((fl[(i + 1) % n].a % T2) + T2) % T2;
          const bl = a - (((a - prev) % T2 + T2) % T2 || T2) / 2, br = a + (((next - a) % T2 + T2) % T2 || T2) / 2;
          out.push({ th: bl, s: 0 }); f.pts.forEach(([u, v], k) => { const vv = (k === 0 || k === f.pts.length - 1) ? Math.max(v, .1) : v; out.push({ th: a + u / (1 + vv), s: Math.min(1.45, vv) * R * (1 + .008 * jit(k + i * 70)) }); }); if (i === n - 1) out.push({ th: br, s: 0 }); }
        return out; }
      const foldR = s => Math.max(3, R * (1 - s / ST));
      const P2 = (th, rho) => [CX + Math.sin(th) * rho, CY - Math.cos(th) * rho];
      function rhoAt(p, e) { const rf = foldR(p.s), rv = R + p.s * .06, rflat = R + p.s; if (e <= .5) { const k = e / .5, kk = k * k * (3 - 2 * k); return rf + (rv - rf) * kk; } const k = (e - .5) / .5; return rv + (rflat - rv) * (1 - (1 - k) * (1 - k)); }
      /* ── 뱀: 빙글빙글 한 줄 칼집 → 풀면 귤을 감은 뱀 ── */
      const TURNS = 3.3, NS = 160;
      function spiralBand() { const Th = TURNS * T2, A = [], B = [], ctr = []; for (let i = 0; i <= NS; i++) { const th = (Th - T2) * i / NS, ri = R * th / Th, ro = R * (th + T2) / Th; A.push(P2(th, Math.max(2, ri))); B.push(P2(th, Math.min(R, ro))); } return { A, B }; }
      function snakeBand() { const A = [], B = [], w0 = R / TURNS; let L = 0; const sb = spiralBand(); for (let i = 1; i <= NS; i++) { const m0 = [(sb.A[i - 1][0] + sb.B[i - 1][0]) / 2, (sb.A[i - 1][1] + sb.B[i - 1][1]) / 2], m1 = [(sb.A[i][0] + sb.B[i][0]) / 2, (sb.A[i][1] + sb.B[i][1]) / 2]; L += Math.hypot(m1[0] - m0[0], m1[1] - m0[1]); }
        const ravg = R + 34, phiMax = L / ravg;
        for (let i = 0; i <= NS; i++) { const u = i / NS, ph = -.4 + (1 - u) * phiMax * .98, r = R - 6 + (1 - u) * 62 + 6, wv = 3 * Math.sin(u * 40);
          let w = w0 * .78; if (u < .06) w *= .9 + (1 - u / .06) * .45; if (u > .8) w *= 1 - (u - .8) / .2 * .55;
          const cx = CX + Math.cos(ph) * (r + wv), cy = CY + Math.sin(ph) * (r + wv); A.push([cx + Math.cos(ph) * w / 2, cy + Math.sin(ph) * w / 2]); B.push([cx - Math.cos(ph) * w / 2, cy - Math.sin(ph) * w / 2]); }
        return { A, B, head: (() => { const ph = -.4 + phiMax * .98, r = R + 62; return { x: CX + Math.cos(ph) * r, y: CY + Math.sin(ph) * r, ph }; })() }; }
      /* ── 그리기 재료 ── */
      const tile = fn => { const S = 256, c = cv(S, S), x = c.getContext('2d'); fn(x, S); return c; };
      const pithT = tile((x, S) => { x.fillStyle = '#f4dcaa'; x.fillRect(0, 0, S, S); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${230 + Math.random() * 25 | 0},${195 + Math.random() * 45 | 0},${130 + Math.random() * 60 | 0},${Math.random() * .4})`; x.beginPath(); x.arc(Math.random() * S, Math.random() * S, Math.random() * 2.4 + .4, 0, 7); x.fill(); }
        x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 1; for (let i = 0; i < 70; i++) { const px = Math.random() * S, py = Math.random() * S, a = Math.random() * 6.3; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * 14, py + Math.sin(a + 1) * 14, px + Math.cos(a) * 26, py + Math.sin(a) * 26); x.stroke(); } });
      const skinT = tile((x, S) => { x.fillStyle = '#f28a2a'; x.fillRect(0, 0, S, S); for (let i = 0; i < 26; i++) { const gx = Math.random() * S, gy = Math.random() * S, gr = x.createRadialGradient(gx, gy, 0, gx, gy, 40 + Math.random() * 50); gr.addColorStop(0, Math.random() < .5 ? 'rgba(250,160,60,.35)' : 'rgba(200,90,15,.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, S, S); }
        for (let i = 0; i < 1400; i++) { const px = Math.random() * S, py = Math.random() * S, r = Math.random() * 1.6 + .5; x.fillStyle = 'rgba(170,70,10,.14)'; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); x.fillStyle = 'rgba(255,205,140,.3)'; x.beginPath(); x.arc(px - .6, py - .6, r * .55, 0, 7); x.fill(); } });
      const pithP = g.createPattern(pithT, 'repeat'), skinP = g.createPattern(skinT, 'repeat');
      /* ── 상태 ── */
      let si = 0, sh, OL, G, cov, cuts, phase, t0, pen, penC, ink, side, cap, alive = true, last, freeLoop, sp, stroke = null;
      const PENC = ['#2b1d16', '#d9473f'];
      const bar = mk('div', 'pbar mdbar'), pickRow = mk('div', 'mdpick'); board.append(pickRow, bar);
      function mkPick() { pickRow.textContent = ''; SHAPES.concat([{ name: '✎ 자유롭게' }]).forEach((r, i) => { const b = mk('button', 'mdchip' + (si === i ? ' on' : ''), r.name); b.type = 'button'; b.addEventListener('click', () => { si = i; reset(); }); pickRow.append(b); }); }
      const btn = (label, fn, cls = 'mdchip', on) => { const b = mk('button', cls + (on ? ' on' : ''), label); b.type = 'button'; b.addEventListener('click', fn); bar.append(b); return b; };
      const isFree = () => si === SHAPES.length;
      function paintBar() { bar.textContent = '';
        if (phase === 'cut') { const b = btn('껍질 펼치기', () => { if (!canOpen()) { api.guide(isFree() ? '꼭지를 빙 둘러 한 바퀴 이어지게 먼저 그려요.' : '노랗게 반짝이는 점선이 아직 덜 그은 곳이에요. 조금만 더 그어요!'); return; } openIt(); }, 'go'); if (!canOpen()) b.style.opacity = .6; if (!isFree()) btn('칼집 한 번에', () => { G.forEach((_, i) => cov.add(i)); paintBar(); hint(); }); else btn('다시 그리기', () => { freeLoop = null; cuts = []; paintBar(); hint(); }); return; }
        if (phase !== 'done') return;
        btn('✎ 펜', () => { pen = !pen; paintBar(); hint(); }, 'mdchip', pen); if (pen) { btn(penC ? '● 빨강' : '● 검정', () => { penC = 1 - penC; paintBar(); }); btn('한 획 지우기', () => ink.pop()); }
        if (!sh.spiral) { btn(side === 'pith' ? '껍질 뒤집기 (주황 면)' : '껍질 뒤집기 (하얀 면)', () => { side = side === 'pith' ? 'skin' : 'pith'; paintBar(); });
          btn({ flesh: '가운데: 알맹이', keep: '가운데: 껍질 모자', roll: '가운데: 돌돌 만 껍질' }[cap], () => { cap = { flesh: 'keep', keep: 'roll', roll: 'flesh' }[cap]; paintBar(); }); } }
      function hint() { if (phase === 'cut') { if (isFree()) api.guide(freeLoop ? '좋아요! \'껍질 펼치기\'를 눌러요. 그린 선 바깥 껍질이 펼쳐져요.' : '귤 꼭지를 빙 둘러 한 번에 이어지게 선을 그려요. 별·꽃잎처럼 들쭉날쭉하게 그리면 펼쳤을 때 그 모양이 나와요.');
          else { const c = Math.round(cov.size / G.length * 100); api.guide(sh.spiral ? `꼭지에서 시작해 빙글빙글 점선을 따라 한 줄로 칼집을 내요. (${c}%)` : `점선을 따라 한 번에 이어서 칼집을 내요. 다 그으면 펼쳐서 ${sh.name} 모양이 나와요. (${c}%)`); } }
        else if (phase === 'done') api.guide(pen ? '펜으로 얼굴이나 무늬를 그려요. 점선을 따라 그려도 되고 마음대로 그려도 돼요.' : `${isFree() ? '내가 만든 모양' : sh.name} 완성! ✎ 펜으로 얼굴을 그려 줄 수 있어요.`); }
      const canOpen = () => isFree() ? !!freeLoop : cov.size / G.length >= .68;
      function reset() { mkPick(); api.ready(false); pen = false; penC = 0; ink = []; cuts = []; freeLoop = null; phase = 'cut'; t0 = 0; stroke = null;
        sh = isFree() ? { key: 'free', name: '자유', side: 'pith', cap: 'flesh', free: true } : SHAPES[si]; side = sh.side || 'skin'; cap = sh.cap || 'flesh';
        OL = sh.spiral || sh.free ? null : outline(sh); sp = sh.spiral ? { s: spiralBand(), n: snakeBand() } : null; buildGuide(); paintBar(); hint(); }
      function buildGuide() { cov = new Set(); G = []; if (sh.free) return;
        let P; if (sh.spiral) { const Th = TURNS * T2; P = []; for (let i = 0; i <= 300; i++) { const th = Th * i / 300; P.push(P2(th, Math.max(1, R * th / Th))); } }
        else { P = OL.map(p => P2(p.th, foldR(p.s))); P.push(P[0]); }
        for (let i = 0; i < P.length - 1; i++) { const [x0, y0] = P[i], [x1, y1] = P[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3)); for (let k = 0; k < n; k++) G.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]); } }
      // 칼집 화면은 귤을 크게 보여 줌 → 손 위치를 귤 좌표로 바꿈
      const zoomNow = () => phase === 'cut' ? ZC : phase === 'open' ? ZC + (1 - ZC) * Math.min(1, ease((last - t0) / .6)) : 1;
      const ease = k => k < 0 ? 0 : k > 1 ? 1 : 1 - Math.pow(1 - k, 3);
      const toW = q => { const z = zoomNow(); return { x: CX + (q.x - CX) / z, y: CY + (q.y - CY) / z }; };
      can.addEventListener('pointerdown', e => { const q0 = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId);
        if (phase === 'cut') { const q = toW(q0); if (Math.hypot(q.x - CX, q.y - CY) > R + 8) return; stroke = [q]; cuts.push(stroke); if (sh.free) { freeLoop = null; cuts = [stroke]; paintBar(); } return; }
        if (phase === 'done' && pen) { stroke = { c: PENC[penC], p: [[q0.x, q0.y]] }; ink.push(stroke); } });
      can.addEventListener('pointermove', e => { if (!stroke) return; const q0 = at(e, can);
        if (phase === 'cut') { const q = toW(q0), p0 = stroke[stroke.length - 1]; if (Math.hypot(q.x - p0.x, q.y - p0.y) < 1.2) return; if (Math.hypot(q.x - CX, q.y - CY) > R + 4) return; stroke.push(q); peelSnd(false);
          if (!sh.free) { const before = canOpen(); G.forEach(([x, y], i) => { if (Math.hypot(x - q.x, y - q.y) < 11) cov.add(i); }); if (canOpen() !== before) { paintBar(); if (canOpen()) api.guide('좋아요! \'껍질 펼치기\'를 눌러요.'); } else if (stroke.length % 6 === 0) hint(); } return; }
        if (pen) stroke.p.push([q0.x, q0.y]); });
      const up = () => { if (phase === 'cut' && stroke && sh.free) freeClose(stroke); stroke = null; }; can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function freeClose(st) { if (st.length < 12) return; // 꼭지(가운데)를 한 바퀴 감쌌는지
        let tot = 0; for (let i = 0; i < st.length; i++) { const a = st[i], b = st[(i + 1) % st.length], a1 = Math.atan2(a.y - CY, a.x - CX), a2 = Math.atan2(b.y - CY, b.x - CX); let d = a2 - a1; d = Math.atan2(Math.sin(d), Math.cos(d)); tot += d; }
        if (Math.abs(tot) < 5.5) { api.guide('꼭지(가운데)를 빙 둘러 한 바퀴 이어지게 그려야 펼칠 수 있어요. 다시 그려 봐요.'); cuts = []; return; }
        const step = Math.max(1, Math.floor(st.length / 260)); freeLoop = st.filter((_, i) => i % step === 0).map(q => { const th = Math.atan2(q.x - CX, -(q.y - CY)), rho = Math.hypot(q.x - CX, q.y - CY); return { th, s: Math.max(0, Math.min(1.45 * R, ST * (1 - rho / R))) }; });
        // 각도가 이어지게 (펼칠 때 뒤집힘 방지)
        for (let i = 1; i < freeLoop.length; i++) { let d = freeLoop[i].th - freeLoop[i - 1].th; d = Math.atan2(Math.sin(d), Math.cos(d)); freeLoop[i].th = freeLoop[i - 1].th + d; }
        OL = freeLoop; paintBar(); hint(); }
      function openIt() { if (!canOpen() || phase !== 'cut') return; phase = 'open'; t0 = last; stroke = null; peelSnd(true); paintBar(); api.guide('껍질을 펼치는 중…'); }
      /* ── 그리기 ── */
      const path = (P, close = true) => { g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (close) g.closePath(); };
      function fruitSkin(clipFn, alpha = 1) { g.save(); g.globalAlpha = alpha; clipFn(); g.clip('evenodd'); if (fruitI.complete) { const k = R / SRC.r; g.drawImage(fruitI, CX - SRC.x * k, CY - SRC.y * k, 640 * k, 640 * k); } else { g.fillStyle = '#ef8a2c'; g.fillRect(CX - R, CY - R, 2 * R, 2 * R); }
        const shd = g.createRadialGradient(CX - R * .35, CY - R * .4, R * .1, CX, CY, R * 1.02); shd.addColorStop(0, 'rgba(255,245,220,.16)'); shd.addColorStop(.72, 'rgba(0,0,0,0)'); shd.addColorStop(1, 'rgba(90,30,0,.3)'); g.fillStyle = shd; g.fillRect(CX - R, CY - R, 2 * R, 2 * R); g.restore(); }
      function flesh() { g.save(); g.beginPath(); g.arc(CX, CY, R, 0, 7); g.clip(); if (fleshI.complete) { const k = R / FL.r * 1.06; g.drawImage(fleshI, CX - FL.x * k, CY - FL.y * k, 640 * k, 640 * k); } else { g.fillStyle = '#f6a14e'; g.fill(); }
        const fs = g.createRadialGradient(CX, CY, R * .55, CX, CY, R); fs.addColorStop(0, 'rgba(0,0,0,0)'); fs.addColorStop(1, 'rgba(150,70,10,.3)'); g.fillStyle = fs; g.fillRect(CX - R, CY - R, 2 * R, 2 * R); g.restore(); }
      function roll(alpha) { g.save(); g.globalAlpha = alpha; g.translate(CX, CY); g.lineCap = 'round'; const turns = 2.6, rr = 30; const sp2 = off => { g.beginPath(); for (let i = 0; i <= 140; i++) { const t = i / 140 * turns * T2, r = 3 + rr * i / 140 + off; i ? g.lineTo(Math.cos(t) * r, Math.sin(t) * r) : g.moveTo(Math.cos(t) * r, Math.sin(t) * r); } };
        g.shadowColor = 'rgba(70,40,10,.4)'; g.shadowBlur = 8; g.shadowOffsetY = 3; g.strokeStyle = '#d9721f'; g.lineWidth = 12; sp2(0); g.stroke(); g.shadowColor = 'transparent'; g.strokeStyle = '#f08d33'; g.lineWidth = 8; sp2(0); g.stroke(); g.strokeStyle = 'rgba(255,236,200,.9)'; g.lineWidth = 2.2; sp2(-4); g.stroke(); g.restore(); }
      function peelFace(P, face, edgeLight) { // 껍질 면 채우기 + 두께 테두리
        g.fillStyle = face === 'skin' ? skinP : pithP; g.fill('evenodd');
        if (face === 'pith') { const shd = g.createRadialGradient(CX, CY, R * .95, CX, CY, R + 60); shd.addColorStop(0, 'rgba(160,100,30,.35)'); shd.addColorStop(1, 'rgba(160,100,30,0)'); g.fillStyle = shd; g.fill('evenodd'); }
        else { const shd = g.createRadialGradient(CX, CY, R * .95, CX, CY, R + 120); shd.addColorStop(0, 'rgba(110,40,0,.18)'); shd.addColorStop(.4, 'rgba(255,200,140,.08)'); shd.addColorStop(1, 'rgba(255,220,170,.12)'); g.fillStyle = shd; g.fill('evenodd'); }
        g.lineJoin = 'round'; path(P); g.strokeStyle = face === 'skin' ? '#f8e8c8' : '#e8862e'; g.lineWidth = 3; g.stroke(); g.strokeStyle = face === 'skin' ? 'rgba(170,70,10,.55)' : 'rgba(255,250,236,.7)'; g.lineWidth = 1; g.stroke(); }
      function drawPeel(e) { // e: 점마다 다를 수 있게 함수
        const P = OL.map((p, i) => P2(p.th, rhoAt(p, e(p, i)))), avg = OL.reduce((a, p, i) => a + e(p, i), 0) / OL.length, face = avg > .5 ? side : 'skin', lift = Math.sin(Math.min(1, avg) * Math.PI);
        const ring = () => { path(P); g.moveTo(CX + R, CY); g.arc(CX, CY, R, 0, T2, true); };
        if (avg > .5) { g.save(); g.shadowColor = 'rgba(70,40,10,.32)'; g.shadowBlur = 6 + lift * 16; g.shadowOffsetX = 3 + lift * 5; g.shadowOffsetY = 4 + lift * 8; ring(); g.fillStyle = face === 'skin' ? '#e98a35' : '#f1d49c'; g.fill('evenodd'); g.restore(); }
        if (avg <= .5) { fruitSkin(ring); if (avg > 0) { ring(); g.fillStyle = `rgba(120,50,0,${avg / .5 * .35})`; g.fill('evenodd'); } return; }
        ring(); peelFace(P, face); }
      function drawSnake(k) { const { s, n } = sp, ePt = i => { const u = i / NS; return ease(Math.min(1, Math.max(0, (k * 1.5 - u * .5)))); };
        const A = s.A.map((p, i) => { const e = ePt(i); return [p[0] + (n.A[i][0] - p[0]) * e, p[1] + (n.A[i][1] - p[1]) * e]; }), B = s.B.map((p, i) => { const e = ePt(i); return [p[0] + (n.B[i][0] - p[0]) * e, p[1] + (n.B[i][1] - p[1]) * e]; });
        const P = A.concat(B.slice().reverse()); g.save(); g.shadowColor = 'rgba(70,40,10,.35)'; g.shadowBlur = 10; g.shadowOffsetY = 5; path(P); g.fillStyle = '#e98a35'; g.fill(); g.restore(); path(P); g.fillStyle = skinP; g.fill();
        g.lineJoin = 'round'; g.strokeStyle = '#f8e8c8'; g.lineWidth = 2.4; path(P); g.stroke(); g.strokeStyle = 'rgba(170,70,10,.5)'; g.lineWidth = 1; g.stroke();
        if (k >= 1) { const [hx, hy] = [(A[0][0] + B[0][0]) / 2, (A[0][1] + B[0][1]) / 2]; g.fillStyle = '#e98a35'; g.beginPath(); g.ellipse(hx, hy, 15, 12, n.head.ph + Math.PI / 2, 0, 7); g.fill(); g.strokeStyle = '#f8e8c8'; g.lineWidth = 2; g.stroke(); } }
      function plate() { g.fillStyle = '#e4d6c0'; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(160,120,80,.12)'; g.lineWidth = 2; for (let y = 8; y < H; y += 22) { g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(250, y + 6, 550, y - 6, W, y + 3); g.stroke(); }
        g.save(); g.shadowColor = 'rgba(80,60,40,.25)'; g.shadowBlur = 24; g.shadowOffsetY = 8; g.fillStyle = '#fbfbf9'; g.beginPath(); g.arc(CX, CY, PR, 0, 7); g.fill(); g.restore(); g.strokeStyle = 'rgba(180,190,200,.45)'; g.lineWidth = 2; g.beginPath(); g.arc(CX, CY, PR - 24, 0, 7); g.stroke(); }
      let clean = false;
      function render() { const z = zoomNow(), t = phase === 'cut' ? 0 : last - t0;
        g.setTransform(1, 0, 0, 1, 0, 0); plate(); g.setTransform(z, 0, 0, z, CX * (1 - z), CY * (1 - z));
        g.fillStyle = 'rgba(90,60,30,.22)'; g.beginPath(); g.ellipse(CX + 8, CY + 10, R * 1.04, R, 0, 0, 7); g.fill();
        const tu = Math.max(0, t - .6), capA = cap === 'keep' ? 1 : Math.max(0, 1 - tu / .4), uf = Math.max(0, tu - (cap === 'keep' ? 0 : .35));
        if (phase === 'open' && ((sh.spiral && uf >= 1.6) || (!sh.spiral && uf > 1.45))) { phase = 'done'; pen = !!(sh.flaps && sh.flaps.some(f => f.face)) || !!sh.capFace || sh.spiral; paintBar(); hint(); api.ready(true); [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, .4, .05, 'triangle'), i * 110)); }
        const prog = phase === 'done' ? 99 : uf;
        if (sh.spiral) { if (phase === 'cut' || prog <= 0) fruitSkin(() => { g.beginPath(); g.arc(CX, CY, R, 0, 7); }); else { flesh(); drawSnake(Math.min(1, prog / 1.6)); } }
        else if (phase === 'cut' && !OL) fruitSkin(() => { g.beginPath(); g.arc(CX, CY, R, 0, 7); });
        else { const eF = (p, i) => { if (phase === 'cut') return 0; const d = (((p.th % T2) + T2) % T2) / T2 * .3; return Math.max(0, Math.min(1, (prog - d) / 1.1)); };
          const fl = OL.map(p => P2(p.th, foldR(p.s))), done1 = OL.every((p, i) => eF(p, i) > .5);
          if (done1 || phase === 'done') drawPeel(eF);
          // 알맹이 / 모자
          flesh();
          if (cap === 'keep') fruitSkin(() => { g.beginPath(); g.arc(CX, CY, R, 0, 7); }); else if (capA > 0) fruitSkin(() => { path(fl); }, capA);
          if (cap === 'roll' && phase !== 'cut') roll(Math.min(1, tu / .4));
          if (!(done1 || phase === 'done')) drawPeel(eF); }
        // 칼집 점선과 그은 자국
        if (phase === 'cut') { if (G.length) { g.save(); g.setLineDash([3, 4]); g.lineWidth = 1.3; g.strokeStyle = 'rgba(255,250,235,.95)'; const P = sh.spiral ? null : OL.map(p => P2(p.th, foldR(p.s)));
            if (P) { path(P); g.stroke(); } else { const Th = TURNS * T2; g.beginPath(); for (let i = 0; i <= 300; i++) { const th = Th * i / 300, [x, y] = P2(th, Math.max(1, R * th / Th)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } g.restore(); }
          if (G.length && cov.size / G.length > .35) { g.fillStyle = 'rgba(255,240,120,.95)'; G.forEach(([x, y], i) => { if (!cov.has(i) && i % 3 === 0) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); } }); }
          g.lineCap = g.lineJoin = 'round'; cuts.forEach(c => { if (c.length < 2) return; g.strokeStyle = 'rgba(140,55,8,.85)'; g.lineWidth = 1.7; g.beginPath(); c.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); if (sh.free && freeLoop) g.closePath(); g.stroke(); g.strokeStyle = 'rgba(255,226,170,.75)'; g.lineWidth = .6; g.beginPath(); c.forEach((p, i) => i ? g.lineTo(p.x - .5, p.y - .5) : g.moveTo(p.x - .5, p.y - .5)); g.stroke(); });
          g.fillStyle = '#5f6e22'; g.beginPath(); g.arc(CX, CY, 3.5, 0, 7); g.fill(); }
        g.setTransform(1, 0, 0, 1, 0, 0);
        // 얼굴 점선 + 펜
        if (phase === 'done') { g.lineCap = g.lineJoin = 'round';
          if (!clean) { g.setLineDash([2, 5]); g.strokeStyle = 'rgba(70,50,40,.5)'; g.lineWidth = 2;
            const strokesW = []; (sh.flaps || []).forEach(f => (f.face || []).forEach(st => strokesW.push(st.map(([u, v]) => P2(f.a + u / (1 + v), R * (1 + v)))))); (cap === 'keep' && sh.capFace || []).forEach(st => strokesW.push(st.map(([x, y]) => [CX + x, CY + y])));
            if (sh.spiral) { const h = sp.n.head, ex = Math.cos(h.ph + Math.PI / 2) * 6, ey = Math.sin(h.ph + Math.PI / 2) * 6; strokesW.push([[h.x + ex, h.y + ey], [h.x + ex + .5, h.y + ey]], [[h.x - ex, h.y - ey], [h.x - ex + .5, h.y - ey]]); }
            strokesW.forEach(P => { g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (P.length === 2 && Math.hypot(P[0][0] - P[1][0], P[0][1] - P[1][1]) < 2) g.arc(P[0][0], P[0][1], 2.5, 0, 7); g.stroke(); }); g.setLineDash([]); }
          ink.forEach(st => { g.strokeStyle = st.c; g.lineWidth = 4; g.beginPath(); st.p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (st.p.length === 1) g.lineTo(st.p[0][0] + .2, st.p[0][1]); g.stroke(); }); } }
      function frame(ts) { if (!alive || !board.isConnected) return; last = ts / 1000; render(); requestAnimationFrame(frame); }
      last = performance.now() / 1000; reset(); requestAnimationFrame(frame);
      can._dbg = { guide: () => G.map(([x, y]) => [CX + (x - CX) * ZC, CY + (y - CY) * ZC]), phase: () => phase, open: () => openIt() };
      return { reset, result() { if (phase !== 'done') return null; clean = true; render(); clean = false; const o = cv(240, 240), x = o.getContext('2d'); x.drawImage(can, CX - PR - 4, CY - PR - 4, PR * 2 + 8, PR * 2 + 8, 0, 0, 240, 240); return { img: o.toDataURL('image/png'), shape: sh.key }; }, stop() { alive = false; } };
    },
  };

  /* ───────── 크리스마스 케이크 (언제나 놀이): 돌림판을 돌리며 스패출러로 크림 바르기 → 짤주머니·장식 올리기 ───────── */
  plays.cake = {
    title: '크리스마스 케이크', doneMsg: '크리스마스 케이크를 완성했어요!', free: true,
    start(board, api) {
      board.className = 'pboard cake';
      const W = 800, H = 533, can = cv(W, H, 'cakecv'), g = can.getContext('2d'); board.append(can);
      const bare = pic('cake_bare.jpg'), creamIm = pic('cake_cream.jpg'), spat = pic('cake_spat.png'), bag = pic('cake_bag.png');
      const DECO = [['berry', '딸기', 62], ['santa', '산타', 52], ['choc', '초콜릿', 58], ['mint', '민트', 40], ['tree', '트리', 50], ['flake', '눈꽃', 52]];
      const IM = Object.fromEntries(DECO.map(([k]) => [k, pic('cake_' + k + '.png')]));
      const CX = 399.4, RX = 226, TOPY = 167.3, RY = 22, BOTC = 322, SIDE = BOTC - TOPY;   // 케이크 윗면 타원과 옆면(그림 기준)
      const NA = 72, NB = 4, NR = 6, MW = 200, MH = 134;
      const bar = mk('div', 'pbar cakebar'); board.append(bar);
      let alive = true, t0 = 0, rot, w, tool, side, top, items, dabs, down, spinDrag, last, lastSnd, flick, done, view = 'side';
      const TCX = 400, TCY = 262, TR = 196;   // 위에서 내려다본 케이크 윗면
      const mcv = cv(MW, MH), mx = mcv.getContext('2d'), mdata = mx.createImageData(MW, MH), tmp = cv(W, H), tx = tmp.getContext('2d');
      const btns = {};
      const mkBtn = (k, label, img) => { const b = mk('button', 'cktool'); b.type = 'button'; b.title = b.ariaLabel = label; if (img) { const i = new Image(); i.src = 'assets/' + img; i.alt = ''; b.append(i); } else b.textContent = label; b.addEventListener('click', () => { tool = k; if (k === 'spat') view = 'side'; else if (coverage() >= .85) view = 'top'; paintBar(); hint(); }); bar.append(b); btns[k] = b; };
      mkBtn('spat', '스패출러', 'cake_spat.png'); mkBtn('bag', '짤주머니', 'cake_bag.png'); DECO.forEach(([k, n]) => mkBtn(k, n, 'cake_' + k + '.png'));
      const vbtn = mk('button', 'cktool ckview', '위에서 보기'); vbtn.type = 'button'; vbtn.addEventListener('click', () => { view = view === 'top' ? 'side' : 'top'; if (view === 'top' && tool === 'spat') tool = 'bag'; paintBar(); hint(); }); bar.append(vbtn);
      const paintBar = () => { for (const k in btns) { btns[k].setAttribute('aria-pressed', String(k === tool)); btns[k].disabled = k !== 'spat' && coverage() < .85; } vbtn.disabled = coverage() < .85; vbtn.textContent = view === 'top' ? '옆에서 보기' : '위에서 보기'; };
      function reset() { rot = 0; w = 0; tool = 'spat'; view = 'side'; side = new Float32Array(NA * NB); top = new Float32Array(NA * NR); items = []; dabs = []; down = null; spinDrag = null; done = false; api.ready(false); paintBar(); hint(); }
      function hint() { const c = coverage();
        api.guide(c < .85 ? (tool === 'spat' ? `아래 받침을 옆으로 휙 밀어 돌림판을 돌리고, 스패출러를 케이크에 대고 있으면 크림이 발려요. (${Math.round(c * 100)}%)` : '먼저 크림을 다 발라요.')
          : tool === 'spat' ? '크림을 다 발랐어요! 아래에서 짤주머니나 장식을 고르면 위에서 내려다보며 꾸밀 수 있어요.' : tool === 'bag' ? '위에서 내려다보며 짜요. 누른 채 그리면 크림이 이어서 나오고, 바깥 돌림판을 밀어 돌리면서 짜면 빙 둘러져요.' : '윗면을 눌러 장식을 올려요. 바깥 돌림판을 밀면 케이크가 같이 돌아가요.'); }
      function coverage() { let s = 0; for (const v of side) s += Math.min(1, v); for (const v of top) s += Math.min(1, v); return s / (side.length + top.length); }
      const wrap = u => ((u % 1) + 1) % 1;
      // 화면 자리 → 케이크 표면(옆면: 각도·높이 / 윗면: 각도·반지름)
      function where(q) { const dx = (q.x - CX) / RX, dy = (q.y - TOPY) / RY;
        if (dx * dx + dy * dy <= 1) return { top: true, u: wrap(Math.atan2(dy, dx) / 6.2832 + rot), r: Math.hypot(dx, dy) };
        if (Math.abs(dx) < 1) { const yTop = TOPY + RY * Math.sqrt(1 - dx * dx), v = (q.y - yTop) / SIDE; if (v >= 0 && v <= 1) return { top: false, u: wrap(rot + Math.asin(dx) / 6.2832), v }; }
        return null; }
      function paint(p, du, amt) {   // 지나간 각도 구간에 크림을 채움
        const n = Math.max(1, Math.ceil(Math.abs(du) * NA) + 1);
        for (let k = 0; k <= n; k++) { const u = wrap(p.u - du * k / n), a = Math.floor(u * NA) % NA;
          if (p.top) { const ri = Math.min(NR - 1, Math.floor(p.r * NR)); for (const [d, f] of [[0, 1], [-1, .9], [1, .9], [-2, .6], [2, .6]]) { const r = ri + d; if (r >= 0 && r < NR) top[a * NR + r] += amt * f; } }
          else { const b = Math.min(NB - 1, Math.floor(p.v * NB)); for (const [d, f] of [[0, 1], [-1, .9], [1, .9], [-2, .75], [2, .75], [-3, .6], [3, .6]]) { const bb = b + d; if (bb >= 0 && bb < NB) side[a * NB + bb] += amt * f; } } } }
      function buildMask() { const d = mdata.data, sx = W / MW, sy = H / MH;
        for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) { const p = where({ x: (i + .5) * sx, y: (j + .5) * sy }); let a = 0;
          if (p) { const ai = Math.floor(p.u * NA) % NA; a = p.top ? top[ai * NR + Math.min(NR - 1, Math.floor(p.r * NR))] : side[ai * NB + Math.min(NB - 1, Math.floor(p.v * NB))]; }
          const o = (j * MW + i) * 4; d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = Math.min(255, a * 255); }
        mx.putImageData(mdata, 0, 0); }
      const topPos = (u, r) => { const a = (u - rot) * 6.2832; return { x: CX + Math.cos(a) * r * RX, y: TOPY + Math.sin(a) * r * RY, back: Math.sin(a) < 0 }; };
      can.addEventListener('pointerdown', e => { const q = at(e, can); e.preventDefault(); can.setPointerCapture(e.pointerId); last = q; flick = { x: q.x, t: e.timeStamp };
        if (view === 'top') { const dx = (q.x - TCX) / TR, dy = (q.y - TCY) / TR, rr = Math.hypot(dx, dy);
          if (rr > 1.02) { spinDrag = { a: Math.atan2(dy, dx) }; return; }   // 바깥 돌림판을 밀어 돌리기
          const p = { top: true, u: wrap(Math.atan2(dy, dx) / 6.2832 + rot), r: rr };
          if (tool === 'bag') { dabs.push({ u: p.u, r: Math.min(.95, p.r), s: rnd(.9, 1.1) }); scratch(.08, .05, 500); down = q; return; }
          if (tool === 'spat') return; items.push({ k: tool, u: p.u, r: Math.min(.88, p.r), s: rnd(.92, 1.08) }); tone(700, .06, .04, 'triangle'); if (items.length >= 3 && !done) { done = true; api.ready(true); api.guide('예쁘게 꾸몄어요! 더 올려도 되고, 다 했으면 아래 버튼을 눌러요.'); } return; }
        if (q.y > BOTC + RY + 4 && q.y < 470 && Math.abs(q.x - CX) < 330) { spinDrag = { x: q.x }; return; }   // 받침을 밀어 돌리기
        const p = where(q); if (!p) return;
        if (tool === 'spat') { down = q; return; }
        if (!p.top) return;
        if (tool === 'bag') { dabs.push({ u: p.u, r: Math.min(.92, p.r), s: rnd(.9, 1.1) }); scratch(.08, .05, 500); down = q; return; }
        items.push({ k: tool, u: p.u, r: Math.min(.85, p.r), s: rnd(.92, 1.08) }); tone(700, .06, .04, 'triangle'); if (items.length >= 3 && !done) { done = true; api.ready(true); api.guide('예쁘게 꾸몄어요! 더 올려도 되고, 다 했으면 아래 버튼을 눌러요.'); } });
      can.addEventListener('pointermove', e => { const q = at(e, can);
        if (spinDrag && view === 'top') { const a = Math.atan2(q.y - TCY, q.x - TCX); let d = a - spinDrag.a; if (d > Math.PI) d -= 6.2832; if (d < -Math.PI) d += 6.2832; w -= d / 6.2832 * 14; spinDrag.a = a; last = q; return; }
        if (spinDrag) { const dx = q.x - spinDrag.x; w += dx / (2 * Math.PI * RX) * 2.2; spinDrag.x = q.x; return; }
        if (view === 'top' && down && tool === 'bag' && Math.hypot(q.x - last.x, q.y - last.y) > 9) { const dx = (q.x - TCX) / TR, dy = (q.y - TCY) / TR, rr = Math.hypot(dx, dy); if (rr < 1) dabs.push({ u: wrap(Math.atan2(dy, dx) / 6.2832 + rot), r: Math.min(.95, rr), s: rnd(.85, 1.05) }); last = q; return; }
        if (down && tool === 'spat') { const p = where(q); if (p) { const mv = Math.hypot(q.x - last.x, q.y - last.y); paint(p, 0, mv * .012); } down = q; }   // 손으로 문질러도 조금씩 발림
        if (down && tool === 'bag' && Math.hypot(q.x - last.x, q.y - last.y) > 16) { const p = where(q); if (p && p.top) dabs.push({ u: p.u, r: Math.min(.92, p.r), s: rnd(.9, 1.1) }); }
        last = q; });
      const up = () => { spinDrag = null; down = null; paintBar(); hint(); };
      can.addEventListener('pointerup', up); can.addEventListener('pointercancel', up);
      function rosette(x, y, s, ang) { g.fillStyle = 'rgba(120,100,80,.22)'; g.beginPath(); g.arc(x + 2, y + 3, s * 1.05, 0, 7); g.fill();
        const gr = g.createRadialGradient(x - s * .35, y - s * .35, 1, x, y, s); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#e9e0d2'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
        g.strokeStyle = 'rgba(190,175,155,.75)'; g.lineWidth = 1.4; g.beginPath(); for (let k = 0; k <= 30; k++) { const tt = k / 30, a = ang + tt * 6.2832 * 1.6, r = s * (.88 - tt * .78); k ? g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.stroke();
        for (let k = 0; k < 7; k++) { const a = ang + k / 7 * 6.2832; g.strokeStyle = 'rgba(200,188,170,.55)'; g.beginPath(); g.moveTo(x + Math.cos(a) * s * .55, y + Math.sin(a) * s * .55); g.lineTo(x + Math.cos(a) * s * .95, y + Math.sin(a) * s * .95); g.stroke(); } }
      function drawTop(t) {   // 위에서 내려다본 케이크 (돌림판과 함께 돌아요)
        g.clearRect(0, 0, W, H); g.save(); g.filter = 'blur(10px) brightness(.9)'; if (bare.complete) g.drawImage(bare, -40, -40, W + 80, H + 80); g.restore();
        const R0 = TR * 1.26; g.fillStyle = 'rgba(40,25,15,.3)'; g.beginPath(); g.arc(TCX + 6, TCY + 10, R0, 0, 7); g.fill();
        const tg = g.createRadialGradient(TCX - 60, TCY - 60, 20, TCX, TCY, R0); tg.addColorStop(0, '#f4f1ec'); tg.addColorStop(1, '#cfc8bf'); g.fillStyle = tg; g.beginPath(); g.arc(TCX, TCY, R0, 0, 7); g.fill();
        for (let i = 0; i < 36; i++) { const a = (i / 36 - rot) * 6.2832, red = i % 9 === 0; g.fillStyle = red ? 'rgba(190,60,50,.9)' : 'rgba(140,125,110,.5)'; g.beginPath(); g.arc(TCX + Math.cos(a) * TR * 1.16, TCY + Math.sin(a) * TR * 1.16, red ? 6 : 3, 0, 7); g.fill(); }   // 돌림판 눈금
        g.fillStyle = 'rgba(90,70,50,.28)'; g.beginPath(); g.arc(TCX + 3, TCY + 6, TR + 2, 0, 7); g.fill();
        const cg = g.createRadialGradient(TCX - TR * .35, TCY - TR * .4, 10, TCX, TCY, TR); cg.addColorStop(0, '#fffdf8'); cg.addColorStop(.85, '#f3ece1'); cg.addColorStop(1, '#e2d6c4'); g.fillStyle = cg; g.beginPath(); g.arc(TCX, TCY, TR, 0, 7); g.fill();
        g.save(); g.beginPath(); g.arc(TCX, TCY, TR, 0, 7); g.clip(); g.strokeStyle = 'rgba(200,185,165,.35)'; g.lineWidth = 2;   // 스패출러로 쓸어 낸 크림 결
        for (let k = 0; k < 9; k++) { const r = TR * (.18 + k * .095); g.beginPath(); g.arc(TCX, TCY, r, (-rot + k * .37) * 6.2832, (-rot + k * .37) * 6.2832 + 3.6); g.stroke(); } g.restore();
        const all = dabs.map(d => ({ d, a: (d.u - rot) * 6.2832 })).concat(items.map(it => ({ it, a: (it.u - rot) * 6.2832 })));
        for (const o of all) { const r = (o.d ? o.d.r : o.it.r) * TR, x = TCX + Math.cos(o.a) * r, y = TCY + Math.sin(o.a) * r;
          if (o.d) rosette(x, y, 12 * o.d.s, o.a + o.d.s * 5);
          else { const im = IM[o.it.k], sz = DECO.find(d => d[0] === o.it.k)[2] * o.it.s * 1.15; if (!im.complete || !im.naturalWidth) continue; const h = sz * im.naturalHeight / im.naturalWidth; g.fillStyle = 'rgba(110,80,50,.25)'; g.beginPath(); g.ellipse(x + 3, y + 4, sz * .45, sz * .3, 0, 0, 7); g.fill(); g.save(); g.translate(x, y); g.rotate(o.a + Math.PI / 2); g.drawImage(im, -sz / 2, -h / 2, sz, h); g.restore(); } }
        if (last && tool === 'bag' && bag.complete && bag.naturalWidth) { const s = 150 / bag.naturalHeight; g.save(); g.globalAlpha = down ? 1 : .9; g.translate(last.x, last.y); g.rotate(Math.PI * .82); g.drawImage(bag, -bag.naturalWidth * s * .62, -4, bag.naturalWidth * s, bag.naturalHeight * s); g.restore(); }   // 위에서 짜는 짤주머니
        if (Math.abs(w) > .02) { g.fillStyle = 'rgba(255,250,240,.95)'; g.font = '15px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText('빙글빙글', TCX, H - 14); }
      }
      function frame(t) {
        if (!alive) return; requestAnimationFrame(frame); const dt = Math.min(.05, (t - (t0 || t)) / 1000); t0 = t;
        const du = w * dt; rot = wrap(rot + du); w *= Math.pow(.62, dt); w = Math.max(-1.2, Math.min(1.2, w)); if (Math.abs(w) < .005) w = 0;   // 돌림판은 천천히 멈춤
        if (down && tool === 'spat' && w) { const p = where(down); if (p) { paint(p, du, Math.min(.6, Math.abs(du) * NA * .55) + .01); if (t - (lastSnd || 0) > 90) { lastSnd = t; scratch(.09, .025, 1200); } } }
        if (down && tool === 'bag' && w && Math.random() < Math.min(1, Math.abs(w) * 3)) { if (view === 'top') { const dx = (down.x - TCX) / TR, dy = (down.y - TCY) / TR, rr = Math.hypot(dx, dy); if (rr < 1) dabs.push({ u: wrap(Math.atan2(dy, dx) / 6.2832 + rot), r: Math.min(.95, rr), s: rnd(.85, 1.05) }); } else { const p = where(down); if (p && p.top) dabs.push({ u: p.u, r: Math.min(.92, p.r), s: rnd(.9, 1.1) }); } }
        if (view === 'top') { drawTop(t); return; }
        g.clearRect(0, 0, W, H); if (!bare.complete || !bare.naturalWidth) return;
        g.drawImage(bare, 0, 0, W, H);
        buildMask(); tx.clearRect(0, 0, W, H); tx.globalCompositeOperation = 'source-over'; tx.drawImage(mcv, 0, 0, W, H); tx.globalCompositeOperation = 'source-in'; if (creamIm.complete) tx.drawImage(creamIm, 0, 0, W, H); g.drawImage(tmp, 0, 0);
        // 돌림판 받침 테두리의 눈금(돌아가는 게 보이게)
        for (let i = 0; i < 24; i++) { const a = (i / 24 - rot) * 6.2832; if (Math.sin(a) < .05) continue; const x = CX + Math.cos(a) * 252, y = BOTC + 6 + Math.sin(a) * 23, red = i % 6 === 0; g.fillStyle = red ? 'rgba(190,60,50,.85)' : 'rgba(150,130,110,.55)'; g.beginPath(); g.ellipse(x, y, (red ? 11 : 5) * (.4 + .6 * Math.sin(a)), red ? 4.5 : 2.4, 0, 0, 7); g.fill(); }
        // 빵 옆면의 작은 기공·부스러기 (크림이 안 덮인 곳에서 돌면 같이 지나가요)
        for (let i = 0; i < 40; i++) { const a = ((i * .6180339) % 1 - rot) * 6.2832; if (Math.sin(a) < .12) continue; const dx = Math.cos(a), x = CX + dx * RX * .97, v = .12 + ((i * .37) % 1) * .8, yTop = TOPY + RY * Math.sqrt(Math.max(0, 1 - dx * dx)), y = yTop + v * SIDE, ai = Math.floor(wrap((i * .6180339) % 1) * NA) % NA, b = Math.min(NB - 1, Math.floor(v * NB)); if (side[ai * NB + b] > .6) continue;
          g.fillStyle = `rgba(120,70,30,${(.45 * Math.sin(a)).toFixed(3)})`; g.beginPath(); g.ellipse(x, y, (2.5 + (i % 3)) * Math.sin(a), 2 + (i % 2), 0, 0, 7); g.fill(); }
        // 크림에 남은 스패출러 결 (돌면 같이 지나가요)
        g.save(); g.beginPath(); g.rect(CX - RX, TOPY, RX * 2, SIDE + RY); g.clip(); g.globalCompositeOperation = 'source-atop';
        for (let i = 0; i < 28; i++) { const a = (i / 28 - rot) * 6.2832; if (Math.sin(a) < .08) continue; const dx = Math.cos(a), x = CX + dx * RX * .985, yTop = TOPY + RY * Math.sqrt(Math.max(0, 1 - dx * dx)); const ai = Math.floor(wrap(i / 28) * NA) % NA; let cov = 0; for (let b = 0; b < NB; b++) cov += Math.min(1, side[ai * NB + b]) / NB; if (cov < .3) continue; g.strokeStyle = `rgba(200,185,165,${(.35 * Math.sin(a) * cov).toFixed(3)})`; g.lineWidth = 2 + (i % 3); g.beginPath(); g.moveTo(x, yTop + 6); g.lineTo(x + (i % 2 ? 1.5 : -1.5), yTop + SIDE - 4); g.stroke(); }
        g.restore();
        // 크림 장식·올린 것들: 뒤쪽부터
        const all = dabs.map(d => ({ d, p: topPos(d.u, d.r) })).concat(items.map(it => ({ it, p: topPos(it.u, it.r) }))).sort((a, b) => a.p.y - b.p.y);
        for (const o of all) { const { x, y } = o.p;
          if (o.d) { const s = 9 * o.d.s; g.fillStyle = 'rgba(150,130,110,.25)'; g.beginPath(); g.ellipse(x, y + 2, s * 1.2, s * .5, 0, 0, 7); g.fill();
            for (let k = 0; k < 3; k++) { const rr = s * (1 - k * .28); const gr = g.createRadialGradient(x - rr * .3, y - 3 - k * 5 - rr * .3, 1, x, y - k * 5, rr); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#ece4d8'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - k * 5, rr, rr * .7, 0, 0, 7); g.fill(); }
            g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x - 2, y - 14); g.quadraticCurveTo(x + 1, y - 22, x + 3, y - 14); g.fill(); }
          else { const im = IM[o.it.k], sz = DECO.find(d => d[0] === o.it.k)[2] * o.it.s; if (!im.complete || !im.naturalWidth) continue; const h = sz * im.naturalHeight / im.naturalWidth;
            g.fillStyle = 'rgba(120,90,60,.22)'; g.beginPath(); g.ellipse(x, y, sz * .45, sz * .14, 0, 0, 7); g.fill(); g.drawImage(im, x - sz / 2, y - h + sz * .12, sz, h); } }
        // 손에 든 도구
        if (last && (tool === 'spat' || tool === 'bag')) { const im = tool === 'spat' ? spat : bag; if (im.complete && im.naturalWidth) { g.save(); g.globalAlpha = down ? 1 : .85;
            if (tool === 'spat') { const s = 150 / im.naturalWidth; g.translate(last.x, last.y); g.drawImage(im, -6, -im.naturalHeight * s * .92, im.naturalWidth * s, im.naturalHeight * s); }
            else { const s = 120 / im.naturalHeight; g.translate(last.x, last.y); g.rotate(Math.PI * .92); g.drawImage(im, -im.naturalWidth * s * .62, -4, im.naturalWidth * s, im.naturalHeight * s); }
            g.restore(); } }
        if (Math.abs(w) > .02) { g.fillStyle = 'rgba(255,250,240,.9)'; g.font = '14px "Gowun Batang",serif'; g.textAlign = 'center'; g.fillText('빙글빙글', CX, 495); }
      }
      window.__cakeFill = () => { side.fill(1); top.fill(1); paintBar(); hint(); };
      reset(); requestAnimationFrame(frame);
      return { reset, result() { return done ? { cake: 1 } : null; }, stop() { alive = false; } };
    },
  };

  /* ───────── 캐럴 합창단: 떨어지는 음표에 맞춰 악기를 눌러 노래를 이어요 ───────── */
  plays.carol = {
    title: '캐럴 합창단', doneLabel: '합창 마치기', doneMsg: '아이들과 캐럴을 끝까지 불렀어요. 골목에 노랫소리가 퍼져요.',
    start(board, api) {
      board.className = 'pboard carolb';
      const W = 800, H = 500, can = cv(W, H, 'carolcv'), g = can.getContext('2d'); board.append(can);
      const sky = pic('sky_night.jpg'), kids = pic('cr_kids.png'), INS = [pic('cr_bell.png'), pic('cr_sleigh.png'), pic('cr_tri.png')];
      const LANE = [250, 400, 550], HIT = 432, SPEED = 210;
      // 징글벨: [박자, 줄, 음 높이(Hz)]
      const E = 659, D = 587, C = 523, G = 784, F = 698, A = 880;
      const MEL = [[0, 1, E], [1, 1, E], [2, 1, E], [4, 0, E], [5, 0, E], [6, 0, E], [8, 1, E], [9, 2, G], [10, 0, C], [11, 2, D], [12, 1, E],
        [16, 2, F], [17, 2, F], [18, 2, F], [19, 2, F], [20, 0, F], [21, 0, E], [22, 0, E], [23, 0, E], [24, 1, E], [25, 1, D], [26, 1, D], [27, 0, E], [28, 1, D], [30, 2, G]];
      const BEAT = .42;
      let alive = true, t0, notes, hits, miss, pops, bob, ended, last, combo, maxC, score;
      function reset() { t0 = performance.now() / 1000 + 1.6; notes = MEL.map(([b, l, f]) => ({ t: b * BEAT, l, f, st: 0 })); hits = 0; miss = 0; combo = 0; maxC = 0; score = 0; pops = []; bob = [0, 0, 0, 0]; ended = false; api.ready(false);
        api.guide('음표가 금색 줄에 닿을 때 아래 악기를 눌러요. 키보드 ← ↓ → 도 돼요.'); }
      function ring(l, f) { const k = [.667, .84, 1][l], fr = f * k; tone(fr, .5, .09, 'sine', fr * 2); }   // 세 악기 모두 맑은 트라이앵글 소리로, 높낮이만 다르게 (왼쪽이 낮고 오른쪽이 높음)
      function press(l) {
        const now = performance.now() / 1000 - t0; let best = null, bd = 1;
        for (const n of notes) if (!n.st && n.l === l) { const d = Math.abs(n.t - now); if (d < bd) { bd = d; best = n; } }
        if (best && bd < .2) { best.st = 1; hits++; combo++; maxC = Math.max(maxC, combo); const perfect = bd < .08; score += (perfect ? 100 : 60) * (1 + Math.min(3, Math.floor(combo / 5)) * .5); ring(l, best.f); pops.push({ x: LANE[l], y: HIT, t: 0, txt: perfect ? '완벽!' : '좋아요', c: perfect ? '#ffe28a' : '#d8ecff' }); bob = bob.map(() => 1); }
        else { tone(220, .08, .03, 'sine'); combo = 0; pops.push({ x: LANE[l], y: HIT, t: 0, txt: '', bad: 1 }); }
        flash[l] = 1;
      }
      const flash = [0, 0, 0];
      can.addEventListener('pointerdown', e => { const q = at(e, can); e.preventDefault(); if (q.y > HIT - 70) { const l = LANE.map((x, i) => [Math.abs(x - q.x), i]).sort((a, b) => a[0] - b[0])[0]; if (l[0] < 80) press(l[1]); } });
      const key = e => { const l = { ArrowLeft: 0, ArrowDown: 1, ArrowRight: 2, a: 0, s: 1, d: 2 }[e.key]; if (l !== undefined && board.isConnected) { e.preventDefault(); press(l); } };
      addEventListener('keydown', key);
      function draw(ts) { if (!alive || !board.isConnected) { removeEventListener('keydown', key); return; }
        const now = ts / 1000 - t0, dt = last ? Math.min(.05, ts / 1000 - last) : 0; last = ts / 1000;
        g.clearRect(0, 0, W, H);
        if (sky.complete) { const k = Math.max(W / sky.naturalWidth, H / sky.naturalHeight); g.drawImage(sky, (W - sky.naturalWidth * k) / 2, H - sky.naturalHeight * k, sky.naturalWidth * k, sky.naturalHeight * k); }
        g.fillStyle = 'rgba(10,20,40,.35)'; g.fillRect(0, 0, W, H);
        const sn = g.createLinearGradient(0, 330, 0, H); sn.addColorStop(0, 'rgba(236,242,248,0)'); sn.addColorStop(.25, 'rgba(236,242,248,.92)'); sn.addColorStop(1, '#dfe7ef'); g.fillStyle = sn; g.fillRect(0, 330, W, H - 330);   // 아이들이 서 있는 눈길
        if (kids.complete) { const kh = 250, kw = kids.naturalWidth / kids.naturalHeight * kh, by = Math.abs(Math.sin(ts / 120)) * 6 * bob[0];
          g.fillStyle = 'rgba(40,50,70,.18)'; g.beginPath(); g.ellipse(W / 2, 392, kw * .42, 10, 0, 0, 7); g.fill(); g.drawImage(kids, W / 2 - kw / 2, 392 - kh - by, kw, kh); }
        bob = bob.map(v => Math.max(0, v - dt * 2));
        // 줄과 악기
        for (let l = 0; l < 3; l++) { const tr = g.createLinearGradient(0, 0, 0, HIT); tr.addColorStop(0, 'rgba(255,240,200,0)'); tr.addColorStop(1, `rgba(255,236,190,${.16 + flash[l] * .25})`); g.fillStyle = tr; g.beginPath(); g.roundRect(LANE[l] - 30, 0, 60, HIT + 4, 18); g.fill(); g.strokeStyle = 'rgba(255,240,200,.18)'; g.lineWidth = 1.5; g.stroke(); }   // 음표가 내려오는 빛 길
        g.strokeStyle = 'rgba(200,150,50,.9)'; g.lineWidth = 3; g.beginPath(); g.moveTo(170, HIT); g.lineTo(630, HIT); g.stroke();
        for (let l = 0; l < 3; l++) { const im = INS[l], s = 54 * (1 + flash[l] * .15); g.save(); g.translate(LANE[l], HIT + 36); g.rotate(Math.sin(ts / 60) * .15 * flash[l]);
          g.fillStyle = `rgba(120,80,30,${.18 + flash[l] * .4})`; g.beginPath(); g.arc(0, 0, 34, 0, 7); g.fill();
          if (im.complete) { const k = s / Math.max(im.naturalWidth, im.naturalHeight); g.drawImage(im, -im.naturalWidth * k / 2, -im.naturalHeight * k / 2, im.naturalWidth * k, im.naturalHeight * k); } g.restore(); flash[l] = Math.max(0, flash[l] - dt * 4); }
        // 음표
        for (const n of notes) { if (n.st) continue; const y = HIT - (n.t - now) * SPEED; if (y > HIT + 40) { n.st = 2; miss++; continue; } if (y < -30) continue;
          const x0 = LANE[n.l], near = Math.max(0, 1 - Math.abs(y - HIT) / 120); g.save(); g.shadowColor = '#ffd77a'; g.shadowBlur = 10 + near * 14;
          const ng = g.createRadialGradient(x0 - 5, y - 4, 2, x0, y, 16); ng.addColorStop(0, '#fff6d0'); ng.addColorStop(.6, '#ffcf5a'); ng.addColorStop(1, '#c98a20'); g.fillStyle = ng; g.beginPath(); g.ellipse(x0, y, 15, 11, -.35, 0, 7); g.fill(); g.shadowBlur = 0;
          g.strokeStyle = '#d9a23a'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 + 13, y - 3); g.lineTo(x0 + 13, y - 36); g.quadraticCurveTo(x0 + 26, y - 30, x0 + 24, y - 18); g.stroke(); g.restore(); }
        for (const p of pops) { p.t += dt; if (p.bad) continue; g.globalAlpha = Math.max(0, 1 - p.t * 1.5); g.font = 'bold 22px "Gowun Dodum", sans-serif'; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = 'rgba(30,40,70,.6)'; g.strokeText(p.txt, p.x, p.y - 34 - p.t * 40); g.fillStyle = p.c || '#fff3c4'; g.fillText(p.txt, p.x, p.y - 34 - p.t * 40);
          for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; g.beginPath(); g.arc(p.x + Math.cos(a) * p.t * 90, p.y + Math.sin(a) * p.t * 60, 3, 0, 7); g.fill(); } g.globalAlpha = 1; }
        pops = pops.filter(p => p.t < 1);
        const done = notes.filter(n => n.st).length; g.fillStyle = 'rgba(15,22,40,.5)'; g.fillRect(0, 0, W, 40); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(200, 16, 400, 8); g.fillStyle = '#ffd77a'; g.fillRect(200, 16, 400 * done / notes.length, 8);
        g.font = 'bold 19px "Gowun Dodum", sans-serif'; g.textAlign = 'left'; g.fillStyle = '#fff'; g.fillText(`♪ ${Math.round(score)}`, 16, 27); g.textAlign = 'right'; g.fillStyle = combo >= 5 ? '#ffd77a' : '#c9d6ee'; g.fillText(combo >= 3 ? `${combo} 연속!` : `${hits}/${notes.length}`, W - 16, 27);
        if (now < 0) { g.textAlign = 'center'; g.font = 'bold 54px "Gowun Dodum", sans-serif'; g.fillStyle = 'rgba(255,246,210,.92)'; g.fillText(String(Math.ceil(-now)), W / 2, 200); }
        if (!ended && notes.every(n => n.st)) { ended = true; const r = hits / notes.length;
          api.guide(`${r > .9 ? '★★★ 완벽한 합창!' : r > .7 ? '★★ 멋진 합창이었어요!' : '★ 끝까지 불렀어요!'} ${hits}/${notes.length} · 최고 연속 ${maxC} · ${Math.round(score)}점. 「처음부터」로 다시 할 수 있어요.`); api.ready(true);
          [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, .6, .06, 'triangle'), i * 130)); }
        requestAnimationFrame(draw); }
      reset(); requestAnimationFrame(draw);
      return { reset, result() { if (!ended) return null; const o = cv(260, 220), x = o.getContext('2d'); x.drawImage(can, 150, 150, 500, 360, 0, 0, 260, 187); return { img: o.toDataURL('image/png'), hits }; }, stop() { alive = false; removeEventListener('keydown', key); } };
    },
  };

  /* ───────── 눈싸움: 눈을 꾹 눌러 뭉치고, 놓아서 과녁 눈사람 모자를 맞혀요 ───────── */
  plays.fight = {
    title: '눈싸움 대작전', doneLabel: '눈 요새 두기', doneMsg: '눈싸움 대장이에요! 광장에 눈 요새를 세워 뒀어요.',
    start(board, api) {
      board.className = 'pboard fightb';
      const W = 800, H = 500, can = cv(W, H, 'fightcv'), g = can.getContext('2d'); board.append(can);
      const IM = { bg: pic('postcard.jpg'), s1: pic('fg_sm1.png'), s2: pic('fg_sm2.png'), h1: pic('fg_hat1.png'), h2: pic('fg_hat2.png'), wall: pic('fg_wall.png'), pile: pic('fg_pile.png'), b1: pic('fg_burst1.png'), b2: pic('fg_burst2.png'), ball: pic('fg_ball.png') };
      const TIME = 60, GOAL = 150;
      // 눈 요새 세 개: 뒤 왼쪽·뒤 오른쪽·앞 가운데 (s = 원근 크기)
      const FORTS = [{ x: 215, y: 318, s: .5 }, { x: 590, y: 322, s: .52 }, { x: 395, y: 420, s: .78 }];
      let best = 0; try { best = +localStorage.getItem('advent_fight_best') || 0; } catch (e) { /* 저장 안 됨 */ }
      let alive = true, phase, left, score, combo, hearts, slots, shots, incoming, fx, pops, splash, last, again, done = false, hitN, blockN, shake;
      const lvl = () => 1 + Math.min(3, (TIME - left) / 15);
      function reset() { phase = 'ready'; left = TIME; score = 0; combo = 0; hearts = 3; shots = []; incoming = []; fx = []; pops = []; splash = []; hitN = 0; blockN = 0; shake = 0;
        slots = FORTS.map((f, i) => ({ f, st: 'hide', t: 1 + i * .7, up: 0, k: i % 2 ? 's2' : 's1', hat: 1, hv: null, wob: 0 }));
        api.ready(done); api.guide(`눈 요새 뒤로 눈사람이 튀어나오면 눌러서 눈덩이를 던져요. 모자를 맞히면 점수가 더 커요! 날아오는 눈덩이는 눌러서 막아요. 60초 동안 ${GOAL}점이 목표예요.`); }
      const sizeOf = sl => { const im = IM[sl.k], h = 195 * sl.f.s, w = im.naturalWidth / (im.naturalHeight || 1) * h || 100 * sl.f.s; return { w, h }; };
      const bodyBox = sl => { const { w, h } = sizeOf(sl), y = sl.f.y - h * sl.up * .92; return { x: sl.f.x - w / 2, y, w, h, top: y }; };
      const hatBox = sl => { const b = bodyBox(sl), im = sl.k === 's1' ? IM.h1 : IM.h2, w = (sl.k === 's1' ? .78 : .6) * b.w, h = (im.naturalHeight / (im.naturalWidth || 1)) * w || 30; return { x: sl.f.x - w / 2, y: b.y - h * .7, w, h }; };
      const inB = (q, b, pad = 0) => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;
      can.addEventListener('pointerdown', e => { e.preventDefault(); const q = at(e, can);
        if (phase !== 'play') { if (phase === 'ready' || (phase === 'end' && again && Math.hypot(q.x - again.x, q.y - again.y) < 90)) { if (phase === 'end') reset(); phase = 'play'; tone(660, .2, .05, 'triangle', 990); } return; }
        // 날아오는 눈덩이 막기가 먼저
        for (const b of incoming) { const p = incPos(b); if (Math.hypot(q.x - p.x, q.y - p.y) < p.r * 1.25 + 14) { b.dead = 1; blockN++; addScore(5, p.x, p.y, '막았다! +'); fx.push({ x: p.x, y: p.y, t: 0, s: p.r / 60, img: 'b2' }); tone(1200, .08, .05, 'triangle'); return; } }
        shots.push({ sx: 400 + rnd(-30, 30), sy: 540, tx: q.x, ty: q.y, t: 0, dur: .3 }); scratch(.06, .04, 2500); });
      function addScore(base, x, y, pre = '+') { combo++; const mul = Math.min(4, 1 + Math.floor(combo / 4)), pt = base * mul; score += pt; pops.push({ x, y, t: 0, txt: pre + pt + (mul > 1 ? ` ×${mul}` : '') }); }
      function land(s2) { const q = { x: s2.tx, y: s2.ty }; let hit = false;
        for (const sl of slots) { if (sl.up < .5 || sl.st === 'hit') continue;
          if (sl.hat && inB(q, hatBox(sl), 6)) { sl.hat = 0; const hb = hatBox(sl); sl.hv = { x: hb.x + hb.w / 2, y: hb.y + hb.h / 2, vx: (q.x < sl.f.x ? 1 : -1) * rnd(140, 220), vy: -280, a: 0 }; addScore(25, q.x, q.y - 20, '모자! +'); sl.st = 'hit'; sl.t = .5; sl.wob = 1; hit = true; hitN++; tone(880, .15, .07, 'triangle', 1320); break; }
          if (inB(q, bodyBox(sl), 4)) { addScore(10, q.x, q.y - 20); sl.st = 'hit'; sl.t = .45; sl.wob = 1; hit = true; hitN++; tone(520, .12, .06, 'triangle'); break; } }
        fx.push({ x: q.x, y: q.y, t: 0, s: hit ? .32 : .2, img: hit ? 'b1' : 'b2' });
        if (!hit) { combo = 0; } }
      // 날아오는 눈덩이: 눈사람 자리에서 화면 쪽으로 점점 커지며 다가옴
      const incPos = b => { const k = Math.min(1, b.t / b.dur), e = k * k; return { x: b.x0 + (b.x1 - b.x0) * e, y: b.y0 + (b.y1 - b.y0) * e - Math.sin(k * Math.PI) * 40, r: 10 + e * 70 }; };
      function step(dt) { const L = lvl();
        if (phase === 'play') { left -= dt; if (left <= 0 || hearts <= 0) end(); }
        for (const sl of slots) { sl.wob = Math.max(0, sl.wob - dt * 2); sl.t -= dt;
          if (sl.st === 'hide') { sl.up = Math.max(0, sl.up - dt * 5); if (sl.t <= 0 && phase === 'play') { sl.st = 'rise'; sl.hat = sl.hat || (Math.random() < .85 ? 1 : 0); sl.k = Math.random() < .5 ? 's1' : 's2'; } }
          else if (sl.st === 'rise') { sl.up = Math.min(1, sl.up + dt * (3 + L)); if (sl.up >= 1) { sl.st = 'up'; sl.t = rnd(1.1, 2) / Math.sqrt(L); sl.throwAt = Math.random() < .12 + L * .1 ? sl.t * rnd(.3, .7) : -1; } }
          else if (sl.st === 'up') { if (sl.throwAt > 0 && sl.t < sl.throwAt) { sl.throwAt = -1; sl.wob = .8; const b = bodyBox(sl); incoming.push({ x0: sl.f.x, y0: b.y + b.h * .3, x1: rnd(160, 640), y1: rnd(160, 380), t: 0, dur: 1.5 / Math.sqrt(L) }); tone(300, .1, .05, 'triangle'); } if (sl.t <= 0) { sl.st = 'sink'; } }
          else if (sl.st === 'hit') { if (sl.t <= 0) sl.st = 'sink'; }
          else if (sl.st === 'sink') { sl.up = Math.max(0, sl.up - dt * 4); if (sl.up <= 0) { sl.st = 'hide'; sl.t = rnd(.5, 1.6) / L; if (!sl.hat && Math.random() < .6) sl.hat = 1; } }
          if (sl.hv) { const h = sl.hv; h.vy += 800 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.a += dt * 9 * Math.sign(h.vx); if (h.y > H + 60) sl.hv = null; } }
        for (const s2 of shots) { s2.t += dt / s2.dur; if (s2.t >= 1 && !s2.done) { s2.done = 1; land(s2); } } shots = shots.filter(s2 => !s2.done);
        for (const b of incoming) { b.t += dt; if (b.t >= b.dur && !b.dead) { b.dead = 1; const p = incPos(b); hearts--; combo = 0; shake = .4; splash.push({ x: p.x, y: p.y, t: 0, r: rnd(-.5, .5) }); tone(150, .3, .08, 'square'); scratch(.25, .1, 900); } } incoming = incoming.filter(b => !b.dead);
        fx = fx.filter(f => (f.t += dt) < .6); pops = pops.filter(p => (p.t += dt) < 1); splash = splash.filter(sp => (sp.t += dt) < 2.2); shake = Math.max(0, shake - dt); }
      function end() { phase = 'end'; incoming = []; if (score > best) { best = score; try { localStorage.setItem('advent_fight_best', best); } catch (e) { /* 저장 안 됨 */ } }
        if (score >= GOAL && !done) { done = true; api.ready(true); }
        api.guide(score >= GOAL ? `눈싸움 대장! ${score}점 (최고 ${best}점). 다시 해도 되고, 아래 버튼으로 마쳐요.` : `${score}점이에요. ${GOAL}점까지 조금만 더! 다시 해 봐요.`); [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, .3, .05, 'triangle'), i * 110)); }
      function drawSnowman(sl) { if (sl.up <= 0) return; const im = IM[sl.k]; if (!im.complete) return; const b = bodyBox(sl);
        g.save(); g.beginPath(); g.rect(0, 0, W, sl.f.y + 2); g.clip(); g.translate(sl.f.x, b.y + b.h); g.rotate(Math.sin(performance.now() / 45) * .14 * sl.wob);
        if (sl.st === 'hit') g.filter = 'brightness(1.15)'; g.drawImage(im, -b.w / 2, -b.h, b.w, b.h); g.filter = 'none';
        if (sl.hat) { const hb = hatBox(sl), hi = sl.k === 's1' ? IM.h1 : IM.h2; if (hi.complete) g.drawImage(hi, hb.x - sl.f.x, hb.y - (b.y + b.h), hb.w, hb.h); }
        if (sl.throwAt > 0 && sl.st === 'up' && sl.t < sl.throwAt + .5) { g.fillStyle = 'rgba(255,90,60,.9)'; g.font = `bold ${Math.round(26 * sl.f.s + 8)}px sans-serif`; g.textAlign = 'center'; g.fillText('!', b.w * .45, -b.h * .8); }
        g.restore(); }
      function drawFort(f) { if (!IM.wall.complete) return; const w = 360 * f.s, h = IM.wall.naturalHeight / IM.wall.naturalWidth * w; g.save(); g.shadowColor = 'rgba(40,50,80,.25)'; g.shadowBlur = 10; g.shadowOffsetY = 4; g.drawImage(IM.wall, f.x - w / 2, f.y - h * .32, w, h); g.restore(); }
      function star5(x, y, r, c) { g.fillStyle = c; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 - 1.571, rr = k % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
      function draw(ts) { if (!alive || !board.isConnected) return; const dt = last ? Math.min(.05, ts / 1000 - last) : 0; last = ts / 1000; step(dt);
        g.save(); if (shake > 0) g.translate(rnd(-6, 6) * shake * 2, rnd(-5, 5) * shake * 2);
        if (IM.bg.complete) g.drawImage(IM.bg, -10, -40, 820, 547);
        g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 50; i++) { const x = (i * 97 + ts / 40) % W, y = (i * 53 + ts / 22) % H; g.beginPath(); g.arc(x, y, 1.4 + (i % 3) * .5, 0, 7); g.fill(); }
        drawSnowman(slots[0]); drawSnowman(slots[1]); drawFort(FORTS[0]); drawFort(FORTS[1]); drawSnowman(slots[2]); drawFort(FORTS[2]);
        if (IM.pile.complete) { const w = 150, h = IM.pile.naturalHeight / IM.pile.naturalWidth * w; g.drawImage(IM.pile, W - w - 4, H - h + 14, w, h); g.drawImage(IM.pile, 6, H - h * .8 + 14, w * .8, h * .8); }
        for (const sl of slots) if (sl.hv) { const h = sl.hv, hi = sl.k === 's1' ? IM.h1 : IM.h2, hb = hatBox(sl); g.save(); g.translate(h.x, h.y); g.rotate(h.a); if (hi.complete) g.drawImage(hi, -hb.w / 2, -hb.h / 2, hb.w, hb.h); g.restore(); }
        for (const s2 of shots) { const k = Math.min(1, s2.t), x = s2.sx + (s2.tx - s2.sx) * k, y = s2.sy + (s2.ty - s2.sy) * k - Math.sin(k * Math.PI) * 110, r = 26 * (1.4 - k * .95); if (IM.ball.complete) g.drawImage(IM.ball, x - r, y - r * .7, r * 2, r * 1.36); }
        for (const f of fx) { const im = IM[f.img]; if (!im.complete) continue; const k = f.t / .6, sc = f.s * (1 + k * .4); g.globalAlpha = 1 - k; g.drawImage(im, f.x - im.naturalWidth * sc / 2, f.y - im.naturalHeight * sc / 2, im.naturalWidth * sc, im.naturalHeight * sc); g.globalAlpha = 1; }
        for (const b of incoming) { const p = incPos(b); if (IM.ball.complete) { g.save(); g.shadowColor = 'rgba(0,0,0,.25)'; g.shadowBlur = 10; g.drawImage(IM.ball, p.x - p.r, p.y - p.r * .7, p.r * 2, p.r * 1.36); g.restore(); } if (b.t / b.dur > .55) { g.strokeStyle = 'rgba(255,90,60,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, p.r + 8, 0, 7); g.stroke(); } }
        g.textAlign = 'center'; for (const p of pops) { g.globalAlpha = 1 - p.t; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(40,50,80,.6)'; g.lineWidth = 4; g.font = 'bold 22px "Gowun Dodum", sans-serif'; g.strokeText(p.txt, p.x, p.y - p.t * 40); g.fillText(p.txt, p.x, p.y - p.t * 40); } g.globalAlpha = 1;
        g.restore();
        // 화면에 맞은 눈덩이 (시야를 가림)
        for (const sp of splash) { const im = IM.b1; if (!im.complete) continue; const a = sp.t < 1.2 ? 1 : 1 - (sp.t - 1.2); g.save(); g.globalAlpha = Math.max(0, a) * .95; g.translate(sp.x, sp.y + sp.t * 12); g.rotate(sp.r); g.drawImage(im, -im.naturalWidth * .9, -im.naturalHeight * .9, im.naturalWidth * 1.8, im.naturalHeight * 1.8); g.restore(); }
        // 위쪽 정보 줄
        g.fillStyle = 'rgba(20,28,50,.55)'; g.fillRect(0, 0, W, 44); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(200, 18, 400, 9); g.fillStyle = left / TIME < .2 ? '#ff9a7a' : '#bfe2ff'; g.fillRect(200, 18, 400 * Math.max(0, left / TIME), 9);
        g.font = 'bold 21px "Gowun Dodum", sans-serif'; g.textAlign = 'left'; g.fillStyle = '#fff'; g.fillText(`❄ ${score}`, 18, 30);
        for (let i = 0; i < 3; i++) { g.fillStyle = i < hearts ? '#ff6b6b' : 'rgba(255,255,255,.25)'; g.font = '22px sans-serif'; g.fillText('♥', W - 100 + i * 28, 31); }
        if (combo >= 4) { g.fillStyle = '#ffd76a'; g.font = 'bold 16px "Gowun Dodum", sans-serif'; g.textAlign = 'center'; g.fillText(`${combo} 연속 ×${Math.min(4, 1 + Math.floor(combo / 4))}`, W / 2, 41); }
        if (phase !== 'play') { g.fillStyle = 'rgba(15,22,40,.6)'; g.fillRect(0, 44, W, H - 44); g.textAlign = 'center';
          if (phase === 'ready') { if (IM.ball.complete) g.drawImage(IM.ball, W / 2 - 46, 160, 92, 63); g.fillStyle = '#fff'; g.font = 'bold 34px "Gowun Dodum", sans-serif'; g.fillText('눈싸움 대작전', W / 2, 270);
            g.font = '19px "Gowun Dodum", sans-serif'; g.fillStyle = '#d7e2f5'; g.fillText(`60초 동안 ${GOAL}점 · 날아오는 눈덩이는 눌러서 막아요 · 최고 ${best}점`, W / 2, 308); g.fillStyle = '#bfe2ff'; g.fillText('화면을 눌러 시작', W / 2, 360); again = null; }
          else { g.fillStyle = '#fff'; g.font = 'bold 30px "Gowun Dodum", sans-serif'; g.fillText(hearts <= 0 ? '눈덩이에 푹 파묻혔어요!' : score >= GOAL ? '눈싸움 대장!' : '조금만 더!', W / 2, 130);
            const n = score >= GOAL * 2 ? 3 : score >= GOAL ? 2 : score >= GOAL / 2 ? 1 : 0; for (let i = 0; i < 3; i++) star5(W / 2 - 70 + i * 70, 190, 24, i < n ? '#ffd76a' : 'rgba(255,255,255,.18)');
            g.font = 'bold 42px "Gowun Dodum", sans-serif'; g.fillStyle = '#fff'; g.fillText(`${score}점`, W / 2, 270); g.font = '18px "Gowun Dodum", sans-serif'; g.fillStyle = '#c9d6ee'; g.fillText(`맞힌 눈사람 ${hitN} · 막은 눈덩이 ${blockN} · 최고 기록 ${best}점`, W / 2, 304);
            again = { x: W / 2, y: 372 }; g.fillStyle = '#bfe2ff'; g.beginPath(); g.roundRect(W / 2 - 90, 348, 180, 48, 24); g.fill(); g.fillStyle = '#1f2a44'; g.font = 'bold 20px "Gowun Dodum", sans-serif'; g.fillText('다시 하기', W / 2, 379); } }
        requestAnimationFrame(draw); }
      reset(); requestAnimationFrame(draw);
      return { reset, result() { if (!done) return null; const o = cv(260, 200), x = o.getContext('2d'); x.drawImage(can, 150, 200, 500, 300, 0, 22, 260, 156); return { img: o.toDataURL('image/png'), score: best }; }, stop() { alive = false; } };
    },
  };

  /* ───────── 별똥별 소원 미니게임: 40초 동안 별똥별을 잡아 소원 점수를 모아요 ───────── */
  plays.shoot = {
    title: '별똥별 소원 빌기', doneLabel: '소원 간직하기', doneMsg: '별똥별에 소원을 가득 빌었어요. 마을 밤하늘에 가끔 별똥별이 지나가요.',
    start(board, api) {
      board.className = 'pboard shootb';
      const W = 800, H = 500, can = cv(W, H, 'shootcv'), g = can.getContext('2d'); board.append(can);
      const sky = pic('sky_night.jpg'), TIME = 40, GOAL = 30;
      const stars = Array.from({ length: 80 }, () => ({ x: rnd(0, W), y: rnd(0, 320), r: rnd(.6, 1.8), p: rnd(0, 6) }));
      let best = 0; try { best = +localStorage.getItem('advent_shoot_best') || 0; } catch (e) { /* 저장 안 됨 */ }
      let alive = true, phase, fall, fx, pops, score, combo, maxCombo, left, next, shower, last, done, caught, shake, plane, again;
      function reset() { phase = 'ready'; fall = []; fx = []; pops = []; score = 0; combo = 0; maxCombo = 0; left = TIME; next = .6; shower = 12; caught = 0; shake = 0; plane = null; done = done || false;
        api.ready(done); api.guide(`40초 동안 별똥별을 눌러 잡아요. 금빛 별은 5점, 연달아 잡으면 점수가 커져요. 깜빡이는 비행기는 누르면 안 돼요. ${GOAL}점이면 소원 완성!`); }
      const lvl = () => 1 + (TIME - left) / TIME * 1.4;           // 시간이 갈수록 빨라짐
      function spawn(kind) { const L = lvl(), gold = kind === 'gold', sp = (gold ? rnd(240, 300) : rnd(330, 450)) * L, a = rnd(2.3, 2.75);
        fall.push({ x0: rnd(320, 980), y0: rnd(-50, 70), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: gold ? rnd(1.8, 2.2) : rnd(1.1, 1.5) / Math.sqrt(L) + .35, gold, r: gold ? 7 : 4.5 }); }
      const pos = s => ({ x: s.x0 + s.vx * s.t, y: s.y0 + s.vy * s.t });
      function chime(n) { const base = [1047, 1175, 1319, 1397, 1568, 1760, 1976, 2093]; const f = base[Math.min(n, base.length - 1)]; tone(f, .45, .05, 'sine', f * 1.5); }
      can.addEventListener('pointerdown', e => { e.preventDefault(); const q = at(e, can);
        if (phase !== 'play') { if (phase === 'ready' || (phase === 'end' && again && Math.hypot(q.x - again.x, q.y - again.y) < 90)) { if (phase === 'end') reset(); phase = 'play'; tone(660, .2, .05, 'triangle', 990); } return; }
        if (plane) { const px = plane.x, py = plane.y; if (Math.abs(q.x - px) < 46 && Math.abs(q.y - py) < 22) { combo = 0; score = Math.max(0, score - 3); shake = .35; pops.push({ x: px, y: py - 20, t: 0, txt: '-3', c: '#ff9a9a' }); tone(180, .25, .06, 'square'); return; } }
        let hit = null, hd = 1e9; for (const s of fall) { if (s.got) continue; const p = pos(s), d = Math.hypot(q.x - p.x, q.y - p.y); if (d < (s.gold ? 58 : 50) && d < hd) { hit = s; hd = d; } }
        if (hit) { hit.got = true; caught++; combo++; maxCombo = Math.max(maxCombo, combo); const mul = Math.min(5, 1 + Math.floor(combo / 3)), pt = (hit.gold ? 5 : 1) * mul; score += pt;
          const p = pos(hit); fx.push({ x: p.x, y: p.y, t: 0, gold: hit.gold }); pops.push({ x: p.x, y: p.y - 18, t: 0, txt: '+' + pt + (mul > 1 ? ` ×${mul}` : ''), c: hit.gold ? '#ffd76a' : '#fff4cf' }); chime(combo - 1);
          if (score >= GOAL && !done) { done = true; api.ready(true); } }
        else { if (combo > 2) pops.push({ x: q.x, y: q.y, t: 0, txt: '콤보 끝', c: '#b8c8e8' }); combo = 0; fx.push({ x: q.x, y: q.y, t: .55, small: 1 }); } });
      function star5(x, y, r, c) { g.fillStyle = c; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * 6.283 - 1.571, rr = k % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
      function draw(ts) { if (!alive || !board.isConnected) return; const dt = last ? Math.min(.05, ts / 1000 - last) : 0; last = ts / 1000;
        g.save(); if (shake > 0) { shake -= dt; g.translate(rnd(-5, 5), rnd(-4, 4)); }
        g.fillStyle = '#0b1a33'; g.fillRect(-10, -10, W + 20, H + 20);
        if (sky.complete) { const k = Math.max(W / sky.naturalWidth, H / sky.naturalHeight); g.drawImage(sky, (W - sky.naturalWidth * k) / 2, H - sky.naturalHeight * k, sky.naturalWidth * k, sky.naturalHeight * k); }
        for (const s of stars) { g.globalAlpha = .35 + .65 * Math.abs(Math.sin(ts / 700 + s.p)); g.fillStyle = '#fff'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill(); } g.globalAlpha = 1;
        if (phase === 'play') { left -= dt; next -= dt; shower -= dt;
          if (next <= 0) { next = rnd(.55, 1.15) / lvl(); spawn(Math.random() < .12 ? 'gold' : 'n'); }
          if (shower <= 0) { shower = rnd(10, 13); for (let i = 0; i < 6; i++) setTimeout(() => phase === 'play' && spawn(i === 3 ? 'gold' : 'n'), i * 160); pops.push({ x: W / 2, y: 120, t: 0, txt: '유성우!', c: '#ffe7a0', big: 1 }); }
          if (!plane && Math.random() < dt * .09 && left < TIME - 6) plane = { x: -40, y: rnd(70, 200), v: rnd(70, 95) };
          if (left <= 0) { left = 0; phase = 'end'; fall.forEach(s => s.got = true); const nb = score > best; if (nb) { best = score; try { localStorage.setItem('advent_shoot_best', best); } catch (e) { /* 저장 안 됨 */ } }
            api.guide(score >= GOAL ? `소원 완성! ${score}점 (최고 ${best}점). 다시 해도 되고, 아래 버튼으로 간직해요.` : `${score}점이에요. ${GOAL}점까지 조금만 더! 별을 눌러 다시 해 봐요.`); } }
        if (plane) { plane.x += plane.v * dt; const on = Math.floor(ts / 350) % 2; g.fillStyle = '#1d2a44'; g.fillRect(plane.x - 22, plane.y - 3, 44, 6); g.fillRect(plane.x - 6, plane.y - 12, 8, 24);
          g.fillStyle = on ? '#ff5a5a' : '#5a1f28'; g.beginPath(); g.arc(plane.x - 22, plane.y, 3, 0, 7); g.fill(); g.fillStyle = on ? '#cfe8ff' : '#2a3a55'; g.beginPath(); g.arc(plane.x + 22, plane.y, 3, 0, 7); g.fill(); if (plane.x > W + 50) plane = null; }
        for (const s of fall) { s.t += dt; if (s.got) continue; const { x, y } = pos(s), fade = Math.min(1, (s.life - s.t) * 3, s.t * 6), tl = s.gold ? .4 : .28;
          const gr = g.createLinearGradient(x, y, x - s.vx * tl, y - s.vy * tl), col = s.gold ? '255,214,110' : '255,245,210'; gr.addColorStop(0, `rgba(${col},${fade})`); gr.addColorStop(1, `rgba(${col},0)`);
          g.strokeStyle = gr; g.lineWidth = s.gold ? 6 : 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x - s.vx * tl, y - s.vy * tl); g.stroke();
          g.shadowColor = s.gold ? '#ffcf55' : '#fff3c4'; g.shadowBlur = s.gold ? 22 : 12; g.globalAlpha = fade;
          if (s.gold) star5(x, y, 11, '#ffe08a'); else { g.fillStyle = '#fffbea'; g.beginPath(); g.arc(x, y, s.r, 0, 7); g.fill(); }
          g.shadowBlur = 0; g.globalAlpha = 1; if (s.t >= s.life && phase === 'play' && combo > 0 && !s.gold) { /* 놓쳐도 콤보는 유지 */ } }
        fall = fall.filter(s => s.t < s.life && !s.got);
        for (const b of fx) { b.t += dt; const k = b.t, n = b.small ? 5 : b.gold ? 20 : 12; g.globalAlpha = Math.max(0, 1 - k); g.fillStyle = b.gold ? '#ffd76a' : '#ffefb8';
          for (let i = 0; i < n; i++) { const a = i / n * 6.283 + k, d = k * (b.small ? 26 : b.gold ? 140 : 95); if (b.small) { g.beginPath(); g.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, 1.4, 0, 7); g.fill(); } else star5(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, b.gold ? 4 : 3, g.fillStyle); } g.globalAlpha = 1; }
        fx = fx.filter(b => b.t < 1);
        g.textAlign = 'center'; for (const p of pops) { p.t += dt; g.globalAlpha = Math.max(0, 1 - p.t / (p.big ? 1.4 : .9)); g.fillStyle = p.c; g.font = `bold ${p.big ? 38 : 22}px "Gowun Dodum", sans-serif`; g.fillText(p.txt, p.x, p.y - p.t * 34); } g.globalAlpha = 1;
        pops = pops.filter(p => p.t < (p.big ? 1.4 : .9));
        // 위쪽 정보 줄: 남은 시간 막대, 점수, 콤보
        g.fillStyle = 'rgba(8,16,34,.55)'; g.fillRect(0, 0, W, 46); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(170, 18, 460, 10);
        const tk = left / TIME; g.fillStyle = tk < .2 ? '#ff9a7a' : '#ffe08a'; g.fillRect(170, 18, 460 * tk, 10);
        g.font = 'bold 22px "Gowun Dodum", sans-serif'; g.textAlign = 'left'; g.fillStyle = '#fff4cf'; g.fillText(`★ ${score}`, 22, 31);
        g.textAlign = 'right'; g.fillStyle = combo >= 3 ? '#ffd76a' : '#c9d6ee'; g.fillText(combo >= 3 ? `${combo} 콤보 ×${Math.min(5, 1 + Math.floor(combo / 3))}` : `${Math.ceil(left)}초`, W - 22, 31);
        // 목표 점선
        g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(170 + 460 * 0, 0, 0, 0);
        if (phase === 'ready' || phase === 'end') { g.fillStyle = 'rgba(6,12,28,.62)'; g.fillRect(0, 46, W, H - 46); g.textAlign = 'center';
          if (phase === 'ready') { star5(W / 2, 205, 40 + Math.sin(ts / 300) * 4, '#ffe08a'); g.fillStyle = '#fff'; g.font = 'bold 34px "Gowun Dodum", sans-serif'; g.fillText('별똥별 소원 빌기', W / 2, 300);
            g.font = '20px "Gowun Dodum", sans-serif'; g.fillStyle = '#d7e2f5'; g.fillText(`40초 동안 ${GOAL}점을 모아요 · 최고 기록 ${best}점`, W / 2, 338); g.fillStyle = '#ffe08a'; g.fillText('화면을 눌러 시작', W / 2, 390); again = null; }
          else { g.fillStyle = '#fff'; g.font = 'bold 30px "Gowun Dodum", sans-serif'; g.fillText(score >= GOAL ? '소원이 이루어질 거예요!' : '조금만 더!', W / 2, 140);
            const n = score >= GOAL * 2 ? 3 : score >= GOAL ? 2 : score >= GOAL / 2 ? 1 : 0; for (let i = 0; i < 3; i++) star5(W / 2 - 70 + i * 70, 205, 26, i < n ? '#ffd76a' : 'rgba(255,255,255,.18)');
            g.font = 'bold 44px "Gowun Dodum", sans-serif'; g.fillStyle = '#fff4cf'; g.fillText(`${score}점`, W / 2, 290);
            g.font = '19px "Gowun Dodum", sans-serif'; g.fillStyle = '#c9d6ee'; g.fillText(`잡은 별 ${caught}개 · 최고 콤보 ${maxCombo} · 최고 기록 ${best}점`, W / 2, 326);
            again = { x: W / 2, y: 392 }; g.fillStyle = '#ffe08a'; g.beginPath(); g.roundRect(W / 2 - 90, 368, 180, 48, 24); g.fill(); g.fillStyle = '#2a2140'; g.font = 'bold 20px "Gowun Dodum", sans-serif'; g.fillText('다시 하기', W / 2, 399); } }
        g.restore(); requestAnimationFrame(draw); }
      done = false; reset(); requestAnimationFrame(draw);
      return { reset() { reset(); }, result() { if (!done) return null; const o = cv(240, 160), x = o.getContext('2d'); x.drawImage(can, 0, 46, W, H - 46, 0, 0, 240, 150); return { img: o.toDataURL('image/png'), wishes: caught, score: Math.max(score, best) }; }, stop() { alive = false; } };
    },
  };

  window.__plays = plays;
  // 첫 화면이 뜬 뒤 쉬는 동안 놀이 그림을 조금씩 미리 불러 둠
  window.__preloadPlays = () => { const src = Object.values(plays).map(p => p.start.toString()).join(' '), set = new Set(); (src.match(/'[\w-]+\.(?:png|jpg)'/g) || []).forEach(m => set.add(m.slice(1, -1)));
    const list = [...set], keep = []; let i = 0; const next = () => { if (i >= list.length) return; const im = new Image(); keep.push(im); im.onload = im.onerror = () => setTimeout(next, 30); im.src = 'assets/' + list[i++]; };
    for (let k = 0; k < 4; k++) next(); };
})();
