const https = require('https');
const fs = require('fs');

const sql = fs.readFileSync('c:/xampp2/htdocs/VisualStock/visualstock.sql', 'utf8');
const regex = /\((\d+),\s*'([^']+)',\s*'([^']+)'/g;
let match;
const products = [];

while ((match = regex.exec(sql)) !== null) {
    if (match[3].toLowerCase().includes('vállfa')) {
        products.push({cikkszam: match[2], nev: match[3]});
    }
}

let missing = [];
let checked = 0;

function checkImage(product) {
    const url = `https://vallfa.hu/img/41068/${product.cikkszam}/500x500/${product.cikkszam}.jpg`;
    https.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}}, res => {
        if (res.statusCode !== 200) {
            missing.push(product.cikkszam + ' | ' + product.nev);
        }
        checked++;
        if (checked === products.length) {
            console.log('--- MISSING HANGER IMAGES ---\n' + missing.join('\n'));
        }
    }).on('error', () => {
        missing.push(product.cikkszam + ' | ' + product.nev + ' (ERR)');
        checked++;
        if (checked === products.length) {
            console.log('--- MISSING HANGER IMAGES ---\n' + missing.join('\n'));
        }
    });
}

products.forEach((p, i) => {
    setTimeout(() => checkImage(p), i * 100);
});
