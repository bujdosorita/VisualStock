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

// AUTH & ROLE STATE
let currentUser = null;
let pendingChanges = {};

async function handleLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const errorEl = document.getElementById('loginError');
    
    // Demo login logic (hardcoded per user request/simplicity or can be Supabase table)
    // admin / admin123 -> Admin
    // user / user123 -> User
    
    if ((user === 'admin' && pass === 'admin123')) {
        loginSuccess({ name: 'Admin', role: 'admin' });
    } else if (user === 'user' && pass === 'user123') {
        loginSuccess({ name: 'Raktár', role: 'user' });
    } else {
        errorEl.innerText = "Hibás felhasználónév vagy jelszó!";
    }
}

function loginSuccess(session) {
    currentUser = session;
    localStorage.setItem('vs_session', JSON.stringify(session));
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('userNameDisplay').innerText = session.name;
    
    if (session.role === 'admin') {
        document.body.classList.add('is-admin');
    } else {
        document.body.classList.remove('is-admin');
    }
    
    fetchProducts();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('vs_session');
    document.body.classList.remove('is-admin');
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('username').value = "";
    document.getElementById('password').value = "";
    document.getElementById('loginError').innerText = "";
    pendingChanges = {};
    updatePendingBadge();
}

function checkSession() {
    const saved = localStorage.getItem('vs_session');
    if (saved) {
        loginSuccess(JSON.parse(saved));
    } else {
        document.getElementById('loginOverlay').style.display = 'flex';
    }
}

function updatePendingBadge() {
    const count = Object.keys(pendingChanges).length;
    const btn = document.getElementById('btnBulkSave');
    const badge = document.getElementById('pendingCount');
    if (btn && badge) {
        badge.innerText = count;
        btn.disabled = count === 0;
    }
}

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
        
        // Reapply current filters WITHOUT resetting the layout if possible
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
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const termekIndex = termekek.findIndex(t => t.cikkszam === cikkszam);
    if (termekIndex === -1) return;

    const ujKeszlet = Math.max(0, termekek[termekIndex].db + valtozas);
    termekek[termekIndex].db = ujKeszlet;
    
    // Store in pending changes instead of immediate DB update
    pendingChanges[cikkszam] = ujKeszlet;
    updatePendingBadge();

    // Local refresh
    if (searchInput.value.length > 0) {
        filterStock();
    } else if (aktualisSzuro !== 'all') {
        filterCategory(aktualisSzuro, false);
    } else {
        renderVisualStock(termekek);
    }
}

async function confirmBulkUpdate() {
    const count = Object.keys(pendingChanges).length;
    if (count === 0) return;
    
    const confirm = window.confirm(`Biztosan módosítani kívánja a(z) ${count} termék adatait?`);
    if (confirm) {
        saveBulkChanges();
    }
}

