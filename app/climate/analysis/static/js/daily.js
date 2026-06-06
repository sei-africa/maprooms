$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // offcanvas map controls
    setOffCanvasMapControlDaily('daily');

    ////////////
    // Modal Expand Charts

    ////////////
    // initialize map
    const map_options = {};
    displayClimateAnalysisMap('daily', map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        displayClimateAnalysisMap('daily', map_options, map);
    });

    // 
    $('#map-control-redraw').on('click', () => {
        displayClimateAnalysisMap('daily', map_options, map);
    });

    ////////////
    $('#input-time-navigation').on('blur', async () => {
        const ret = await setMapDatesNavInput('daily');
        if (ret) {
            // displayClimateAnalysisMap('daily', map_options, map);
        }
    });

    $('#prev-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavPrev('daily');
        if (ret) {
            // displayClimateAnalysisMap('daily', map_options, map);
        }
    });

    $('#next-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavNext('daily');
        if (ret) {
            // displayClimateAnalysisMap('daily', map_options, map);
        }
    });

    ///////////


});