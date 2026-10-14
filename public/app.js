/**
 * WebGIS Enterprise Studio - Core Application Engine
 * Terintegrasi penuh dengan standar ArcGIS & QGIS (Layer Management, Basemaps, Bookmarks, Measurement, Attribute Dock)
 * Mendukung Upload: SHP (.zip), KML (.kml), KMZ (.kmz), GeoJSON (.geojson), WMS, dan WFS.
 */

// Helper: Konversi warna KML (AABBGGRR) ke CSS Hex & Opacity
function kmlColorToHex(kmlColor) {
  if (!kmlColor || kmlColor.length < 6) return { hex: '#0079c1', opacity: 1 };
  const str = kmlColor.trim().padStart(8, 'f');
  const aHex = str.substring(0, 2);
  const bHex = str.substring(2, 4);
  const gHex = str.substring(4, 6);
  const rHex = str.substring(6, 8);
  const opacity = parseFloat((parseInt(aHex, 16) / 255).toFixed(2));
  return {
    hex: `#${rHex}${gHex}${bHex}`,
    opacity: isNaN(opacity) ? 1 : opacity
  };
}

// Helper: Ekstraksi Style & KML Placemarks (termasuk Icon/Pin gambar dan warna)
function parseKmlWithStyles(kmlText, kmzImages = {}) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlText, "text/xml");

  const styleMap = {};
  const styles = xmlDoc.getElementsByTagName("Style");
  for (let i = 0; i < styles.length; i++) {
    const s = styles[i];
    const id = s.getAttribute("id");
    if (!id) continue;

    const styleData = {};

    // IconStyle (Pin / Point Marker)
    const iconStyle = s.getElementsByTagName("IconStyle")[0];
    if (iconStyle) {
      const colorTag = iconStyle.getElementsByTagName("color")[0];
      if (colorTag) {
        styleData.iconColor = kmlColorToHex(colorTag.textContent).hex;
      }
      const iconTag = iconStyle.getElementsByTagName("Icon")[0];
      if (iconTag) {
        const hrefTag = iconTag.getElementsByTagName("href")[0];
        if (hrefTag) {
          let href = hrefTag.textContent.trim();
          if (kmzImages[href]) {
            styleData.iconUrl = kmzImages[href];
          } else if (kmzImages[href.replace(/^files\//, '')]) {
            styleData.iconUrl = kmzImages[href.replace(/^files\//, '')];
          } else if (href.startsWith('http') || href.startsWith('data:')) {
            styleData.iconUrl = href;
          }
        }
      }
    }

    // LineStyle
    const lineStyle = s.getElementsByTagName("LineStyle")[0];
    if (lineStyle) {
      const colorTag = lineStyle.getElementsByTagName("color")[0];
      if (colorTag) {
        const c = kmlColorToHex(colorTag.textContent);
        styleData.lineColor = c.hex;
        styleData.lineOpacity = c.opacity;
      }
      const widthTag = lineStyle.getElementsByTagName("width")[0];
      if (widthTag) {
        styleData.lineWidth = parseFloat(widthTag.textContent) || 2;
      }
    }

    // PolyStyle
    const polyStyle = s.getElementsByTagName("PolyStyle")[0];
    if (polyStyle) {
      const colorTag = polyStyle.getElementsByTagName("color")[0];
      if (colorTag) {
        const c = kmlColorToHex(colorTag.textContent);
        styleData.fillColor = c.hex;
        styleData.fillOpacity = c.opacity || 0.45;
      }
      const fillTag = polyStyle.getElementsByTagName("fill")[0];
      if (fillTag && fillTag.textContent.trim() === "0") {
        styleData.fill = false;
      }
    }

    styleMap[id] = styleData;
  }

  // Pemetaan StyleMap
  const styleMaps = xmlDoc.getElementsByTagName("StyleMap");
  for (let i = 0; i < styleMaps.length; i++) {
    const sm = styleMaps[i];
    const smId = sm.getAttribute("id");
    if (!smId) continue;
    const pairs = sm.getElementsByTagName("Pair");
    for (let j = 0; j < pairs.length; j++) {
      const key = pairs[j].getElementsByTagName("key")[0]?.textContent;
      if (key === "normal") {
        const targetUrl = pairs[j].getElementsByTagName("styleUrl")[0]?.textContent?.replace(/^#/, '');
        if (targetUrl && styleMap[targetUrl]) {
          styleMap[smId] = styleMap[targetUrl];
        }
      }
    }
  }

  // Konversi ke GeoJSON via toGeoJSON
  let geojson = { type: "FeatureCollection", features: [] };
  if (window.toGeoJSON && window.toGeoJSON.kml) {
    geojson = window.toGeoJSON.kml(xmlDoc);
  }

  // Pasang style ke masing-masing fitur
  const placemarks = xmlDoc.getElementsByTagName("Placemark");
  if (geojson && geojson.features) {
    for (let i = 0; i < geojson.features.length; i++) {
      const feat = geojson.features[i];
      let styleUrl = feat.properties?.styleUrl?.replace(/^#/, '');
      if (styleUrl && styleMap[styleUrl]) {
        feat.properties.__kmlStyle = styleMap[styleUrl];
      } else if (i < placemarks.length) {
        const p = placemarks[i];
        const sUrl = p.getElementsByTagName("styleUrl")[0]?.textContent?.replace(/^#/, '');
        if (sUrl && styleMap[sUrl]) {
          feat.properties.__kmlStyle = styleMap[sUrl];
        }
      }
    }
  }

  return geojson;
}

// ============================================================================
// SISTEM KOORDINAT & PROYEKSI (TM-3° BPN / ATR, UTM WGS 84, WEB MERCATOR)
// ============================================================================

const TM3_CONFIGS = [
  { key: 'TM3_46.2', epsg: 'EPSG:23830', lon0: 94.5, name: 'TM-3 Zona 46.2 (Aceh Barat)' },
  { key: 'TM3_47.1', epsg: 'EPSG:23831', lon0: 97.5, name: 'TM-3 Zona 47.1 (Aceh Timur, Sumut Barat)' },
  { key: 'TM3_47.2', epsg: 'EPSG:23832', lon0: 100.5, name: 'TM-3 Zona 47.2 (Sumut Timur, Riau Barat, Sumbar)' },
  { key: 'TM3_48.1', epsg: 'EPSG:23833', lon0: 103.5, name: 'TM-3 Zona 48.1 (Riau Timur, Jambi, Sumsel Barat, Bengkulu)' },
  { key: 'TM3_48.2', epsg: 'EPSG:23834', lon0: 106.5, name: 'TM-3 Zona 48.2 (DKI Jakarta, Banten, Jabar Barat, Lampung)' },
  { key: 'TM3_49.1', epsg: 'EPSG:23835', lon0: 109.5, name: 'TM-3 Zona 49.1 (Jabar Timur, Jateng Barat, Kalbar)' },
  { key: 'TM3_49.2', epsg: 'EPSG:23836', lon0: 112.5, name: 'TM-3 Zona 49.2 (Jateng Timur, DIY, Jatim Barat, Kalteng)' },
  { key: 'TM3_50.1', epsg: 'EPSG:23837', lon0: 115.5, name: 'TM-3 Zona 50.1 (Jatim Timur, Madura, Bali, Kalsel)' },
  { key: 'TM3_50.2', epsg: 'EPSG:23838', lon0: 118.5, name: 'TM-3 Zona 50.2 (Lombok, Sumbawa, Kaltim, Sulbar)' },
  { key: 'TM3_51.1', epsg: 'EPSG:23839', lon0: 121.5, name: 'TM-3 Zona 51.1 (Flores Barat, Sumba, Sulsel, Sulteng)' },
  { key: 'TM3_51.2', epsg: 'EPSG:23840', lon0: 124.5, name: 'TM-3 Zona 51.2 (Flores Timur, Timor Barat, Sultra, Sulut)' },
  { key: 'TM3_52.1', epsg: 'EPSG:23841', lon0: 127.5, name: 'TM-3 Zona 52.1 (Maluku Utara, Halmahera Barat)' },
  { key: 'TM3_52.2', epsg: 'EPSG:23842', lon0: 130.5, name: 'TM-3 Zona 52.2 (Halmahera Timur, Seram, Ambon)' },
  { key: 'TM3_53.1', epsg: 'EPSG:23843', lon0: 133.5, name: 'TM-3 Zona 53.1 (Papua Barat Daya, Fakfak, Kaimana)' },
  { key: 'TM3_53.2', epsg: 'EPSG:23844', lon0: 136.5, name: 'TM-3 Zona 53.2 (Papua Barat, Nabire, Mimika)' },
  { key: 'TM3_54.1', epsg: 'EPSG:23845', lon0: 139.5, name: 'TM-3 Zona 54.1 (Papua Tengah, Jayapura Barat, Asmat)' },
  { key: 'TM3_54.2', epsg: 'EPSG:23846', lon0: 142.5, name: 'TM-3 Zona 54.2 (Papua, Jayapura Timur, Merauke)' }
];

let _proj4Initialized = false;
function initProj4Definitions() {
  if (typeof window === 'undefined' || !window.proj4) {
    return;
  }
  if (_proj4Initialized) return;

  // 1. Daftarkan seluruh zona TM-3° Indonesia (BPN / ATR)
  TM3_CONFIGS.forEach(conf => {
    const projStr = `+proj=tmerc +lat_0=0 +lon_0=${conf.lon0} +k=0.9999 +x_0=200000 +y_0=1500000 +ellps=WGS84 +units=m +no_defs`;
    window.proj4.defs(conf.key, projStr);
    window.proj4.defs(conf.epsg, projStr);
    window.proj4.defs(`DGN95_Indonesia_TM-3_zone_${conf.key.replace('TM3_', '')}`, projStr);
    window.proj4.defs(`DGN95 / Indonesia TM-3 zone ${conf.key.replace('TM3_', '')}`, projStr);
  });

  // 2. Daftarkan zona UTM WGS 84 Selatan (EPSG:32746 s/d 32754)
  for (let z = 46; z <= 54; z++) {
    const utmSStr = `+proj=utm +zone=${z} +south +datum=WGS84 +units=m +no_defs`;
    window.proj4.defs(`UTM_${z}S`, utmSStr);
    window.proj4.defs(`EPSG:${32700 + z}`, utmSStr);
    window.proj4.defs(`WGS_1984_UTM_Zone_${z}S`, utmSStr);
  }

  // 3. Daftarkan zona UTM WGS 84 Utara (EPSG:32646 s/d 32652)
  for (let z = 46; z <= 52; z++) {
    const utmNStr = `+proj=utm +zone=${z} +datum=WGS84 +units=m +no_defs`;
    window.proj4.defs(`UTM_${z}N`, utmNStr);
    window.proj4.defs(`EPSG:${32600 + z}`, utmNStr);
    window.proj4.defs(`WGS_1984_UTM_Zone_${z}N`, utmNStr);
  }

  // 4. Daftarkan Web Mercator & WGS 84
  window.proj4.defs('EPSG:3857', '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs');
  window.proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');

  _proj4Initialized = true;
}

// Inisialisasi awal
if (typeof window !== 'undefined' && window.proj4) {
  initProj4Definitions();
} else if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initProj4Definitions);
}

// Helper: Cari pasangan koordinat pertama untuk pemeriksaan format/satuan
function getFirstCoordinatePair(geojson) {
  if (!geojson) return null;
  const findPair = (coords) => {
    if (!Array.isArray(coords) || coords.length === 0) return null;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return [coords[0], coords[1]];
    }
    for (const item of coords) {
      const res = findPair(item);
      if (res) return res;
    }
    return null;
  };

  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    for (const f of geojson.features) {
      if (f && f.geometry && f.geometry.coordinates) {
        const p = findPair(f.geometry.coordinates);
        if (p) return p;
      }
    }
  } else if (geojson.type === 'Feature' && geojson.geometry && geojson.geometry.coordinates) {
    return findPair(geojson.geometry.coordinates);
  } else if (geojson.coordinates) {
    return findPair(geojson.coordinates);
  }
  return null;
}

// Helper: Deteksi apakah koordinat data dalam satuan Meter (TM-3, UTM, Web Mercator) atau Derajat (WGS84)
function detectCoordinatesInMeters(geojson) {
  const pair = getFirstCoordinatePair(geojson);
  if (!pair) return false;
  const x = Math.abs(pair[0]);
  const y = Math.abs(pair[1]);
  // Derajat WGS84: bujur [-180, 180], lintang [-90, 90]
  // Jika x > 180 atau y > 90, maka dipastikan koordinat proyeksi meter!
  return (x > 180 || y > 90);
}

// Helper: Ekstraksi CRS dari string teks file .PRJ (Shapefile)
function parsePrjForCrs(prjText) {
  if (!prjText || typeof prjText !== 'string') return null;
  const upper = prjText.toUpperCase();

  // 1. Cek explicit TM-3 zone nama (berbagai pola penamaan)
  for (const conf of TM3_CONFIGS) {
    const zoneNum = conf.key.replace('TM3_', ''); // contoh "48.2"
    const zoneUnderscore = zoneNum.replace('.', '_'); // "48_2"
    if (upper.includes(`TM-3_ZONE_${zoneNum}`) || upper.includes(`TM-3 ZONE ${zoneNum}`) ||
        upper.includes(`TM3_ZONE_${zoneNum}`) || upper.includes(`TM3 ${zoneNum}`) ||
        upper.includes(`TM_3_ZONE_${zoneNum}`) || upper.includes(`TM-3_ZONE_${zoneUnderscore}`) ||
        upper.includes(`TM_3_ZONE_${zoneUnderscore}`) || upper.includes(`TM3_${zoneNum}`) ||
        upper.includes(`ZONE_${zoneNum}`) || upper.includes(`ZONE ${zoneNum}`) ||
        upper.includes(`ZONE_${zoneUnderscore}`)) {
      return conf.key;
    }
  }

  // 2. Cek central meridian di PRJ (FIX: regex baru yang menangani format WKT dengan tanda kutip)
  //    Format WKT: PARAMETER["Central_Meridian",106.5]
  //    Regex lama gagal karena [\s,:] tidak termasuk karakter " dan ]
  const cmMatch = upper.match(/CENTRAL_MERIDIAN[^0-9]*([0-9]+\.?[0-9]*)/i) ||
                  upper.match(/LONGITUDE_OF_CENTER[^0-9]*([0-9]+\.?[0-9]*)/i) ||
                  upper.match(/LONGITUDE_OF_ORIGIN[^0-9]*([0-9]+\.?[0-9]*)/i);
  if (cmMatch && cmMatch[1]) {
    const cm = parseFloat(cmMatch[1]);
    // Periksa apakah CM cocok dengan zona TM-3 (toleransi 0.5°)
    const found = TM3_CONFIGS.find(c => Math.abs(c.lon0 - cm) < 0.5);
    if (found) {
      // Verifikasi bahwa ini memang TM-3 (bukan UTM) dengan cek scale factor dan false easting
      const hasTM3Scale = upper.includes('0.9999');
      const hasUTMScale = upper.includes('0.9996');
      const hasFE200k = upper.match(/FALSE_EASTING[^0-9]*200000/i);
      const hasFE500k = upper.match(/FALSE_EASTING[^0-9]*500000/i);
      if (hasTM3Scale || hasFE200k || (!hasUTMScale && !hasFE500k)) {
        return found.key;
      }
    }
    // Cek juga UTM berdasarkan CM (setiap 6 derajat, mulai dari 93, 99, 105, dst.)
    if (cm >= 90 && cm <= 144) {
      const utmZone = Math.floor((cm + 180) / 6) + 1;
      if (utmZone >= 46 && utmZone <= 54) {
        const hasUTMScale = upper.includes('0.9996');
        const hasFE500k = upper.match(/FALSE_EASTING[^0-9]*500000/i);
        const hasFN10M = upper.match(/FALSE_NORTHING[^0-9]*10000000/i);
        if (hasUTMScale || hasFE500k) {
          const hemi = hasFN10M ? 'S' : 'N';
          return `UTM_${utmZone}${hemi}`;
        }
      }
    }
  }

  // 3. Cek UTM Zone dari nama proyeksi
  const utmMatch = upper.match(/UTM[\s_]*ZONE[\s_]*([0-9]{1,2})[\s_]*([SN])/i) ||
                   upper.match(/WGS[\s_]*1984[\s_]*UTM[\s_]*ZONE[\s_]*([0-9]{1,2})[\s_]*([SN])/i);
  if (utmMatch) {
    return `UTM_${utmMatch[1]}${utmMatch[2].toUpperCase()}`;
  }

  // 4. Cek Web Mercator
  if (upper.includes('3857') || upper.includes('PSEUDO_MERCATOR') ||
      upper.includes('MERCATOR_1SP') || upper.includes('POPULAR VISUALISATION')) {
    return 'EPSG:3857';
  }

  return null;
}

// Helper: Rekomendasi zona proyeksi terbaik berdasarkan rentang koordinat
function suggestBestCrs(geojson) {
  const pair = getFirstCoordinatePair(geojson);
  if (!pair) return null; // Tidak bisa menentukan - biarkan user pilih
  const x = pair[0];
  const y = pair[1];
  const absX = Math.abs(x);
  const absY = Math.abs(y);

  // Web Mercator: X dan Y keduanya jutaan meter
  if (absX > 5000000 && absY > 300000) {
    return 'EPSG:3857';
  }

  // UTM Selatan: Y ≈ 8.800.000 - 10.100.000, X ≈ 100.000 - 900.000
  if (y > 5000000 && y < 11000000 && absX > 50000 && absX < 1000000) {
    // Coba tebak zona UTM dari jangkauan X
    return 'UTM_48S'; // Default, user harus verifikasi
  }

  // UTM Utara: Y ≈ 0 - 1.000.000, X ≈ 100.000 - 900.000
  if (y >= 0 && y < 1000000 && absX > 100000 && absX < 1000000) {
    // Bisa TM-3 atau UTM Utara. Cek False Easting pattern
    // TM-3: FE = 200.000 → X ≈ 33.000 - 367.000
    // UTM:  FE = 500.000 → X ≈ 166.000 - 834.000
    if (absX > 350000) {
      return 'UTM_48N'; // X terlalu besar untuk TM-3
    }
  }

  // TM-3: X ≈ 33.000 - 367.000, Y ≈ 200.000 - 2.200.000 (FN=1.500.000, latitude ≈ -11° s/d +6°)
  if (absX > 30000 && absX < 400000 && absY > 100000 && absY < 2500000) {
    return null; // TM-3 terdeteksi tapi ZONA TIDAK BISA DITENTUKAN tanpa .prj. User HARUS pilih.
  }

  return null;
}

// Helper: Reproyeksi rekursif GeoJSON dari format Proyeksi (TM-3, UTM, dsb) ke WGS84
function reprojectCoordinatePair(coord, fromProj, toProj) {
  if (!Array.isArray(coord) || coord.length < 2) return coord;
  const x = coord[0];
  const y = coord[1];
  if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
    return coord;
  }
  try {
    const res = window.proj4(fromProj, toProj, [x, y]);
    if (coord.length > 2) {
      return [res[0], res[1], coord[2]];
    }
    return [res[0], res[1]];
  } catch (err) {
    console.warn(`Reprojection error [${fromProj} -> ${toProj}] for [${x}, ${y}]:`, err);
    return coord;
  }
}

function transformCoordsRecursive(coords, fromProj, toProj) {
  if (!Array.isArray(coords)) return coords;
  if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return reprojectCoordinatePair(coords, fromProj, toProj);
  }
  return coords.map(c => transformCoordsRecursive(c, fromProj, toProj));
}

