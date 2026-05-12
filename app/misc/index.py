from flask import Blueprint, request
from flask import current_app as app
import json
import os
from app.scripts._colors import COLORS_MAPROOM
from app.scripts.subdivision import get_subdivisions_data
from app.scripts.colorbar import matplotlib_invalid_colors
from app.scripts.imagepng import raster_colorbar_imagePng

misc = Blueprint('misc', __name__)

@misc.route('/map_subdivisions_data')
def map_subdivisions_data():
    sub_data = get_subdivisions_data()
    return json.dumps(sub_data)

@misc.route('/maproom_colors')
def maproom_colors():
    return json.dumps(COLORS_MAPROOM)

@misc.route('/preview_user_colobar', methods=['POST'])
def preview_user_colobar():
    params = request.get_json()
    user_col = matplotlib_invalid_colors(
        params['color_cbar']
    )
    if user_col is not None:
        return json.dumps(
                {
                    'status': -1,
                    'colors': user_col
                }
            )

    cbar_png = raster_colorbar_imagePng(
        params['color_cbar']
    )
    return json.dumps(
            {
                'status': 0,
                'colors': cbar_png
            }
        )

