import os
import json
import numpy as np
from app.scripts._global import GLOBAL_CONFIG
from app.scripts._colors import COLORS_MAPROOM
from app.scripts.util import load_yaml_file

## to be changed
def _get_layers_shapefiles():
    app_dir = GLOBAL_CONFIG['app_dir']
    layers_file = os.path.join(app_dir, 'yaml', 'subdivision-config.yaml')
    layers = load_yaml_file(layers_file)
    file = next(
        (
            v['file']
            for v in layers['subdivision'].values()
            if (
                v['group'] == 'administrative'
                and v['field'] == v['region']
            )
        ),
        None
    )
    return file

def icon_climate_monitoring():
    from app.scripts._cache import cache
    from app.dst_api.scripts import read_shapefiles
    from app.scripts.colorbar import get_ColorBarName
    from app.scripts.icons import create_icon_data
    from app.dst_api.scripts import download_analysis

    cached_data = cache.get('icon_climate_monitoring')
    if cached_data is None:
        map_colors = get_ColorBarName('BrBG', 20, True)

        params = {'analysis': 'anomaly', 'anomaly': 'standardized', 'dataset': 'ALL', 'temporalRes': 'monthly',
                  'variable': 'precip', 'geomExtract': 'original', 'outFormat': 'JSON-Format',
                  'startYear': '1991', 'endYear': '2020', 'minYear': 30, 'Date': '2023-07',
                  'gridded': True, 'webApp': True, 'finalOutput': False, 'climFunction': 'mean-stdev',
                  'fullYear': True, 'outFormat_0': 'JSON-Format', 'climDate': None, 'httpMethod': 'POST'}
        data = download_analysis(params)
        data = _parse_json_spatial_data(data, 'Date')

        shapefile = _get_layers_shapefiles()
        gdf = read_shapefiles(shapefile)
        if gdf['status'] == -1:
            print(gdf['message'])

        cached_data = create_icon_data(data,
                                colors=map_colors['colors'],
                                colors_ext=map_colors['ext'],
                                gdf_boundaries=gdf['shp'])
        cache.set('icon_climate_monitoring', cached_data)
    return cached_data

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
