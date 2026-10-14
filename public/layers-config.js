/**
 * Konfigurasi Layer Web GIS (Sesuai Standar ArcGIS & QGIS Layer Management)
 * Dilengkapi dengan Peta Dasar (Basemaps), Markah Spasial (Bookmarks), dan Layer Tematik.
 */

const GIS_CONFIG = {
  map: {
    initialCenter: [-6.1850, 106.8290],
    initialZoom: 14,
    minZoom: 5,
    maxZoom: 19
  },
  
  // Markah Spasial (Spatial Bookmarks ala ArcGIS)
  bookmarks: [
    {
      id: "monas",
      name: "Kawasan Monas (Pusat Kota)",
      description: "Monumen Nasional dan pusat administrasi pemerintahan",
      center: [-6.1754, 106.8272],
      zoom: 16
    },
    {
      id: "menteng",
      name: "Kawasan Menteng",
      description: "Zona perumahan cagar budaya dan kedutaan besar",
      center: [-6.1980, 106.8320],
      zoom: 15
    },
    {
      id: "senen",
      name: "Kawasan Senen & Salemba",
      description: "Pusat transit stasiun, rumah sakit rujukan RSCM dan kampus",
      center: [-6.1880, 106.8480],
      zoom: 15
    },
    {
      id: "tanah_abang",
      name: "Sentra Bisnis Tanah Abang",
      description: "Pusat perdagangan tekstil terbesar dan stasiun transit",
      center: [-6.1880, 106.8150],
      zoom: 15
    },
    {
      id: "thamrin",
      name: "Koridor Thamrin - Sudirman",
      description: "Pusat kawasan perkantoran modern dan jalur MRT",
      center: [-6.1950, 106.8230],
      zoom: 15
    }
  ],

  // Galeri Peta Dasar (Basemaps Gallery dengan Preview ala ArcGIS)
  basemaps: [
    {
      id: "osm",
      name: "OpenStreetMap Standard",
      description: "Peta jalan terbuka global dengan label jalan detail",
      thumbnail: "https://tile.openstreetmap.org/13/6525/4134.png",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors",
      active: true
    },
    {
      id: "satellite",
      name: "Esri World Imagery (Satelit)",
      description: "Citra satelit resolusi tinggi komprehensif dari Esri",
      thumbnail: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/8/12",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, USDA, USGS",
      active: false
    },
    {
      id: "topo",
      name: "Esri Topographic",
      description: "Peta kontur elevasi, pegunungan dan batas geografis",
      thumbnail: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/4/8/12",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; USGS, NOAA, DeLorme, NAVTEQ",
      active: false
    },
    {
      id: "carto_light",
      name: "CartoDB Positron (Terang)",
      description: "Peta monokromatik abu-abu terang sangat cocok untuk overlay data",
      thumbnail: "https://a.basemaps.cartocdn.com/light_all/4/12/8.png",
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      active: false
    },
    {
      id: "carto_dark",
      name: "CartoDB Dark Matter (Mode Gelap)",
      description: "Peta kontras tinggi berlatar gelap yang futuristik dan elegan",
      thumbnail: "https://a.basemaps.cartocdn.com/dark_all/4/12/8.png",
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      active: false
    }
  ],

  // Layer Tematik (Vector Layers dari QGIS/ArcGIS)
  layers: [
    {
      id: "batas_wilayah",
      name: "Batas Wilayah Administrasi",
      group: "Administrasi & Batas",
      type: "polygon",
      visible: true,
      opacity: 0.5,
      zIndex: 10,
      dataSource: dataBatasWilayah,
      style: {
        fillColor: "#3498db",
        weight: 2,
        opacity: 1,
        color: "#2980b9",
        dashArray: "4, 4",
        fillOpacity: 0.3
      },
      legend: {
        type: "single",
        color: "#3498db",
        borderColor: "#2980b9",
        label: "Batas Administrasi Kecamatan"
      },
      popupFields: [
        { key: "nama_wilayah", label: "Nama Wilayah" },
        { key: "kab_kota", label: "Kota / Kabupaten" },
        { key: "provinsi", label: "Provinsi" },
        { key: "luas_ha", label: "Luas (Hektar)", suffix: " Ha" },
        { key: "jumlah_penduduk", label: "Populasi", suffix: " Jiwa" },
        { key: "kepadatan_jiwa_km2", label: "Kepadatan", suffix: " Jiwa/Km²" },
        { key: "status_zona", label: "Karakteristik Zona" },
        { key: "keterangan", label: "Catatan" }
      ]
    },
    {
      id: "penggunaan_lahan",
      name: "Penggunaan Lahan (Land Use)",
      group: "Tata Ruang & Lingkungan",
      type: "polygon_categorized",
      visible: true,
      opacity: 0.65,
      zIndex: 15,
      dataSource: dataPenggunaanLahan,
      categoryField: "kategori",
      categories: {
        "Ruang Terbuka Hijau (RTH)": {
          fillColor: "#2ecc71",
          color: "#27ae60",
          weight: 1.5,
          fillOpacity: 0.6,
          label: "Ruang Terbuka Hijau (RTH)"
        },
        "Pemerintahan & Pelayanan Publik": {
          fillColor: "#9b59b6",
          color: "#8e44ad",
          weight: 1.5,
          fillOpacity: 0.6,
          label: "Pemerintahan & Fasilitas Publik"
        },
        "Perdagangan & Jasa": {
          fillColor: "#e67e22",
          color: "#d35400",
          weight: 1.5,
          fillOpacity: 0.6,
          label: "Perdagangan & Jasa (Komersial)"
        },
        "Permukiman": {
          fillColor: "#f1c40f",
          color: "#f39c12",
          weight: 1.5,
          fillOpacity: 0.6,
          label: "Kawasan Permukiman"
        },
        "Badan Air / Danau": {
          fillColor: "#3498db",
          color: "#2980b9",
          weight: 1.5,
          fillOpacity: 0.7,
          label: "Badan Air / Waduk"
        }
      },
      popupFields: [
        { key: "nama", label: "Nama Area" },
        { key: "kategori", label: "Kategori Tutupan Lahan" },
        { key: "luas_ha", label: "Luas (Ha)", suffix: " Ha" },
        { key: "pengelola", label: "Pengelola" },
        { key: "tahun_pendataan", label: "Tahun Update" }
      ]
    },
    {
      id: "jaringan_jalan",
      name: "Jaringan Jalan",
      group: "Infrastruktur & Transportasi",
      type: "line_categorized",
      visible: true,
      opacity: 1.0,
      zIndex: 25,
      dataSource: dataJaringanJalan,
      categoryField: "hierarki",
      categories: {
        "Arteri Primer": {
          color: "#c0392b",
          weight: 5,
          opacity: 0.9,
          label: "Jalan Arteri Primer"
        },
        "Kolektor Primer": {
          color: "#e67e22",
          weight: 3.5,
          opacity: 0.9,
          label: "Jalan Kolektor Primer"
        },
        "Lokal Primer": {
          color: "#f39c12",
          weight: 2.2,
          opacity: 0.8,
          label: "Jalan Lokal Primer"
        }
      },
      popupFields: [
        { key: "nama_jalan", label: "Nama Ruas Jalan" },
        { key: "hierarki", label: "Hierarki Jalan" },
        { key: "lebar_m", label: "Lebar Jalan", suffix: " meter" },
        { key: "kondisi", label: "Kondisi Permukaan" },
        { key: "kecepatan_desain", label: "Kec. Rencana", suffix: " km/jam" }
      ]
    },
    {
      id: "titik_fasilitas",
      name: "Fasilitas & Titik Penting (POI)",
      group: "Fasilitas Publik",
      type: "point",
      visible: true,
      opacity: 1.0,
      zIndex: 35,
      dataSource: dataTitikFasilitas,
      legend: {
        type: "categories",
        items: [
          { label: "Pariwisata & Budaya", color: "#e67e22", icon: "fa-landmark" },
          { label: "Kesehatan", color: "#e74c3c", icon: "fa-hospital" },
          { label: "Transportasi", color: "#2980b9", icon: "fa-subway" },
          { label: "Tempat Ibadah", color: "#27ae60", icon: "fa-mosque" },
          { label: "Pendidikan", color: "#f39c12", icon: "fa-graduation-cap" },
          { label: "Perdagangan", color: "#d35400", icon: "fa-shopping-bag" }
        ]
      },
      popupFields: [
        { key: "nama", label: "Nama Fasilitas" },
        { key: "kategori", label: "Kategori" },
        { key: "alamat", label: "Alamat Lengkap" },
        { key: "telepon", label: "Kontak" },
        { key: "jam_buka", label: "Jam Operasional" }
      ]
    }
  ]
};
