from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
import xarray as xr
from scipy.spatial import cKDTree

from ._util import (
    _validate_cube,
    _as_numpy,
    _empty_spatial_dates,
    _max_true_run
)
from .water_balance import simple_water_balance
from .rm_isolated import remove_isolated_pixels_3d

def compute_rainy_season(
    precip: xr.DataArray,
    et0: xr.DataArray,
    taw: xr.DataArray,
    rp: dict[str, Any],
) -> xr.Dataset:
    precip = _validate_cube(precip, 'precip')
    et0 = _validate_cube(et0, 'et0')
    if (not isinstance(taw, xr.DataArray) or 
        not {'lat', 'lon'} <= set(taw.dims)):
        raise ValueError(
            'taw must be an xarray.DataArray with lat and lon dimensions'
        )
    taw = taw.transpose('lat', 'lon')

    onset_data = compute_season_onset(precip, rp)
    wb_data = simple_water_balance(precip, et0, taw)
    cessation_data = compute_season_cessation(wb_data, rp)

    if rp['interpolate']:
        empty_cells = precip.isnull().all('time')
        onset = (
            interp_rainy_season(
                onset_data,
                max_search=int(rp['searchDaysO'])
            )
            .where(~empty_cells)
        )
        cessation = (
            interp_rainy_season(
                cessation_data,
                max_search=int(rp['searchDaysC'])
            )
            .where(~empty_cells)
        )
    else:
        onset = onset_data
        cessation = cessation_data

    start_ons = pd.DatetimeIndex(onset_data.start.values)
    end_ons = pd.DatetimeIndex(onset_data.end.values)
    start_cess = pd.DatetimeIndex(cessation_data.start.values)

    idx_ons, idx_cess = [], []
    for i, (start, end) in enumerate(zip(start_ons, end_ons)):
        matches = np.flatnonzero(
            (start <= start_cess) & (end >= start_cess)
        )
        if matches.size:
            idx_ons.append(i)
            idx_cess.append(int(matches[0]))

    onset = onset.isel(year=idx_ons)
    cessation = cessation.isel(year=idx_cess)
    onset_start = start_ons[idx_ons]
    cessation_start = start_cess[idx_cess]

    onset_dates = (
        onset_start.values
        .astype('datetime64[D]')
        .astype(np.int64)[:, None, None]
    )
    onset_dates = _as_numpy(onset) + onset_dates
    cessation_dates = (
        cessation_start.values
        .astype('datetime64[D]')
        .astype(np.int64)[:, None, None]
    )
    cessation_dates = _as_numpy(cessation) + cessation_dates
    season_length = cessation_dates - onset_dates

    invalid = season_length <= int(rp['numberDaysO'])
    onset_values = _as_numpy(onset).copy()
    cessation_values = _as_numpy(cessation).copy()
    onset_values[invalid] = np.nan
    cessation_values[invalid] = np.nan
    season_length[invalid] = np.nan

    years = (
        onset_start.year
        .to_numpy(dtype=np.int32)
    )

    onset = onset_values.astype('float32')
    cessation = cessation_values.astype('float32')
    season_length = season_length.astype('float32')

    onset = remove_isolated_pixels_3d(onset)
    cessation = remove_isolated_pixels_3d(cessation)
    season_length = remove_isolated_pixels_3d(season_length)

    method = (
        "Onset is the first qualifying rainfall window within the annual "
        f"{int(rp['searchDaysO'])}-day onset search period: at least "
        f"{float(rp['rainTotalO']):g} mm over {int(rp['numberDaysO'])} days, "
        f"with rain >= {float(rp['rainThres']):g} mm on at least "
        f"{int(rp['minNbDaysO'])} days. A candidate is rejected as a false "
        f"onset when a dry spell lasting at least {int(rp['drySpellO'])} "
        f"days occurs during the following {int(rp['drySpellDaysO'])} days. "
        "Cessation is calculated from a daily bucket water balance, initialized "
        "to one third of total available water and updated as rainfall minus "
        "reference evapotranspiration within bounds of zero and TAW. It is the "
        f"first of {int(rp['numberDaysC'])} consecutive days with water balance "
        f"below {float(rp['waterBalanceC']):g} mm during the annual "
        f"{int(rp['searchDaysC'])}-day cessation search period. Missing spatial "
        "values are filled from the nearest valid grid cell within the configured "
        "maximum interpolation distance when at least five valid cells exist."
    )

    return xr.Dataset(
        data_vars={
            'onset': (
                ('year', 'lat', 'lon'), onset,
                {
                    'long_name': 'Onset of the rainy season',
                    'units': "days since 'onset_start' for each 'year'"
                }
            ),
            'cessation': (
                ('year', 'lat', 'lon'), cessation,
                {
                    'long_name': 'Cessation of the rainy season',
                    'units': "days since 'cessation_start' for each 'year'"
                }
            ),
            'season_length': (
                ('year', 'lat', 'lon'), season_length,
                {
                    'long_name': 'Length of the rainy season',
                    'units': 'days'
                }
            ),
            'onset_start': ('year', onset_start.values),
            'cessation_start': ('year', cessation_start.values),
        },
        coords={
            'year': years,
            'lat': precip.lat.values,
            'lon': precip.lon.values
        },
        attrs={
            'title': 'Rainy season: onset, cessation and length',
            'method': method
        }
    )

