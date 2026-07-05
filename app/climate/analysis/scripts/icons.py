import os
from app.scripts._global import GLOBAL_CONFIG
from app.scripts._colors import COLORS_MAPROOM
# from app.scripts.subdivision import get_subdivisions_data
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

def icon_dekadal_analysis():
    from app.scripts._cache import cache
    from app.dst_api.scripts import get_netcdf_data
    from app.dst_api.scripts import read_shapefiles
    # create_icon_data must be imported here 
    # to avoid a circular import
    from app.scripts.icons import create_icon_data

    cached_data = cache.get('icon_dekadal_analysis')
    if cached_data is None:
        map_colors = COLORS_MAPROOM['tim_colors']
        data = get_netcdf_data('ALL', 'dekadal', 'precip', '2010-07-1')
        shapefile = _get_layers_shapefiles()
        gdf = read_shapefiles(shapefile)
        if gdf['status'] == -1:
            print(gdf['message'])

        cached_data = create_icon_data(data,
                                colors=map_colors['colors'],
                                colors_ext=map_colors['ext'],
                                gdf_boundaries=gdf['shp'])
        cache.set('icon_dekadal_analysis', cached_data)
    return cached_data

def icon_daily_analysis():
    from app.scripts._cache import cache
    from app.dst_api.scripts import get_netcdf_data
    from app.dst_api.scripts import read_shapefiles
    from app.scripts.icons import create_icon_data
    from app.scripts.colorbar import get_ColorBarName

    cached_data = cache.get('icon_daily_analysis')
    if cached_data is None:
        map_colors = get_ColorBarName('viridis', 20, True)
        data = get_netcdf_data('ALL', 'daily', 'precip', '2010-07-01')
        shapefile = _get_layers_shapefiles()
        gdf = read_shapefiles(shapefile)
        if gdf['status'] == -1:
            print(gdf['message'])

        cached_data = create_icon_data(data,
                                colors=map_colors['colors'],
                                colors_ext=map_colors['ext'],
                                gdf_boundaries=gdf['shp'])
        cache.set('icon_daily_analysis', cached_data)
    return cached_data

def icon_monthly_analysis():
    from app.scripts._cache import cache
    from app.dst_api.scripts import get_netcdf_data
    from app.dst_api.scripts import read_shapefiles
    from app.scripts.icons import create_icon_data

    cached_data = cache.get('icon_monthly_analysis')
    if cached_data is None:
        map_colors = COLORS_MAPROOM['precipitation_1']
        data = get_netcdf_data('ALL', 'dekadal', 'precip', '2010-08-3')
        shapefile = _get_layers_shapefiles()
        gdf = read_shapefiles(shapefile)
        if gdf['status'] == -1:
            print(gdf['message'])

        cached_data = create_icon_data(data,
                                colors=map_colors['colors'],
                                colors_ext=map_colors['ext'],
                                gdf_boundaries=gdf['shp'])
        cache.set('icon_monthly_analysis', cached_data)
    return cached_data
