const https = require('https');
const fs = require('fs');

const sql = fs.readFileSync('c:/xampp2/htdocs/VisualStock/visualstock.sql', 'utf8');
const regex = /\((\d+),\s*'([^']+)',\s*'([^']+)'/g;
let match;
const products = [];

while ((match = regex.exec(sql)) !== null) {
    const nev = match[3].toLowerCase();
    if (nev.includes('sztender') || nev.includes('állvány')) {
        products.push({cikkszam: match[2], nev: match[3]});
    }
}

let mappings = [];
let checked = 0;

function searchProductImage(product) {
    const searchUrl = `https://vallfa.hu/shop_search.php?search=${encodeURIComponent(product.cikkszam)}`;
    
    https.get(searchUrl, {headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}}, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            // Looking for <img src="URL" ...> inside the product list
            const imgRegex = /<img[^>]+src=["'](https:\/\/vallfa\.hu\/(?:img|shop_ordered)\/[^"']+\.jpg)["'][^>]*>/i;
            const imgMatch = body.match(imgRegex);
            
            if (imgMatch && imgMatch[1]) {
                mappings.push(`    if (cikkszam === '${product.cikkszam}') return '${imgMatch[1]}'; // ${product.nev}`);
            } else {
                mappings.push(`    // NOT FOUND: ${product.cikkszam} - ${product.nev}`);
            }
            done();
        });
    }).on('error', (e) => {
        mappings.push(`    // ERROR: ${product.cikkszam} - ${product.nev} (${e.message})`);
        done();
    });
}

function done() {
    checked++;
    if (checked === products.length) {
        console.log('--- IMAGE MAPPINGS FOR SZTENDEREK ---\n');
        console.log(mappings.join('\n'));
    }
}

products.forEach((p, i) => {
    setTimeout(() => searchProductImage(p), i * 300); // polite delay
});
