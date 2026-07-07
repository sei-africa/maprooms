function queryParamsAnalysisMap(time_res) {
    let query = new Object();
    query.temporalRes = time_res;
    query.variable = $(`#${time_res}-map-variable`).val();
    query.mapType = $(`#${time_res}-map-type`).val();
    const tstep_id = `${time_res}-map-date`;
    const bp_id = `${time_res}-base-period`;

    let date;
    if (time_res === 'daily') {
        query.dailyAnalysis = true;
        query.minFrac = 1.0;
        query.seasParams = $(`#${time_res}-map-parameters`).val();

        query.startMonth = parseInt($(`#${tstep_id}-start-mon`).val(), 10);
        query.startDay = parseInt($(`#${tstep_id}-start-day`).val(), 10);
        query.endMonth = parseInt($(`#${tstep_id}-end-mon`).val(), 10);
        query.endDay = parseInt($(`#${tstep_id}-end-day`).val(), 10);
    } else {
        query.dailyAnalysis = false;
        date = $(`#${tstep_id}-calendar`).val();
    }

    if (query.mapType === 'climatology') {
        if (time_res === 'monthly') {
            date = date === '' ? '1' : date;
            query.climDate = parseInt(date, 10);
        } else if (time_res === 'dekadal') {
            date = date === '' ? '01-1' : date;
            query.climDate = date;
        } else if (time_res === 'seasonal') {
            query.fullYear = false;
            date = date === '' ? '1' : date;
            query.climDate = parseInt(date, 10);
            query.seasLength = parseInt($(`#${tstep_id}-length`).val(), 10);
        } else if (time_res === 'daily') {
            query.fullYear = false;
        } else {
            return false;
        }

        ///////
        query.dataset = DATA_SET.climatology;

        if (time_res === 'daily') {
            query.seasStats = $(`#${time_res}-map-statistics`).val();

            if (query.seasStats === 'probExc' || query.seasStats === 'probNoExc') {
                query.probaThres = Number($(`#${time_res}-map-climato-probaTh`).val().trim());
                query.probaUnit = $(`#${time_res}-map-climato-probaUnit`).val();
            }

            query.defThres = Number($(`#${time_res}-map-def-number-thres-val`).val().trim());
            if (query.variable === 'rainfall') {
                query.defSpell = parseInt($(`#${time_res}-map-def-spell-thres-val`).val().trim(), 10);
            } else {
                query.defTempBase = Number($(`#${time_res}-map-def-spell-thres-val`).val().trim());
            }

            query.startYear = parseInt($(`#${tstep_id}-start-year`).val().trim(), 10);
            query.endYear = parseInt($(`#${tstep_id}-end-year`).val().trim(), 10);
            query.minYear = parseInt($(`#${tstep_id}-min-year`).val().trim(), 10);
        } else {
            query.climFunction = $(`#${time_res}-map-climato-func`).val();
            if (query.climFunction === 'percentile') {
                query.precentileValue = $(`#${time_res}-map-climato-perc`).val();
            }
            if (query.climFunction === 'frequency') {
                query.frequencyOper = $(`#${time_res}-map-climato-freqOp`).val();
                query.frequencyThres = $(`#${time_res}-map-climato-freqTh`).val();
            }
            if (query.climFunction === 'probExc' || query.climFunction === 'probNoExc') {
                query.probaThres = $(`#${time_res}-map-climato-probaTh`).val();
            }
            if (query.climFunction === 'trend') {
                query.trendUnit = $(`#${time_res}-map-climato-trendUnit`).val();
            }

            query.startYear = parseInt($(`#${bp_id}-start`).val().trim(), 10);
            query.endYear = parseInt($(`#${bp_id}-end`).val().trim(), 10);
            query.minYear = parseInt($(`#${bp_id}-min`).val().trim(), 10);
        }
    } else {
        if (time_res === 'monthly') {
            query.Date = date;
        } else if (time_res === 'dekadal') {
            query.Date = formatDekadDate(date);
        } else if (time_res === 'seasonal') {
            query.seasLength = parseInt($(`#${tstep_id}-length`).val(), 10);
            query.Date = formatSeasonDate(date, query.seasLength);
        } else if (time_res === 'daily') {
            query.Year = parseInt($(`#${tstep_id}-tseries-year`).val().trim(), 10);
            query.seasParams = $(`#${time_res}-map-parameters`).val();
            query.defThres = Number($(`#${time_res}-map-def-number-thres-val`).val().trim());
            if (query.variable === 'rainfall') {
                query.defSpell = parseInt($(`#${time_res}-map-def-spell-thres-val`).val().trim(), 10);
            } else {
                query.defTempBase = Number($(`#${time_res}-map-def-spell-thres-val`).val().trim());
            }
        } else {
            return false;
        }

        if (query.mapType === 'anomaly') {
            query.dataset = DATA_SET.anomaly;
            query.anomaly = $(`#${time_res}-map-anomaly-type`).val();
            if (time_res === 'daily') {
                query.startYear = parseInt($(`#${tstep_id}-start-year`).val().trim(), 10);
                query.endYear = parseInt($(`#${tstep_id}-end-year`).val().trim(), 10);
                query.minYear = parseInt($(`#${tstep_id}-min-year`).val().trim(), 10);
            } else {
                query.startYear = parseInt($(`#${bp_id}-start`).val().trim(), 10);
                query.endYear = parseInt($(`#${bp_id}-end`).val().trim(), 10);
                query.minYear = parseInt($(`#${bp_id}-min`).val().trim(), 10);
            }
        } else {
            query.dataset = DATA_SET.rawdata;
        }
    }

    const colorbar = colorbarGetData();
    if (!colorbar) {
        return false;
    }
    query.colorbar = colorbar;

    return query;
}

