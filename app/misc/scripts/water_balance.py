from __future__ import annotations

import numpy as np
import xarray as xr
from ._util import _validate_cube

def simple_water_balance(
    rain: xr.DataArray,
    et0: xr.DataArray,
    taw: xr.DataArray,
    wb_init: xr.DataArray | np.ndarray | float | None = None,
) -> xr.DataArray:
    """
    Calculate a simple water balance for gridded time-series data.

    Expected dimensions
    -------------------
    rain:
        Daily Rainfall, DataArray with dimensions ('time', 'lat', 'lon').

    et0:
        Daily Reference evapotranspiration, DataArray with dimensions ('time', 'lat', 'lon').

    taw:
        Total available water with dimensions ('lat', 'lon').

    wb_init:
        Initial water balance. It may be:

        - None: use taw / 3;
        - a scalar;
        - a DataArray broadcastable to ('lat', 'lon');
        - a NumPy array broadcastable to ('lat', 'lon').

    Returns
    -------
    xr.DataArray
        Water balance with dimensions ('time', 'lat', 'lon').
    """
    rain = _validate_cube(rain, 'rain')
    et0 = _validate_cube(et0, 'et0')
    if not isinstance(taw, xr.DataArray):
        raise TypeError(
            'taw must be an xarray.DataArray'
        )
    if set(taw.dims) != {'lat', 'lon'}:
        raise ValueError(
            "taw must contain exactly "
            "the dimensions 'lat' and 'lon'; "
            f"received {taw.dims}"
        )
    if rain.sizes['time'] == 0 or et0.sizes['time'] == 0:
        raise ValueError(
            'rain and et0 must contain at least one time step'
        )

    taw = taw.transpose('lat', 'lon')
    spatial_coords = {'lat': rain.lat, 'lon': rain.lon}
    if not (rain.lat.equals(et0.lat) and rain.lon.equals(et0.lon)):
        et0 = et0.interp(spatial_coords)
    if not (rain.lat.equals(taw.lat) and rain.lon.equals(taw.lon)):
        taw = taw.interp(spatial_coords)

    rain, et0 = xr.align(rain, et0, join='inner')
    if rain.sizes['time'] == 0:
        raise ValueError(
            'rain and et0 have no common time coordinates'
        )

    if rain.chunks is not None:
        # The recurrence requires the complete time series in every task.
        # Rechunk it explicitly and preserve the rainfall spatial chunks;
        # allowing apply_gufunc to rechunk automatically fragments lat/lon.
        rain = rain.chunk({'time': -1})
        target_chunks = {
            'time': -1,
            'lat': rain.chunksizes['lat'],
            'lon': rain.chunksizes['lon'],
        }
        et0 = et0.chunk(target_chunks)
        taw = taw.chunk({
            'lat': rain.chunksizes['lat'],
            'lon': rain.chunksizes['lon'],
        })

    valid = rain.notnull() & et0.notnull()
    rain_filled = rain.where(valid, 0.0).astype(np.float64)
    et0_filled = et0.where(valid, 0.0).astype(np.float64)
    taw = taw.astype(np.float64)

    if wb_init is None:
        initial = taw / 3.0
    elif np.isscalar(wb_init):
        initial = xr.full_like(
            taw,
            float(wb_init),
            dtype=np.float64
        )
    elif isinstance(wb_init, xr.DataArray):
        if set(wb_init.dims) != {'lat', 'lon'}:
            raise ValueError(
                "a DataArray wb_init must contain "
                "exactly the dimensions lat' and 'lon'; "
                f"received {wb_init.dims}"
            )
        initial = wb_init.transpose('lat', 'lon')
        wbi_eq_lat = rain.lat.equals(initial.lat)
        wbi_eq_lon = rain.lon.equals(initial.lon)
        if not (wbi_eq_lat and wbi_eq_lon):
            initial = initial.interp(spatial_coords)
        initial = initial.astype(np.float64)
    elif isinstance(wb_init, np.ndarray):
        try:
            values = np.broadcast_to(
                np.asarray(wb_init, dtype=np.float64),
                taw.shape
            ).copy()
        except ValueError as exc:
            raise ValueError(
                'wb_init with shape '
                f'{wb_init.shape} cannot be broadcast '
                f'to the TAW grid {taw.shape}'
            ) from exc
        initial = xr.DataArray(
            values, coords=taw.coords, dims=taw.dims
        )
    else:
        raise TypeError(
            'wb_init must be None, a scalar, '
            'a NumPy array, or a DataArray'
        )

    if rain.chunks is not None:
        spatial_chunks = {
            'lat': rain.chunksizes['lat'],
            'lon': rain.chunksizes['lon'],
        }
        initial = initial.chunk(spatial_chunks)

    def _calculate(
        rain_values: np.ndarray,
        et0_values: np.ndarray,
        taw_values: np.ndarray,
        initial_values: np.ndarray,
    ) -> np.ndarray:
        # apply_ufunc moves the core time dimension to the final axis.
        output = np.empty_like(rain_values, dtype=np.float64)
        output[..., 0] = initial_values
        for day in range(1, rain_values.shape[-1]):
            output[..., day] = np.clip(
                output[..., day - 1]
                + rain_values[..., day]
                - et0_values[..., day],
                0.0,
                taw_values,
            )
        return output

    balance = xr.apply_ufunc(
        _calculate,
        rain_filled,
        et0_filled,
        taw,
        initial,
        input_core_dims=[['time'], ['time'], [], []],
        output_core_dims=[['time']],
        dask='parallelized',
        vectorize=False,
        output_dtypes=[np.float64],
        dask_gufunc_kwargs={'allow_rechunk': False},
    )
    entirely_missing = valid.sum('time') == 0
    balance = (
        balance.where(~entirely_missing)
        .transpose('time', 'lat', 'lon')
    )
    balance = balance.assign_coords(
        time=rain.time,
        lat=rain.lat,
        lon=rain.lon
    )
    balance.name = 'water_balance'
    balance.attrs = {
        'long_name': 'Water balance',
        'units': 'mm',
        'description': (
            'Previous water balance plus rainfall minus '
            'reference evapotranspiration, constrained '
            'between zero and total available water.'
        ),
    }
    return balance
