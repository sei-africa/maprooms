function easyPrintMap(map = MAP_BE) {
    if (map === undefined || typeof L.easyPrint !== 'function') {
        return;
    }

    const hiddenSelectors = [
        '.leaflet-bottom.leaflet-left > *',
        '#container-map-navigation > *'
    ];

    const togglePrintElements = (hide) => {
        hiddenSelectors.forEach((selector) => {
            $(selector).each(function() {
                const $element = $(this);
                if (hide) {
                    if ($element.data('easy-print-hidden') === true) {
                        return;
                    }
                    $element.data('easy-print-hidden', true);
                    $element.data('easy-print-visibility', $element.css('visibility'));
                    $element.css('visibility', 'hidden');
                } else {
                    const previousVisibility = $element.data('easy-print-visibility');
                    $element.css('visibility', previousVisibility || '');
                    $element.removeData('easy-print-hidden');
                    $element.removeData('easy-print-visibility');
                }
            });
        });
    };

    const prepareMapContainerForEasyPrint = () => {
        const container = map.getContainer();
        const size = map.getSize();
        const state = {
            width: container.style.width,
            height: container.style.height,
            position: container.style.position
        };

        if (!container.style.width || container.style.width.indexOf('px') === -1) {
            container.style.width = `${size.x}px`;
        }
        if (!container.style.height || container.style.height.indexOf('px') === -1) {
            container.style.height = `${size.y}px`;
        }
        if (!container.style.position) {
            container.style.position = 'relative';
        }

        map.invalidateSize(false);
        return state;
    };

    const restoreMapContainerAfterEasyPrint = (state) => {
        const container = map.getContainer();
        container.style.width = state.width;
        container.style.height = state.height;
        container.style.position = state.position;
        map.invalidateSize(false);
    };

    const waitForTiles = (callback) => {
        const tileLayer = map.basemapTiles;
        if (tileLayer === undefined || typeof tileLayer.isLoading !== 'function' || !tileLayer.isLoading()) {
            callback();
            return;
        }
        tileLayer.once('load', callback);
    };

    if (map.easyPrintControl === undefined) {
        map.easyPrintControl = L.easyPrint({
            tileLayer: map.basemapTiles,
            exportOnly: true,
            hidden: true,
            hideControlContainer: false,
            hideClasses: [],
            filename: 'save_current_map'
        }).addTo(map);
    }

    $('#map-control-save')
        .off('click.easyPrintMap')
        .on('click.easyPrintMap', () => {
            const containerState = prepareMapContainerForEasyPrint();
            map.easyPrintControl.options.tileLayer = map.basemapTiles;

            const restoreEverything = () => {
                togglePrintElements(false);
                restoreMapContainerAfterEasyPrint(containerState);
            };

            map.once('easyPrint-finished', restoreEverything);

            waitForTiles(() => {
                togglePrintElements(true);
                setTimeout(() => {
                    try {
                        map.easyPrintControl.printMap('CurrentSize', 'save_current_map');
                    } catch (error) {
                        console.error('Leaflet EasyPrint failed', error);
                        restoreEverything();
                    }
                }, 300);
            });

            // L.easyPrint 2.1.9 logs failed print promises internally but does not
            // emit an error event. This fallback restores the map controls/container
            // if the plugin fails before firing easyPrint-finished.
            setTimeout(restoreEverything, 6000);
        });
}