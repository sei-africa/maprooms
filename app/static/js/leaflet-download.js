function downloadLeafletMap(map = MAP_BE) {
    if (map === undefined || typeof domtoimage === 'undefined') {
        return;
    }

    const mapContainer = map.getContainer();
    const hiddenSelectors = [
        '.leaflet-bottom.leaflet-left > *',
        '#container-map-navigation > *'
    ];

    function hideMapControlsForExport() {
        const hiddenElements = [];

        hiddenSelectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach((element) => {
                hiddenElements.push({
                    element: element,
                    visibility: element.style.visibility
                });
                element.style.visibility = 'hidden';
            });
        });

        return hiddenElements;
    }

    function restoreMapControlsAfterExport(hiddenElements) {
        hiddenElements.forEach((item) => {
            item.element.style.visibility = item.visibility;
        });
    }

    function waitForVisibleMap(callback) {
        map.invalidateSize(false);
        setTimeout(callback, 250);
    }

    function saveDataUrl(dataUrl, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    $('#map-control-save')
        .off('click.easyPrintMap')
        .on('click.easyPrintMap', () => {
            const hiddenElements = hideMapControlsForExport();

            waitForVisibleMap(() => {
                domtoimage.toPng(mapContainer, {
                    cacheBust: true,
                    bgcolor: '#ffffff',
                    width: mapContainer.offsetWidth,
                    height: mapContainer.offsetHeight,
                    style: {
                        transform: 'none'
                    }
                }).then((dataUrl) => {
                    saveDataUrl(dataUrl, 'leaflet_map.png');
                }).catch((error) => {
                    console.error('Saving the Leaflet map failed', error);
                    alert('Could not save the map. Please check the browser console for details.');
                }).finally(() => {
                    restoreMapControlsAfterExport(hiddenElements);
                    map.invalidateSize(false);
                });
            });
        });
}