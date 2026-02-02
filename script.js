const appDiv = document.getElementById('app');
const searchInput = document.getElementById('searchInput');
let termekek = [];
let aktualisSzuro = 'all'; 

async function fetchProducts() {
    try {
        const response = await fetch('api.php');
        if (!response.ok) throw new Error('Hálózati hiba');
        termekek = await response.json();
        if(searchInput.value.length > 0) { filterStock(); } else { filterCategory(aktualisSzuro, false); }
    } catch (error) { console.error('Hiba:', error); }
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

// --- GOMB MŰKÖDÉSE ---
function simulateSync() {
    const btn = document.querySelector('.btn-sync');
    if(!btn) return;
    const originalText = '🔄 Adatok Szinkronizálása';
    
    btn.innerHTML = '⏳ Csatlakozás...';
    btn.disabled = true;
    btn.style.borderColor = '#f1c40f';
    btn.style.color = '#f1c40f';
    
    setTimeout(() => {
        btn.innerHTML = '✅ Sikeres Szinkron!';
        btn.style.borderColor = '#2ecc71';
        btn.style.color = '#2ecc71';
        fetchProducts();
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            btn.style.borderColor = '';
            btn.style.color = '';
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
    if(clearSearch) {
        searchInput.value = "";
        const gombok = document.querySelectorAll('.category-buttons button');
        gombok.forEach(btn => btn.classList.remove('active-btn'));
        if(event && event.target) event.target.classList.add('active-btn');
    }
    if (kategoriaKod === 'all') { renderVisualStock(termekek); return; }

    const szurtTermekek = termekek.filter(termek => {
        const nev = termek.nev.toLowerCase();
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
        appDiv.innerHTML = '<div style="color: #95a5a6; text-align: center; grid-column: 1/-1; padding: 20px;">Nincs találat.</div>';
        return;
    }
    let htmlContent = '';
    adatok.forEach(termek => {
        let szazalek = 0;
        if (termek.max > 0 && termek.db > 0) szazalek = Math.round((termek.db / termek.max) * 100);
        if (szazalek > 100) szazalek = 100;
        let szinClass = 'bg-green'; let borderClass = 'border-green'; let dbSzin = 'inherit';
        if (szazalek < 40) { szinClass = 'bg-yellow'; borderClass = 'border-yellow'; }
        if (szazalek < 20 || termek.db <= 0) { szinClass = 'bg-red'; borderClass = 'border-red'; dbSzin = '#e74c3c'; }

        htmlContent += `
            <div class="card ${borderClass}">
                <div class="card-header">
                    <div>
                        <h3 class="termek-nev">${termek.nev}</h3>
                        <span class="cikkszam">#${termek.cikkszam}</span>
                    </div>
                </div>
                <div class="keszlet-info">
                    <span style="color: ${dbSzin}">${termek.db}</span> <small>/ ${termek.max} db</small>
                </div>
                <div class="progress-container"><div class="progress-bar ${szinClass}" style="width: ${szazalek}%"></div></div>
                <div class="action-buttons">
                    <button class="btn-action btn-minus" onclick="modifyStock('${termek.cikkszam}', -1)">−</button>
                    <button class="btn-action btn-plus" onclick="modifyStock('${termek.cikkszam}', 1)">+</button>
                </div>
            </div>`;
    });
    appDiv.innerHTML = htmlContent;
}

// INDÍTÁS
fetchProducts();
setInterval(updateClock, 1000);
updateClock(); 
setInterval(() => { if (document.activeElement !== searchInput) { fetchProducts(); } }, 2000);