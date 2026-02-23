const appDiv = document.getElementById('app');
const searchInput = document.getElementById('searchInput');
let termekek = [];
let aktualisSzuro = 'all';

async function fetchProducts() {
    try {
        const response = await fetch('api.php');
        if (!response.ok) throw new Error('Hálózati hiba');
        termekek = await response.json();

        // Preserve active search or filter
        if (searchInput.value.length > 0) {
            filterStock();
        } else {
            // If we are filtering by category, re-render that category
            // But if we are on 'all', just render all
            if (aktualisSzuro !== 'all') {
                filterCategory(aktualisSzuro, false);
            } else {
                renderVisualStock(termekek);
            }
        }
    } catch (error) {
        console.warn('API nem elérhető, DEMO mód aktiválása (Mock adatok).', error);

        // --- DEMO MOCK ADATOK (Bővített lista a valós adatbázisból) ---
        termekek = [
            // Sztenderek
            { nev: "100cm Kihúzható Ruhatartó Sztender Ipari Görgővel", cikkszam: "601056", db: 11, max: 20 },
            { nev: "122cm Fekete Ipari Ruhatartó Sztender", cikkszam: "6010414FT", db: 5, max: 10 },
            { nev: "152cm Fekete Ipari Ruhatartó Sztender", cikkszam: "6010395FT", db: 4, max: 10 },
            { nev: "182cm Fekete Ipari Ruhatartó Sztender", cikkszam: "6010406FT", db: 27, max: 40 },
            { nev: "150cm Fékezhető Ruha Sztender", cikkszam: "601047TFEKEZ", db: 100, max: 200 },

            // Vállfák (Fa, Műanyag, Fém)
            { nev: "11cm Fém Csipesz Vállfa Kampóval", cikkszam: "404208", db: 1422, max: 1900 },
            { nev: "30cm Fehér Gyerek Vállfa Nadrágtartós", cikkszam: "402462", db: 337, max: 500 },
            { nev: "36cm Fekete Gumis Csíptetős Vállfa", cikkszam: "700004", db: 6005, max: 6700 },
            { nev: "40cm Ezüst Drót Vállfa", cikkszam: "404200", db: 7270, max: 10500 },
            { nev: "40cm Fehér Fa Vállfa Bevágásos Vállú", cikkszam: "402450", db: 398, max: 600 },
            { nev: "44cm Csíptetős Ing Fa Vállfa", cikkszam: "402616", db: 1475, max: 1800 },
            { nev: "44cm Nadrágtartós Ing Fa Vállfa", cikkszam: "402608", db: 508, max: 700 },
            { nev: "45cm Öltöny Vállfa + Szivacsos Nadrágtartó", cikkszam: "70000247", db: 803, max: 1000 },

            // Címkék és Szalagok
            { nev: "22x12 Árazószalag FEHÉR", cikkszam: "150060", db: 320, max: 500 },
            { nev: "22x12 Árazószalag FLUO NARANCS", cikkszam: "150080", db: 130, max: 200 },
            { nev: "26x12 Árazószalag FLUO CITROMSÁRGA", cikkszam: "150087", db: 110, max: 200 },
            { nev: "100x100mm Thermo Vonalkód-Nyomtató Címke", cikkszam: "150230", db: 3, max: 10 },
            { nev: "58x43mm Thermo Tekercses MÉRLEGCÍMKE", cikkszam: "150227-600", db: 795, max: 1000 },

            // Belövőszálak és Pisztolyok
            { nev: "25mm Avery Dennison Standard Belövőszál", cikkszam: "105702", db: 76, max: 200 },
            { nev: "40mm CDC Belövőszál (5.000 szál/#)", cikkszam: "105029", db: 26, max: 40 },
            { nev: "Standard Avery Dennison MKIII Belövőpisztoly", cikkszam: "104430", db: 39, max: 50 },
            { nev: "Standard GP Belövőpisztoly", cikkszam: "104432", db: 140, max: 200 },

            // Kosarak
            { nev: "22L Bevásárló Kosár 2 füles KÉK", cikkszam: "607452", db: 98, max: 200 },
            { nev: "22L Bevásárló Kosár 2 füles PIROS", cikkszam: "607450", db: 291, max: 400 },
            { nev: "22L Bevásárló Kosár 2 füles FEKETE", cikkszam: "607451", db: 279, max: 400 },
            { nev: "34L Gurulós Piros Bevásárló Kosár", cikkszam: "60745034LRED", db: 98, max: 200 },

            // Pénztárgép és Iroda
            { nev: "57/50/12 28 MÉTER BPA MENTES PÉNZTÁRGÉPSZALAG", cikkszam: "150210", db: 7900, max: 10800 },
            { nev: "80/80/12 75 MÉTER BPA MENTES PÉNZTÁRGÉPSZALAG", cikkszam: "150306", db: 1440, max: 2000 },
            { nev: "A4 Info Tábla Fém Állvánnyal", cikkszam: "607412", db: 149, max: 200 },
            { nev: "Ársín 30mm x 1000mm FEHÉR", cikkszam: "110103", db: 2374, max: 3100 },
            { nev: "Ársín 40mm x 1000mm VÍZTISZTA", cikkszam: "110106", db: 1599, max: 1900 },

            // Csomagolás (Zsákok)
            { nev: "Fekete Öltönyzsák 60x110 cm", cikkszam: "503580", db: 103, max: 200 },
            { nev: "Ingvállas Táska 28x47cm", cikkszam: "358189", db: 3000, max: 4400 },
            { nev: "Nylon Zacskó 25x31cm", cikkszam: "358193", db: 2000, max: 2800 },
            { nev: "Víztiszta Öltönyzsák 59cm x 120cm", cikkszam: "503562500", db: 6500, max: 9200 },

            // Méretjelzők
            { nev: "L Méretjelölő vállfára", cikkszam: "900005", db: 8, max: 20 },
            { nev: "M Méretjelölő vállfára", cikkszam: "900004", db: 2, max: 10 },
            { nev: "XL Méretjelölő vállfára", cikkszam: "900006", db: 17, max: 30 },

            // Egyéb
            { nev: "Lopásgátlós Hotel Vállfa Csúszásgátlós", cikkszam: "402574", db: 309, max: 500 },
            { nev: "Vállfa Méret Elválasztó FEHÉR DIVIDER", cikkszam: "308618", db: 1720, max: 2400 }
        ];

        // A felhasználó kérésére NEM írjuk ki a felületre, hogy Demo mód.
        // Helyette a háttérben töltjük be az adatokat, mintha működne.

        if (searchInput.value.length > 0) {
            filterStock();
        } else {
            if (aktualisSzuro !== 'all') { filterCategory(aktualisSzuro, false); }
            else { renderVisualStock(termekek); }
        }
    }
}

