import json
import numpy as np
from datetime import datetime
from app.dst_api.scripts import (download_climdata,
                                 extract_climdata,
                                 download_analysis,
                                 download_rawdata,
                                 is_climato_normals)
from app.scripts.imagepng import create_imagePng
from app.scripts.util import pretty

def get_spatial_monthly_data(params):
    if params['mapType'] == 'climatology':
        params = _create_params_monthly_clim_map(params)
        json_data = download_climdata(params)
        data = _parse_json_spatial_data(json_data, 'Dates')
    elif params['mapType'] == 'rawdata':
        params = _create_params_monthly_raw_map(params)
        json_data = download_rawdata(params)
        data = _parse_json_spatial_data(json_data, 'Date')
    elif params['mapType'] == 'anomaly':
        params = _create_params_monthly_anom_map(params)
        json_data = download_analysis(params)
        data = _parse_json_spatial_data(json_data, 'Date')
    else:
        return {'status': -1, 'message': 'Unknown map data'}

    if data['status'] == -1: return data

    # check color here
    print(params['colorbar'])

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

def get_rawdata_monthly_ts(params):
    params = _create_params_monthly_raw_ts(params)
    json_data = download_rawdata(params)
    json_data = json.loads(json_data)
    if json_data['status'] != 0: return json_data
    json_data['data'] = json.loads(json_data['data'])
    time = json_data['data']['Dates']
    time = [datetime.strptime(t, '%Y%m') for t in time]
    time = [t.strftime('%Y-%m-16') for t in time]
    miss = json_data['data']['Missing']
    values = json_data['data']['Data'][0]['Values']
    values = np.array(values)
    values[values == miss] = np.nan

    info = {
        'geom': {
            'name': json_data['data']['Data'][0]['Name'],
            'lon': json_data['data']['Data'][0]['Longitude'],
            'lat': json_data['data']['Data'][0]['Latitude']
        },
        'var':{
            'name': json_data['data']['VariableName'],
            'units': json_data['data']['VariableUnits'],
            'type': params['variable']
        }
    }

    if ~np.all(np.isnan(values)):
        vmin = np.nanmin(values)
        vmax = np.nanmax(values)
        if params['variable'] == 'precip': vmin = 0
        breaks = pretty(vmin, vmax, 7).tolist()
        ylim = [breaks[0], breaks[-1]]
        ylim[1] = ylim[1] + (ylim[1] - ylim[0]) * 0.1
        data = {'time': time, 'values': values.tolist(), 'info': info,
                'yrange': ylim, 'yticks': breaks}
        return {'status': 0, 'data': data}
    else:
        if params['geomExtract'] == 'points':
            crd = f'point (Longitude: {info['geom']['lon']}, Latitude: {info['geom']['lat']})'
        else:
            crd = f'polygon ({info['geom']['name']})'
        return {'status': -1, 'message': f'All data are missing for point {crd}'}

def get_anomaly_monthly_ts(params):
    params = _create_params_monthly_anom_ts(params)
    json_data = download_analysis(params)
    json_data = json.loads(json_data)
    if json_data['status'] != 0: return json_data
    json_data['data'] = json.loads(json_data['data'])
    time = json_data['data']['Dates']
    time = [datetime.strptime(t, '%Y%m') for t in time]
    time = [t.strftime('%Y-%m-16') for t in time]
    miss = json_data['data']['Missing']
    values = json_data['data']['Data'][0]['Values']
    values = np.array(values)
    values[values == miss] = np.nan

    info = {
        'geom': {
            'name': json_data['data']['Data'][0]['Name'],
            'lon': json_data['data']['Data'][0]['Longitude'],
            'lat': json_data['data']['Data'][0]['Latitude']
        },
        'var':{
            'name': json_data['data']['VariableName'],
            'units': json_data['data']['VariableUnits'],
            'type': params['variable']
        }
    }

    if ~np.all(np.isnan(values)):
        vmin = np.nanmin(values)
        vmax = np.nanmax(values)
        val_max = np.maximum(np.abs(vmin), np.abs(vmax))
        breaks = pretty(-val_max, val_max, 7).tolist()
        ylim = np.array([breaks[0], breaks[-1]])
        ylim = ylim + ((ylim[1] - ylim[0]) * 0.1) * np.array([-1, 1])
        data = {'time': time, 'values': values.tolist(), 'info': info,
                'yrange': ylim.tolist(), 'yticks': breaks}
        return {'status': 0, 'data': data}
    else:
        if params['geomExtract'] == 'points':
            crd = f'point (Longitude: {info['geom']['lon']}, Latitude: {info['geom']['lat']})'
        else:
            crd = f'polygon ({info['geom']['name']})'
        return {'status': -1, 'message': f'Anomaly: All data are missing for {crd}'}