function reprojectGeometry(geometry, fromProj, toProj) {
  if (!geometry) return geometry;
  if (geometry.type === 'GeometryCollection' && Array.isArray(geometry.geometries)) {
    return {
      ...geometry,
      geometries: geometry.geometries.map(g => reprojectGeometry(g, fromProj, toProj))
    };
  }
  if (!geometry.coordinates) return geometry;
  return {
    ...geometry,
    coordinates: transformCoordsRecursive(geometry.coordinates, fromProj, toProj)
  };
}

function reprojectGeoJSON(geojson, fromProj, toProj = 'EPSG:4326') {
  if (typeof window === 'undefined' || !window.proj4) {
    console.error('Pustaka proj4 belum siap.');
    return geojson;
  }
  if (!fromProj || fromProj === 'AUTO' || fromProj === toProj) {
    return geojson;
  }

  initProj4Definitions();

  const clone = JSON.parse(JSON.stringify(geojson));
  if (clone.type === 'FeatureCollection' && Array.isArray(clone.features)) {
    clone.features = clone.features.map(f => {
      if (f && f.geometry) {
        f.geometry = reprojectGeometry(f.geometry, fromProj, toProj);
      }
      return f;
    });
  } else if (clone.type === 'Feature' && clone.geometry) {
    clone.geometry = reprojectGeometry(clone.geometry, fromProj, toProj);
  } else if (clone.coordinates) {
    return reprojectGeometry(clone, fromProj, toProj);
  }
  return clone;
}

class WebGISApp {
  constructor() {
    this.map = null;
    this.baseLayers = {};
    this.currentBaseLayer = null;
    this.vectorLayers = {};       // Instance L.GeoJSON atau L.TileLayer.WMS
    this.layerMetadata = {};      // Metadata & DataSource layer
    this.activeAttributeLayer = null;
    this.pendingDeleteLayerId = null;

    // Mode Pengukuran Spasial
    this.measureMode = 'distance';
    this.measureActive = false;
    this.measurePoints = [];
    this.measureLayer = null;

    this.allSearchableFeatures = [];

    this.init();
  }

  init() {
    this.initMap();
    this.initBasemaps();
    this.initVectorLayers();
    this.renderLayerTree();
    this.renderBasemapGallery();
    this.renderBookmarks();
    this.initAttributeDock();
    this.initEventListeners();
    this.initMeasurement();
    this.initSearch();
    this.updateStatsOverview();
  }

