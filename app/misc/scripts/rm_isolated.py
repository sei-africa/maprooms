from __future__ import annotations

import numpy as np
from scipy import ndimage

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
    values = np.unique(result[~np.isnan(result)])

    source = result.copy()
    replacements = []

    for value in values:
        labels, number = ndimage.label(
            source == value, structure=structure
        )

        for label_id in range(1, number + 1):
            component = labels == label_id
            component_size = np.count_nonzero(component)

            if component_size > max_size:
                continue

            boundary = (
                ndimage.binary_dilation(
                    component, structure=structure
                )
                & ~component
            )

            neighbours = source[boundary]

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
                replacements.append((component, dominant_value))

    for component, replacement_value in replacements:
        result[component] = replacement_value

    return result

def remove_isolated_pixels_3d(array: np.ndarray, **kwargs) -> np.ndarray:
    """
    Process an array shaped (layers, rows, columns), treating each
    (rows, columns) plane independently.
    """
    array = np.asarray(array)

    if array.ndim != 3:
        raise ValueError(
            'Expected an array shaped (layers, rows, columns)'
        )

    return np.stack([
        remove_isolated_pixels(layer, **kwargs)
        for layer in array
    ]).astype(array.dtype, copy=False)
