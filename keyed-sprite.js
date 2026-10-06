// <keyed-sprite src="…mp4 | …png">
//
// Draws a character that was rendered on a pure black background (the Cosmo
// pose clips and stills) as a real cut-out: the black around it becomes
// transparent, the character itself stays fully opaque. This replaces the old
// `mix-blend-mode: lighten` trick, which let anything brighter than the
// character (pictures, stars, the page gradient) shine straight through it.
//
// How: every frame is drawn to a canvas and flood-filled from the edges through
// dark pixels. Only dark pixels *connected to the border* are removed, so dark
// details inside the character (mouth, shadows in the hatch) are kept. The dim
// fringe of glows and flames fades out softly instead of being cut hard.
//
// `poster` names a still (normally the clip's first frame). It is drawn, cut out
// the same way, until the clip delivers its first frame. On iPad/iPhone a clip
// may never start on its own (Low Power Mode blocks autoplay) and without the
// still the character would just be missing. Any tap starts the clips again.
//
// Browsers refuse to hand over the pixels when the page is opened straight from
// disk (file://). In that case the element shows the image named in `fallback`
// instead: a pre-cut PNG that already has real transparency. Only if that is
// missing too does it go back to the old blend, by adding `.lighten` to the
// closest [data-sprite-host].
(function () {
  if (customElements.get('keyed-sprite')) return;

  const LO = 12;   // at or below this brightness the background is fully transparent
  const HI = 72;   // at or above this a pixel is solid; in between it fades
  const MAX_SIDE = 720;
  let seen = new Uint8Array(0), stack = new Int32Array(0);

  // a tap is always allowed to start playback, even where autoplay is refused
  const live = new Set();
  const kick = () => live.forEach(s => { const v = s.vid; if (v && v.paused && !s.failed) { const p = v.play(); p && p.catch(() => {}); } });
  ['touchend', 'pointerup', 'click', 'keydown'].forEach(t => window.addEventListener(t, kick, true));

  function key(img) {
    const d = img.data, w = img.width, h = img.height, n = w * h;
    if (seen.length < n) { seen = new Uint8Array(n); stack = new Int32Array(n); } else seen.fill(0, 0, n);
    let sp = 0;
    const push = i => {
      if (seen[i]) return;
      const o = i * 4;
      if (d[o + 3] > 8 && Math.max(d[o], d[o + 1], d[o + 2]) >= HI) return;
      seen[i] = 1; stack[sp++] = i;
    };
    for (let x = 0; x < w; x++) { push(x); push(n - w + x); }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
    while (sp) {
      const i = stack[--sp], o = i * 4, x = i % w;
      const m = Math.max(d[o], d[o + 1], d[o + 2]);
      if (m <= LO) d[o + 3] = 0;
      else {
        // keep the hue, lift it to the HI level, and let alpha carry the falloff
        const g = HI / m;
        d[o] = Math.min(255, d[o] * g); d[o + 1] = Math.min(255, d[o + 1] * g); d[o + 2] = Math.min(255, d[o + 2] * g);
        d[o + 3] = Math.min(d[o + 3], Math.round(255 * (m - LO) / (HI - LO)));
      }
      if (x > 0) push(i - 1);
      if (x < w - 1) push(i + 1);
      if (i >= w) push(i - w);
      if (i < n - w) push(i + w);
    }
  }

  class KeyedSprite extends HTMLElement {
    static get observedAttributes() { return ['src', 'poster', 'fallback']; }
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>:host{display:block;position:relative}' +
        'canvas,.raw{display:block;width:100%;height:100%;object-fit:contain}' +
        'video.feed{position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none}' +
        '</style><canvas></canvas>';
      this.cv = root.querySelector('canvas');
      this.ctx = this.cv.getContext('2d', { willReadFrequently: true });
      this.gen = 0;
    }
    connectedCallback() { this.load(); }
    disconnectedCallback() { this.stop(); }
    attributeChangedCallback(name, a, b) { if (a !== b && this.isConnected) this.load(); }

    stop() {
      this.gen++; live.delete(this);
      cancelAnimationFrame(this.raf);
      if (this.vid) { try { this.vid.pause(); } catch (e) {} this.vid.remove(); this.vid = null; }
      if (this.raw) { this.raw.remove(); this.raw = null; }
    }

    load() {
      this.stop();
      const src = this.getAttribute('src');
      if (!src) return;
      const gen = this.gen;
      this.failed = false; this.sized = false;
      if (/\.(mp4|webm|mov|m4v)([?#]|$)/i.test(src)) {
        const v = this.vid = document.createElement('video');
        v.className = 'feed'; v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
        v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.preload = 'auto';
        v.src = src;
        this.shadowRoot.appendChild(v);
        live.add(this);
        let last = -1, nag = 0, live1 = false;
        const poster = this.getAttribute('poster');
        if (poster) {
          const im = new Image();
          // only while the clip has shown nothing yet; re-measure afterwards, the still may have another size
          im.onload = () => { if (gen === this.gen && !live1 && !this.failed) { this.paint(im, im.naturalWidth, im.naturalHeight); this.sized = false; } };
          im.src = poster;
        }
        const tick = () => {
          if (gen !== this.gen) return;
          if (v.paused && !document.hidden && ++nag % 30 === 1) { const p = v.play(); p && p.catch(() => {}); }
          if (v.readyState >= 2 && v.videoWidth && v.currentTime !== last) {
            last = v.currentTime; live1 = true;
            this.paint(v, v.videoWidth, v.videoHeight);
          }
          if (!this.failed) this.raf = requestAnimationFrame(tick);
        };
        this.raf = requestAnimationFrame(tick);
      } else {
        const im = new Image();
        im.onload = () => { if (gen === this.gen) this.paint(im, im.naturalWidth, im.naturalHeight); };
        im.src = src;
        this.img = im;
      }
    }

    paint(source, sw, sh) {
      if (!this.sized) {
        // work at roughly the size it is shown (layout size, so transforms don't matter), never above the source
        const dpr = Math.min(2, window.devicePixelRatio || 1) * 1.25;
        const fit = Math.min((this.offsetWidth || 128) * dpr / sw, (this.offsetHeight || 176) * dpr / sh);
        const k = Math.min(1, fit, MAX_SIDE / Math.max(sw, sh));
        this.cv.width = Math.max(2, Math.round(sw * k)); this.cv.height = Math.max(2, Math.round(sh * k));
        this.sized = true;
      }
      const w = this.cv.width, h = this.cv.height;
      try {
        this.ctx.clearRect(0, 0, w, h);
        this.ctx.drawImage(source, 0, 0, w, h);
        const img = this.ctx.getImageData(0, 0, w, h);
        key(img);
        this.ctx.putImageData(img, 0, 0);
        if (!this.ok) { this.ok = true; this.cv.style.display = ''; const host = this.closest('[data-sprite-host]'); if (host) host.classList.remove('lighten'); }
      } catch (e) { this.fallback(); }
    }

    // pixels unreadable: use the pre-cut still; failing that, the source as-is with the lighten blend
    fallback() {
      this.failed = true; this.ok = false;
      this.cv.style.display = 'none';
      const gen = this.gen, cut = this.getAttribute('fallback');
      const blend = () => {
        if (gen !== this.gen) return;
        if (this.raw) { this.raw.remove(); this.raw = null; }
        if (this.vid) { this.vid.className = 'raw'; this.vid.autoplay = true; const p = this.vid.play(); p && p.catch(() => {}); }
        else if (this.img) { this.raw = this.img; this.img.className = 'raw'; this.shadowRoot.appendChild(this.img); }
        const host = this.closest('[data-sprite-host]');
        if (host) host.classList.add('lighten');
      };
      if (!cut) return blend();
      const im = this.raw = new Image();
      im.className = 'raw'; im.alt = ''; im.draggable = false;
      im.onerror = blend;
      im.src = cut;
      this.shadowRoot.appendChild(im);
      if (this.vid) { try { this.vid.pause(); } catch (e) {} }
    }
  }
  customElements.define('keyed-sprite', KeyedSprite);
})();
