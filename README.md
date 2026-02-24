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

## 🚀 Telepítés és Használat

A program működéséhez **webszerverre** van szükség (mivel PHP alapú Backend szolgálja ki az adatokat).

### 1️⃣ Webszerver beállítása (Ajánlott)
Ha van **XAMPP** vagy **WAMP** telepítve:
1. Másold a projekt mappáját a `htdocs` mappába (pl. `C:\xampp\htdocs\VisualStock`).
2. Indítsd el az Apache és MySQL modulokat.
3. Importáld a `visualstock.sql` fájlt phpMyAdmin-ban.
4. Nyisd meg a böngészőben: `http://localhost/VisualStock`

### 2️⃣ VS Code "PHP Server" (Fejlesztéshez)
1. Telepítsd a **PHP Server** kiegészítőt Visual Studio Code-ban.
2. Jobb klikk az `index.html` fájlon -> **PHP Server: Serve project**.

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
