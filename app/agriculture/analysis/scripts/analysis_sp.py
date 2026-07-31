import json
import numpy as np

from app.dst_api.scripts import get_zarr_dataset
from app.scripts.imagepng import create_imagePng
from app.scripts.colorbar import matplotlib_invalid_colors
from app.scripts._cache import cache, hash_params_rainy_season
from app.misc.scripts.soilgrids_tawc import get_gyga_af_tawc
from app.misc.scripts.extract_data import regrid2D_dataArray
from app.misc.scripts.rainy_season import compute_rainy_season

def agriculture_analysis_sp_data(params):
    return {'status': -1, 'message': 'test agriculture'}

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

def _get_rainy_season(params):
    # cache_key = hash_params_rainy_season(
    #     params['rainy_season']
    # )
    cache_key = 'test_rainy_season'
    cached_data = cache.get(cache_key)

    if cached_data is None:
        try:
            cached_data = _compute_rainy_season(params)
        except Exception as e:
            return json.dumps({
                'status': -1,
                'message': str(e)
            })
        cached_data = out['data']
        cache.set(cache_key, cached_data)

def _compute_rainy_season(params):
    params_data = {
        k: params[k]
        for k in ['temporalRes', 'dataset']
    }
    params_precip = params_data.copy()
    params_precip['variable'] = 'precip'
    precip = get_zarr_dataset(params_precip)
    precip_da = precip['precip']

    params_et0 = params_data.copy()
    params_et0['variable'] = 'et0'
    et0 = get_zarr_dataset(params_et0)
    et0_da = et0['et0']

    bbox = {
        'minLon': precip_da['lon'].min().values.item(),
        'maxLon': precip_da['lon'].max().values.item(),
        'minLat': precip_da['lat'].min().values.item(),
        'maxLat': precip_da['lat'].max().values.item()
    }
    taw = get_gyga_af_tawc('agg_erzd', bbox)
    taw_da = regrid2D_dataArray(
        precip_da, taw['tawc_agg_erzd']
    )

    return compute_rainy_season(
        precip_da, et0_da, taw_da,
        params['rainy_season']
    )
