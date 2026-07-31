from __future__ import annotations
import numpy as np
from numpy.typing import ArrayLike, NDArray

def rollfun_wrapper(
    x: ArrayLike,
    win: int,
    fun: str = 'sum',
    na_rm: bool = False,
    min_data: int | None = None,
    na_pad: bool = True,
    fill: bool = False,
    align: str = 'right',
) -> NDArray[np.float64] | None:
    """
    Apply a rolling function to a vector or matrix.

    Parameters
    ----------
    x
        One-dimensional vector or two-dimensional matrix.

    win
        Rolling-window size.

    fun
        Rolling function.

        For a vector:
            'sum', 'mean', 'median', 'var', 'sd',
            'max', 'min', or 'convolve'.

        For a matrix:
            'sum', 'mean', 'median', 'var', 'sd',
            'max', or 'min'.

    na_rm
        If True, ignore NaN values during calculation.

    min_data
        Minimum number of valid values required in each window.
        When None, it defaults to ``win``.

    na_pad
        If True, pad the result to match the original length or
        number of rows.

    fill
        If True, use the first or last calculated value for padding.
        Otherwise, pad with NaN.

    align
        Rolling alignment: 'center', 'left', or 'right'.

    Returns
    -------
    numpy.ndarray or None
        Rolling result. Returns None when ``x`` is neither a vector nor
        a matrix.
    """
    x = np.asarray(x, dtype=np.float64)

    if min_data is None:
        min_data = win

    min_data = min(min_data, win)

    if align not in {'center', 'left', 'right'}:
        raise ValueError(
            "'align' must be 'center', 'left', or 'right'."
        )

    if x.ndim == 2:
        return rollfun_mat(
            x=x,
            win=win,
            fun=fun,
            na_rm=na_rm,
            min_data=min_data,
            na_pad=na_pad,
            fill=fill,
            align=align
        )

    if x.ndim == 1:
        return rollfun_vec(
            x=x,
            win=win,
            fun=fun,
            na_rm=na_rm,
            min_data=min_data,
            na_pad=na_pad,
            fill=fill,
            align=align
        )

    return None

def rollfun_vec(
    x: ArrayLike,
    win: int,
    fun: str,
    na_rm: bool = False,
    min_data: int = 1,
    na_pad: bool = True,
    fill: bool = False,
    align: str = 'right'
) -> NDArray[np.float64]:
    """
    Apply a rolling function to a one-dimensional numeric array.

    Parameters
    ----------
    x
        One-dimensional array of numeric values.

    win
        Rolling-window size.

    fun
        Rolling function. Supported values are:

        - 'sum'
        - 'mean'
        - 'median'
        - 'max'
        - 'min'
        - 'var'
        - 'sd'
        - 'convolve'

    na_rm
        If True, ignore NaN values when calculating the rolling statistic.
        If False, a window containing NaN generally returns NaN.

    min_data
        Minimum number of non-NaN values required in a window.

    na_pad
        If True, pad the output so that it has the same length as ``x``.

    fill
        When padding, use the first or last calculated rolling value instead
        of NaN.

    align
        Position of the rolling result relative to the input. Supported values:

        - 'right'
        - 'left'
        - 'center'

    Returns
    -------
    numpy.ndarray
        Array containing the rolling statistic.
    """
    x = np.asarray(x, dtype=float)

    if x.ndim != 1:
        raise ValueError("'x' must be a one-dimensional array.")

    if not isinstance(win, (int, np.integer)) or win < 1:
        raise ValueError("'win' must be a positive integer.")

    if win > x.size:
        raise ValueError(
            "'win' cannot be larger than the length of 'x'."
        )

    if min_data < 0 or min_data > win:
        raise ValueError(
            "'min_data' must be between 0 and 'win'."
        )

    valid_functions = {
        'sum', 'mean', 'median', 'max', 'min', 'var', 'sd', 'convolve'
    }

    if fun not in valid_functions:
        raise ValueError(
            f'Unsupported function {fun!r}. '
            f'Choose one of {sorted(valid_functions)}.'
        )

    if align not in {'right', 'left', 'center'}:
        raise ValueError(
            "'align' must be 'right', 'left', or 'center'."
        )

    n_windows = x.size - win + 1
    values = np.full(n_windows, np.nan, dtype=float)
    valid_counts = np.zeros(n_windows, dtype=int)

    for k in range(n_windows):
        window = x[k:k + win]

        valid_counts[k] = np.count_nonzero(~np.isnan(window))

        if fun == 'convolve':
            valid_window = window[~np.isnan(window)]
            if valid_window.size > 1:
                values[k] = np.mean(valid_window)
            else:
                values[k] = np.nan

            continue

        if not na_rm and np.isnan(window).any():
            values[k] = np.nan
            continue

        valid_window = window[~np.isnan(window)] if na_rm else window

        if valid_window.size == 0:
            values[k] = np.nan
            continue

        if fun == 'sum':
            values[k] = np.sum(valid_window)
        elif fun == 'mean':
            values[k] = np.mean(valid_window)
        elif fun == 'median':
            values[k] = np.median(valid_window)
        elif fun == 'max':
            values[k] = np.max(valid_window)
        elif fun == 'min':
            values[k] = np.min(valid_window)
        elif fun == 'var':
            values[k] = (
                np.var(valid_window, ddof=1)
                if valid_window.size > 1
                else np.nan
            )
        elif fun == 'sd':
            values[k] = (
                np.std(valid_window, ddof=1)
                if valid_window.size > 1
                else np.nan
            )

    values[~np.isfinite(values)] = np.nan
    values[valid_counts < min_data] = np.nan

    if not na_pad:
        return values

    pad_size = win - 1

    if align == 'right':
        pad_value = values[0] if fill else np.nan
        values = np.concatenate([
            np.full(pad_size, pad_value),
            values,
        ])
    elif align == 'left':
        pad_value = values[-1] if fill else np.nan
        values = np.concatenate([
            values,
            np.full(pad_size, pad_value),
        ])
    else:
        before = (win - 1) // 2
        after = int(np.ceil((win - 1) / 2))
        left_value = values[0] if fill else np.nan
        right_value = values[-1] if fill else np.nan
        values = np.concatenate([
            np.full(before, left_value),
            values,
            np.full(after, right_value),
        ])

    return values

