function downloadLeafletMap(map = MAP_BE) {
    if (map === undefined || typeof domtoimage === 'undefined') {
        return;
    }

    const mapContainer = map.getContainer();
    const hiddenSelectors = [
        '.leaflet-bottom.leaflet-left > *',
        '#container-map-navigation > *',
        '.leaflet-bottom.leaflet-right > .leaflet-control-attribution'
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
        .off('click.downLeafletMap')
        .on('click.downLeafletMap', () => {
            const hiddenElements = hideMapControlsForExport();

            waitForVisibleMap(() => {
                // preserve colobar styles from map
                const preserveSelectors = [
                    '.leaflet-colorbar',
                    '.leaflet-colorbar table.ckeyh',
                    '.leaflet-colorbar table.ckeyh tr',
                    '.leaflet-colorbar table.ckeyh th',
                    '.leaflet-colorbar table.ckeyh td'
                ];

                const preservedStyles = [];

                preserveSelectors.forEach(selector => {
                    // 
                    document.querySelectorAll(selector).forEach(el => {
                        preservedStyles.push({
                            element: el,
                            style: el.getAttribute('style')
                        });

                        const computed = window.getComputedStyle(el);
                        const properties = [
                            'display', 'position', 'left', 'right', 'top', 'bottom',
                            'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
                            'margin', 'padding',
                            'background', 'backgroundColor', 'backgroundImage',
                            'border', 'borderTop', 'borderRight', 'borderBottom', 'borderLeft',
                            'borderCollapse', 'borderSpacing', 'borderRadius',
                            'boxShadow',
                            'font', 'fontSize', 'fontFamily', 'fontWeight', 'lineHeight',
                            'color', 'textAlign', 'verticalAlign', 'whiteSpace',
                            'opacity', 'zIndex'
                        ];
                        properties.forEach(prop => {
                            if (selector === '.leaflet-colorbar') {
                                // console.log(`${prop}: ${computed[prop]}`);
                                if (prop === 'height') {
                                    el.style[prop] = '65px';
                                } else {
                                    el.style[prop] = computed[prop];
                                }
                            } else {
                                el.style[prop] = computed[prop];
                            }
                        });
                    });
                });
                // 
                // Put colorbar at bottom right because attribution is hidden
                const colorbar = document.querySelector('.leaflet-colorbar');
                if (colorbar) {
                    colorbar.style.position = 'absolute';
                    colorbar.style.right = '0px';
                    colorbar.style.left = 'auto';
                    colorbar.style.bottom = '0px';
                    colorbar.style.top = 'auto';
                    colorbar.style.zIndex = '1000';
                }

                // 
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
                    // restore previous colobar styles
                    preservedStyles.forEach(item => {
                        if (item.style === null) {
                            item.element.removeAttribute('style');
                        } else {
                            item.element.setAttribute('style', item.style);
                        }
                    });

                    // 
                    restoreMapControlsAfterExport(hiddenElements);
                    map.invalidateSize(false);
                });
            });
        });
}