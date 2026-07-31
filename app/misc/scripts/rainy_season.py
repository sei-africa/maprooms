from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
import xarray as xr
from scipy.spatial import cKDTree

from ._util import (
    _rainy_params,
    _validate_cube,
    _as_numpy
)
from .water_balance import simple_water_balance
from .rm_isolated import remove_isolated_pixels_3d

def compute_rainy_season(
    precip: xr.DataArray,
    et0: xr.DataArray,
    taw: xr.DataArray,
    params: dict[str, Any],
) -> xr.Dataset:
    precip = _validate_cube(precip, 'precip')
    et0 = _validate_cube(et0, 'et0')
    if (not isinstance(taw, xr.DataArray) or 
        not {'lat', 'lon'} <= set(taw.dims)):
        raise ValueError(
            'taw must be an xarray.DataArray with lat and lon dimensions'
        )
    taw = taw.transpose('lat', 'lon')
    rp = _rainy_params(params)

    onset_data = compute_season_onset(precip, params)
    wb_data = simple_water_balance(precip, et0, taw)
    cessation_data = compute_season_cessation(wb_data, params)

    if rp['interpolate']:
        values = (
            _as_numpy(precip)
            .reshape(precip.sizes['time'], -1)
        )
        empty_cells = np.sum(~np.isnan(values), axis=0) == 0

        xlat = np.tile(precip.lon.values, precip.sizes['lat'])
        xlon = np.repeat(precip.lat.values, precip.sizes['lon'])
        coords = np.column_stack([xlat, xlon])

        onset = interp_rainy_season(
            onset_data, coords, int(rp['searchDaysO'])
        )
        cessation = interp_rainy_season(
            cessation_data, coords, int(rp['searchDaysC'])
        )
        onset[:, empty_cells] = np.nan
        cessation[:, empty_cells] = np.nan
    else:
        onset = onset_data['days']
        cessation = cessation_data['days']

    start_ons = pd.DatetimeIndex(onset_data['start'])
    end_ons = pd.DatetimeIndex(onset_data['end'])
    start_cess = pd.DatetimeIndex(cessation_data['start'])

    idx_ons, idx_cess = [], []
    for i, (start, end) in enumerate(zip(start_ons, end_ons)):
        matches = np.flatnonzero(
            (start <= start_cess) & (end >= start_cess)
        )
        if matches.size:
            idx_ons.append(i)
            idx_cess.append(int(matches[0]))

    onset = onset[idx_ons]
    cessation = cessation[idx_cess]
    onset_start = start_ons[idx_ons]
    cessation_start = start_cess[idx_cess]

    onset_dates = (
        onset_start.values
        .astype('datetime64[D]')
        .astype(np.int64)[:, None]
    )
    onset_dates = onset + onset_dates
    cessation_dates = (
        cessation_start.values
        .astype('datetime64[D]')
        .astype(np.int64)[:, None]
    )
    cessation_dates = cessation + cessation_dates
    season_length = cessation_dates - onset_dates

    invalid = season_length <= int(rp['numberDaysO'])
    onset[invalid] = np.nan
    cessation[invalid] = np.nan
    season_length[invalid] = np.nan

    shape = (
        len(idx_ons),
        precip.sizes['lat'],
        precip.sizes['lon']
    )
    years = (
        onset_start.year
        .to_numpy(dtype=np.int32)
    )

    onset = onset.reshape(shape).astype('float32')
    cessation = cessation.reshape(shape).astype('float32')
    season_length = season_length.reshape(shape).astype('float32')

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
    params: dict[str, Any]
) -> dict[str, Any]:
    precip = _validate_cube(precip, 'precip')
    rp = _rainy_params(params)
    periods = index_daily_season(
        precip.time.values,
        int(rp['startMonthO']),
        int(rp['startDayO'])
    )
    flat = (
        _as_numpy(precip)
        .reshape(precip.sizes['time'], -1)
    )
    dates = pd.DatetimeIndex(precip.time.values)
    start_dates = periods['range_date'][:, 0]
    rows = []
    for idx, start in zip(periods['index'], start_dates):
        found = get_year_season_onset(
            {'dates': dates[idx], 'data': flat[idx]}, rp
        )
        start_date = pd.Timestamp(start).to_datetime64()
        offsets = (found - start_date) / np.timedelta64(1, 'D')
        valid = ~np.isnan(offsets)
        offsets[valid] -= int(rp['numberDaysO']) - 1
        offsets[valid] = np.maximum(offsets[valid], 0)
        rows.append(np.asarray(offsets, dtype=float))

    return {
        'lon': precip.lon.values,
        'lat': precip.lat.values,
        'days': np.vstack(rows),
        'start': periods['range_date'][:, 0],
        'end': periods['range_date'][:, 1],
    }

def compute_season_cessation(
    wb: xr.DataArray,
    params: dict[str, Any]
) -> dict[str, Any]:
    wb = _validate_cube(wb, 'wb')
    rp = _rainy_params(params)
    periods = index_daily_season(
        wb.time.values,
        int(rp['startMonthC']),
        int(rp['startDayC'])
    )
    flat = _as_numpy(wb).reshape(wb.sizes['time'], -1)
    dates = pd.DatetimeIndex(wb.time.values)
    start_dates = periods['range_date'][:, 0]
    rows = []
    for idx, start in zip(periods['index'], start_dates):
        found = get_year_season_cessation(
            {'dates': dates[idx], 'data': flat[idx]}, rp
        )
        start_date = pd.Timestamp(start).to_datetime64()
        offsets = (found - start_date) / np.timedelta64(1, 'D')
        rows.append(np.asarray(offsets, dtype=float))

    return {
        'lon': wb.lon.values,
        'lat': wb.lat.values,
        'days': np.vstack(rows),
        'start': periods['range_date'][:, 0],
        'end': periods['range_date'][:, 1],
    }

