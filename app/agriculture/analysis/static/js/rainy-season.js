$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // offcanvas map controls
    setOffCanvasMapControlAgriculture('daily');

    ////////////
    // Modal Expand Charts

    $('.daily-series-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#daily-series-rseason-control')
    });
    $('.daily-series-select2').css('z-index', 9999);
    $('#btn-div-chart-series').on('click', () => {
        setRainySeasonExpandModalSeries('daily', 'div-chart-series');
    });

    $('.daily-proba-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#daily-proba-rseason-control')
    });
    $('#btn-div-chart-proba').on('click', () => {
        setRainySeasonExpandModalProba('daily', 'div-chart-proba');
    });

    $('.daily-anom-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#daily-anom-rseason-control')
    });
    $('#btn-div-chart-anom').on('click', () => {
        setRainySeasonExpandModalAnom('daily', 'div-chart-anom');
    });

    ////////////
    // initialize map
    const map_options = {};
    displayAgricultureAnalysisMap('daily', map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        displayAgricultureAnalysisMap('daily', map_options, map);
    });

    // 
    $('#map-control-redraw').on('click', () => {
        displayAgricultureAnalysisMap('daily', map_options, map);
    });

    ////////////
    $('#input-time-navigation').on('blur', async () => {
        const ret = await setMapDatesNavInput('daily');
        if (ret) {
            displayAgricultureAnalysisMap('daily', map_options, map);
        }
    });

    $('#prev-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavPrev('daily');
        if (ret) {
            displayAgricultureAnalysisMap('daily', map_options, map);
        }
    });

    $('#next-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavNext('daily');
        if (ret) {
            displayAgricultureAnalysisMap('daily', map_options, map);
        }
    });

    ///////////



});