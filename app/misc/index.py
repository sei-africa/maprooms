from flask import Blueprint, request
from flask import current_app as app
import json
import os
from matplotlib.colors import is_color_like
from app.scripts._colors import COLORS_MAPROOM
from app.scripts.subdivision import get_subdivisions_data
from app.dst_api.scripts import format_get_request

misc = Blueprint('misc', __name__)

@misc.route('/map_subdivisions_data')
def map_subdivisions_data():
    sub_data = get_subdivisions_data()
    return json.dumps(sub_data)

@misc.route('/maproom_colors')
def maproom_colors():
    return json.dumps(COLORS_MAPROOM)

@misc.route('/check_colobar_colors')
def check_colobar_colors():
    # params = format_get_request(request.args)
    params = request.args
    # print(params)
    # is_color_like('blue')
    return json.dumps(COLORS_MAPROOM)
