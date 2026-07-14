from flask import Blueprint, render_template, request, session
from flask import current_app as app
import json
import config

agriculture_analysis = Blueprint(
    'agriculture_analysis',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/agriculture_analysis',
)

dataUser = dict()
@agriculture_analysis.before_request
def before_request():
    global dataUser
    if 'logged_in' not in session:
        dataUser = {'uid': -1}
    else:
        if session['logged_in']:
            dataUser = session['data']
        else:
            dataUser = {'uid': -1}

@agriculture_analysis.route('/agriculture_analysis_map', methods=['POST'])
def agriculture_analysis_map():
    params = request.get_json()
    try:
        # map_data = climate_analysis_sp_data(params)
        map_data = {'status': -1, 'message': 'test agriculture'}
        return json.dumps(map_data)
    except Exception as e:
        return json.dumps({'status': -1, 'message': str(e)})
