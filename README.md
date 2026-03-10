# 📦 VISUALSTOCK
### Modern Üzletberendezés Raktárkezelő Rendszer

![Banner](IMG_9299.PNG)

A **VisualStock** egy modern, **Neon/Cyberpunk** stílusú raktárkészlet-kezelő webalkalmazás (PWA), amelyet kifejezetten üzletberendezések (sztenderek, vállfák, árazók) nyilvántartására terveztek.

> 🚀 **Kulcs-Soft Kompatibilis** | 📱 **PWA Támogatás** | 🌙 **Premium Dark Mode**

---

## ✨ Kiemelt Funkciók

- **🎨 Premium Cyberpunk Felület**: Látványos sötét téma neon cián/lila színekkel, üveghatású (glassmorphism) elemekkel és Cyber-Grid háttérrel.
- **🖼️ Okos Termékfotók**: 100% megbízható automatikus képkeresés a `vallfa.hu` szerverén (ID: 41068). Ha van fotó a webshopban, a VisualStock megtalálja!
- **🔄 Auto-Flip Rendszer**: A kártyák 5 másodperc után automatikusan visszafordulnak, így a kijelző mindig naprakész és tiszta marad.
- **⚡ Intelligens Készletjelző**: Szigorú színkódolás (Zöld/Sárga/Piros) a készletszintek azonnali áttekintéséhez.
- **📱 Mobil-Optimalizált**: Tökéletes megjelenés asztali gépen és mobilon egyaránt, kifinomult kártya-elrendezéssel.
- **🏃 PWA (App) Mód**: Telepíthető eszközre, natív alkalmazásként használható (ikon az asztalon, teljes képernyős mód).

---

## 🛠️ Technológiai Háttér

A projekt a következő technológiákra épül:
- **Frontend**: HTML5, CSS3 (CSS Variables, Flexbox/Grid), JavaScript (ES6+).
- **Backend**: Nativ PHP.
- **Adatbázis**: MySQL (`visualstock.sql`).
- **Ikonok**: [Phosphor Icons](https://phosphoricons.com/).
- **Betűtípus**: [Outfit](https://fonts.google.com/specimen/Outfit) (Google Fonts).

---

## 🚀 Telepítés és Futtatás

Mivel az alkalmazás most már **Supabase** backendet használ, nincs szükség helyi PHP szerverre (pl. XAMPP).

1. Klónozd a tárolót.
2. Nyisd meg az `index.html` fájlt bármilyen böngészőben.
3. KÉSZ! Az adatok automatikusan töltődnek a felhőből.

## ☁️ Felhő Konfiguráció (Supabase)

A projekt a `script.js` fájl elején található konfigurációval kapcsolódik a Supabase-hez.
- **Project URL:** Megadva
- **Anon Key:** Megadva
- **Tábla:** `termekek`

## 🌐 Netlify Deployment

Az alkalmazás statikus weboldalként hosztolható a Netlify-n:
1. Töltsd fel a fájlokat egy GitHub repo-ba.
2. Kapcsold össze a Netlify-vel.
3. A Netlify automatikusan publikálja az oldalt.

### 📱 Telepítés Mobilon / Asztali Gépen (PWA)
Szeretnéd alkalmazásként használni?
1. Nyisd meg a programot Chrome-ban vagy Edge-ben.
2. Kattints a címsor végén lévő **Telepítés** ikonra (monitor lefelé nyíllal).
3. Élvezd a teljes képernyős, alkalmazás-szerű élményt!

---

## 📸 Képernyőképek

| Főoldal | Keresés |
|:---:|:---:|
| <img src="IMG_9300.PNG" width="400"> | <img src="Képernyőkép 2026-02-02 111521.png" width="400"> |

---

## ⚠️ Hibaelhárítás
**"Demo Mód" felirat jelenik meg / Nem töltenek be a termékek?**
> Ez akkor fordul elő, ha közvetlenül nyitod meg az `index.html` fájlt szerver nélkül. Ilyenkor a rendszer **mintaadatokkal** működik, hogy a dizájn tesztelhető legyen. A teljes funkcionalitáshoz használd a fenti telepítési lépéseket!

---
© 2026 VisualStock Team
