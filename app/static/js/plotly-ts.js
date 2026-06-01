function preview_analysis_display_charts(tempRes) {
    preview_analysis_charts_rawdata(tempRes, 'div-chart-raw');
    preview_analysis_charts_climato(tempRes, 'div-chart-clim');
    preview_analysis_charts_anomaly(tempRes, 'div-chart-anom');
}

function preview_seasonal_display_charts(tempRes) {
    preview_analysis_charts_season(tempRes, 'div-chart-season');
    preview_analysis_charts_proba(tempRes, 'div-chart-proba');
    preview_analysis_charts_anomaly(tempRes, 'div-chart-anom');
}

function analysis_query_format_date(date, temp_res) {
    if (temp_res === 'monthly') {
        const arr_mo = date.split('-');
        return arr_mo.slice(0, 2).join('-');
    } else if (temp_res === 'dekadal') {
        return formatDekadDate(date);
    } else if (temp_res === 'seasonal') {
        return date.slice(0, 4);
    } else {
        return false;
    }
}

function preview_analysis_query_temporal(
    dataset, temp_res, variable, nb_year
) {
    let query = new Object();

    const date = getTemporalRangeCalendar(
        dataset, temp_res, variable, nb_year
    );
    query.startDate = analysis_query_format_date(
        date.start, temp_res
    );
    query.endDate = analysis_query_format_date(
        date.end, temp_res
    );

    return query;
}

///////////////////

function preview_analysis_query_anomaly(tempRes) {
    let query = queryParamsSpatialAverage();
    if (!query) {
        return query;
    }

    query.temporalRes = tempRes;
    query.dataset = DATA_SET.anomaly;
    query.variable = $(`#${tempRes}-map-variable`).val();
    query.anomaly = 'difference';
    query.startYear = BASE_PERIOD.start_year;
    query.endYear = BASE_PERIOD.end_year;
    query.minYear = BASE_PERIOD.min_year;

    if (tempRes === 'seasonal') {
        const tstepId = `${tempRes}-map-date`;
        query.seasStart = parseInt($(`#${tstepId}-calendar`).val(), 10);
        query.seasLength = parseInt($(`#${tstepId}-length`).val(), 10);
        query.fullYearTS = true;
    }

    const dates = preview_analysis_query_temporal(
        query.dataset, tempRes, query.variable, 10
    );

    return Object.assign({}, query, dates);
}

function preview_analysis_charts_anomaly(tempRes, contID) {
    const query = preview_analysis_query_anomaly(tempRes);
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, tempRes)) {
        return false;
    }

    ajaxDisplayChart(
        '/climate_analysis_anomaly',
        query,
        preview_analysis_display_anomaly,
        contID
    );
}

function preview_analysis_display_anomaly(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    const xaxisHoverText = json.time.map((t) => {
        return formatPlotlyHoverDate(
            t, json.info.time_res, json.info.seas_len
        );
    });

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
        customdata: xaxisHoverText,
        hovertemplate: 'Date: %{customdata}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
        // hovertemplate: 'Date: %{x|%B %Y}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
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

    purgePlotlyChart(container);
    Plotly.newPlot(
        container,
        data,
        deepMerge(preview_layout, layout),
        config
    );

    setPlotlyThemeColors(container);
}

///////

function preview_analysis_query_rawdata(tempRes) {
    let query = queryParamsSpatialAverage();
    if (!query) {
        return query;
    }

    query.temporalRes = tempRes;
    query.dataset = DATA_SET.rawdata;
    query.variable = $(`#${tempRes}-map-variable`).val();
    const dates = preview_analysis_query_temporal(
        query.dataset, tempRes, query.variable, 5
    );

    return Object.assign({}, query, dates);
}

function preview_analysis_charts_rawdata(tempRes, contID) {
    const query = preview_analysis_query_rawdata(tempRes);
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, tempRes)) {
        flashMessage(JS_TEXT.point_outside, 'error');
        return false;
    }

    ajaxDisplayChart(
        '/climate_analysis_rawdata',
        query,
        preview_analysis_display_rawdata,
        contID
    );
}

function preview_analysis_display_rawdata(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    const xaxisHoverText = json.time.map((t) => {
        return formatPlotlyHoverDate(t, json.info.time_res);
    });

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
        customdata: xaxisHoverText,
        hovertemplate: 'Date: %{customdata}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
        // hovertemplate: 'Date: %{x|%B %Y}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
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

    purgePlotlyChart(container);
    Plotly.newPlot(
        container,
        data,
        deepMerge(preview_layout, layout),
        config
    );

    setPlotlyThemeColors(container);
}

