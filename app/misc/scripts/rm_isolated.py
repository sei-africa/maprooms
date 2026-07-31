from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import numpy as np
from scipy import ndimage

try:
    import dask.array as da
except ImportError:
    # Keep the NumPy implementation usable without Dask.
    da = None

## See also
# from skimage.morphology import remove_small_objects
# remove_small_objects(grid, max_size=2, connectivity=3)

def remove_isolated_pixels(
    grid: np.ndarray,
    max_size: int = 2,
    majority: float = 0.75,
    connectivity: int = 8,
    ignore_nan: bool = True
) -> np.ndarray:
    """
    Replace isolated components containing at most `max_size` cells.

    A component is replaced when more than `majority` of its surrounding
    valid cells have the same value, different from the component value.
    """
    result = np.asarray(grid, dtype=float).copy()
    structure = (
        np.ones((3, 3), dtype=bool) if connectivity == 8
        else ndimage.generate_binary_structure(2, 1)
    )
    source = result.copy()
    replacements = []
    values = np.unique(source[~np.isnan(source)])

    for value in values:
        labels, number = ndimage.label(
            source == value, structure=structure
        )
        if number == 0:
            continue

        component_sizes = np.bincount(labels.ravel())
        component_slices = ndimage.find_objects(labels)

        for label_id, component_slice in enumerate(
            component_slices, start=1
        ):
            if (
                component_slice is None
                or component_sizes[label_id] > max_size
            ):
                continue

            region = tuple(
                slice(max(0, axis_slice.start - 1), min(
                    source.shape[axis], axis_slice.stop + 1
                ))
                for axis, axis_slice in enumerate(component_slice)
            )
            local_labels = labels[region]
            component = local_labels == label_id
            boundary = (
                ndimage.binary_dilation(
                    component, structure=structure
                )
                & ~component
            )

            neighbours = source[region][boundary]

            if ignore_nan:
                neighbours = neighbours[~np.isnan(neighbours)]

            if neighbours.size == 0:
                continue

            neighbour_values, counts = np.unique(
                neighbours, return_counts=True
            )
            dominant_index = np.argmax(counts)
            dominant_value = neighbour_values[dominant_index]
            dominant_fraction = counts[dominant_index] / neighbours.size

            if (
                dominant_value != value
                and dominant_fraction > majority
            ):
                replacements.append((region, component, dominant_value))

    for region, component, replacement_value in replacements:
        result[region][component] = replacement_value

    return result

def _remove_isolated_block(
    block: np.ndarray,
    kwargs: dict[str, Any]
) -> np.ndarray:
    return np.stack([
        remove_isolated_pixels(layer, **kwargs)
        for layer in block
    ]).astype(block.dtype, copy=False)

def remove_isolated_pixels_3d(
    array: Any,
    workers: int | None = None,
    **kwargs: Any
) -> Any:
    """
    Process an array shaped (layers, rows, columns), treating each
    (rows, columns) plane independently.
    """
    if array.ndim != 3:
        raise ValueError(
            'Expected an array shaped (layers, rows, columns)'
        )

    if da is not None and isinstance(array, da.Array):
        chunked = array.rechunk({1: -1, 2: -1})
        chunked = chunked.rechunk({0: 1})
        return chunked.map_blocks(
            _remove_isolated_block,
            kwargs=kwargs,
            dtype=array.dtype,
        )

    values = np.asarray(array)
    layer_count = values.shape[0]
    if layer_count == 0:
        return values.copy()

    if workers is None:
        workers = min(layer_count, os.cpu_count() or 1)
    if workers < 1:
        raise ValueError('workers must be at least 1')

    if workers == 1 or layer_count == 1:
        output = [
            remove_isolated_pixels(layer, **kwargs)
            for layer in values
        ]
    else:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            output = list(executor.map(
                lambda layer: remove_isolated_pixels(layer, **kwargs),
                values,
            ))

    return np.stack(output).astype(values.dtype, copy=False)
