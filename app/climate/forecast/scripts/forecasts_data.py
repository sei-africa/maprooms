import os
from app.scripts._global import GLOBAL_CONFIG
from app.scripts.util import load_yaml_file
from .parse_forecasts import (
    parse_seasonal_forecast_dirs,
    parse_tendays_forecast_dirs
)
from .read_forecasts import _load_dataarray

def get_seasonal_forecast_info(variable):
    fcst_data = GLOBAL_CONFIG['forecast_data']['seasonal'][variable]
    if not os.path.exists(fcst_data['dir']):
        return {
            'status': -1,
            'message': f'No {variable} seasonal forecast found.'
        }
    try:
        fcst_seas = parse_seasonal_forecast_dirs(fcst_data['dir'])
        fcst_seas['resolution'] = _get_seasonal_forecast_sp_res(
            fcst_seas['display'], fcst_data
        )
        return {'status': 0, 'data': fcst_seas}
    except Exception as e:
        return {'status': -1, 'message': str(e)}

def _get_seasonal_forecast_sp_res(fcst_pars, fcst_data):
    fcst_dir = os.path.join(
        fcst_data['dir'],
        str(fcst_pars['year']),
        fcst_pars['month'],
        fcst_pars['target']
    )
    fcst_file = f'MME_deterministic_forecast_{fcst_pars["year"]}.nc'
    fcst_path = os.path.join(fcst_dir, fcst_file)
    if not os.path.exists(fcst_path):
        raise ValueError(
            f'Deterministic forecast file {fcst_file} not found.'
        )
    fcst = _load_dataarray(fcst_path)
    lon = fcst[fcst_data['lon']].values
    lat = fcst[fcst_data['lat']].values
    return {
        'lon': abs(float(lon[1] - lon[0])),
        'lat': abs(float(lat[1] - lat[0]))
    }

def get_tendays_forecast_info():
    fcst_dir = GLOBAL_CONFIG['forecast_data']['tendays']['dir']
    try:
        fcst_10d = parse_tendays_forecast_dirs(fcst_dir)
        return {'status': 0, 'data': fcst_10d}
    except Exception as e:
        return {'status': -1, 'message': str(e)}

def get_tendays_forecast_target(date):
    fcst_dir = GLOBAL_CONFIG['forecast_data']['tendays']['dir']
    info_pth = os.path.join(
        fcst_dir, date, 'info.yaml'
    )
    if not os.path.exists(info_pth):
        msg = 'Ten-days forecast information not found.'
        return {'status': -1, 'message': msg}

    info = load_yaml_file(info_pth)
    target = {
        'start': info['start_date'],
        'end': info['end_date']
    }
    return {'status': 0, 'data': target}
