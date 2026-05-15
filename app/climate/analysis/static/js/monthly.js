$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    let map = createLeafletTileLayer('div-map-container', MTO_INIT);

    // initialize select2 for modal expand
    $('.monthly-raw-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#monthly-raw-control')
    });

    $('.monthly-anom-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#monthly-anom-control')
    });

    $('.monthly-clim-select2').select2({
        minimumResultsForSearch: -1,
        dropdownParent: $('#monthly-clim-control')
    });

    ////////////
    $('#btn-div-chart-raw').on('click', () => {
        const idc = 'div-chart-raw';
        showModalDialog(`modal-expand-${idc}`);
        expandModalCharts(
            idc,
            expand_charts_monthly_rawdata
        );

        const end_date = $('#monthly-chart-raw-enddate-calendar').val();
        if (end_date === '') {
            var disp_end = null;
        } else {
            var disp_end = end_date;
        }
        monthlyDateCalendar(
            'monthly-chart-raw-enddate',
            'monthly-chart-raw-variable',
            DATA_SET.rawdata.dataset,
            disp_end
        );

        const start_date = $('#monthly-chart-raw-startdate-calendar').val();
        if (start_date === '') {
            const trange = getTemporalRangeCalendar(
                DATA_SET.rawdata.dataset,
                'monthly',
                $('#monthly-chart-raw-variable').val(),
                5
            );
            var disp_start = trange.start;
        } else {
            var disp_start = start_date;
        }
        monthlyDateCalendar(
            'monthly-chart-raw-startdate',
            'monthly-chart-raw-variable',
            DATA_SET.rawdata.dataset,
            disp_start
        );

        monthsNamesCalendar(
            'monthly-chart-raw-startmonth',
            $('#monthly-raw-control')
        );

        //
        const contChart = `container-chart-${idc}`;

        const updateRawSeriesControls = () => {
            if ($('#monthly-chart-raw-series').val() === 'one') {
                $('#monthly-chart-raw-startmonth-list').hide();
            } else {
                $('#monthly-chart-raw-startmonth-list').show();
            }
        };
        updateRawSeriesControls();

        $('#monthly-chart-raw-series')
            .off('change.monthlyRaw')
            .on('change.monthlyRaw', function() {
                updateRawSeriesControls();
                maproomDB.getData('ts_rawdata', function(data) {
                    expand_charts_monthly_display_rawdata(data, contChart);
                });
            });

        $('#monthly-chart-raw-variable')
            .off('change.monthlyRaw')
            .on('change.monthlyRaw', function() {
                expand_charts_monthly_rawdata(contChart);
            });

        $('#monthly-chart-raw-startmonth-calendar')
            .off('change.monthlyRaw')
            .on('change.monthlyRaw', function() {
                maproomDB.getData('ts_rawdata', function(data) {
                    expand_charts_monthly_display_rawdata(data, contChart);
                });
            });

        // update chart
        $(`#plotly-replot-${idc}`)
            .off('click.monthlyRaw')
            .on('click.monthlyRaw', function() {
                expand_charts_monthly_rawdata(contChart);
            });

        // download chart
        $(`#plotly-download-${idc}`)
            .off('click.monthlyRaw')
            .on('click.monthlyRaw', function() {
                downloadPlotlyImageJPG(contChart);
            });
    });

    ////////////
    $('#btn-div-chart-clim').on('click', () => {
        const idc = 'div-chart-clim';
        showModalDialog(`modal-expand-${idc}`);
        expandModalCharts(
            idc,
            expand_charts_monthly_climato
        );

        // 
        const contChart = `container-chart-${idc}`;

        const updateClimatoChartControls = () => {
            if ($('#monthly-chart-clim-charts').val() === 'one') {
                $('#monthly-chart-clim-variable-cont').show();
            } else {
                $('#monthly-chart-clim-variable-cont').hide();
            }
        };
        updateClimatoChartControls();

        $('#monthly-chart-clim-charts')
            .off('change.monthlyClim')
            .on('change.monthlyClim', function() {
                updateClimatoChartControls();
                expand_charts_monthly_climato(contChart);
            });

        $('#monthly-chart-clim-variable')
            .off('change.monthlyClim')
            .on('change.monthlyClim', function() {
                expand_charts_monthly_climato(contChart);
            });

        // set base period
        setBoxDialog(
            'monthly-chart-clim-bp',
            'monthly-chart-clim-bp-open'
        );

        // update chart
        $(`#plotly-replot-${idc}`)
            .off('click.monthlyClim')
            .on('click.monthlyClim', function() {
                expand_charts_monthly_climato(contChart);
            });

        // download chart
        $(`#plotly-download-${idc}`)
            .off('click.monthlyClim')
            .on('click.monthlyClim', function() {
                downloadPlotlyImageJPG(contChart);
            });
    });

    ////////////
    $('#btn-div-chart-anom').on('click', () => {
        const idc = 'div-chart-anom';
        showModalDialog(`modal-expand-${idc}`);
        expandModalCharts(
            idc,
            expand_charts_monthly_anomaly
        );

        const end_date = $('#monthly-chart-anom-enddate-calendar').val();
        if (end_date === '') {
            var disp_end = null;
        } else {
            var disp_end = end_date;
        }
        monthlyDateCalendar(
            'monthly-chart-anom-enddate',
            'monthly-chart-anom-variable',
            DATA_SET.anomaly.dataset,
            disp_end
        );

        const start_date = $('#monthly-chart-anom-startdate-calendar').val();
        if (start_date === '') {
            const trange = getTemporalRangeCalendar(
                DATA_SET.anomaly.dataset,
                'monthly',
                $('#monthly-chart-anom-variable').val(),
                30
            );
            var disp_start = trange.start;
        } else {
            var disp_start = start_date;
        }
        monthlyDateCalendar(
            'monthly-chart-anom-startdate',
            'monthly-chart-anom-variable',
            DATA_SET.anomaly.dataset,
            disp_start
        );

        monthsNamesCalendar(
            'monthly-chart-anom-months',
            $('#monthly-anom-control')
        );

        //
        const contChart = `container-chart-${idc}`;

        const updateAnomalySeriesControls = () => {
            if ($('#monthly-chart-anom-series').val() === 'one') {
                $('#monthly-chart-anom-months-list').hide();
            } else {
                $('#monthly-chart-anom-months-list').show();
            }
        };
        updateAnomalySeriesControls();

        $('#monthly-chart-anom-series')
            .off('change.monthlyAnom')
            .on('change.monthlyAnom', function() {
                updateAnomalySeriesControls();
                maproomDB.getData('ts_anomaly', function(data) {
                    expand_charts_monthly_display_anomaly(data, contChart);
                });
            });

        $('#monthly-chart-anom-variable')
            .off('change.monthlyAnom')
            .on('change.monthlyAnom', function() {
                expand_charts_monthly_anomaly(contChart);
            });

        // 
        $('#monthly-chart-anom-type')
            .off('change.monthlyAnom')
            .on('change.monthlyAnom', function() {
                expand_charts_monthly_anomaly(contChart);
            });

        $('#monthly-chart-anom-months-calendar')
            .off('change.monthlyAnom')
            .on('change.monthlyAnom', function() {
                maproomDB.getData('ts_anomaly', function(data) {
                    expand_charts_monthly_display_anomaly(data, contChart);
                });
            });

        // set base period
        setBoxDialog(
            'monthly-chart-anom-bp',
            'monthly-chart-anom-bp-open'
        );

        // update chart
        $(`#plotly-replot-${idc}`)
            .off('click.monthlyAnom')
            .on('click.monthlyAnom', function() {
                expand_charts_monthly_anomaly(contChart);
            });

        // download chart
        $(`#plotly-download-${idc}`)
            .off('click.monthlyAnom')
            .on('click.monthlyAnom', function() {
                downloadPlotlyImageJPG(contChart);
            });
    });

    ////////////
    $('#map-control-matplotlib').on('click', () => {
        showModalDialog('modal-map-matplotlib');
    });

    // initialize
    const map_options = {};
    display_map_climate_monthly(map_options, map);

    // display map when offcanvas hidden
    $('#map-control-offcanvas-dataselect').on('hidden.bs.offcanvas', () => {
        display_map_climate_monthly(map_options, map);
    });

    // 
    $('#map-control-redraw').on('click', () => {
        display_map_climate_monthly(map_options, map);
    });

    // 
    $('#input-time-navigation').on('blur', () => {
        const this_date = $('#input-time-navigation').val().trim();
        if (this_date === '') {
            flashMessage(JS_TEXT.date_missing, 'error');
            return;
        }
        const maptype = $('#monthly-map-type').val();
        if (maptype === 'climatology') {
            const months = getListOfMonthsCalendar().long;
            let m = months.indexOf(this_date);
            if (m === -1) {
                flashMessage(JS_TEXT.date_invalid, 'error');
                return;
            }
            $('#monthly-map-date-calendar').val(m + 1).trigger('change');
        } else {
            if (maptype === 'anomaly') {
                var dataset = DATA_SET.anomaly.dataset;
            } else {
                var dataset = DATA_SET.rawdata.dataset;
            }

            const str_time = `${this_date}-01 00:00:00`;
            const this_time = new Date(str_time);
            if (isNaN(this_time.getTime())) {
                flashMessage(JS_TEXT.date_invalid, 'error');
                return;
            }

            const variable = $('#monthly-map-variable').val();
            const temp_cov = getTempCoverageCalendar(dataset, 'monthly', variable);
            const start = new Date(temp_cov.start);
            const end = new Date(temp_cov.end);
            if (this_time < start || this_time > end) {
                flashMessage(JS_TEXT.date_outrange, 'error');
                return;
            }

            const calendarElement = document.getElementById('monthly-map-date-calendar');
            const calendar = calendarElement.calendar;
            if (calendar) {
                calendar.setValue(str_time);
            } else {
                flashMessage(JS_TEXT.date_calendar, 'error');
                return;
            }
        }

        display_map_climate_monthly(map_options, map);
    });

    $('#prev-time-navigation').on('click', () => {
        const this_date = $('#input-time-navigation').val().trim();
        if (this_date === '') {
            flashMessage(JS_TEXT.date_missing, 'error');
            return;
        }
        const maptype = $('#monthly-map-type').val();
        if (maptype === 'climatology') {
            const months = getListOfMonthsCalendar().long;
            let m = months.indexOf(this_date);
            if (m === -1) {
                flashMessage(JS_TEXT.date_invalid, 'error');
                return;
            }
            m = m - 1;
            if (m < 0) {
                m = 11;
            }
            $('#input-time-navigation').val(months[m]);
            $('#monthly-map-date-calendar').val(m + 1).trigger('change');
        } else {
            if (maptype === 'anomaly') {
                var dataset = DATA_SET.anomaly.dataset;
            } else {
                var dataset = DATA_SET.rawdata.dataset;
            }

            const str_time = `${this_date}-01 00:00:00`;
            const this_time = new Date(str_time);
            if (isNaN(this_time.getTime())) {
                flashMessage(JS_TEXT.date_invalid, 'error');
                return;
            }

            const variable = $('#monthly-map-variable').val();
            const temp_cov = getTempCoverageCalendar(dataset, 'monthly', variable);
            const start = new Date(temp_cov.start);
            const end = new Date(temp_cov.end);

            var prev_mon = addDateMonths(this_time, -1);
            if (prev_mon < start) {
                prev_mon = end;
            }
            const str_mon = formatDateToString(prev_mon);
            $('#input-time-navigation').val(str_mon.slice(0, 7));

            const calendarElement = document.getElementById('monthly-map-date-calendar');
            const calendar = calendarElement.calendar;
            if (calendar) {
                calendar.setValue(`${str_mon} 00:00:00`);
            } else {
                flashMessage(JS_TEXT.date_calendar, 'error');
                return;
            }
        }

        display_map_climate_monthly(map_options, map);
    });

    $('#next-time-navigation').on('click', () => {
        const this_date = $('#input-time-navigation').val().trim();
        if (this_date === '') {
            flashMessage(JS_TEXT.date_missing, 'error');
            return;
        }
        const maptype = $('#monthly-map-type').val();
        if (maptype === 'climatology') {
            const months = getListOfMonthsCalendar().long;
            let m = months.indexOf(this_date);
            if (m === -1) {
                flashMessage(JS_TEXT.date_invalid, 'error');
                return;
            }
            m = m + 1;
            if (m > 11) {
                m = 0;
            }
            $('#input-time-navigation').val(months[m]);
            $('#monthly-map-date-calendar').val(m + 1).trigger('change');
        } else {
            if (maptype === 'anomaly') {
                var dataset = DATA_SET.anomaly.dataset;
            } else {
                var dataset = DATA_SET.rawdata.dataset;
            }

            const str_time = `${this_date}-01 00:00:00`;
            const this_time = new Date(str_time);
            if (isNaN(this_time.getTime())) {
                flashMessage(JS_TEXT.date_invalid, 'error');
                return;
            }

            const variable = $('#monthly-map-variable').val();
            const temp_cov = getTempCoverageCalendar(dataset, 'monthly', variable);
            const start = new Date(temp_cov.start);
            const end = new Date(temp_cov.end);

            var prev_mon = addDateMonths(this_time, 1);
            if (prev_mon > end) {
                prev_mon = start;
            }
            const str_mon = formatDateToString(prev_mon);
            $('#input-time-navigation').val(str_mon.slice(0, 7));

            const calendarElement = document.getElementById('monthly-map-date-calendar');
            const calendar = calendarElement.calendar;
            if (calendar) {
                calendar.setValue(`${str_mon} 00:00:00`);
            } else {
                flashMessage(JS_TEXT.date_calendar, 'error');
                return;
            }
        }

        display_map_climate_monthly(map_options, map);
    });

    // 
    $('#monthly-map-variable').on('change', () => {
        //get data resolution
        const data_res = get_data_resolution_monthly();
        // set spatial average select
        setSelectSpatialAverage(data_res);
    });
    $('#monthly-map-variable').trigger('change');

    // 
    $('#monthly-map-type').on('change', () => {
        const maptype = $('#monthly-map-type').val();
        if (maptype === 'climatology') {
            monthsNamesCalendar('monthly-map-date');

            $('#monthly-map-anomaly').hide();
            $('#monthly-map-climato').show();

            const clim_fun = $('#monthly-map-climato-func').val();
            if (clim_fun === 'percentile') {
                $('#div-monthly-map-climato-freq').hide();
                $('#div-monthly-map-climato-perc').show();
            } else if (clim_fun === 'frequency') {
                $('#div-monthly-map-climato-perc').hide();
                $('#div-monthly-map-climato-freq').show();
            } else {
                $('#div-monthly-map-climato-perc').hide();
                $('#div-monthly-map-climato-freq').hide();
            }
        } else {
            if (maptype === 'anomaly') {
                $('#monthly-map-anomaly').show();
                var dataset = DATA_SET.anomaly.dataset;
            } else {
                $('#monthly-map-anomaly').hide();
                var dataset = DATA_SET.rawdata.dataset;
            }

            monthlyDateCalendar(
                'monthly-map-date',
                'monthly-map-variable',
                dataset
            );

            $('#monthly-map-climato').hide();
        }

        //get data resolution
        const data_res = get_data_resolution_monthly();
        // set spatial average select
        setSelectSpatialAverage(data_res);
    });
    $('#monthly-map-type').trigger('change');

    // 
    $('#monthly-map-climato-func').on('change', () => {
        const clim_fun = $('#monthly-map-climato-func').val();
        if (clim_fun === 'percentile') {
            $('#div-monthly-map-climato-freq').hide();
            $('#div-monthly-map-climato-perc').show();
        } else if (clim_fun === 'frequency') {
            $('#div-monthly-map-climato-perc').hide();
            $('#div-monthly-map-climato-freq').show();

            const hgt = $('#div-monthly-map-climato-freq .input-group-text').innerHeight();
            $('#select2-monthly-map-climato-freqOp-container')
                .parent('span').css({
                    'min-height': hgt
                });
        } else {
            $('#div-monthly-map-climato-perc').hide();
            $('#div-monthly-map-climato-freq').hide();
        }
    });
    $('#monthly-map-climato-func').trigger('change');

    ///////////
    // display preview time series on click on map, or select polygon
    mapClickLayersSpatialAverage(preview_display_charts_monthly, map);

    $('#select-country-region').on('change', () => {
        mapClickLayersSpatialAverage(preview_display_charts_monthly, map);
    });

    $('#select-region-name').on('change', () => {
        mapClickLayersSpatialAverage(preview_display_charts_monthly, map);
    });
});

