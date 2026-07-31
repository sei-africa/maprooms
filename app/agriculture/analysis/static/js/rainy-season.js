$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // offcanvas map controls
    setOffCanvasMapControlAgriculture('daily');



    ////////////
    // initialize map
    const map_options = {};
    displayAgricultureAnalysisMap('daily', map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        displayAgricultureAnalysisMap('daily', map_options, map);
    });

});