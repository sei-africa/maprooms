import os
import geopandas as gpd
from ._global import GLOBAL_CONFIG
from .util import load_yaml_file

def get_subdivisions_data():
    app_dir = GLOBAL_CONFIG['app_dir']
    layers_file = os.path.join(app_dir, 'yaml', 'subdivision-config.yaml')
    layers = load_yaml_file(layers_file)

    subdiv = {}
    for key, value in layers['subdivision'].items():
        sub_file = os.path.join(GLOBAL_CONFIG['shp_dir'], value['file'])
        if not os.path.exists(sub_file):
            msg = f'File {value['file']} not found.'
            return {'status': -1, 'message': msg}
        gpd_data = gpd.read_file(sub_file)
        if 'region' in value:
            keep = [value['field'], value['region'], 'geometry']
        else:
            keep = [value['field'], 'geometry']
        exclude = [n for n in gpd_data.columns if not n in keep]
        gpd_data = gpd_data.drop(exclude, axis=1)
        if 'region' in value:
            if keep.count(value['region']) == 2:
                gpd_data['region'] = gpd_data[value['region']]
                colname = {value['field']: 'field'}
            else:
                colname = {value['field']: 'field', value['region']: 'region'}
        else:
            colname = {value['field']: 'field'}
        gpd_data = gpd_data.rename(columns=colname)
        gpd_data = gpd_data.to_crs('EPSG:4326')
        subdiv[key] = gpd_data.to_json()

    return {'status': 0, 'data': subdiv}
