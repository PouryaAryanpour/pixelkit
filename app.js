/* ============================================================================
   PixelKit — application logic
   100% client-side: HEIC decode, resize, filters, watermark, encode, ZIP.
   No network requests, no upload, no storage.
   ========================================================================= */
(function () {
  'use strict';

  /* ------------------------------- constants ------------------------------ */
  var MAX_FILES = 50;
  var FA = '۰۱۲۳۴۵۶۷۸۹';

  var SIZE_PRESETS = [
    { label: 'اینستاگرام مربع', w: 1080, h: 1080, sub: '1080×1080' },
    { label: 'اینستاگرام استوری', w: 1080, h: 1920, sub: '1080×1920' },
    { label: 'اینستاگرام پست', w: 1080, h: 1350, sub: '1080×1350' },
    { label: 'یوتیوب تامبنیل', w: 1280, h: 720, sub: '1280×720' },
    { label: 'یوتیوب بنر', w: 2560, h: 1440, sub: '2560×1440' },
    { label: 'X (توییتر)', w: 1600, h: 900, sub: '1600×900' },
    { label: 'لینکدین', w: 1200, h: 627, sub: '1200×627' },
    { label: 'پینترست', w: 1000, h: 1500, sub: '1000×1500' },
    { label: 'تلگرام', w: 1280, h: 640, sub: '1280×640' },
    { label: 'واتساپ', w: 1200, h: 1200, sub: '1200×1200' },
    { label: 'Full HD', w: 1920, h: 1080, sub: '1920×1080' },
    { label: '4K', w: 3840, h: 2160, sub: '3840×2160' }
  ];

  var TONES = [
    { id: 'none', label: 'اصلی' },
    { id: 'mono', label: 'سیاه‌وسفید' },
    { id: 'sepia', label: 'سپیا' },
    { id: 'vivid', label: 'پررنگ' },
    { id: 'soft', label: 'روشن' },
    { id: 'cinema', label: 'سینمایی' },
    { id: 'invert', label: 'معکوس' }
  ];

  var BG_COLORS = [
    { v: '#FFFFFF', n: 'سفید' },
    { v: '#000000', n: 'مشکی' },
    { v: '#6D28D9', n: 'بنفش' },
    { v: '#EC4899', n: 'صورتی' },
    { v: '#F3F1FF', n: 'خاکستری روشن' }
  ];

  var WM_COLORS = ['#FFFFFF', '#000000', '#FDE68A', '#F472B6', '#22D3EE'];

  var ACCENTS = [
    { id: 'violet', c: ['#6D28D9', '#A855F7', '#EC4899'] },
    { id: 'sunset', c: ['#C2410C', '#F97316', '#F43F5E'] },
    { id: 'ocean', c: ['#0E7490', '#06B6D4', '#3B82F6'] },
    { id: 'emerald', c: ['#047857', '#10B981', '#84CC16'] },
    { id: 'rose', c: ['#BE123C', '#F43F5E', '#FB7185'] },
    { id: 'indigo', c: ['#3730A3', '#6366F1', '#8B5CF6'] },
    { id: 'gold', c: ['#A16207', '#F59E0B', '#FBBF24'] },
    { id: 'magenta', c: ['#86198F', '#D946EF', '#EC4899'] }
  ];

  var FEATURES = [
    { i: 'i-wand', t: 'تبدیل HEIC و HEIF', d: 'فرمت‌های آیفون و مک را به JPG، PNG یا WebP تبدیل کنید — با رمزگشایی کامل در مرورگر.' },
    { i: 'i-compress', t: 'فشرده‌سازی هوشمند', d: 'کیفیت و ابعاد را تنظیم کنید؛ حالت خودکار سبک‌ترین خروجی بین WebP و JPG را انتخاب می‌کند.' },
    { i: 'i-ruler', t: 'اندازه‌های آماده شبکه‌های اجتماعی', d: 'از اینستاگرام و یوتیوب تا لینکدین و پینترست؛ یک کلیک و ابعاد دقیق.' },
    { i: 'i-crop', t: 'برش، کشیدن و تغییر نسبت', d: 'پر کردن و برش مرکزی، جا دادن با حاشیه یا کشیدن بدون تغییر نسبت.' },
    { i: 'i-rotate-cw', t: 'چرخش و برگرداندن', d: 'چرخش ۹۰ درجه‌ای و آینه‌ای، بدون افت کیفیت و بدون تغییر نسبت تصویر.' },
    { i: 'i-sliders', t: 'فیلتر رنگ و شارپ', d: 'روشنایی، کنتراست، اشباع، محو‌شدگی، تغییر فام، سیاه‌وسفید و سپیا.' },
    { i: 'i-stamp', t: 'واترمارک متنی', d: 'متن دلخواه با اندازه، رنگ، شفافیت و موقعیت‌های مختلف روی خروجی.' },
    { i: 'i-palette', t: 'استخراج پالت رنگ', d: 'رنگ‌های غالب تصویر را بیرون بکشید تا از آن‌ها در طراحی استفاده کنید.' },
    { i: 'i-eye', t: 'مقایسه قبل و بعد', d: 'یک دسته‌کشیدنی بین تصویر اصلی و خروجی، برای دیدن دقیق تغییرات.' },
    { i: 'i-shield', t: 'حذف EXIF و GPS', d: 'خروجی از نو کدگذاری می‌شود؛ موقعیت مکانی و مشخصات دوربین منتقل نمی‌شود.' },
    { i: 'i-zip', t: 'خروجی ZIP دسته‌ای', d: 'تا ۵۰ فایل را یک‌جا پردازش کنید و همه را در یک فایل فشرده بگیرید.' },
    { i: 'i-layers-off', t: 'بدون آپلود، بدون ردیابی', d: 'نه کوکی، نه فونت‌سنج، نه آنالیز. حتی فونت و اسکریپت‌ها هم محلی‌اند.' }
  ];

  /* --------------------------------- DOM ---------------------------------- */
  function $(sel) {
    var c = String(sel).charAt(0);
    return (c === '#' || c === '.' || c === '[')
      ? document.querySelector(sel)
      : document.getElementById(sel);
  }
  var el = {
    drop: $('drop'), file: $('file'), list: $('list'), results: $('results'),
    summary: $('summary'), stats: $('stats'), err: $('err'), prog: $('prog'),
    btnProcess: $('convert'), btnZip: $('dlZip'), btnClear: $('clear'),
    toast: $('toast'), modal: $('compareModal'),
    themeBtn: $('themeBtn'), accentBtn: $('accentBtn'), accentMenu: $('accentMenu'),
    accentSwatches: $('accentSwatches'), menuBtn: $('menuBtn'), mainnav: $('mainnav'),
    format: $('format'), cFormat: $('cFormat'), quality: $('quality'), cQuality: $('cQuality'),
    cMaxW: $('cMaxW'), outW: $('outW'), outH: $('outH'), fitMode: $('fitMode'),
    smart: $('smartFormat'), nameTpl: $('nameTpl'),
    bgSwatches: $('bgSwatches'), sizePresets: $('sizePresets'), toneChips: $('toneChips'),
    wmSwatches: $('wmSwatches'), wmPos: $('wmPos'), featureGrid: $('featureGrid')
  };

  var state = {
    files: [], results: [], tab: 'convert',
    bg: '#FFFFFF', wmColor: '#FFFFFF', wmPos: 'br',
    tone: 'none', accent: 'violet', theme: 'dark',
    rotate: 0, flipH: false, flipV: false,
    urls: [], busy: false
  };

  /* -------------------------------- utils --------------------------------- */
  function faNum(n) { return String(n).replace(/\d/g, function (d) { return FA[d]; }); }
  function bytes(n) {
    if (!n) return '۰';
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(2) + ' MB';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var toastTimer;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove('on'); }, 2800);
  }
  function showErr(msg) {
    if (!msg) { el.err.hidden = true; el.err.textContent = ''; return; }
    el.err.hidden = false;
    el.err.textContent = msg;
  }
  function setProg(pct, on) {
    el.prog.classList.toggle('on', !!on);
    el.prog.firstElementChild.style.width = Math.max(0, Math.min(100, pct)) + '%';
    el.prog.setAttribute('aria-valuenow', Math.round(pct));
  }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function hasPica() { return typeof pica !== 'undefined'; }

  /* ------------------------------- theme ---------------------------------- */
  function applyTheme(mode) {
    state.theme = mode;
    document.documentElement.setAttribute('data-theme', mode);
    try { localStorage.setItem('pk-theme', mode); } catch (e) { /* private mode */ }
    var metas = $$('meta[name="theme-color"]');
    metas.forEach(function (m) { m.setAttribute('content', mode === 'dark' ? '#07070E' : '#F2F0FC'); });
  }
  function applyAccent(id) {
    state.accent = id;
    document.documentElement.setAttribute('data-accent', id);
    try { localStorage.setItem('pk-accent', id); } catch (e) { /* ignore */ }
    $$('#accentSwatches button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.acc === id ? 'true' : 'false');
    });
  }
  (function initTheme() {
    var t = null, a = null;
    try { t = localStorage.getItem('pk-theme'); a = localStorage.getItem('pk-accent'); } catch (e) { /* ignore */ }
    if (!t) t = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    applyTheme(t);
    applyAccent(a || 'violet');
  })();

  el.themeBtn.addEventListener('click', function () {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  /* accent swatches */
  ACCENTS.forEach(function (a) {
    var b = document.createElement('button');
    b.type = 'button';
    b.dataset.acc = a.id;
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', 'رنگ ' + a.id);
    b.title = a.id;
    b.style.background = 'linear-gradient(135deg,' + a.c[0] + ',' + a.c[1] + ',' + a.c[2] + ')';
    b.addEventListener('click', function () {
      applyAccent(a.id);
      el.accentMenu.hidden = true;
      el.accentBtn.setAttribute('aria-expanded', 'false');
    });
    el.accentSwatches.appendChild(b);
  });
  el.accentBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = el.accentMenu.hidden;
    el.accentMenu.hidden = !open;
    el.accentBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', function (e) {
    if (!el.accentMenu.hidden && !el.accentMenu.contains(e.target) && e.target !== el.accentBtn) {
      el.accentMenu.hidden = true;
      el.accentBtn.setAttribute('aria-expanded', 'false');
    }
  });

  /* mobile nav */
  el.menuBtn.addEventListener('click', function () {
    var open = el.mainnav.classList.toggle('open');
    el.menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  el.mainnav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      el.mainnav.classList.remove('open');
      el.menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  /* -------------------------------- tabs ---------------------------------- */
  var tabs = $$('.tab');
  function selectTab(name) {
    state.tab = name;
    tabs.forEach(function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    $$('.panel').forEach(function (p) {
      var on = p.dataset.panel === name;
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t.dataset.tab); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus();
      selectTab(n.dataset.tab);
    });
  });

  /* ------------------------------ controls -------------------------------- */
  function syncSliders() {
    $('qv').textContent = faNum(el.quality.value);
    $('cqv').textContent = faNum(el.cQuality.value);
    $('cwv').textContent = faNum(el.cMaxW.value);
    $('brv').textContent = faNum($('brightness').value);
    $('cov').textContent = faNum($('contrast').value);
    $('sav').textContent = faNum($('saturate').value);
    $('blv').textContent = faNum($('blur').value);
    $('huv').textContent = faNum($('hue').value);
    $('shv').textContent = faNum($('sharpen').value);
    $('wmSizeV').textContent = faNum($('wmSize').value);
    $('wmOpacityV').textContent = faNum($('wmOpacity').value);

    var q = +el.quality.value;
    $('qHint').textContent = q >= 92 ? 'بیشترین کیفیت — فایل بزرگ‌تر'
      : q >= 78 ? 'تقریباً بدون افت کیفیت — پیشنهاد ما'
      : q >= 55 ? 'کیفیت خوب و حجم به‌مراتب کمتر'
      : 'کمترین حجم — کمی افت کیفیت';
    $('cqHint').textContent = q >= 85 ? 'کیفیت بالا'
      : q >= 65 ? 'تعادل خوب برای وب'
      : 'فشرده‌سازی شدید';

    var f = el.format.value;
    $('fmtHint').textContent = f === 'image/webp' ? 'کمترین حجم؛ پشتیبانی در همه مرورگرهای امروزی و اپ‌ها.'
      : f === 'image/png' ? 'بدون افت کیفیت؛ مناسب گرافیک، لوگو و شفافیت — حجم بزرگ‌تر.'
      : f === 'auto' ? 'برای هر فایل سبک‌ترین خروجی انتخاب می‌شود.'
      : 'بهترین گزینه برای ایمیل، Word، Photoshop و هر دستگاهی.';
  }

  function linkQuality(a, b) {
    a.addEventListener('input', function () { b.value = a.value; syncSliders(); });
    b.addEventListener('input', function () { a.value = b.value; syncSliders(); });
  }
  function linkFormat(a, b) {
    a.addEventListener('change', function () { b.value = a.value; syncSliders(); });
    b.addEventListener('change', function () { a.value = b.value; syncSliders(); });
  }
  linkQuality(el.quality, el.cQuality);
  linkFormat(el.format, el.cFormat);
  ['brightness', 'contrast', 'saturate', 'blur', 'hue', 'sharpen', 'wmSize', 'wmOpacity', 'cMaxW'].forEach(function (id) {
    var n = $(id); if (n) n.addEventListener('input', syncSliders);
  });
  el.format.addEventListener('change', syncSliders);
  el.cFormat.addEventListener('change', syncSliders);

  /* background swatches */
  BG_COLORS.forEach(function (c) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = c.v;
    b.title = c.n;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', c.v === state.bg ? 'true' : 'false');
    b.setAttribute('aria-label', c.n);
    b.addEventListener('click', function () {
      state.bg = c.v;
      $$('#bgSwatches .swatch').forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
      b.setAttribute('aria-checked', 'true');
    });
    el.bgSwatches.appendChild(b);
  });

  /* watermark colours */
  WM_COLORS.forEach(function (c) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.style.background = c;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', c === state.wmColor ? 'true' : 'false');
    b.setAttribute('aria-label', 'رنگ متن واترمارک ' + c);
    b.addEventListener('click', function () {
      state.wmColor = c;
      $$('#wmSwatches .swatch').forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
      b.setAttribute('aria-checked', 'true');
    });
    el.wmSwatches.appendChild(b);
  });

  /* watermark position */
  ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'].forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pos';
    b.dataset.pos = p;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', p === state.wmPos ? 'true' : 'false');
    b.setAttribute('aria-label', 'موقعیت ' + p);
    b.addEventListener('click', function () {
      state.wmPos = p;
      $$('#wmPos .pos').forEach(function (x) { x.setAttribute('aria-checked', 'false'); });
      b.setAttribute('aria-checked', 'true');
    });
    el.wmPos.appendChild(b);
  });

  /* size presets */
  SIZE_PRESETS.forEach(function (p) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.innerHTML = '<span>' + esc(p.label) + '</span><small>' + esc(p.sub) + '</small>';
    b.addEventListener('click', function () {
      el.outW.value = p.w;
      el.outH.value = p.h;
      $$('#sizePresets .chip').forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
    });
    el.sizePresets.appendChild(b);
  });
  [el.outW, el.outH].forEach(function (n) {
    n.addEventListener('input', function () {
      $$('#sizePresets .chip').forEach(function (x) { x.classList.remove('is-active'); });
    });
  });

  /* tone presets */
  TONES.forEach(function (t) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (t.id === 'none' ? ' is-active' : '');
    b.textContent = t.label;
    b.addEventListener('click', function () {
      state.tone = t.id;
      $$('#toneChips .chip').forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
    });
    el.toneChips.appendChild(b);
  });

  /* rotate / flip */
  $$('[data-rotate]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.rotate = (state.rotate + (+b.dataset.rotate) + 360) % 360;
      $$('[data-rotate]').forEach(function (x) { x.classList.remove('is-active'); });
      b.classList.add('is-active');
      toast('چرخش ' + faNum(state.rotate) + ' درجه');
    });
  });
  $$('[data-flip]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (b.dataset.flip === 'h') state.flipH = !state.flipH; else state.flipV = !state.flipV;
      b.classList.toggle('is-active', b.dataset.flip === 'h' ? state.flipH : state.flipV);
    });
  });
  $('resetEdit').addEventListener('click', function () {
    state.rotate = 0; state.flipH = false; state.flipV = false; state.tone = 'none';
    ['brightness', 'contrast', 'saturate', 'blur', 'hue', 'sharpen'].forEach(function (id) { $(id).value = 100; });
    $('blur').value = 0; $('hue').value = 0; $('sharpen').value = 0;
    $$('[data-rotate], [data-flip]').forEach(function (x) { x.classList.remove('is-active'); });
    $$('#toneChips .chip').forEach(function (x, i) { x.classList.toggle('is-active', i === 0); });
    syncSliders();
    toast('ویرایش‌ها بازنشانی شد');
  });

  /* features grid */
  FEATURES.forEach(function (f, i) {
    var card = document.createElement('article');
    card.className = 'feature-card';
    card.style.animation = 'rise .5s cubic-bezier(.16,1,.3,1) both';
    card.style.animationDelay = (i * 40) + 'ms';
    card.innerHTML =
      '<div class="feature-ico"><svg width="22" height="22" aria-hidden="true"><use href="#' + f.i + '"/></svg></div>' +
      '<h3>' + esc(f.t) + '</h3><p>' + esc(f.d) + '</p>';
    el.featureGrid.appendChild(card);
  });

  /* ------------------------------ file intake ----------------------------- */
  function isHeic(f) {
    return /\.(heic|heif|hif)$/i.test(f.name) || /image\/(heic|heif)/i.test(f.type || '');
  }
  function addFiles(list) {
    showErr('');
    var ok = [], bad = [];
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      if ((f.type && f.type.indexOf('image/') === 0) || /\.(heic|heif|hif)$/i.test(f.name)) ok.push(f);
      else bad.push(f.name);
    }
    if (bad.length) showErr('فایل غیرتصویری نادیده گرفته شد: ' + bad.join('، '));
    var room = MAX_FILES - state.files.length;
    if (ok.length > room) {
      showErr('حداکثر ' + faNum(MAX_FILES) + ' فایل در هر نوبت.');
      ok = ok.slice(0, Math.max(0, room));
    }
    state.files = state.files.concat(ok);
    syncButtons();
    if (ok.length) toast(faNum(ok.length) + ' فایل اضافه شد');
  }
  function syncButtons() {
    el.btnProcess.disabled = !state.files.length || state.busy;
    el.btnClear.disabled = (!state.files.length && !state.results.length) || state.busy;
    el.btnZip.disabled = !state.results.some(function (r) { return !r.error; }) || state.busy;
  }
  el.drop.addEventListener('click', function () { el.file.click(); });
  el.drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.file.click(); }
  });
  el.file.addEventListener('change', function () { addFiles(el.file.files); el.file.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) {
    el.drop.addEventListener(ev, function (e) { e.preventDefault(); el.drop.classList.add('over'); });
  });
  ['dragleave', 'dragend', 'drop'].forEach(function (ev) {
    el.drop.addEventListener(ev, function (e) { e.preventDefault(); el.drop.classList.remove('over'); });
  });
  el.drop.addEventListener('drop', function (e) {
    if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
  });
  window.addEventListener('paste', function (e) {
    if (!e.clipboardData || !e.clipboardData.files || !e.clipboardData.files.length) return;
    var imgs = [];
    for (var i = 0; i < e.clipboardData.files.length; i++) {
      if (e.clipboardData.files[i].type.indexOf('image/') === 0) imgs.push(e.clipboardData.files[i]);
    }
    if (imgs.length) { e.preventDefault(); addFiles(imgs); }
  });

  /* -------------------------------- engine -------------------------------- */
  function decodeHeic(file, targetFormat) {
    return new Promise(function (res, rej) {
      if (typeof heic2any === 'undefined') {
        rej(new Error('کتابخانه رمزگشایی HEIC بارگذاری نشد.'));
        return;
      }
      var blob = file.slice(0, file.size, file.type || 'image/heic');
      var first = targetFormat === 'image/jpeg' ? 'image/jpeg' : 'image/png';
      var second = first === 'image/jpeg' ? 'image/png' : 'image/jpeg';
      var q = first === 'image/jpeg' ? 0.92 : 1;
      function attempt(t, quality) {
        return heic2any({ blob: blob, toType: t, quality: quality }).then(function (out) {
          var b = Array.isArray(out) ? out[0] : out;
          if (!b) throw new Error('خروجی خالی');
          return b;
        });
      }
      attempt(first, q)
        .catch(function () { return attempt(second, 1); })
        .then(res)
        .catch(function (e) {
          rej(new Error('رمزگشایی ' + file.name + ' ناموفق بود (' +
            (e && e.message ? e.message : 'HEIC پشتیبانی نمی‌شود') + ')'));
        });
    });
  }

  function loadImage(blob) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); res(img); };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        rej(new Error('فایل تصویری خوانده نشد یا خراب است.'));
      };
      img.src = url;
    });
  }

  function orientedSize(w, h, rot) {
    return (rot === 90 || rot === 270) ? { w: h, h: w } : { w: w, h: h };
  }

  function drawOriented(canvas, img, iw, ih, rot, flipH, flipV, filter) {
    var size = orientedSize(iw, ih, rot);
    canvas.width = size.w;
    canvas.height = size.h;
    var ctx = canvas.getContext('2d');
    ctx.filter = filter || 'none';
    ctx.save();
    if (rot === 90) { ctx.translate(0, iw); ctx.rotate(-Math.PI / 2); }
    else if (rot === 180) { ctx.translate(iw, ih); ctx.rotate(Math.PI); }
    else if (rot === 270) { ctx.translate(ih, 0); ctx.rotate(Math.PI / 2); }
    if (flipH || flipV) {
      ctx.translate(flipH ? iw / 2 : 0, flipV ? ih / 2 : 0);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.translate(flipH ? -iw / 2 : 0, flipV ? -ih / 2 : 0);
    }
    ctx.drawImage(img, 0, 0, iw, ih);
    ctx.restore();
    ctx.filter = 'none';
  }

  function toneFilters() {
    var t = state.tone;
    return {
      gray: t === 'mono' ? 1 : 0,
      sepia: t === 'sepia' ? 0.55 : 0,
      invert: t === 'invert' ? 1 : 0,
      extra: t === 'vivid' ? 'saturate(1.35) contrast(1.08)'
        : t === 'soft' ? 'brightness(1.08) saturate(.92)'
        : t === 'cinema' ? 'contrast(1.2) saturate(.88) sepia(.12)'
        : ''
    };
  }

  function buildFilter() {
    var t = toneFilters();
    var p = [];
    var br = +$('brightness').value, co = +$('contrast').value, sa = +$('saturate').value;
    var bl = +$('blur').value, hu = +$('hue').value;
    if (br !== 100) p.push('brightness(' + (br / 100) + ')');
    if (co !== 100) p.push('contrast(' + (co / 100) + ')');
    if (sa !== 100) p.push('saturate(' + (sa / 100) + ')');
    if (bl) p.push('blur(' + bl + 'px)');
    if (hu) p.push('hue-rotate(' + hu + 'deg)');
    if (t.gray) p.push('grayscale(' + t.gray + ')');
    if (t.sepia) p.push('sepia(' + t.sepia + ')');
    if (t.invert) p.push('invert(' + t.invert + ')');
    if (t.extra) p.push(t.extra);
    return p.length ? p.join(' ') : 'none';
  }

  function sharpenCanvas(canvas, amount) {
    if (!amount) return;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    var img = ctx.getImageData(0, 0, w, h);
    var src = img.data, dst = new Uint8ClampedArray(src.length);
    var a = Math.min(1.2, amount / 100 * 1.2);
    var k = [0, -a, 0, -a, 1 + 4 * a, -a, 0, -a, 0];
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var i = (y * w + x) * 4;
        for (var c = 0; c < 3; c++) {
          var s = src[i + c] * k[4]
            + src[i - 4 + c] * k[1] + src[i + 4 + c] * k[7]
            + src[i - w * 4 + c] * k[3] + src[i + w * 4 + c] * k[5]
            + src[i - w * 4 - 4 + c] * k[0] + src[i - w * 4 + 4 + c] * k[2]
            + src[i + w * 4 - 4 + c] * k[6] + src[i + w * 4 + 4 + c] * k[8];
          dst[i + c] = s < 0 ? 0 : s > 255 ? 255 : s;
        }
        dst[i + 3] = src[i + 3];
      }
    }
    img.data.set(dst);
    ctx.putImageData(img, 0, 0);
  }

  function computeGeometry(ow, oh) {
    var outW = +el.outW.value || 0;
    var outH = +el.outH.value || 0;
    var maxW = +el.cMaxW.value || 0;
    var fit = el.fitMode.value;

    if (outW && outH) {
      if (fit === 'stretch') return { tw: outW, th: outH, mode: 'stretch' };
      if (fit === 'contain') return { tw: outW, th: outH, mode: 'contain' };
      return { tw: outW, th: outH, mode: 'cover' };
    }
    if (outW && !outH) return { tw: outW, th: Math.max(1, Math.round(oh * outW / ow)), mode: 'exact' };
    if (outH && !outW) return { th: outH, tw: Math.max(1, Math.round(ow * outH / oh)), mode: 'exact' };

    var scale = 1;
    if (maxW) scale = Math.min(scale, maxW / ow);
    scale = Math.min(1, scale);
    return { tw: Math.max(1, Math.round(ow * scale)), th: Math.max(1, Math.round(oh * scale)), mode: 'scale' };
  }

  function applyWatermark(ctx, w, h) {
    var text = $('wmText').value.trim();
    if (!text) return;
    var fs = Math.max(9, (+$('wmSize').value / 100) * w);
    ctx.save();
    ctx.globalAlpha = Math.max(0.05, +$('wmOpacity').value / 100);
    ctx.font = '700 ' + fs + 'px Vazirmatn, sans-serif';
    ctx.fillStyle = state.wmColor;
    ctx.textBaseline = 'middle';
    var m = fs * 0.55;
    var pos = state.wmPos;
    var x, y, align = 'center', base = 'middle';
    if (pos === 'tl') { x = m; y = m; align = 'left'; base = 'top'; }
    else if (pos === 'tc') { x = w / 2; y = m; base = 'top'; }
    else if (pos === 'tr') { x = w - m; y = m; align = 'right'; base = 'top'; }
    else if (pos === 'ml') { x = m; y = h / 2; align = 'left'; }
    else if (pos === 'mc') { x = w / 2; y = h / 2; }
    else if (pos === 'mr') { x = w - m; y = h / 2; align = 'right'; }
    else if (pos === 'bl') { x = m; y = h - m; align = 'left'; base = 'bottom'; }
    else if (pos === 'bc') { x = w / 2; y = h - m; base = 'bottom'; }
    else { x = w - m; y = h - m; align = 'right'; base = 'bottom'; }
    ctx.textAlign = align;
    ctx.textBaseline = base;
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur = Math.max(2, fs * 0.12);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function encode(canvas, type, quality) {
    return new Promise(function (res) {
      canvas.toBlob(function (blob) { res(blob); }, type, quality);
    });
  }

  function applyTemplate(origName, idx, w, h, ext) {
    var tpl = (el.nameTpl.value || '{name}.{ext}').trim();
    var base = (origName || 'image').replace(/\.[^.]+$/, '');
    return tpl
      .replace(/\{name\}/g, base)
      .replace(/\{i\}/g, (idx + 1 < 10 ? '00' : idx + 1 < 100 ? '0' : '') + (idx + 1))
      .replace(/\{n\}/g, String(idx + 1))
      .replace(/\{w\}/g, String(w))
      .replace(/\{h\}/g, String(h))
      .replace(/\{ext\}/g, ext)
      .replace(/[\\/:*?"<>|]/g, '_');
  }

  function processOne(file, index) {
    var targetFormat = el.format.value === 'auto' ? 'image/webp' : el.format.value;
    var src = isHeic(file) ? decodeHeic(file, targetFormat) : Promise.resolve(file);

    return src
      .then(loadImage)
      .then(function (img) {
        var iw = img.naturalWidth || img.width;
        var ih = img.naturalHeight || img.height;
        if (!iw || !ih) throw new Error('تصویر ابعاد معتبر ندارد.');

        var oriented = orientedSize(iw, ih, state.rotate);
        var geo = computeGeometry(oriented.w, oriented.h);

        // مرحله ۱: چرخش و برگرداندن (بدون فیلتر — فیلتر در ابعاد نهایی اعمال می‌شود)
        var base = document.createElement('canvas');
        drawOriented(base, img, iw, ih, state.rotate, state.flipH, state.flipV, 'none');

        var srcW = base.width, srcH = base.height;
        var out = document.createElement('canvas');
        out.width = geo.tw; out.height = geo.th;
        var octx = out.getContext('2d');
        octx.imageSmoothingEnabled = true;
        octx.imageSmoothingQuality = 'high';
        octx.filter = buildFilter();

        // مرحله ۲: تغییر اندازه / برش / حاشیه
        if (geo.mode === 'cover') {
          var sc = Math.max(geo.tw / srcW, geo.th / srcH);
          var dw = Math.ceil(srcW * sc), dh = Math.ceil(srcH * sc);
          octx.drawImage(base, (geo.tw - dw) / 2, (geo.th - dh) / 2, dw, dh);
          return { canvas: out, srcW: srcW, srcH: srcH };
        }
        if (geo.mode === 'contain') {
          var sc2 = Math.min(geo.tw / srcW, geo.th / srcH);
          var dw2 = Math.max(1, Math.round(srcW * sc2)), dh2 = Math.max(1, Math.round(srcH * sc2));
          octx.fillStyle = state.bg;
          octx.fillRect(0, 0, geo.tw, geo.th);
          octx.drawImage(base, (geo.tw - dw2) / 2, (geo.th - dh2) / 2, dw2, dh2);
          return { canvas: out, srcW: srcW, srcH: srcH };
        }
        if (geo.mode === 'stretch') {
          octx.drawImage(base, 0, 0, geo.tw, geo.th);
          return { canvas: out, srcW: srcW, srcH: srcH };
        }

        // حالت scale: با pica برای کیفیت بهتر کوچک می‌کنیم
        var scaled = document.createElement('canvas');
        scaled.width = geo.tw; scaled.height = geo.th;
        var sctx = scaled.getContext('2d');
        sctx.imageSmoothingEnabled = true;
        sctx.imageSmoothingQuality = 'high';

        var rp = hasPica()
          ? pica().resize(base, scaled, { filter: 'mksher', quality: 3 })
              .catch(function () {
                sctx.drawImage(base, 0, 0, srcW, srcH, 0, 0, geo.tw, geo.th);
              })
          : (sctx.drawImage(base, 0, 0, srcW, srcH, 0, 0, geo.tw, geo.th), Promise.resolve());

        return rp.then(function () {
          octx.drawImage(scaled, 0, 0);
          return { canvas: out, srcW: srcW, srcH: srcH };
        });
      })
      .then(function (r) {
        var octx = r.canvas.getContext('2d');
        octx.filter = 'none';
        sharpenCanvas(r.canvas, +$('sharpen').value);
        applyWatermark(octx, r.canvas.width, r.canvas.height);

        var quality = +el.quality.value / 100;
        var fmt = el.format.value;
        var tasks = [];

        if (fmt === 'auto' || el.smart.checked) {
          tasks.push(encode(r.canvas, 'image/webp', quality));
          tasks.push(encode(r.canvas, 'image/jpeg', quality));
        } else {
          tasks.push(encode(r.canvas, fmt, quality));
        }

        return Promise.all(tasks).then(function (blobs) {
          var best = blobs.filter(Boolean).sort(function (a, b) { return a.size - b.size; })[0];
          if (!best) throw new Error('کدگذاری ناموفق بود.');
          var type = best.type || 'image/jpeg';
          var ext = type === 'image/webp' ? 'webp' : type === 'image/png' ? 'png' : 'jpg';
          return {
            origName: file.name,
            origSize: file.size,
            origFile: file,
            blob: best,
            type: type,
            ext: ext,
            srcW: r.srcW, srcH: r.srcH,
            w: r.canvas.width, h: r.canvas.height,
            outName: applyTemplate(file.name, index, r.canvas.width, r.canvas.height, ext),
            wasHeic: isHeic(file)
          };
        });
      });
  }

  /* ------------------------------- rendering ------------------------------ */
  function releaseUrls() {
    state.urls.forEach(function (u) { URL.revokeObjectURL(u); });
    state.urls = [];
  }

  function extractPalette(canvas, count) {
    var c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0, 64, 64);
    var data;
    try { data = ctx.getImageData(0, 0, 64, 64).data; } catch (e) { return []; }
    var buckets = {};
    for (var i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 20) continue;
      var key = (data[i] >> 4) + ',' + (data[i + 1] >> 4) + ',' + (data[i + 2] >> 4);
      var b = buckets[key] || { n: 0, r: 0, g: 0, b: 0 };
      b.n++; b.r += data[i]; b.g += data[i + 1]; b.b += data[i + 2];
      buckets[key] = b;
    }
    return Object.keys(buckets)
      .map(function (k) { return buckets[k]; })
      .sort(function (x, y) { return y.n - x.n; })
      .slice(0, count || 6)
      .map(function (b) {
        return '#' + [b.r, b.g, b.b].map(function (v) {
          return Math.round(v / b.n).toString(16).padStart(2, '0');
        }).join('');
      });
  }

  function render() {
    el.list.innerHTML = '';
    releaseUrls();

    var ok = 0, origTotal = 0, outTotal = 0, fail = 0;

    state.results.forEach(function (r, i) {
      var item = document.createElement('article');
      item.className = 'result-item';

      if (r.error) {
        fail++;
        item.innerHTML =
          '<div class="result-thumb"><svg width="24" height="24" aria-hidden="true"><use href="#i-alert"/></svg></div>' +
          '<div class="result-meta"><div class="result-name">' + esc(r.origName) + '</div>' +
          '<div class="result-sizes"><span style="color:var(--danger)">' + esc(r.error) + '</span></div></div>' +
          '<div class="result-actions"></div>';
        el.list.appendChild(item);
        return;
      }

      ok++;
      origTotal += r.origSize;
      outTotal += r.blob.size;

      var saved = r.origSize - r.blob.size;
      var pct = r.origSize ? (saved / r.origSize * 100) : 0;
      var cls = pct > 2 ? 'good' : (pct < -2 ? 'bad' : 'same');
      var url = URL.createObjectURL(r.blob);
      state.urls.push(url);
      r.url = url;
      var srcFmt = (r.origName.split('.').pop() || '').toUpperCase();
      var total = r.w * r.h;

      item.innerHTML =
        '<div class="result-thumb"><img src="' + url + '" alt="پیش‌نمایش ' + esc(r.outName) + '"></div>' +
        '<div class="result-meta">' +
          '<div class="result-name">' + esc(r.outName) +
            (srcFmt ? '<span class="tag' + (r.wasHeic ? ' tag-heic' : '') + '">' + esc(srcFmt) + '</span>' : '') + '</div>' +
          '<div class="result-sizes">' +
            '<span>اصلی: <b>' + bytes(r.origSize) + '</b></span>' +
            '<span>خروجی: <b>' + bytes(r.blob.size) + '</b></span>' +
            '<span>تغییر: <span class="delta ' + cls + '">' + (pct >= 0 ? '▼' : '▲') + ' ' +
              Math.abs(pct).toFixed(1) + '٪</span></span>' +
            '<span>' + r.srcW + '×' + r.srcH + ' ← <b>' + r.w + '×' + r.h + '</b></span>' +
            '<span>' + r.ext.toUpperCase() + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="result-actions">' +
          '<a class="mini-btn primary" download="' + esc(r.outName) + '" href="' + url + '">' +
            '<svg width="15" height="15" aria-hidden="true"><use href="#i-download"/></svg>دانلود</a>' +
          '<button class="mini-btn" data-compare="' + i + '" type="button">' +
            '<svg width="15" height="15" aria-hidden="true"><use href="#i-eye"/></svg>مقایسه</button>' +
          '<button class="mini-btn icon" data-copy="' + i + '" type="button" aria-label="کپی در کلیپ‌بورد">' +
            '<svg width="15" height="15" aria-hidden="true"><use href="#i-copy"/></svg></button>' +
        '</div>';

      item.querySelector('[data-compare]').addEventListener('click', function () { openCompare(i); });
      item.querySelector('[data-copy]').addEventListener('click', function () { copyResult(i); });
      el.list.appendChild(item);
    });

    el.results.hidden = state.results.length === 0;
    if (ok) {
      var savedPct = origTotal ? (1 - outTotal / origTotal) * 100 : 0;
      el.summary.innerHTML = '<b>' + faNum(ok) + '</b> فایل موفق' +
        (fail ? ' · <b>' + faNum(fail) + '</b> ناموفق' : '') +
        ' · ' + bytes(origTotal) + ' ← <b>' + bytes(outTotal) + '</b>';

      var mp = (origTotal && outTotal) ? (origTotal / outTotal) : 1;
      el.stats.innerHTML = '';
      [
        { k: 'تعداد فایل', v: faNum(ok), c: '' },
        { k: 'حجم اولیه', v: bytes(origTotal), c: '' },
        { k: 'حجم نهایی', v: bytes(outTotal), c: '' },
        { k: 'میانگین فشرده‌سازی', v: savedPct.toFixed(1) + '٪', c: savedPct > 0 ? 'good' : 'accent' }
      ].forEach(function (s) {
        var d = document.createElement('div');
        d.className = 'stat';
        d.innerHTML = '<div class="stat-k">' + esc(s.k) + '</div><div class="stat-v ' + s.c + '">' + esc(s.v) + '</div>';
        el.stats.appendChild(d);
      });
    } else {
      el.summary.textContent = '';
      el.stats.innerHTML = '';
    }
    syncButtons();
  }

  /* ------------------------------ processing ------------------------------ */
  el.btnProcess.addEventListener('click', function () {
    if (!state.files.length || state.busy) return;
    showErr('');
    state.results = [];
    state.busy = true;
    syncButtons();
    setProg(0, true);

    var done = 0;
    var chain = Promise.resolve();

    state.files.forEach(function (f, i) {
      chain = chain.then(function () {
        return processOne(f, i)
          .catch(function (e) { return { origName: f.name, error: e.message || String(e) }; })
          .then(function (r) {
            state.results.push(r);
            done++;
            setProg((done / state.files.length) * 100, true);
            render();
          });
      });
    });

    chain.then(function () {
      state.busy = false;
      setProg(100, false);
      syncButtons();
      var failed = state.results.filter(function (r) { return r.error; });
      if (failed.length) {
        showErr(faNum(failed.length) + ' فایل پردازش نشد: ' + failed.map(function (f) { return f.origName; }).join('، '));
      } else {
        toast('پردازش ' + faNum(state.results.length) + ' فایل کامل شد');
      }
    });
  });

  el.btnClear.addEventListener('click', function () {
    state.files = [];
    state.results = [];
    render();
    showErr('');
    setProg(0, false);
    syncButtons();
    toast('همه چیز پاک شد');
  });

  /* ------------------------------ copy to cb ------------------------------ */
  function copyResult(i) {
    var r = state.results[i];
    if (!r || r.error || !navigator.clipboard || !window.ClipboardItem) {
      toast('کپی در کلیپ‌بورد پشتیبانی نمی‌شود');
      return;
    }
    var type = r.type === 'image/jpeg' ? 'image/png' : r.type;
    navigator.clipboard.write([new ClipboardItem({ [type]: r.blob })])
      .then(function () { toast('در کلیپ‌بورد کپی شد'); })
      .catch(function () { toast('کپی ناموفق بود'); });
  }

  /* ------------------------------ compare modal --------------------------- */
  var cmp = { beforeUrl: null };

  function makeBefore(file) {
    return (isHeic(file) ? decodeHeic(file, 'image/png') : Promise.resolve(file))
      .then(loadImage)
      .then(function (img) {
        var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        var sc = Math.min(1, 1400 / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(w * sc));
        c.height = Math.max(1, Math.round(h * sc));
        var ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        return c.toDataURL('image/png');
      })
      .catch(function () { return ''; });
  }

  function applySplit(pct) {
    var before = $('cmpBefore'), bar = $('cmpBar');
    var rtl = document.documentElement.getAttribute('dir') === 'rtl';
    var hide = 100 - pct;
    before.style.clipPath = rtl ? 'inset(0 0 0 ' + hide + '%)' : 'inset(0 ' + hide + '% 0 0)';
    bar.style.insetInlineStart = pct + '%';
    bar.setAttribute('aria-valuenow', Math.round(pct));
  }

  function openCompare(i) {
    var r = state.results[i];
    if (!r || r.error) return;
    $('cmpAfter').src = r.url || '';
    $('cmpBefore').removeAttribute('src');
    $('palette').innerHTML = '<span class="palette-label">در حال استخراج پالت…</span>';
    el.modal.hidden = false;
    document.body.style.overflow = 'hidden';
    applySplit(50);

    makeBefore(r.origFile).then(function (url) {
      if (el.modal.hidden) return;
      $('cmpBefore').src = url;
    });

    loadImage(r.blob).then(function (img) {
      if (el.modal.hidden) return;
      var c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      var colors = extractPalette(c, 6);
      var wrap = $('palette');
      wrap.innerHTML = '';
      if (!colors.length) { wrap.innerHTML = '<span class="palette-label">پالتی یافت نشد</span>'; return; }
      colors.forEach(function (hex) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'palette-swatch';
        b.style.background = hex;
        b.title = hex + ' — کلیک برای کپی';
        b.setAttribute('aria-label', 'کپی رنگ ' + hex);
        b.addEventListener('click', function () {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(hex).then(function () { toast(hex + ' کپی شد'); });
          }
        });
        wrap.appendChild(b);
      });
      var lbl = document.createElement('span');
      lbl.className = 'palette-label';
      lbl.textContent = 'پالت رنگ غالب — برای کپی کلیک کنید';
      wrap.appendChild(lbl);
    }).catch(function () {});
  }

  function closeCompare() {
    el.modal.hidden = true;
    document.body.style.overflow = '';
    if (cmp.beforeUrl) { URL.revokeObjectURL(cmp.beforeUrl); cmp.beforeUrl = null; }
  }
  $$('[data-close]').forEach(function (n) { n.addEventListener('click', closeCompare); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !el.modal.hidden) closeCompare();
  });

  /* compare dragging */
  (function () {
    var box = $('compare'), bar = $('cmpBar');
    var dragging = false;

    function setPos(clientX) {
      var r = box.getBoundingClientRect();
      var ratio = (clientX - r.left) / r.width;
      ratio = Math.max(0, Math.min(1, ratio));
      var rtl = document.documentElement.getAttribute('dir') === 'rtl';
      applySplit(rtl ? (1 - ratio) * 100 : ratio * 100);
    }
    box.addEventListener('pointerdown', function (e) {
      dragging = true;
      try { box.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      setPos(e.clientX);
    });
    box.addEventListener('pointermove', function (e) { if (dragging) setPos(e.clientX); });
    box.addEventListener('pointerup', function () { dragging = false; });
    box.addEventListener('pointercancel', function () { dragging = false; });
    bar.addEventListener('keydown', function (e) {
      var cur = +bar.getAttribute('aria-valuenow');
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        var d = e.key === 'ArrowLeft' ? -4 : 4;
        applySplit(Math.max(0, Math.min(100, cur + d)));
      }
    });
  })();

  /* --------------------------------- ZIP ---------------------------------- */
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(u8) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(entries) {
    var enc = new TextEncoder();
    var now = new Date();
    var time = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
    var date = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;
    var parts = [], central = [], offset = 0;

    entries.forEach(function (entry) {
      var nameBytes = enc.encode(entry.name);
      var data = entry.data;
      var crc = crc32(data);

      var lh = new Uint8Array(30 + nameBytes.length);
      var lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true);
      lv.setUint16(8, 0, true); lv.setUint16(10, time, true); lv.setUint16(12, date, true);
      lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true);
      lv.setUint16(26, nameBytes.length, true); lv.setUint16(28, 0, true);
      lh.set(nameBytes, 30);

      var ch = new Uint8Array(46 + nameBytes.length);
      var cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 0x031E, true); cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true); cv.setUint16(12, time, true);
      cv.setUint16(14, date, true); cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true);
      cv.setUint32(24, data.length, true); cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true); cv.setUint16(32, 0, true); cv.setUint16(34, 0, true); cv.setUint16(36, 0, true);
      cv.setUint32(38, (0o100644 << 16) >>> 0, true); cv.setUint32(42, offset, true);
      ch.set(nameBytes, 46);

      parts.push(lh, data);
      central.push(ch);
      offset += lh.length + data.length;
    });

    var cdSize = 0;
    for (var i = 0; i < central.length; i++) cdSize += central[i].length;
    var eocd = new Uint8Array(22);
    var ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(4, 0, true); ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true); ev.setUint16(20, 0, true);

    var all = parts.concat(central, [eocd]);
    var total = 0;
    for (var j = 0; j < all.length; j++) total += all[j].length;
    var out = new Uint8Array(total);
    var p = 0;
    for (var q = 0; q < all.length; q++) { out.set(all[q], p); p += all[q].length; }
    return new Blob([out], { type: 'application/zip' });
  }

  el.btnZip.addEventListener('click', function () {
    var ok = state.results.filter(function (r) { return !r.error; });
    if (!ok.length) return;
    var label = el.btnZip.innerHTML;
    el.btnZip.disabled = true;
    el.btnZip.textContent = 'در حال ساخت…';
    Promise.all(ok.map(function (r) {
      return r.blob.arrayBuffer().then(function (buf) {
        return { name: r.outName, data: new Uint8Array(buf) };
      });
    })).then(function (entries) {
      var blob = makeZip(entries);
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'pixelkit-' + ok.length + '-files.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      toast('ZIP آماده شد (' + bytes(blob.size) + ')');
    }).catch(function (e) {
      showErr('ساخت ZIP ناموفق بود: ' + (e.message || e));
    }).then(function () {
      el.btnZip.innerHTML = label;
      syncButtons();
    });
  });

  /* ------------------------------ shortcuts ------------------------------- */
  document.addEventListener('keydown', function (e) {
    var meta = e.ctrlKey || e.metaKey;
    if (meta && e.key.toLowerCase() === 'o') { e.preventDefault(); el.file.click(); }
    if (meta && e.key === 'Enter') { e.preventDefault(); if (!el.btnProcess.disabled) el.btnProcess.click(); }
  });

  /* ------------------------------ init ------------------------------------ */
  syncSliders();
  syncButtons();
  selectTab('convert');
  applyAccent(state.accent);

  /* --------------------------- service worker ----------------------------- */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* بدون SW هم کار می‌کند */ });
    });
  }
})();
