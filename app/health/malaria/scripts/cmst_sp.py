
import calendar

import numpy as np

from app.scripts.colorbar import check_invalid_colors
from app.scripts.imagepng import create_imagePng

from .cmst_data import (
    _integer,
    get_cmst_fields,
)

from .cmst import (
    CMST_PRODUCTS,
    get_cmst_text,
)

def get_health_cmst_sp_data(params):
    product = params.get(
        'cmstProduct', 'Annual_Sum'
    )

    if product not in CMST_PRODUCTS:
        raise ValueError('Unknown CMST product.')

    text = get_cmst_text()

    fields = get_cmst_fields(params)
    field = fields[product]

    period = (
        f"{int(params['startYear'])}"
        f"–{int(params['endYear'])}"
    )

    if product == 'Annual_Sum':
        units = text['cmst_units']['months']

    else:
        month = _integer(
            params, 'climDate', 1, 12
        )

        field = field.sel(
            month=month,
            drop=True,
        )

        period = (
            f'{calendar.month_abbr[month]}; {period}'
        )

        units = '%'

    field = field.transpose('lat', 'lon')
    values = np.asarray(field.values, dtype=float)

    if not np.isfinite(values).any():
        raise ValueError(
            'No valid CMST values for this product '
            'and reference period.'
        )

    return {
        'status': 0,
        'lon': field.lon.values,
        'lat': field.lat.values,
        'data': values,
        'varid': product,
        'longname': text['cmst_modes'][product],
        'units': units,
        'date': period,
    }


def health_cmst_sp_data(params):
    check = check_invalid_colors(
        params['colorbar']
    )

    if check['status'] == -1:
        return check

    data = get_health_cmst_sp_data(params)

    if data['status'] == -1:
        return data

    colorbar = params['colorbar']
    breaks = colorbar['break_cbar']

    if data['varid'] == 'Annual_Sum':
        breaks = [
            number - 0.5
            for number in range(14)
        ]

    elif breaks is None:
        breaks = list(range(0, 101, 10))
    color_args = {
        'breaks': breaks,
        'colors_ext': (
            list(colorbar['color_ext'])
            if colorbar['color_ext'] is not None
            else None
        ),
    }

    if colorbar['color_type'] == 'preset':
        color_args['color_name'] = (
            colorbar['color_cbar']
        )
    else:
        color_args['colors'] = (
            colorbar['color_cbar']
        )

    map_png = create_imagePng(
        data,
        **color_args,
    )

    if map_png is None:
        return {
            'status': -1,
            'message': 'Unable to render the CMST map.',
        }

    map_png['date'] = data['date']

    map_png['ckeys']['title'] = (
        f"{data['longname']} ({data['units']})"
    )

    if data['varid'] == 'Annual_Sum':
        map_png['ckeys']['categories'] = [
            {
                'label': str(month),
                'range': '',
                'color': map_png['ckeys']['colors'][month + 1],
            }
            for month in range(13)
        ]

    return {
        'status': 0,
        'data': map_png,
    }

    