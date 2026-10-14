// Layer Batas Administrasi Wilayah (Polygon GeoJSON)
// Contoh data hasil export dari QGIS (Layer: Batas Kecamatan / Kelurahan)
const dataBatasWilayah = {
  "type": "FeatureCollection",
  "name": "batas_administrasi",
  "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": 1,
        "nama_wilayah": "Gambir",
        "kab_kota": "Jakarta Pusat",
        "provinsi": "DKI Jakarta",
        "luas_ha": 759.5,
        "jumlah_penduduk": 95400,
        "kepadatan_jiwa_km2": 12560,
        "status_zona": "Pemerintahan & Cagar Budaya",
        "keterangan": "Pusat pemerintahan nasional dan monumen nasional"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [106.815, -6.165],
            [106.838, -6.165],
            [106.842, -6.185],
            [106.818, -6.188],
            [106.810, -6.176],
            [106.815, -6.165]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 2,
        "nama_wilayah": "Menteng",
        "kab_kota": "Jakarta Pusat",
        "provinsi": "DKI Jakarta",
        "luas_ha": 653.2,
        "jumlah_penduduk": 89200,
        "kepadatan_jiwa_km2": 13650,
        "status_zona": "Pemukiman Elit & Kedutaan",
        "keterangan": "Kawasan bersejarah berkonsep kota taman"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [106.818, -6.188],
            [106.842, -6.185],
            [106.848, -6.208],
            [106.825, -6.212],
            [106.816, -6.198],
            [106.818, -6.188]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 3,
        "nama_wilayah": "Senen",
        "kab_kota": "Jakarta Pusat",
        "provinsi": "DKI Jakarta",
        "luas_ha": 422.8,
        "jumlah_penduduk": 128400,
        "kepadatan_jiwa_km2": 30368,
        "status_zona": "Komersial & Transit",
        "keterangan": "Hub transportasi stasiun dan sentra perdagangan"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [106.838, -6.165],
            [106.858, -6.168],
            [106.859, -6.192],
            [106.842, -6.185],
            [106.838, -6.165]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 4,
        "nama_wilayah": "Tanah Abang",
        "kab_kota": "Jakarta Pusat",
        "provinsi": "DKI Jakarta",
        "luas_ha": 930.1,
        "jumlah_penduduk": 174000,
        "kepadatan_jiwa_km2": 18707,
        "status_zona": "Pusat Bisnis & Tekstil",
        "keterangan": "Sentra grosir tekstil terbesar dan CBD perkantoran"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [106.810, -6.176],
            [106.818, -6.188],
            [106.816, -6.198],
            [106.804, -6.215],
            [106.792, -6.196],
            [106.802, -6.178],
            [106.810, -6.176]
          ]
        ]
      }
    }
  ]
};
