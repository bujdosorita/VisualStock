const https = require('https');
const fs = require('fs');

function getProductImage(cikkszam, name, kep) {
    if (kep) return kep;
    
    if (cikkszam === '601056') return 'https://vallfa.hu/img/41068/601045/500x500/601045.jpg'; // Helyettesítő
    if (cikkszam === '601045TRUD') return 'https://vallfa.hu/img/41068/601045/500x500/601045.jpg';
    if (cikkszam === '601047TFEKEZ') return 'https://vallfa.hu/img/41068/6010475FEK/500x500/6010475FEK.jpg';
    if (cikkszam === '601047SONG160') return 'https://vallfa.hu/img/41068/601047/500x500/601047.jpg';
    if (cikkszam === '6010414FT') return 'https://vallfa.hu/img/41068/601041FT/500x500/601041FT.jpg';
    if (cikkszam === '6010395FT') return 'https://vallfa.hu/img/41068/601039FT/500x500/601039FT.jpg';
    if (cikkszam === '6010406FT') return 'https://vallfa.hu/img/41068/601040FT/500x500/601040FT.jpg';
    if (cikkszam === '503590' || cikkszam === '503594') return 'https://vallfa.hu/img/41068/503562/500x500/503562.jpg'; // Fólia fallback
    
    if (cikkszam) {
        const baseCikkszamMatch = cikkszam.match(/^(\d+)[a-zA-Z]+(\d*)?$/);
        const baseCikkszam = baseCikkszamMatch ? (baseCikkszamMatch[1] + (baseCikkszamMatch[2] || '')) : cikkszam;
        return `https://vallfa.hu/img/41068/${baseCikkszam}/500x500/${baseCikkszam}.jpg`;
    }
    return null;
}

const sql = fs.readFileSync('c:/xampp2/htdocs/VisualStock/visualstock.sql', 'utf8');
const regex = /\((\d+),\s*'([^']+)',\s*'([^']+)'/g;
let match;
const products = [];

while ((match = regex.exec(sql)) !== null) {
    products.push({cikkszam: match[2], nev: match[3]});
}

let checked = 0;
let broken = [];

function check(p) {
    const url = getProductImage(p.cikkszam, p.nev, null);
    if (!url || url.includes('placeholder')) {
        done();
        return;
    }
    
    https.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}}, res => {
        // missing images are returned as 1x1 image/gif
        if (res.headers['content-type'] && res.headers['content-type'].includes('image/gif')) {
            broken.push(`${p.cikkszam} [${p.nev}] -> ${url}`);
        }
        done();
    }).on('error', () => {
        broken.push(`${p.cikkszam} [${p.nev}] -> ERR`);
        done();
    });
}

function done() {
    checked++;
    if (checked === products.length) {
        console.log('--- BROKEN URLS (GIF RESPONSES) ---');
        console.log(broken.join('\n'));
    }
}

products.forEach((p, i) => setTimeout(() => check(p), i * 15));