def get_year_season_onset(
    precip_data: dict[str, Any],
    rainyseas_pars: dict[str, Any]
) -> np.ndarray:
    data = np.asarray(precip_data['data'], dtype=float)
    dates = pd.DatetimeIndex(precip_data['dates'])
    init_cols = data.shape[1]
    n = min(int(rainyseas_pars['searchDaysO']), data.shape[0])
    rain = data[:n].copy()
    dates = dates[:n]

    usable = np.mean(np.isnan(rain), axis=0) <= 1 - rainyseas_pars['minFrac']
    result_idx = np.full(init_cols, np.nan)
    use_cols = np.flatnonzero(usable)
    rain = rain[:, usable]
    if rain.shape[1] == 0:
        return _indices_to_dates(result_idx, dates)
    rain[np.isnan(rain)] = 0

    window = int(rainyseas_pars['numberDaysO'])
    cumulative = np.cumsum(rain, axis=0)
    previous = np.vstack(
        [
            np.zeros((window, rain.shape[1])),
            cumulative[:-window]
        ]
    ) if window < n else np.zeros_like(cumulative)
    totals = cumulative - previous
    qualifies = totals >= float(rainyseas_pars['rainTotalO'])
    has_onset = np.any(qualifies, axis=0)
    use_cols = use_cols[has_onset]
    rain = rain[:, has_onset]
    qualifies = qualifies[:, has_onset]
    if qualifies.shape[1] == 0:
        return _indices_to_dates(result_idx, dates)

    first_day = np.all(qualifies, axis=0)
    result_idx[use_cols[first_day]] = 0
    use_cols = use_cols[~first_day]
    rain = rain[:, ~first_day]
    qualifies = qualifies[:, ~first_day]
    rainy = rain >= float(rainyseas_pars['rainThres'])
    for col, target in enumerate(use_cols):
        for pos in np.flatnonzero(qualifies[:, col]):
            future = ~rainy[pos + 1:min(n, pos + 1 + int(rainyseas_pars['drySpellDaysO'])), col]
            if _max_true_run(future) >= int(rainyseas_pars['drySpellO']):
                continue
            back = rainy[max(0, pos - window + 1):pos + 1, col]
            if np.sum(back) >= int(rainyseas_pars['minNbDaysO']):
                result_idx[target] = pos
                break
    return _indices_to_dates(result_idx, dates)

def get_year_season_cessation(
    wb_data: dict[str, Any],
    rainyseas_pars: dict[str, Any]
) -> np.ndarray:
    data = np.asarray(wb_data['data'], dtype=float)
    dates = pd.DatetimeIndex(wb_data['dates'])
    init_cols = data.shape[1]
    n = min(int(rainyseas_pars['searchDaysC']), data.shape[0])
    wb = data[:n]
    dates = dates[:n]

    usable = np.mean(np.isnan(wb), axis=0) <= 1 - rainyseas_pars['minFrac']
    result_idx = np.full(init_cols, np.nan)
    use_cols = np.flatnonzero(usable)
    wb = wb[:, usable]
    if wb.shape[1] == 0:
        return _indices_to_dates(result_idx, dates)

    threshold = float(rainyseas_pars['waterBalanceC']) or 0.01
    below = (wb < threshold) & ~np.isnan(wb)
    for col, target in enumerate(use_cols):
        true_positions = np.flatnonzero(below[:, col])
        if true_positions.size == 0:
            result_idx[target] = n - 1
        elif np.all(below[:, col]):
            result_idx[target] = 0
        else:
            run = int(rainyseas_pars['numberDaysC'])
            starts = np.flatnonzero(
                np.convolve(
                    below[:, col].astype(int),
                    np.ones(run, dtype=int),
                    'valid'
                ) >= run
            )
            result_idx[target] = starts[0] if starts.size else n - 1
    return _indices_to_dates(result_idx, dates)

def _indices_to_dates(
    indices: np.ndarray,
    dates: pd.DatetimeIndex
) -> np.ndarray:
    out = np.full(
        indices.shape,
        np.datetime64('NaT'),
        dtype='datetime64[ns]'
    )
    valid = ~np.isnan(indices)
    if len(dates):
        out[valid] = dates.values[
            indices[valid].astype(int)
        ]
    return out

def _max_true_run(values: np.ndarray) -> int:
    padded = np.r_[False, values, False].astype(np.int8)
    edges = np.flatnonzero(np.diff(padded))
    return int(np.max(edges[1::2] - edges[::2], initial=0))

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
    season_data: dict[str, Any],
    coords: np.ndarray | None = None,
    max_search: int | float = np.inf,
    max_dist: float = 1.5,
) -> np.ndarray:
    values = np.asarray(
        season_data['days'],
        dtype=float
    )
    if coords is None:
        coords = np.column_stack([
            np.tile(
                season_data['lon'],
                len(season_data['lat'])
            ),
            np.repeat(
                season_data['lat'],
                len(season_data['lon'])
            ),
        ])
    coords = np.asarray(coords, dtype=float)
    output = values.copy()
    for i, row in enumerate(values):
        valid = ~np.isnan(row)
        if np.sum(valid) < 5:
            continue
        distance, nearest = (
            cKDTree(coords[valid])
            .query(coords, k=1)
        )
        fill = distance <= max_dist
        predicted = row[valid][nearest]
        output[i, fill] = predicted[fill]
        output[i] = np.clip(output[i], 0, max_search)
    return output