def get_climato_monthly_ts(params):
    one_var = True
    clim_normal = is_climato_normals(params)
    if 'chartType' in params:
        one_var = params['chartType'] == 'one'

    if one_var:
        params_mean = _create_params_monthly_clim_mean_ts(params)
        if(clim_normal):
            data_mean = extract_climdata(params_mean)
        else:
            data_mean = download_climdata(params_mean)
        data_mean = json.loads(data_mean)
        if data_mean['status'] != 0: return data_mean

        params_perc = _create_params_monthly_clim_perc_ts(params)
        if(clim_normal):
            data_perc = extract_climdata(params_perc)
        else:
            data_perc = download_climdata(params_perc)
        data_perc = json.loads(data_perc)
        if data_perc['status'] != 0: return data_perc

        data_mean['data'] = json.loads(data_mean['data'])
        data_perc['data'] = json.loads(data_perc['data'])

        time = data_mean['data']['Dates']
        time = [f"2025-{t.split('_')[1]}-16" for t in time]

        miss_mean = data_mean['data']['Missing']
        values_mean = data_mean['data']['Data'][0]['Values']
        values_mean = np.array(values_mean)
        values_mean[values_mean == miss_mean] = np.nan

        miss_perc = data_perc['data']['Missing']
        values_perc = data_perc['data']['Data'][0]['Values']
        values_perc = np.array(values_perc)
        values_perc[values_perc == miss_mean] = np.nan

        values = np.vstack((values_mean, values_perc))

        info = {
            'geom': {
                'name': data_mean['data']['Data'][0]['Name'],
                'lon': data_mean['data']['Data'][0]['Longitude'],
                'lat': data_mean['data']['Data'][0]['Latitude']
            },
            'var':{
                'name': data_mean['data']['VariableName'].split(', ')[1],
                'units': data_mean['data']['VariableUnits'],
                'type': params['variable']
            }
        }

        if ~np.all(np.isnan(values)):
            breaks, ylim = _get_axis_breaks(values)
            data = {'time': time, 'values': values.tolist(),
                    'info': info, 'chartType': params['chartType'],
                    'yrange': ylim, 'yticks': breaks}
            return {'status': 0, 'data': data}
        else:
            if params['geomExtract'] == 'points':
                crd = f'point (Longitude: {info['geom']['lon']}, Latitude: {info['geom']['lat']})'
            else:
                crd = f'polygon ({info['geom']['name']})'
            return {'status': -1, 'message': f'Climatology: All data are missing for {crd}'}
    else:
        variables = ['precip', 'tmin', 'tmax']
        values = []
        info_var = {}
        for var in variables:
            params_mean = _create_params_monthly_clim_mean_ts(params)
            params_mean['variable'] = var
            if(clim_normal):
                data_mean = extract_climdata(params_mean)
            else:
                data_mean = download_climdata(params_mean)
            data_mean = json.loads(data_mean)
            if data_mean['status'] != 0: return data_mean

            data_mean['data'] = json.loads(data_mean['data'])

            time = data_mean['data']['Dates']
            time = [f"2025-{t.split('_')[1]}-16" for t in time]

            info_var[var] = {
                'name': data_mean['data']['VariableName'].split(', ')[1],
                'units': data_mean['data']['VariableUnits'],
                'type': var
            }

            miss_mean = data_mean['data']['Missing']
            values_mean = data_mean['data']['Data'][0]['Values']
            values_mean = np.array(values_mean)
            values_mean[values_mean == miss_mean] = np.nan
            values += [values_mean]

        info_tmp = {'var': info_var['tmax'].copy()}
        info_tmp['var']['name'] = info_tmp['var']['name'].replace('maximum', '')
        info_var = info_tmp | info_var
        info_geom = {
            'geom': {
                'name': data_mean['data']['Data'][0]['Name'],
                'lon': data_mean['data']['Data'][0]['Longitude'],
                'lat': data_mean['data']['Data'][0]['Latitude']
            }
        }
        info = info_geom | info_var

        values = np.array(values)
        if ~np.all(np.isnan(values)):
            breaks1, ylim1 = _get_axis_breaks(values[0])
            breaks2, ylim2 = _get_axis_breaks(values[1:])
            data = {'time': time, 'values': values.tolist(),
                    'info': info, 'chartType': params['chartType'],
                    'yrange1': ylim1, 'yticks1': breaks1,
                    'yrange2': ylim2, 'yticks2': breaks2,
                    }
            return {'status': 0, 'data': data}
        else:
            if params['geomExtract'] == 'points':
                crd = f'point (Longitude: {info['geom']['lon']}, Latitude: {info['geom']['lat']})'
            else:
                crd = f'polygon ({info['geom']['name']})'
            return {'status': -1, 'message': f'Climatology: All data are missing for {crd}'}

