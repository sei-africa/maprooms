$(document).ready(function() {
    $('[data-bs-toggle="tooltip"]').tooltip();
    const pycptFiles = {
        required: [
            /^MME_deterministic_forecast_\d{4}\.nc$/,
            /^MME_forecast_prediction_error_variance_\d{4}\.nc$/,
            /^MME_probabilistic_forecast_\d{4}\.nc$/,
            /^obs\.nc$/
        ],
        optional: [
            /^MME_deterministic_hindcasts\.nc$/,
            /^MME_hindcast_prediction_error_variance\.nc$/,
            /^MME_probabilistic_hindcasts\.nc$/,
            /^MME_skill_scores\.nc$/
        ]
    };
    const monthPattern = '(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)';
    const variableCodes = { rainfall: 'PRCP', temperature: 'TEMP' };
    const forecastConfig = {
        seasonal: {
            endpoint: createEndpoint('admin', 'upload_seasonal_forecast'),
            sources: {
                pycpt: pycptFiles,
                wass2s: { wass2sMonths: `${monthPattern}+` }
            }
        },
        tendays: {
            endpoint: createEndpoint('admin', 'upload_tendays_forecast'),
            required: [/^PrecDaily\.nc$/, /^PrecExtreme\.nc$/, /^TavgDaily\.nc$/, /^TmaxDaily\.nc$/, /^TminDaily\.nc$/],
            optional: [/^PrecDailyYrsPercentile\.nc$/, /^PrecHourly\.nc$/, /^TavgHourly\.nc$/]
        },
        monthly: {
            endpoint: createEndpoint('admin', 'upload_monthly_forecast'),
            sources: {
                pycpt: pycptFiles,
                wass2s: { wass2sMonths: monthPattern }
            }
        }
    };
    let selectedType = 'seasonal';

    function selectedSource(type = selectedType) {
        return $(`#${type}-source`).val();
    }

    function selectedVariable(type = selectedType) {
        return $(`#${type}-variable`).val();
    }

    function wass2sFiles(type) {
        const config = forecastConfig[type].sources.wass2s;
        const variable = variableCodes[selectedVariable(type)];
        const forecastSuffix = `${variable}${config.wass2sMonths}_(\\d{4})\\.nc`;
        return {
            required: [
                new RegExp(`^Forecast_Det_${forecastSuffix}$`),
                new RegExp(`^Forecast_Prob_${forecastSuffix}$`),
                new RegExp(`^${variable}_predictand\\.nc$`)
            ],
            optional: []
        };
    }

    function activeFileConfig() {
        const config = forecastConfig[selectedType];
        if (!config.sources) return config;
        const source = selectedSource();
        return source === 'wass2s' ? wass2sFiles(selectedType) : config.sources[source];
    }

    function renderFileList(files, heading, isValid = null) {
        const container = $('#chosen-files').empty().removeClass('text-success text-danger');
        if (!files.length) return;
        if (isValid === true) container.addClass('text-success');
        if (isValid === false) container.addClass('text-danger');
        $('<h5>').text(heading).appendTo(container);
        const list = $('<ul>').addClass('mb-0').appendTo(container);
        files.forEach(file => $('<li>').text(file.name || file).appendTo(list));
    }

    function renderDescription(type) {
        const forecastText = PAGE_CTRL.forecasts[type];
        const text = forecastText.source ? forecastText.source[selectedSource(type)] : forecastText;
        const container = $('#forecast-description').empty();
        $('<p>').text(text.description).appendTo(container);
        if (text.required_files.length) {
            $('<h5>').text(PAGE_CTRL.required_files).appendTo(container);
            const list = $('<ul>').appendTo(container);
            text.required_files.forEach(name => $('<li>').text(name).appendTo(list));
        }
        if (text.optional_files.length) {
            $('<h5>').text(PAGE_CTRL.optional_files).appendTo(container);
            const list = $('<ul>').appendTo(container);
            text.optional_files.forEach(name => $('<li>').text(name).appendTo(list));
        }
    }

    function renderExamples(type) {
        const container = $('#forecast-examples').empty().hide();
        const forecastText = PAGE_CTRL.forecasts[type];
        if (!forecastText.source) return;

        const sourceText = forecastText.source[selectedSource(type)];
        const examples = sourceText.examples && sourceText.examples[selectedVariable(type)];
        if (!examples || !examples.length) return;

        $('<h5>').text(PAGE_CTRL.example_files).appendTo(container);
        const list = $('<ul>').addClass('mb-0').appendTo(container);
        examples.forEach(name => $('<li>').append($('<code>').text(name)).appendTo(list));
        container.show();
    }

    function resetFiles() {
        $('#forecast-files').val('');
        $('#chosen-files').empty();
    }

    function selectForecastType(type) {
        selectedType = type;
        resetFiles();
        $('#forecast-upload-title').text(PAGE_CTRL.forecasts[type].title);
        $('.forecast-options').hide();
        $(`#${type}-options`).toggle(type === 'seasonal' || type === 'monthly');
        $('.forecast-upload-link').removeClass('active');
        $(`.forecast-upload-link[data-forecast-type="${type}"]`).addClass('active');
        renderDescription(type);
        renderExamples(type);
    }

    function matchingWass2sForecasts(names) {
        const variable = variableCodes[selectedVariable()];
        const months = forecastConfig[selectedType].sources.wass2s.wass2sMonths;
        const deterministic = names.find(name => name.startsWith('Forecast_Det_'));
        const probabilistic = names.find(name => name.startsWith('Forecast_Prob_'));
        const detMatch = deterministic && deterministic.match(
            new RegExp(`^Forecast_Det_${variable}(${months})_(\\d{4})\\.nc$`)
        );
        const probMatch = probabilistic && probabilistic.match(
            new RegExp(`^Forecast_Prob_${variable}(${months})_(\\d{4})\\.nc$`)
        );
        return detMatch && probMatch && detMatch[1] === probMatch[1] && detMatch[2] === probMatch[2];
    }

    function validateFiles(files) {
        const config = activeFileConfig();
        const allowed = config.required.concat(config.optional);
        const acceptedFiles = files.filter(file => allowed.some(pattern => pattern.test(file.name)));
        const names = acceptedFiles.map(file => file.name);
        if (!files.length) return { valid: false, message: PAGE_CTRL.messages.no_files, files: [] };
        if (acceptedFiles.length !== files.length) {
            return { valid: false, message: PAGE_CTRL.messages.invalid_files, files: files };
        }
        if (new Set(names).size !== names.length) {
            return { valid: false, message: PAGE_CTRL.messages.duplicate_files, files: acceptedFiles };
        }
        const missing = config.required.filter(pattern => !names.some(name => pattern.test(name)));
        const mismatchedWass2sFiles = forecastConfig[selectedType].sources &&
            selectedSource() === 'wass2s' && !matchingWass2sForecasts(names);
        if (missing.length || mismatchedWass2sFiles) {
            return { valid: false, message: PAGE_CTRL.messages.invalid_files, files: acceptedFiles };
        }
        return { valid: true, files: acceptedFiles };
    }

    $('.forecast-upload-link').on('click', function(event) {
        event.preventDefault();
        selectForecastType($(this).data('forecast-type'));
    });

    $('.forecast-source, .forecast-variable').on('change', function() {
        resetFiles();
        renderDescription(selectedType);
        renderExamples(selectedType);
    });

    $('#forecast-files').on('change', function() {
        const files = Array.from(this.files);
        const result = validateFiles(files);
        renderFileList(result.files, PAGE_CTRL.chosen_files, result.valid);
        if (!result.valid) {
            flashMessage(result.message, 'error');
        }
    });

    $('#upload-forecast-button').on('click', function() {
        const files = Array.from($('#forecast-files').prop('files'));
        const result = validateFiles(files);
        if (!result.valid) {
            flashMessage(result.message, 'error');
            return;
        }
        const data = new FormData();
        result.files.forEach(file => data.append('files', file));
        if (forecastConfig[selectedType].sources) {
            data.append('source', selectedSource());
            data.append('variable', selectedVariable());
        }
        $.ajax({
            type: 'POST',
            url: forecastConfig[selectedType].endpoint,
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            dataType: 'json',
            success: function(json) {
                flashMessage(json.message, json.status);
                if (json.status === 'success') {
                    $('#forecast-files').val('');
                    renderFileList(json.files, PAGE_CTRL.uploaded_files, true);
                }
            },
            error: function(xhr, status, error) { displayAjaxError(xhr, status, error); }
        });
    });

    selectForecastType(selectedType);
});