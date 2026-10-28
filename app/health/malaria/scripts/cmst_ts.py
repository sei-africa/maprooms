
import os

import numpy as np
import xarray as xr

from app.scripts._global import GLOBAL_CONFIG
from app.scripts.util import load_yaml_file

from app.dst_api.scripts.extract import (
    format_list_mpoints_dict,
    create_geom_mpoints_bbox,
    create_geom_polygons,
)
from app.dst_api.scripts.shapefiles import (
    get_shapefiles_data,
)

from .cmst_data import get_cmst_fields

from .cmst import (
    CMST_CONDITIONS,
    CMST_HUMIDITY_SOURCE,
    get_cmst_text,
)


def _create_params_ts(params):
    pars = {
        'padLon': 0,
        'padLat': 0,
        'spatialAvg': True,
        'allPolygons': False,
    }

    return pars | params


def _extract_cmst_point(field, params):
    points = params.get('pointsList')

    if not isinstance(points, list) or len(points) != 1:
        raise ValueError('Select one point on the map.')

    point = points[0]

    coordinates = [
        float(point['lon']),
        float(point['lat']),
    ]

    if not np.isfinite(coordinates).all():
        raise ValueError('Invalid point coordinates.')

    table = format_list_mpoints_dict(points)

    indexes = create_geom_mpoints_bbox(
        {
            'lon': field.lon.values,
            'lat': field.lat.values,
        },
        table,
        0,
        0,
    )

    columns, rows = indexes[0]

    if len(rows) == 0 or len(columns) == 0:
        raise ValueError(
            'The selected point is outside data coverage.'
        )

    selected = field.isel(
        lat=rows,
        lon=columns,
    )

    geometry = {
        'type': 'point',
        'name': point.get('loc', 'Point'),
        'lon': float(selected.lon.mean().item()),
        'lat': float(selected.lat.mean().item()),
    }

    return (
        selected.mean(
            dim=['lat', 'lon'],
            skipna=True,
        ),
        geometry,
    )


def _extract_cmst_polygon(field, params):
    polygon = params.get('Poly')

    if not isinstance(polygon, str) or not polygon:
        raise ValueError(
            'Select one administrative polygon.'
        )

    config_file = os.path.join(
        GLOBAL_CONFIG['app_dir'],
        'yaml',
        'subdivision-config.yaml',
    )

    layers = load_yaml_file(
        config_file
    )['subdivision']

    configured = any(
        layer['file'] == params.get('shpFile')
        and layer['field'] == params.get('shpField')
        for layer in layers.values()
    )

    if not configured:
        raise ValueError(
            'Unknown administrative layer.'
        )

    polygons = get_shapefiles_data(
        params | {
            'shpSource': 'default',
            'allPolygons': False,
        }
    )

    if polygons['status'] == -1:
        raise ValueError(polygons['message'])

    rows, columns = create_geom_polygons(
        {
            'lon': field.lon.values,
            'lat': field.lat.values,
        },
        polygons['shp'],
        params['shpField'],
        polygon,
    )

    if len(rows) == 0:
        raise ValueError(
            'No grid-cell centres fall inside this polygon.'
        )

    selected = field.isel(
        lat=xr.DataArray(rows, dims='points'),
        lon=xr.DataArray(columns, dims='points'),
    )

    weights = np.cos(
        np.deg2rad(selected.lat)
    )

    geometry = {
        'type': 'polygon',
        'name': polygon,
        'lon': float(selected.lon.mean().item()),
        'lat': float(selected.lat.mean().item()),
        'grid_cell_count': int(len(rows)),
        'spatial_method': 'cosine_latitude_weighted',
    }

    return (
        selected.weighted(weights).mean(
            dim='points',
            skipna=True,
        ),
        geometry,
    )


def get_health_cmst_ts_data(params):
    product = params.get(
        'cmstProduct', 'AllCondProb'
    )

    if product not in CMST_CONDITIONS:
        raise ValueError(
            'Select a monthly CMST occurrence product.'
        )

    field = get_cmst_fields(params)[product]

    if params['geomExtract'] == 'points':
        selected, geometry = _extract_cmst_point(
            field, params
        )

    elif params['geomExtract'] == 'polygons':
        selected, geometry = _extract_cmst_polygon(
            field, params
        )

    else:
        raise ValueError(
            'Unsupported spatial extraction.'
        )

    return {
        'status': 0,
        'data': selected,
        'geom': geometry,
        'product': product,
    }


def health_cmst_ts_data(params):
    params = _create_params_ts(params)
    extracted = get_health_cmst_ts_data(params)

    if extracted['status'] == -1:
        return extracted

    values = np.asarray(
        extracted['data'].values,
        dtype=float,
    )

    if not np.isfinite(values).any():
        return {
            'status': -1,
            'message': (
                'All CMST occurrence values are missing '
                'for this selection.'
            ),
        }

    product = extracted['product']
    text = get_cmst_text()

    return {
        'status': 0,
        'data': {
            'time': [
                f'2000-{month:02d}-16'
                for month in range(1, 13)
            ],
            'values': [
                float(value)
                if np.isfinite(value)
                else None
                for value in values
            ],
            'yrange': [0, 100],
            'yticks': [0, 25, 50, 75, 100],
            'info': {
                'geom': extracted['geom'],
                'var': {
                    'name': text['cmst_modes'][product],
                    'units': '%',
                    'type': 'cmst',
                },
                'product': product,
                'time_res': 'monthly',
                'seas_len': None,
                'seas_daily': None,
                'reference_period': [
                    int(params['startYear']),
                    int(params['endYear']),
                ],
                'minimum_valid_years': int(
                    params['minYear']
                ),
                'humidity_source': (
                    CMST_HUMIDITY_SOURCE
                ),
                'time_axis': 'calendar_month',
            },
        },
    }