///////////////////

function groupMonthlyDataByYear(ts_dates, ts_data, start_mon) {
    let parsed = [];
    for (let i = 0; i < ts_dates.length; i++) {
        let ym = ts_dates[i].split('-').slice(0, 2);
        parsed.push({
            year: parseInt(ym[0]),
            month: parseInt(ym[1]),
            value: ts_data[i]
        });
    }

    const groups = {};
    parsed.forEach(item => {
        const thisYear = (item.month >= start_mon) ? item.year : item.year - 1;
        if (!groups[thisYear]) groups[thisYear] = [];
        groups[thisYear].push(item);
    });

    for (let dataYear in groups) {
        const tyears = [];
        const values = [];

        for (let i = 0; i < 12; i++) {
            let month = ((start_mon - 1 + i) % 12) + 1;
            let year = parseInt(dataYear);
            if (month < start_mon) year += 1;

            const dateStr = `${year}-${String(month).padStart(2, '0')}`;
            const found = groups[dataYear].find(d => d.year === year && d.month === month);

            tyears.push(dateStr);
            values.push(found ? found.value : null);
        }
        groups[dataYear] = { tyears, values };
    }
    const years = Object.keys(groups);
    let dates = groups[years[0]].tyears;
    dates = dates.map(x => x + '-01');
    let data = [];
    for (const key in groups) {
        data.push({ year: key, values: groups[key].values })
    }
    return { dates: dates, values: data };
}

