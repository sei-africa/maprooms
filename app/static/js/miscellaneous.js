function arrayRemoveDuplicates(arr) {
    return arr.filter((item, index) => arr.indexOf(item) === index);
}

function orderSelect2SelectedItems(selector) {
    let select = $(selector);
    let selItems = [];

    function reorderOptions() {
        let selOpts = select.find('option:selected');

        selOpts.sort(function(a, b) {
            return selItems.indexOf(a.value) - selItems.indexOf(b.value);
        });

        selOpts.detach().appendTo(select);
        select.trigger('change.select2');
    }

    select.on('select2:select', function(e) {
        const id = e.params.data.id;
        if (selItems.indexOf(id) === -1) {
            selItems.push(id);
        }
        reorderOptions();
    });

    select.on('select2:unselect', function(e) {
        const id = e.params.data.id;
        const ix = selItems.indexOf(id);
        if (ix > -1) {
            selItems.splice(ix, 1);
        }
        reorderOptions();
    });
}

//////////////

function makeCopy(obj) {
    const js = JSON.stringify(obj);
    return JSON.parse(js);
}

function deepMerge(target, source) {
    const output = { ...target };
    if (target && typeof target === 'object' && source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, {
                        [key]: source[key]
                    });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, {
                    [key]: source[key]
                });
            }
        });
    }
    return output;
}

function pretty(x, n = 5) {
    if (x.length === 0) return [];

    const min = Math.min(...x);
    const max = Math.max(...x);

    const d = max - min;

    if (d === 0) {
        const defaultRange = max * 0.05;
        if (defaultRange === 0) return [min - 1, min, min + 1];
        return pretty([min - defaultRange, min + defaultRange], n);
    }

    const c = d / n;
    const base = Math.pow(10, Math.floor(Math.log10(c)));
    const unit = [1, 2, 5, 10].find(u => (u * base) >= c) * base;

    const start = Math.floor(min / unit) * unit;
    let end = Math.ceil(max / unit) * unit;

    while (end < max) {
        end += unit;
    }

    const result = [];
    for (let i = start; i <= end; i += unit) {
        result.push(i);
    }

    return result;
}

function generateSequence01(length) {
    if (length < 2) return [0];
    const step = 1 / (length - 1);
    return Array.from({ length }, (_, i) => i * step);
}

//////////////

function getDataSpatialResolution(tempRes) {
    const maptype = $(`#${tempRes}-map-type option:selected`).val();
    const variable = $(`#${tempRes}-map-variable option:selected`).val();
    const dset = DATA_SET[maptype].dataset;
    const data = DATA_INFO[dset][tempRes][variable];
    return data.spatial_resolution;
}

//////////////

function setOffCanvasMapControl(tempRes) {
    $(`#${tempRes}-map-variable`).on('change', () => {
        //get data resolution
        const data_res = getDataSpatialResolution(tempRes);
        // set spatial average select
        setSelectSpatialAverage(data_res);
    });
    $(`#${tempRes}-map-variable`).trigger('change');

    // 
    $(`#${tempRes}-map-type`).on('change', () => {
        const maptype = $(`#${tempRes}-map-type`).val();
        if (maptype === 'climatology') {
            setNamesCalendar(
                `${tempRes}-map-date`, tempRes
            );

            $(`#${tempRes}-map-anomaly`).hide();
            $(`#${tempRes}-map-climato`).show();

            const clim_fun = $(`#${tempRes}-map-climato-func`).val();
            if (clim_fun === 'percentile') {
                $(`#div-${tempRes}-map-climato-freq`).hide();
                $(`#div-${tempRes}-map-climato-perc`).show();
            } else if (clim_fun === 'frequency') {
                $(`#div-${tempRes}-map-climato-perc`).hide();
                $(`#div-${tempRes}-map-climato-freq`).show();
            } else {
                $(`#div-${tempRes}-map-climato-perc`).hide();
                $(`#div-${tempRes}-map-climato-freq`).hide();
            }
        } else {
            if (maptype === 'anomaly') {
                $(`#${tempRes}-map-anomaly`).show();
                var dataset = DATA_SET.anomaly.dataset;
            } else {
                $(`#${tempRes}-map-anomaly`).hide();
                var dataset = DATA_SET.rawdata.dataset;
            }

            setDateCalendar(
                `${tempRes}-map-date`,
                `${tempRes}-map-variable`,
                dataset, tempRes
            );

            $(`#${tempRes}-map-climato`).hide();
        }

        //get data resolution
        const data_res = getDataSpatialResolution(tempRes);
        // set spatial average select
        setSelectSpatialAverage(data_res);
    });
    $(`#${tempRes}-map-type`).trigger('change');

    // 
    $(`#${tempRes}-map-climato-func`).on('change', () => {
        const clim_fun = $(`#${tempRes}-map-climato-func`).val();
        if (clim_fun === 'percentile') {
            $(`#div-${tempRes}-map-climato-freq`).hide();
            $(`#div-${tempRes}-map-climato-perc`).show();
        } else if (clim_fun === 'frequency') {
            $(`#div-${tempRes}-map-climato-perc`).hide();
            $(`#div-${tempRes}-map-climato-freq`).show();

            const hgt = $(`#div-${tempRes}-map-climato-freq .input-group-text`).innerHeight();
            $(`#select2-${tempRes}-map-climato-freqOp-container`)
                .parent('span').css({
                    'min-height': hgt
                });
        } else {
            $(`#div-${tempRes}-map-climato-perc`).hide();
            $(`#div-${tempRes}-map-climato-freq`).hide();
        }
    });
    $(`#${tempRes}-map-climato-func`).trigger('change');
}

