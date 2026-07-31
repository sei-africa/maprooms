import os
import requests
from pathlib import Path
import numpy as np
import xarray as xr
import rasterio
from rasterio.warp import (
    Resampling,
    calculate_default_transform,
    reproject
)
from .extract_data import extract2D_region
from app.scripts._global import GLOBAL_CONFIG

def _download_gyga_af_tif(url: str, dest_file: str) -> Path:
    if os.path.exists(dest_file):
         os.remove(dest_file)

    path = Path(dest_file)
    print(f'Downloading {url}')
    with requests.get(url, stream=True, timeout=60) as response:
        response.raise_for_status()
        with path.open('wb') as dst:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    dst.write(chunk)
    print(f'Saved GeoTIFF: {path} ({path.stat().st_size:,} bytes)')
    return path

def _raster_to_xarray(path: Path, tawc_info: dict) -> xr.Dataset:
    with rasterio.open(path) as src:
        if src.crs is None:
            msg = 'Input raster has no CRS; lon/lat coordinates cannot be inferred.'
            raise ValueError(msg)
        nodata = src.nodata
        dst_crs = 'EPSG:4326'

        if src.crs.to_epsg() == 4326:
            if src.transform.b != 0 or src.transform.d != 0:
                msg = 'Rotated rasters are not supported by this simple converter.'
                raise ValueError(msg)
            data = src.read(1)
            transform = src.transform
            crs_text = src.crs.to_string()
        else:
            print(f'Reprojecting from {src.crs} to {dst_crs}')
            transform, width, height = calculate_default_transform(
                src.crs,
                dst_crs,
                src.width,
                src.height,
                *src.bounds,
            )
            data = np.full((height, width), nodata, dtype=src.dtypes[0])
            reproject(
                source=rasterio.band(src, 1),
                destination=data,
                src_transform=src.transform,
                src_crs=src.crs,
                src_nodata=nodata,
                dst_transform=transform,
                dst_crs=dst_crs,
                dst_nodata=nodata,
                resampling=Resampling.nearest,
            )
            crs_text = dst_crs

        lon = transform.c + (np.arange(data.shape[1]) + 0.5) * transform.a
        lat = transform.f + (np.arange(data.shape[0]) + 0.5) * transform.e
        attrs = {
            'source': str(path),
            'crs': crs_text,
            'transform': tuple(transform),
        }
        if nodata is not None:
            attrs['_FillValue'] = nodata

    if nodata is not None:
        data = np.where(data == nodata, np.nan, data).astype('float32')

    xr_data = xr.Dataset(
        data_vars={
            tawc_info['name']: (
                ('lat', 'lon'), data,
                {
                    'long_name': tawc_info['long_name'],
                    **attrs
                }
            )
        },
        coords={
            'lat': ('lat', lat, {'units': 'degrees_north'}),
            'lon': ('lon', lon, {'units': 'degrees_east'}),
        }
    )
    return xr_data

def download_gyga_af_tawc(tawc_type: str = 'agg_erzd') -> None:
    soilgrids = GLOBAL_CONFIG['soilgrids']
    tawc_info = soilgrids['tawc'][tawc_type]

    data_dir = soilgrids['files_dir']
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    dest_file = os.path.join(data_dir, tawc_info['file'])
    url = f'{soilgrids['base_url']}/{tawc_info['file']}'
    path = _download_gyga_af_tif(url, dest_file)
    xr_data = _raster_to_xarray(path, tawc_info)
    xr_data = xr_data.chunk(soilgrids['chunks'])

    zarr_path = os.path.join(soilgrids['zarr_dir'], tawc_info['name'])
    if not os.path.exists(zarr_path):
        os.makedirs(zarr_path)

    xr_data.to_zarr(
        store=zarr_path,
        mode='w',
        consolidated=False,
    )

def get_gyga_af_tawc(
    tawc_type: str = 'agg_erzd',
    bbox: dict | None = None
)-> xr.Dataset:
    soilgrids = GLOBAL_CONFIG['soilgrids']
    tawc_info = soilgrids['tawc'][tawc_type]
    zarr_path = os.path.join(
        soilgrids['zarr_dir'], tawc_info['name']
    )
    xr_data = xr.open_zarr(
        zarr_path,
        chunks=soilgrids['chunks'],
        consolidated=False
    )
    if bbox is not None:
        xr_data = extract2D_region(xr_data, bbox)

    return xr_data
