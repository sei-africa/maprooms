$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // offcanvas map controls
    setOffCanvasMapControl('seasonal');

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