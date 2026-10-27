$(document).ready(async function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // hide map navigation
    $('#container-map-navigation').hide();

    //// offcanvas map controls
    await setOffCanvas10DaysFcstMapControl('tendays');

    // try {
    //     await setOffCanvas10DaysFcstMapControl('tendays');
    // } catch (error) {
    //     console.error('Unable to initialize ten-day forecast controls:', error);
    //     return;
    // }

    ////////////
    // initialize map
    const map_options = {};
    displayClimate10daysFcstMap('tendays', map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        displayClimate10daysFcstMap('tendays', map_options, map);
    });

    //
    $('#map-control-redraw').on('click', () => {
        displayClimate10daysFcstMap('tendays', map_options, map);
    });
});