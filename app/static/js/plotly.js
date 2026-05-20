var plotly_themecolors = {
    dark: {
        color: '#f8f9fa',
        fontcolor: '#ffffff',
        bgcolor: 'rgba(0, 0, 0, 0.7)',
    },
    light: {
        color: '#6c757d',
        fontcolor: '#000000',
        bgcolor: 'rgba(255, 255, 255, 0.7)',
    }
};

var expand_layout = {
    margin: { t: 10, b: 50, l: 60, r: 20 },
    paper_bgcolor: 'rgba(255, 255, 255, 0)',
    plot_bgcolor: 'rgba(255, 255, 255, 0)',
    xaxis: {
        mirror: true,
    },
    yaxis: {
        mirror: true,
    }
};

var preview_layout = {
    margin: { t: 10, b: 30, l: 30, r: 10 },
    paper_bgcolor: 'rgba(0, 0, 0, 0)',
    plot_bgcolor: 'rgba(0, 0, 0, 0)',
    xaxis: {
        mirror: true,
        color: plotly_themecolors[localStorage.getItem('theme')].color,
        gridcolor: plotly_themecolors[localStorage.getItem('theme')].color,
    },
    yaxis: {
        mirror: true,
        color: plotly_themecolors[localStorage.getItem('theme')].color,
        gridcolor: plotly_themecolors[localStorage.getItem('theme')].color,
    },
    yaxis2: {
        mirror: true,
        color: plotly_themecolors[localStorage.getItem('theme')].color,
        gridcolor: plotly_themecolors[localStorage.getItem('theme')].color,
    },
};

var plotly_config = {
    responsive: true,
    //// editable title, axis labels
    // editable: true,
    displaylogo: false,
    //// modebar
    displayModeBar: false,
};

var plotly_rangeslider = {
    visible: true,
    thickness: 0.04,
    borderwidth: 1,
    bordercolor: 'gray',
    // bgcolor: 'lightgray',
    bgcolor: 'transparent',
};

function setPlotlyColors() {
    const theme = $('html').attr('data-bs-theme');
    const layout = {
        xaxis: {
            color: plotly_themecolors[theme].color,
            gridcolor: plotly_themecolors[theme].color,
            tickfont: {
                color: plotly_themecolors[theme].fontcolor,
            },
        },
        yaxis: {
            color: plotly_themecolors[theme].color,
            gridcolor: plotly_themecolors[theme].color,
            tickfont: {
                color: plotly_themecolors[theme].fontcolor,
            },
        },
        yaxis2: {
            color: plotly_themecolors[theme].color,
            gridcolor: plotly_themecolors[theme].color,
            tickfont: {
                color: plotly_themecolors[theme].fontcolor,
            },
        },
        legend: {
            font: {
                color: plotly_themecolors[theme].fontcolor,
            }
        },
    }

    return layout;
}

function hoverlabelColors(theme) {
    theme = (theme === 'dark') ? 'light' : 'dark';
    return {
        font: {
            color: plotly_themecolors[theme].fontcolor
        },
        bgcolor: plotly_themecolors[theme].bgcolor,
    };
}

