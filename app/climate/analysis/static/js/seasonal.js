$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // offcanvas map controls
    setOffCanvasMapControl('seasonal');

    ////////////
    // Modal Expand Charts
    // initialize select2 for modal expand
    $('.seasonal-anom-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#seasonal-anom-control')
    });
    $('#btn-div-chart-anom').on('click', () => {
        setAnalysisExpandModalAnom('seasonal', 'div-chart-anom');
    });

    $('.seasonal-proba-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#seasonal-proba-control')
    });
    $('#btn-div-chart-proba').on('click', () => {
        setAnalysisExpandModalProba('seasonal', 'div-chart-proba');
    });

    $('.seasonal-season-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#seasonal-season-control')
    });
    $('#btn-div-chart-season').on('click', () => {
        setAnalysisExpandModalSeason('seasonal', 'div-chart-season');
    });

    ////////////
    // initialize map
    const map_options = {};
    displayClimateAnalysisMap('seasonal', map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        displayClimateAnalysisMap('seasonal', map_options, map);
    });

    // 
    $('#map-control-redraw').on('click', () => {
        displayClimateAnalysisMap('seasonal', map_options, map);
    });

    ////////////
    $('#input-time-navigation').on('blur', async () => {
        const ret = await setMapDatesNavInput('seasonal');
        if (ret) {
            displayClimateAnalysisMap('seasonal', map_options, map);
        }
    });

    $('#prev-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavPrev('seasonal');
        if (ret) {
            displayClimateAnalysisMap('seasonal', map_options, map);
        }
    });

    $('#next-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavNext('seasonal');
        if (ret) {
            displayClimateAnalysisMap('seasonal', map_options, map);
        }
    });

    ///////////
    // display preview time series on click on map, or select polygon
    mapClickLayersSpatialAverage(preview_seasonal_display_charts, 'seasonal', map);

    $('#select-country-region').on('change', () => {
        mapClickLayersSpatialAverage(preview_seasonal_display_charts, 'seasonal', map);
    });

    $('#select-region-name').on('change', () => {
        mapClickLayersSpatialAverage(preview_seasonal_display_charts, 'seasonal', map);
    });
});