//////////////

async function setMapDatesNavInput(tempRes) {
    const this_date = $('#input-time-navigation').val().trim();
    if (this_date === '') {
        flashMessage(JS_TEXT.date_missing, 'error');
        return false;
    }

    const tstepID = `${tempRes}-map-date`;
    const maptype = $(`#${tempRes}-map-type`).val();
    if (maptype === 'climatology') {
        let cl_date = null;
        if (tempRes === 'monthly') {
            const months = getListOfMonthsCalendar().long;
            const m = months.indexOf(this_date);
            if (m !== -1) {
                cl_date = m + 1;
            }
        } else if (tempRes === 'dekadal') {
            const dekads = getListOfDekadsCalendar();
            const d = dekads.map(x => x.short).indexOf(this_date);
            if (d !== -1) {
                cl_date = dekads[d].value;
            }
        } else {
            return false;
        }

        if (cl_date === null) {
            flashMessage(JS_TEXT.date_invalid, 'error');
            return false;
        }
        $(`#${tstepID}-calendar`).val(cl_date).trigger('change');
    } else {
        let dataset;
        if (maptype === 'anomaly') {
            dataset = DATA_SET.anomaly.dataset;
        } else {
            dataset = DATA_SET.rawdata.dataset;
        }

        let str_time;
        if (tempRes === 'monthly') {
            str_time = `${this_date}-01 00:00:00`;
        } else if (tempRes === 'dekadal') {
            str_time = `${this_date} 00:00:00`;
        } else {
            return false;
        }

        const this_time = new Date(str_time);
        if (isNaN(this_time.getTime())) {
            flashMessage(JS_TEXT.date_invalid, 'error');
            return false;
        }

        const variable = $(`#${tempRes}-map-variable`).val();
        const temp_cov = getTempCoverageCalendar(dataset, tempRes, variable);
        const start = new Date(temp_cov.start);
        const end = new Date(temp_cov.end);
        if (this_time < start || this_time > end) {
            flashMessage(JS_TEXT.date_outrange, 'error');
            return false;
        }

        const calendarElement = document.getElementById(`${tstepID}-calendar`);
        const calendar = calendarElement.calendar;
        if (calendar) {
            calendar.setValue(str_time);
        } else {
            flashMessage(JS_TEXT.date_calendar, 'error');
            return false;
        }
    }

    return true;
}