function setPlotlyThemeColors(container) {
    const gd = document.getElementById(container);
    $('#btn-theme-toggle').on('click', () => {
        const theme = $('html').attr('data-bs-theme');

        if ('shapes' in gd.layout) {
            for (let i = 0; i < gd.layout.shapes.length; i++) {
                if ('action' in gd.layout.shapes[i]) {
                    if (gd.layout.shapes[i].action === 'change-color') {
                        if ('line' in gd.layout.shapes[i]) {
                            if ('color' in gd.layout.shapes[i].line) {
                                gd.layout.shapes[i].line.color = plotly_themecolors[theme].color;
                            }
                        }
                    }
                }
            }
        }

        let layout = deepMerge(gd.layout, setPlotlyColors());

        const colors = [];
        Object.keys(plotly_themecolors).forEach(key => {
            colors.push(plotly_themecolors[key].fontcolor);
        });
        const yax_tck_col = gd.layout.yaxis.tickfont.color;
        const eq_yax_tck_col = colors.includes(yax_tck_col);
        if (!eq_yax_tck_col) {
            layout.yaxis.tickfont.color = yax_tck_col;
        }
        const yax_tck_col2 = gd.layout.yaxis2.tickfont.color;
        const eq_yax_tck_col2 = colors.includes(yax_tck_col2);
        if (!eq_yax_tck_col2) {
            layout.yaxis2.tickfont.color = yax_tck_col2;
        }

        const theme1 = (theme === 'dark') ? 'light' : 'dark';
        if ('spikecolor' in gd.layout.xaxis) {
            layout.yaxis.spikecolor = plotly_themecolors[theme1].fontcolor;
            layout.yaxis2.spikecolor = plotly_themecolors[theme1].fontcolor;
        }

        if ('hoverlabel' in gd.layout) {
            layout.yaxis.hoverlabel = hoverlabelColors(theme1);
            layout.yaxis2.hoverlabel = hoverlabelColors(theme1);
        }

        Plotly.relayout(gd, layout);
    });
}

function downloadPlotlyImageJPG(container) {
    var gd = document.getElementById(container);
    const plot_layout = gd.layout;
    const plot_layout_copy = makeCopy(plot_layout);
    var print_layout = {
        paper_bgcolor: 'white',
        plot_bgcolor: 'white',
        xaxis: {
            rangeslider: { visible: false },
            rangeselector: { visible: false },
            title: { color: 'black' },
            tickfont: { color: 'black' },
            color: 'black',
            showline: true,
            showgrid: true,
            gridcolor: 'gray',
            gridwidth: 1,
            griddash: 'dot',
            mirror: true,
        },
        yaxis: {
            title: { color: 'black' },
            tickfont: { color: 'black' },
            color: 'black',
            ticks: 'outside',
            ticklen: 8,
            showline: true,
            showgrid: true,
            gridcolor: 'gray',
            gridwidth: 1,
            griddash: 'dot',
            mirror: true,
        },
        yaxis2: {
            title: { color: 'black' },
            tickfont: { color: 'black' },
            color: 'black',
            ticks: 'outside',
            ticklen: 8,
            showline: true,
            showgrid: true,
            gridcolor: 'gray',
            gridwidth: 1,
            griddash: 'dot',
            mirror: true,
        }
    }

    if ('print_legend' in plot_layout) {
        print_layout.showlegend = true;
        const len = gd.data.map(x => x.name.length);
        if (Math.max(...len) > 15) {
            print_layout.legend = {
                orientation: 'h',
                xanchor: 'center',
                x: 0.5,
                yanchor: 'top',
                y: -0.1,
            };
            print_layout.margin = { b: 100 };
        }
    }
    const legend_color = {
        legend: {
            font: { color: 'black' },
        },
    };
    print_layout = deepMerge(print_layout, legend_color);
    gd.layout = deepMerge(plot_layout, print_layout);

    Plotly.downloadImage(gd, {
            filename: 'this_graph',
            format: 'jpeg',
            // width: 920,
            // height: 450
        })
        .then(function(dataUrl) {
            // const img = document.createElement('img');
            // img.src = dataUrl;
            // document.body.appendChild(img);
            gd.layout = plot_layout_copy;
        })
        .catch(function(error) {
            const msg = 'Error generating image';
            console.error(msg + ':', error);
            flashMessage(msg, 'error');
        });
}

function addRangeselector(container, ranges, last_date) {
    displayRangeselector(container, ranges);
    const range_id = getRangeselectorId(container);
    const button = $(`#${range_id} .rangeselector-btn`);
    button.on('click', function() {
        const range_key = $(this).data('range');
        createRangeselector(container, $(this), range_key, last_date);
    });

    const eltChart = document.getElementById(container);
    eltChart.on('plotly_relayout', function(event_data) {
        const keys = Object.keys(event_data || {});
        const isFromExternal = keys.some(k => k.startsWith('xaxis.range') || k === 'xaxis.autorange');
        if (!isFromExternal) button.removeClass('active');
    });
}

