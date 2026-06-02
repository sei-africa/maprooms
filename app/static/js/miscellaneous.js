function arrayRemoveDuplicates(arr) {
    return arr.filter((item, index) => arr.indexOf(item) === index);
}

function setVisibility(showIds = [], hideIds = []) {
    showIds.forEach(id => $(`#${id}`).show());
    hideIds.forEach(id => $(`#${id}`).hide());
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

function getInputGroupHeight() {
    const divCont = $('<div>')
        .attr('id', 'test-div')
        .addClass('input-group')
        .appendTo('body');
    const span = $('<span>')
        .addClass('input-group-text')
        .text('Test')
        .appendTo(divCont);
    const hgt = span.outerHeight();
    divCont.remove();
    return hgt;
}

function getSelect2Height() {
    const divCont = $('<div>')
        .attr('id', 'test-div')
        .appendTo('body');
    let select = $('<select>')
        .attr('id', 'test-id')
        .addClass('form-select')
        .appendTo(divCont);
    select.append(
        $('<option>').text('Test').val(1)
    );
    select.select2({
        minimumResultsForSearch: -1
    }).trigger('change');
    const hgt = $('#select2-test-id-container')
        .outerHeight();
    divCont.remove();
    return hgt;
}

function adjustSelect2Height(select_id, input_group = true) {
    let hgt;
    if (input_group) {
        hgt = getInputGroupHeight();
    } else {
        hgt = getSelect2Height();
    }
    const hgt0 = parseInt(hgt, 10);
    const hgt1 = hgt0 - 2;

    const $select2 = $(`#${select_id}`).next('.select2');
    $select2.find('.select2-selection--single')
        .css({
            'min-height': hgt0 + 'px'
        });
    $select2.find('.select2-selection__rendered')
        .css({
            'line-height': hgt1 + 'px'
        });
    $select2.find('.select2-selection__arrow')
        .css({
            'height': hgt1 + 'px'
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

function getDataSpatialResolution0(tempRes) {
    const maptype = $(`#${tempRes}-map-type option:selected`).val();
    const variable = $(`#${tempRes}-map-variable option:selected`).val();
    const dset = DATA_SET[maptype];
    const data = DATA_INFO[dset][tempRes][variable];
    return data.spatial_resolution;
}

function getDataSpatialResolution1(tempRes) {
    const maptype = $(`#${tempRes}-map-type option:selected`).val();
    const variable = $(`#${tempRes}-map-variable option:selected`).val();
    const dset = DATA_SET[maptype];
    const pvar = DATA_SET.varid[variable];
    const data = DATA_INFO[dset][tempRes][pvar];
    return data.spatial_resolution;
}

function refreshSpatialAverage(tempRes, id) {
    const funRes = id === 0 ?
        getDataSpatialResolution0 :
        getDataSpatialResolution1;

    const dataRes = funRes(tempRes);
    setSelectSpatialAverage(dataRes);
}

//////////////

function setOffCanvasMapControl(tempRes) {
    const tstep_id = `${tempRes}-map-date`;

    setAnalysisSeasonLength(tempRes);

    $(`#${tempRes}-map-variable`)
        .off(`change.${tempRes}Variable`)
        .on(`change.${tempRes}Variable`, function() {
            refreshSpatialAverage(tempRes, 0);
            setAnalysisThresholdDef(tempRes);
        });

    $(`#${tempRes}-map-climato-func`)
        .off(`change.${tempRes}ClimatoFunc`)
        .on(`change.${tempRes}ClimatoFunc`, function() {
            setAnalysisClimatoFun(tempRes);
        });

    if (tempRes === 'seasonal') {
        $(`#${tstep_id}-length`)
            .off(`change.${tempRes}SeasonLength`)
            .on(`change.${tempRes}SeasonLength`, function() {
                const map_type = $(`#${tempRes}-map-type`).val();
                setAnalysisSeasonMonths(tempRes, map_type);
            });
    }

    $(`#${tempRes}-map-type`)
        .off(`change.${tempRes}MapType`)
        .on(`change.${tempRes}MapType`, function() {
            const map_type = $(this).val();
            if (map_type === 'climatology') {
                setNamesCalendar(
                    `${tempRes}-map-date`, tempRes
                );
                setVisibility(
                    [
                        `${tempRes}-map-climato`,
                        `div-${tempRes}-base-period`
                    ],
                    [`${tempRes}-map-anomaly`]
                );

                setAnalysisClimatoFun(tempRes);

                if (tempRes === 'seasonal') {
                    setAnalysisSeasonMonths(tempRes, map_type);
                    adjustSelect2Height(`${tstep_id}-length`, false);
                }
            } else {
                const dataset = map_type === 'anomaly' ?
                    DATA_SET.anomaly : DATA_SET.rawdata;

                if (map_type === 'anomaly') {
                    setVisibility(
                        [
                            `${tempRes}-map-anomaly`,
                            `div-${tempRes}-base-period`
                        ],
                        [`${tempRes}-map-climato`]
                    );
                } else {
                    setVisibility(
                        [],
                        [
                            `${tempRes}-map-anomaly`,
                            `div-${tempRes}-base-period`,
                            `${tempRes}-map-climato`
                        ]
                    );
                }

                setDateCalendar(
                    `${tempRes}-map-date`,
                    `${tempRes}-map-variable`,
                    dataset, tempRes
                );

                if (tempRes === 'seasonal') {
                    setAnalysisSeasonMonths(tempRes, map_type);
                    adjustSelect2Height(`${tstep_id}-length`, true);
                }
            }
            refreshSpatialAverage(tempRes, 0);
        });

    $(`#${tempRes}-map-variable`).trigger('change');
    $(`#${tempRes}-map-type`).trigger('change');
    $(`#${tempRes}-map-climato-func`).trigger('change');
}

function setAnalysisSeasonLength(tempRes) {
    if (tempRes !== 'seasonal') return;

    const tstepID = `${tempRes}-map-date`;
    const seasLenId = $(`#${tstepID}-length`);

    if (seasLenId.children().length === 0) {
        for (let l = 2; l <= 12; l++) {
            seasLenId.append(
                $('<option>').text(l).val(l)
            );
        }
        seasLenId.val(3);
    }
}

function setAnalysisSeasonMonths(tempRes, mapType) {
    if (tempRes !== 'seasonal') return;

    const map_type = $(`#${tempRes}-map-type`).val();
    const tstepID = `${tempRes}-map-date`;
    const this_len = parseInt($(`#${tstepID}-length`).val(), 10);

    let this_mon;
    if (mapType === 'climatology') {
        this_mon = parseInt($(`#${tstepID}-calendar`).val(), 10);
    } else {
        const this_date = $(`#${tstepID}-calendar`).val();
        this_mon = parseInt(this_date.split('-')[1], 10);
    }

    if (!Number.isFinite(this_mon) || !Number.isFinite(this_len)) return;

    const seas_mon = defineSeasonMonths(this_mon, this_len);
    $(`#${tempRes}-season-months`).text(seas_mon);
}

function setAnalysisClimatoFun(tempRes) {
    const climFun = $(`#${tempRes}-map-climato-func`).val();

    const ids = {
        percentile: `div-${tempRes}-map-climato-perc`,
        frequency: `div-${tempRes}-map-climato-freq`,
        probability: `div-${tempRes}-map-climato-proba`,
        trend: `div-${tempRes}-map-climato-trend`
    };
    const allIds = Object.values(ids);

    if (climFun === 'percentile') {
        setVisibility([ids.percentile], allIds.filter(id => id !== ids.percentile));
    } else if (climFun === 'frequency') {
        setVisibility([ids.frequency], allIds.filter(id => id !== ids.frequency));
        adjustSelect2Height(`${tempRes}-map-climato-freqOp`, true);
    } else if (['probExc', 'probNoExc'].includes(climFun)) {
        setVisibility([ids.probability], allIds.filter(id => id !== ids.probability));
    } else if (climFun === 'trend') {
        setVisibility([ids.trend], allIds.filter(id => id !== ids.trend));
    } else {
        setVisibility([], allIds);
    }
}

function setAnalysisThresholdDef(tempRes) {
    const this_var = $(`#${tempRes}-map-variable`).val();

    $(`#${tempRes}-map-climato-freqTh`)
        .val(THRESHOLD_DEF.value[this_var]);
    $(`#${tempRes}-map-climato-freqU`)
        .text(THRESHOLD_DEF.unit[this_var]);

    if (tempRes === 'seasonal') {
        $(`#${tempRes}-map-climato-probaTh`)
            .val(THRESHOLD_DEF.value[this_var]);
        $(`#${tempRes}-map-climato-probaU`)
            .text(THRESHOLD_DEF.unit[this_var]);
    }
}

//////////////

function setOffCanvasMapControlDaily(tempRes) {
    const tstep_id = `${tempRes}-map-date`;
    setMonthsDaysCalendar(
        `${tstep_id}-start-mon`,
        `${tstep_id}-start-day`,
        SEASON_DEF.start_mon,
        SEASON_DEF.start_day,
        true
    );

    setMonthsDaysCalendar(
        `${tstep_id}-end-mon`,
        `${tstep_id}-end-day`,
        SEASON_DEF.end_mon,
        SEASON_DEF.end_day,
        false
    );

    $(`#${tempRes}-map-variable`)
        .off(`change.${tempRes}Variable`)
        .on(`change.${tempRes}Variable`, function() {
            const this_var = $(this).val();

            refreshSpatialAverage(tempRes, 1);
            // 
            $(`#${tempRes}-map-parameters`).empty();
            for (const item of PARAMS_ORDER[this_var]) {
                $(`#${tempRes}-map-parameters`).append(
                    $('<option>').val(item)
                    .text(PARAMS_LIST[this_var][item].select)
                );
            }

            setAnalysisParamsDefDaily(tempRes);
            setAnalysisStatProbaDaily(tempRes);
            setAnalysisMapTypeDaily(tempRes);
        });

    $(`#${tempRes}-map-type`)
        .off(`change.${tempRes}MapType`)
        .on(`change.${tempRes}MapType`, function() {
            setAnalysisMapTypeDaily(tempRes);
        });

    // 
    $(`#${tempRes}-map-statistics`)
        .off(`change.${tempRes}Statistics`)
        .on(`change.${tempRes}Statistics`, function() {
            setAnalysisStatProbaDaily(tempRes);
        });

    // 
    $(`#${tempRes}-map-parameters`)
        .off(`change.${tempRes}Parameters`)
        .on(`change.${tempRes}Parameters`, function() {
            setAnalysisParamsDefDaily(tempRes);
            setAnalysisStatProbaDaily(tempRes);
        });

    $(`#${tstep_id}-tseries-year`)
        .on('input', function() {
            const this_year = $(this).val();
            $('#input-time-navigation').val(this_year);
        });

    $(`#${tempRes}-map-variable`).trigger('change');
}

function setAnalysisMapTypeDaily(time_res) {
    const tstepID = `${time_res}-map-date`;
    const maptype = $(`#${time_res}-map-type`).val();

    if (maptype === 'climatology') {
        setVisibility(
            [
                `div-${tstepID}-climato-years`,
                `${time_res}-map-climato`
            ],
            [`div-${tstepID}-tseries-years`]
        );

        $('#input-time-navigation').val('').prop('disabled', true);
        $('#prev-time-navigation').prop('disabled', true);
        $('#next-time-navigation').prop('disabled', true);

        return;
    }

    setVisibility(
        [`div-${tstepID}-tseries-years`],
        [
            `div-${tstepID}-climato-years`,
            `${time_res}-map-climato`
        ]
    );

    $('#input-time-navigation').prop('disabled', false);
    $('#prev-time-navigation').prop('disabled', false);
    $('#next-time-navigation').prop('disabled', false);

    const this_var = $(`#${time_res}-map-variable`).val();
    const dataset = DATA_SET[maptype];
    const variable = DATA_SET.varid[this_var];
    const year_cov = getTempCoverageYear(
        dataset, time_res, variable
    );
    $(`#${tstepID}-tseries-year`).attr({
        'min': year_cov.start,
        'max': year_cov.end
    }).val(year_cov.end);

    $('#input-time-navigation').val(year_cov.end);
}

function setAnalysisStatProbaDaily(time_res) {
    const this_var = $(`#${time_res}-map-variable`).val();
    const this_par = $(`#${time_res}-map-parameters`).val();
    const this_stat = $(`#${time_res}-map-statistics`).val();

    if (!['probExc', 'probNoExc'].includes(this_stat)) {
        $(`#div-${time_res}-map-climato-proba`).hide();
        return;
    }

    const param = PARAMS_LIST[this_var][this_par];

    $(`#div-${time_res}-map-climato-proba`).show();
    $(`#${time_res}-map-climato-probaTh`).val(param.value);
    $(`#${time_res}-map-climato-parUnit`).text(param.unit);

    adjustSelect2Height(
        `${time_res}-map-climato-probaUnit`, true
    );
}

function setAnalysisParamsDefDaily(time_res) {
    const this_var = $(`#${time_res}-map-variable`).val();
    const this_par = $(`#${time_res}-map-parameters`).val();

    const var_def = PARAMS_DEF[this_var];
    if (!var_def) return false;

    function setNumberInputs() {
        $(`#${time_res}-def-number-thres-lab`)
            .text(var_def.number.label);
        $(`#${time_res}-def-number-thres-txt`)
            .text(var_def.number.text);
        $(`#${time_res}-def-number-thres-val`)
            .val(var_def.number.value);
        $(`#${time_res}-def-number-thres-unit`)
            .text(var_def.number.unit);
    }

    function setSpellInputs() {
        $(`#${time_res}-def-spell-thres-lab`)
            .text(var_def.spell.label);
        $(`#${time_res}-def-spell-thres-val`)
            .val(var_def.spell.value);
        $(`#${time_res}-def-spell-thres-txt`)
            .text(var_def.spell.text);
    }

    const rules = {
        rainfall: {
            numberOnly: ['NumWD', 'NumDD', 'RainInt', 'LongDS'],
            numberAndSpell: ['NumDS', 'NumWS'],
            spellOnly: []
        },
        temperature: {
            numberOnly: ['NumCD', 'NumHD'],
            numberAndSpell: [],
            spellOnly: ['CDD', 'HDD', 'GDD']
        }
    };

    const rule = rules[this_var];
    if (!rule) return false;

    const showNumber =
        rule.numberOnly.includes(this_par) ||
        rule.numberAndSpell.includes(this_par);

    const showSpell =
        rule.spellOnly.includes(this_par) ||
        rule.numberAndSpell.includes(this_par);

    $(`#${time_res}-def-number`).toggle(showNumber);
    $(`#${time_res}-def-spell`).toggle(showSpell);

    if (showNumber) setNumberInputs();
    if (showSpell) setSpellInputs();

    return true;
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
        if (tempRes === 'monthly' || tempRes === 'seasonal') {
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
            dataset = DATA_SET.anomaly;
        } else {
            dataset = DATA_SET.rawdata;
        }

        let str_time;
        if (tempRes === 'monthly' || tempRes === 'seasonal') {
            str_time = `${this_date}-01 00:00:00`;
        } else if (tempRes === 'dekadal') {
            str_time = `${this_date} 00:00:00`;
        } else if (tempRes === 'daily') {
            str_time = `${this_date}-01-01 00:00:00`;
        } else {
            return false;
        }

        const this_time = new Date(str_time);
        if (isNaN(this_time.getTime())) {
            flashMessage(JS_TEXT.date_invalid, 'error');
            return false;
        }

        let variable = $(`#${tempRes}-map-variable`).val();
        if (tempRes === 'daily') {
            variable = DATA_SET.varid[variable];
        }

        const temp_cov = getTempCoverageCalendar(dataset, tempRes, variable);
        const start = new Date(temp_cov.start);
        const end = new Date(temp_cov.end);
        if (this_time < start || this_time > end) {
            flashMessage(JS_TEXT.date_outrange, 'error');
            return false;
        }

        if (tempRes === 'daily') {
            $(`#${tstepID}-tseries-year`).val(this_date);
        } else {
            const calendarElement = document.getElementById(`${tstepID}-calendar`);
            const calendar = calendarElement.calendar;
            if (calendar) {
                calendar.setValue(str_time);
            } else {
                flashMessage(JS_TEXT.date_calendar, 'error');
                return false;
            }
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
        if (tempRes === 'monthly' || tempRes === 'seasonal') {
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
            dataset = DATA_SET.anomaly;
        } else {
            dataset = DATA_SET.rawdata;
        }

        let str_time;
        if (tempRes === 'monthly' || tempRes === 'seasonal') {
            str_time = `${this_date}-01 00:00:00`;
        } else if (tempRes === 'dekadal') {
            str_time = `${this_date} 00:00:00`;
        } else if (tempRes === 'daily') {
            str_time = `${this_date}-01-01 00:00:00`;
        } else {
            return false;
        }

        const this_time = new Date(str_time);
        if (isNaN(this_time.getTime())) {
            flashMessage(JS_TEXT.date_invalid, 'error');
            return false;
        }

        let variable = $(`#${tempRes}-map-variable`).val();
        if (tempRes === 'daily') {
            variable = DATA_SET.varid[variable];
        }

        const temp_cov = getTempCoverageCalendar(dataset, tempRes, variable);
        const start = new Date(temp_cov.start);
        const end = new Date(temp_cov.end);

        let input_date;
        let str_date;
        if (tempRes === 'monthly' || tempRes === 'seasonal') {
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
        } else if (tempRes === 'daily') {
            let prev_year = new Date(this_time);
            const this_year = prev_year.getFullYear();
            prev_year.setFullYear(this_year - 1);
            if (prev_year < start) {
                prev_year = end;
            }
            str_date = formatDateToString(prev_year);
            input_date = str_date.slice(0, 4);
        } else {
            return false;
        }
        $('#input-time-navigation').val(input_date);

        if (tempRes === 'daily') {
            $(`#${tstepID}-tseries-year`).val(input_date);
        } else {
            const calendarElement = document.getElementById(`${tstepID}-calendar`);
            const calendar = calendarElement.calendar;
            if (calendar) {
                calendar.setValue(`${str_date} 00:00:00`);
            } else {
                flashMessage(JS_TEXT.date_calendar, 'error');
                return false;
            }
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
        if (tempRes === 'monthly' || tempRes === 'seasonal') {
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
            dataset = DATA_SET.anomaly;
        } else {
            dataset = DATA_SET.rawdata;
        }

        let str_time;
        if (tempRes === 'monthly' || tempRes === 'seasonal') {
            str_time = `${this_date}-01 00:00:00`;
        } else if (tempRes === 'dekadal') {
            str_time = `${this_date} 00:00:00`;
        } else if (tempRes === 'daily') {
            str_time = `${this_date}-01-01 00:00:00`;
        } else {
            return false;
        }

        const this_time = new Date(str_time);
        if (isNaN(this_time.getTime())) {
            flashMessage(JS_TEXT.date_invalid, 'error');
            return false;
        }

        let variable = $(`#${tempRes}-map-variable`).val();
        if (tempRes === 'daily') {
            variable = DATA_SET.varid[variable];
        }

        const temp_cov = getTempCoverageCalendar(dataset, tempRes, variable);
        const start = new Date(temp_cov.start);
        const end = new Date(temp_cov.end);

        let input_date;
        let str_date;
        if (tempRes === 'monthly' || tempRes === 'seasonal') {
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
        } else if (tempRes === 'daily') {
            let prev_year = new Date(this_time);
            const this_year = prev_year.getFullYear();
            prev_year.setFullYear(this_year + 1);
            if (prev_year > end) {
                prev_year = start;
            }
            str_date = formatDateToString(prev_year);
            input_date = str_date.slice(0, 4);
        } else {
            return false;
        }
        $('#input-time-navigation').val(input_date);

        if (tempRes === 'daily') {
            $(`#${tstepID}-tseries-year`).val(input_date);
        } else {
            const calendarElement = document.getElementById(`${tstepID}-calendar`);
            const calendar = calendarElement.calendar;
            if (calendar) {
                calendar.setValue(`${str_date} 00:00:00`);
            } else {
                flashMessage(JS_TEXT.date_calendar, 'error');
                return false;
            }
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
        DATA_SET.rawdata,
        tempRes, disp_end,
        mapNavigation = false
    );

    const start_date = $(`#${tempRes}-chart-raw-startdate-calendar`).val();
    let disp_start;
    if (start_date === '') {
        const varTs = $(`#${tempRes}-chart-raw-variable`).val();
        const trange = getTemporalRangeCalendar(
            DATA_SET.rawdata,
            tempRes, varTs, 5
        );
        disp_start = trange.start;
    } else {
        disp_start = start_date;
    }

    setDateCalendar(
        `${tempRes}-chart-raw-startdate`,
        `${tempRes}-chart-raw-variable`,
        DATA_SET.rawdata,
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

    let disp_year = false;
    if (tempRes === 'seasonal') {
        disp_year = true;
    }

    const end_date = $(`#${tempRes}-chart-anom-enddate-calendar`).val();
    let disp_end;
    if (end_date === '') {
        disp_end = null;
    } else {
        if (end_date.length == 4) {
            disp_end = `${end_date}-12`;
        } else {
            disp_end = end_date;
        }
    }

    setDateCalendar(
        `${tempRes}-chart-anom-enddate`,
        `${tempRes}-chart-anom-variable`,
        DATA_SET.anomaly,
        tempRes, disp_end,
        mapNavigation = false,
        dispYear = disp_year
    );

    const start_date = $(`#${tempRes}-chart-anom-startdate-calendar`).val();
    let disp_start;
    if (start_date === '') {
        const varTs = $(`#${tempRes}-chart-anom-variable`).val();
        const trange = getTemporalRangeCalendar(
            DATA_SET.anomaly,
            tempRes, varTs, 30
        );
        disp_start = trange.start;
    } else {
        if (start_date.length == 4) {
            disp_start = `${start_date}-01`;
        } else {
            disp_start = start_date;
        }
    }

    setDateCalendar(
        `${tempRes}-chart-anom-startdate`,
        `${tempRes}-chart-anom-variable`,
        DATA_SET.anomaly,
        tempRes, disp_start,
        mapNavigation = false,
        dispYear = disp_year
    );

    // 
    if (tempRes === 'seasonal') {
        const seasLenId = $(`#${tempRes}-chart-anom-seaslen`);
        for (let l = 2; l <= 12; l++) {
            seasLenId.append(
                $('<option>').text(l).val(l)
            );
        }
        seasLenId.val(3);
    }

    // 
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

    // 
    if (tempRes === 'seasonal') {
        $(`#${tempRes}-chart-anom-seaslen`)
            .off('change.chartTsAnom')
            .on('change.chartTsAnom', function() {
                expand_analysis_charts_anomaly(contChart, tempRes);
            });
    }

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

function setProbaPlotContainer(data, container) {
    const divCont = $(`#${container}`);
    const divRow = $('<div>')
        .addClass('row flex-nowrap h-100')
        .appendTo(divCont);

    const cont_plot = `${container}-plot`;
    $('<div>')
        .attr('id', cont_plot)
        .addClass('col-md-8')
        .css({
            'width': '75%',
            'height': '100%'
        })
        .appendTo(divRow);

    const div_distr = `${container}-distr-div`;
    const divDistr = $('<div>')
        .attr('id', div_distr)
        .addClass('col-md-4 m-2 p-2')
        .css({
            'width': '22%',
            'height': '84%',
            'border': '1px solid #d0d7de'
        })
        .appendTo(divRow);

    $('<h5>')
        .appendTo(divDistr)
        .text('Fitted Distribution');

    const frmtJson = JSON.stringify(
        data.info.proba, null, 2
    );
    const pre_distr = `${container}-distr-pre`;
    $('<pre>')
        .attr('id', pre_distr)
        .appendTo(divDistr)
        .text(frmtJson);

    divDistr.hide();

    return cont_plot
}

function setAnalysisExpandModalProba(tempRes, contID) {
    showModalDialog(`modal-expand-${contID}`);
    expandModalCharts(
        contID,
        expand_analysis_charts_proba,
        tempRes
    );
    purgePlotlyChartExpandModal(contID);

    const end_date = $(`#${tempRes}-chart-proba-enddate-calendar`).val();
    let disp_end;
    if (end_date === '') {
        disp_end = null;
    } else {
        if (end_date.length == 4) {
            disp_end = `${end_date}-12`;
        } else {
            disp_end = end_date;
        }
    }

    setDateCalendar(
        `${tempRes}-chart-proba-enddate`,
        `${tempRes}-chart-proba-variable`,
        DATA_SET.rawdata, tempRes,
        disp_end,
        mapNavigation = false,
        dispYear = true
    );

    const start_date = $(`#${tempRes}-chart-proba-startdate-calendar`).val();
    let disp_start;
    if (start_date === '') {
        const varTs = $(`#${tempRes}-chart-proba-variable`).val();
        const trange = getTemporalRangeCalendar(
            DATA_SET.rawdata,
            tempRes, varTs, 30
        );
        disp_start = trange.start;
    } else {
        if (start_date.length == 4) {
            disp_start = `${start_date}-01`;
        } else {
            disp_start = start_date;
        }
    }

    setDateCalendar(
        `${tempRes}-chart-proba-startdate`,
        `${tempRes}-chart-proba-variable`,
        DATA_SET.rawdata, tempRes,
        disp_start,
        mapNavigation = false,
        dispYear = true
    );

    // 
    if (tempRes === 'seasonal') {
        const sDId = `${tempRes}-chart-proba`;
        setNamesCalendar(
            `${sDId}-startmon`, tempRes,
            $(`#${tempRes}-proba-control`),
            mapNavigation = false
        );

        const seasLenId = $(`#${sDId}-seaslen`);
        for (let l = 2; l <= 12; l++) {
            seasLenId.append(
                $('<option>').text(l).val(l)
            );
        }
        seasLenId.val(3);
    }

    // 
    const contChart = `container-chart-${contID}`;

    $(`#${tempRes}-chart-proba-variable`)
        .off('change.chartTsProba')
        .on('change.chartTsProba', function() {
            expand_analysis_charts_proba(contChart, tempRes);
        });

    if (tempRes === 'seasonal') {
        const sDId = `${tempRes}-chart-proba`;
        $(`#${sDId}-seaslen, #${sDId}-startmon-calendar`)
            .off('change.chartTsProba')
            .on('change.chartTsProba', function() {
                expand_analysis_charts_proba(contChart, tempRes);
            });
    }
    // 

    const updateProbaDataControls = () => {
        if ($(`#${tempRes}-chart-proba-plot-type`).val() === 'cdf') {
            $(`#${tempRes}-chart-proba-plot-cdf`).show();
            $(`#${tempRes}-chart-proba-plot-pdf`).hide();
        } else {
            $(`#${tempRes}-chart-proba-plot-cdf`).hide();
            $(`#${tempRes}-chart-proba-plot-pdf`).show();
        }
    };
    updateProbaDataControls();

    $(`#${tempRes}-chart-proba-plot-type`)
        .off('change.chartTsProba')
        .on('change.chartTsProba', function() {
            updateProbaDataControls();
            maproomDB.getData('data_proba', function(data) {
                expand_analysis_display_proba(data, contChart);
            });
        });

    $(`.${tempRes}-proba-plot`)
        .off('change.chartTsProba')
        .on('change.chartTsProba', function() {
            const pKind = $(this).data('plot');
            const pType = $(this).val();
            const isVisible = $(this).is(':checked');

            const ix = PROBA_PLOT[pKind].indexOf(pType);

            Plotly.restyle(`${contChart}-plot`, {
                visible: isVisible
            }, [ix]);

            if (pType === 'fitted') {
                $(`#${contChart}-distr-div`).toggle(isVisible);
            }
        });

    // update chart
    $(`#plotly-replot-${contID}`)
        .off('click.chartTsProba')
        .on('click.chartTsProba', function() {
            expand_analysis_charts_proba(contChart, tempRes);
        });

    // download chart
    $(`#plotly-download-${contID}`)
        .off('click.chartTsProba')
        .on('click.chartTsProba', function() {
            downloadPlotlyImageJPG(`${contChart}-plot`);
        });
}

function setAnalysisExpandModalSeason(tempRes, contID) {
    showModalDialog(`modal-expand-${contID}`);
    expandModalCharts(
        contID,
        expand_analysis_charts_season,
        tempRes
    );
    purgePlotlyChartExpandModal(contID);

    const end_date = $(`#${tempRes}-chart-season-enddate-calendar`).val();
    let disp_end;
    if (end_date === '') {
        disp_end = null;
    } else {
        if (end_date.length == 4) {
            disp_end = `${end_date}-12`;
        } else {
            disp_end = end_date;
        }
    }

    setDateCalendar(
        `${tempRes}-chart-season-enddate`,
        `${tempRes}-chart-season-variable`,
        DATA_SET.rawdata, tempRes,
        disp_end,
        mapNavigation = false,
        dispYear = true
    );

    const start_date = $(`#${tempRes}-chart-season-startdate-calendar`).val();
    let disp_start;
    if (start_date === '') {
        const varTs = $(`#${tempRes}-chart-season-variable`).val();
        const trange = getTemporalRangeCalendar(
            DATA_SET.rawdata,
            tempRes, varTs, 30
        );
        disp_start = trange.start;
    } else {
        if (start_date.length == 4) {
            disp_start = `${start_date}-01`;
        } else {
            disp_start = start_date;
        }
    }

    setDateCalendar(
        `${tempRes}-chart-season-startdate`,
        `${tempRes}-chart-season-variable`,
        DATA_SET.rawdata, tempRes,
        disp_start,
        mapNavigation = false,
        dispYear = true
    );

    // 
    if (tempRes === 'seasonal') {
        const tstepID = `${tempRes}-chart-season-startmon`;
        setNamesCalendar(
            tstepID, tempRes,
            $(`#${tempRes}-season-control`),
            mapNavigation = false
        );

        const seasLenId = $(`#${tempRes}-chart-season-seaslen`);
        for (let l = 2; l <= 12; l++) {
            seasLenId.append(
                $('<option>').text(l).val(l)
            );
        }
        seasLenId.val(3);
    }

    // 
    const contChart = `container-chart-${contID}`;

    $(`#${tempRes}-chart-season-variable`)
        .off('change.chartTsSeason')
        .on('change.chartTsSeason', function() {
            expand_analysis_charts_season(contChart, tempRes);
        });

    if (tempRes === 'seasonal') {
        const sDId = `${tempRes}-chart-season`;
        $(`#${sDId}-seaslen, #${sDId}-startmon-calendar`)
            .off('change.chartTsSeason')
            .on('change.chartTsSeason', function() {
                expand_analysis_charts_season(contChart, tempRes);
            });
    }

    // update chart
    $(`#plotly-replot-${contID}`)
        .off('click.chartTsSeason')
        .on('click.chartTsSeason', function() {
            expand_analysis_charts_season(contChart, tempRes);
        });

    // download chart
    $(`#plotly-download-${contID}`)
        .off('click.chartTsSeason')
        .on('click.chartTsSeason', function() {
            downloadPlotlyImageJPG(contChart);
        });
}

//////////////

function splitAnomalyDataByStep(ts_dates, ts_data, date, time_res, seas_len = 3) {
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
            this_date = parseInt(m, 10);
        } else if (time_res === 'seasonal') {
            const seas = getSeasonFromDate(ts_dates[i], seas_len);
            this_date = seas.start.getMonth() + 1;
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
                year: parseInt(ar_dates[0], 10),
                month: parseInt(ar_dates[1], 10),
                dekad: parseInt(ar_dates[2], 10),
                value: ts_data[i]
            });
        } else if (time_res === 'monthly') {
            parsed.push({
                year: parseInt(ar_dates[0], 10),
                month: parseInt(ar_dates[1], 10),
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
            let year = parseInt(dataYear, 10);
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