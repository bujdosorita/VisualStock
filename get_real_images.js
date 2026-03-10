const https = require('https');
const skus = ['601056', '6010414FT', '900133', '900132', '900152', '601045TRUD', '601047TFEKEZ', '6010395FT', '601047SONG160', '6010406FT', '1500611', '1500782', '60745034LRED', '899s', '150600', '150037P7', '839', 'S10', '601070', '601070R'];

function checkSku(sku) {
    https.get('https://vallfa.hu/shop_search.php?search=' + sku, {headers:{'User-Agent':'Mozilla/5.0'}}, res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
            const regex = /<img[^>]+src=["'](https:\/\/vallfa\.hu\/(?:img|shop_ordered)\/[^"']+)["']/i;
            const match = body.match(regex);
            if (match && match[1]) {
                console.log(`    if (cikkszam === '${sku}') return '${match[1]}';`);
            } else {
                console.log(`    // NOT FOUND: ${sku}`);
            }
        });
    });
}

skus.forEach((sku, i) => setTimeout(() => checkSku(sku), i * 300));
