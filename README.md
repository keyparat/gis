# WebGIS Enterprise Studio (ArcGIS & QGIS Pro Web Platform) 🗺️

Aplikasi WebGIS interaktif tingkat lanjut yang memadukan keunggulan **ArcGIS Online / ArcGIS Pro** dan **QGIS Desktop**. Aplikasi ini menyediakan manajemen layer komprehensif, fitur **Upload Multi-Format (SHP, KML/KMZ, WMS, WFS, GeoJSON)** dengan **preservasi simbologi asli**, **Reproyeksi Koordinat Otomatis (Indonesia TM-3° BPN, UTM, Web Mercator, WGS 84)**, fitur **Hapus Layer**, pengaturan urutan layer (*Z-Index Ordering*), ekspor data, galeri peta dasar dengan visual thumbnail, markah spasial (*bookmarks*), alat ukur spasial presisi, dan tabel atribut dock bawah yang responsif.

---

## 🎯 Fitur Baru: Dukungan Penuh Semua Sistem Koordinat & Reproyeksi TM-3° BPN

Sebelumnya, file spasial dengan proyeksi lokal Indonesia seperti **TM-3° (Transverse Mercator 3 Degree BPN / ATR)** atau **UTM** yang disimpan dalam satuan meter (misal $X \approx 200.000$, $Y \approx 817.000$) sering kali tidak akurat atau meleset ke laut lepas karena mesin web peta (Leaflet) mengasumsikan koordinat sebagai derajat lintang/bujur.

Kini WebGIS telah dilengkapi dengan **Mesin Reproyeksi Koordinat Otomatis Berbasis Proj4js**:

### 1. 🇮🇩 Dukungan Seluruh Zonasi Indonesia TM-3° (BPN / Kementerian ATR)
- Terintegrasi penuh dengan seluruh zonasi TM-3° resmi dari Sabang sampai Merauke:
  - **Zona 46.2** (Aceh Barat - Central Meridian 94.5°E) [EPSG:23830]
  - **Zona 47.1** (Aceh Timur, Sumut Barat - MC 97.5°E) [EPSG:23831]
  - **Zona 47.2** (Sumut Timur, Riau Barat, Sumbar - MC 100.5°E) [EPSG:23832]
  - **Zona 48.1** (Riau Timur, Jambi, Sumsel Barat, Bengkulu - MC 103.5°E) [EPSG:23833]
  - **Zona 48.2** (DKI Jakarta, Banten, Jabar Barat, Lampung - MC 106.5°E) [EPSG:23834]
  - **Zona 49.1** (Jabar Timur, Jateng Barat, Kalbar - MC 109.5°E) [EPSG:23835]
  - **Zona 49.2** (Jateng Timur, DIY, Jatim Barat, Kalteng - MC 112.5°E) [EPSG:23836]
  - **Zona 50.1** (Jatim Timur, Madura, Bali, Kalsel - MC 115.5°E) [EPSG:23837]
  - **Zona 50.2** (Lombok, Sumbawa, Kaltim, Sulbar - MC 118.5°E) [EPSG:23838]
  - **Zona 51.1** (Flores Barat, Sumba, Sulsel, Sulteng - MC 121.5°E) [EPSG:23839]
  - **Zona 51.2** (Flores Timur, Timor Barat, Sultra, Sulut - MC 124.5°E) [EPSG:23840]
  - **Zona 52.1** (Maluku Utara, Halmahera Barat - MC 127.5°E) [EPSG:23841]
  - **Zona 52.2** (Halmahera Timur, Seram, Ambon - MC 130.5°E) [EPSG:23842]
  - **Zona 53.1** (Papua Barat Daya, Fakfak, Kaimana - MC 133.5°E) [EPSG:23843]
  - **Zona 53.2** (Papua Barat, Nabire, Mimika - MC 136.5°E) [EPSG:23844]
  - **Zona 54.1** (Papua Tengah, Jayapura Barat, Asmat - MC 139.5°E) [EPSG:23845]
  - **Zona 54.2** (Papua, Jayapura Timur, Merauke - MC 142.5°E) [EPSG:23846]

### 2. ⚡ Deteksi Koordinat Meter & File PRJ Otomatis
- **Inspeksi PRJ**: Saat mengunggah Shapefile `.zip`, sistem otomatis mengekstrak file `.prj` dan mengidentifikasi definisi proyeksi asli.
- **Deteksi Koordinat Meter**: Jika file tidak memiliki `.prj` (misal ekspor GeoJSON atau CAD), sistem otomatis memindai pasangan koordinat. Jika koordinat berada di luar rentang derajat ($|X| > 180$ atau $|Y| > 90$), banner informasi akan muncul secara cerdas dan memilih zona TM-3 yang paling sesuai.
- **Pemilih CRS Manual**: Pengguna juga dapat memilih atau mengganti zona TM-3 / UTM kapan saja dari dropdown sistem koordinat di modal upload.
- **Transformasi Presisi Tinggi**: Seluruh titik, garis, dan poligon (termasuk ring dalam poligon / lubang) direproyeksi secara rekursif ke WGS 84 (`EPSG:4326`) dengan ketelitian milimeter sebelum dirender di atas peta Leaflet.

