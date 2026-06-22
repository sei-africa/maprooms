$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);


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