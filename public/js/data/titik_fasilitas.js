// Layer Titik Fasilitas & POI (Point GeoJSON)
// Contoh data export QGIS untuk layer titik (fasilitas publik)
const dataTitikFasilitas = {
  "type": "FeatureCollection",
  "name": "titik_fasilitas",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": 301,
        "nama": "Monumen Nasional (Monas)",
        "kategori": "Pariwisata & Budaya",
        "icon": "fa-landmark",
        "color": "#e67e22",
        "alamat": "Gambir, Kecamatan Gambir, Jakarta Pusat",
        "telepon": "(021) 3504333",
        "jam_buka": "08:00 - 16:00 WIB"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [106.8272, -6.1754]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 302,
        "nama": "RSUP Nasional Dr. Cipto Mangunkusumo (RSCM)",
        "kategori": "Kesehatan",
        "icon": "fa-hospital",
        "color": "#e74c3c",
        "alamat": "Jl. Pangeran Diponegoro No.71, Kenari, Senen",
        "telepon": "1500135",
        "jam_buka": "24 Jam (UGD)"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [106.8480, -6.1970]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 303,
        "nama": "RSPAD Gatot Soebroto",
        "kategori": "Kesehatan",
        "icon": "fa-hospital",
        "color": "#e74c3c",
        "alamat": "Jl. Abdul Rahman Saleh No.24, Senen",
        "telepon": "(021) 3441008",
        "jam_buka": "24 Jam (UGD)"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [106.8375, -6.1770]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 304,
        "nama": "Stasiun Gambir",
        "kategori": "Transportasi",
        "icon": "fa-train",
        "color": "#2980b9",
        "alamat": "Jl. Medan Merdeka Timur No.1, Gambir",
        "telepon": "121",
        "jam_buka": "04:00 - 23:00 WIB"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [106.8306, -6.1767]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 305,
        "nama": "Stasiun MRT Bundaran HI",
        "kategori": "Transportasi",
        "icon": "fa-subway",
        "color": "#2980b9",
        "alamat": "Jl. M.H. Thamrin, Gondangdia, Menteng",
        "telepon": "(021) 3906424",
        "jam_buka": "05:00 - 24:00 WIB"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [106.8233, -6.1932]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 306,
        "nama": "Masjid Istiqlal",
        "kategori": "Ibadah",
        "icon": "fa-mosque",
        "color": "#27ae60",
        "alamat": "Jl. Taman Wijaya Kusuma, Ps. Baru, Sawah Besar",
        "telepon": "(021) 3811708",
        "jam_buka": "04:00 - 21:00 WIB"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [106.8315, -6.1702]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 307,
        "nama": "Gereja Katedral Jakarta",
        "kategori": "Ibadah",
        "icon": "fa-church",
        "color": "#8e44ad",
        "alamat": "Jl. Katedral No.7B, Ps. Baru, Sawah Besar",
        "telepon": "(021) 3519186",
        "jam_buka": "06:00 - 20:00 WIB"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [106.8331, -6.1692]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 308,
        "nama": "Universitas Indonesia (Kampus Salemba)",
        "kategori": "Pendidikan",
        "icon": "fa-graduation-cap",
        "color": "#f39c12",
        "alamat": "Jl. Salemba Raya No.4, Kenari, Senen",
        "telepon": "(021) 31930373",
        "jam_buka": "07:30 - 18:00 WIB"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [106.8505, -6.1950]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": 309,
        "nama": "Pasar Tanah Abang (Blok A & B)",
        "kategori": "Perdagangan",
        "icon": "fa-shopping-bag",
        "color": "#d35400",
        "alamat": "Jl. Fachrudin No.1, Kp. Bali, Tanah Abang",
        "telepon": "(021) 3140505",
        "jam_buka": "07:00 - 16:00 WIB"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [106.8155, -6.1865]
      }
    }
  ]
};
