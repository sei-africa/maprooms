from flask import (Flask, render_template,
                   g, flash, session, request)
import json
from flask_cors import CORS
from flask_jsglue import JSGlue

app = Flask(__name__, instance_relative_config=False)
app.config.from_object('config')
CORS(app)
jsglue = JSGlue(app)

####
from app.auth.index import auth
from app.dst_api.index import dst_api

from app.climate.analysis.index import climate_analysis
from app.climate.monitoring.index import climate_monitoring
from app.climate.forecast.index import climate_forecast
from app.climate.projection.index import climate_projection

from app.agriculture.historical.index import agri_historical

from app.health.index import health
from app.drm.index import drm

from app.water.analysis.index import water_analysis
from app.water.monitoring.index import water_monitoring
from app.water.forecast.index import water_forecast
from app.water.projection.index import water_projection

app.register_blueprint(auth)
app.register_blueprint(dst_api)

app.register_blueprint(climate_analysis)
app.register_blueprint(climate_monitoring)
app.register_blueprint(climate_forecast)
app.register_blueprint(climate_projection)

app.register_blueprint(agri_historical)

app.register_blueprint(health)
app.register_blueprint(drm)

app.register_blueprint(water_analysis)
app.register_blueprint(water_monitoring)
app.register_blueprint(water_forecast)
app.register_blueprint(water_projection)

####
import config
from app.scripts._global import (GLOBAL_CONFIG,
                                 selected_language,
                                 set_navbar_path)
from app.scripts.maproom_items import (load_maproom_items,
                                       load_navigation_items,
                                       load_maproom_page_text,
                                       data_info_coverage)
from app.scripts.subdivision import get_subdivisions_data
from app.scripts._colors import COLORS_MAPROOM
from app.scripts._cache import cache
cache.init_app(app)

from app.auth.scripts.sqlite import initUsersTable
try:
    ret = initUsersTable()
    if ret['status'] == -1:
        flash(ret['message'], 'error')
except Exception as e:
    flash(str(e), 'error')

@app.before_request
def before_request():
    g.dataInfoCoverage = data_info_coverage()

    if 'logged_in' not in session:
        g.dataUser = {'uid': -1}
    else:
        if session['logged_in']:
            g.dataUser = session['data']
        else:
            g.dataUser = {'uid': -1}

def render_template_main(nav_path):
    mapItems = load_maproom_items(nav_path)
    mapNav = load_navigation_items(nav_path)
    pageText = load_maproom_page_text(nav_path, 'main')
    return render_template('main.html',
                           error_login=False,
                           dataUser=g.dataUser,
                           langUser=GLOBAL_CONFIG['language'],
                           metInfo=GLOBAL_CONFIG['metInfo'],
                           dataInfo=g.dataInfoCoverage,
                           mapItems=mapItems,
                           mapNav=mapNav,
                           pageText=pageText,
                           pageType='main')

# def render_template_page(cm):
def render_template_page(tm, cm):
    nav_path = set_navbar_path(cm, 'file')
    print('---------------------')
    print(nav_path)
    print('---------------------')
    mapNav = load_navigation_items(nav_path)
    print('---------------------')
    print(mapNav)
    print('---------------------')
    pageText = load_maproom_page_text(nav_path, 'page')
    # return render_template(f'{cm}.html',
    return render_template(f'{tm}/{cm}.html',
                           dataUser=g.dataUser,
                           langUser=GLOBAL_CONFIG['language'],
                           metInfo=GLOBAL_CONFIG['metInfo'],
                           dataInfo=g.dataInfoCoverage,
                           mapNav=mapNav,
                           pageText=pageText,
                           pageType='page')

@app.route('/')
def homepage():
    accept_lang = request.accept_languages
    lang_code = accept_lang.best_match(config.LANGUAGES_CODE)
    selected_language(lang_code)
    metInfoName = GLOBAL_CONFIG['metInfo']['metServiceLongname']
    flash(f'Welcome to {metInfoName} maprooms', 'info')
    return render_template_main(None)

@app.route('/set_languages_main')
def set_languages_main():
    lang_code = request.args.get('lang_code')
    selected_language(lang_code)
    return render_template_main(GLOBAL_CONFIG['current_path'])

@app.route('/set_languages_page')
def set_languages_page():
    lang_code = request.args.get('lang_code')
    selected_language(lang_code)
    tm = GLOBAL_CONFIG['current_path'][-2]
    cm = GLOBAL_CONFIG['current_path'][-1]
    return render_template_page(tm, cm)
    # return render_template_page(GLOBAL_CONFIG['current_path'][-1])

@app.route('/maproom_items')
def maproom_items():
    cm = request.args.get('component')
    nav_path = set_navbar_path(cm, 'directory')
    return render_template_main(nav_path)

@app.route('/maproom_pages')
def maproom_pages():
    tm = request.args.get('template')
    cm = request.args.get('component')
    return render_template_page(tm, cm)
    # return render_template_page(cm)

@app.route('/get_flashes')
def get_flashes():
    return render_template('flashes.html')

@app.route('/unknown_page')
def unknown_page():
    return render_template('unknown-page.html')

@app.route('/map_subdivisions_data')
def map_subdivisions_data():
    sub_data = get_subdivisions_data()
    return json.dumps(sub_data)

@app.route('/maproom_colors')
def maproom_colors():
    return json.dumps(COLORS_MAPROOM)