async function modifyStock(cikkszam, valtozas) {
    try {
        const response = await fetch('api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cikkszam: cikkszam, valtozas: valtozas })
        });
        fetchProducts();
    } catch (error) { alert("Hiba történt a mentéskor!"); }
}

// --- GOMB MŰKÖDÉSE (NEON LOGIC) ---
function simulateSync() {
    const btn = document.querySelector('.btn-sync');
    if (!btn) return;

    // Save original content
    const originalHTML = '<i class="ph-bold ph-arrows-clockwise"></i> <span>Adatok Szinkronizálása</span>';

    // 1. Loading State (Purple/Magenta)
    btn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> <span>Csatlakozás...</span>';
    btn.disabled = true;
    btn.classList.add('loading');

    setTimeout(() => {
        // 2. Success State (Cyan - NOT Green/Traffic Light)
        btn.innerHTML = '<i class="ph-bold ph-check"></i> <span>Sikeres Szinkron!</span>';
        btn.classList.remove('loading');
        btn.classList.add('success');

        fetchProducts();

        setTimeout(() => {
            // 3. Reset
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.classList.remove('success');
        }, 2000);
    }, 1500);
}

// --- ÓRA MŰKÖDÉSE ---
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    const clockElement = document.getElementById('clock');
    if (clockElement) clockElement.innerText = timeString;
}

function filterStock() {
    const keresettSzoveg = searchInput.value.toLowerCase();
    const szurtTermekek = termekek.filter(termek =>
        termek.nev.toLowerCase().includes(keresettSzoveg) || termek.cikkszam.toLowerCase().includes(keresettSzoveg)
    );
    renderVisualStock(szurtTermekek);
}

