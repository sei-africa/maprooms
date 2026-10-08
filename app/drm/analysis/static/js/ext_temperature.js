$(document).ready(function() {
    // $('[data-bs-toggle="tooltip"]').tooltip();
    const tTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tTriggerList].map(t => new bootstrap.Tooltip(t));

    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // hide map time navigation
    $('#div-map-time-navigation').removeClass('d-flex').addClass('d-none');

    setOffCanvasMapControlsDrmExtTemp('daily');

    ////////////
    // Modal Expand Charts


    ////////////
    // initialize map
    const map_options = {};
    displayDrmAnalysisMap('daily', map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        displayDrmAnalysisMap('daily', map_options, map);
    });

    // 
    $('#map-control-redraw').on('click', () => {
        displayDrmAnalysisMap('daily', map_options, map);
    });


});