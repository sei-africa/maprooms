from flask import Blueprint, render_template, request, session
from flask import current_app as app
import json
import config

# from app.scripts._global import GLOBAL_CONFIG
# from app.scripts._cache import (cache_data_functions,
#                                 hash_params_ts_data)

from app.auth.index import login_required

water_analysis = Blueprint(
    'water_analysis',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/water_analysis',
)

dataUser = dict()
@water_analysis.before_request
def before_request():
    global dataUser
    if 'logged_in' not in session:
        dataUser = {'uid': -1}
    else:
        if session['logged_in']:
            dataUser = session['data']
        else:
            dataUser = {'uid': -1}