function filterCategory(kategoriaKod, clearSearch = true) {
    aktualisSzuro = kategoriaKod;
    if (clearSearch) {
        searchInput.value = "";
        const gombok = document.querySelectorAll('.category-buttons button');
        gombok.forEach(btn => btn.classList.remove('active-btn'));

        // Safe event handling
        const e = window.event || event;
        if (e && e.target) {
            // Handle if click target is the icon inside the button
            const targetBtn = e.target.closest('button');
            if (targetBtn) targetBtn.classList.add('active-btn');
        }
    }

    if (kategoriaKod === 'all') { renderVisualStock(termekek); return; }

    const szurtTermekek = termekek.filter(termek => {
        const nev = termek.nev.toLowerCase();
        // Keep original logic
        if (kategoriaKod === 'sztender') return nev.includes('sztender') || nev.includes('állvány');
        if (kategoriaKod === 'vallfa') return nev.includes('vállfa') || nev.includes('méretjelölő') || nev.includes('csipesz');
        if (kategoriaKod === 'belovo') return nev.includes('belövő') || nev.includes('címke') || nev.includes('körszál') || nev.includes('etikett') || nev.includes('festékszalag');
        if (kategoriaKod === 'arazo') return nev.includes('árazó') || nev.includes('festékhenger') || nev.includes('árazószalag');
        if (kategoriaKod === 'ruhazsak') return nev.includes('ruhazsák') || nev.includes('öltönyzsák') || nev.includes('zsák') || nev.includes('fólia') || nev.includes('tasak');
        if (kategoriaKod === 'kosar') return nev.includes('kosár');
        if (kategoriaKod === 'penztar') return nev.includes('pénztárgép') || nev.includes('bankterminál') || nev.includes('repont') || nev.includes('hőpapír');
        if (kategoriaKod === 'iroda') return nev.includes('toll') || nev.includes('filc') || nev.includes('boríték') || nev.includes('papír') || nev.includes('fénymásoló') || nev.includes('kábelkötegelő') || nev.includes('csomagoló') || nev.includes('ragasztó') || nev.includes('tűzőkapocs') || nev.includes('nyomtatvány') || nev.includes('genotherm') || nev.includes('gyorsfűző') || nev.includes('mappa') || nev.includes('laptok') || nev.includes('tábla');
        return false;
    });
    renderVisualStock(szurtTermekek);
}

function renderVisualStock(adatok) {
    if (adatok.length === 0) {
        appDiv.innerHTML = '<div style="color: var(--text-muted); text-align: center; grid-column: 1/-1; padding: 40px; font-size: 1.2rem;">Nincs találat a keresési feltételeknek megfelelően.</div>';
        return;
    }
    let htmlContent = '';
    adatok.forEach(termek => {
        let szazalek = 0;
        if (termek.max > 0 && termek.db > 0) szazalek = Math.round((termek.db / termek.max) * 100);
        if (szazalek > 100) szazalek = 100;

        let stockClass = 'stock-high';
        let textClass = 'text-green';

        if (szazalek < 40) { stockClass = 'stock-med'; textClass = 'text-yellow'; }
        if (szazalek < 20 || termek.db <= 0) { stockClass = 'stock-low'; textClass = 'text-red'; }

        htmlContent += `
            <div class="card">
                <div class="card-top">
                    <h3 class="termek-nev">${termek.nev}</h3>
                    <div class="cikkszam-badge">#${termek.cikkszam}</div>
                </div>
                
                <div class="stock-status">
                    <div class="stock-numbers">
                        <span class="current-qty ${textClass}">${termek.db}</span>
                        <span class="max-qty">/ ${termek.max} db</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill ${stockClass}" style="width: ${szazalek}%"></div>
                    </div>
                </div>

                <div class="card-actions">
                    <button class="btn-action btn-minus" onclick="modifyStock('${termek.cikkszam}', -1)">
                        <i class="ph-bold ph-minus"></i>
                    </button>
                    <button class="btn-action btn-plus" onclick="modifyStock('${termek.cikkszam}', 1)">
                        <i class="ph-bold ph-plus"></i>
                    </button>
                </div>
            </div>`;
    });
    appDiv.innerHTML = htmlContent;
}

// INDÍTÁS
fetchProducts();
setInterval(updateClock, 1000);
updateClock();
// Auto refresh only if user isn't typing
setInterval(() => {
    if (document.activeElement !== searchInput) {
        // We could run a quiet update here, but let's stick to simple logic
        fetchProducts();
    }
}, 3000);