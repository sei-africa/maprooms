const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const modulesRoot = path.join(projectRoot, 'node_modules');
const vendorRoot = path.join(projectRoot, 'app', 'static', 'libs');

const assets = {
    bootstrap: [
        ['bootstrap/dist/css/bootstrap.min.css', 'bootstrap.min.css'],
        ['bootstrap/dist/js/bootstrap.bundle.min.js', 'bootstrap.bundle.min.js'],
        ['bootstrap-icons/font/bootstrap-icons.min.css', 'bootstrap-icons.min.css'],
        ['bootstrap-icons/font/fonts', 'fonts']
    ],
    jquery: [['jquery/dist/jquery.min.js', 'jquery.min.js']],
    leaflet: [
        ['leaflet/dist/leaflet.css', 'leaflet.css'],
        ['leaflet/dist/leaflet.js', 'leaflet.js'],
        ['leaflet/dist/images', 'images'],
        ['leaflet-mouse-position/src/L.Control.MousePosition.css', 'L.Control.MousePosition.css'],
        ['leaflet-mouse-position/src/L.Control.MousePosition.js', 'L.Control.MousePosition.js'],
        ['leaflet-spin/leaflet.spin.min.js', 'leaflet.spin.min.js'],
        ['leaflet-geotiff/leaflet-geotiff.js', 'leaflet-geotiff.js'],
        ['leaflet-geotiff/leaflet-geotiff-plotty.js', 'leaflet-geotiff-plotty.js']
    ],
    plotly: [['plotly.js-dist-min/plotly.min.js', 'plotly.min.js']],
    select2: [
        ['select2/dist/css/select2.min.css', 'select2.min.css'],
        ['select2/dist/js/select2.min.js', 'select2.min.js']
    ],
    turf: [['@turf/turf/turf.min.js', 'turf.min.js']],
    masonry: [['masonry-layout/dist/masonry.pkgd.min.js', 'masonry.pkgd.min.js']],
    spin: [['spin.js/spin.min.js', 'spin.min.js']],
    dom_to_image: [['dom-to-image-more/dist/dom-to-image-more.min.js', 'dom-to-image-more.min.js']],
    jsuites: [
        ['jsuites/dist/jsuites.js', 'jsuites.js'],
        ['jsuites/dist/jsuites.css', 'jsuites.css']
    ],
    geotiff: [['geotiff/dist-browser/geotiff.js', 'geotiff.js']],
    plotty: [['plotty/dist/plotty.min.js', 'plotty.min.js']]
};

function copyAsset(sourceRelative, destinationRelative) {
    const source = path.join(modulesRoot, sourceRelative);
    const destination = path.join(vendorRoot, destinationRelative);
    if (!fs.existsSync(source)) {
        throw new Error(`Missing vendor asset: ${sourceRelative}`);
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
}

fs.rmSync(vendorRoot, { recursive: true, force: true });
fs.mkdirSync(vendorRoot, { recursive: true });

for (const [library, files] of Object.entries(assets)) {
    for (const [source, destination] of files) {
        copyAsset(source, path.join(library, destination));
    }
}

console.log(`Copied browser dependencies to ${vendorRoot}`);