function get_data_resolution_monthly() {
    const maptype = $('#monthly-map-type option:selected').val();
    const variable = $('#monthly-map-variable option:selected').val();
    const dset = DATA_SET[maptype].dataset;
    const data = DATA_INFO[dset].monthly[variable];
    return data.spatial_resolution;
}

function query_params_spatial_average() {
    let query = new Object();

    const sp_avg = $('#support-spatial-average').val();
    query.geomExtract = sp_avg === 'gridpoint' ? 'points' : 'polygons';

    if (query.geomExtract === 'points') {
        query.pointsSource = 'upload';
        query.pointsList = getClickLoctation();
    } else {
        const subdiv = LAYERS.subdivision[sp_avg];
        query.shpSource = 'default';
        query.shpFile = subdiv.file;
        query.shpField = subdiv.field;
        query.Poly = getClickPolygon();
        if (query.Poly === null) {
            return false;
        }
    }
    return query;
}

///////////////////

function query_params_monthly_map() {
    let query = new Object();
    query.temporalRes = 'monthly';
    query.variable = $('#monthly-map-variable').val();
    query.mapType = $('#monthly-map-type').val();
    let date = $('#monthly-map-date-calendar').val();

    if (query.mapType === 'climatology') {
        date = date === '' ? '1' : date;
        query.climDate = Number(date);
        query.climFunction = $('#monthly-map-climato-func').val();
        if (query.climFunction == 'percentile') {
            query.precentileValue = $('#monthly-map-climato-perc').val();
        }
        if (query.climFunction == 'frequency') {
            query.frequencyOper = $('#monthly-map-climato-freqOp').val();
            query.frequencyThres = $('#monthly-map-climato-freqTh').val();
        }
        query.dataset = DATA_SET.climatology.dataset;
        // todo: add input for base period
        query.startYear = BASE_PERIOD.start_year;
        query.endYear = BASE_PERIOD.end_year;
        query.minYear = BASE_PERIOD.min_year;
    } else {
        query.Date = date;
        if (query.mapType === 'anomaly') {
            query.anomaly = $('#monthly-map-anomaly-type').val();
            query.dataset = DATA_SET.anomaly.dataset;
            // todo: add input for base period
            query.startYear = BASE_PERIOD.start_year;
            query.endYear = BASE_PERIOD.end_year;
            query.minYear = BASE_PERIOD.min_year;
        } else {
            query.dataset = DATA_SET.rawdata.dataset;
        }
    }

    const colorbar = colorbarGetData();
    if (!colorbar) {
        return false;
    }
    query.colorbar = colorbar;

    return query;
}

