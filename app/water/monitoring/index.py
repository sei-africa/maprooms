from flask import Blueprint, render_template, request, session
from flask import current_app as app
import config

water_monitoring = Blueprint(
    'water_monitoring',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/water_monitoring',
)

dataUser = dict()
@water_monitoring.before_request
def before_request():
    global dataUser
    if 'logged_in' not in session:
        dataUser = {'uid': -1}
    else:
        if session['logged_in']:
            dataUser = session['data']
        else:
            dataUser = {'uid': -1}