///////

function preview_analysis_query_climato(tempRes) {
    let query = queryParamsSpatialAverage();
    if (!query) {
        return query;
    }

    query.chartType = 'one';
    query.temporalRes = tempRes;
    query.dataset = DATA_SET.climatology;
    query.variable = $(`#${tempRes}-map-variable`).val();
    query.startYear = BASE_PERIOD.start_year;
    query.endYear = BASE_PERIOD.end_year;
    query.minYear = BASE_PERIOD.min_year;

    return query;
}

function preview_analysis_charts_climato(tempRes, contID) {
    const query = preview_analysis_query_climato(tempRes);
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, tempRes)) {
        return false;
    }

    ajaxDisplayChart(
        '/climate_analysis_climato',
        query,
        preview_analysis_display_climato,
        contID
    );
}

function preview_analysis_display_climato(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    ////
    let xaxis_hoverformat;
    if (json.info.time_res === 'monthly') {
        xaxis_hoverformat = json.info.var.name +
            ': ' + '%B';
    } else if (json.info.time_res === 'dekadal') {
        xaxis_hoverformat = json.info.var.name +
            ': ' + 'Dekad ' + '%m-%d';
    } else {
        return false;
    }

    ////
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
            hoverformat: xaxis_hoverformat,
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

    purgePlotlyChart(container);
    Plotly.newPlot(
        container,
        data,
        deepMerge(preview_layout, layout),
        config
    );

    setPlotlyThemeColors(container);
}

///////

function preview_analysis_query_proba(tempRes) {
    let query = queryParamsSpatialAverage();
    if (!query) {
        return query;
    }

    query.chartType = 'proba';
    query.temporalRes = tempRes;
    query.dataset = DATA_SET.rawdata;
    query.variable = $(`#${tempRes}-map-variable`).val();

    if (tempRes === 'seasonal') {
        const tstepId = `${tempRes}-map-date`;
        query.seasStart = parseInt($(`#${tstepId}-calendar`).val(), 10);
        query.seasLength = parseInt($(`#${tstepId}-length`).val(), 10);
        query.fullYearTS = false;
    }

    const dates = preview_analysis_query_temporal(
        query.dataset, tempRes, query.variable, 30
    );

    return Object.assign({}, query, dates);
}

function preview_analysis_charts_proba(tempRes, contID) {
    const query = preview_analysis_query_proba(tempRes);
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, tempRes)) {
        return false;
    }

    ajaxDisplayChart(
        '/climate_analysis_proba',
        query,
        preview_analysis_display_proba,
        contID
    );
}

function preview_analysis_display_proba(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    const theme = $('html').attr('data-bs-theme');

    ////
    const data = [{
            x: json.cdf.smoothed.x,
            y: json.cdf.smoothed.y,
            mode: 'lines',
            name: 'Smoothed CDF',
            units: '%',
            line: {
                color: '#1E90FF',
                width: 3
            },
            hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
        },
        {
            x: json.cdf.empirical.x,
            y: json.cdf.empirical.y,
            mode: 'lines+markers',
            name: 'Empirical CDF',
            units: '%',
            line: {
                color: 'red',
                width: 3
            },
            marker: {
                color: 'orange',
                line: {
                    color: 'red',
                    width: 1
                },
                size: 6
            },
            hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
        }
    ];

    var layout = {
        xaxis: {
            range: json.xrange,
            tickvals: json.yticks,
            fixedrange: true,
            showline: true,
            showgrid: true,
            gridwidth: 0.5,
            gridcolor: 'lightgray',
            minor: {
                showgrid: true,
                gridwidth: 0.3,
                gridcolor: 'lightgray',
                griddash: 'dot'
            },
            unifiedhovertitle: {
                text: json.info.var.name +
                    ': %{x:.2f} ' +
                    json.info.var.units
            }
        },
        yaxis: {
            range: [0, 100],
            ticksuffix: '%',
            fixedrange: true,
            showline: true,
            showgrid: true,
            gridwidth: 0.5,
            gridcolor: 'lightgray',
            minor: {
                showgrid: true,
                gridwidth: 0.3,
                gridcolor: 'lightgray',
                griddash: 'dot'
            }
        },
        showlegend: false,
        hovermode: 'x unified',
        hoverlabel: hoverlabelColors(theme)
    };

    layout = deepMerge(setPlotlyColors(), layout);
    layout = deepMerge(preview_layout, layout);
    layout.margin.l = 40;

    const config = {
        displayModeBar: false,
    };

    purgePlotlyChart(container);
    Plotly.newPlot(
        container,
        data,
        layout,
        config
    );

    setPlotlyThemeColors(container);
}

