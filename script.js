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
let lastSyncTime = null;

// AUTH & ROLE STATE
let currentUser = null;
let pendingChanges = {};

async function hashPassword(password) {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function handleLogin() {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    
    if (!user || !pass) {
        errorEl.innerText = "Kérlek tölts ki minden mezőt!";
        return;
    }

    // Single shared admin check
    if (user === 'admin' && pass === 'admin123') {
        loginSuccess({ name: 'Admin', role: 'admin' });
        return;
    }

    try {
        const hashedPass = await hashPassword(pass);
        const { data, error } = await supabaseClient
            .from('felhasznalok')
            .select('*')
            .or(`username.eq.${user},email.eq.${user}`)
            .eq('password', hashedPass)
            .single();

        if (error || !data) {
            errorEl.innerText = "Hibás adatok vagy jelszó!";
        } else {
            loginSuccess({ name: data.username, role: data.role });
        }
    } catch (e) {
        console.error("Login hiba:", e);
        errorEl.innerText = "Hiba történt a bejelentkezés során!";
    }
}

async function handleRegister() {
    const user = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value.trim();
    const errorEl = document.getElementById('regError');
    
    if (!user || !email || !pass) {
        errorEl.innerText = "Kérlek tölts ki minden mezőt!";
        return;
    }

    if (!email.includes('@')) {
        errorEl.innerText = "Érvénytelen e-mail cím!";
        return;
    }

    if (user.toLowerCase() === 'admin') {
        errorEl.innerText = "Az 'admin' név foglalt!";
        return;
    }

    try {
        const hashedPass = await hashPassword(pass);
        const { error } = await supabaseClient
            .from('felhasznalok')
            .insert([{ username: user, email: email, password: hashedPass, role: 'user' }]);

        if (error) {
            console.error("Regisztrációs Supabase hiba:", error);
            if (error.code === '23505') {
                errorEl.innerText = "A név vagy e-mail már létezik!";
            } else {
                errorEl.innerText = "Szerver hiba (" + error.code + "): " + error.message;
            }
        } else {
            alert("Sikeres regisztráció! Most már bejelentkezhetsz.");
            toggleLoginView('login');
        }
    } catch (e) {
        console.error("Regisztrációs kliens hiba:", e);
        errorEl.innerText = "Hiba történt: " + e.message;
    }
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.password-toggle');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('ph-eye', 'ph-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('ph-eye-slash', 'ph-eye');
    }
}

function toggleLoginView(view) {
    const loginForm = document.getElementById('loginFormView');
    const regForm = document.getElementById('regFormView');
    const loginError = document.getElementById('loginError');
    const regError = document.getElementById('regError');

    if (view === 'reg') {
        loginForm.style.display = 'none';
        regForm.style.display = 'block';
        regError.innerText = "";
    } else {
        loginForm.style.display = 'block';
        regForm.style.display = 'none';
        loginError.innerText = "";
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
    
    // Alapértelmezetten a Dashboardot töltjük be
    fetchProducts(true); 
}

function renderDashboard() {
    aktualisSzuro = 'dashboard';
    appDiv.classList.remove('grid-container'); 
    
    const lowStockItems = termekek.filter(t => {
        let sz = t.max > 0 ? (t.db / t.max) * 100 : 0;
        return sz < 20 || t.db <= 0;
    });

    const totalItems = termekek.length;
    const criticalCount = lowStockItems.length;
    const kasszaCount = termekek.filter(t => getTermekCategory(t) === 'kasszaszalag').length;

    // Ha már ott vagyunk a Dashboardon, csak a számokat frissítjük (nincs villogás)
    const existingDash = document.querySelector('.dashboard-container');
    if (existingDash) {
        const valTotal = document.getElementById('stat-total-val');
        const valCrit = document.getElementById('stat-crit-val');
        const valKassza = document.getElementById('stat-kassza-val');
        const valSync = document.getElementById('last-sync-time');
        if (valTotal) valTotal.innerText = totalItems;
        if (valCrit) valCrit.innerText = criticalCount;
        if (valKassza) valKassza.innerText = kasszaCount;
        if (valSync) valSync.innerText = lastSyncTime || '--:--:--';
        return;
    }

    appDiv.classList.remove('grid-container'); 
    document.querySelectorAll('.category-buttons button').forEach(b => b.classList.remove('active-btn'));

    let html = `
        <div class="dashboard-container">
            <div class="dashboard-welcome">
                <h2>Üdvözlünk, ${currentUser.name}!</h2>
                <div class="sync-status">
                    <i class="ph-bold ph-arrows-clockwise"></i>
                    <span>Utolsó készlet lekérés: <strong id="last-sync-time">${lastSyncTime || '--:--:--'}</strong></span>
                </div>
            </div>
            <div class="stats-grid">
                <div class="stat-card" onclick="filterCategory('all')">
                    <div class="stat-icon"><i class="ph-fill ph-package"></i></div>
                    <div class="stat-info">
                        <span class="stat-value" id="stat-total-val">${totalItems}</span>
                        <span class="stat-label">Összes Termék</span>
                    </div>
                </div>
                <div class="stat-card critical" onclick="filterCritical()">
                    <div class="stat-icon"><i class="ph-fill ph-warning-octagon"></i></div>
                    <div class="stat-info">
                        <span class="stat-value" id="stat-crit-val">${criticalCount}</span>
                        <span class="stat-label">Kritikus Készlet</span>
                    </div>
                </div>
                <div class="stat-card accent" onclick="filterCategory('kasszaszalag')">
                    <div class="stat-icon"><i class="ph-fill ph-receipt"></i></div>
                    <div class="stat-info">
                        <span class="stat-value" id="stat-kassza-val">${kasszaCount}</span>
                        <span class="stat-label">Kasszapapírok</span>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-actions">
                <h3>Gyorsműveletek</h3>
                <div class="quick-links">
                    <button onclick="filterCategory('all')"><i class="ph-bold ph-magnifying-glass"></i> Termékek böngészése</button>
                    ${currentUser.role === 'admin' ? '<button onclick="simulateSync()"><i class="ph-bold ph-arrows-clockwise"></i> Adatok frissítése</button>' : ''}
                </div>
            </div>
        </div>
    `;
    appDiv.innerHTML = html;
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
    console.log("Munkamenet ellenőrzése...");
    try {
        const saved = localStorage.getItem('vs_session');
        if (saved) {
            console.log("Mentett munkamenet megtalálva:", JSON.parse(saved).name);
            loginSuccess(JSON.parse(saved));
        } else {
            console.log("Nincs mentett munkamenet, belépő megjelenítése.");
            const overlay = document.getElementById('loginOverlay');
            if (overlay) {
                overlay.style.display = 'flex';
            } else {
                console.error("KRITIKUS: loginOverlay elem nem található!");
            }
        }
    } catch (e) {
        console.error("Session check error:", e);
        const overlay = document.getElementById('loginOverlay');
        if (overlay) overlay.style.display = 'flex';
    }
}

function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clock');
    if (clockEl) {
        clockEl.innerText = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    }
}

