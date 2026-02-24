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
    if (Date.now() - utolsoModositas < 4000) return;
    try {
        const response = await fetch('api.php');
        if (!response.ok) throw new Error('Hálózati hiba');
        const ujAdatok = await response.json();
        handleUpdate(ujAdatok);
    } catch (error) {
        console.warn('API hiba, DEMO mód aktiválása.', error);
        loadDemoData();
    }
}

function loadDemoData() {
    const ujAdatok = [
        { nev: "100cm Kihúzható Ruhatartó Sztender Ipari Görgővel", cikkszam: "601056", db: 11, max: 20, kep: "https://images.unsplash.com/photo-1540221652346-e5dd6b50f3e7?auto=format&fit=crop&q=80&w=400" },
        { nev: "122cm Fekete Ipari Ruhatartó Sztender", cikkszam: "6010414FT", db: 5, max: 10, kep: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=400" },
        { nev: "44cm Csíptetős Ing Fa Vállfa", cikkszam: "402616", db: 1475, max: 1800, kep: "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&q=80&w=400" },
        { nev: "30cm Fehér Gyerek Vállfa Nadrágtartós", cikkszam: "402462", db: 337, max: 500, kep: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=400" },
        { nev: "22x12 Árazószalag FEHÉR", cikkszam: "150060", db: 320, max: 500, kep: "https://images.unsplash.com/photo-1626908013351-800ddd734b40?auto=format&fit=crop&q=80&w=400" },
        { nev: "80/80/12 75 MÉTER BPA MENTES PÉNZTÁRGÉPSZALAG", cikkszam: "150306", db: 1440, max: 2000, kep: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&q=80&w=400" },
        { nev: "Standard GP Belövőpisztoly", cikkszam: "104432", db: 140, max: 200, kep: "https://images.unsplash.com/photo-1572044162444-12c4887bc00a?auto=format&fit=crop&q=80&w=400" },
        { nev: "22L Bevásárló Kosár 2 füles KÉK", cikkszam: "607452", db: 98, max: 200, kep: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400" },
        { nev: "Fekete Öltönyzsák 60x110 cm", cikkszam: "503580", db: 103, max: 200, kep: "https://images.unsplash.com/photo-1606134375929-656d02a90432?auto=format&fit=crop&q=80&w=400" },
        { nev: "L Méretjelölő vállfára", cikkszam: "900005", db: 8, max: 20, kep: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=80&w=400" },
        { nev: "Irodai toll kék", cikkszam: "700001", db: 45, max: 100, kep: "https://images.unsplash.com/photo-1585336139118-121f6920f027?auto=format&fit=crop&q=80&w=400" }
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
    if (termekIndex !== -1) {
        termekek[termekIndex].db += valtozas;
        if (termekek[termekIndex].db < 0) termekek[termekIndex].db = 0;
        renderVisualStock(termekek);
    }
    try {
        await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cikkszam: cikkszam, valtozas: valtozas })
        });
    } catch (error) {
        console.error("Hiba mentéskor:", error);
        utolsoModositas = 0;
        fetchProducts();
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

    // TELJES SZŰRÉSI LOGIKA (Restore and improve)
    const szurt = termekek.filter(t => {
        const n = t.nev.toLowerCase();
        if (kod === 'sztender') return n.includes('sztender') || n.includes('állvány');
        if (kod === 'vallfa') return (n.includes('vállfa') || n.includes('méretjelölő') || n.includes('méretjelző') || n.includes('csipesz') || n.includes('divider')) && !n.includes('leszedő');
        if (kod === 'cimkezo') return n.includes('belövő') || n.includes('szál') || n.includes('körszál') || (n.includes('címke') && n.includes('függő')) || (n.includes('etikett') && n.includes('függő')) || n.includes('pisztoly');
        if (kod === 'vonalcimke') return (n.includes('vonalkód') || n.includes('körcímke')) || (n.includes('etikett') && !n.includes('függő') && !n.includes('polc') && !n.includes('karton'));
        if (kod === 'arazogep') return n.includes('árazó') || n.includes('festékhenger');
        if (kod === 'ruhazsak') return n.includes('ruhazsák') || n.includes('öltönyzsák') || n.includes('ruhafólia') || (n.includes('fólia') && n.includes('sztender'));
        if (kod === 'polccimke') return n.includes('ársín') || n.includes('polccímke') || n.includes('kartoncímke');
        if (kod === 'plexitok') return n.includes('laptok') || n.includes('tábla') || n.includes('plexi');
        if (kod === 'kasszaszalag') return n.includes('pénztárgépszalag') || n.includes('hőpapír') || n.includes('bankterminál') || n.includes('repont') || n.includes('envipco') || n.includes('mérlegcímke');
        if (kod === 'taska') return n.includes('táska') || n.includes('tasak') || n.includes('zacskó');
        if (kod === 'irodaszer') {
            const irodaSzavak = ['toll', 'marker', 'boríték', 'genotherm', 'gyorsfűző', 'spirálfüzet', 'radír', 'ragasztó', 'tűzőkapocs', 'nyomtatvány', 'kábelkötegelő', 'papír', 'marker', 'cellux'];
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

/**
 * Hiba esetén váltogatja a képforrásokat a hivatalos minták között.
 */
function handleImageError(img) {
    const sku = img.getAttribute('data-sku');
    const name = img.getAttribute('data-name');
    const attempt = parseInt(img.getAttribute('data-attempt') || '0');

    // Hivatalos Unas/Vallfa minták listája - A 41068 a hitelesítve jó ID!
    const patterns = [
        `https://vallfa.hu/img/41068/${sku}/500x500/${sku}.jpg`,
        `https://vallfa.hu/shop_ordered/41068/shop_altkep/${sku}.jpg`,
        `https://vallfa.hu/shop_ordered/41068/shop_altkep/${sku}_altkep_1.jpg`,
        `https://vallfa.hu/shop_ordered/41068/pic/${sku}.jpg`,
        // Ha semmi sem jön be, jöhet a professzionális márkázott helyőrző
        `https://via.placeholder.com/400/0f172a/00f3ff?text=${encodeURIComponent(name.split(' ')[0] + '\n#' + sku)}`
    ];

    if (attempt < patterns.length) {
        img.setAttribute('data-attempt', attempt + 1);
        img.src = patterns[attempt];
    } else {
        // Ha minden kötél szakad, ne próbálkozzon tovább
        img.onerror = null;
        img.style.opacity = '0.5';
    }
}

function getProductImage(cikkszam, name, kep) {
    if (kep) return kep;

    // Elsődleges jelölt: a modern Unas minta (ID: 41068)
    if (cikkszam && (cikkszam.match(/^[a-zA-Z0-9-]+$/))) {
        return `https://vallfa.hu/img/41068/${cikkszam}/500x500/${cikkszam}.jpg`;
    }

    // Ha nincs cikkszám, azonnal a professzionális helyőrző
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

        // Pass name for smarter fallback discovery
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
                            <div class="back-footer" style="margin-top:auto; padding-top:10px; border-top:1px solid rgba(255,255,255,0.05); font-size:0.75rem;"><i class="ph-fill ph-check-circle"></i> Sync: 5s</div>
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
setInterval(fetchProducts, 5000);