function jcalendarTheme() {
    const svg_prev = $('.jcalendar-prev').css('background-image');
    const svg_next = $('.jcalendar-next').css('background-image');
    const theme = localStorage.getItem('theme');
    const th_styles = {
        'dark': {
            'bgcolor': theme_styles['dark'].bgcolor,
            'color': '#f8f9fa',
            'selected': theme_styles['dark'].hover,
            'disabled': '#fff',
            'svgprev': svg_prev.replace('fill=%27%23000%27', 'fill=%27%23fff%27'),
            'svgnext': svg_next.replace('fill=%27%23000%27', 'fill=%27%23fff%27')
        },
        'light': {
            'bgcolor': theme_styles['light'].bgcolor,
            'color': '#212529',
            'selected': theme_styles['light'].hover,
            'disabled': '#000',
            'svgprev': svg_prev.replace('fill=%27%23fff%27', 'fill=%27%23000%27'),
            'svgnext': svg_next.replace('fill=%27%23fff%27', 'fill=%27%23000%27')
        }
    };

    $('.jcalendar-prev').css('background-image', th_styles[theme].svgprev);
    $('.jcalendar-next').css('background-image', th_styles[theme].svgnext);

    $('.jcalendar-table, .jcalendar-table table').css({
        'background-color': th_styles[theme].bgcolor,
        'color': th_styles[theme].color,
        'font-weight': 700
    });
    $('.jcalendar-selected').css('background-color', th_styles[theme].selected);
    $('.jcalendar-disabled').css({
        'color': th_styles[theme].disabled,
        'font-weight': 100
    });

    $('.jcalendar-header, .jcalendar-prev, .jcalendar-next').on('click', () => {
        $('.jcalendar-selected').css('background-color', th_styles[theme].selected);
        $('.jcalendar-disabled').css({
            'color': th_styles[theme].disabled,
            'font-weight': 100
        });
    });

    // $('.jcalendar_warning').css('color', 'red');
    // $('.jcalendar_warning').css('color', 'var(--bs-body-color) !important');

    changeHoverColorTheme('.offcanvas-body fieldset .form-control', theme_styles[theme].hover);
    changeHoverColorTheme('.modal-expand-charts fieldset .form-control', theme_styles[theme].hover);
}

function jcalendarHover() {
    const theme = localStorage.getItem('theme');
    $('.jcalendar-set-year, .jcalendar-set-month, .jcalendar-set-day').hover(
        function() {
            $(this).css({
                'background-color': theme_styles[theme].hover,
                // 'color': theme_styles[theme].color
            });
        },
        function() {
            if ($(this).hasClass('jcalendar-selected')) {
                $(this).css({
                    'background-color': theme_styles[theme].selected,
                    // 'color': ''
                });
            } else {
                $(this).css({
                    'background-color': '',
                    // 'color': ''
                });
            }
        }
    );
}

function monthlyDateCalendar(divContainerID, variableID, dataset, dispDate = null) {
    const variable = $(`#${variableID} option:selected`).val();
    const temp_cov = getTempCoverageCalendar(dataset, 'monthly', variable);

    let divCont = $(`#${divContainerID}`);
    divCont.empty();
    const calendarID = `${divContainerID}-calendar`;
    $('<input>', { type: 'text', id: calendarID })
        .addClass('form-control').appendTo(divCont);

    if (dispDate === null) {
        dispDate = temp_cov.end;
    }

    const months = getListOfMonthsCalendar();
    const inputDateID = document.getElementById(calendarID);
    const calendar = jSuites.calendar(inputDateID, {
        type: 'year-month-picker',
        value: dispDate,
        fullscreen: false,
        readonly: false,
        format: 'YYYY-MM',
        months: months.short,
        monthsFull: months.long,
        validRange: [temp_cov.start, temp_cov.end],
        onopen: function() {
            $('.jcalendar-controls').hide();
            jcalendarTheme();
            jcalendarHover();
        },
        onupdate: function() {
            jcalendarHover();
        }
    });
    const theme = localStorage.getItem('theme');
    const color = theme_styles[theme].hover;
    changeHoverColorTheme(`#${calendarID}`, color);
}

function getListOfMonthsCalendar() {
    const ils = LANG_USER.list.map(l => l.code).indexOf(LANG_USER.code);
    const localeS = LANG_USER.list[ils].locale;
    const short = Array.from({ length: 12 }, (item, i) => {
        return new Date(0, i).toLocaleString(localeS, { month: 'short' })
    });
    const long = Array.from({ length: 12 }, (item, i) => {
        return new Date(0, i).toLocaleString(localeS, { month: 'long' })
    });
    return { short: short, long: long }
}

function monthsNamesCalendar(divContainerID, dropdownParent = $(document.body)) {
    let divCont = $(`#${divContainerID}`);
    divCont.empty();
    const calendarID = `${divContainerID}-calendar`;
    let select = $('<select>').attr('id', calendarID)
        .addClass('form-select form-select2-nosearch')
        .appendTo(divCont)
        .css('width', '100%');
    const months = getListOfMonthsCalendar().long;

    for (let m = 0; m < months.length; m++) {
        select.append(
            $('<option>').text(months[m]).val(m + 1)
        );
    }
    select.val('1');
    select.select2({
        minimumResultsForSearch: -1,
        dropdownParent: dropdownParent
    });

    // var theme = localStorage.getItem('theme');
    // var color = theme_styles[theme].hover;
    // changeHoverColorTheme(`#${calendarID}`, color);
}

function getTempCoverageCalendar(dataset, tempres, variable) {
    const info_var = DATA_INFO[dataset][tempres][variable];
    const temp_coverage = info_var['temporal_coverage'];
    if (tempres === 'daily') {
        start = temp_coverage.start;
        end = temp_coverage.end;
    } else if (tempres === 'dekadal') {
        start = calendarFormatDekadalStr(temp_coverage.start);
        end = calendarFormatDekadalStr(temp_coverage.end);
    } else if (tempres === 'monthly') {
        start = calendarFormatMonthlyStr(temp_coverage.start);
        end = calendarFormatMonthlyStr(temp_coverage.end);
    } else if (tempres === 'annual') {
        start = calendarFormatAnnualStr(temp_coverage.start);
        end = calendarFormatAnnualStr(temp_coverage.end);
    } else {
        start = calendarFormatSeasonalStr(temp_coverage.start);
        end = calendarFormatSeasonalStr(temp_coverage.end);
    }
    return { start: start, end: end }
}

function getTemporalRangeCalendar(dataset, tempres, variable, nb_year) {
    const temp_cov = getTempCoverageCalendar(dataset, tempres, variable);
    const end_year = Number(temp_cov.end.split('-')[0]);
    const start_year = end_year - nb_year + 1;
    const start = `${start_year}-01-01`;
    return { start: start, end: temp_cov.end };
}

function calendarFormatDekadalStr(str_date) {
    let dk = str_date.split('-');
    if (dk[2] === '1') {
        d = '01';
    } else if (dk[2] === '2') {
        d = '11';
    } else {
        d = '21';
    }
    dk[2] = d;
    return dk.join('-');
}

function calendarFormatMonthlyStr(str_date) {
    return `${str_date}-16`;
}

function calendarFormatAnnualStr(str_date) {
    return `${str_date}-01-16`;
}

function calendarFormatSeasonalStr(str_date) {
    return `${str_date}-16`;
}

function formatDateToString(date) {
    const dd = new Date(date);
    const year = dd.getFullYear();
    const month = (dd.getMonth() + 1).toString().padStart(2, '0');
    const day = dd.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}