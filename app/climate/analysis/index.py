from flask import Blueprint, render_template, request, session
from flask import current_app as app
import json
import config

from app.scripts._global import GLOBAL_CONFIG
from app.scripts._cache import (cache_data_functions,
                                hash_params_ts_data)
from app.auth.index import login_required

from .scripts.analysis_sp import climate_analysis_sp_data
from .scripts.analysis_ts import (climate_analysis_ts_rawdata,
                                  climate_analysis_ts_anomaly,
                                  climate_analysis_ts_climato,
                                  climate_analysis_ts_proba,
                                  climate_analysis_ts_season)
from .scripts.analysis_enso import (climate_analysis_enso_alert_dial,
                                    climate_analysis_enso_charts)

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

@climate_analysis.route('/climate_analysis_map', methods=['POST'])
def climate_analysis_map():
    params = request.get_json()
    try:
        map_data = climate_analysis_sp_data(params)
        return json.dumps(map_data)
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})

@climate_analysis.route('/climate_analysis_rawdata', methods=['POST'])
def climate_analysis_rawdata():
    params = request.get_json()
    try:
        return cache_data_functions(
                    climate_analysis_ts_rawdata,
                    hash_params_ts_data,
                    params
                )
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})

@climate_analysis.route('/climate_analysis_anomaly', methods=['POST'])
def climate_analysis_anomaly():
    params = request.get_json()
    try:
        return cache_data_functions(
                    climate_analysis_ts_anomaly,
                    hash_params_ts_data,
                    params
                )
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})

@climate_analysis.route('/climate_analysis_climato', methods=['POST'])
def climate_analysis_climato():
    params = request.get_json()
    try:
        return cache_data_functions(
                    climate_analysis_ts_climato,
                    hash_params_ts_data,
                    params
                )
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})

@climate_analysis.route('/climate_analysis_proba', methods=['POST'])
def climate_analysis_proba():
    params = request.get_json()
    try:
        return cache_data_functions(
                    climate_analysis_ts_proba,
                    hash_params_ts_data,
                    params
                )
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})

@climate_analysis.route('/climate_analysis_season', methods=['POST'])
def climate_analysis_season():
    params = request.get_json()
    try:
        return cache_data_functions(
                    climate_analysis_ts_season,
                    hash_params_ts_data,
                    params
                )
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})

@climate_analysis.route('/climate_analysis_enso_alert', methods=['POST'])
def climate_analysis_enso_alert():
    params = request.get_json()
    try:
        obj = climate_analysis_enso_alert_dial(params)
        return json.dumps(obj)
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})

@climate_analysis.route('/climate_analysis_enso', methods=['POST'])
def climate_analysis_enso():
    params = request.get_json()
    try:
        obj = climate_analysis_enso_charts(params)
        return json.dumps(obj)
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})
