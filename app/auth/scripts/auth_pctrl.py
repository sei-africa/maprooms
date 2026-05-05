import os
import config
from app.scripts._global import GLOBAL_CONFIG
from app.scripts.util import load_yaml_file
from app.scripts.maproom_items import pasre_lang_yaml_nested4

def page_control_musers():
    dir_app = GLOBAL_CONFIG['app_dir']
    dir_yaml = os.path.join(dir_app, 'auth', 'yaml')
    yaml_file = os.path.join(dir_yaml, 'user-creation.yaml')
    yaml_tmp = load_yaml_file(yaml_file)
    page_contorl = pasre_lang_yaml_nested4(yaml_tmp)
    extract_file = os.path.join(dir_yaml, 'extraction-support.yaml')
    extract_tmp = load_yaml_file(extract_file)
    page_contorl.update(pasre_lang_yaml_nested4(extract_tmp))
    analysis_file = os.path.join(dir_yaml, 'download-analysis.yaml')
    analysis = load_yaml_file(analysis_file)
    page_contorl.update(pasre_lang_yaml_nested4(analysis))
    return page_contorl

def auth_message_text():
    dir_app = GLOBAL_CONFIG['app_dir']
    dir_yaml = os.path.join(dir_app, 'auth', 'yaml')
    py_file = os.path.join(dir_yaml, 'py-text.yaml')
    tmp = load_yaml_file(py_file)
    return pasre_lang_yaml_nested4(tmp)

def _get_admin_datauser():
    if not os.path.exists(config.INIT_ADMIN):
        msg = 'Admin yaml file not found.'
        return {'status': -1, 'message': msg}
    admin = load_yaml_file(config.INIT_ADMIN)
    admin['role'] = 'admin'
    admin['access'] = 'all'
    admin['expiry'] = '2100-01-01'
    pgc = page_control_musers()
    admin['extract'] = list(pgc['extraction_support'].keys())
    admin['analysis'] = list(pgc['analysis'].keys())
    return {'status': 0, 'user': admin}

def _create_maproom_datauser():
    user = _get_admin_datauser()['user']
    user['role'] = 'user'
    user['username'] = 'maproom'
    user['fullname'] = 'Maproom'
    return user
