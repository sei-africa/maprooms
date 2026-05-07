from flask import Blueprint, render_template, request, session
from flask import current_app as app
import json
import config

from app.scripts._global import GLOBAL_CONFIG
from app.scripts._cache import (cache_data_functions,
                                hash_params_monthly_ts)
from app.auth.index import login_required
from .scripts.monthly import (get_spatial_monthly_data, 
                              get_rawdata_monthly_ts,
                              get_anomaly_monthly_ts,
                              get_climato_monthly_ts)

climate_analysis = Blueprint(
    'climate_analysis',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/climate_analysis',
)

dataUser = dict()
@climate_analysis.before_request
def before_request():
    global dataUser
    if 'logged_in' not in session:
        dataUser = {'uid': -1}
    else:
        if session['logged_in']:
            dataUser = session['data']
        else:
            dataUser = {'uid': -1}

@climate_analysis.route('/monthly_map', methods=['POST'])
def monthly_map():
    params = request.get_json()
    try:
        # print('----------- monthly_map -----------')
        # print(params)
        map_data = get_spatial_monthly_data(params)
        return json.dumps(map_data)
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})

#####################

@climate_analysis.route('/charts_monthly_rawdata', methods=['POST'])
def charts_monthly_rawdata():
    params = request.get_json()
    try:
        # print('----------- charts_monthly_rawdata -----------')
        # print(params)
        return cache_data_functions(
                    get_rawdata_monthly_ts,
                    hash_params_monthly_ts,
                    params
                )
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})

@climate_analysis.route('/charts_monthly_anomaly', methods=['POST'])
def charts_monthly_anomaly():
    params = request.get_json()
    try:
        # print('----------- charts_monthly_anomaly -----------')
        # print(params)
        return cache_data_functions(
                    get_anomaly_monthly_ts,
                    hash_params_monthly_ts,
                    params
                )
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})

@climate_analysis.route('/charts_monthly_climato', methods=['POST'])
def charts_monthly_climato():
    params = request.get_json()
    try:
        # print('----------- charts_monthly_climato -----------')
        # print(params)
        return cache_data_functions(
                    get_climato_monthly_ts,
                    hash_params_monthly_ts,
                    params
                )
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})
