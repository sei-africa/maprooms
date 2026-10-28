
import hashlib
import json
from threading import Lock

import numpy as np
import pandas as pd
import xarray as xr

from app.scripts._global import GLOBAL_CONFIG
from app.scripts._cache import cache

from app.dst_api.scripts.zarrdata import (
    get_zarr_dataset,
    regrid_zarr_dataset,
)
from app.dst_api.scripts.aggregate_dataarray import (
    xr_aggregate_data,
)

from .cmst import (
    CMST_HUMIDITY_SOURCE,
    cmst_compute_fields,
)


CMST_CACHE_VERSION = 'health-cmst-v2-relative-humidity'

cmst_data_lock = Lock()


def hash_params_cmst(params):
    exclude = {
        'apiKey',
        'user',
        'httpMethod',
        'webApp',
        'colorbar',
    }

    signature = {
        'product': 'health_cmst',
        'version': CMST_CACHE_VERSION,
        'humidity_source': CMST_HUMIDITY_SOURCE,
        'source_config': GLOBAL_CONFIG['datasets'][
            params['dataset']
        ],
        'params': {
            key: value
            for key, value in params.items()
            if key not in exclude
        },
    }

    encoded = json.dumps(
        signature,
        sort_keys=True,
        separators=(',', ':'),
        allow_nan=False,
    ).encode('utf-8')

    digest = hashlib.sha256(encoded).hexdigest()

    return f'health-cmst:{digest}'


def _integer(params, key, minimum, maximum):
    value = params[key]

    if isinstance(value, bool):
        raise ValueError(f'Invalid parameter: {key}')

    number = float(value)

    if not np.isfinite(number):
        raise ValueError(f'Invalid parameter: {key}')

    integer = int(number)

    if number != integer:
        raise ValueError(f'Invalid parameter: {key}')

    if not minimum <= integer <= maximum:
        raise ValueError(f'Invalid parameter: {key}')

    return integer


def _get_cmst_config(params):
    if not isinstance(params, dict):
        raise ValueError('Expected a JSON request object.')

    dataset = params.get('dataset')

    if dataset not in GLOBAL_CONFIG['datasets']:
        raise ValueError('Unknown climate dataset.')

    config = GLOBAL_CONFIG['datasets'][dataset]

    roles = (
        'rainfall',
        'maximum_temperature',
        'minimum_temperature',
        'relative_humidity',
    )

    for role in roles:
        if role not in config['variables']:
            raise ValueError(
                f'Missing dataset variable mapping: {role}.'
            )

        variable = config['variables'][role]

        if variable not in config['monthly']['netcdf']:
            raise ValueError(
                f'Missing monthly configuration for {variable}.'
            )

    return config


def _create_cmst_params(params):
    _get_cmst_config(params)

    if params.get('temporalRes', 'monthly') != 'monthly':
        raise ValueError('CMST requires monthly data.')

    start_year = _integer(
        params, 'startYear', 1800, 2200
    )

    end_year = _integer(
        params, 'endYear', start_year, 2200
    )

    min_year = _integer(
        params,
        'minYear',
        1,
        end_year - start_year + 1,
    )

    return params | {
        'temporalRes': 'monthly',
        'startYear': start_year,
        'endYear': end_year,
        'minYear': min_year,
    }


def health_cmst_info_data(params):
    config = _get_cmst_config(params)

    roles = (
        'rainfall',
        'maximum_temperature',
        'minimum_temperature',
        'relative_humidity',
    )

    variables = {
        config['variables'][role]: [
            config['variables'][role]
        ]
        for role in roles
    }

    return {
        'status': 0,
        'data': {
            'dataset': params['dataset'],
            'variables': variables,
            'referenceVariable': (
                config['variables']['rainfall']
            ),
        },
    }


