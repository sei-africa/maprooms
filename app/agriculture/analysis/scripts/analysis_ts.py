import numpy as np
import pandas as pd

from app.scripts.util import pretty

from app.dst_api.scripts import get_zarr_dataset
from app.scripts._cache import cache, hash_params_rainy_season
from app.misc.scripts.soilgrids_tawc import get_gyga_af_tawc
from app.misc.scripts.rainy_season import compute_rainy_season
from app.misc.scripts.regression import linear_model
from app.misc.scripts.probabilities import (
    ecdf_ts, ecdf_smooth_v2
)

def agriculture_analysis_ts_series(params):
    season_data = _get_rainy_season(params)
    if season_data['status'] == -1:
        return season_data
    rainy_season = season_data['data']

    var_name = params['variable']
    years = rainy_season['year'].values
    values = rainy_season[var_name].values
    values = values.squeeze()
    info = _get_rainy_season_info(rainy_season, params)
    start_onset = rainy_season.onset_start.values
    start_cessation = rainy_season.cessation_start.values

    if ~np.all(np.isnan(values)):
        if len(values[~np.isnan(values)]) > 10:
            vmin = np.nanmin(values)
            vmax = np.nanmax(values)
            breaks = pretty(vmin, vmax, 14).tolist()
            ylim = [breaks[0], breaks[-1]]
            ex = (ylim[1] - ylim[0]) * 0.01
            ylim[1] = ylim[1] + ex

            moy = np.nanmean(values)
            med = np.nanmedian(values)
            ter1 = np.nanquantile(values, 1/3)
            ter2 = np.nanquantile(values, 2/3)

            stats = {
                'mean': float(np.round(moy, 2)),
                'median': float(np.round(med, 2)),
                'tercile1': float(np.round(ter1, 2)),
                'tercile2': float(np.round(ter2, 2))
            }
            mod_coef = linear_model(years, values)
        else:
            stats = None
            mod_coef = None
            if params['variable'] == 'cessation':
                nbday = params['rainy_season']['searchDaysC']
            elif params['variable'] == 'onset':
                nbday = params['rainy_season']['searchDaysO']
            else:
                wsearch = params['rainy_season']['searchDaysC']
                nbday = (start_cessation[0] - start_onset[0]) / np.timedelta64(1, 'D')
                nbday = nbday + wsearch

            ylim = np.array([0, nbday]).tolist()
            breaks = pretty(0, nbday, 14).tolist()

        if params['variable'] == 'cessation':
            start_d = pd.Series(start_cessation).dt.strftime('%Y-%m-%d').to_numpy()
            start_d = np.where(np.isnan(start_cessation), None, start_d)
        elif params['variable'] == 'onset':
            start_d = pd.Series(start_onset).dt.strftime('%Y-%m-%d').to_numpy()
            start_d = np.where(np.isnan(start_onset), None, start_d)
        else:
            start_d = years

        values = np.where(np.isnan(values), None, values)
        data = {
            'time': years.tolist(),
            'values': values.tolist(),
            'stats': stats,
            'coeffs': mod_coef,
            'info': info,
            'yrange': ylim,
            'yticks': breaks,
            'start': start_d.tolist()
        }

        return {'status': 0, 'data': data}
    else:
        lon = info['geom']['lon']
        lat = info['geom']['lat']
        crd = f'(Longitude: {lon}, Latitude: {lat})'

        msg = f'All data are missing for point {crd}'
        return {'status': -1, 'message': msg}

def agriculture_analysis_ts_proba(params):
    season_data = _get_rainy_season(params)
    if season_data['status'] == -1:
        return season_data
    rainy_season = season_data['data']

    var_name = params['variable']
    years = rainy_season['year'].values
    values = rainy_season[var_name].values
    values = values.squeeze()
    info = _get_rainy_season_info(rainy_season, params)
    xunits = info['var']['units']
    xlabel = info['var']['name']
    if xunits != '':
        xlabel = f'{xlabel} ({xunits})'
    info['labels'] = {
        'x': xlabel,
        'y': 'Probability of exceeding'
    }

    start_onset = rainy_season.onset_start.values
    start_cessation = rainy_season.cessation_start.values

    mlon = info['geom']['lon']
    mlat = info['geom']['lat']
    mcrd = f'(Longitude: {mlon}, Latitude: {mlat})'

    if ~np.all(np.isnan(values)):
        if len(values[~np.isnan(values)]) > 10:
            p_ecdf = ecdf_ts(values)
            s_ecdf = ecdf_smooth_v2(
                values, adj=1.0, extend=True, n=512
            )
            cdf = {
                'empirical': {
                    k: np.round(v, decimals=6).tolist()
                    for k, v in p_ecdf.items()
                },
                'smoothed': {
                    k: np.round(v, decimals=6).tolist()
                    for k, v in s_ecdf.items()
                }
            }

            vmin = np.nanmin(values)
            vmax = np.nanmax(values)
            breaks = pretty(vmin, vmax, 14).tolist()

            xlim = [breaks[0], breaks[-1]]
            ex = (xlim[1] - xlim[0]) * 0.01
            xlim[0] = xlim[0] - ex
            xlim[1] = xlim[1] + ex

            if params['variable'] == 'cessation':
                start_d = pd.Series(start_cessation).dt.strftime('%Y-%m-%d').to_numpy()
                start_d = np.where(np.isnan(start_cessation), None, start_d)
            elif params['variable'] == 'onset':
                start_d = pd.Series(start_onset).dt.strftime('%Y-%m-%d').to_numpy()
                start_d = np.where(np.isnan(start_onset), None, start_d)
            else:
                start_d = years

            values = np.where(np.isnan(values), None, values)
            data = {
                'ts': values.tolist(),
                'cdf': cdf,
                'info': info,
                'xrange': xlim,
                'xticks': breaks,
                'start': start_d.tolist()
            }
            return {'status': 0, 'data': data}
        else:
            msg = f'Not enough data to compute CDF for point {mcrd}'
            return {'status': -1, 'message': msg}
    else:
        msg = f'All data are missing for point {mcrd}'
        return {'status': -1, 'message': msg}

