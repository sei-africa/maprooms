$(document).ready(function() {
    // $('[data-bs-toggle="tooltip"]').tooltip();
    const tTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tTriggerList].map(t => new bootstrap.Tooltip(t));

    let map = createLeafletTileLayer('div-map-container', MTO_INIT);
    setAnalysisDateCalendarMonDay('daily', 'map-date');

    $('#daily-map-parameters').on('change.dailyParameters', function(){
        $('#daily-map-def-number').toggle(['NumCD', 'NumHD'].includes($(this).val())); 
        setAnalysisStatProbaDaily('daily'); 
    });
    $('#daily-map-statistics').on('change.dailyStatistics', function(){
        setAnalysisStatProbaDaily('daily');
    });
    $('#daily-map-variable').on('change.dailyVariable', function(){
        setAnalysisStatProbaDaily('daily');
    });
    
    $('#daily-map-parameters').trigger('change');
    $('#daily-map-statistics').trigger('change');


});