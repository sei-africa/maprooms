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

    print('---------------------------')
    print(params)

    info = GLOBAL_CONFIG['forecast_data']['tendays']
    fcst_pth = os.path.join(info['dir'], params['issued'])
    if params['variable'] == 'rainfall':
        if params['parameter'] == 'TotRain':
            fcst_file = os.path.join(fcst_pth, 'PrecDaily.nc')
            if not os.path.exists(fcst_file):
                msg = 'No file PrecDaily.nc found'
                return {'status': -1, 'message': msg}

            data = _get_forecast_10days_precip(fcst_file, info)
            data = blank_numpy_dict(data, buffer=True)
            map_png = _create_fcst_image(data, params)
            map_png['ckeys']['title'] = 'Total rainfall (mm)'
            map_png['date'] = f"Forecast for {data['start']} -> {data['end']}"
            return {'status': 0, 'data': map_png}
        else:
            return {'status': -1, 'message': 'test'}
    elif params['variable'] == 'temperature':
        return {'status': -1, 'message': 'test'}
    else:
        return {'status': -1, 'message': f'Unknown variable: {params["variable"]}'}

def _get_forecast_10days_precip(fcst_file, info):
    ds = xr.open_dataset(fcst_file)
    prcp = ds['dailyrain'].sum(info['dimname']['time'], skipna=False).load().values
    lon = ds[info['dimname']['lon']].values
    lat = ds[info['dimname']['lat']].values
    dates = ds[info['dimname']['time']].values.astype('datetime64[D]')
    start = np.datetime_as_string(dates.min(), unit='D')
    end = np.datetime_as_string(dates.max(), unit='D')
    return {
        'lon': lon,
        'lat': lat,
        'data': prcp,
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