function display_map_climate_monthly(options, map) {
    const query = query_params_monthly_map();
    if (!query) {
        return false;
    }
    const endpoint = createEndpoint('climate_analysis', 'monthly_map');
    ajaxLeafletMap(endpoint, query, displayRasterImage, options, map);

    if (query.mapType === 'climatology') {
        var date = $('#monthly-map-date-calendar option:selected').text();
        if (date === '') {
            setTimeout(() => {
                var date = $('#monthly-map-date-calendar option:selected').text();
                map.displayText_date.update(date);
            }, 100);
        } else {
            map.displayText_date.update(date);
        }
    } else {
        map.displayText_date.update(query.Date);
    }
}

///////////////////

function expand_query_monthly_rawdata() {
    let query = query_params_spatial_average();
    if (!query) {
        return query;
    }

    query.temporalRes = 'monthly';
    query.dataset = DATA_SET.rawdata.dataset;
    query.variable = $('#monthly-chart-raw-variable').val();
    query.startDate = $('#monthly-chart-raw-startdate-calendar').val();
    query.endDate = $('#monthly-chart-raw-enddate-calendar').val();

    return Object.assign({}, query);
}

function expand_charts_monthly_rawdata(container_id) {
    const query = expand_query_monthly_rawdata();
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, 'monthly')) {
        flashMessage(JS_TEXT.point_outside, 'error');
        return false;
    }

    const endpoint = createEndpoint(
        'climate_analysis',
        'charts_monthly_rawdata'
    );
    ajaxDisplayChart(
        endpoint,
        query,
        expand_charts_monthly_display_rawdata,
        container_id,
        'ts_rawdata'
    );
}

function expand_charts_monthly_format_rawdata(json) {
    let jsc = makeCopy(json);
    const ts = $('#monthly-chart-raw-series').val();
    if (ts === 'years') {
        const mon = parseInt($('#monthly-chart-raw-startmonth-calendar').val());
        const dataYear = groupMonthlyDataByYear(jsc.time, jsc.values, mon);
        jsc.time = dataYear.dates;
        jsc.values = dataYear.values;

        var start = new Date(jsc.time[0]);
        start.setDate(start.getDate() - 5);
        start = formatDateToString(start);
        var end = new Date(jsc.time[11]);
        end.setDate(end.getDate() + 5);
        end = formatDateToString(end);
        jsc.xrange = [start, end];
    }
    jsc['chartType'] = ts;
    return jsc;
}