async function setMapDatesNavPrev(tempRes) {
    const this_date = $('#input-time-navigation').val().trim();
    if (this_date === '') {
        flashMessage(JS_TEXT.date_missing, 'error');
        return false;
    }

    const tstepID = `${tempRes}-map-date`;
    const maptype = $(`#${tempRes}-map-type`).val();
    if (maptype === 'climatology') {
        let cl_date = null;
        let cl_input = null;
        if (tempRes === 'monthly') {
            const months = getListOfMonthsCalendar().long;
            let m = months.indexOf(this_date);
            if (m !== -1) {
                m = m - 1;
                if (m < 0) {
                    m = 11;
                }
                cl_date = m + 1;
                cl_input = months[m];
            }
        } else if (tempRes === 'dekadal') {
            const dekads = getListOfDekadsCalendar();
            let d = dekads.map(x => x.short).indexOf(this_date);
            if (d !== -1) {
                d = d - 1;
                if (d < 0) {
                    d = 35;
                }
                cl_date = dekads[d].value;
                cl_input = dekads[d].short;
            }
        } else {
            return false;
        }

        if (cl_date === null) {
            flashMessage(JS_TEXT.date_invalid, 'error');
            return false;
        }

        $('#input-time-navigation').val(cl_input);
        $(`#${tstepID}-calendar`).val(cl_date).trigger('change');
    } else {
        let dataset;
        if (maptype === 'anomaly') {
            dataset = DATA_SET.anomaly.dataset;
        } else {
            dataset = DATA_SET.rawdata.dataset;
        }

        let str_time;
        if (tempRes === 'monthly') {
            str_time = `${this_date}-01 00:00:00`;
        } else if (tempRes === 'dekadal') {
            str_time = `${this_date} 00:00:00`;
        } else {
            return false;
        }

        const this_time = new Date(str_time);
        if (isNaN(this_time.getTime())) {
            flashMessage(JS_TEXT.date_invalid, 'error');
            return false;
        }

        const variable = $(`#${tempRes}-map-variable`).val();
        const temp_cov = getTempCoverageCalendar(dataset, tempRes, variable);
        const start = new Date(temp_cov.start);
        const end = new Date(temp_cov.end);

        let input_date;
        let str_date;
        if (tempRes === 'monthly') {
            let prev_mon = addDateMonths(this_time, -1);
            if (prev_mon < start) {
                prev_mon = end;
            }
            str_date = formatDateToString(prev_mon);
            input_date = str_date.slice(0, 7);
        } else if (tempRes === 'dekadal') {
            let prev_dek = addDateDekads(this_time, -1);
            if (prev_dek < start) {
                prev_dek = end;
            }
            str_date = formatDateToString(prev_dek);
            input_date = str_date.slice(0, 10);
        } else {
            return false;
        }
        $('#input-time-navigation').val(input_date);

        const calendarElement = document.getElementById(`${tstepID}-calendar`);
        const calendar = calendarElement.calendar;
        if (calendar) {
            calendar.setValue(`${str_date} 00:00:00`);
        } else {
            flashMessage(JS_TEXT.date_calendar, 'error');
            return false;
        }
    }

    return true;
}

async function setMapDatesNavNext(tempRes) {
    const this_date = $('#input-time-navigation').val().trim();
    if (this_date === '') {
        flashMessage(JS_TEXT.date_missing, 'error');
        return false;
    }

    const tstepID = `${tempRes}-map-date`;
    const maptype = $(`#${tempRes}-map-type`).val();
    if (maptype === 'climatology') {
        let cl_date = null;
        let cl_input = null;
        if (tempRes === 'monthly') {
            const months = getListOfMonthsCalendar().long;
            let m = months.indexOf(this_date);
            if (m !== -1) {
                m = m + 1;
                if (m > 11) {
                    m = 0;
                }
                cl_date = m + 1;
                cl_input = months[m];
            }
        } else if (tempRes === 'dekadal') {
            const dekads = getListOfDekadsCalendar();
            let d = dekads.map(x => x.short).indexOf(this_date);
            if (d !== -1) {
                d = d + 1;
                if (d > 35) {
                    d = 0;
                }
                cl_date = dekads[d].value;
                cl_input = dekads[d].short;
            }
        } else {
            return false;
        }

        if (cl_date === null) {
            flashMessage(JS_TEXT.date_invalid, 'error');
            return false;
        }

        $('#input-time-navigation').val(cl_input);
        $(`#${tstepID}-calendar`).val(cl_date).trigger('change');
    } else {
        let dataset;
        if (maptype === 'anomaly') {
            dataset = DATA_SET.anomaly.dataset;
        } else {
            dataset = DATA_SET.rawdata.dataset;
        }

        let str_time;
        if (tempRes === 'monthly') {
            str_time = `${this_date}-01 00:00:00`;
        } else if (tempRes === 'dekadal') {
            str_time = `${this_date} 00:00:00`;
        } else {
            return false;
        }

        const this_time = new Date(str_time);
        if (isNaN(this_time.getTime())) {
            flashMessage(JS_TEXT.date_invalid, 'error');
            return false;
        }

        const variable = $(`#${tempRes}-map-variable`).val();
        const temp_cov = getTempCoverageCalendar(dataset, tempRes, variable);
        const start = new Date(temp_cov.start);
        const end = new Date(temp_cov.end);

        let input_date;
        let str_date;
        if (tempRes === 'monthly') {
            let prev_mon = addDateMonths(this_time, 1);
            if (prev_mon > end) {
                prev_mon = start;
            }
            str_date = formatDateToString(prev_mon);
            input_date = str_date.slice(0, 7);
        } else if (tempRes === 'dekadal') {
            let prev_dek = addDateDekads(this_time, 1);
            if (prev_dek > end) {
                prev_dek = start;
            }
            str_date = formatDateToString(prev_dek);
            input_date = str_date.slice(0, 10);
        } else {
            return false;
        }
        $('#input-time-navigation').val(input_date);

        const calendarElement = document.getElementById(`${tstepID}-calendar`);
        const calendar = calendarElement.calendar;
        if (calendar) {
            calendar.setValue(`${str_date} 00:00:00`);
        } else {
            flashMessage(JS_TEXT.date_calendar, 'error');
            return false;
        }
    }

    return true;
}

