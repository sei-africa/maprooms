$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // offcanvas map controls
    setOffCanvasMapControl('seasonal');

    ////////////
    // Modal Expand Charts

    ////////////
    // initialize map
    const map_options = {};
    // displayClimateAnalysisMap('seasonal', map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        // displayClimateAnalysisMap('seasonal', map_options, map);
    });

    // 
    $('#map-control-redraw').on('click', () => {
        // displayClimateAnalysisMap('seasonal', map_options, map);
    });

    ////////////
    $('#input-time-navigation').on('blur', async () => {
        const ret = await setMapDatesNavInput('seasonal');
        if (ret) {
            // displayClimateAnalysisMap('seasonal', map_options, map);
        }
    });

    $('#prev-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavPrev('seasonal');
        if (ret) {
            // displayClimateAnalysisMap('seasonal', map_options, map);
        }
    });

    $('#next-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavNext('seasonal');
        if (ret) {
            // displayClimateAnalysisMap('seasonal', map_options, map);
        }
    });

    ///////////


});