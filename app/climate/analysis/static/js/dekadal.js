$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // const printer = dekadal_setPrint(map);
    // printer.addTo(map);
    // $('#print-dekadal-map').on('click', function() {
    //     dekadal_manualPrint(printer);
    // });

});

// function dekadal_setPrint(map) {
//     const printer = L.easyPrint({
//         tileLayer: map.basemapTiles,
//         sizeModes: ['Current', 'A4Landscape', 'A4Portrait'],
//         filename: 'myMap',
//         exportOnly: true,
//         hideControlContainer: true
//     })
//     return printer;
// }

// function dekadal_manualPrint(printer) {
//     printer.printMap('CurrentSize', 'MyManualPrint');
// }