//////////////

function setAnalysisExpandModalRaw(tempRes, contID) {
    showModalDialog(`modal-expand-${contID}`);
    expandModalCharts(
        contID,
        expand_analysis_charts_rawdata,
        tempRes
    );
    purgePlotlyChartExpandModal(contID);

    const end_date = $(`#${tempRes}-chart-raw-enddate-calendar`).val();
    let disp_end;
    if (end_date === '') {
        disp_end = null;
    } else {
        disp_end = end_date;
    }

    setDateCalendar(
        `${tempRes}-chart-raw-enddate`,
        `${tempRes}-chart-raw-variable`,
        DATA_SET.rawdata.dataset,
        tempRes, disp_end,
        mapNavigation = false
    );

    const start_date = $(`#${tempRes}-chart-raw-startdate-calendar`).val();
    let disp_start;
    if (start_date === '') {
        const varTs = $(`#${tempRes}-chart-raw-variable`).val();
        const trange = getTemporalRangeCalendar(
            DATA_SET.rawdata.dataset,
            tempRes, varTs, 5
        );
        disp_start = trange.start;
    } else {
        disp_start = start_date;
    }

    setDateCalendar(
        `${tempRes}-chart-raw-startdate`,
        `${tempRes}-chart-raw-variable`,
        DATA_SET.rawdata.dataset,
        tempRes, disp_start,
        mapNavigation = false
    );

    const tstepID = `${tempRes}-chart-raw-startmonth`;
    setNamesCalendar(
        tstepID, 'monthly',
        $(`#${tempRes}-raw-control`),
        mapNavigation = false
    );

    //
    const contChart = `container-chart-${contID}`;

    const updateRawSeriesControls = () => {
        if ($(`#${tempRes}-chart-raw-series`).val() === 'one') {
            $(`#${tempRes}-chart-raw-startmonth-list`).hide();
        } else {
            $(`#${tempRes}-chart-raw-startmonth-list`).show();
        }
    };
    updateRawSeriesControls();

    $(`#${tempRes}-chart-raw-series`)
        .off('change.chartTsRaw')
        .on('change.chartTsRaw', function() {
            updateRawSeriesControls();
            maproomDB.getData('ts_rawdata', function(data) {
                expand_analysis_display_rawdata(data, contChart);
            });
        });

    $(`#${tempRes}-chart-raw-variable`)
        .off('change.chartTsRaw')
        .on('change.chartTsRaw', function() {
            expand_analysis_charts_rawdata(contChart, tempRes);
        });

    $(`#${tstepID}-calendar`)
        .off('change.chartTsRaw')
        .on('change.chartTsRaw', function() {
            maproomDB.getData('ts_rawdata', function(data) {
                expand_analysis_display_rawdata(data, contChart);
            });
        });

    // update chart
    $(`#plotly-replot-${contID}`)
        .off('click.chartTsRaw')
        .on('click.chartTsRaw', function() {
            expand_analysis_charts_rawdata(contChart, tempRes);
        });

    // download chart
    $(`#plotly-download-${contID}`)
        .off('click.chartTsRaw')
        .on('click.chartTsRaw', function() {
            downloadPlotlyImageJPG(contChart);
        });
}