def compute_season_onset(
    precip: xr.DataArray,
    rp: dict[str, Any]
) -> xr.DataArray:
    precip = _validate_cube(precip, 'precip')
    periods = index_daily_season(
        precip.time.values,
        int(rp['startMonthO']),
        int(rp['startDayO'])
    )
    start_dates = periods['range_date'][:, 0]
    rows = []
    for idx, start in zip(periods['index'], start_dates):
        found = get_year_season_onset(precip.isel(time=idx), rp)
        start_date = pd.Timestamp(start).to_datetime64()
        offsets = (
            (found - start_date) / np.timedelta64(1, 'D')
            - int(rp['numberDaysO'])
            + 1
        )
        # NaN/NaT values remain missing when clipped. This avoids a separate
        # Dask blockwise broadcast between the values and a validity mask.
        offsets = offsets.clip(min=0)
        rows.append(offsets)

    years = (
        pd.DatetimeIndex(start_dates).year
        .astype(np.int32)
    )
    return (
        xr.concat(
            rows, dim=xr.IndexVariable('year', years)
        )
        .assign_coords(
            start=('year', periods['range_date'][:, 0]),
            end=('year', periods['range_date'][:, 1])
        )
        .rename('days')
        .astype(float)
    )

def compute_season_cessation(
    wb: xr.DataArray,
    rp: dict[str, Any]
) -> xr.DataArray:
    wb = _validate_cube(wb, 'wb')
    periods = index_daily_season(
        wb.time.values,
        int(rp['startMonthC']),
        int(rp['startDayC'])
    )
    start_dates = periods['range_date'][:, 0]
    rows = []
    for idx, start in zip(periods['index'], start_dates):
        found = get_year_season_cessation(wb.isel(time=idx), rp)
        start_date = pd.Timestamp(start).to_datetime64()
        offsets = (found - start_date) / np.timedelta64(1, 'D')
        rows.append(offsets)

    years = (
        pd.DatetimeIndex(start_dates).year
        .astype(np.int32)
    )
    return (
        xr.concat(
            rows, dim=xr.IndexVariable('year', years)
        )
        .assign_coords(
            start=('year', periods['range_date'][:, 0]),
            end=('year', periods['range_date'][:, 1])
        )
        .rename('days')
        .astype(float)
    )

def get_year_season_onset(
    precip: xr.DataArray,
    rainyseas_pars: dict[str, Any]
) -> xr.DataArray:
    precip = _validate_cube(precip, 'precip')
    n = min(
        int(rainyseas_pars['searchDaysO']),
        precip.sizes['time']
    )
    rain = _single_time_chunk(
        precip.isel(time=slice(0, n))
    )
    if n == 0:
        return _empty_spatial_dates(rain)

    result_idx = xr.apply_ufunc(
        _onset_index_1d,
        rain,
        input_core_dims=[['time']],
        output_core_dims=[[]],
        vectorize=True,
        dask='parallelized',
        output_dtypes=[float],
        kwargs={
            'rainyseas_pars': rainyseas_pars
        },
        dask_gufunc_kwargs={
            'allow_rechunk': False
        }
    )
    return _indices_to_date_array(
        result_idx, rain.time.values
    )

