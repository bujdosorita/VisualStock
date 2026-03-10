// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://ktmmhgmfzfqbwianrsbx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HRcFInsek_3oGvI8TouxjA_xrvq3_5O";
let supabaseClient;

try {
    if (typeof supabase === 'undefined') {
        console.error("Supabase SDK nem töltődött be! Ellenőrizd az internetkapcsolatot vagy böngészőbővítményt (AdBlocker).");
    } else {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("Supabase kliens inicializálva.");
    }
} catch (e) {
    console.error("Hiba a Supabase indításakor:", e);
}


const appDiv = document.getElementById('app');
const searchInput = document.getElementById('searchInput');
let termekek = [];
let aktualisSzuro = 'all';
let utolsoModositas = 0;
let cardTimers = {};

function toggleCard(cardEl) {
    const cikkszam = cardEl.getAttribute('data-cikkszam');
    cardEl.classList.toggle('flipped');

    if (cardTimers[cikkszam]) {
        clearTimeout(cardTimers[cikkszam]);
        delete cardTimers[cikkszam];
    }

    if (cardEl.classList.contains('flipped')) {
        cardTimers[cikkszam] = setTimeout(() => {
            cardEl.classList.remove('flipped');
            delete cardTimers[cikkszam];
        }, 5000);
    }
}

async function fetchProducts() {
    if (Date.now() - utolsoModositas < 2000) return;
    try {
        const { data, error } = await supabaseClient
            .from('termekek')
            .select('*')
            .order('nev', { ascending: true });

        if (error) throw error;

        // Map common fields if necessary (Postgres column names vs existing JS expectations)
        const formataltAdatok = data.map(t => ({
            cikkszam: t.cikkszam,
            nev: t.nev,
            db: parseInt(t.db),
            max: parseInt(t.max_keszlet), // SQL-ben max_keszlet volt a php-ban pedig max ként ment ki
            kep: t.kep || null
        }));

        handleUpdate(formataltAdatok);
    } catch (error) {
        console.error('Supabase hiba:', error);
        // Fallback demo adatokra ha nincs kapcsolat
        if (termekek.length === 0) loadDemoData();
    }
}

function loadDemoData() {
    console.warn("DEMO mód aktiválva.");
    const ujAdatok = [
        { nev: "100cm Kihúzható Ruhatartó Sztender Ipari Görgővel", cikkszam: "601056", db: 11, max: 20 },
        { nev: "122cm Fekete Ipari Ruhatartó Sztender", cikkszam: "6010414FT", db: 5, max: 10 },
        { nev: "44cm Csíptetős Ing Fa Vállfa", cikkszam: "402616", db: 1475, max: 1800 }
    ];
    handleUpdate(ujAdatok);
}

function handleUpdate(ujAdatok) {
    if (JSON.stringify(ujAdatok) !== JSON.stringify(termekek)) {
        termekek = ujAdatok;
        if (searchInput.value.length > 0) {
            filterStock();
        } else if (aktualisSzuro !== 'all') {
            filterCategory(aktualisSzuro, false);
        } else {
            renderVisualStock(termekek);
        }
    }
}

async function modifyStock(cikkszam, valtozas) {
    utolsoModositas = Date.now();
    const termekIndex = termekek.findIndex(t => t.cikkszam === cikkszam);
    if (termekIndex === -1) return;

    const ujKeszlet = Math.max(0, termekek[termekIndex].db + valtozas);
    termekek[termekIndex].db = ujKeszlet;
    renderVisualStock(termekek);

    try {
        const { error } = await supabaseClient
            .from('termekek')
            .update({ db: ujKeszlet })
            .eq('cikkszam', cikkszam);

        if (error) throw error;
    } catch (error) {
        console.error("Hiba mentéskor:", error);
        utolsoModositas = 0;
        fetchProducts(); // Hiba esetén szinkronizálunk vissza
    }
}

function simulateSync() {
    const btn = document.querySelector('.btn-sync');
    if (!btn) return;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i><span>...</span>';
    btn.disabled = true;
    setTimeout(() => {
        btn.innerHTML = '<i class="ph-bold ph-check"></i><span>Kész!</span>';
        fetchProducts();
        setTimeout(() => { btn.innerHTML = originalHTML; btn.disabled = false; }, 2000);
    }, 1000);
}

function updateClock() {
    const now = new Date();
    const clock = document.getElementById('clock');
    if (clock) clock.innerText = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
}

