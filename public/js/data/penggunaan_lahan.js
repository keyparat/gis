// Layer Penggunaan Lahan / Tutupan Lahan (Categorized Polygon GeoJSON)
// Contoh data export QGIS dengan simbologi kategoris
const dataPenggunaanLahan = {
  "type": "FeatureCollection",
  "name": "penggunaan_lahan",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": 101,
        "nama": "Taman Medan Merdeka (Monas)",
        "kategori": "Ruang Terbuka Hijau (RTH)",
        "luas_ha": 80.2,
        "pengelola": "Dinas Pertamanan dan Hutan Kota",
        "tahun_pendataan": 2024
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [106.822, -6.170],
            [106.833, -6.170],
            [106.833, -6.180],
            [106.822, -6.180],
            [106.822, -6.170]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 102,
        "nama": "Kawasan Perkantoran Medan Merdeka Barat",
        "kategori": "Pemerintahan & Pelayanan Publik",
        "luas_ha": 35.5,
        "pengelola": "Kementerian & Lembaga Negara",
        "tahun_pendataan": 2024
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [106.817, -6.171],
            [106.822, -6.171],
            [106.822, -6.181],
            [106.817, -6.181],
            [106.817, -6.171]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 103,
        "nama": "Taman Suropati & Sekitarnya",
        "kategori": "Ruang Terbuka Hijau (RTH)",
        "luas_ha": 18.4,
        "pengelola": "Pemprov DKI",
        "tahun_pendataan": 2024
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [106.830, -6.197],
            [106.836, -6.197],
            [106.836, -6.202],
            [106.830, -6.202],
            [106.830, -6.197]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 104,
        "nama": "Kawasan Bisnis & Perdagangan Tanah Abang",
        "kategori": "Perdagangan & Jasa",
        "luas_ha": 65.0,
        "pengelola": "PD Pasar Jaya / Swasta",
        "tahun_pendataan": 2024
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [106.811, -6.183],
            [106.818, -6.183],
            [106.818, -6.192],
            [106.811, -6.192],
            [106.811, -6.183]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 105,
        "nama": "Kawasan Perumahan Menteng",
        "kategori": "Permukiman",
        "luas_ha": 120.3,
        "pengelola": "Warga & Pemda",
        "tahun_pendataan": 2024
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [106.820, -6.193],
            [106.829, -6.193],
            [106.829, -6.206],
            [106.820, -6.206],
            [106.820, -6.193]
          ]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 106,
        "nama": "Waduk Melati",
        "kategori": "Badan Air / Danau",
        "luas_ha": 5.2,
        "pengelola": "Dinas SDA",
        "tahun_pendataan": 2024
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [106.817, -6.197],
            [106.821, -6.197],
            [106.821, -6.202],
            [106.817, -6.202],
            [106.817, -6.197]
          ]
        ]
      }
    }
  ]
};
