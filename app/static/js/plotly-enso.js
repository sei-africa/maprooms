function preview_seasonal_teleconnections(tempRes) {
    preview_analysis_enso_alert(tempRes, 'div-chart-enso');

}

function preview_analysis_enso_alert(tempRes, contID) {
    const query = new Object();
    query.theme = $('html').attr('data-bs-theme');
    ajaxDisplayChart(
        '/climate_analysis_enso_alert',
        query,
        preview_analysis_display_enso_alert,
        contID
    );
}

function preview_analysis_display_enso_alert(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    const img = $('<img>', {
        id: 'enso-alert-system',
        src: json.png
    }).appendTo(divCont);

    img.css({
        'width': '100%',
        'height': '100%',
        'object-fit': 'cover'
    });
}