function filterStock() {
    const query = searchInput.value.toLowerCase();
    const szurt = termekek.filter(t => t.nev.toLowerCase().includes(query) || t.cikkszam.toLowerCase().includes(query));
    renderVisualStock(szurt);
}

function filterCategory(kod, clear = true) {
    aktualisSzuro = kod;
    if (clear) {
        searchInput.value = "";
        document.querySelectorAll('.category-buttons button').forEach(b => b.classList.remove('active-btn'));
        const e = window.event || event;
        if (e && e.target) {
            const btn = e.target.closest('button');
            if (btn) btn.classList.add('active-btn');
        }
    }
    if (kod === 'all') { renderVisualStock(termekek); return; }

    const szurt = termekek.filter(t => {
        const n = t.nev.toLowerCase();
        if (kod === 'sztender') return n.includes('sztender') || n.includes('állvány');
        if (kod === 'vallfa') return (n.includes('vállfa') || n.includes('méretjelölő') || n.includes('méretjelző') || n.includes('csipesz') || n.includes('divider') || n.includes('fa') || n.includes('műanyag') || n.includes('fém')) && !n.includes('leszedő');
        if (kod === 'cimkezo') return n.includes('belövő') || n.includes('szál') || n.includes('körszál') || (n.includes('címke') && n.includes('függő')) || (n.includes('etikett') && n.includes('függő')) || n.includes('pisztoly');
        if (kod === 'vonalcimke') return (n.includes('vonalkód') || n.includes('körcímke') || n.includes('tekercs') || n.includes('mérlegcímke')) || (n.includes('etikett') && !n.includes('függő') && !n.includes('polc') && !n.includes('karton') && !n.includes('a4'));
        if (kod === 'arazogep') return n.includes('árazó') || n.includes('festékhenger');
        if (kod === 'ruhazsak') return n.includes('ruhazsák') || n.includes('öltönyzsák') || n.includes('ruhafólia') || (n.includes('fólia') && n.includes('sztender'));
        if (kod === 'polccimke') return n.includes('ársín') || n.includes('polccímke') || n.includes('kartoncímke');
        if (kod === 'plexitok') return n.includes('laptok') || n.includes('tábla') || n.includes('plexi');
        if (kod === 'kasszaszalag') return (n.includes('pénztárgépszalag') || n.includes('hőpapír') || n.includes('bankterminál') || n.includes('repont') || n.includes('envipco')) && !n.includes('mérlegcímke');
        if (kod === 'taska') return n.includes('táska') || n.includes('tasak') || n.includes('zacskó');
        if (kod === 'irodaszer') {
            const irodaSzavak = ['toll', 'marker', 'boríték', 'genotherm', 'gyorsfűző', 'spirálfüzet', 'radír', 'ragasztó', 'tűzőkapocs', 'nyomtatvány', 'kábelkötegelő', 'papír', 'marker', 'cellux', 'victoria', 'a4'];
            return irodaSzavak.some(szo => n.includes(szo)) && !n.includes('pénztár') && !n.includes('hőpapír');
        }
        if (kod === 'kosar') return n.includes('kosár');
        return false;
    });
    renderVisualStock(szurt);
}

function renderVisualStock(adatok) {
    if (adatok.length === 0) {
        appDiv.innerHTML = '<div style="color: var(--text-muted); text-align: center; grid-column: 1/-1; padding: 40px; font-size: 1.2rem;">Ebben a kategóriában nincsenek termékek.</div>';
        return;
    }
    const letezo = appDiv.querySelectorAll('.card-container');
    if (letezo.length !== adatok.length) { fullRender(adatok); return; }

    adatok.forEach((t, i) => {
        const c = letezo[i];
        const hasImage = c.querySelector('.product-image-container');
        if (c.getAttribute('data-cikkszam') !== t.cikkszam || !hasImage) { fullRender(adatok); return; }
        let sz = t.max > 0 ? Math.round((t.db / t.max) * 100) : 0;
        if (sz > 100) sz = 100;
        let sCl = 'stock-high'; let tCl = 'text-green';
        if (sz < 40) { sCl = 'stock-med'; tCl = 'text-yellow'; }
        if (sz < 20 || t.db <= 0) { sCl = 'stock-low'; tCl = 'text-red'; }
        const qS = c.querySelector('.current-qty');
        const fD = c.querySelector('.progress-fill');
        if (qS) { qS.innerText = t.db; qS.className = `current-qty ${tCl}`; }
        if (fD) { fD.style.width = `${sz}%`; fD.className = `progress-fill ${sCl}`; }
    });
}

