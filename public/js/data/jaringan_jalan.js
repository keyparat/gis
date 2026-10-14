// Layer Jaringan Jalan (LineString GeoJSON)
// Contoh data export QGIS untuk layer garis (vektor)
const dataJaringanJalan = {
  "type": "FeatureCollection",
  "name": "jaringan_jalan",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": 201,
        "nama_jalan": "Jl. M.H. Thamrin - Jend. Sudirman",
        "hierarki": "Arteri Primer",
        "lebar_m": 32,
        "kondisi": "Sangat Baik",
        "kecepatan_desain": 60
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [106.8227, -6.1755],
          [106.8236, -6.1873],
          [106.8228, -6.1950],
          [106.8220, -6.2085],
          [106.8214, -6.2200]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 202,
        "nama_jalan": "Jl. Medan Merdeka Barat - Timur",
        "hierarki": "Arteri Primer",
        "lebar_m": 28,
        "kondisi": "Sangat Baik",
        "kecepatan_desain": 50
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [106.8210, -6.1750],
          [106.8220, -6.1660],
          [106.8340, -6.1665],
          [106.8345, -6.1770]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 203,
        "nama_jalan": "Jl. Imam Bonjol - Diponegoro",
        "hierarki": "Kolektor Primer",
        "lebar_m": 18,
        "kondisi": "Baik",
        "kecepatan_desain": 40
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [106.8228, -6.1950],
          [106.8320, -6.1965],
          [106.8450, -6.1975],
          [106.8520, -6.1985]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 204,
        "nama_jalan": "Jl. Kebon Sirih",
        "hierarki": "Kolektor Primer",
        "lebar_m": 16,
        "kondisi": "Baik",
        "kecepatan_desain": 40
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [106.8140, -6.1830],
          [106.8236, -6.1835],
          [106.8350, -6.1838],
          [106.8430, -6.1840]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 205,
        "nama_jalan": "Jl. Cikini Raya",
        "hierarki": "Lokal Primer",
        "lebar_m": 12,
        "kondisi": "Cukup Baik",
        "kecepatan_desain": 30
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [106.8395, -6.1880],
          [106.8415, -6.1930],
          [106.8430, -6.1985]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 206,
        "nama_jalan": "Jl. Teuku Umar (Menteng)",
        "hierarki": "Lokal Primer",
        "lebar_m": 10,
        "kondisi": "Baik",
        "kecepatan_desain": 30
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [106.8300, -6.1935],
          [106.8315, -6.1980],
          [106.8330, -6.2030]
        ]
      }
    }
  ]
};
