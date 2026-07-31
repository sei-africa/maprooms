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

def _rainy_params(
    params: dict[str, Any]
) -> dict[str, Any]:
    try:
        return params['rainy_season']
    except (KeyError, TypeError) as exc:
        raise ValueError(
            "params must contain a 'rainy_season' dictionary"
        ) from exc