function expand_charts_monthly_display_rawdata(json_input, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    const json = expand_charts_monthly_format_rawdata(json_input);

    if (json.chartType === 'one') {
        showRangeselector(container, true);

        const var_precip = json.info.var.type === 'precip';

        const data = [{
            x: json.time,
            y: json.values,
            name: json.info.var.name,
            units: json.info.var.units,
            type: var_precip ? 'bar' : 'scatter',
            mode: 'lines',
            line: { color: '#17becf' },
            marker: { color: '#fc03fc' },
            hovertemplate: 'Date: %{x|%B %Y}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
        }];

        var common_layout = {
            xaxis: {
                type: 'date',
                // tickformat: '%b %Y',
                // dtick: 'M6',
                rangeslider: plotly_rangeslider,
            },
            yaxis: {
                range: json.yrange,
                tickvals: json.yticks,
                ticks: 'outside',
                ticklen: 8,
                fixedrange: true,
                title: {
                    text: `${json.info.var.name} [${json.info.var.units}]`,
                },
            }
        };

        if (var_precip) {
            var layout = {
                // margin: { b: 50 },
                xaxis: {
                    showline: true,
                    showgrid: false,
                    autotickangles: 'auto',
                },
                yaxis: {
                    showgrid: true,
                    griddash: 'dot',
                    tickfont: { color: '#fc03fc' }
                },
                shapes: [{
                    action: 'change-color',
                    type: 'rect',
                    xref: 'paper',
                    yref: 'paper',
                    x0: 0,
                    y0: 0,
                    x1: 1,
                    y1: 1,
                    line: {
                        color: plotly_themecolors[localStorage.getItem('theme')].color,
                        width: 0.8,
                        dash: 'solid'
                    },
                    layer: 'below',
                }]
            };
        } else {
            var layout = {
                xaxis: {
                    showline: true,
                    showgrid: true,
                    gridwidth: 0.3,
                    griddash: 'dot',
                    autotickangles: 'auto',
                },
                yaxis: {
                    tickfont: { color: '#17becf' },
                    showline: true,
                    showgrid: true,
                    gridwidth: 0.3,
                    griddash: 'dot',
                }
            };
        }

        layout = deepMerge(common_layout, layout);
        layout = deepMerge(setPlotlyColors(), layout);

        if (var_precip) {
            layout.xaxis.rangeslider.bgcolor = data[0].marker.color;
        } else {
            layout.xaxis.rangeslider.bgcolor = data[0].line.color;
        }

        Plotly.newPlot(
            container,
            data,
            deepMerge(expand_layout, layout),
            plotly_config
        );

        //// add range selector
        const last_date = new Date(json.time[json.time.length - 1]);
        const ranges = ['1Y', '5Y', '10Y', '15Y', '20Y', '30Y', 'ALL'];
        addRangeselector(container, ranges, last_date)
    } else {
        showRangeselector(container, false);
        const colors = formatColorsChart(json.values.length, 'rainbow');
        const data = json.values.map((x, i) => {
            return {
                x: json.time,
                y: x.values,
                name: x.year,
                units: json.info.var.units,
                type: 'scatter',
                mode: 'lines',
                line: {
                    width: 3,
                    color: colors[i]
                },
                hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            };
        });

        const theme = $('html').attr('data-bs-theme');

        var layout = {
            xaxis: {
                type: 'date',
                range: json.xrange,
                fixedrange: true,
                tickformat: '%b',
                dtick: 'M1',
                // ticklabelmode: 'period',
                showline: true,
                showgrid: true,
                gridwidth: 0.3,
                griddash: 'dot',
                hoverformat: json.info.var.name + ': ' + '%B',

                showspikes: true,
                spikemode: 'across',
                spikecolor: plotly_themecolors[theme].fontcolor,
                spikethickness: 2,
                spikedash: 'solid',
                spikesnap: 'cursor',
            },
            yaxis: {
                range: json.yrange,
                tickvals: json.yticks,
                ticks: 'outside',
                ticklen: 8,
                fixedrange: true,
                showline: true,
                showgrid: true,
                gridwidth: 0.3,
                griddash: 'dot',
                title: {
                    text: `${json.info.var.name} [${json.info.var.units}]`,
                },
            },
            // showlegend: false,
            hovermode: 'x unified',
            hoverlabel: hoverlabelColors(theme),
        };

        layout = deepMerge(setPlotlyColors(), layout);

        Plotly.newPlot(
            container,
            data,
            deepMerge(expand_layout, layout),
            plotly_config
        );
    }

    setPlotlyThemeColors(container);
    if (Plotly && Plotly.Plots) {
        Plotly.Plots.resize(document.getElementById(container));
    }
}

/////////

function expand_query_monthly_climato() {
    let query = query_params_spatial_average();
    if (!query) {
        return query;
    }

    query.chartType = $('#monthly-chart-clim-charts').val();
    query.temporalRes = 'monthly';
    query.dataset = DATA_SET.climatology.dataset;
    query.variable = $('#monthly-chart-clim-variable').val();
    query.startYear = parseInt($('#monthly-chart-clim-bp-start').val().trim());
    query.endYear = parseInt($('#monthly-chart-clim-bp-end').val().trim());
    query.minYear = parseInt($('#monthly-chart-clim-bp-min').val().trim());

    return query;
}

function expand_charts_monthly_climato(container_id) {
    const query = expand_query_monthly_climato();
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, 'monthly')) {
        return false;
    }

    const endpoint = createEndpoint(
        'climate_analysis',
        'charts_monthly_climato'
    );
    ajaxDisplayChart(
        endpoint,
        query,
        expand_charts_monthly_display_climato,
        container_id
    );
}