///////

function preview_analysis_query_season(tempRes) {
    let query = queryParamsSpatialAverage();
    if (!query) {
        return query;
    }

    query.chartType = 'season';
    query.temporalRes = tempRes;
    query.dataset = DATA_SET.rawdata;
    query.variable = $(`#${tempRes}-map-variable`).val();

    if (tempRes === 'seasonal') {
        const tstepId = `${tempRes}-map-date`;
        query.seasStart = parseInt($(`#${tstepId}-calendar`).val(), 10);
        query.seasLength = parseInt($(`#${tstepId}-length`).val(), 10);
        query.fullYearTS = false;
    }

    const dates = preview_analysis_query_temporal(
        query.dataset, tempRes, query.variable, 30
    );

    return Object.assign({}, query, dates);
}

function preview_analysis_charts_season(tempRes, contID) {
    const query = preview_analysis_query_season(tempRes);
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, tempRes)) {
        return false;
    }

    ajaxDisplayChart(
        '/climate_analysis_season',
        query,
        preview_analysis_display_season,
        contID
    );
}

function preview_analysis_display_season(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    $('<span>').text('season').appendTo(divCont);

}

///////////////////

function expand_analysis_query_rawdata(tempRes) {
    let query = queryParamsSpatialAverage();
    if (!query) {
        return query;
    }

    query.temporalRes = tempRes;
    query.dataset = DATA_SET.rawdata;
    query.variable = $(`#${tempRes}-chart-raw-variable`).val();
    query.startDate = analysis_query_format_date(
        $(`#${tempRes}-chart-raw-startdate-calendar`).val(),
        tempRes
    );
    query.endDate = analysis_query_format_date(
        $(`#${tempRes}-chart-raw-enddate-calendar`).val(),
        tempRes
    );

    return Object.assign({}, query);
}

function expand_analysis_charts_rawdata(container_id, tempRes) {
    const query = expand_analysis_query_rawdata(tempRes);
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, tempRes)) {
        flashMessage(JS_TEXT.point_outside, 'error');
        return false;
    }

    ajaxDisplayChart(
        '/climate_analysis_rawdata',
        query,
        expand_analysis_display_rawdata,
        container_id,
        'ts_rawdata'
    );
}

function expand_analysis_format_rawdata(json) {
    let jsc = makeCopy(json);
    const time_res = jsc.info.time_res;
    const ts = $(`#${time_res}-chart-raw-series`).val();
    if (ts === 'years') {
        const tstep_id = `${time_res}-chart-raw-startmonth`;
        const mon = parseInt($(`#${tstep_id}-calendar`).val(), 10);
        const dataYear = groupTSDataByYear(jsc.time, jsc.values, mon, time_res);
        if (dataYear === null) {
            return null;
        }
        jsc.time = dataYear.dates;
        jsc.values = dataYear.values;

        let start = new Date(jsc.time[0]);
        start.setDate(start.getDate() - 5);
        start = formatDateToString(start);
        let end = new Date(jsc.time.at(-1));
        end.setDate(end.getDate() + 5);
        end = formatDateToString(end);
        jsc.xrange = [start, end];
    }
    jsc['chartType'] = ts;
    return jsc;
}

