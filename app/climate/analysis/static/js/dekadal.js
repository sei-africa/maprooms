$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // initialize select2 for modal expand
    $('.dekadal-raw-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#dekadal-raw-control')
    });

    $('.dekadal-anom-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#dekadal-anom-control')
    });

    $('.dekadal-clim-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#dekadal-clim-control')
    });

    ////////////
    // Modal Expand Charts
    $('#btn-div-chart-raw').on('click', () => {
        setAnalysisExpandModalRaw('dekadal', 'div-chart-raw');
    });

    //
    $('#btn-div-chart-clim').on('click', () => {
        setAnalysisExpandModalClim('dekadal', 'div-chart-clim');
    });

    //
    $('#btn-div-chart-anom').on('click', () => {
        setAnalysisExpandModalAnom('dekadal', 'div-chart-anom');
    });

    ////////////
    $('#map-control-matplotlib').on('click', () => {
        showModalDialog('modal-map-matplotlib');
    });

    ////////////
    // initialize map
    const map_options = {};
    displayClimateAnalysisMap('dekadal', map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        displayClimateAnalysisMap('dekadal', map_options, map);
    });

    // offcanvas map controls
    setOffCanvasMapControl('dekadal');

    // 
    $('#map-control-redraw').on('click', () => {
        displayClimateAnalysisMap('dekadal', map_options, map);
    });

    ////////////
    $('#input-time-navigation').on('blur', async () => {
        const ret = await setMapDatesNavInput('dekadal');
        if (ret) {
            displayClimateAnalysisMap('dekadal', map_options, map);
        }
    });

    $('#prev-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavPrev('dekadal');
        if (ret) {
            displayClimateAnalysisMap('dekadal', map_options, map);
        }
    });

    $('#next-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavNext('dekadal');
        if (ret) {
            displayClimateAnalysisMap('dekadal', map_options, map);
        }
    });

    ///////////
    // display preview time series on click on map, or select polygon
    mapClickLayersSpatialAverage(preview_analysis_display_charts, 'dekadal', map);

    $('#select-country-region').on('change', () => {
        mapClickLayersSpatialAverage(preview_analysis_display_charts, 'dekadal', map);
    });

    $('#select-region-name').on('change', () => {
        mapClickLayersSpatialAverage(preview_analysis_display_charts, 'dekadal', map);
    });
});