function getRangeselectorId(container) {
    const modal_body = $(`#${container}`).parent().parent();
    const div_row = modal_body.children().eq(0);
    return div_row.children().eq(0).attr('id');
}

function displayRangeselector(container, ranges) {
    const range_id = getRangeselectorId(container);
    const buttons = $(`#${range_id} button[data-range]`);
    buttons.each(function() {
        const btn = $(this);
        const drg = btn.attr('data-range');
        if (ranges.includes(drg)) {
            btn.show();
        } else {
            btn.hide();
        }
    });
}

function showRangeselector(container, action) {
    const range_id = getRangeselectorId(container);
    const buttons = $(`#${range_id} button[data-range]`);
    buttons.each(function() {
        const btn = $(this);
        if (action) {
            btn.show();
        } else {
            btn.hide();
        }
    });
}

function computeRangeselector(range_key, last_date) {
    const end = new Date(last_date);
    let start = null;

    switch (range_key) {
        case '1M':
            start = new Date(end);
            start.setMonth(end.getMonth() - 1);
            break;
        case '3M':
            start = new Date(end);
            start.setMonth(end.getMonth() - 3);
            break;
        case '6M':
            start = new Date(end);
            start.setMonth(end.getMonth() - 6);
            break;
        case 'YTD':
            start = new Date(end.getFullYear(), 0, 1);
            break;
        case '1Y':
            start = new Date(end);
            start.setFullYear(end.getFullYear() - 1);
            break;
        case '5Y':
            start = new Date(end);
            start.setFullYear(end.getFullYear() - 5);
            break;
        case '10Y':
            start = new Date(end);
            start.setFullYear(end.getFullYear() - 10);
            break;
        case '15Y':
            start = new Date(end);
            start.setFullYear(end.getFullYear() - 15);
            break;
        case '20Y':
            start = new Date(end);
            start.setFullYear(end.getFullYear() - 20);
            break;
        case '25Y':
            start = new Date(end);
            start.setFullYear(end.getFullYear() - 25);
            break;
        case '30Y':
            start = new Date(end);
            start.setFullYear(end.getFullYear() - 30);
            break;
        case 'ALL':
        default:
            start = null;
            break;
    }
    return start;
}

function createRangeselector(container, button, range_key, last_date) {
    const range_id = getRangeselectorId(container);
    const this_button = $(`#${range_id} .rangeselector-btn`);
    this_button.removeClass('active');
    button.addClass('active');

    const start = computeRangeselector(range_key, last_date);
    if (!start) {
        Plotly.relayout(container, {
            'xaxis.autorange': true,
            'xaxis.range': null
        });
    } else {
        Plotly.relayout(container, {
            'xaxis.autorange': false,
            'xaxis.range': [start.toISOString(), last_date.toISOString()]
        });
    }
}

function setPlotlyLanguage() {
    const ils = LANG_USER.list.map(l => l.code).indexOf(LANG_USER.code);
    const localeS = LANG_USER.list[ils].locale;
    Plotly.setPlotConfig({ locale: localeS });
}

function purgePlotlyChart(containerID) {
    const gd = document.getElementById(containerID);
    if (gd && gd.data) {
        Plotly.purge(gd);
    }
}

function purgePlotlyChartExpandModal(expandID) {
    const modalExpID = $(`#modal-expand-${expandID}`);
    const chartID = `container-chart-${expandID}`
    modalExpID.on('hidden.bs.modal', function() {
        purgePlotlyChart(chartID);
    });
}

function formatPlotlyHoverDate(time, time_res) {
    const ils = LANG_USER.list.map(l => l.code)
        .indexOf(LANG_USER.code);
    const localeS = LANG_USER.list[ils].locale;

    const date = new Date(time);
    const month = date.toLocaleString(
        localeS, { month: 'long' }
    );
    const year = date.getFullYear();

    if (time_res === 'monthly') {
        return `${month} ${year}`;
    } else if (time_res === 'dekadal') {
        const day = date.getDate();
        const dk = day <= 10 ? 1 : (day >= 21 ? 3 : 2);
        return `dekad-${dk} ${month} ${year}`;
    }

    return '';
}