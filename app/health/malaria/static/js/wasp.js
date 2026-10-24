$(document).ready(function() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
        .forEach(element => {
            bootstrap.Tooltip.getOrCreateInstance(element);
        });

    const tempRes = 'monthly';
    const prefix = `${tempRes}-wasp-map`;
    const control = $(`#${prefix}-control`);

    const map = createLeafletTileLayer('div-map-container',MTO_INIT);
    const mapOptions = {};
    const previewHolder = $('#div-chart-wasp')
        .addClass('position-relative')[0];

    const mapPreparing = new Spinner(spinnerMapOptions());
    const previewPreparing = new Spinner(spinnerChartOptions());

    function refreshWasp() {
        if (control.data('waspCalendarLoading')) {
            return;
        }

        const query = queryParamsHealthWasp(tempRes, prefix);

        if (!query) {
            mapPreparing.stop();
            previewPreparing.stop();
            return;
        }

        const key = `${query.dataset}:${query.timeScale}`;

        if (
            !control.data('waspCalendarReady') ||
            control.data('waspCoverageKey') !== key
        ) {
            mapPreparing.spin(map.getContainer());
            previewPreparing.spin(previewHolder);

            setHealthWaspDateCalendars(
                tempRes,
                prefix,
                false,
                ready => {
                    if (ready) {
                        refreshWasp();
                    } else {
                        mapPreparing.stop();
                        previewPreparing.stop();
                    }
                }
            );

            return;
        }

        displayHealthWaspMap(tempRes, mapOptions, map);
        preview_health_wasp_charts(tempRes);

        mapPreparing.stop();
        previewPreparing.stop();
    }

    $('#map-control-offcanvas-dataselect')
        .off('hidden.bs.offcanvas.healthWasp')
        .on('hidden.bs.offcanvas.healthWasp', refreshWasp);

    $('#map-control-redraw')
        .off('click.healthWasp')
        .on('click.healthWasp', refreshWasp);

    // Expanded chart
    $('#btn-div-chart-wasp')
        .off('click.healthWaspExpand')
        .on('click.healthWaspExpand', () => {
            setHealthExpandModalWasp(
                tempRes,
                'div-chart-wasp'
            );
        });

    // Date navigation
    $('#input-time-navigation')
        .off('blur.healthWasp')
        .on('blur.healthWasp', () => {
            if (setHealthWaspMapDate(tempRes)) {
                refreshWasp();
            }
        });

    $('#prev-time-navigation')
        .off('click.healthWasp')
        .on('click.healthWasp', () => {
            if (setHealthWaspMapDate(tempRes, -1)) {
                refreshWasp();
            }
        });

    $('#next-time-navigation')
        .off('click.healthWasp')
        .on('click.healthWasp', () => {
            if (setHealthWaspMapDate(tempRes, 1)) {
                refreshWasp();
            }
        });


    mapPreparing.spin(map.getContainer());
    previewPreparing.spin(previewHolder);

    setOffCanvasMapControlHealthWasp(tempRes, ready => {
        if (ready) {
            refreshWasp();
        } else {
            mapPreparing.stop();
            previewPreparing.stop();
        }
    });
});