from __future__ import annotations
import numpy as np
import xarray as xr

def runoff_fun(
    precip: xr.DataArray,
    win: int = 7,
    no_runoff: float = 12.5
) -> xr.DataArray:
    """
    Calculate runoff from precipitation.

    Parameters
    ----------
    precip
        Precipitation DataArray with dimensions ``('time', 'lat', 'lon')``.

    win
        Rolling-window length along the time dimension.

    no_runoff
        Minimum daily precipitation required for runoff.

    Returns
    -------
    xarray.DataArray
        Runoff with dimensions ``('time', 'lat', 'lon')`` and the same
        coordinates as ``precip``.
    """
    required_dims = {'time', 'lat', 'lon'}

    if not required_dims.issubset(precip.dims):
        raise ValueError(
            "'precip' must contain the dimensions "
            "'time', 'lat', and 'lon'."
        )

    if not isinstance(win, (int, np.integer)) or win < 1:
        raise ValueError("'win' must be a positive integer.")

    class_i = np.array(
        [6.25, 6.3, 19.0, 31.7, 44.4, 57.1, 69.9],
        dtype=np.float64
    )

    ppn = np.array(
        [
            [0.00,  0.000, 0.0000],
            [0.858, -0.895, 0.0028],
            [-1.14,  0.042, 0.0026],
            [-2.34,  0.120, 0.0026],
            [-2.36,  0.190, 0.0026],
            [-2.78,  0.250, 0.0026],
            [-3.17,  0.320, 0.0024],
            [-4.21,  0.438, 0.0018]
        ],
        dtype=np.float64
    )

    precip = precip.astype(np.float64)
    cum_r = (
        (precip / 2.0)
        .rolling(time=win, min_periods=win)
        .sum()
    )

    tmp = xr.where(
        precip.isnull(),
        np.nan,
        cum_r * xr.where(precip >= no_runoff, 1.0, 0.0)
    )

    class_index = xr.zeros_like(tmp, dtype=np.int8)

    for threshold in class_i:
        class_index = class_index + (tmp >= threshold).astype(np.int8)

    a0 = xr.apply_ufunc(
        lambda idx: ppn[idx, 0],
        class_index,
        dask='parallelized',
        output_dtypes=[np.float64]
    )
    a1 = xr.apply_ufunc(
        lambda idx: ppn[idx, 1],
        class_index,
        dask='parallelized',
        output_dtypes=[np.float64]
    )
    a2 = xr.apply_ufunc(
        lambda idx: ppn[idx, 2],
        class_index,
        dask='parallelized',
        output_dtypes=[np.float64]
    )

    runoff = (
        a0
        + a1 * precip
        + a2 * precip**2
    )

    runoff = runoff.where(runoff >= 0, 0.0)
    runoff = runoff.fillna(0.0)
    runoff = runoff.rename('runoff')

    runoff.attrs = {
        'long_name': 'Runoff',
        'description': (
            'Runoff estimated from precipitation using a rolling '
            f'{win}-day antecedent precipitation total'
        ),
        'rolling_window': win,
        'no_runoff_threshold': no_runoff,
    }

    return runoff.transpose('time', 'lat', 'lon')