function setAnalysisExpandModalClim(tempRes, contID) {
    showModalDialog(`modal-expand-${contID}`);
    expandModalCharts(
        contID,
        expand_analysis_charts_climato,
        tempRes
    );
    purgePlotlyChartExpandModal(contID);

    // 
    const contChart = `container-chart-${contID}`;

    const updateClimatoChartControls = () => {
        if ($(`#${tempRes}-chart-clim-charts`).val() === 'one') {
            $(`#${tempRes}-chart-clim-variable-cont`).show();
        } else {
            $(`#${tempRes}-chart-clim-variable-cont`).hide();
        }
    };
    updateClimatoChartControls();

    $(`#${tempRes}-chart-clim-charts`)
        .off('change.chartTsClim')
        .on('change.chartTsClim', function() {
            updateClimatoChartControls();
            expand_analysis_charts_climato(contChart, tempRes);
        });

    $(`#${tempRes}-chart-clim-variable`)
        .off('change.chartTsClim')
        .on('change.chartTsClim', function() {
            expand_analysis_charts_climato(contChart, tempRes);
        });

    // set base period
    setBoxDialog(
        `${tempRes}-chart-clim-bp`,
        `${tempRes}-chart-clim-bp-open`
    );

    // update chart
    $(`#plotly-replot-${contID}`)
        .off('click.chartTsClim')
        .on('click.chartTsClim', function() {
            expand_analysis_charts_climato(contChart, tempRes);
        });

    // download chart
    $(`#plotly-download-${contID}`)
        .off('click.chartTsClim')
        .on('click.chartTsClim', function() {
            downloadPlotlyImageJPG(contChart);
        });
}

function setAnalysisExpandModalAnom(tempRes, contID) {
    showModalDialog(`modal-expand-${contID}`);
    expandModalCharts(
        contID,
        expand_analysis_charts_anomaly,
        tempRes
    );
    purgePlotlyChartExpandModal(contID);

    const end_date = $(`#${tempRes}-chart-anom-enddate-calendar`).val();
    let disp_end;
    if (end_date === '') {
        disp_end = null;
    } else {
        disp_end = end_date;
    }

    setDateCalendar(
        `${tempRes}-chart-anom-enddate`,
        `${tempRes}-chart-anom-variable`,
        DATA_SET.anomaly.dataset,
        tempRes, disp_end,
        mapNavigation = false
    );

    const start_date = $(`#${tempRes}-chart-anom-startdate-calendar`).val();
    let disp_start;
    if (start_date === '') {
        const varTs = $(`#${tempRes}-chart-anom-variable`).val();
        const trange = getTemporalRangeCalendar(
            DATA_SET.anomaly.dataset,
            tempRes, varTs, 30
        );
        disp_start = trange.start;
    } else {
        disp_start = start_date;
    }

    setDateCalendar(
        `${tempRes}-chart-anom-startdate`,
        `${tempRes}-chart-anom-variable`,
        DATA_SET.anomaly.dataset,
        tempRes, disp_start,
        mapNavigation = false
    );

    const tstepID = `${tempRes}-chart-anom-tstep`;
    setNamesCalendar(
        tstepID, tempRes,
        $(`#${tempRes}-anom-control`),
        mapNavigation = false
    );

    //
    const contChart = `container-chart-${contID}`;

    const updateAnomalySeriesControls = () => {
        if ($(`#${tempRes}-chart-anom-series`).val() === 'one') {
            $(`#${tempRes}-chart-anom-tstep-list`).hide();
        } else {
            $(`#${tempRes}-chart-anom-tstep-list`).show();
        }
    };
    updateAnomalySeriesControls();

    $(`#${tempRes}-chart-anom-series`)
        .off('change.chartTsAnom')
        .on('change.chartTsAnom', function() {
            updateAnomalySeriesControls();
            maproomDB.getData('ts_anomaly', function(data) {
                expand_analysis_display_anomaly(data, contChart);
            });
        });

    $(`#${tempRes}-chart-anom-variable`)
        .off('change.chartTsAnom')
        .on('change.chartTsAnom', function() {
            expand_analysis_charts_anomaly(contChart, tempRes);
        });

    // 
    $(`#${tempRes}-chart-anom-type`)
        .off('change.chartTsAnom')
        .on('change.chartTsAnom', function() {
            expand_analysis_charts_anomaly(contChart, tempRes);
        });

    $(`#${tstepID}-calendar`)
        .off('change.chartTsAnom')
        .on('change.chartTsAnom', function() {
            maproomDB.getData('ts_anomaly', function(data) {
                expand_analysis_display_anomaly(data, contChart);
            });
        });

    // set base period
    setBoxDialog(
        `${tempRes}-chart-anom-bp`,
        `${tempRes}-chart-anom-bp-open`
    );

    // update chart
    $(`#plotly-replot-${contID}`)
        .off('click.chartTsAnom')
        .on('click.chartTsAnom', function() {
            expand_analysis_charts_anomaly(contChart, tempRes);
        });

    // download chart
    $(`#plotly-download-${contID}`)
        .off('click.chartTsAnom')
        .on('click.chartTsAnom', function() {
            downloadPlotlyImageJPG(contChart);
        });
}