def agriculture_analysis_ts_anom(params):
    season_data = _get_rainy_season(params)
    if season_data['status'] == -1:
        return season_data
    rainy_season = season_data['data']

    var_name = params['variable']
    years = rainy_season['year'].values
    values = rainy_season[var_name].values
    values = values.squeeze()
    info = _get_rainy_season_info(rainy_season, params)
    info['var']['name'] = f"{info['var']['name']} anomaly"
    info['var']['units'] = 'days'

    mlon = info['geom']['lon']
    mlat = info['geom']['lat']
    mcrd = f'(Longitude: {mlon}, Latitude: {mlat})'

    if ~np.all(np.isnan(values)):
        if len(values[~np.isnan(values)]) > 10:
            clim = np.nanmean(values)
        else:
            msg = f'Not enough data to compute climatology for point {mcrd}'
            return {'status': -1, 'message': msg}

        values = values - clim
        vmin = np.nanmin(values)
        vmax = np.nanmax(values)
        val_max = np.maximum(np.abs(vmin), np.abs(vmax))
        breaks = pretty(-val_max, val_max, 14).tolist()
        ylim = np.array([breaks[0], breaks[-1]])
        ylim = ylim + ((ylim[1] - ylim[0]) * 0.01) * np.array([-1, 1])

        values = np.round(values)
        values = np.where(np.isnan(values), None, values)
        data = {
            'time': years.tolist(),
            'values': values.tolist(),
            'info': info,
            'yrange': ylim.tolist(),
            'yticks': breaks
        }
        return {'status': 0, 'data': data}
    else:
        msg = f'All data are missing for point {mcrd}'
        return {'status': -1, 'message': msg}

def _get_rainy_season(params):
    p_rseas = params['rainy_season']
    p_rseas['lon'] = round(float(params['pointsList'][0]['lon']), 4)
    p_rseas['lat'] = round(float(params['pointsList'][0]['lat']), 4)
    cache_key = hash_params_rainy_season(p_rseas)
    cached_data = cache.get(cache_key)

    if cached_data is None:
        try:
            cached_data = _compute_rainy_season(params)
            cached_data = cached_data.compute()
        except Exception as e:
            return {'status': -1, 'message': str(e)}
        cache.set(cache_key, cached_data)

    return {'status': 0, 'data': cached_data}

def _compute_rainy_season(params):
    lon_a = [float(params['pointsList'][0]['lon'])]
    lat_a = [float(params['pointsList'][0]['lat'])]
    params_data = {
        k: params[k]
        for k in ['temporalRes', 'dataset']
    }

    params_precip = params_data.copy()
    params_precip['variable'] = 'precip'
    precip = get_zarr_dataset(params_precip)
    precip_da = precip['precip']
    precip_da = precip_da.sel(
        lon=lon_a, lat=lat_a, method='nearest'
    )

    params_et0 = params_data.copy()
    params_et0['variable'] = 'et0'
    et0 = get_zarr_dataset(params_et0)
    et0_da = et0['et0']
    et0_da = et0_da.sel(
        lon=lon_a, lat=lat_a, method='nearest'
    )
    et0_da = et0_da.assign_coords(
        lon=precip_da.lon, lat=precip_da.lat 
    )

    taw = get_gyga_af_tawc('agg_erzd')
    taw_da = taw['tawc_agg_erzd']
    taw_da = taw_da.sel(
        lon=lon_a, lat=lat_a, method='nearest'
    )
    taw_da = taw_da.assign_coords(
        lon=precip_da.lon, lat=precip_da.lat
    )

    return compute_rainy_season(
        precip_da, et0_da, taw_da,
        params['rainy_season']
    )

def _get_rainy_season_info(rseas, params):
    var_name = params['variable']
    if var_name == 'length':
        var_unit = 'days'
    else:
        var_unit = ''

    return {
        'geom': {
            'name': params['pointsList'][0]['loc'],
            'lon': float(params['pointsList'][0]['lon']),
            'lat': float(params['pointsList'][0]['lat'])
        },
        'var':{
            'name': rseas[var_name].attrs['long_name'],
            'units': var_unit,
            'type': params['variable']
        },
        'time_res': params['temporalRes']
    }
