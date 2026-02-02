# VisualStock - Raktárkezelő Rendszer 📦

Ez a projekt egy modern, valós idejű raktárkészlet-kezelő alkalmazás (PWA), amely PHP backendet és MySQL adatbázist használ. A rendszer támogatja a mobilos nézetet és a szimulált ERP szinkronizációt.

## 🛠 Technológiák
- **Frontend:** HTML5, CSS3 (Grid/Flexbox), JavaScript (Fetch API)
- **Backend:** PHP (Native)
- **Adatbázis:** MySQL
- **Design:** Reszponzív, Dark Mode UI

## 🚀 Telepítés és Beüzemelés

A szoftver futtatásához XAMPP vagy hasonló webszerver szükséges.

1. **Fájlok másolása:**
   Másold a projekt tartalmát a webszerver gyökérkönyvtárába (pl. `C:\xampp\htdocs\VisualStock`).

2. **Adatbázis létrehozása:**
   - Nyisd meg a phpMyAdmin-t.
   - Hozz létre egy új adatbázist `visualstock` néven.
   - Importáld a mellékelt `visualstock.sql` fájlt.

3. **Konfiguráció:**
   - Az `api.php` fájl alapértelmezetten a `root` felhasználót és üres jelszót használ (XAMPP standard).

## ✨ Funkciók
- **Valós idejű készletkövetés**
- **Kulcs-Soft szinkronizáció szimulálása**
- **Gyorsszűrők és Keresés**

## 📱 Telepítés Alkalmazásként (PWA)

Ez a rendszer **Progressive Web App (PWA)** technológiát használ, így nemcsak böngészőből, hanem telepített asztali alkalmazásként is futtatható.

**Így próbálhatod ki:**
1. Nyisd meg az oldalt Google Chrome vagy Microsoft Edge böngészőben.
2. A címsor jobb szélén kattints a **Telepítés (monitor/letöltés ikon)** gombra.
3. A szoftver ekkor külön ablakban, böngészőkeret nélkül nyílik meg, mint egy natív raktárkezelő program.
