$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // set default colorbar
    $('#colorbar-color-preset-select').val('tercile_enso');

    // offcanvas map controls
    setOffCanvasMapControlTelecon('seasonal');

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

    $('.seasonal-tseries-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#seasonal-tseries-telecon-control')
    });
    $('#btn-div-chart-tseries').on('click', () => {
        setAnalysisExpandModalTelecon('seasonal', 'div-chart-tseries', 'tseries');
    });

    $('.seasonal-proba-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#seasonal-proba-telecon-control')
    });
    $('#btn-div-chart-proba').on('click', () => {
        setAnalysisExpandModalTelecon('seasonal', 'div-chart-proba', 'proba');
    });

    ////////////
    // initialize map
    const map_options = {};
    const initialMapRequest = displayClimateAnalysisMapTelecon('seasonal', map_options, map);

    // ENSO dial
    ensoRenderDialChart(initialMapRequest);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        displayClimateAnalysisMapTelecon('seasonal', map_options, map);
    });

    // redraw map
    $('#map-control-redraw').on('click', () => {
        displayClimateAnalysisMapTelecon('seasonal', map_options, map);
    });

    ////////////
    $('#input-time-navigation').on('blur', async () => {
        const ret = await setMapDatesNavInput('seasonal');
        if (ret) {
            displayClimateAnalysisMapTelecon('seasonal', map_options, map);
        }
    });

    $('#prev-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavPrev('seasonal');
        if (ret) {
            displayClimateAnalysisMapTelecon('seasonal', map_options, map);
        }
    });

    $('#next-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavNext('seasonal');
        if (ret) {
            displayClimateAnalysisMapTelecon('seasonal', map_options, map);
        }
    });

    ///////////
    // display preview time series on click on map, or select polygon
    mapClickLayersSpatialAverage(preview_seasonal_teleconnections, 'seasonal', map);

    $('#select-country-region').on('change', () => {
        mapClickLayersSpatialAverage(preview_seasonal_teleconnections, 'seasonal', map);
    });

    $('#select-region-name').on('change', () => {
        mapClickLayersSpatialAverage(preview_seasonal_teleconnections, 'seasonal', map);
    });

    ///////////
    // display pdf enso def
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

function ensoRenderDialChart(init_map) {
    if (init_map && init_map.always) {
        init_map.always(() => {
            preview_analysis_enso_alert('seasonal', 'div-chart-enso');
        });
    } else {
        preview_analysis_enso_alert('seasonal', 'div-chart-enso');
    }

    $('#btn-theme-toggle').on('click', () => {
        preview_analysis_enso_alert('seasonal', 'div-chart-enso');
    });
}