def _get_monthly_cmst_variable(params, role):
    config = _get_cmst_config(params)
    variable = config['variables'][role]

    spec = config['monthly']['netcdf'][
        variable
    ]

    tempres = (
        spec['input']
        if spec['compute']
        else 'monthly'
    )

    if tempres not in {
        'daily', 'dekadal', 'monthly'
    }:
        raise ValueError(
            'Unsupported CMST source resolution.'
        )

    source_info = config[tempres][
        'netcdf'
    ][variable]

    data = get_zarr_dataset({
        'dataset': params['dataset'],
        'temporalRes': 'monthly',
        'variable': variable,
    })[variable]

    if set(data.dims) != {'time', 'lat', 'lon'}:
        raise ValueError(
            f'Expected time, lat, and lon for {variable}.'
        )

    data = (
        data
        .sortby('time')
        .sortby('lat')
        .sortby('lon')
    )

    if not data.indexes['time'].is_unique:
        raise ValueError(
            f'Duplicate dates found for {variable}.'
        )

    for coordinate in ('lat', 'lon'):
        if not data.indexes[coordinate].is_unique:
            raise ValueError(
                f'Duplicate {coordinate} coordinates.'
            )

    start_year = params['startYear']
    end_year = params['endYear']

    data = data.sel(
        time=slice(
            f'{start_year:04d}-01-01',
            f'{end_year:04d}-12-31',
        )
    )

    if data.sizes['time'] == 0:
        raise ValueError(
            f'No {variable} data within the selected period.'
        )

    missing_value = source_info.get('missval')

    if missing_value is not None:
        data = data.where(
            data != float(missing_value)
        )

    data = data.where(np.isfinite(data))

    units = str(
        data.attrs.get('units')
        or source_info.get('units', '')
    ).strip().lower().replace(' ', '')

    if role == 'rainfall':
        unite = {'mm'}

        if tempres == 'monthly':
            unite |= {
                'mm/month',
                'mm/months',
            }

        if units not in unite:
            raise ValueError(
                'Rainfall amounts in mm are required; '
                f'found {units!r}.'
            )

        data = data.where(data >= 0)
        aggr = 'sum'

    elif role == 'relative_humidity':
        if units not in {'%', 'percent', 'percentage'}:
            raise ValueError(
                'Relative humidity in percent is required; '
                f'found {units!r}.'
            )

        data = data.where(
            (data >= 0)
            & (data <= 100)
        )

        aggr = 'mean'

    else:
        if units in {'k', 'kelvin'}:
            data = data - 273.15

        elif units not in {
            'c', '°c', 'degc', 'deg_c', 'celsius',
            'degree_celsius', 'degrees_celsius',
        }:
            raise ValueError(
                f'Unsupported temperature units: {units!r}.'
            )

        aggr = 'mean'


    if spec['compute']:
        if spec['function'] != aggr:
            raise ValueError(
                f'{variable} must use {aggr} '
                'for monthly aggr.'
            )

    monthly_parts = []

    for year in range(start_year, end_year + 1):
        part = data.sel(
            time=slice(
                f'{year:04d}-01-01',
                f'{year:04d}-12-31',
            )
        )

        if part.sizes['time'] == 0:
            continue

        if (
            spec['compute']
            and tempres != 'monthly'
        ):
            part = xr_aggregate_data(
                part,
                aggr_fun=aggr,
                in_res=tempres,
                out_res='monthly',
                min_frac=float(
                    spec.get('minfrac', 1.0)
                ),
            )

        monthly_parts.append(
            part.compute(
                scheduler='single-threaded'
            )
        )

    data = xr.concat(
        monthly_parts,
        dim='time',
    )


    dates = np.asarray(
        data.time.dt.strftime(
            '%Y-%m-01'
        ).values,
        dtype='datetime64[ns]',
    )

    if np.unique(dates).size != dates.size:
        raise ValueError(
            f'Expected one monthly observation for {variable}.'
        )

    data = data.assign_coords(time=dates)

    full_time = pd.date_range(
        f'{start_year:04d}-01-01',
        f'{end_year:04d}-12-01',
        freq='MS',
    )

    return data.reindex(time=full_time)


def get_cmst_xr_data(params):
    params = _create_cmst_params(params)

    rainfall = _get_monthly_cmst_variable(
        params, 'rainfall'
    )

    tmax = _get_monthly_cmst_variable(
        params, 'maximum_temperature'
    )

    tmin = _get_monthly_cmst_variable(
        params, 'minimum_temperature'
    )

    humidity = _get_monthly_cmst_variable(
        params, 'relative_humidity'
    )

    tmax = regrid_zarr_dataset(rainfall, tmax)
    tmin = regrid_zarr_dataset(rainfall, tmin)

    humidity = regrid_zarr_dataset(
        rainfall, humidity
    )

    rainfall, tmin, tmax, humidity = xr.align(
        rainfall,
        tmin,
        tmax,
        humidity,
        join='exact',
    )

    temperature = (
        (tmin + tmax) / 2.0
    ).where(tmax >= tmin)

    return xr.Dataset({
        'rainfall': rainfall,
        'temperature': temperature,
        'humidity': humidity,
    })


def get_cmst_fields(params):
    params = _create_cmst_params(params)

    calculation_params = {
        key: params[key]
        for key in (
            'dataset',
            'temporalRes',
            'startYear',
            'endYear',
            'minYear',
        )
    }

    cache_key = (
        'cmst-fields:'
        + hash_params_cmst(calculation_params)
    )

    fields = cache.get(cache_key)

    if fields is not None:
        return fields

    with cmst_data_lock:
        fields = cache.get(cache_key)

        if fields is not None:
            return fields

        data = get_cmst_xr_data(params)

        fields = cmst_compute_fields(
            data,
            params['minYear'],
        ).compute(
            scheduler='single-threaded'
        )

        cache.set(
            cache_key,
            fields,
            timeout=0,
        )

    return fields