function expand_analysis_display_rawdata(json_input, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    const json = expand_analysis_format_rawdata(json_input);
    if (json === null) {
        return false;
    }

    if (json.chartType === 'one') {
        showRangeselector(container, true);

        const var_precip = json.info.var.type === 'precip';

        const xaxisHoverText = json.time.map((t) => {
            return formatPlotlyHoverDate(t, json.info.time_res);
        });

        const data = [{
            x: json.time,
            y: json.values,
            name: json.info.var.name,
            units: json.info.var.units,
            type: var_precip ? 'bar' : 'scatter',
            mode: 'lines',
            line: { color: '#17becf' },
            marker: { color: '#fc03fc' },
            customdata: xaxisHoverText,
            hovertemplate: 'Date: %{customdata}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            // hovertemplate: 'Date: %{x|%B %Y}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
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

        purgePlotlyChart(container);
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

        let xaxis_hoverformat;
        if (json.info.time_res === 'monthly') {
            xaxis_hoverformat = json.info.var.name +
                ': ' + '%B';
        } else if (json.info.time_res === 'dekadal') {
            xaxis_hoverformat = json.info.var.name +
                ': ' + 'Dekad ' + '%m-%d';
        } else {
            return false;
        }

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
                hoverformat: xaxis_hoverformat,
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

        purgePlotlyChart(container);
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

///////

function expand_analysis_query_climato(tempRes) {
    let query = queryParamsSpatialAverage();
    if (!query) {
        return query;
    }

    query.chartType = $(`#${tempRes}-chart-clim-charts`).val();
    query.temporalRes = tempRes;
    query.dataset = DATA_SET.climatology;
    query.variable = $(`#${tempRes}-chart-clim-variable`).val();
    query.startYear = parseInt($(`#${tempRes}-chart-clim-bp-start`).val().trim(), 10);
    query.endYear = parseInt($(`#${tempRes}-chart-clim-bp-end`).val().trim(), 10);
    query.minYear = parseInt($(`#${tempRes}-chart-clim-bp-min`).val().trim(), 10);

    return query;
}

function expand_analysis_charts_climato(container_id, tempRes) {
    const query = expand_analysis_query_climato(tempRes);
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, tempRes)) {
        return false;
    }

    ajaxDisplayChart(
        '/climate_analysis_climato',
        query,
        expand_analysis_display_climato,
        container_id
    );
}

function expand_analysis_display_climato(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();
    const theme = $('html').attr('data-bs-theme');

    let one_var_hoverformat;
    let multi_var_hoverformat;
    if (json.info.time_res === 'monthly') {
        one_var_hoverformat = json.info.var.name +
            ': ' + '%B';
        multi_var_hoverformat = 'Month' + ': ' + '%B';
    } else if (json.info.time_res === 'dekadal') {
        one_var_hoverformat = json.info.var.name +
            ': ' + 'Dekad ' + '%m-%d';
        multi_var_hoverformat = 'Dekad' + ': ' + '%m-%d';
    } else {
        return false;
    }

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
                hoverformat: multi_var_hoverformat,

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
                hoverformat: one_var_hoverformat,

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

    purgePlotlyChart(container);
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

///////

function expand_analysis_query_anomaly(tempRes) {
    let query = queryParamsSpatialAverage();
    if (!query) {
        return query;
    }

    query.temporalRes = tempRes;
    query.dataset = DATA_SET.anomaly;
    query.variable = $(`#${tempRes}-chart-anom-variable`).val();
    query.anomaly = $(`#${tempRes}-chart-anom-type`).val();

    query.startYear = parseInt($(`#${tempRes}-chart-anom-bp-start`).val().trim(), 10);
    query.endYear = parseInt($(`#${tempRes}-chart-anom-bp-end`).val().trim(), 10);
    query.minYear = parseInt($(`#${tempRes}-chart-anom-bp-min`).val().trim(), 10);

    query.startDate = analysis_query_format_date(
        $(`#${tempRes}-chart-anom-startdate-calendar`).val(),
        tempRes
    );
    query.endDate = analysis_query_format_date(
        $(`#${tempRes}-chart-anom-enddate-calendar`).val(),
        tempRes
    );
    if (query.temporalRes === 'seasonal') {
        query.seasStart = 1;
        query.fullYearTS = true;
        query.seasLength = parseInt($(`#${tempRes}-chart-anom-seaslen`).val(), 10);
    }

    return Object.assign({}, query);
}

function expand_analysis_charts_anomaly(container_id, tempRes) {
    const query = expand_analysis_query_anomaly(tempRes);
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, tempRes)) {
        return false;
    }

    ajaxDisplayChart(
        '/climate_analysis_anomaly',
        query,
        expand_analysis_display_anomaly,
        container_id,
        'ts_anomaly'
    );
}

function expand_analysis_format_anomaly(json) {
    let jsc = makeCopy(json);
    const time_res = jsc.info.time_res;
    const ts = $(`#${time_res}-chart-anom-series`).val();
    if (ts === 'tstep') {
        const tstep_id = `${time_res}-chart-anom-tstep`;
        const tstep_val = $(`#${tstep_id}-calendar`).val();

        let this_date;
        if (time_res === 'monthly') {
            this_date = parseInt(tstep_val, 10);
        } else if (time_res === 'dekadal') {
            this_date = tstep_val;
        } else if (time_res === 'seasonal') {
            this_date = parseInt(tstep_val, 10);
        } else {
            return null;
        }

        const res = splitAnomalyDataByStep(
            jsc.time, jsc.values, this_date,
            time_res, jsc.info.seas_len
        );
        if (res === null) {
            return null;
        }

        jsc.time = res.dates;
        jsc.values = res.values;
        jsc.yrange = res.ylim;
        jsc.yticks = res.breaks;
        jsc['tstep'] = this_date;
    }
    jsc['chartType'] = ts;
    return jsc;
}

function expand_analysis_display_anomaly(json_input, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

    const json = expand_analysis_format_anomaly(json_input);
    if (json === null) {
        return false;
    }

    const xaxisHoverText = json.time.map((t) => {
        return formatPlotlyHoverDate(
            t, json.info.time_res, json.info.seas_len
        );
    });

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
        customdata: xaxisHoverText,
        hovertemplate: 'Date: %{customdata}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
        // hovertemplate: 'Date: %{x|%B %Y}<br> %{data.name}: %{y:.1f} %{data.units} <extra></extra>'
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

    purgePlotlyChart(container);
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

///////

function expand_analysis_query_proba(tempRes) {
    let query = queryParamsSpatialAverage();
    if (!query) {
        return query;
    }

    query.chartType = 'proba';
    query.temporalRes = tempRes;
    query.dataset = DATA_SET.rawdata;
    query.variable = $(`#${tempRes}-chart-proba-variable`).val();

    query.startDate = analysis_query_format_date(
        $(`#${tempRes}-chart-proba-startdate-calendar`).val(),
        tempRes
    );
    query.endDate = analysis_query_format_date(
        $(`#${tempRes}-chart-proba-enddate-calendar`).val(),
        tempRes
    );

    if (query.temporalRes === 'seasonal') {
        query.fullYearTS = false;
        query.seasStart = parseInt($(`#${tempRes}-chart-proba-startmon-calendar`).val(), 10);
        query.seasLength = parseInt($(`#${tempRes}-chart-proba-seaslen`).val(), 10);
    }

    return Object.assign({}, query);
}

function expand_analysis_charts_proba(container_id, tempRes) {
    const query = expand_analysis_query_proba(tempRes);
    if (!query) {
        return false;
    }
    if (checkQueryPointOutside(query, tempRes)) {
        return false;
    }

    ajaxDisplayChart(
        '/climate_analysis_proba',
        query,
        expand_analysis_display_proba,
        container_id,
        'data_proba'
    );
}

function expand_analysis_display_proba(json, container) {
    const divCont = $(`#${container}`);
    divCont.empty();
    const theme = $('html').attr('data-bs-theme');

    const plot_type = $(`#${json.info.time_res}-chart-proba-plot-type`).val();
    let data;
    let layout;
    if (plot_type === 'cdf') {
        data = [{
                x: json.cdf.empirical.x,
                y: json.cdf.empirical.y,
                mode: 'lines+markers',
                name: 'Empirical CDF',
                units: '%',
                line: {
                    color: 'red',
                    width: 3
                },
                marker: {
                    color: 'orange',
                    line: {
                        color: 'red',
                        width: 1
                    },
                    size: 6
                },
                visible: true,
                hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            },
            {
                x: json.cdf.smoothed.x,
                y: json.cdf.smoothed.y,
                mode: 'lines',
                name: 'Smoothed CDF',
                units: '%',
                line: {
                    color: '#1e90ff',
                    width: 3
                },
                visible: true,
                hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            },
            {
                x: json.cdf.fitted.x,
                y: json.cdf.fitted.y,
                mode: 'lines',
                name: 'Fitted CDF',
                units: '%',
                line: {
                    color: '#c29ffa',
                    width: 3
                },
                visible: false,
                hovertemplate: '%{data.name}: %{y:.1f} %{data.units} <extra></extra>'
            }
        ];

        layout = {
            xaxis: {
                range: json.xrange,
                tickvals: json.yticks,
                fixedrange: true,
                showline: true,
                showgrid: true,
                gridwidth: 0.5,
                gridcolor: 'lightgray',
                minor: {
                    showgrid: true,
                    gridwidth: 0.3,
                    gridcolor: 'lightgray',
                    griddash: 'dot'
                },
                unifiedhovertitle: {
                    text: json.info.var.name +
                        ': %{x:.2f} ' +
                        json.info.var.units
                },
                title: {
                    text: json.info.labels.cdf.x
                }
            },
            yaxis: {
                range: [0, 100],
                ticksuffix: '%',
                fixedrange: true,
                showline: true,
                showgrid: true,
                gridwidth: 0.5,
                gridcolor: 'lightgray',
                minor: {
                    showgrid: true,
                    gridwidth: 0.3,
                    gridcolor: 'lightgray',
                    griddash: 'dot'
                },
                title: {
                    text: json.info.labels.cdf.y
                }
            },
            showlegend: false,
            hovermode: 'x unified',
            hoverlabel: hoverlabelColors(theme)
        };
    } else {
        const xlab = json.info.labels.pdf.x;
        const ylab = json.info.labels.pdf.y;
        data = [{
                x: json.ts,
                type: 'histogram',
                histnorm: 'probability density',
                name: 'Histogram',
                visible: true,
                nbinsx: Math.ceil(Math.log2(json.ts.length) + 1),
                marker: {
                    color: 'lightblue',
                    line: {
                        color: 'blue',
                        width: 1
                    }
                },
                opacity: 1,
                hovertemplate: xlab + ': %{x:.2f}<br>' +
                    ylab + ': %{y:.4f}<extra></extra>'
            },
            {
                x: json.pdf.kde.x,
                y: json.pdf.kde.y,
                type: 'scatter',
                mode: 'lines',
                name: 'Kernel Density Estimation',
                visible: true,
                line: {
                    color: '#1e90ff',
                    width: 3
                },
                hovertemplate: xlab + ': %{x:.2f}<br>' +
                    ylab + ': %{y:.4f}<extra></extra>'
            },
            {
                x: json.pdf.fitted.x,
                y: json.pdf.fitted.y,
                type: 'scatter',
                mode: 'lines',
                name: 'Fitted PDF',
                visible: true,
                line: {
                    color: '#c29ffa',
                    width: 3
                },
                hovertemplate: xlab + ': %{x:.2f}<br>' +
                    ylab + ': %{y:.4f}<extra></extra>'
            }
        ];

        const ymax = Math.max(
            ...json.pdf.kde.y,
            ...json.pdf.fitted.y
        );

        layout = {
            xaxis: {
                range: json.xrange,
                fixedrange: true,
                showline: true,
                showgrid: true,
                gridwidth: 0.5,
                gridcolor: 'lightgray',
                minor: {
                    showgrid: true,
                    gridwidth: 0.3,
                    gridcolor: 'lightgray',
                    griddash: 'dot'
                },
                zeroline: false,
                title: {
                    text: xlab
                }
            },
            yaxis: {
                range: [0, ymax + 0.002],
                fixedrange: true,
                showline: true,
                showgrid: true,
                gridwidth: 0.5,
                gridcolor: 'lightgray',
                minor: {
                    showgrid: true,
                    gridwidth: 0.3,
                    gridcolor: 'lightgray',
                    griddash: 'dot'
                },
                zeroline: false,
                title: {
                    text: ylab
                }
            },
            bargap: 0,
            showlegend: false,
            // hoverlabel: hoverlabelColors(theme)
        };
    }

    layout.margin = { t: 10, b: 70, l: 70, r: 10 };
    layout.print_legend = 'probability';
    layout = deepMerge(setPlotlyColors(), layout);
    layout = deepMerge(expand_layout, layout);

    const container_plot = setProbaPlotContainer(json, container);

    purgePlotlyChart(container_plot);
    Plotly.newPlot(
        container_plot,
        data,
        layout,
        plotly_config
    );

    setPlotlyThemeColors(container_plot);

    if ($(`#${json.info.time_res}-proba-plot-fitted`).is(':checked')) {
        $(`#${container}-distr-div`).show();
    } else {
        $(`#${container}-distr-div`).hide();
    }
}

///////

function expand_analysis_query_season(tempRes) {

}

function expand_analysis_charts_season(container_id, tempRes) {

}

function expand_analysis_display_season(json_input, container) {
    const divCont = $(`#${container}`);
    divCont.empty();

}