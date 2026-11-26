// 마을 화면(app.js)이 쓰는 window.desk를 타우리용으로 만들어 줍니다. (예전 일렉트론 preload.js와 같은 역할)
(function () {
  const inv = (cmd, args) => {
    const t = window.__TAURI_INTERNALS__;
    return t ? t.invoke(cmd, args) : Promise.resolve();
  };
  let ignoring = true;
  window.desk = {
    load: () => (typeof window.__ADVENT_STATE__ === 'string' ? window.__ADVENT_STATE__ : null),
    save: raw => { inv('save_state', { raw }).catch(() => {}); },
    setIgnore: on => { ignoring = !!on; inv('set_ignore', { on: !!on }).catch(() => {}); },
    setTop: on => { inv('set_top', { on: !!on }).catch(() => {}); },
    quit: () => { inv('quit_app').catch(() => {}); },
  };
  // 클릭이 바탕화면으로 통과하는 동안에는 창이 마우스 움직임을 못 받아요.
  // 그래서 프로그램이 마우스 위치를 알려 주면, 그걸로 움직임을 대신 만들어 그림 위에 올라왔는지 확인해요.
  // 아이콘 밑에 깔려 있을 때(__adventWall)는 늘 이 방법으로 받아요.
  window.__adventWall = false;
  // 아이콘 밑에 깔렸을 때: 원래 배경화면이 가려지므로 같은 그림을 마을 뒤에 깔아요 (null이면 걷기, 'keep'이면 전에 받은 그림 다시 보이기)
  let deskEl = null, deskUrl = '', deskCol = '#000';
  window.__deskBg = (url, col) => {
    if (!deskEl) { deskEl = document.createElement('div'); deskEl.id = 'deskBg'; deskEl.style.cssText = 'position:fixed;left:0;top:0;z-index:-1;pointer-events:none;background-position:center;background-size:cover;background-repeat:no-repeat;display:none'; (document.body || document.documentElement).prepend(deskEl); }
    if (url === null) { deskEl.style.display = 'none'; return; }
    if (url !== 'keep') { deskUrl = url || ''; deskCol = col || '#000'; deskEl.style.backgroundImage = deskUrl ? 'url("' + deskUrl + '")' : 'none'; deskEl.style.backgroundColor = deskCol; }
    deskEl.style.width = screen.width + 'px'; deskEl.style.height = screen.height + 'px'; deskEl.style.display = 'block';
  };
  // 이렇게 대신 만든 움직임에는 브라우저의 :hover(마우스 올리면 바뀌는 모양)가 안 생겨요.
  // 그래서 :hover 규칙을 .hov 이름표로 똑같이 하나 더 만들고, 마우스 아래 요소에 이름표를 붙여요.
  let hovSet = new Set();
  const setHov = el => {
    const next = new Set();
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) next.add(e);
    hovSet.forEach(e => { if (!next.has(e)) e.classList.remove('hov'); });
    next.forEach(e => { if (!hovSet.has(e)) e.classList.add('hov'); });
    hovSet = next;
  };
  const copyHoverRules = () => {
    const out = [];
    const walk = rules => {
      for (const r of rules) {
        if (r.cssRules && r.media) { const inner = []; const keep = out.length; walk(r.cssRules); const got = out.splice(keep); if (got.length) out.push('@media ' + r.media.mediaText + '{' + got.join('') + '}'); continue; }
        if (r.selectorText && r.selectorText.includes(':hover')) out.push(r.selectorText.replace(/:hover/g, '.hov') + '{' + r.style.cssText + '}');
      }
    };
    for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch (_) {} }
    const st = document.createElement('style'); st.textContent = out.join('\n'); document.head.appendChild(st);
  };
  window.addEventListener('load', copyHoverRules);
  // 진짜 마우스가 들어오면(마을이 앞에 나왔을 때) 대신 붙인 이름표는 지움
  window.addEventListener('mousemove', e => { if (e.isTrusted && hovSet.size) setHov(null); }, { passive: true, capture: true });
  window.__adventCursor = (x, y) => {
    if (!ignoring && !window.__adventWall) return;
    setHov(document.elementFromPoint(x, y));
    window.dispatchEvent(new MouseEvent('mousemove', { clientX: x, clientY: y }));
  };
  // 아이콘 밑에서 마을을 눌렀을 때, 앞으로 꺼낸 다음 그 자리를 대신 눌러 줘요.
  window.__adventClick = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return;
    const o = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, view: window };
    try { el.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ pointerId: 1, isPrimary: true }, o))); } catch (_) {}
    el.dispatchEvent(new MouseEvent('mousedown', o));
    try { el.dispatchEvent(new PointerEvent('pointerup', Object.assign({ pointerId: 1, isPrimary: true }, o))); } catch (_) {}
    el.dispatchEvent(new MouseEvent('mouseup', o));
    el.dispatchEvent(new MouseEvent('click', o));
  };
  // 놀이 창이 열렸는지, 빗자루·눈 굴리기 중인지 프로그램에 알려 줌 (열려 있을 때만 마을이 아이콘 앞으로 나옴)
  let front = false, queued = false;
  const check = () => {
    queued = false;
    const b = document.body; if (!b) return;
    const f = !!document.querySelector('.layer:not([hidden])') || b.classList.contains('sweeping') || b.classList.contains('rolling');
    if (f !== front) { front = f; inv('set_front', { on: f }).catch(() => {}); }
  };
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(check); } };
  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(later).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] });
    check();
  });
})();