---

## ✨ Fitur Upload Multi-Format & Preservasi Simbologi

### 1. 📁 Shapefile (.zip)
- Mendukung berkas Shapefile yang dikompresi dalam format `.zip` (berisi `.shp`, `.dbf`, `.shx`, dan `.prj`).
- Diproses langsung di sisi peramban (*client-side*) dengan pustaka `shpjs` dan `proj4js`.
- Seluruh kolom atribut dari `.dbf` otomatis masuk ke **Tabel Atribut Bawah**.

### 2. 📍 KML (.kml) & KMZ (.kmz)
- **Ekstraksi Simbologi Asli File**:
  - **Pin / Gambar Icon Khusus**: Membaca tag `<IconStyle><Icon><href>...</href></Icon></IconStyle>`. Jika berkas berupa KMZ yang menyimpan gambar pin di dalam arsip ZIP, gambar pin tersebut otomatis diekstrak menjadi URL *base64 data URI* sehingga pin gambar kustom Anda tampil persis seperti di Google Earth / QGIS!
  - **Warna Garis (*LineStyle*)**: Mengonversi format warna heksadesimal KML (*AABBGGRR*) menjadi warna RGB standar dan ketebalan garis (*lineWidth*).
  - **Isi Poligon (*PolyStyle*)**: Mengonversi warna isi (*fillColor*) dan tingkat transparansi (*opacity*).

### 3. 🌐 Layanan WMS (Web Map Service)
- Menghubungkan peta raster tematik dari server GIS seperti **GeoServer, QGIS Server, MapServer**, atau **ArcGIS Enterprise / ArcGIS Server**.
- **Simbologi Server**: Ditampilkan langsung sesuai *SLD (Styled Layer Descriptor)* dari server.
- **GetLegendGraphic Otomatis**: Menampilkan gambar legenda resmi dari server WMS langsung di bawah nama layer pada panel daftar layer.
- **Slider Opacity**: Pengaturan keburaman layer WMS (0–100%) secara *real-time*.
- Dilengkapi **Preset Cepat** untuk mencoba WMS publik global (GEBCO Bathymetry & GeoServer States Demo).

### 4. ⚡ Layanan WFS (Web Feature Service)
- Mengunduh data vektor spasial langsung dari server WFS (*GetFeature*).
- Fitur vektor yang diunduh otomatis terintegrasi dengan popup atribut, pencarian fitur, dan **Tabel Atribut Bawah**.

---

## ✨ Fitur Lengkap Lainnya

- **🗑️ Fitur Hapus Layer (*Delete Layer*)**: Hapus layer mana saja dengan tombol tong sampah dan dialog konfirmasi agar peta tidak menumpuk.
- **📑 Pengaturan Urutan Layer (*Z-Index Ordering*)**: Pindahkan layer ke atas (`⬆`) atau ke bawah (`⬇`) untuk mengatur tumpukan visual.
- **💾 Ekspor Data (Unduh GeoJSON)**: Unduh data layer apa saja ke komputer Anda dalam format `.geojson` dengan satu klik.
- **🗺️ Galeri Peta Dasar (*ArcGIS Basemap Gallery*)**: Tampilan kartu visual dengan *thumbnail* pratinjau (*OSM, Esri Satellite, Esri Topo, Carto Light, Carto Dark*).
- **🔖 Markah Spasial (*Spatial Bookmarks*)**: Navigasi cepat dengan animasi *fly-to* dan fitur simpan pandangan saat ini.
- **📏 Alat Pengukuran Spasial (*ArcGIS Measurement*)**: Pengukuran jarak lintasan geodesik, luas area poligon (m²/Ha/km²), dan koordinat titik.
- **📊 Panel Dock Tabel Atribut Bawah**: Tampilan tabular persis dock atribut ArcGIS/QGIS dengan layer switcher, pencarian data, zoom-ke-objek, dan layar penuh.
- **🧭 Kompas Mata Angin (*North Arrow Widget*)** & Sistem Notifikasi *Toast*.

---

## 🚀 Cara Menjalankan Aplikasi

Server lokal saat ini sudah aktif dan dapat diakses melalui:

```
http://localhost:8080
```

Atau jika ingin menjalankan ulang melalui terminal di folder proyek:
```bash
npm start
```
Atau cukup klik ganda (*double-click*) file **`index.html`** di browser apa pun.
