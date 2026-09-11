
(function () {
  var root = document.documentElement;
  var ls = localStorage;
  function getT(d){return d==='dark'?'dark':'light'}
  var cur = getT(ls.getItem('sb-theme')) || 'light';
  root.setAttribute('data-theme', cur);
  var themeBtn = document.getElementById('themeToggle');
  var sun = '☀️', moon = '🌙';
  function paintTheme(b){ if(b) b.textContent = (root.getAttribute('data-theme') === 'dark') ? sun : moon; }
  paintTheme(themeBtn);
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var n = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', n); ls.setItem('sb-theme', n); paintTheme(themeBtn);
  });

  /* ---------- 折叠侧栏（中/窄屏） ---------- */
  var toc = document.getElementById('toc');
  var menuBtn = document.getElementById('menuToggle');
  var scrim = document.createElement('div');
  scrim.className = 'scrim';
  document.body.appendChild(scrim);
  function closeMenu(){ toc.classList.remove('open'); scrim.classList.remove('show'); }
  function toggleMenu(){ var open = toc.classList.toggle('open'); scrim.classList.toggle('show', open); menuBtn.setAttribute('aria-expanded', open); }
  if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
  scrim.addEventListener('click', closeMenu);
  if (toc) toc.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ if (scrim.classList.contains('show') || toc.classList.contains('open')) closeMenu(); }); });

  /* ---------- 全文搜索 ---------- */
  var input = document.getElementById('searchInput');
  var res = document.getElementById('searchResults');
  var index = [];
  var isSub = location.pathname.split('/').filter(Boolean).length > 1;
  var idxBase = isSub ? '../' : '';
  if (input && res) {
    fetch(idxBase + 'search-index.json').then(function (r) { return r.json(); }).then(function (d) { index = d; }).catch(function () {});
    function highlight(t, q) {
      var lo = t.toLowerCase(), i = lo.indexOf(q);
      if (i < 0) return t;
      return t.slice(0, i) + '<b>' + t.slice(i, i + q.length) + '</b>' + t.slice(i + q.length);
    }
    input.addEventListener('input', function () {
      var q = (input.value || '').trim().toLowerCase();
      if (q.length < 2) { res.hidden = true; return; }
      var hits = [];
      for (var i = 0; i < index.length; i++) { var p = index[i]; if ((p.title + ' ' + p.text).toLowerCase().indexOf(q) > -1) hits.push(p); if (hits.length === 12) break; }
      if (!hits.length) { res.innerHTML = '<div class="badge">未找到相关内容，换个关键词试试</div>'; }
      else {
        res.innerHTML = hits.map(function (h) {
          var t = highlight(h.title, q);
          var sn = 0, idx = h.text.toLowerCase().indexOf(q);
          if (idx > 40) sn = idx - 20;
          var snippet = (sn > 0 ? '…' : '') + h.text.slice(sn, sn + 90);
          var snHtml = highlight(snippet, q);
          return '<a href="' + idxBase + h.rel + '"><span class="s-title">' + t + '</span><abbr>' + snHtml + '</abbr></a>';
        }).join('');
      }
      res.hidden = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input && !/input|textarea/i.test(document.activeElement.tagName)) {
        e.preventDefault(); input.focus(); input.select();
      }
      if (e.key === 'Escape') { input.blur(); res.hidden = true; }
    });
  }

  /* ---------- 阅读进度条 + 返回顶部 + 章节高亮 + 顶部位置指示 ---------- */
  var pbar = document.getElementById('progressBar');
  var topBtn = document.getElementById('topBtn');
  var posInd = document.getElementById('posIndicator');
  var posText = document.getElementById('posText');
  var anchors = Array.prototype.slice.call(document.querySelectorAll('.toc-anchor'));
  var headings = anchors.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
  var ticking = false;
  var curChapter = -1;
  function setPos(k) {
    if (!posText || !anchors[k]) return;
    if (k === curChapter) return;
    curChapter = k;
    var txt = anchors[k].textContent.trim();
    if (txt.length > 22) txt = txt.slice(0, 22) + '…';
    posText.textContent = '当前：' + txt;
  }
  function onScroll() {
    ticking = false;
    var st = window.scrollY || document.documentElement.scrollTop;
    var dh = document.documentElement.scrollHeight - window.innerHeight;
    if (pbar) pbar.style.width = (dh > 0 ? Math.min(100, (st / dh) * 100) : 0) + '%';
    if (topBtn) topBtn.classList.toggle('show', st > 240);
    // 章节高亮 + 顶部指示
    if (anchors.length) {
      var cur = null;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i] && headings[i].getBoundingClientRect().top <= 96) cur = i;
      }
      if (cur === null && headings.length) cur = 0;
      anchors.forEach(function (a, k) { a.classList.toggle('active', k === cur); });
      setPos(cur);
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) requestAnimationFrame(onScroll); }, { passive: true });
  if (topBtn) topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  if (posInd) posInd.addEventListener('click', function () {
    if (anchors[curChapter]) {
      var h = document.getElementById(anchors[curChapter].getAttribute('href').slice(1));
      if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  onScroll();

  /* ---------- Mermaid ---------- */
  if (window.mermaid) {
    mermaid.initialize({ startOnLoad: true, theme: 'neutral', fontFamily: 'inherit', securityLevel: 'loose' });
    mermaid.run({ nodes: document.querySelectorAll('.mermaid') });
  }
})();
