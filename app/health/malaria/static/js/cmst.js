
$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();

    let map = createLeafletTileLayer(
        'div-map-container',
        MTO_INIT
    );

    setOffCanvasMapControlHealthCmst('monthly');

    $('.monthly-cmst-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#monthly-cmst-control')
    });

    $('#btn-div-chart-cmst').on('click', () => {
        setHealthExpandModalCmst(
            'monthly',
            'div-chart-cmst'
        );
    });

    $('#map-control-matplotlib').on('click', () => {
        showModalDialog('modal-map-matplotlib');
    });

    const map_options = {};

    displayHealthCmstMap(
        'monthly',
        map_options,
        map
    );


    $('#map-control-offcanvas-dataselect')
        .on('hidden.bs.offcanvas', () => {
            displayHealthCmstMap(
                'monthly',
                map_options,
                map
            );
        });

    $('#map-control-redraw').on('click', () => {
        displayHealthCmstMap(
            'monthly',
            map_options,
            map
        );
    });

    $('#input-time-navigation').on('blur', async () => {
        const ret = await setMapDatesNavInput('monthly');

        if (ret) {
            displayHealthCmstMap(
                'monthly',
                map_options,
                map
            );
        }
    });

    $('#prev-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavPrev('monthly');

        if (ret) {
            displayHealthCmstMap(
                'monthly',
                map_options,
                map
            );
        }
    });

    $('#next-time-navigation').on('click', async () => {
        const ret = await setMapDatesNavNext('monthly');

        if (ret) {
            displayHealthCmstMap(
                'monthly',
                map_options,
                map
            );
        }
    });


    mapClickLayersSpatialAverage(
        preview_health_cmst_display_charts,
        'monthly',
        map
    );

    $('#select-country-region').on('change', () => {
        mapClickLayersSpatialAverage(
            preview_health_cmst_display_charts,
            'monthly',
            map
        );
    });

    $('#select-region-name').on('change', () => {
        mapClickLayersSpatialAverage(
            preview_health_cmst_display_charts,
            'monthly',
            map
        );
    });
});