async function simulateSync() {
    if (!currentUser || currentUser.role !== 'admin') return;
    const btn = event?.target?.closest('button');
    if (btn) {
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="ph-bold ph-circle-notch animate-spin"></i> Szinkronizálás...';
        
        await fetchProducts(aktualisSzuro === 'dashboard');
        
        setTimeout(() => {
            btn.innerHTML = '<i class="ph-bold ph-check"></i> Kész!';
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }, 2000);
        }, 1000);
    } else {
        await fetchProducts(aktualisSzuro === 'dashboard');
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

async function fetchProducts(showDashboard = false) {
    if (Date.now() - utolsoModositas < 2000) return;
    try {
        const { data, error } = await supabaseClient
            .from('termekek')
            .select('*')
            .order('nev', { ascending: true });

        if (error) throw error;

        const formataltAdatok = data.map(t => ({
            cikkszam: t.cikkszam,
            nev: t.nev,
            db: Math.max(0, parseInt(t.db)),
            max: parseInt(t.max_keszlet),
            kep: t.kep || null
        }));

        termekek = formataltAdatok;
        lastSyncTime = new Date().toLocaleTimeString('hu-HU');
        
        if (showDashboard || aktualisSzuro === 'dashboard') {
            renderDashboard();
        } else {
            handleUpdate(formataltAdatok);
        }
    } catch (error) {
        console.error('Supabase hiba:', error);
        if (termekek.length === 0) {
            loadDemoData();
            if (showDashboard) renderDashboard();
        }
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
    termekek = ujAdatok;
    if (aktualisSzuro === 'dashboard') {
        renderDashboard();
    } else if (aktualisSzuro === 'critical') {
        filterCritical();
    } else if (searchInput.value.length > 0) {
        filterStock();
    } else {
        filterCategory(aktualisSzuro, false);
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

function filterCritical() {
    aktualisSzuro = 'critical';
    document.querySelectorAll('.category-buttons button').forEach(b => b.classList.remove('active-btn'));
    const szurt = termekek.filter(t => (t.max > 0 ? (t.db/t.max)*100 : 0) < 20 || t.db <= 0);
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

    const szurt = termekek.filter(t => getTermekCategory(t) === kod);
    renderVisualStock(szurt);
}

function renderVisualStock(adatok) {
    appDiv.classList.add('grid-container'); // Termékeknél legyen grid
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

try {
    checkSession();
    setInterval(updateClock, 1000);
    updateClock();
    setInterval(() => fetchProducts(), 10000); 
} catch (e) {
    console.error("Iniciáló hiba:", e);
}
