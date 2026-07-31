from __future__ import annotations

from typing import Any

import numpy as np
import xarray as xr

def _validate_cube(
    data: xr.DataArray,
    name: str
) -> xr.DataArray:
    if not isinstance(data, xr.DataArray):
        raise TypeError(
            f'{name} must be an xarray.DataArray'
        )
    missing = {'time', 'lat', 'lon'} - set(data.dims)
    if missing:
        raise ValueError(
            f'{name} is missing dimensions: {sorted(missing)}'
        )
    return data.transpose('time', 'lat', 'lon')

def _as_numpy(
    data: xr.DataArray
) -> np.ndarray:
    return np.asarray(
        data.data.compute()
        if hasattr(data.data, 'compute')
        else data.data
    )

def _empty_spatial_dates(
    data: xr.DataArray
) -> xr.DataArray:
    return xr.DataArray(
        np.full(
            (data.sizes['lat'], data.sizes['lon']),
            np.datetime64('NaT'),
            dtype='datetime64[ns]'
        ),
        dims=('lat', 'lon'),
        coords={'lat': data.lat, 'lon': data.lon}
    )

def _max_true_run(
    values: np.ndarray
) -> int:
    padded = np.r_[False, values, False].astype(np.int8)
    edges = np.flatnonzero(np.diff(padded))
    return int(np.max(edges[1::2] - edges[::2], initial=0))