def _get_axis_breaks(values):
    vmin = np.nanmin(values)
    vmax = np.nanmax(values)
    breaks = pretty(vmin, vmax, 7).tolist()
    ylim = [breaks[0], breaks[-1]]
    ylim[1] = ylim[1] + (ylim[1] - ylim[0]) * 0.1
    return breaks, ylim

def _create_params_monthly_clim_map(params):
    pars = {'fullYear': False, 'geomExtract': 'original',
            'outFormat': 'JSON-Format', 'webApp': True,
            'httpMethod': 'POST'}
    return pars | params

def _create_params_monthly_raw_map(params):
    pars = {'geomExtract': 'original', 'outFormat': 'JSON-Format',
            'gridded': True, 'webApp': True,
            'finalOutput': True, 'httpMethod': 'POST'}
    return pars | params

def _create_params_monthly_anom_map(params):
    pars = {'analysis': 'anomaly', 'geomExtract': 'original',
            'outFormat': 'JSON-Format',
            'climFunction': 'mean-stdev', 'fullYear': True,
            'climDate': None, 'gridded': True, 'webApp': True,
            'httpMethod': 'POST', 'outFormat_0': 'JSON-Format'}
    return pars | params

def _parse_json_spatial_data(json_data, date_key):
    jsd = json.loads(json_data)
    if jsd['status'] == -1: return jsd
    jsd = json.loads(jsd['data'])
    lat = np.array(jsd['Latitude'])
    lon = np.array(jsd['Longitude'])
    data = np.array(jsd['Data'])
    data = np.where(data == jsd['Missing'], np.nan, data)
    # jsd['Dimensions']
    return {'status': 0, 'date': jsd[date_key],
            'lon': lon, 'lat': lat, 'data': data,
            'longname': jsd['VariableName'],
            'units': jsd['VariableUnits']
            }

def _create_params_monthly_raw_ts(params):
    pars_0 = {'gridded': False, 'outFormat': 'JSON-Format',
              'webApp': True, 'finalOutput': True, 'httpMethod': 'POST'}
    if params['geomExtract'] == 'points':
        pars = pars_0 | {'padLon': 0, 'padLat': 0}
    else:
        pars = pars_0 | {'spatialAvg': True, 'allPolygons': False}
    return pars | params

def _create_params_monthly_anom_ts(params):
    pars_0 = {'analysis': 'anomaly', 'climFunction': 'mean-stdev',
              'fullYear': True, 'climDate': None,
              'outFormat': 'JSON-Format', 'outFormat_0': 'JSON-Format',
              'gridded': False, 'webApp': True, 'finalOutput': False,
              'httpMethod': 'POST'}
    if params['geomExtract'] == 'points':
        pars = pars_0 | {'padLon': 0, 'padLat': 0}
    else:
        pars = pars_0 | {'spatialAvg': True, 'allPolygons': False}
    return pars | params

def _create_params_monthly_clim_mean_ts(params):
    pars_0 = {'climFunction': 'mean', 'fullYear': True, 'climDate': None,
              'outFormat': 'JSON-Format', 'gridded': False, 'webApp': True,
              'finalOutput': True, 'httpMethod': 'POST'}
    if params['geomExtract'] == 'points':
        pars = pars_0 | {'padLon': 0, 'padLat': 0}
    else:
        pars = pars_0 | {'spatialAvg': True, 'allPolygons': False}
    return pars | params

def _create_params_monthly_clim_perc_ts(params):
    pars_0 = {'climFunction': 'percentile', 'precentileValue': [5., 50., 95.],
              'fullYear': True, 'climDate': None,
              'outFormat': 'JSON-Format', 'gridded': False, 'webApp': True,
              'finalOutput': True, 'httpMethod': 'POST'}
    if params['geomExtract'] == 'points':
        pars = pars_0 | {'padLon': 0, 'padLat': 0}
    else:
        pars = pars_0 | {'spatialAvg': True, 'allPolygons': False}
    return pars | params
