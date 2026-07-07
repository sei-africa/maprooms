$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // set default colorbar
    $('#colorbar-color-preset-select').val('tercile_enso');

    // offcanvas map controls
    setOffCanvasMapControlEnso('seasonal');

    ////////////
    // Modal Expand Charts
    // initialize select2 for modal expand
    $('.seasonal-enso-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#seasonal-enso-control')
    });
    $('#btn-div-chart-enso').on('click', () => {
        setAnalysisExpandModalEnso('seasonal', 'div-chart-enso');
    });

    ////////////
    // initialize map
    const map_options = {};
    displayClimateAnalysisMapEnso('seasonal', map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        displayClimateAnalysisMapEnso('seasonal', map_options, map);
    });

    // 
    $('#map-control-redraw').on('click', () => {
        displayClimateAnalysisMapEnso('seasonal', map_options, map);
    });

    ////////////
    $('#input-time-navigation').on('blur', async () => {
        const ret = await setMapDatesNavInput('seasonal');
        if (ret) {
            displayClimateAnalysisMapEnso('seasonal', map_options, map);
        }
    });

    $('#prev-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavPrev('seasonal');
        if (ret) {
            displayClimateAnalysisMapEnso('seasonal', map_options, map);
        }
    });

    $('#next-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavNext('seasonal');
        if (ret) {
            displayClimateAnalysisMapEnso('seasonal', map_options, map);
        }
    });

    ///////////
    preview_seasonal_teleconnections('seasonal');
    $('#btn-theme-toggle').on('click', () => {
        preview_seasonal_teleconnections('seasonal');
    });

    ///////////
    // enso def
    $('<a>', {
        href: '/enso_system_alert',
        target: '_blank',
        text: 'APCC ENSO alert system criteria'
    }).appendTo($('#div-tab-description'));
});

ensoDatasetTempCoverage(DATA_ENSO)
    .then((updatedDataset) => {
        // console.log(updatedDataset);
    })
    .catch((err) => {
        console.error(err);
    });