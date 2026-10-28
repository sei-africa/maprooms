import os
import numpy as np
import xarray as xr
from app.scripts._global import GLOBAL_CONFIG

from app.scripts.colorbar import check_invalid_colors
from app.scripts.imagepng import create_imagePng
from app.misc.scripts.blank_data import (
    blank_numpy_dict,
    blank_xarray_dataarray
)

def climate_forecast_10days_data(params):
    check = check_invalid_colors(params['colorbar'])
    if check['status'] == -1: return check

    # print('---------------------------')
    # print(params)

    if params['variable'] == 'rainfall':
        if params['parameter'] == 'TotRain':
            return create_forecast_10days_data(params)
        else:
            return {'status': -1, 'message': 'test'}
    elif params['variable'] == 'temperature':
        if params['parameter'] in ['MeanTemp', 'MinTemp', 'MaxTemp']:
            return create_forecast_10days_data(params)
    else:
        return {'status': -1, 'message': f'Unknown variable: {params["variable"]}'}

def create_forecast_10days_data(params):
    fcst_obj = {
        'TotRain': {
            'file': 'PrecDaily.nc',
            'function': 'sum',
            'title': 'Total rainfall (mm)',
            'correction': 0
        },
        'MeanTemp': {
            'file': 'TavgDaily.nc',
            'function': 'mean',
            'title': 'Mean temperature (°C)',
            'correction': 0
        },
        'MinTemp': {
            'file': 'TminDaily.nc',
            'function': 'mean',
            'title': 'Minimum temperature (°C)',
            'correction': -5.0
        },
        'MaxTemp': {
            'file': 'TmaxDaily.nc',
            'function': 'mean',
            'title': 'Maximum temperature (°C)',
            'correction': 5.5
        }
    }
    obj = fcst_obj[params['parameter']]

    info = GLOBAL_CONFIG['forecast_data']['tendays']
    fcst_pth = os.path.join(info['dir'], params['issued'])
    fcst_file = os.path.join(fcst_pth, obj['file'])
    if not os.path.exists(fcst_file):
        msg = f'No file {obj["file"]} found'
        return {'status': -1, 'message': msg}

    data = _get_forecast_10days_data(
        fcst_file, info, obj['function'], obj['correction']
    )
    if data is None:
        msg = 'Unknown aggregation function'
        return {'status': -1, 'message': msg}                

    data = blank_numpy_dict(data, buffer=True)
    map_png = _create_fcst_image(data, params)
    map_png['ckeys']['title'] = obj['title']
    map_png['date'] = f"Forecast for {data['start']} -> {data['end']}"
    return {'status': 0, 'data': map_png}

def _get_forecast_10days_data(fcst_file, info, function, correction):
    da = xr.open_dataarray(fcst_file)
    if function == 'sum':
        data = da.sum(info['dimname']['time'], skipna=True)
    elif function == 'mean':
        data = da.mean(info['dimname']['time'], skipna=True)
    else:
        return None

    data = (data + correction).load().values
    lon = da[info['dimname']['lon']].values
    lat = da[info['dimname']['lat']].values
    dates = da[info['dimname']['time']].values.astype('datetime64[D]')
    start = np.datetime_as_string(dates.min(), unit='D')
    end = np.datetime_as_string(dates.max(), unit='D')
    return {
        'lon': lon,
        'lat': lat,
        'data': data,
        'start': str(start),
        'end': str(end)
    }

def _create_fcst_image(data, params):
    if params['colorbar']['color_type'] == 'preset':
        map_png = create_imagePng(
            data,
            breaks=params['colorbar']['break_cbar'],
            color_name=params['colorbar']['color_cbar'],
            colors_ext=params['colorbar']['color_ext']
        )
    else:
        map_png = create_imagePng(
            data,
            breaks=params['colorbar']['break_cbar'],
            colors=params['colorbar']['color_cbar'],
            colors_ext=params['colorbar']['color_ext']
        )
    return map_png