function expand_charts_monthly_display_climato(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();
    const theme = $('html').attr('data-bs-theme');

    if (json.chartType === 'multiple') {
        var data = [{
                x: json.time,
                y: json.values[0],
                name: json.info.precip.name,
                units: json.info.precip.units,
                type: 'bar',
                yaxis: 'y1',
                marker: { color: 'gray' },
                hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            },
            {
                x: json.time,
                y: json.values[1],
                name: json.info.tmin.name,
                units: json.info.tmin.units,
                type: 'scatter',
                mode: 'lines+markers',
                yaxis: 'y2',
                line: {
                    width: 6,
                    color: 'blue'
                },
                marker: { size: 12 },
                hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            },
            {
                x: json.time,
                y: json.values[2],
                name: json.info.tmax.name,
                units: json.info.tmax.units,
                type: 'scatter',
                mode: 'lines+markers',
                yaxis: 'y2',
                line: {
                    width: 6,
                    color: 'red'
                },
                marker: { size: 12 },
                hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            },
        ];

        var layout = {
            margin: { t: 10, b: 50, l: 60, r: 60 },
            xaxis: {
                type: 'date',
                fixedrange: true,
                tickformat: '%b',
                dtick: 'M1',
                ticklabelmode: 'period',
                showline: true,
                showgrid: true,
                gridwidth: 0.3,
                griddash: 'dot',
                hoverformat: 'Month' + ': ' + '%B',

                showspikes: true,
                spikemode: 'across',
                spikecolor: plotly_themecolors[theme].fontcolor,
                spikethickness: 2,
                spikedash: 'solid',
                spikesnap: 'cursor',
            },
            yaxis: {
                range: json.yrange1,
                tickvals: json.yticks1,
                side: 'left',
                ticks: 'outside',
                ticklen: 8,
                fixedrange: true,
                showline: true,
                // showgrid: true,
                // gridwidth: 0.3,
                // griddash: 'dot',
                title: {
                    text: `${json.info.precip.name} [${json.info.precip.units}]`,
                },
            },
            yaxis2: {
                range: json.yrange2,
                tickvals: json.yticks2,
                side: 'right',
                overlaying: 'y',
                ticks: 'outside',
                ticklen: 8,
                fixedrange: true,
                showline: true,
                showgrid: true,
                gridwidth: 0.3,
                griddash: 'dot',
                title: {
                    text: `${json.info.var.name} [${json.info.var.units}]`,
                },
            },
            showlegend: false,
            hovermode: 'x unified',
            hoverlabel: hoverlabelColors(theme),
        };
    } else {
        var data = [{
                x: json.time,
                y: json.values[0],
                name: 'Mean',
                units: json.info.var.units,
                type: 'bar',
                marker: { color: 'gray' },
                hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            },
            {
                x: json.time,
                y: json.values[1],
                name: '5th %-ile',
                units: json.info.var.units,
                type: 'scatter',
                mode: 'lines',
                line: {
                    width: 5,
                    color: 'green'
                },
                hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            },
            {
                x: json.time,
                y: json.values[2],
                name: '50th %-ile',
                units: json.info.var.units,
                type: 'scatter',
                mode: 'lines',
                line: {
                    width: 5,
                    color: 'blue'
                },
                hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            },
            {
                x: json.time,
                y: json.values[3],
                name: '95th %-ile',
                units: json.info.var.units,
                type: 'scatter',
                mode: 'lines',
                line: {
                    width: 5,
                    color: 'red'
                },
                hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            },
        ];

        var layout = {
            xaxis: {
                type: 'date',
                fixedrange: true,
                tickformat: '%b',
                dtick: 'M1',
                ticklabelmode: 'period',
                showline: true,
                showgrid: true,
                gridwidth: 0.3,
                griddash: 'dot',
                hoverformat: json.info.var.name + ': ' + '%B',

                showspikes: true,
                spikemode: 'across',
                spikecolor: plotly_themecolors[theme].fontcolor,
                spikethickness: 2,
                spikedash: 'solid',
                spikesnap: 'cursor',
            },
            yaxis: {
                range: json.yrange,
                tickvals: json.yticks,
                ticks: 'outside',
                ticklen: 8,
                fixedrange: true,
                showline: true,
                showgrid: true,
                gridwidth: 0.3,
                griddash: 'dot',
                title: {
                    text: `${json.info.var.name} [${json.info.var.units}]`,
                },
            },
            showlegend: false,
            hovermode: 'x unified',
            hoverlabel: hoverlabelColors(theme),
        };
    }

    layout.print_legend = 'climato';
    layout = deepMerge(setPlotlyColors(), layout);

    Plotly.newPlot(
        container,
        data,
        deepMerge(expand_layout, layout),
        plotly_config
    );

    setPlotlyThemeColors(container);
    if (Plotly && Plotly.Plots) {
        Plotly.Plots.resize(document.getElementById(container));
    }
}

/////////

function expand_query_monthly_anomaly() {
    let query = query_params_spatial_average();
    if (!query) {
        return query;
    }

    query.temporalRes = 'monthly';
    query.dataset = DATA_SET.anomaly.dataset;
    query.variable = $('#monthly-chart-anom-variable').val();
    query.anomaly = $('#monthly-chart-anom-type').val();

    query.startYear = parseInt($('#monthly-chart-anom-bp-start').val().trim());
    query.endYear = parseInt($('#monthly-chart-anom-bp-end').val().trim());
    query.minYear = parseInt($('#monthly-chart-anom-bp-min').val().trim());

    query.startDate = $('#monthly-chart-anom-startdate-calendar').val();
    query.endDate = $('#monthly-chart-anom-enddate-calendar').val();

    return Object.assign({}, query);
}

function expand_charts_monthly_anomaly(container_id) {
    const query = expand_query_monthly_anomaly();
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, 'monthly')) {
        return false;
    }

    const endpoint = createEndpoint(
        'climate_analysis',
        'charts_monthly_anomaly'
    );
    ajaxDisplayChart(
        endpoint,
        query,
        expand_charts_monthly_display_anomaly,
        container_id,
        'ts_anomaly'
    );
}

function expand_charts_monthly_format_anomaly(json) {
    let jsc = makeCopy(json);
    const ts = $('#monthly-chart-anom-series').val();
    if (ts === 'month') {
        const m = parseInt($('#monthly-chart-anom-months-calendar').val());
        const n = jsc.time.length;
        let dates = [];
        let values = [];
        for (let i = 0; i < n; i++) {
            let t = parseInt(jsc.time[i].split('-')[1]);
            if (t === m) {
                dates.push(jsc.time[i]);
                values.push(jsc.values[i]);
            }
        }
        jsc.time = dates;
        jsc.values = values;

        const mn = Math.min(...values);
        const mx = Math.max(...values);
        const max = Math.max(Math.abs(mn), Math.abs(mx));
        const breaks = pretty([-max, max], 7);
        let ylim = [breaks[0], breaks.at(-1)];
        const y10 = (ylim[1] - ylim[0]) * 0.1;
        ylim[0] = ylim[0] - y10;
        ylim[1] = ylim[1] + y10;
        jsc.yrange = ylim;
        jsc.yticks = breaks;
        jsc['month'] = m;
    }
    jsc['chartType'] = ts;
    return jsc;
}

