$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // offcanvas map controls
    setOffCanvasMapControl('monthly');

    ////////////
    // Modal Expand Charts
    // initialize select2 for modal expand
    $('.monthly-raw-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#monthly-raw-control')
    });
    $('#btn-div-chart-raw').on('click', () => {
        setAnalysisExpandModalRaw('monthly', 'div-chart-raw');
    });

    //
    $('.monthly-clim-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#monthly-clim-control')
    });
    $('#btn-div-chart-clim').on('click', () => {
        setAnalysisExpandModalClim('monthly', 'div-chart-clim');
    });

    //
    $('.monthly-anom-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#monthly-anom-control')
    });
    $('#btn-div-chart-anom').on('click', () => {
        setAnalysisExpandModalAnom('monthly', 'div-chart-anom');
    });

    ////////////
    $('#map-control-matplotlib').on('click', () => {
        showModalDialog('modal-map-matplotlib');
    });

    ////////////
    // initialize map
    const map_options = {};
    displayClimateAnalysisMap('monthly', map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        displayClimateAnalysisMap('monthly', map_options, map);
    });

    // 
    $('#map-control-redraw').on('click', () => {
        displayClimateAnalysisMap('monthly', map_options, map);
    });

    ////////////
    $('#input-time-navigation').on('blur', async () => {
        const ret = await setMapDatesNavInput('monthly');
        if (ret) {
            displayClimateAnalysisMap('monthly', map_options, map);
        }
    });

    $('#prev-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavPrev('monthly');
        if (ret) {
            displayClimateAnalysisMap('monthly', map_options, map);
        }
    });

    $('#next-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavNext('monthly');
        if (ret) {
            displayClimateAnalysisMap('monthly', map_options, map);
        }
    });

    ///////////
    // display preview time series on click on map, or select polygon
    mapClickLayersSpatialAverage(preview_analysis_display_charts, 'monthly', map);

    $('#select-country-region').on('change', () => {
        mapClickLayersSpatialAverage(preview_analysis_display_charts, 'monthly', map);
    });

    $('#select-region-name').on('change', () => {
        mapClickLayersSpatialAverage(preview_analysis_display_charts, 'monthly', map);
    });
});