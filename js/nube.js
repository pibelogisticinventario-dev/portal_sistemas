/* PIBE Hub TI — Guardado compartido en la nube (Firebase Realtime Database por REST).
   Sin URL configurada funciona solo con el almacenamiento del navegador.
   Guarda automáticamente cada cambio, carga lo guardado al abrir la página y combina
   los cambios cuando dos personas guardan casi al mismo tiempo. */
(function () {
    'use strict';
    var cfg = window.PIBE_NUBE || {};
    var BASE = String(cfg.databaseURL || '').replace(/\/+$/, '');
    var RAIZ = cfg.ruta || 'pibe';
    var KEYS = ['PIBE_SYSTEM_DB_V14', 'gestor_correos_logistic_v2', 'gestor_correos_usuarios_v1'];
    var META_KEY = 'PIBE_SYNC_META';
    var ls = window.localStorage;
    var rawSet = Storage.prototype.setItem;
    var meta = {};
    try { meta = JSON.parse(ls.getItem(META_KEY) || '{}') || {}; } catch (e) { meta = {}; }
    var enviando = {}, pendiente = {}, timers = {}, estado = BASE ? 'sync' : 'local', avisado = false;

    function guardarMeta() { rawSet.call(ls, META_KEY, JSON.stringify(meta)); }
    function url(k, sub) { return BASE + '/' + RAIZ + '/' + k + (sub ? '/' + sub : '') + '.json'; }

    async function pedir(u, opts) {
        var c = new AbortController(), tm = setTimeout(function () { c.abort(); }, 9000);
        opts = opts || {}; opts.signal = c.signal; opts.cache = 'no-store';
        try {
            var r = await fetch(u, opts);
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return await r.json();
        } finally { clearTimeout(tm); }
    }

    // ---------- combinar datos (por id; lo local gana si el mismo registro cambió en ambos) ----------
    function unirListas(local, remoto) {
        var mapa = new Map(), sueltos = [], vistos = {};
        function add(x) {
            if (x && typeof x === 'object' && x.id !== undefined) mapa.set(String(x.id), x);
            else { var s = JSON.stringify(x); if (!vistos[s]) { vistos[s] = 1; sueltos.push(x); } }
        }
        (remoto || []).forEach(add); (local || []).forEach(add);
        return Array.from(mapa.values()).concat(sueltos);
    }
    function mezclar(localStr, remotoStr) {
        try {
            var l = JSON.parse(localStr), r = JSON.parse(remotoStr);
            if (Array.isArray(l) && Array.isArray(r)) return JSON.stringify(unirListas(l, r));
            if (l && r && typeof l === 'object' && typeof r === 'object') {
                var out = Object.assign({}, r, l);
                Object.keys(out).forEach(function (k) {
                    if (Array.isArray(l[k]) && Array.isArray(r[k])) out[k] = unirListas(l[k], r[k]);
                });
                return JSON.stringify(out);
            }
        } catch (e) {}
        return localStr;
    }

    // ---------- subir ----------
    async function subir(k) {
        if (!BASE) return;
        if (enviando[k]) { pendiente[k] = true; return; }
        enviando[k] = true; setEstado('guardando');
        try {
            do {
                pendiente[k] = false;
                var local = ls.getItem(k);
                if (local === null) break;
                var rt = await pedir(url(k, 't'));
                if (rt !== null && rt !== (meta[k] && meta[k].t)) {          // otra persona guardó antes
                    var rem = await pedir(url(k));
                    if (rem && rem.d) {
                        var comb = mezclar(local, rem.d);
                        if (comb !== local) { rawSet.call(ls, k, comb); local = comb; }
                        avisarExternos();
                    }
                }
                var t = Date.now();
                await pedir(url(k), { method: 'PUT', body: JSON.stringify({ d: local, t: t }) });
                meta[k] = { t: t, dirty: false }; guardarMeta();
            } while (pendiente[k]);
            if (!Object.keys(enviando).some(function (x) { return enviando[x] && x !== k; })) setEstado('sync');
        } catch (e) { setEstado('offline'); }
        finally { enviando[k] = false; }
    }
    function programar(k) { clearTimeout(timers[k]); timers[k] = setTimeout(function () { subir(k); }, 800); }

    // Cada vez que la página guarda en localStorage, se marca para subir
    Storage.prototype.setItem = function (k) {
        rawSet.apply(this, arguments);
        if (BASE && this === ls && KEYS.indexOf(k) >= 0) {
            meta[k] = Object.assign({}, meta[k], { dirty: true }); guardarMeta(); programar(k);
        }
    };

    // ---------- carga inicial ----------
    async function cargarInicial() {
        if (!BASE) return;
        setEstado('guardando', '☁️ Conectando…');
        var subirDespues = [];
        try {
            await Promise.all(KEYS.map(async function (k) {
                var rem = await pedir(url(k)), local = ls.getItem(k), m = meta[k];
                if (!rem || rem.d === undefined || rem.d === null) {        // aún no hay nada en la nube
                    if (local !== null) { meta[k] = { t: null, dirty: true }; subirDespues.push(k); }
                    return;
                }
                if (local !== null && (!m || m.dirty) && local !== rem.d) {  // hay datos locales sin subir: combinar
                    rawSet.call(ls, k, mezclar(local, rem.d));
                    meta[k] = { t: rem.t, dirty: true }; subirDespues.push(k);
                } else {
                    if (local !== rem.d) rawSet.call(ls, k, rem.d);
                    meta[k] = { t: rem.t, dirty: false };
                }
            }));
            guardarMeta(); setEstado('sync');
        } catch (e) { setEstado('offline'); }
        subirDespues.forEach(function (k) { subir(k); });
    }

    // ---------- revisar cambios de otras personas ----------
    async function revisar() {
        if (!BASE || document.hidden) return;
        KEYS.forEach(async function (k) {
            if (enviando[k] || (meta[k] && meta[k].dirty)) return;
            try {
                var t = await pedir(url(k, 't'));
                if (t !== null && t !== (meta[k] && meta[k].t)) avisarExternos();
            } catch (e) {}
        });
    }
    async function actualizarYRecargar() {
        try {
            await Promise.all(KEYS.map(async function (k) {
                if (meta[k] && meta[k].dirty) { await subir(k); return; }
                var rem = await pedir(url(k));
                if (rem && rem.d !== undefined && rem.d !== null) { rawSet.call(ls, k, rem.d); meta[k] = { t: rem.t, dirty: false }; }
            }));
            guardarMeta();
        } catch (e) {}
        location.reload();
    }
    function reintentar() { KEYS.forEach(function (k) { if (meta[k] && meta[k].dirty && !enviando[k]) subir(k); }); }

    // ---------- indicador visual ----------
    var pill, banner;
    var TEXTOS = {
        local: ['💾 Datos solo en este navegador', '#334155'],
        sync: ['☁️ Sincronizado', '#065f46'],
        guardando: ['☁️ Guardando…', '#1e40af'],
        offline: ['⚠️ Sin conexión · se guardará al reconectar', '#92400e']
    };
    function setEstado(e, texto) {
        estado = e;
        if (!pill) return;
        var t = TEXTOS[e]; pill.textContent = texto || t[0]; pill.style.background = t[1];
    }
    function avisarExternos() {
        if (avisado || !document.body) return; avisado = true;
        banner = document.createElement('div');
        banner.id = 'nube-aviso';
        banner.innerHTML = 'Otra persona guardó cambios nuevos. <button type="button">Actualizar</button>';
        banner.querySelector('button').onclick = actualizarYRecargar;
        document.body.appendChild(banner);
    }
    function crearUI() {
        var st = document.createElement('style');
        st.textContent = '#nube-estado{position:fixed;left:50%;transform:translateX(-50%);bottom:10px;z-index:45;color:#fff;font:600 11px Inter,system-ui,sans-serif;padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.15);box-shadow:0 4px 14px rgba(0,0,0,.4);cursor:default;opacity:.92}' +
            '#nube-aviso{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:90;background:#0b1220;color:#e2e8f0;border:1px solid #52B043;border-radius:12px;padding:10px 14px;font:600 13px Inter,system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5)}' +
            '#nube-aviso button{margin-left:10px;background:#006837;color:#fff;border:1px solid #52B043;border-radius:999px;padding:5px 12px;font-weight:700;cursor:pointer}' +
            '@media print{#nube-estado,#nube-aviso{display:none!important}}';
        document.head.appendChild(st);
        pill = document.createElement('div'); pill.id = 'nube-estado';
        pill.onclick = function () {
            if (estado === 'local') alert('La nube no está configurada: lo que captures se guarda solo en este navegador y NO se comparte con otras personas.\n\nSigue los pasos del README.md para activarla (pega la URL de Firebase en js/config.js).');
        };
        document.body.appendChild(pill);
        setEstado(estado);
    }
    if (document.body) crearUI(); else document.addEventListener('DOMContentLoaded', crearUI);

    window.addEventListener('online', reintentar);
    setInterval(revisar, 20000);
    setInterval(reintentar, 30000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { revisar(); reintentar(); } });

    window.PibeCloud = { listo: cargarInicial().catch(function () {}), estado: function () { return estado; }, revisar: revisar, reintentar: reintentar, configurada: !!BASE };
})();
