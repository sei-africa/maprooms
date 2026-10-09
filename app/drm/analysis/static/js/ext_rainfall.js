$(document).ready(function() {
    // $('[data-bs-toggle="tooltip"]').tooltip();
    const tTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tTriggerList].map(t => new bootstrap.Tooltip(t));

    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // hide map time navigation
    $('#div-map-time-navigation').removeClass('d-flex').addClass('d-none');

    setOffCanvasMapControlsDrmExtRain('daily');

    ////////////
    // Modal Expand Charts

    $('.daily-proba-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#daily-drmExtRain-control')
    });
    $('#btn-div-chart-cdf').on('click', () => {
        setAnalysisExpandModalDrmExtRain('daily', 'div-chart-cdf');
    });


    ////////////
    // initialize map
    const map_options = {};
    displayDrmAnalysisMap('daily', map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        displayDrmAnalysisMap('daily', map_options, map);
    });

    // 
    $('#map-control-redraw').on('click', () => {
        displayDrmAnalysisMap('daily', map_options, map);
    });

    ///////////
    // display preview time series on click on map, or select polygon
    mapClickLayersSpatialAverage(preview_drmExtRain_display_charts, 'daily', map);

    $('#select-country-region').on('change', () => {
        mapClickLayersSpatialAverage(preview_drmExtRain_display_charts, 'daily', map);
    });

    $('#select-region-name').on('change', () => {
        mapClickLayersSpatialAverage(preview_drmExtRain_display_charts, 'daily', map);
    });
});