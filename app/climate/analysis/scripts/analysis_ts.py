import json
import numpy as np
from datetime import datetime
from app.dst_api.scripts import (download_climdata,
                                 extract_climdata,
                                 download_analysis,
                                 download_rawdata,
                                 is_climato_normals)
from app.scripts.util import pretty

def climate_analysis_ts_rawdata(params):
    params = _create_params_ts_raw(params)
    json_data = download_rawdata(params)
    json_data = json.loads(json_data)
    if json_data['status'] != 0: return json_data
    json_data['data'] = json.loads(json_data['data'])

    time = json_data['data']['Dates']
    time = _format_ts_dates(time, params['temporalRes'])
    if time is None:
        return {'status': -1, 'message': 'Unknown temporal resolution'}

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
        },
        'time_res': params['temporalRes']
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

def climate_analysis_ts_anomaly(params):
    params = _create_params_ts_anom(params)
    json_data = download_analysis(params)
    json_data = json.loads(json_data)
    if json_data['status'] != 0: return json_data
    json_data['data'] = json.loads(json_data['data'])

    time = json_data['data']['Dates']
    time = _format_ts_dates(time, params['temporalRes'])
    if time is None:
        return {'status': -1, 'message': 'Unknown temporal resolution'}

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
        },
        'time_res': params['temporalRes']
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

def climate_analysis_ts_climato(params):
    one_var = True
    clim_normal = is_climato_normals(params)
    if 'chartType' in params:
        one_var = params['chartType'] == 'one'

    if one_var:
        params_mean = _create_params_ts_clim_mean(params)
        if clim_normal:
            print('----------- eto mean --------------')
            data_mean = extract_climdata(params_mean)
        else:
            data_mean = download_climdata(params_mean)

        data_mean = json.loads(data_mean)
        if data_mean['status'] != 0: return data_mean

        params_perc = _create_params_ts_clim_perc(params)
        if clim_normal:
            print('----------- eto perc --------------')
            data_perc = extract_climdata(params_perc)
        else:
            data_perc = download_climdata(params_perc)

        data_perc = json.loads(data_perc)
        if data_perc['status'] != 0: return data_perc

        data_mean['data'] = json.loads(data_mean['data'])
        data_perc['data'] = json.loads(data_perc['data'])

        time = data_mean['data']['Dates']
        time = _format_clim_dates(time, params['temporalRes'])
        if time is None:
            return {'status': -1, 'message': 'Unknown temporal resolution'}

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
            },
            'time_res': params['temporalRes']
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
            params_mean = _create_params_ts_clim_mean(params)
            params_mean['variable'] = var
            if clim_normal:
                data_mean = extract_climdata(params_mean)
            else:
                data_mean = download_climdata(params_mean)
            data_mean = json.loads(data_mean)
            if data_mean['status'] != 0: return data_mean

            data_mean['data'] = json.loads(data_mean['data'])

            time = data_mean['data']['Dates']
            time = _format_clim_dates(time, params['temporalRes'])
            if time is None:
                return {'status': -1, 'message': 'Unknown temporal resolution'}

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
        info['time_res'] = params['temporalRes']

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

#####

def _create_params_ts_raw(params):
    pars_0 = {'gridded': False, 'outFormat': 'JSON-Format',
              'webApp': True, 'finalOutput': True, 'httpMethod': 'POST'}
    if params['geomExtract'] == 'points':
        pars = pars_0 | {'padLon': 0, 'padLat': 0}
    else:
        pars = pars_0 | {'spatialAvg': True, 'allPolygons': False}
    return pars | params

def _create_params_ts_anom(params):
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

def _create_params_ts_clim_mean(params):
    pars_0 = {'climFunction': 'mean', 'fullYear': True, 'climDate': None,
              'outFormat': 'JSON-Format', 'gridded': False, 'webApp': True,
              'finalOutput': True, 'httpMethod': 'POST'}
    if params['geomExtract'] == 'points':
        pars = pars_0 | {'padLon': 0, 'padLat': 0}
    else:
        pars = pars_0 | {'spatialAvg': True, 'allPolygons': False}
    return pars | params

def _create_params_ts_clim_perc(params):
    pars_0 = {'climFunction': 'percentile', 'precentileValue': [5., 50., 95.],
              'fullYear': True, 'climDate': None,
              'outFormat': 'JSON-Format', 'gridded': False, 'webApp': True,
              'finalOutput': True, 'httpMethod': 'POST'}
    if params['geomExtract'] == 'points':
        pars = pars_0 | {'padLon': 0, 'padLat': 0}
    else:
        pars = pars_0 | {'spatialAvg': True, 'allPolygons': False}
    return pars | params

#####

def _format_ts_dates(dates_l, time_res):
    if time_res == 'monthly':
        tmp = [
                datetime.strptime(t, '%Y%m')
                for t in dates_l
            ]
        res = [t.strftime('%Y-%m-16') for t in tmp]
    elif time_res == 'dekadal':
        y = [s[:4] for s in dates_l]
        m = [s[4:6] for s in dates_l]
        dk = [s[6:] for s in dates_l]
        dy = [
                '01' if d == '1'
                else 
                '11' if d == '2'
                else
                '21'
                for d in dk
            ]
        res = ['-'.join(l) for l in zip(y, m, dy)]
    else:
        res = None

    return res

def _format_clim_dates(dates_l, time_res):
    if time_res == 'monthly':
        res = [
                f"2025-{t.split('_')[1]}-16"
                for t in dates_l
            ]
    elif time_res == 'dekadal':
        mdk = [t.split('_')[1] for t in dates_l]
        m = [t.split('-')[0] for t in mdk]
        dk = [t.split('-')[1] for t in mdk]
        dy = [
                '01' if d == '1'
                else 
                '11' if d == '2'
                else
                '21'
                for d in dk
            ]
        mdk = ['-'.join(l) for l in zip(m, dy)]
        res = [f'2025-{t}' for t in mdk]
    else:
        res = None

    return res

def _get_axis_breaks(values):
    vmin = np.nanmin(values)
    vmax = np.nanmax(values)
    breaks = pretty(vmin, vmax, 7).tolist()
    ylim = [breaks[0], breaks[-1]]
    ylim[1] = ylim[1] + (ylim[1] - ylim[0]) * 0.1
    return breaks, ylim