function displayClimateAnalysisMap(time_res, options, map) {
    const query = queryParamsAnalysisMap(time_res);

    if (!query) {
        return false;
    }

    const endpoint = createEndpoint(
        'climate_analysis',
        'climate_analysis_map'
    );

    ajaxLeafletMap(
        endpoint,
        query,
        displayRasterImage,
        options,
        map
    );

    updateAnalysisMapDate(time_res, query, map);

    return true;
}

////////////

function queryParamsAnalysisMapEnso(time_res) {
    let query = new Object();
    query.temporalRes = time_res;
    query.variable = $(`#${time_res}-map-variable`).val();
    query.climVariable = $(`#${time_res}-map-clim-variable`).val();

    const tstep_id = `${time_res}-map-date`;
    query.seasStart = parseInt($(`#${tstep_id}-calendar`).val(), 10);
    query.seasLength = parseInt($(`#${tstep_id}-length`).val(), 10);

    const bp_id = `${time_res}-base-period`;
    query.startYear = parseInt($(`#${bp_id}-start`).val().trim(), 10);
    query.endYear = parseInt($(`#${bp_id}-end`).val().trim(), 10);
    query.minYear = parseInt($(`#${bp_id}-min`).val().trim(), 10);

    query.ensoIndices = $(`#${time_res}-tercile-analysis`).val();
    query.ensoTercile = $(`#${time_res}-enso-phases-select`).val();
    query.climTercile = $(`#${time_res}-climate-tercile-select`).val();

    query.dataset = DATA_SET[query.variable];
    query.inputData = DATA_SET.timeres;
    query.timeSeries = false;
    query.minFrac = 0.95;
    query.fullSeas = true;

    query.mapType = 'climatology';

    const colorbar = colorbarGetData();
    if (!colorbar) {
        return false;
    }
    query.colorbar = colorbar;

    return query;
}

function displayClimateAnalysisMapEnso(time_res, options, map) {
    const query = queryParamsAnalysisMapEnso(time_res);

    if (!query) {
        return false;
    }

    const endpoint = createEndpoint(
        'climate_analysis',
        'climate_analysis_map_enso'
    );

    ajaxLeafletMap(
        endpoint,
        query,
        displayRasterImage,
        options,
        map
    );

    updateAnalysisMapDate(time_res, query, map);

    return true;
}

////////////

function updateAnalysisMapDate(time_res, query, map) {
    let date = '';

    if (query.mapType === 'climatology') {
        date = displayClimatoDateMap(time_res);

        if (date) {
            map.displayText_date.update(date);
            return;
        }

        setTimeout(() => {
            const delayedDate = displayClimatoDateMap(time_res);
            map.displayText_date.update(delayedDate);
        }, 100);

        return;
    }

    date = displayTimeSeriesDateMap(query);
    map.displayText_date.update(date);
}

function displayClimatoDateMap(time_res) {
    const tstep_id = `${time_res}-map-date`;
    let date;
    if (time_res === 'seasonal') {
        const mon = parseInt($(`#${tstep_id}-calendar`).val(), 10);
        const len = parseInt($(`#${tstep_id}-length`).val(), 10);
        date = defineSeasonMonths(mon, len, long = false);
    } else {
        date = $(`#${tstep_id}-calendar option:selected`).text();
    }

    return date;
}

function displayTimeSeriesDateMap(query) {
    let date;
    if (query.temporalRes === 'seasonal') {
        // const m1 = parseInt(query.Date.slice(5, 7), 10);
        // const m2 = parseInt(query.Date.slice(13, 15), 10);
        date = query.Date;
    } else if (query.temporalRes === 'daily') {
        const sYear = parseInt(query.Year, 10);
        const sMon = parseInt(query.startMonth, 10);
        const sDay = parseInt(query.startDay, 10);
        const eMon = parseInt(query.endMonth, 10);
        const eDay = parseInt(query.endDay, 10);
        const sameYearSeason = (sMon < eMon) || (sMon === eMon && sDay <= eDay);
        const eYear = sameYearSeason ? sYear : sYear + 1;
        const start = `${sYear}-${String(sMon).padStart(2, '0')}-${String(sDay).padStart(2, '0')}`;
        const end = `${eYear}-${String(eMon).padStart(2, '0')}-${String(eDay).padStart(2, '0')}`;
        date = `${start}_${end}`;
    } else {
        date = query.Date;
    }

    return date;
}