async function saveBulkChanges() {
    const btn = document.getElementById('btnBulkSave');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i><span>Mentés...</span>';
    
    try {
        const updates = Object.entries(pendingChanges).map(([cikkszam, db]) => ({
            cikkszam, db
        }));
        
        // Supabase bulk updates are tricky with multiple filters in one call, 
        // so we run them sequentially or use a RPC if available. 
        // For now, sequential updates for robustness.
        for (const update of updates) {
            await supabaseClient
                .from('termekek')
                .update({ db: update.db })
                .eq('cikkszam', update.cikkszam);
        }
        
        pendingChanges = {};
        updatePendingBadge();
        utolsoModositas = Date.now();
        
        btn.innerHTML = '<i class="ph-bold ph-check"></i><span>Mentve!</span>';
        setTimeout(() => {
            btn.innerHTML = originalContent;
            updatePendingBadge();
            fetchProducts();
        }, 2000);
        
    } catch (error) {
        console.error("Hiba tömeges mentéskor:", error);
        alert("Hiba történt a mentés során!");
        btn.disabled = false;
        btn.innerHTML = originalContent;
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

function getTermekCategory(t) {
    const n = t.nev.toLowerCase();
    
    // Szigorú fentről lefelé szabály (waterfall), így ami egyszer besorolást nyer, nem megy tovább, kiküszöbölve a duplikációkat
    if ((n.includes('laptok') || n.includes('tábla') || n.includes('plexi') || n.includes('árcímketartó')) && !n.includes('felíró')) return 'plexitok';
    if (n.includes('ruhazsák') || n.includes('öltönyzsák') || n.includes('ruhafólia') || (n.includes('fólia') && n.includes('sztender'))) return 'ruhazsak';
    if (n.includes('sztender') || n.includes('állvány')) return 'sztender';
    if (n.includes('ársín') || n.includes('polccímke') || n.includes('kartoncímke')) return 'polccimke';
    if ((n.includes('pénztárgépszalag') || n.includes('hőpapír') || n.includes('bankterminál') || n.includes('repont') || n.includes('envipco') || n.includes('kasszaszalag')) && !n.includes('mérlegcímke')) return 'kasszaszalag';
    if ((n.includes('vonalkód') || n.includes('körcímke') || n.includes('tekercs') || n.includes('mérlegcímke') || n.includes('etikett') || n.includes('festékszalag') || n.includes('stanc')) && !n.includes('függő')) return 'vonalcimke';
    if (n.includes('belövő') || n.includes('szál') && !n.includes('árazószalag') && !n.includes('pénztárgépszalag') && !n.includes('kasszaszalag') && !n.includes('zárószalag') && !n.includes('csomagoló') || n.includes('körszál') || (n.includes('címke') && n.includes('függő')) || (n.includes('etikett') && n.includes('függő')) || n.includes('pisztoly')) return 'cimkezo';
    if (n.includes('árazó') || n.includes('festékhenger')) return 'arazogep';
    if (n.includes('táska') || n.includes('tasak') || n.includes('zacskó') || n.includes('szemeteszsák') || n.includes('szatyor')) return 'taska';
    if (n.includes('kosár')) return 'kosar';
    if (n.includes('vállfa') || n.includes('méretjelölő') || n.includes('méretjelző') || n.includes('csipesz') || n.includes('divider') || n.includes('leszedő')) return 'vallfa';
    
    // Irodaszer az összes többi után jön, így az "A4" nem viszi ide a laptokot, a "ragasztó" pedig az ársínt
    const irodaSzavak = ['toll', 'marker', 'boríték', 'genotherm', 'gyorsfűző', 'spirálfüzet', 'radír', 'ragasztó', 'tűzőkapocs', 'nyomtatvány', 'kábelkötegelő', 'papír', 'cellux', 'victoria', 'a4', 'apli', 'csomagolószalag', 'felírótábla'];
    if (irodaSzavak.some(szo => n.includes(szo))) return 'irodaszer';
    
    return 'egyeb';
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

    const szurt = termekek.filter(t => getTermekCategory(t) === kod);
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

function handleImageFallback(img) {
    // If the image failed to load OR if it loaded as a 1x1 pixel GIF (Vallfa's fake 404)
    if (!img.complete || img.naturalWidth <= 1) {
        const sku = img.getAttribute('data-sku');
        const name = img.getAttribute('data-name');
        const attempt = parseInt(img.getAttribute('data-attempt') || '0');

        const patterns = [
            `https://vallfa.hu/img/41068/${sku}/560x560,r/${sku}.jpg`,
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
            img.onload = null;
            img.onerror = null;
            img.style.opacity = '0.5';
        }
    }
}

function getProductImage(cikkszam, name, kep) {
    if (kep) return kep;
    
    // Új 560x560,r fájlok szerinti explicit leképezések a Vallfa szervere alapján
    if (cikkszam === '601056') return 'https://vallfa.hu/img/41068/601045T/560x560,r/601045T.jpg'; 
    if (cikkszam === '601045TRUD') return 'https://vallfa.hu/img/41068/601045T/560x560,r/601045T.jpg';
    if (cikkszam === '601047TFEKEZ') return 'https://vallfa.hu/img/41068/601047TFEKEZ/560x560,r/601047TFEKEZ.jpg';
    if (cikkszam === '601047SONG160') return 'https://vallfa.hu/img/41068/601047SONG160/560x560,r/601047SONG160.jpg';
    if (cikkszam === '6010414FT') return 'https://vallfa.hu/img/41068/6010414FT/560x560,r/6010414FT.jpg';
    if (cikkszam === '6010395FT') return 'https://vallfa.hu/img/41068/6010395FT/560x560,r/6010395FT.jpg';
    if (cikkszam === '6010406FT') return 'https://vallfa.hu/img/41068/6010406FT/560x560,r/6010406FT.jpg';
    
    // Árazók és kifutott cikkek amik mostanában változtak
    if (cikkszam === '8852660') return 'https://vallfa.hu/shop_ordered/41068/shop_altkep/8852660.jpg'; // Meto henger
    if (cikkszam === '25x16K') return 'https://vallfa.hu/shop_ordered/41068/shop_altkep/25x16k.jpg';
    if (cikkszam === '22x12K') return 'https://vallfa.hu/shop_ordered/41068/shop_altkep/22x12K.jpg';
    if (cikkszam === '122SZT') return 'https://vallfa.hu/shop_ordered/41068/shop_altkep/122szt.jpg';
    if (cikkszam === '150064') return 'https://vallfa.hu/img/41068/150064/560x560,r/150064.jpg'; // Vállfaleszedő

    if (cikkszam === '503590' || cikkszam === '503594') return 'https://vallfa.hu/img/41068/503590/560x560,r/503590.jpg'; 
    
    // Méretjelzők és egyéb kiegészítők (a Vallfa néha shop_ordered mappába teszi a fotót)
    if (cikkszam === '900132') return 'https://vallfa.hu/shop_ordered/41068/shop_altkep/900132.jpg';
    if (cikkszam === '900133') return 'https://vallfa.hu/shop_ordered/41068/shop_altkep/900133.jpg';
    if (cikkszam === '900152') return 'https://vallfa.hu/shop_ordered/41068/shop_altkep/900152.jpg';
    if (cikkszam === '601070') return 'https://vallfa.hu/shop_ordered/41068/shop_altkep/601070.jpg';
    if (cikkszam === '601070R') return 'https://vallfa.hu/shop_ordered/41068/shop_altkep/601070.jpg';
    
    // Visszaállítás az eredeti biztonságos logikára az új felbontással:
    if (cikkszam && (cikkszam.match(/^[a-zA-Z0-9-]+$/))) {
        return `https://vallfa.hu/img/41068/${cikkszam}/560x560,r/${cikkszam}.jpg`;
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
                        <div class="card-actions admin-only">
                            <button class="btn-action btn-minus" onclick="event.stopPropagation(); modifyStock('${t.cikkszam}', -1)"><i class="ph-bold ph-minus"></i></button>
                            <button class="btn-action btn-plus" onclick="event.stopPropagation(); modifyStock('${t.cikkszam}', 1)"><i class="ph-bold ph-plus"></i></button>
                        </div>
                    </div>
                    <div class="card-back">
                        <div class="back-content-left">
                            <div class="back-header"><i class="ph-bold ph-info" style="color: var(--neon-cyan);"></i><span>ADATOK</span></div>
                            <div class="back-details">
                                <div class="detail-item" style="flex-direction: column; align-items: flex-start; gap: 0.3rem;">
                                    <span class="label">TERMÉK</span>
                                    <span class="value" style="text-align: left; line-height: 1.3;">${t.nev}</span>
                                </div>
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
                                     onload="handleImageFallback(this)"
                                     onerror="handleImageFallback(this)"
                                     alt="${t.nev}">
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
    });
    appDiv.innerHTML = html;
}

checkSession();
setInterval(updateClock, 1000);
updateClock();
setInterval(fetchProducts, 8000);