function expand_charts_monthly_display_anomaly(json_input, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    const json = expand_charts_monthly_format_anomaly(json_input);

    if (json.info.var.type === 'precip') {
        var defColors = {
            negative: '#fd7e14',
            positive: '#198754',
            other: '#6c757d'
        }
    } else {
        var defColors = {
            negative: '#0d6efd',
            positive: '#dc3545',
            other: '#6c757d'
        }
    }
    const barColors = json.values.map(value => {
        if (value > 0) {
            return defColors.positive;
        } else if (value < 0) {
            return defColors.negative;
        } else {
            return defColors.other;
        }
    });

    const data = [{
        x: json.time,
        y: json.values,
        name: json.info.var.name,
        units: json.info.var.units,
        type: 'bar',
        marker: {
            color: barColors,
            line: {
                width: 0
            }
        },
        hovertemplate: 'Date: %{x|%B %Y}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
    }];

    var layout = {
        xaxis: {
            type: 'date',
            showline: true,
            showgrid: true,
            gridwidth: 0.3,
            griddash: 'dot',
            rangeslider: plotly_rangeslider,
            // ticks: 'outside',
            // ticklen: 8,
        },
        yaxis: {
            range: json.yrange,
            tickvals: json.yticks,
            ticks: 'outside',
            ticklen: 8,
            fixedrange: true,
            showline: true,
            showgrid: true,
            gridwidth: 0.3,
            griddash: 'dot',
            title: {
                text: `${json.info.var.name} [${json.info.var.units}]`,
            },
        }
    };

    layout = deepMerge(setPlotlyColors(), layout);
    layout.xaxis.rangeslider.bgcolor = defColors.positive;

    Plotly.newPlot(
        container,
        data,
        deepMerge(expand_layout, layout),
        plotly_config
    );

    //// add range selector
    const last_date = new Date(json.time[json.time.length - 1]);
    // const ranges = ['1Y', '5Y', '10Y', 'ALL'];
    const ranges = ['1Y', '5Y', '10Y', '15Y', '20Y', '30Y', 'ALL'];
    addRangeselector(container, ranges, last_date)

    setPlotlyThemeColors(container);
    if (Plotly && Plotly.Plots) {
        Plotly.Plots.resize(document.getElementById(container));
    }
}

///////////////////

function preview_display_charts_monthly() {
    preview_charts_monthly_rawdata();
    preview_charts_monthly_climato();
    preview_charts_monthly_anomaly();
}

function preview_query_monthly_temporal(dataset, variable, nb_year) {
    function format_date(date) {
        const arr = date.split('-');
        return arr.slice(0, 2).join('-');
    }

    let query = new Object();

    const date = getTemporalRangeCalendar(
        dataset,
        'monthly',
        variable,
        nb_year);
    query.startDate = format_date(date.start);
    query.endDate = format_date(date.end);
    return query;
}

///////

function preview_query_monthly_rawdata() {
    let query = query_params_spatial_average();
    if (!query) {
        return query;
    }

    query.temporalRes = 'monthly'
    query.dataset = DATA_SET.rawdata.dataset;
    query.variable = $('#monthly-map-variable').val();
    const dates = preview_query_monthly_temporal(query.dataset, query.variable, 5);

    return Object.assign({}, query, dates);
}

function preview_charts_monthly_rawdata() {
    const query = preview_query_monthly_rawdata();
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, 'monthly')) {
        flashMessage(JS_TEXT.point_outside, 'error');
        return false;
    }

    const endpoint = createEndpoint(
        'climate_analysis',
        'charts_monthly_rawdata'
    );
    ajaxDisplayChart(
        endpoint,
        query,
        preview_charts_monthly_display_rawdata,
        'div-chart-raw'
    );
}

function preview_charts_monthly_display_rawdata(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    const var_precip = json.info.var.type === 'precip';
    const data = [{
        x: json.time,
        y: json.values,
        name: json.info.var.name,
        units: json.info.var.units,
        type: var_precip ? 'bar' : 'scatter',
        mode: 'lines',
        line: { color: '#17becf' },
        marker: { color: '#fc03fc' },
        hovertemplate: 'Date: %{x|%B %Y}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
    }];

    var common_layout = {
        xaxis: {
            type: 'date',
            // tickformat: '%b %Y',
            // dtick: 'M6',
        },
        yaxis: {
            range: json.yrange,
            tickvals: json.yticks,
            fixedrange: true,
        }
    };

    if (var_precip) {
        var layout = {
            // margin: { b: 50 },
            xaxis: {
                showline: true,
                showgrid: false,
            },
            yaxis: {
                showgrid: true,
                griddash: 'dot',
                tickfont: { color: '#fc03fc' }
            },
            shapes: [{
                action: 'change-color',
                type: 'rect',
                xref: 'paper',
                yref: 'paper',
                x0: 0,
                y0: 0,
                x1: 1,
                y1: 1,
                line: {
                    color: plotly_themecolors[localStorage.getItem('theme')].color,
                    width: 0.8,
                    dash: 'solid'
                },
                layer: 'below',
            }]
        };
    } else {
        var layout = {
            xaxis: {
                showline: true,
                showgrid: true,
                gridwidth: 0.3,
                griddash: 'dot',
            },
            yaxis: {
                tickfont: { color: '#17becf' },
                showline: true,
                showgrid: true,
                gridwidth: 0.3,
                griddash: 'dot',
            }
        };
    }

    layout = deepMerge(common_layout, layout);
    layout = deepMerge(setPlotlyColors(), layout);

    const config = {
        displayModeBar: false
    };

    Plotly.newPlot(
        container,
        data,
        deepMerge(preview_layout, layout),
        config
    );

    setPlotlyThemeColors(container);
}