  /**
   * 1. Inisialisasi Peta Leaflet
   */
  initMap() {
    const { initialCenter, initialZoom, minZoom, maxZoom } = GIS_CONFIG.map;
    
    this.map = L.map('map', {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: minZoom,
      maxZoom: maxZoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    L.control.scale({
      metric: true,
      imperial: false,
      position: 'bottomleft'
    }).addTo(this.map);

    this.map.on('mousemove', (e) => {
      const lat = e.latlng.lat.toFixed(5);
      const lng = e.latlng.lng.toFixed(5);
      const coordEl = document.getElementById('status-coord');
      if (coordEl) coordEl.textContent = `${lat}, ${lng}`;
    });

    this.map.on('zoomend', () => {
      const zoom = this.map.getZoom();
      const zoomEl = document.getElementById('status-zoom');
      if (zoomEl) zoomEl.textContent = zoom;
      const statZoom = document.getElementById('stat-current-zoom');
      if (statZoom) statZoom.textContent = zoom;
    });

    this.measureLayer = L.layerGroup().addTo(this.map);

    const northArrow = document.getElementById('north-arrow-widget');
    if (northArrow) {
      northArrow.addEventListener('click', () => {
        this.map.setView(GIS_CONFIG.map.initialCenter, GIS_CONFIG.map.initialZoom);
        this.showToast('Pandangan peta diorientasikan kembali ke Utara.', 'info');
      });
    }
  }

  /**
   * 2. Basemap Galeri
   */
  initBasemaps() {
    GIS_CONFIG.basemaps.forEach((bm) => {
      const tile = L.tileLayer(bm.url, {
        attribution: bm.attribution,
        maxZoom: 19
      });

      this.baseLayers[bm.id] = tile;

      if (bm.active) {
        tile.addTo(this.map);
        this.currentBaseLayer = bm.id;
      }
    });
  }

  renderBasemapGallery() {
    const container = document.getElementById('basemap-gallery-container');
    if (!container) return;
    container.innerHTML = '';

    GIS_CONFIG.basemaps.forEach((bm) => {
      const card = document.createElement('div');
      card.className = `basemap-card ${bm.active ? 'active' : ''}`;
      card.dataset.id = bm.id;

      card.innerHTML = `
        <img class="basemap-thumb" src="${bm.thumbnail || 'https://via.placeholder.com/68?text=Map'}" alt="${bm.name}" onerror="this.src='https://tile.openstreetmap.org/13/6525/4134.png'">
        <div class="basemap-card-info">
          <div class="basemap-card-title">${bm.name}</div>
          <div class="basemap-card-desc">${bm.description || ''}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.switchBasemap(bm.id);
      });

      container.appendChild(card);
    });
  }

  switchBasemap(id) {
    if (this.currentBaseLayer === id) return;

    if (this.currentBaseLayer && this.baseLayers[this.currentBaseLayer]) {
      this.map.removeLayer(this.baseLayers[this.currentBaseLayer]);
    }

    if (this.baseLayers[id]) {
      this.baseLayers[id].addTo(this.map);
      this.currentBaseLayer = id;
    }

    GIS_CONFIG.basemaps.forEach(b => {
      b.active = (b.id === id);
    });

    document.querySelectorAll('.basemap-card').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });

    const activeName = GIS_CONFIG.basemaps.find(b => b.id === id)?.name || id;
    this.showToast(`Peta dasar diubah ke: ${activeName}`, 'info');
  }

  /**
   * 3. Inisialisasi & Rendering Layer Vektor dan WMS
   */
  initVectorLayers() {
    GIS_CONFIG.layers.forEach((layerConf) => {
      this.addVectorLayer(layerConf);
    });
  }

  addVectorLayer(conf) {
    // 1. Jika layer WMS
    if (conf.type === 'wms') {
      const wmsLayer = L.tileLayer.wms(conf.wmsUrl, {
        layers: conf.wmsLayers,
        format: conf.format || 'image/png',
        transparent: true,
        version: conf.version || '1.3.0',
        attribution: conf.attribution || 'Layanan WMS',
        opacity: conf.opacity !== undefined ? conf.opacity : 0.8,
        zIndex: conf.zIndex || 20
      });

      this.vectorLayers[conf.id] = wmsLayer;
      this.layerMetadata[conf.id] = conf;

      if (conf.visible) {
        wmsLayer.addTo(this.map);
      }
      return;
    }

    // 2. Layer Vektor (GeoJSON / SHP / KML / KMZ / WFS)
    let geojsonLayer;
    const self = this;

    geojsonLayer = L.geoJSON(conf.dataSource, {
      pointToLayer: (feature, latlng) => {
        const props = feature.properties || {};
        const kmlStyle = props.__kmlStyle || {};

        // Cek jika ada icon gambar pin (misal dari KML/KMZ atau iconUrl)
        const iconUrl = kmlStyle.iconUrl || props.iconUrl || props.image || props.gambar;
        if (iconUrl) {
          const imgIcon = L.icon({
            iconUrl: iconUrl,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -30]
          });
          return L.marker(latlng, { icon: imgIcon });
        }

        // Cek warna bawaan file (KML IconStyle / marker-color / color / warna)
        const pinColor = kmlStyle.iconColor || props['marker-color'] || props.color || props.warna || props.fillColor || conf.style?.fillColor || '#e74c3c';
        const iconClass = props.icon || props.simbol || 'fa-location-dot';

        const iconHtml = `
          <div class="marker-pin" style="background-color: ${pinColor};">
            <i class="fa-solid ${iconClass}"></i>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: iconHtml,
          iconSize: [30, 42],
          iconAnchor: [15, 36],
          popupAnchor: [0, -32]
        });

        return L.marker(latlng, { icon: customIcon });
      },
      style: (feature) => {
        const props = feature.properties || {};
        const kmlStyle = props.__kmlStyle || {};

        // Simbologi kategoris bawaan konfigurasi
        if (conf.type === 'line_categorized' && conf.categoryField) {
          const catVal = props[conf.categoryField];
          const catStyle = (conf.categories && conf.categories[catVal]) || { color: '#3388ff', weight: 3 };
          return {
            color: catStyle.color,
            weight: catStyle.weight,
            opacity: (catStyle.opacity || 1) * conf.opacity
          };
        }

        if (conf.type === 'polygon_categorized' && conf.categoryField) {
          const catVal = props[conf.categoryField];
          const catStyle = (conf.categories && conf.categories[catVal]) || { fillColor: '#95a5a6', color: '#7f8c8d', weight: 1.5 };
          return {
            fillColor: catStyle.fillColor,
            color: catStyle.color,
            weight: catStyle.weight,
            fillOpacity: (catStyle.fillOpacity || 0.6) * conf.opacity,
            opacity: conf.opacity
          };
        }

        // Cek simbologi bawaan KML / KMZ / GeoJSON simplestyle
        const strokeColor = kmlStyle.lineColor || props.stroke || props.color || props.warna || conf.style?.color || '#0079c1';
        const strokeWidth = kmlStyle.lineWidth || props['stroke-width'] || conf.style?.weight || 2;
        const strokeOpacity = kmlStyle.lineOpacity !== undefined ? kmlStyle.lineOpacity : (props['stroke-opacity'] !== undefined ? parseFloat(props['stroke-opacity']) : 1);

        const fillColor = kmlStyle.fillColor || props.fill || props.fillColor || props.warna || conf.style?.fillColor || strokeColor;
        const fillOpacity = kmlStyle.fillOpacity !== undefined ? kmlStyle.fillOpacity : (props['fill-opacity'] !== undefined ? parseFloat(props['fill-opacity']) : (conf.style?.fillOpacity || 0.4));

        return {
          color: strokeColor,
          weight: strokeWidth,
          opacity: strokeOpacity * conf.opacity,
          dashArray: conf.style?.dashArray || null,
          fillColor: fillColor,
          fillOpacity: (kmlStyle.fill === false || props.fill === false) ? 0 : fillOpacity * conf.opacity
        };
      },
      onEachFeature: (feature, layer) => {
        self.bindFeaturePopup(feature, layer, conf);
        self.registerSearchFeature(feature, layer, conf);

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            if (l.setStyle) {
              l.setStyle({ weight: (l.options.weight || 2) + 2 });
            }
          },
          mouseout: (e) => {
            geojsonLayer.resetStyle(e.target);
          }
        });
      }
    });

    this.vectorLayers[conf.id] = geojsonLayer;
    this.layerMetadata[conf.id] = conf;

    if (conf.visible) {
      geojsonLayer.addTo(this.map);
    }
  }

  bindFeaturePopup(feature, layer, conf) {
    const props = feature.properties || {};
    const title = props.nama || props.nama_wilayah || props.nama_jalan || props.name || props.NAME || `Objek #${props.id || props.FID || ''}`;
    const badge = props.kategori || props.kab_kota || props.hierarki || conf.name;

    let rowsHtml = '';
    const ignoreKeys = ['__kmlStyle', 'styleUrl', 'styleHash', 'styleMapHash'];

    if (conf.popupFields && conf.popupFields.length > 0) {
      conf.popupFields.forEach(f => {
        if (props[f.key] !== undefined && props[f.key] !== null) {
          const val = props[f.key] + (f.suffix || '');
          rowsHtml += `
            <tr>
              <td class="gis-popup-label">${f.label}</td>
              <td class="gis-popup-value">${val}</td>
            </tr>
          `;
        }
      });
    } else {
      Object.keys(props).forEach(k => {
        if (!ignoreKeys.includes(k) && typeof props[k] !== 'object') {
          rowsHtml += `
            <tr>
              <td class="gis-popup-label">${k}</td>
              <td class="gis-popup-value">${props[k]}</td>
            </tr>
          `;
        }
      });
    }

    const popupContent = `
      <div class="gis-popup">
        <div class="gis-popup-header">
          <div class="gis-popup-title">${title}</div>
          <div class="gis-popup-badge">${badge}</div>
        </div>
        <div class="gis-popup-body">
          <table class="gis-popup-table">
            <tbody>${rowsHtml || '<tr><td>Tidak ada atribut tambahan</td></tr>'}</tbody>
          </table>
        </div>
        <div class="gis-popup-footer">
          <button class="gis-popup-btn" onclick="window.app.zoomToLayerFeature('${conf.id}', ${props.id || 0})">
            <i class="fa-solid fa-crosshairs"></i> Fokus Objek
          </button>
        </div>
      </div>
    `;

    layer.bindPopup(popupContent, { maxWidth: 320 });
  }

  registerSearchFeature(feature, layer, conf) {
    const props = feature.properties || {};
    const name = props.nama || props.nama_wilayah || props.nama_jalan || props.name || props.NAME || '';
    if (name) {
      this.allSearchableFeatures.push({
        name: name,
        layerId: conf.id,
        layerName: conf.name,
        featureId: props.id,
        layerRef: layer,
        bounds: layer.getBounds ? layer.getBounds() : (layer.getLatLng ? L.latLngBounds([layer.getLatLng()]) : null)
      });
    }
  }

  /**
   * 4. Render Panel Lapisan (TOC)
   */
  renderLayerTree() {
    const container = document.getElementById('layer-tree-container');
    if (!container) return;
    container.innerHTML = '';

    if (GIS_CONFIG.layers.length === 0) {
      container.innerHTML = `
        <div style="padding: 30px 20px; text-align: center; color: #94a3b8;">
          <i class="fa-solid fa-layer-group" style="font-size: 2.2rem; margin-bottom: 10px; color: #cbd5e1;"></i>
          <p style="font-size: 0.85rem; font-weight: 600;">Belum ada layer di peta</p>
          <p style="font-size: 0.75rem;">Klik tombol <strong>"Tambah Layer"</strong> di atas untuk memuat file SHP, KML, KMZ, atau WMS.</p>
        </div>
      `;
      return;
    }

    const grouped = {};
    GIS_CONFIG.layers.forEach(l => {
      const g = l.group || 'Layer Tambahan';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(l);
    });

    Object.keys(grouped).forEach(groupName => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'layer-group';
      groupDiv.id = `group-${groupName.replace(/\s+/g, '-').toLowerCase()}`;

      const headerDiv = document.createElement('div');
      headerDiv.className = 'group-header';
      headerDiv.innerHTML = `
        <div class="group-title">
          <i class="fa-solid fa-chevron-down group-collapse-icon"></i>
          <i class="fa-regular fa-folder-open text-muted"></i>
          <span>${groupName}</span>
        </div>
        <span class="badge" style="font-size: 0.7rem; color: #64748b;">${grouped[groupName].length} layer</span>
      `;

      headerDiv.addEventListener('click', (e) => {
        if (!e.target.closest('.group-collapse-icon') && !e.target.closest('.group-title')) return;
        groupDiv.classList.toggle('collapsed');
      });

      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'group-body';

      grouped[groupName].forEach(layerConf => {
        const item = this.createLayerItemElement(layerConf);
        bodyDiv.appendChild(item);
      });

      groupDiv.appendChild(headerDiv);
      groupDiv.appendChild(bodyDiv);
      container.appendChild(groupDiv);
    });

    this.updateStatsOverview();
  }

  createLayerItemElement(layerConf) {
    const item = document.createElement('div');
    item.className = 'layer-item';
    item.id = `layer-item-${layerConf.id}`;

    let symbolPreviewHtml = '';
    let isWms = (layerConf.type === 'wms');

    if (isWms) {
      symbolPreviewHtml = `<span class="layer-symbol-preview" style="background: #16a34a;"><i class="fa-solid fa-globe"></i></span>`;
    } else if (layerConf.type === 'point') {
      symbolPreviewHtml = `<span class="layer-symbol-preview" style="background: #e74c3c;"><i class="fa-solid fa-location-dot"></i></span>`;
    } else if (layerConf.type === 'line_categorized') {
      symbolPreviewHtml = `<span class="layer-symbol-preview" style="background: #c0392b; height: 4px; border-radius: 2px;"></span>`;
    } else if (layerConf.type === 'polygon_categorized') {
      symbolPreviewHtml = `<span class="layer-symbol-preview" style="background: #2ecc71; border: 1px solid #27ae60;"></span>`;
    } else {
      symbolPreviewHtml = `<span class="layer-symbol-preview" style="background: ${layerConf.style?.fillColor || '#0079c1'}; border: 1px solid ${layerConf.style?.color || '#005e95'};"></span>`;
    }

    // Detail Legenda
    let legendDetailsHtml = '';
    if (isWms && layerConf.legendUrl) {
      legendDetailsHtml = `
        <div class="wms-legend-container">
          <span style="font-size: 0.7rem; color: #64748b; font-weight: 600;">Legenda Server WMS:</span>
          <img class="wms-legend-img" src="${layerConf.legendUrl}" alt="Legenda WMS" onerror="this.parentElement.style.display='none'">
        </div>
      `;
    } else if (layerConf.type === 'polygon_categorized' && layerConf.categories) {
      legendDetailsHtml = `<div class="layer-legend-details">`;
      Object.keys(layerConf.categories).forEach(catKey => {
        const c = layerConf.categories[catKey];
        legendDetailsHtml += `
          <div class="legend-subitem">
            <span class="legend-swatch" style="background: ${c.fillColor}; border-color: ${c.color};"></span>
            <span>${c.label || catKey}</span>
          </div>
        `;
      });
      legendDetailsHtml += `</div>`;
    } else if (layerConf.type === 'line_categorized' && layerConf.categories) {
      legendDetailsHtml = `<div class="layer-legend-details">`;
      Object.keys(layerConf.categories).forEach(catKey => {
        const c = layerConf.categories[catKey];
        legendDetailsHtml += `
          <div class="legend-subitem">
            <span class="legend-line-swatch" style="background: ${c.color}; height: ${Math.min(c.weight, 4)}px;"></span>
            <span>${c.label || catKey}</span>
          </div>
        `;
      });
      legendDetailsHtml += `</div>`;
    } else if (layerConf.legend && layerConf.legend.items) {
      legendDetailsHtml = `<div class="layer-legend-details">`;
      layerConf.legend.items.forEach(it => {
        legendDetailsHtml += `
          <div class="legend-subitem">
            <span class="legend-icon-swatch" style="background: ${it.color};"><i class="fa-solid ${it.icon}"></i></span>
            <span>${it.label}</span>
          </div>
        `;
      });
      legendDetailsHtml += `</div>`;
    }

    item.innerHTML = `
      <div class="layer-header-row">
        <div class="layer-info">
          <input type="checkbox" class="layer-checkbox" id="chk-${layerConf.id}" ${layerConf.visible ? 'checked' : ''} title="Tampilkan / Sembunyikan Layer">
          ${symbolPreviewHtml}
          <span class="layer-name" title="${layerConf.name}">${layerConf.name}</span>
          ${isWms ? '<span class="badge-wms">WMS</span>' : ''}
        </div>
        <div class="layer-item-actions">
          <button class="layer-btn layer-btn-zoom" title="Zoom ke Batas Layer" ${isWms ? 'style="display:none;"' : ''}>
            <i class="fa-solid fa-expand"></i>
          </button>
          <button class="layer-btn layer-btn-table" title="Buka Tabel Atribut" ${isWms ? 'style="display:none;"' : ''}>
            <i class="fa-solid fa-table"></i>
          </button>
          <button class="layer-btn layer-btn-up" title="Pindah ke Atas (Bawa ke Depan)">
            <i class="fa-solid fa-arrow-up"></i>
          </button>
          <button class="layer-btn layer-btn-down" title="Pindah ke Bawah (Kirim ke Belakang)">
            <i class="fa-solid fa-arrow-down"></i>
          </button>
          <button class="layer-btn layer-btn-download" title="Unduh File GeoJSON" ${isWms ? 'style="display:none;"' : ''}>
            <i class="fa-solid fa-download"></i>
          </button>
          <button class="layer-btn btn-delete-layer" title="Hapus Layer dari Peta">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
      
      <div class="layer-controls-row">
        <span>Transparansi:</span>
        <input type="range" class="opacity-slider" min="0" max="100" value="${Math.round(layerConf.opacity * 100)}" title="Ubah transparansi">
        <span class="opacity-val" id="opacity-val-${layerConf.id}">${Math.round(layerConf.opacity * 100)}%</span>
      </div>

      ${legendDetailsHtml}
    `;

    // Visibility toggle
    const chk = item.querySelector(`#chk-${layerConf.id}`);
    chk.addEventListener('change', (e) => {
      this.toggleLayerVisibility(layerConf.id, e.target.checked);
    });

    // Zoom to layer
    const btnZoom = item.querySelector('.layer-btn-zoom');
    if (btnZoom) {
      btnZoom.addEventListener('click', (e) => {
        e.stopPropagation();
        this.zoomToLayerExtent(layerConf.id);
      });
    }

    // Buka tabel atribut
    const btnTable = item.querySelector('.layer-btn-table');
    if (btnTable) {
      btnTable.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openAttributeTable(layerConf.id);
      });
    }

    // Reorder UP
    const btnUp = item.querySelector('.layer-btn-up');
    if (btnUp) {
      btnUp.addEventListener('click', (e) => {
        e.stopPropagation();
        this.moveLayerOrder(layerConf.id, -1);
      });
    }

    // Reorder DOWN
    const btnDown = item.querySelector('.layer-btn-down');
    if (btnDown) {
      btnDown.addEventListener('click', (e) => {
        e.stopPropagation();
        this.moveLayerOrder(layerConf.id, 1);
      });
    }

    // Download GeoJSON
    const btnDownload = item.querySelector('.layer-btn-download');
    if (btnDownload) {
      btnDownload.addEventListener('click', (e) => {
        e.stopPropagation();
        this.downloadLayerGeoJSON(layerConf.id);
      });
    }

    // Hapus Layer
    const btnDelete = item.querySelector('.btn-delete-layer');
    if (btnDelete) {
      btnDelete.addEventListener('click', (e) => {
        e.stopPropagation();
        this.promptDeleteLayer(layerConf.id);
      });
    }

    // Slider opacity
    const slider = item.querySelector('.opacity-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        this.setLayerOpacity(layerConf.id, e.target.value);
      });
    }

    return item;
  }

  promptDeleteLayer(layerId) {
    const conf = this.layerMetadata[layerId] || GIS_CONFIG.layers.find(l => l.id === layerId);
    if (!conf) return;

    this.pendingDeleteLayerId = layerId;
    const targetNameEl = document.getElementById('delete-layer-name-target');
    if (targetNameEl) targetNameEl.textContent = `"${conf.name}"`;

    const modal = document.getElementById('modal-delete-layer');
    if (modal) modal.classList.add('open');
  }

  executeDeleteLayer() {
    if (!this.pendingDeleteLayerId) return;

    const layerId = this.pendingDeleteLayerId;
    const conf = this.layerMetadata[layerId] || GIS_CONFIG.layers.find(l => l.id === layerId);
    const layerName = conf ? conf.name : layerId;

    const geoLayer = this.vectorLayers[layerId];
    if (geoLayer && this.map.hasLayer(geoLayer)) {
      this.map.removeLayer(geoLayer);
    }

    delete this.vectorLayers[layerId];
    delete this.layerMetadata[layerId];

    const idx = GIS_CONFIG.layers.findIndex(l => l.id === layerId);
    if (idx !== -1) {
      GIS_CONFIG.layers.splice(idx, 1);
    }

    this.allSearchableFeatures = this.allSearchableFeatures.filter(f => f.layerId !== layerId);

    this.renderLayerTree();
    this.populateAttributeLayerSelect();

    if (this.activeAttributeLayer === layerId) {
      if (GIS_CONFIG.layers.length > 0) {
        this.activeAttributeLayer = GIS_CONFIG.layers[0].id;
        const select = document.getElementById('attr-layer-select');
        if (select) select.value = this.activeAttributeLayer;
        this.renderAttributeTable(this.activeAttributeLayer);
      } else {
        this.activeAttributeLayer = null;
        this.renderAttributeTable(null);
      }
    }

    const modal = document.getElementById('modal-delete-layer');
    if (modal) modal.classList.remove('open');
    this.pendingDeleteLayerId = null;

    this.showToast(`Layer "${layerName}" berhasil dihapus dari peta.`, 'danger');
  }

  moveLayerOrder(layerId, direction) {
    const idx = GIS_CONFIG.layers.findIndex(l => l.id === layerId);
    if (idx === -1) return;

    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= GIS_CONFIG.layers.length) {
      this.showToast('Layer sudah berada di urutan teratas/terbawah.', 'info');
      return;
    }

    const temp = GIS_CONFIG.layers[idx];
    GIS_CONFIG.layers[idx] = GIS_CONFIG.layers[newIdx];
    GIS_CONFIG.layers[newIdx] = temp;

    this.renderLayerTree();

    const movedLayer = this.vectorLayers[layerId];
    if (movedLayer && movedLayer.bringToFront && direction === -1) {
      movedLayer.bringToFront();
    }

    this.showToast(`Urutan layer "${temp.name}" berhasil diubah.`, 'info');
  }

  downloadLayerGeoJSON(layerId) {
    const conf = this.layerMetadata[layerId] || GIS_CONFIG.layers.find(l => l.id === layerId);
    if (!conf || !conf.dataSource) return;

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(conf.dataSource, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    const fileName = (conf.name || 'layer').toLowerCase().replace(/\s+/g, '_') + '.geojson';
    dlAnchor.setAttribute("download", fileName);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    this.showToast(`Layer "${conf.name}" berhasil diekspor ke file ${fileName}.`, 'success');
  }

  toggleLayerVisibility(layerId, isVisible) {
    const geoLayer = this.vectorLayers[layerId];
    const conf = this.layerMetadata[layerId];
    if (!geoLayer || !conf) return;

    conf.visible = isVisible;

    if (isVisible) {
      if (!this.map.hasLayer(geoLayer)) {
        this.map.addLayer(geoLayer);
      }
    } else {
      if (this.map.hasLayer(geoLayer)) {
        this.map.removeLayer(geoLayer);
      }
    }

    this.updateStatsOverview();
  }

  setLayerOpacity(layerId, val) {
    const normVal = parseFloat(val) / 100;
    const geoLayer = this.vectorLayers[layerId];
    const conf = this.layerMetadata[layerId];
    if (!geoLayer || !conf) return;

    conf.opacity = normVal;
    const valEl = document.getElementById(`opacity-val-${layerId}`);
    if (valEl) valEl.textContent = `${val}%`;

    // Jika layer WMS
    if (conf.type === 'wms') {
      if (geoLayer.setOpacity) {
        geoLayer.setOpacity(normVal);
      }
      return;
    }

    // Jika layer vektor
    if (geoLayer.eachLayer) {
      geoLayer.eachLayer(l => {
        if (l.setStyle) {
          const cur = l.options || {};
          l.setStyle({
            opacity: normVal,
            fillOpacity: (cur.fillOpacity !== undefined) ? normVal * 0.5 : undefined
          });
        }
      });
    }
  }

  zoomToLayerExtent(layerId) {
    const geoLayer = this.vectorLayers[layerId];
    if (!geoLayer) return;

    if (geoLayer.getBounds && typeof geoLayer.getBounds === 'function') {
      const bounds = geoLayer.getBounds();
      if (bounds && bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
        const conf = this.layerMetadata[layerId];
        if (conf) this.showToast(`Berfokus pada batas layer "${conf.name}".`, 'info');
      }
    }
  }

  zoomToLayerFeature(layerId, featureId, featureIndex) {
    const geoLayer = this.vectorLayers[layerId];
    if (!geoLayer) return;

    const chk = document.getElementById(`chk-${layerId}`);
    if (chk && !chk.checked) {
      chk.checked = true;
      this.toggleLayerVisibility(layerId, true);
    }

    let targetLayer = null;
    let idx = 0;

    if (geoLayer.eachLayer) {
      geoLayer.eachLayer(l => {
        if (targetLayer) return;
        const props = (l.feature && l.feature.properties) || {};
        if (props.id !== undefined && props.id === featureId) {
          targetLayer = l;
        } else if (featureIndex !== undefined && idx === featureIndex) {
          targetLayer = l;
        }
        idx++;
      });
    }

    if (targetLayer) {
      if (targetLayer.getBounds && typeof targetLayer.getBounds === 'function') {
        const b = targetLayer.getBounds();
        if (b.isValid()) {
          this.map.fitBounds(b, { padding: [80, 80], maxZoom: 17 });
        }
      } else if (targetLayer.getLatLng && typeof targetLayer.getLatLng === 'function') {
        this.map.setView(targetLayer.getLatLng(), 17);
      }

      if (targetLayer.openPopup) {
        setTimeout(() => targetLayer.openPopup(), 250);
      }
    }
  }

  /**
   * 5. Panel Dock Tabel Atribut
   */
  initAttributeDock() {
    const dock = document.getElementById('attribute-dock');
    const toggleBtn = document.getElementById('btn-dock-toggle');
    const header = document.getElementById('attr-dock-header');
    const maximizeBtn = document.getElementById('btn-dock-maximize');
    const closeBtn = document.getElementById('btn-dock-close');
    const layerSelect = document.getElementById('attr-layer-select');
    const searchInput = document.getElementById('attr-search-input');
    const toolbarAttrBtn = document.getElementById('btn-toggle-attr-table');
    const statusAttrBtn = document.getElementById('status-btn-attr');

    this.populateAttributeLayerSelect();

    if (GIS_CONFIG.layers.length > 0) {
      const firstVector = GIS_CONFIG.layers.find(l => l.type !== 'wms');
      if (firstVector) {
        this.activeAttributeLayer = firstVector.id;
        this.renderAttributeTable(this.activeAttributeLayer);
      }
    }

    if (layerSelect) {
      layerSelect.addEventListener('change', (e) => {
        this.activeAttributeLayer = e.target.value;
        this.renderAttributeTable(this.activeAttributeLayer);
        if (dock && dock.classList.contains('collapsed')) {
          this.expandAttributeDock();
        }
      });
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleAttributeDock();
      });
    }

    if (header) {
      header.addEventListener('click', (e) => {
        if (e.target.closest('#attr-layer-select') || 
            e.target.closest('#attr-search-input') || 
            e.target.closest('#btn-dock-maximize') || 
            e.target.closest('#btn-dock-close') ||
            e.target.closest('#btn-dock-toggle')) {
          return;
        }
        this.toggleAttributeDock();
      });
    }

    if (maximizeBtn) {
      maximizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const maxIcon = document.getElementById('attr-maximize-icon');
        const toggleIcon = document.getElementById('attr-toggle-icon');

        if (dock.classList.contains('maximized')) {
          dock.classList.remove('maximized');
          dock.classList.add('expanded');
          if (maxIcon) maxIcon.className = 'fa-solid fa-up-right-and-down-left-from-center';
        } else {
          dock.classList.remove('collapsed', 'hidden');
          dock.classList.add('maximized');
          if (maxIcon) maxIcon.className = 'fa-solid fa-down-left-and-up-right-to-center';
          if (toggleIcon) toggleIcon.className = 'fa-solid fa-chevron-down';
        }
        setTimeout(() => this.map.invalidateSize(), 300);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeAttributeTable();
      });
    }

    if (toolbarAttrBtn) {
      toolbarAttrBtn.addEventListener('click', () => {
        if (dock.classList.contains('hidden') || dock.classList.contains('collapsed')) {
          this.expandAttributeDock();
        } else {
          this.collapseAttributeDock();
        }
      });
    }

    if (statusAttrBtn) {
      statusAttrBtn.addEventListener('click', () => {
        if (dock.classList.contains('hidden') || dock.classList.contains('collapsed')) {
          this.expandAttributeDock();
        } else {
          this.collapseAttributeDock();
        }
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        this.filterAttributeTable(term);
      });
    }
  }

  populateAttributeLayerSelect() {
    const layerSelect = document.getElementById('attr-layer-select');
    if (!layerSelect) return;
    layerSelect.innerHTML = '';

    const vectorLayers = GIS_CONFIG.layers.filter(l => l.type !== 'wms');
    vectorLayers.forEach(l => {
      const opt = document.createElement('option');
      opt.value = l.id;
      const count = (l.dataSource && l.dataSource.features) ? l.dataSource.features.length : 0;
      opt.textContent = `${l.name} (${count})`;
      if (this.activeAttributeLayer === l.id) {
        opt.selected = true;
      }
      layerSelect.appendChild(opt);
    });
  }

  toggleAttributeDock() {
    const dock = document.getElementById('attribute-dock');
    if (!dock) return;
    if (dock.classList.contains('expanded') || dock.classList.contains('maximized')) {
      this.collapseAttributeDock();
    } else {
      this.expandAttributeDock();
    }
  }

  expandAttributeDock() {
    const dock = document.getElementById('attribute-dock');
    const toggleIcon = document.getElementById('attr-toggle-icon');
    const toolbarAttrBtn = document.getElementById('btn-toggle-attr-table');

    if (!dock) return;
    dock.classList.remove('hidden', 'collapsed', 'maximized');
    dock.classList.add('expanded');
    if (toggleIcon) toggleIcon.className = 'fa-solid fa-chevron-down';
    if (toolbarAttrBtn) toolbarAttrBtn.classList.add('active');

    setTimeout(() => this.map.invalidateSize(), 300);
  }

  collapseAttributeDock() {
    const dock = document.getElementById('attribute-dock');
    const toggleIcon = document.getElementById('attr-toggle-icon');
    const toolbarAttrBtn = document.getElementById('btn-toggle-attr-table');

    if (!dock) return;
    dock.classList.remove('hidden', 'expanded', 'maximized');
    dock.classList.add('collapsed');
    if (toggleIcon) toggleIcon.className = 'fa-solid fa-chevron-up';
    if (toolbarAttrBtn) toolbarAttrBtn.classList.remove('active');

    setTimeout(() => this.map.invalidateSize(), 300);
  }

  closeAttributeTable() {
    const dock = document.getElementById('attribute-dock');
    const toolbarAttrBtn = document.getElementById('btn-toggle-attr-table');
    if (dock) dock.classList.add('hidden');
    if (toolbarAttrBtn) toolbarAttrBtn.classList.remove('active');
    setTimeout(() => this.map.invalidateSize(), 300);
  }

  openAttributeTable(layerId) {
    this.activeAttributeLayer = layerId;
    const layerSelect = document.getElementById('attr-layer-select');
    if (layerSelect) {
      layerSelect.value = layerId;
    }
    this.renderAttributeTable(layerId);
    this.expandAttributeDock();
  }

  renderAttributeTable(layerId) {
    const conf = this.layerMetadata[layerId] || GIS_CONFIG.layers.find(l => l.id === layerId);
    const countBadge = document.getElementById('attr-count-badge');
    const thead = document.getElementById('attr-table-thead');
    const tbody = document.getElementById('attr-table-tbody');
    const emptyMsg = document.getElementById('attr-table-empty-msg');
    const searchInput = document.getElementById('attr-search-input');

    if (searchInput) searchInput.value = '';

    if (!conf || conf.type === 'wms' || !conf.dataSource || !conf.dataSource.features || conf.dataSource.features.length === 0) {
      if (thead) thead.innerHTML = '';
      if (tbody) tbody.innerHTML = '';
      if (countBadge) countBadge.textContent = '0 objek';
      if (emptyMsg) emptyMsg.style.display = 'flex';
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    const features = conf.dataSource.features;
    if (countBadge) countBadge.textContent = `${features.length} objek`;

    const ignoreKeys = ['__kmlStyle', 'styleUrl', 'styleHash', 'styleMapHash'];
    const keys = Object.keys(features[0].properties || {}).filter(k => !ignoreKeys.includes(k));

    if (thead) {
      thead.innerHTML = `<tr><th style="width: 40px; text-align: center;">#</th>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;
    }

    this.renderAttributeRows(features, keys, layerId);
  }

  renderAttributeRows(features, keys, layerId) {
    const tbody = document.getElementById('attr-table-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    features.forEach((f, idx) => {
      const tr = document.createElement('tr');
      const featureId = (f.properties && f.properties.id !== undefined) ? f.properties.id : idx;

      let cells = `<td style="text-align: center; color: #94a3b8; font-weight: bold;">${idx + 1}</td>`;
      keys.forEach(k => {
        const val = f.properties[k] !== undefined ? f.properties[k] : '';
        cells += `<td>${val}</td>`;
      });
      tr.innerHTML = cells;

      tr.addEventListener('click', () => {
        document.querySelectorAll('#attr-table-tbody tr').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        this.zoomToLayerFeature(layerId, featureId, idx);
      });

      tbody.appendChild(tr);
    });
  }

  filterAttributeTable(term) {
    const conf = this.layerMetadata[this.activeAttributeLayer];
    if (!conf || !conf.dataSource || !conf.dataSource.features) return;

    const features = conf.dataSource.features;
    const ignoreKeys = ['__kmlStyle', 'styleUrl', 'styleHash', 'styleMapHash'];
    const keys = Object.keys(features[0].properties || {}).filter(k => !ignoreKeys.includes(k));
    const countBadge = document.getElementById('attr-count-badge');

    const filtered = features.filter(f => {
      return keys.some(k => String(f.properties[k] || '').toLowerCase().includes(term));
    });

    if (countBadge) {
      countBadge.textContent = term ? `${filtered.length} dari ${features.length} objek` : `${features.length} objek`;
    }

    this.renderAttributeRows(filtered, keys, this.activeAttributeLayer);
  }

  /**
   * 6. Markah Spasial (Bookmarks)
   */
  renderBookmarks() {
    const container = document.getElementById('bookmarks-list-container');
    if (!container) return;
    container.innerHTML = '';

    GIS_CONFIG.bookmarks.forEach((bm, idx) => {
      const item = document.createElement('div');
      item.className = 'bookmark-item';
      item.innerHTML = `
        <div class="bookmark-item-info">
          <i class="fa-solid fa-location-dot"></i>
          <div>
            <div class="bookmark-title">${bm.name}</div>
            <div class="bookmark-desc">${bm.description || ''}</div>
          </div>
        </div>
        <button class="btn-bookmark-del" title="Hapus Markah"><i class="fa-solid fa-xmark"></i></button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-bookmark-del')) return;
        this.map.flyTo(bm.center, bm.zoom, { duration: 1.5 });
        this.showToast(`Menavigasi ke: ${bm.name}`, 'info');
      });

      const delBtn = item.querySelector('.btn-bookmark-del');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        GIS_CONFIG.bookmarks.splice(idx, 1);
        this.renderBookmarks();
        this.showToast(`Markah "${bm.name}" telah dihapus.`, 'info');
      });

      container.appendChild(item);
    });
  }

  saveCurrentViewAsBookmark(name, desc) {
    const center = this.map.getCenter();
    const zoom = this.map.getZoom();

    const newBm = {
      id: 'bm_' + Date.now(),
      name: name || 'Markah Kustom',
      description: desc || `Koordinat: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)} (Zoom ${zoom})`,
      center: [center.lat, center.lng],
      zoom: zoom
    };

    GIS_CONFIG.bookmarks.unshift(newBm);
    this.renderBookmarks();
    this.showToast(`Markah "${newBm.name}" berhasil disimpan!`, 'success');
  }

  /**
   * 7. Alat Pengukuran Spasial
   */
  initMeasurement() {
    const distBtn = document.getElementById('btn-measure-dist');
    const areaBtn = document.getElementById('btn-measure-area');
    const coordBtn = document.getElementById('btn-measure-coord');
    const resetBtn = document.getElementById('btn-reset-measure');
    const clearBannerBtn = document.getElementById('btn-clear-measure');

    const setMode = (mode) => {
      this.measureMode = mode;
      document.querySelectorAll('.measure-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
      this.clearMeasurementData();

      const titleEl = document.getElementById('measure-result-title');
      if (mode === 'distance') {
        if (titleEl) titleEl.textContent = 'Hasil Pengukuran Jarak';
      } else if (mode === 'area') {
        if (titleEl) titleEl.textContent = 'Hasil Pengukuran Luas Area';
      } else {
        if (titleEl) titleEl.textContent = 'Informasi Koordinat Titik';
      }
    };

    if (distBtn) distBtn.addEventListener('click', () => setMode('distance'));
    if (areaBtn) areaBtn.addEventListener('click', () => setMode('area'));
    if (coordBtn) coordBtn.addEventListener('click', () => setMode('coord'));

    if (resetBtn) resetBtn.addEventListener('click', () => this.clearMeasurementData());
    if (clearBannerBtn) clearBannerBtn.addEventListener('click', () => this.clearMeasurementData());

    this.map.on('click', (e) => {
      const activeTab = document.querySelector('.sidebar-tab-content.active');
      const isMeasureTabOpen = activeTab && activeTab.id === 'tab-measure';
      const isBannerActive = document.getElementById('measure-widget')?.classList.contains('active');

      if (!isMeasureTabOpen && !isBannerActive) return;

      this.handleMeasureClick(e.latlng);
    });
  }

  handleMeasureClick(latlng) {
    this.measurePoints.push(latlng);
    const widget = document.getElementById('measure-widget');
    if (widget) widget.classList.add('active');

    if (this.measureMode === 'coord') {
      this.measureLayer.clearLayers();
      L.marker(latlng).addTo(this.measureLayer)
        .bindPopup(`<b>Titik Koordinat</b><br>Lat: ${latlng.lat.toFixed(6)}<br>Lng: ${latlng.lng.toFixed(6)}`)
        .openPopup();

      const valText = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
      document.getElementById('measure-result-value').textContent = valText;
      document.getElementById('measure-output-text').textContent = `Koordinat: ${valText}`;
      return;
    }

    if (this.measureMode === 'distance') {
      this.measureLayer.clearLayers();
      this.measurePoints.forEach(p => {
        L.circleMarker(p, { radius: 5, color: '#0079c1', fillColor: '#fff', fillOpacity: 1 }).addTo(this.measureLayer);
      });

      if (this.measurePoints.length > 1) {
        L.polyline(this.measurePoints, { color: '#0079c1', weight: 3, dashArray: '6, 6' }).addTo(this.measureLayer);

        let totalDist = 0;
        for (let i = 0; i < this.measurePoints.length - 1; i++) {
          totalDist += this.measurePoints[i].distanceTo(this.measurePoints[i + 1]);
        }

        const formatted = totalDist > 1000 ? `${(totalDist / 1000).toFixed(2)} km` : `${totalDist.toFixed(1)} meter`;
        document.getElementById('measure-result-value').textContent = formatted;
        document.getElementById('measure-output-text').textContent = `Jarak: ${formatted}`;
      }
      return;
    }

    if (this.measureMode === 'area') {
      this.measureLayer.clearLayers();
      this.measurePoints.forEach(p => {
        L.circleMarker(p, { radius: 5, color: '#27ae60', fillColor: '#fff', fillOpacity: 1 }).addTo(this.measureLayer);
      });

      if (this.measurePoints.length >= 3) {
        L.polygon(this.measurePoints, { color: '#27ae60', fillColor: '#2ecc71', fillOpacity: 0.35, weight: 2 }).addTo(this.measureLayer);

        const areaSqMeters = this.calculatePolygonArea(this.measurePoints);
        let areaText = '';
        if (areaSqMeters >= 10000) {
          areaText = `${(areaSqMeters / 10000).toFixed(2)} Hektar (${(areaSqMeters / 1000000).toFixed(3)} km²)`;
        } else {
          areaText = `${areaSqMeters.toFixed(1)} m²`;
        }

        document.getElementById('measure-result-value').textContent = areaText;
        document.getElementById('measure-output-text').textContent = `Luas: ${areaText}`;
      }
    }
  }

  calculatePolygonArea(latlngs) {
    if (latlngs.length < 3) return 0;
    const radius = 6378137;
    let total = 0;
    for (let i = 0; i < latlngs.length; i++) {
      const p1 = latlngs[i];
      const p2 = latlngs[(i + 1) % latlngs.length];
      total += (p2.lng * Math.PI / 180 - p1.lng * Math.PI / 180) *
               (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
    }
    return Math.abs(total * radius * radius / 2.0);
  }

  clearMeasurementData() {
    this.measurePoints = [];
    if (this.measureLayer) this.measureLayer.clearLayers();
    const valEl = document.getElementById('measure-result-value');
    if (valEl) valEl.textContent = '0.00';
    const outEl = document.getElementById('measure-output-text');
    if (outEl) outEl.textContent = 'Klik pada peta untuk mulai mengukur';
    const widget = document.getElementById('measure-widget');
    if (widget) widget.classList.remove('active');
  }

  /**
   * 8. Pencarian Global
   */
  initSearch() {
    const input = document.getElementById('search-input');
    const dropdown = document.getElementById('search-dropdown');
    if (!input || !dropdown) return;

    input.addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      if (term.length < 2) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
        return;
      }

      const results = this.allSearchableFeatures.filter(item => item.name.toLowerCase().includes(term)).slice(0, 8);

      if (results.length === 0) {
        dropdown.innerHTML = '<div style="padding: 10px; font-size: 0.8rem; color: #64748b;">Tidak ditemukan objek</div>';
        dropdown.style.display = 'block';
        return;
      }

      dropdown.innerHTML = results.map((item, idx) => `
        <div class="search-item" data-idx="${idx}">
          <div class="search-item-title">${item.name}</div>
          <div class="search-item-layer">${item.layerName}</div>
        </div>
      `).join('');

      dropdown.style.display = 'block';

      dropdown.querySelectorAll('.search-item').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.dataset.idx);
          const target = results[idx];
          dropdown.style.display = 'none';
          input.value = target.name;

          const chk = document.getElementById(`chk-${target.layerId}`);
          if (chk && !chk.checked) {
            chk.checked = true;
            this.toggleLayerVisibility(target.layerId, true);
          }

          if (target.bounds && target.bounds.isValid()) {
            this.map.fitBounds(target.bounds, { padding: [80, 80], maxZoom: 17 });
          }
          if (target.layerRef && target.layerRef.openPopup) {
            setTimeout(() => target.layerRef.openPopup(), 300);
          }
        });
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box')) {
        dropdown.style.display = 'none';
      }
    });

    const layerFilterInput = document.getElementById('layer-filter-input');
    if (layerFilterInput) {
      layerFilterInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('.layer-item').forEach(el => {
          const name = el.querySelector('.layer-name').textContent.toLowerCase();
          el.style.display = name.includes(q) ? 'flex' : 'none';
        });
      });
    }
  }

  /**
   * 9. Tab Navigasi & Event Listeners
   */
  initEventListeners() {
    document.querySelectorAll('.sidebar-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;
        document.querySelectorAll('.sidebar-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.sidebar-tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const content = document.getElementById(targetTab);
        if (content) content.classList.add('active');

        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('collapsed')) {
          sidebar.classList.remove('collapsed');
          setTimeout(() => this.map.invalidateSize(), 300);
        }
      });
    });

    const sidebar = document.getElementById('sidebar');
    const handleBtn = document.getElementById('sidebar-toggle-handle');
    if (handleBtn && sidebar) {
      handleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        setTimeout(() => this.map.invalidateSize(), 300);
      });
    }

    const btnShowAll = document.getElementById('btn-show-all-layers');
    const btnHideAll = document.getElementById('btn-hide-all-layers');

    if (btnShowAll) {
      btnShowAll.addEventListener('click', () => {
        GIS_CONFIG.layers.forEach(l => {
          const chk = document.getElementById(`chk-${l.id}`);
          if (chk) chk.checked = true;
          this.toggleLayerVisibility(l.id, true);
        });
        this.showToast('Semua layer diaktifkan.', 'info');
      });
    }

    if (btnHideAll) {
      btnHideAll.addEventListener('click', () => {
        GIS_CONFIG.layers.forEach(l => {
          const chk = document.getElementById(`chk-${l.id}`);
          if (chk) chk.checked = false;
          this.toggleLayerVisibility(l.id, false);
        });
        this.showToast('Semua layer disembunyikan.', 'info');
      });
    }

    // Modal Konfirmasi Hapus
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnCancelDelete2 = document.getElementById('btn-cancel-delete-2');

    if (btnConfirmDelete) {
      btnConfirmDelete.addEventListener('click', () => {
        this.executeDeleteLayer();
      });
    }

    const closeDelModal = () => {
      const modal = document.getElementById('modal-delete-layer');
      if (modal) modal.classList.remove('open');
      this.pendingDeleteLayerId = null;
    };

    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDelModal);
    if (btnCancelDelete2) btnCancelDelete2.addEventListener('click', closeDelModal);

    // Modal Tambah Markah
    const btnOpenAddBm = document.getElementById('btn-open-add-bookmark');
    const modalBm = document.getElementById('modal-add-bookmark');
    const btnConfirmBm = document.getElementById('btn-confirm-bookmark');
    const btnCancelBm = document.getElementById('btn-cancel-bookmark');
    const btnCancelBm2 = document.getElementById('btn-cancel-bookmark-2');

    if (btnOpenAddBm && modalBm) {
      btnOpenAddBm.addEventListener('click', () => {
        modalBm.classList.add('open');
      });
    }

    const closeBmModal = () => {
      if (modalBm) modalBm.classList.remove('open');
    };

    if (btnCancelBm) btnCancelBm.addEventListener('click', closeBmModal);
    if (btnCancelBm2) btnCancelBm2.addEventListener('click', closeBmModal);

    if (btnConfirmBm) {
      btnConfirmBm.addEventListener('click', () => {
        const name = document.getElementById('input-bookmark-name')?.value.trim();
        const desc = document.getElementById('input-bookmark-desc')?.value.trim();
        if (!name) {
          alert('Silakan masukkan nama markah.');
          return;
        }
        this.saveCurrentViewAsBookmark(name, desc);
        closeBmModal();
      });
    }

    // Modal Unggah Layer
    const uploadModal = document.getElementById('upload-modal');
    const btnOpenUpload = document.getElementById('btn-open-upload');
    const btnCancelUpload = document.getElementById('btn-cancel-upload');
    const btnCancelUpload2 = document.getElementById('btn-cancel-upload-2');

    if (btnOpenUpload && uploadModal) {
      btnOpenUpload.addEventListener('click', () => uploadModal.classList.add('open'));
    }
    if (btnCancelUpload && uploadModal) {
      btnCancelUpload.addEventListener('click', () => uploadModal.classList.remove('open'));
    }
    if (btnCancelUpload2 && uploadModal) {
      btnCancelUpload2.addEventListener('click', () => uploadModal.classList.remove('open'));
    }

    const resetBtn = document.getElementById('btn-reset-view');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.map.setView(GIS_CONFIG.map.initialCenter, GIS_CONFIG.map.initialZoom);
        this.showToast('Kembali ke tampilan awal peta.', 'info');
      });
    }

    const fsBtn = document.getElementById('btn-fullscreen');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.log(err));
        } else {
          document.exitFullscreen();
        }
      });
    }

    const printBtn = document.getElementById('btn-print-map');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        this.showToast('Membuka dialog cetak peta...', 'info');
        window.print();
      });
    }

    this.initFileUpload();
  }

  /**
   * 10. Engine Upload Multi-Format (SHP, KML, KMZ, GeoJSON, WMS, WFS)
   */
  initFileUpload() {
    const dropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('file-input');
    const layerNameInput = document.getElementById('input-layer-name');
    const layerColorInput = document.getElementById('input-layer-color');
    const btnConfirmUpload = document.getElementById('btn-confirm-upload');
    const chkSymbology = document.getElementById('chk-use-file-symbology');

    let activeModalTab = 'pane-file';
    let loadedGeoJSON = null;

    // 1. Tab Switching di dalam Modal Tambah Layer
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPane = btn.dataset.modaltab;
        activeModalTab = targetPane;
        document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.modal-tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const pane = document.getElementById(targetPane);
        if (pane) pane.classList.add('active');

        if (targetPane === 'pane-file') {
          btnConfirmUpload.innerHTML = '<i class="fa-solid fa-plus"></i> Tambahkan ke Peta';
        } else if (targetPane === 'pane-wms') {
          btnConfirmUpload.innerHTML = '<i class="fa-solid fa-globe"></i> Hubungkan Layanan WMS';
        } else {
          btnConfirmUpload.innerHTML = '<i class="fa-solid fa-bolt"></i> Unduh & Muat Data WFS';
        }
      });
    });

    // 2. Preset Cepat WMS & WFS
    const wmsPreset1 = document.getElementById('preset-wms-1');
    const wmsPreset2 = document.getElementById('preset-wms-2');
    const wfsPreset1 = document.getElementById('preset-wfs-1');

    if (wmsPreset1) {
      wmsPreset1.addEventListener('click', () => {
        document.getElementById('input-wms-url').value = 'https://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv';
        document.getElementById('input-wms-layers').value = 'GEBCO_LATEST';
        document.getElementById('input-wms-title').value = 'GEBCO Global Bathymetry (WMS)';
      });
    }

    if (wmsPreset2) {
      wmsPreset2.addEventListener('click', () => {
        document.getElementById('input-wms-url').value = 'https://ahocevar.com/geoserver/wms';
        document.getElementById('input-wms-layers').value = 'topp:states';
        document.getElementById('input-wms-title').value = 'GeoServer US States (WMS)';
      });
    }

    if (wfsPreset1) {
      wfsPreset1.addEventListener('click', () => {
        document.getElementById('input-wfs-url').value = 'https://ahocevar.com/geoserver/wfs';
        document.getElementById('input-wfs-typename').value = 'topp:states';
        document.getElementById('input-wfs-title').value = 'US States Vector (WFS)';
      });
    }

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length) {
        handleUploadedFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        handleUploadedFile(e.target.files[0]);
      }
    });

    // Pemrosesan File Vektor
    const handleUploadedFile = async (file) => {
      const fileName = file.name;
      const lowerName = fileName.toLowerCase();
      const baseName = fileName.replace(/\.[^/.]+$/, "");
      if (layerNameInput) layerNameInput.value = baseName;

      const detectCard = document.getElementById('file-detect-card');
      const detectType = document.getElementById('file-detected-type');
      const detectName = document.getElementById('file-detected-name');
      const detectCount = document.getElementById('file-detected-count');

      try {
        // A. SHAPEFILE (.zip)
        if (lowerName.endsWith('.zip') && !lowerName.endsWith('.kmz')) {
          detectType.className = 'file-type-pill shp';
          detectType.textContent = 'SHP (SHAPEFILE)';

          const arrayBuffer = await file.arrayBuffer();
          if (!window.shp) {
            throw new Error('Pustaka shp.js belum selesai dimuat.');
          }

          let detectedPrjCrs = null;
          if (window.JSZip) {
            try {
              const zip = await window.JSZip.loadAsync(file);
              const prjFileName = Object.keys(zip.files).find(n => n.toLowerCase().endsWith('.prj'));
              if (prjFileName) {
                const prjText = await zip.files[prjFileName].async('text');
                detectedPrjCrs = parsePrjForCrs(prjText);
                console.log('PRJ CRS terdeteksi:', detectedPrjCrs);
              }
            } catch (zErr) {
              console.warn('Gagal membaca file .prj dari ZIP:', zErr);
            }
          }

          let shpResult = await window.shp(arrayBuffer);
          if (Array.isArray(shpResult)) {
            shpResult = shpResult[0]; // Ambil layer pertama
          }

          loadedGeoJSON = shpResult;
          updatePreviewUI(baseName, loadedGeoJSON.features?.length || 0, detectedPrjCrs);
          return;
        }

        // B. KMZ (.kmz)
        if (lowerName.endsWith('.kmz')) {
          detectType.className = 'file-type-pill kmz';
          detectType.textContent = 'KMZ ARCHIVE';

          if (!window.JSZip) {
            throw new Error('Pustaka JSZip belum selesai dimuat.');
          }

          const zip = await window.JSZip.loadAsync(file);
          const kmzImages = {};

          const fileNames = Object.keys(zip.files);
          const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];

          for (const fn of fileNames) {
            const lfn = fn.toLowerCase();
            if (imageExts.some(ext => lfn.endsWith(ext))) {
              const ext = lfn.split('.').pop();
              const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
              const base64 = await zip.files[fn].async('base64');
              const dataUrl = `data:${mime};base64,${base64}`;
              kmzImages[fn] = dataUrl;
              kmzImages[fn.replace(/^files\//, '')] = dataUrl;
            }
          }

          let kmlFileName = fileNames.find(n => n.toLowerCase().endsWith('.kml')) || 'doc.kml';
          if (!zip.files[kmlFileName]) {
            throw new Error('Tidak ditemukan file .kml di dalam arsip KMZ.');
          }

          const kmlText = await zip.files[kmlFileName].async('text');
          loadedGeoJSON = parseKmlWithStyles(kmlText, kmzImages);
          updatePreviewUI(baseName, loadedGeoJSON.features?.length || 0);
          return;
        }

        // C. KML (.kml)
        if (lowerName.endsWith('.kml')) {
          detectType.className = 'file-type-pill kml';
          detectType.textContent = 'KML';

          const text = await file.text();
          loadedGeoJSON = parseKmlWithStyles(text);
          updatePreviewUI(baseName, loadedGeoJSON.features?.length || 0);
          return;
        }

        // D. GeoJSON / JSON (.geojson, .json)
        if (lowerName.endsWith('.geojson') || lowerName.endsWith('.json')) {
          detectType.className = 'file-type-pill geojson';
          detectType.textContent = 'GEOJSON';

          const text = await file.text();
          const parsed = JSON.parse(text);
          if (parsed.type === 'FeatureCollection' || parsed.type === 'Feature') {
            loadedGeoJSON = (parsed.type === 'Feature') ? { type: 'FeatureCollection', features: [parsed] } : parsed;
            updatePreviewUI(baseName, loadedGeoJSON.features?.length || 0);
          } else {
            throw new Error('File JSON bukan format GeoJSON valid.');
          }
          return;
        }

        alert('Format file tidak didukung. Harap pilih file .zip (Shapefile), .kml, .kmz, atau .geojson.');

      } catch (err) {
        console.error(err);
        alert(`Gagal memproses file: ${err.message}`);
      }
    };

    const updatePreviewUI = (name, count, detectedPrjCrs = null) => {
      const detectCard = document.getElementById('file-detect-card');
      const detectName = document.getElementById('file-detected-name');
      const detectCount = document.getElementById('file-detected-count');
      const crsBanner = document.getElementById('crs-detect-banner');
      const crsSelect = document.getElementById('select-source-crs');
      const crsMsg = document.getElementById('crs-detect-msg');

      if (detectCard) detectCard.style.display = 'flex';
      if (detectName) detectName.textContent = name;
      if (detectCount) detectCount.textContent = `${count} objek terdeteksi`;

      // Cek apakah koordinat dalam satuan meter (misal TM-3 atau UTM)
      const isMeters = detectCoordinatesInMeters(loadedGeoJSON);
      if (isMeters) {
        if (crsBanner) crsBanner.style.display = 'block';
        const bestCrs = detectedPrjCrs || suggestBestCrs(loadedGeoJSON);
        if (crsSelect && bestCrs) {
          crsSelect.value = bestCrs;
        }
        const sampleCoord = getFirstCoordinatePair(loadedGeoJSON);
        const xStr = sampleCoord ? sampleCoord[0].toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-';
        const yStr = sampleCoord ? sampleCoord[1].toLocaleString('id-ID', { maximumFractionDigits: 2 }) : '-';
        const crsLabel = crsSelect?.options[crsSelect.selectedIndex]?.text || bestCrs;
        if (crsMsg) {
          crsMsg.innerHTML = `Koordinat data berbasis meter (X: <code>${xStr}</code>, Y: <code>${yStr}</code>). ` +
            (detectedPrjCrs ? `Sistem mendeteksi format dari PRJ: <strong>${crsLabel}</strong>.` :
            `Rekomendasi terpilih: <strong>${crsLabel}</strong>. Jika file berasal dari zona TM-3 / UTM lain, Anda dapat mengubahnya pada pilihan CRS di bawah.`) +
            `<br><i class="fa-solid fa-wand-magic-sparkles" style="color:#d97706; margin-top:3px;"></i> Reproyeksi ke WGS 84 (Derajat) akan dilakukan secara otomatis dan akurat saat ditambahkan ke peta.`;
        }
      } else {
        if (crsBanner) crsBanner.style.display = 'none';
        if (crsSelect) crsSelect.value = 'EPSG:4326';
      }

      dropZone.innerHTML = `
        <i class="fa-solid fa-circle-check" style="color: #27ae60;"></i>
        <p><strong>${name}</strong> berhasil dimuat!</p>
        <p style="font-size: 0.75rem; color: #64748b;">(${count} fitur siap ditambahkan ke peta)</p>
      `;
    };

    // Tombol Konfirmasi Tambah
    if (btnConfirmUpload) {
      btnConfirmUpload.addEventListener('click', async () => {
        const modal = document.getElementById('upload-modal');

        // 1. Eksekusi Tab File Vektor
        if (activeModalTab === 'pane-file') {
          if (!loadedGeoJSON) {
            alert('Silakan pilih file (SHP/KML/KMZ/GeoJSON) terlebih dahulu.');
            return;
          }

          const layerName = layerNameInput?.value.trim() || 'Layer Spasial';
          const fallbackColor = layerColorInput?.value || '#0079c1';
          const id = 'custom_layer_' + Date.now();

          let selectedCrs = document.getElementById('select-source-crs')?.value || 'AUTO';
          const isMeters = detectCoordinatesInMeters(loadedGeoJSON);
          let wasReprojected = false;

          // Jika koordinat data masih berupa angka meter (|X| > 180 atau |Y| > 90)
          // atau pengguna memilih CRS proyeksi secara eksplisit
          if (isMeters || (selectedCrs !== 'AUTO' && selectedCrs !== 'EPSG:4326')) {
            if (selectedCrs === 'AUTO') {
              selectedCrs = suggestBestCrs(loadedGeoJSON);
            }
            try {
              console.log(`Mereproyeksi layer "${layerName}" dari CRS: ${selectedCrs} ke WGS 84...`);
              loadedGeoJSON = reprojectGeoJSON(loadedGeoJSON, selectedCrs, 'EPSG:4326');
              wasReprojected = true;
            } catch (repErr) {
              console.error('Error saat reproyeksi koordinat:', repErr);
              alert('Gagal mereproyeksi sistem koordinat: ' + repErr.message);
              return;
            }
          }

          const newLayerConf = {
            id: id,
            name: layerName,
            group: 'Layer Tambahan (Import)',
            type: 'polygon',
            visible: true,
            opacity: 0.8,
            sourceCrs: selectedCrs,
            dataSource: loadedGeoJSON,
            style: {
              fillColor: fallbackColor,
              color: fallbackColor,
              weight: 2,
              fillOpacity: 0.45
            },
            legend: {
              type: 'single',
              color: fallbackColor,
              borderColor: fallbackColor,
              label: layerName
            }
          };

          GIS_CONFIG.layers.push(newLayerConf);
          this.addVectorLayer(newLayerConf);
          this.renderLayerTree();
          this.populateAttributeLayerSelect();
          this.openAttributeTable(id);
          this.zoomToLayerExtent(id);

          if (modal) modal.classList.remove('open');
          const crsNote = wasReprojected ? ` (Reproyeksi ${selectedCrs} ➔ WGS 84)` : '';
          this.showToast(`Layer "${layerName}" (${loadedGeoJSON.features?.length || 0} fitur)${crsNote} berhasil ditambahkan secara akurat ke peta!`, 'success');
          return;
        }

        // 2. Eksekusi Tab Layanan WMS
        if (activeModalTab === 'pane-wms') {
          const wmsUrl = document.getElementById('input-wms-url')?.value.trim();
          const wmsLayers = document.getElementById('input-wms-layers')?.value.trim();
          const wmsTitle = document.getElementById('input-wms-title')?.value.trim() || wmsLayers || 'Layanan WMS';

          if (!wmsUrl || !wmsLayers) {
            alert('Harap masukkan URL WMS dan Nama Layer WMS.');
            return;
          }

          const id = 'wms_' + Date.now();
          const legendUrl = `${wmsUrl.split('?')[0]}?SERVICE=WMS&REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${encodeURIComponent(wmsLayers)}`;

          const newLayerConf = {
            id: id,
            name: wmsTitle,
            group: 'Layanan Web (WMS)',
            type: 'wms',
            wmsUrl: wmsUrl,
            wmsLayers: wmsLayers,
            legendUrl: legendUrl,
            visible: true,
            opacity: 0.8,
            zIndex: 20
          };

          GIS_CONFIG.layers.push(newLayerConf);
          this.addVectorLayer(newLayerConf);
          this.renderLayerTree();

          if (modal) modal.classList.remove('open');
          this.showToast(`Layanan WMS "${wmsTitle}" berhasil dihubungkan!`, 'success');
          return;
        }

        // 3. Eksekusi Tab Layanan WFS
        if (activeModalTab === 'pane-wfs') {
          const wfsUrl = document.getElementById('input-wfs-url')?.value.trim();
          const wfsTypeName = document.getElementById('input-wfs-typename')?.value.trim();
          const wfsTitle = document.getElementById('input-wfs-title')?.value.trim() || wfsTypeName || 'Layanan WFS';

          if (!wfsUrl || !wfsTypeName) {
            alert('Harap masukkan URL WFS dan Feature Type Name.');
            return;
          }

          btnConfirmUpload.disabled = true;
          btnConfirmUpload.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengunduh data WFS...';

          try {
            const cleanUrl = wfsUrl.split('?')[0];
            const queryUrl = `${cleanUrl}?service=WFS&version=1.1.0&request=GetFeature&typeName=${encodeURIComponent(wfsTypeName)}&outputFormat=application/json`;

            const res = await fetch(queryUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const geojson = await res.json();

            const id = 'wfs_' + Date.now();
            const newLayerConf = {
              id: id,
              name: wfsTitle,
              group: 'Layanan Vektor (WFS)',
              type: 'polygon',
              visible: true,
              opacity: 0.8,
              dataSource: geojson,
              style: {
                fillColor: '#0079c1',
                color: '#005e95',
                weight: 2,
                fillOpacity: 0.4
              },
              legend: {
                type: 'single',
                color: '#0079c1',
                borderColor: '#005e95',
                label: wfsTitle
              }
            };

            GIS_CONFIG.layers.push(newLayerConf);
            this.addVectorLayer(newLayerConf);
            this.renderLayerTree();
            this.populateAttributeLayerSelect();
            this.openAttributeTable(id);
            this.zoomToLayerExtent(id);

            if (modal) modal.classList.remove('open');
            this.showToast(`Data WFS "${wfsTitle}" (${geojson.features?.length || 0} fitur) berhasil dimuat!`, 'success');

          } catch (err) {
            alert(`Gagal mengambil data WFS: ${err.message}. Pastikan server mengizinkan CORS dan mendukung output GeoJSON.`);
          } finally {
            btnConfirmUpload.disabled = false;
            btnConfirmUpload.innerHTML = '<i class="fa-solid fa-plus"></i> Tambahkan ke Peta';
          }
        }
      });
    }
  }

  /**
   * 11. Statistik Spasial
   */
  updateStatsOverview() {
    const totalLayers = GIS_CONFIG.layers.length;
    let activeLayers = 0;
    let totalFeatures = 0;

    GIS_CONFIG.layers.forEach(l => {
      if (l.visible) activeLayers++;
      if (l.dataSource && l.dataSource.features) {
        totalFeatures += l.dataSource.features.length;
      }
    });

    const totLayEl = document.getElementById('stat-total-layers');
    if (totLayEl) totLayEl.textContent = totalLayers;

    const actLayEl = document.getElementById('stat-active-layers');
    if (actLayEl) actLayEl.textContent = activeLayers;

    const totFeatEl = document.getElementById('stat-total-features');
    if (totFeatEl) totFeatEl.textContent = totalFeatures;
  }

  /**
   * 12. Toast Notification
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'danger') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${icon}" style="font-size: 1.1rem; color: ${type === 'danger' ? '#e74c3c' : (type === 'success' ? '#27ae60' : '#0079c1')};"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

window.app = null;
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WebGISApp();
});