function handleImageError(img) {
    const sku = img.getAttribute('data-sku');
    const name = img.getAttribute('data-name');
    const attempt = parseInt(img.getAttribute('data-attempt') || '0');

    const patterns = [
        `https://vallfa.hu/img/41068/${sku}/500x500/${sku}.jpg`,
        `https://vallfa.hu/shop_ordered/41068/shop_altkep/${sku}.jpg`,
        `https://vallfa.hu/shop_ordered/41068/shop_altkep/${sku}_altkep_1.jpg`,
        `https://vallfa.hu/shop_ordered/41068/pic/${sku}.jpg`,
        `https://via.placeholder.com/400/0f172a/00f3ff?text=${encodeURIComponent(name.split(' ')[0] + '\n#' + sku)}`
    ];

    if (attempt < patterns.length) {
        img.setAttribute('data-attempt', attempt + 1);
        img.src = patterns[attempt];
    } else {
        img.onerror = null;
        img.style.opacity = '0.5';
    }
}

function getProductImage(cikkszam, name, kep) {
    if (kep) return kep;
    if (cikkszam && (cikkszam.match(/^[a-zA-Z0-9-]+$/))) {
        return `https://vallfa.hu/img/41068/${cikkszam}/500x500/${cikkszam}.jpg`;
    }
    return `https://via.placeholder.com/400/0f172a/00f3ff?text=${encodeURIComponent(name || 'VisualStock')}`;
}

function fullRender(adatok) {
    let html = '';
    adatok.forEach((t, i) => {
        let sz = t.max > 0 ? Math.round((t.db / t.max) * 100) : 0;
        if (sz > 100) sz = 100;
        let sCl = 'stock-high'; let tCl = 'text-green';
        if (sz < 40) { sCl = 'stock-med'; tCl = 'text-yellow'; }
        if (sz < 20 || t.db <= 0) { sCl = 'stock-low'; tCl = 'text-red'; }

        const productImage = getProductImage(t.cikkszam, t.nev, t.kep);

        html += `
            <div class="card-container" data-cikkszam="${t.cikkszam}" onclick="toggleCard(this)" style="animation-delay: ${i * 0.02}s">
                <div class="card-inner">
                    <div class="card-front">
                        <div class="card-top"><h3 class="termek-nev">${t.nev}</h3></div>
                        <div class="stock-status">
                            <div class="stock-numbers">
                                <span class="current-qty ${tCl}">${t.db}</span>
                                <span class="max-qty">/ ${t.max} db</span>
                            </div>
                            <div class="progress-track"><div class="progress-fill ${sCl}" style="width: ${sz}%"></div></div>
                        </div>
                        <div class="card-actions">
                            <button class="btn-action btn-minus" onclick="event.stopPropagation(); modifyStock('${t.cikkszam}', -1)"><i class="ph-bold ph-minus"></i></button>
                            <button class="btn-action btn-plus" onclick="event.stopPropagation(); modifyStock('${t.cikkszam}', 1)"><i class="ph-bold ph-plus"></i></button>
                        </div>
                    </div>
                    <div class="card-back">
                        <div class="back-content-left">
                            <div class="back-header"><i class="ph-bold ph-info" style="color: var(--neon-cyan);"></i><span>ADATOK</span></div>
                            <div class="back-details">
                                <div class="detail-item"><span class="label">CIKK</span><span class="value">#${t.cikkszam}</span></div>
                                <div class="detail-item"><span class="label">MAX</span><span class="value">${t.max} db</span></div>
                                <div class="detail-item"><span class="label">KATEGÓRIA</span><span class="value">${aktualisSzuro === 'all' ? 'Összes' : document.querySelector('.category-buttons button.active-btn')?.innerText.trim() || 'Egyéb'}</span></div>
                            </div>
                        </div>
                        <div class="back-content-right">
                            <div class="image-glow-overlay"></div>
                            <div class="product-image-container">
                                <img src="${productImage}" 
                                     class="product-image" 
                                     loading="lazy" 
                                     data-sku="${t.cikkszam}"
                                     data-name="${t.nev}"
                                     data-attempt="0"
                                     onerror="handleImageError(this)"
                                     alt="${t.nev}">
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });
    appDiv.innerHTML = html;
}

fetchProducts();
setInterval(updateClock, 1000);
updateClock();
setInterval(fetchProducts, 8000);