def get_year_season_cessation(
    wb_data: xr.DataArray,
    rainyseas_pars: dict[str, Any]
) -> xr.DataArray:
    wb_data = _validate_cube(wb_data, 'wb')
    n = min(
        int(rainyseas_pars['searchDaysC']),
        wb_data.sizes['time']
    )
    wb = _single_time_chunk(
        wb_data.isel(time=slice(0, n))
    )
    if n == 0:
        return _empty_spatial_dates(wb)
    
    min_frac = float(rainyseas_pars['minFrac'])
    usable = wb.notnull().mean('time') >= min_frac
    threshold = float(rainyseas_pars['waterBalanceC']) or 0.01
    run = int(rainyseas_pars['numberDaysC'])
    below = (wb < threshold) & wb.notnull()

    if run <= n:
        complete_run = (
            below.astype(np.int16)
            .rolling(time=run, min_periods=run)
            .sum()
            >= run
        )
        has_run = complete_run.any('time')
        first_end = complete_run.argmax('time')
        result_idx = first_end - run + 1
        result_idx, has_run = xr.unify_chunks(result_idx, has_run)
        result_idx = result_idx.where(has_run, other=n - 1)
    else:
        result_idx = xr.zeros_like(usable, dtype=np.int64) + n - 1

    result_idx, usable = xr.unify_chunks(result_idx, usable)
    result_idx = result_idx.where(usable)
    return _indices_to_date_array(result_idx, wb.time.values)

def _single_time_chunk(
    data: xr.DataArray
) -> xr.DataArray:
    return (
        data.chunk({'time': -1})
        if data.chunks is not None
        else data
    )

def _onset_index_1d(
    values: np.ndarray,
    rainyseas_pars: dict[str, Any]
) -> float:
    rain = np.asarray(values, dtype=float).copy()
    min_frac = float(rainyseas_pars['minFrac'])
    if (
        rain.size == 0
        or np.mean(np.isnan(rain)) > 1 - min_frac
    ):
        return np.nan
    rain[np.isnan(rain)] = 0

    window = int(rainyseas_pars['numberDaysO'])
    cumulative = np.cumsum(rain)
    previous = (
        np.r_[np.zeros(window), cumulative[:-window]]
        if window < rain.size
        else np.zeros_like(cumulative)
    )
    rain_tot = float(rainyseas_pars['rainTotalO'])
    qualifies = (
        cumulative - previous >= rain_tot
    )
    if np.all(qualifies):
        return 0.0

    rainy = rain >= float(rainyseas_pars['rainThres'])
    for pos in np.flatnonzero(qualifies):
        future = ~rainy[
            pos + 1:min(
                rain.size,
                pos + 1 + int(rainyseas_pars['drySpellDaysO'])
            )
        ]
        if _max_true_run(future) >= int(rainyseas_pars['drySpellO']):
            continue
        if np.sum(
            rainy[max(0, pos - window + 1):pos + 1]
        ) >= int(
            rainyseas_pars['minNbDaysO']
        ):
            return float(pos)
    return np.nan

def _indices_to_date_array(
    indices: xr.DataArray,
    dates: np.ndarray,
) -> xr.DataArray:
    date_values = np.asarray(dates, dtype='datetime64[ns]')

    def take_date(values: np.ndarray) -> np.ndarray:
        values = np.asarray(values, dtype=float)
        result = np.full(
            values.shape,
            np.datetime64('NaT'),
            dtype='datetime64[ns]'
        )
        valid = ~np.isnan(values)
        result[valid] = date_values[values[valid].astype(np.int64)]
        return result

    return xr.apply_ufunc(
        take_date,
        indices,
        dask='parallelized',
        output_dtypes=[np.dtype('datetime64[ns]')],
    )