///////

function preview_query_monthly_anomaly() {
    let query = query_params_spatial_average();
    if (!query) {
        return query;
    }

    query.temporalRes = 'monthly'
    query.dataset = DATA_SET.anomaly.dataset;
    query.variable = $('#monthly-map-variable').val();
    // query.anomaly = 'standardized';
    query.anomaly = 'difference';
    query.startYear = BASE_PERIOD.start_year;
    query.endYear = BASE_PERIOD.end_year;
    query.minYear = BASE_PERIOD.min_year;
    const dates = preview_query_monthly_temporal(query.dataset, query.variable, 10);

    return Object.assign({}, query, dates);
}

function preview_charts_monthly_anomaly() {
    const query = preview_query_monthly_anomaly();
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, 'monthly')) {
        return false;
    }

    const endpoint = createEndpoint(
        'climate_analysis',
        'charts_monthly_anomaly'
    );
    ajaxDisplayChart(
        endpoint,
        query,
        preview_charts_monthly_display_anomaly,
        'div-chart-anom'
    );
}

function preview_charts_monthly_display_anomaly(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    if (json.info.var.type === 'precip') {
        var defColors = {
            negative: '#fd7e14',
            positive: '#198754',
            other: '#6c757d'
        }
    } else {
        var defColors = {
            negative: '#0d6efd',
            positive: '#dc3545',
            other: '#6c757d'
        }
    }

    const barColors = json.values.map(value => {
        if (value > 0) {
            return defColors.positive;
        } else if (value < 0) {
            return defColors.negative;
        } else {
            return defColors.other;
        }
    });

    const data = [{
        x: json.time,
        y: json.values,
        name: json.info.var.name,
        units: json.info.var.units,
        type: 'bar',
        marker: {
            color: barColors,
            line: {
                width: 0
            }
        },
        hovertemplate: 'Date: %{x|%B %Y}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
    }];

    var layout = {
        xaxis: {
            type: 'date',
            tickformat: '%Y',
            dtick: 'M12',
            showline: true,
            showgrid: true,
            gridwidth: 0.3,
            griddash: 'dot',
        },
        yaxis: {
            range: json.yrange,
            tickvals: json.yticks,
            fixedrange: true,
            showline: true,
            showgrid: true,
            gridwidth: 0.3,
            griddash: 'dot',
        },
    };

    layout = deepMerge(setPlotlyColors(), layout);

    const config = {
        displayModeBar: false
    };

    Plotly.newPlot(
        container,
        data,
        deepMerge(preview_layout, layout),
        config
    );

    setPlotlyThemeColors(container);
}

///////

function preview_query_monthly_climato() {
    let query = query_params_spatial_average();
    if (!query) {
        return query;
    }

    query.chartType = 'one';
    query.temporalRes = 'monthly'
    query.dataset = DATA_SET.climatology.dataset;
    query.variable = $('#monthly-map-variable').val();
    query.startYear = BASE_PERIOD.start_year;
    query.endYear = BASE_PERIOD.end_year;
    query.minYear = BASE_PERIOD.min_year;

    return query;
}

function preview_charts_monthly_climato() {
    const query = preview_query_monthly_climato();
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, 'monthly')) {
        return false;
    }

    const endpoint = createEndpoint(
        'climate_analysis',
        'charts_monthly_climato'
    );
    ajaxDisplayChart(
        endpoint,
        query,
        preview_charts_monthly_display_climato,
        'div-chart-clim'
    );
}

function preview_charts_monthly_display_climato(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    const data = [{
            x: json.time,
            y: json.values[0],
            name: 'Mean',
            units: json.info.var.units,
            type: 'bar',
            marker: { color: 'gray' },
            hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
        },
        {
            x: json.time,
            y: json.values[1],
            name: '5th %-ile',
            units: json.info.var.units,
            type: 'scatter',
            mode: 'lines',
            line: {
                width: 3,
                color: 'green'
            },
            hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
        },
        {
            x: json.time,
            y: json.values[2],
            name: '50th %-ile',
            units: json.info.var.units,
            type: 'scatter',
            mode: 'lines',
            line: {
                width: 3,
                color: 'blue'
            },
            hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
        },
        {
            x: json.time,
            y: json.values[3],
            name: '95th %-ile',
            units: json.info.var.units,
            type: 'scatter',
            mode: 'lines',
            line: {
                width: 3,
                color: 'red'
            },
            hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
        },
    ];

    const theme = $('html').attr('data-bs-theme');

    var layout = {
        xaxis: {
            type: 'date',
            fixedrange: true,
            tickformat: '%b',
            dtick: 'M1',
            ticklabelmode: 'period',
            tickangle: -45,
            showline: true,
            showgrid: true,
            gridwidth: 0.3,
            griddash: 'dot',
            hoverformat: json.info.var.name + ': ' + '%B',

            showspikes: true,
            spikemode: 'across',
            spikecolor: plotly_themecolors[theme].fontcolor,
            spikethickness: 2,
            spikedash: 'solid',
            spikesnap: 'cursor',
        },
        yaxis: {
            range: json.yrange,
            tickvals: json.yticks,
            fixedrange: true,
            showline: true,
            showgrid: true,
            gridwidth: 0.3,
            griddash: 'dot',
        },
        showlegend: false,
        hovermode: 'x unified',
        hoverlabel: hoverlabelColors(theme),
    };

    layout = deepMerge(setPlotlyColors(), layout);

    const config = {
        displayModeBar: false,
    };

    Plotly.newPlot(
        container,
        data,
        deepMerge(preview_layout, layout),
        config
    );

    setPlotlyThemeColors(container);
}