def rollfun_mat(
    x: ArrayLike,
    win: int,
    fun: str,
    na_rm: bool = False,
    min_data: int = 1,
    na_pad: bool = True,
    fill: bool = False,
    align: str = 'right'
) -> NDArray[np.float64]:
    """
    Apply a rolling statistic along the rows of a 2-D matrix.

    Parameters
    ----------
    x
        Numeric matrix with shape ``(nrows, ncols)``.

    win
        Rolling-window length along the row dimension.

    fun
        Rolling function. Supported values are:

        - 'sum'
        - 'mean'
        - 'median'
        - 'max'
        - 'min'
        - 'var'
        - 'sd'

    na_rm
        If True, ignore NaN values when calculating each statistic.
        If False, a window containing a NaN returns NaN for that column.

    min_data
        Minimum number of non-NaN values required in each window and column.

    na_pad
        If True, pad the result to the same number of rows as ``x``.

    fill
        If True, use the first or last calculated row for padding.
        If False, pad with NaN.

    align
        Rolling-window alignment:

        - 'right'
        - 'left'
        - 'center'

    Returns
    -------
    numpy.ndarray
        Matrix containing the rolling statistic.

        When ``na_pad=True``, the output has the same shape as ``x``.
        Otherwise, its shape is ``(nrows - win + 1, ncols)``.
    """
    x = np.asarray(x, dtype=np.float64)

    if x.ndim != 2:
        raise ValueError(
            f"'x' must be a 2-D matrix. Received shape {x.shape}."
        )

    if not isinstance(win, (int, np.integer)) or win < 1:
        raise ValueError("'win' must be a positive integer.")

    nrows, ncols = x.shape

    if win > nrows:
        raise ValueError(
            f"'win' ({win}) cannot exceed the number of rows ({nrows})."
        )

    valid_functions = {
        'sum', 'mean', 'median', 'max', 'min', 'var', 'sd'
    }

    if fun not in valid_functions:
        raise ValueError(
            f"Unsupported function {fun!r}. "
            f"Choose one of {sorted(valid_functions)}."
        )

    if not isinstance(min_data, (int, np.integer)):
        raise TypeError("'min_data' must be an integer.")

    if min_data < 0 or min_data > win:
        raise ValueError(
            f"'min_data' must be between 0 and win={win}."
        )

    if align not in {'right', 'left', 'center'}:
        raise ValueError(
            "'align' must be 'right', 'left', or 'center'."
        )

    n_windows = nrows - win + 1

    result = np.full(
        (n_windows, ncols), np.nan, dtype=np.float64
    )

    valid_counts = np.zeros(
        (n_windows, ncols), dtype=np.int64
    )

    for k in range(n_windows):
        window = x[k : k + win, :]
        valid_counts[k, :] = np.sum(
            ~np.isnan(window), axis=0
        )
        with np.errstate(
            invalid='ignore',
            divide='ignore',
            all='ignore'
        ):
            if na_rm:
                if fun == 'sum':
                    result[k, :] = np.nansum(window, axis=0)
                elif fun == 'mean':
                    result[k, :] = np.nanmean(window, axis=0)
                elif fun == 'median':
                    result[k, :] = np.nanmedian(window, axis=0)
                elif fun == 'max':
                    result[k, :] = _nanmax_r_style(window)
                elif fun == 'min':
                    result[k, :] = _nanmin_r_style(window)
                elif fun == 'var':
                    result[k, :] = np.nanvar(
                        window, axis=0, ddof=1
                    )
                elif fun == 'sd':
                    result[k, :] = np.nanstd(
                        window, axis=0, ddof=1
                    )
            else:
                if fun == 'sum':
                    result[k, :] = np.sum(window, axis=0)
                elif fun == 'mean':
                    result[k, :] = np.mean(window, axis=0)
                elif fun == 'median':
                    result[k, :] = np.median(window, axis=0)
                elif fun == 'max':
                    result[k, :] = np.max(window, axis=0)
                elif fun == 'min':
                    result[k, :] = np.min(window, axis=0)
                elif fun == 'var':
                    result[k, :] = np.var(
                        window, axis=0, ddof=1
                    )
                elif fun == 'sd':
                    result[k, :] = np.std(
                        window, axis=0, ddof=1
                    )

    result[~np.isfinite(result)] = np.nan
    result[valid_counts < min_data] = np.nan

    if not na_pad:
        return result

    padding_rows = win - 1

    if align == 'right':
        if fill:
            padding = np.repeat(
                result[[0], :], padding_rows, axis=0
            )
        else:
            padding = np.full(
                (padding_rows, ncols), np.nan
            )

        result = np.vstack((padding, result))
    elif align == 'left':
        if fill:
            padding = np.repeat(
                result[[-1], :], padding_rows, axis=0
            )
        else:
            padding = np.full(
                (padding_rows, ncols), np.nan
            )

        result = np.vstack((result, padding))
    else:
        before = (win - 1) // 2
        after = int(np.ceil((win - 1) / 2))

        if fill:
            before_padding = np.repeat(
                result[[0], :], before, axis=0
            )
            after_padding = np.repeat(
                result[[-1], :], after, axis=0
            )
        else:
            before_padding = np.full(
                (before, ncols), np.nan
            )
            after_padding = np.full(
                (after, ncols), np.nan
            )

        result = np.vstack((
            before_padding,
            result,
            after_padding
        ))
    return result

def _nanmax_r_style(x: np.ndarray) -> np.ndarray:
    """
    Column maximum while reproducing the useful behavior of R
    max(..., na.rm=TRUE), followed by conversion of infinities to NaN.
    """
    valid = ~np.isnan(x)
    output = np.full(x.shape[1], -np.inf, dtype=np.float64)

    columns_with_data = np.any(valid, axis=0)

    if np.any(columns_with_data):
        output[columns_with_data] = np.nanmax(
            x[:, columns_with_data], axis=0
        )
    return output


def _nanmin_r_style(x: np.ndarray) -> np.ndarray:
    """
    Column minimum while reproducing the useful behavior of R
    min(..., na.rm=TRUE), followed by conversion of infinities to NaN.
    """
    valid = ~np.isnan(x)
    output = np.full(x.shape[1], np.inf, dtype=np.float64)

    columns_with_data = np.any(valid, axis=0)

    if np.any(columns_with_data):
        output[columns_with_data] = np.nanmin(
            x[:, columns_with_data], axis=0
        )
    return output