def index_daily_season(
    dates: Any,
    start_month: int,
    start_day: int
) -> dict[str, Any]:
    original = pd.DatetimeIndex(dates)
    if original.empty:
        raise ValueError('dates must not be empty')
    if original.has_duplicates:
        raise ValueError('time coordinate must not contain duplicate dates')
    if not original.is_monotonic_increasing:
        raise ValueError('time coordinate must be sorted in increasing order')

    first, last = original[0].normalize(), original[-1].normalize()
    candidate = pd.Timestamp(first.year, start_month, start_day)
    start = (
        candidate
        if first <= candidate
        else pd.Timestamp(
                first.year + 1,
                start_month,
                start_day
            )
    )
    if (start - first).days in (0, 365, 366):
        start = first
    final_candidate = pd.Timestamp(
        last.year, start_month, start_day
    )
    if final_candidate <= last:
        final_candidate = pd.Timestamp(
            last.year + 1, start_month, start_day
        )
    end = final_candidate - pd.Timedelta(days=1)
    lookup = pd.Series(
        np.arange(len(original)),
        index=original.normalize()
    )
    full = pd.date_range(start, end, freq='D')
    start_flags = (full.month == start_month) & (full.day == start_day)
    boundaries = np.r_[np.flatnonzero(start_flags), len(full)]
    if boundaries[0] != 0:
        boundaries = np.r_[0, boundaries]

    indices, ranges = [], []
    for left, right in zip(boundaries[:-1], boundaries[1:]):
        period = full[left:right]
        matched = lookup.reindex(period).to_numpy()
        indices.append(matched[~pd.isna(matched)].astype(int))
        ranges.append(
            [
                period[0].to_datetime64(),
                period[-1].to_datetime64()
            ]
        )
    return {
        'index': indices,
        'range_date': np.asarray(ranges, dtype='datetime64[ns]')
    }

def interp_rainy_season(
    season_data: xr.DataArray,
    max_search: int | float = np.inf,
    max_dist: float = 1.5,
) -> xr.DataArray:
    if not isinstance(season_data, xr.DataArray):
        raise TypeError('season_data must be an xarray.DataArray')
    season_data = season_data.transpose('year', 'lat', 'lon')
    lon, lat = np.meshgrid(
        season_data.lon.values,
        season_data.lat.values
    )
    coords = np.column_stack(
        [lon.ravel(), lat.ravel()]
    )

    if season_data.chunks is not None:
        # The KD-tree needs a complete spatial layer. Rechunk spatially first,
        # then split years in a separate step to avoid a chunk cross-product.
        season_data = season_data.chunk({'lat': -1, 'lon': -1})
        season_data = season_data.chunk({'year': 1})

    return xr.apply_ufunc(
        _interp_rainy_season_layer,
        season_data,
        input_core_dims=[['lat', 'lon']],
        output_core_dims=[['lat', 'lon']],
        vectorize=True,
        dask='parallelized',
        output_dtypes=[float],
        kwargs={
            'coords': coords,
            'max_search': max_search,
            'max_dist': max_dist,
        },
        dask_gufunc_kwargs={'allow_rechunk': False},
        keep_attrs=True,
    ).transpose('year', 'lat', 'lon')

def _interp_rainy_season_layer(
    layer: np.ndarray,
    coords: np.ndarray,
    max_search: int | float,
    max_dist: float,
) -> np.ndarray:
    """
    Interpolate one spatial layer;
    Dask schedules layers in parallel.
    """
    layer = np.asarray(layer, dtype=float)
    row = layer.ravel()
    valid = ~np.isnan(row)
    if np.count_nonzero(valid) < 5:
        return layer.copy()

    distance, nearest = cKDTree(coords[valid]).query(coords, k=1)
    fill = distance <= max_dist
    filled = row.copy()
    filled[fill] = row[valid][nearest[fill]]
    return np.clip(filled, 0, max_search).reshape(layer.shape)
