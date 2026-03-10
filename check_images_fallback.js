const https = require('https');
const fs = require('fs');

const sql = fs.readFileSync('c:/xampp2/htdocs/VisualStock/visualstock.sql', 'utf8');
const regex = /\((\d+),\s*'([^']+)',\s*'([^']+)'/g;
let match;
const products = [];

while ((match = regex.exec(sql)) !== null) {
    products.push({cikkszam: match[2], nev: match[3]});
}

let missing = [];
let checked = 0;

function checkUrl(url, callback) {
    https.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}}, res => {
        callback(res.statusCode === 200 || res.statusCode === 301 || res.statusCode === 302);
    }).on('error', () => callback(false));
}

function checkProductImage(product) {
    const sku = product.cikkszam;
    const patterns = [
        `https://vallfa.hu/img/41068/${sku}/500x500/${sku}.jpg`,
        `https://vallfa.hu/shop_ordered/41068/shop_altkep/${sku}.jpg`,
        `https://vallfa.hu/shop_ordered/41068/shop_altkep/${sku}_altkep_1.jpg`,
        `https://vallfa.hu/shop_ordered/41068/pic/${sku}.jpg`
    ];

    let currentPattern = 0;

    function next() {
        if (currentPattern >= patterns.length) {
            missing.push(product.cikkszam + ' | ' + product.nev);
            done();
            return;
        }

        checkUrl(patterns[currentPattern], (exists) => {
            if (exists) {
                // Found ONE working image for this product, we're good
                done();
            } else {
                currentPattern++;
                next();
            }
        });
    }
    
    function done() {
        checked++;
        if (checked === products.length) {
            console.log('--- TRULY MISSING HANGER IMAGES ---\n' + missing.join('\n'));
        }
    }

    next();
}

products.forEach((p, i) => {
    setTimeout(() => checkProductImage(p), i * 150);
});
