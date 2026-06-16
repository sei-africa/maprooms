import json
import numpy as np
from app.dst_api.scripts import (download_climdata,
                                 download_analysis,
                                 download_rawdata,
                                 download_analysis_dailydata,
                                 download_analysis_dailyclim,
                                 download_analysis_dailyanom)
from app.scripts.imagepng import create_imagePng
from app.scripts.colorbar import matplotlib_invalid_colors

def climate_analysis_sp_data(params):
    if params['colorbar']['color_type'] == 'user':
        user_col = matplotlib_invalid_colors(
            params['colorbar']['color_cbar']
        )
        if user_col is not None:
            wrng_col = ', '.join(user_col)
            msg = f'Matplotlib invalid colors: {wrng_col}'
            return {'status': -1, 'message': msg}
        if params['colorbar']['color_add_ext']:
            ext_col = matplotlib_invalid_colors(
                params['colorbar']['color_ext'],
                transparent=True
            )
            if ext_col is not None:
                wrng_col = ', '.join(ext_col)
                msg = f'Matplotlib invalid colors extensions: {wrng_col}'
                return {'status': -1, 'message': msg}

    if params['dailyAnalysis']:
        if params['mapType'] == 'climatology':
            params = _create_params_sp_clim(params)
            json_data = download_analysis_dailyclim(params)
            data = _parse_json_spatial_data(json_data, 'Dates')
        elif params['mapType'] == 'rawdata':
            params = _create_params_sp_raw(params)
            json_data = download_analysis_dailydata(params)
            data = _parse_json_spatial_data(json_data, 'Date')
        elif params['mapType'] == 'anomaly':
            params = _create_params_sp_anom(params)
            json_data = download_analysis_dailyanom(params)
            data = _parse_json_spatial_data(json_data, 'Date')
        else:
            return {'status': -1, 'message': 'Unknown map data'}
    else:
        if params['mapType'] == 'climatology':
            params = _create_params_sp_clim(params)
            json_data = download_climdata(params)
            data = _parse_json_spatial_data(json_data, 'Dates')
        elif params['mapType'] == 'rawdata':
            params = _create_params_sp_raw(params)
            json_data = download_rawdata(params)
            data = _parse_json_spatial_data(json_data, 'Date')
        elif params['mapType'] == 'anomaly':
            params = _create_params_sp_anom(params)
            json_data = download_analysis(params)
            data = _parse_json_spatial_data(json_data, 'Date')
        else:
            return {'status': -1, 'message': 'Unknown map data'}

    if data['status'] == -1: return data

    if not params['dailyAnalysis']:
        if params['mapType'] == 'climatology':
            if params['climFunction'] == 'trend':
                ix = data['varid'].index('slope')
                data['data'] = data['data'][ix, :, :, :]
                data['longname'] = data['longname'][ix]
                data['units'] = data['units'][ix]
                data['varid'] = data['varid'][ix]

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

    map_png['date'] = data['date']
    map_png['ckeys']['title'] = f"{data['longname']} ({data['units']})"

    return {'status': 0, 'data': map_png}

def _create_params_sp_clim(params):
    pars = {
        'fullYear': False,
        'geomExtract': 'original',
        'outFormat': 'JSON-Format',
        'webApp': True,
        'finalOutput': True,
        'httpMethod': 'POST'
    }
    return pars | params

def _create_params_sp_raw(params):
    pars = {
        'geomExtract': 'original',
        'outFormat': 'JSON-Format',
        'gridded': True,
        'webApp': True,
        'finalOutput': True,
        'httpMethod': 'POST'
    }
    return pars | params

def _create_params_sp_anom(params):
    pars = {
        'analysis': 'anomaly',
        'geomExtract': 'original',
        'outFormat': 'JSON-Format',
        'climFunction': 'mean-stdev',
        'seasStats': 'mean-stdev',
        'fullYear': True,
        'climDate': None,
        'gridded': True,
        'webApp': True,
        'httpMethod': 'POST',
        'outFormat_0': 'JSON-Format'
    }
    return pars | params

def _parse_json_spatial_data(json_data, date_key):
    jsd = json.loads(json_data)
    if jsd['status'] == -1: return jsd
    jsd = json.loads(jsd['data'])
    lat = np.array(jsd['Latitude'])
    lon = np.array(jsd['Longitude'])
    data = np.array(jsd['Data'])
    data = np.where(data == jsd['Missing'], np.nan, data)

    return {
            'status': 0,
            'date': jsd[date_key],
            'lon': lon,
            'lat': lat,
            'data': data,
            'longname': jsd['VariableName'],
            'units': jsd['VariableUnits'],
            'varid': jsd['VariableVarId'],
            'dimensions': jsd['Dimensions']
        }
