from flask import Blueprint, render_template, request, session
from flask import current_app as app
import config

agri_historical = Blueprint(
    'agri_historical',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/static/agri_historical',
)

dataUser = dict()
@agri_historical.before_request
def before_request():
    global dataUser
    if 'logged_in' not in session:
        dataUser = {'uid': -1}
    else:
        if session['logged_in']:
            dataUser = session['data']
        else:
            dataUser = {'uid': -1}