//////////////

function splitAnomalyDataByStep(ts_dates, ts_data, date, time_res) {
    let dates = [];
    let values = [];
    for (let i = 0; i < ts_dates.length; i++) {
        let this_date;
        if (time_res === 'dekadal') {
            const d = ts_dates[i].split('-').slice(-2);
            const dy = Number(d[1]);
            const dk = dy <= 10 ? 1 : (dy >= 21 ? 3 : 2);
            this_date = `${d[0]}-${dk}`;
        } else if (time_res === 'monthly') {
            const m = ts_dates[i].split('-')[1];
            this_date = parseInt(m);
        } else {
            return null;
        }
        if (this_date === date) {
            dates.push(ts_dates[i]);
            values.push(ts_data[i]);
        }
    }

    const mn = Math.min(...values);
    const mx = Math.max(...values);
    const max = Math.max(Math.abs(mn), Math.abs(mx));
    const breaks = pretty([-max, max], 7);
    let ylim = [breaks[0], breaks.at(-1)];
    const y10 = (ylim[1] - ylim[0]) * 0.1;
    ylim[0] = ylim[0] - y10;
    ylim[1] = ylim[1] + y10;

    return {
        dates: dates,
        values: values,
        ylim: ylim,
        breaks: breaks
    };
}

function groupTSDataByYear(ts_dates, ts_data, start_mon, time_res) {
    let parsed = [];
    for (let i = 0; i < ts_dates.length; i++) {
        let ar_dates = ts_dates[i].split('-');
        if (time_res === 'dekadal') {
            parsed.push({
                year: parseInt(ar_dates[0]),
                month: parseInt(ar_dates[1]),
                dekad: parseInt(ar_dates[2]),
                value: ts_data[i]
            });
        } else if (time_res === 'monthly') {
            parsed.push({
                year: parseInt(ar_dates[0]),
                month: parseInt(ar_dates[1]),
                value: ts_data[i]
            });
        } else {
            return null;
        }
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

            if (time_res === 'dekadal') {
                for (const dk of [1, 11, 21]) {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dk).padStart(2, '0')}`;
                    const found = groups[dataYear].find(d => d.year === year && d.month === month && d.dekad === dk);
                    tyears.push(dateStr);
                    values.push(found ? found.value : null);
                }
            } else if (time_res === 'monthly') {
                const dateStr = `${year}-${String(month).padStart(2, '0')}`;
                const found = groups[dataYear].find(d => d.year === year && d.month === month);
                tyears.push(dateStr);
                values.push(found ? found.value : null);
            } else {
                return null;
            }
        }
        groups[dataYear] = { tyears, values };
    }
    const years = Object.keys(groups);
    let dates = groups[years[0]].tyears;
    if (time_res === 'monthly') {
        dates = dates.map(x => x + '-01');
    }
    let data = [];
    for (const key in groups) {
        data.push({ year: key, values: groups[key].values })
    }
    return { dates: dates, values: data };
}

//////////////