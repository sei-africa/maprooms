import os
import config
from .util import load_yaml_file, list_yaml_maproom_items, remove_duplicates_list

GLOBAL_CONFIG = {}
scripts_dir = os.path.dirname(os.path.realpath(__file__))
app_dir = os.path.dirname(scripts_dir)
GLOBAL_CONFIG['app_dir'] = app_dir

GLOBAL_CONFIG['data_dir'] = config.MAPROOMS_DIR
GLOBAL_CONFIG['app_cache'] = os.path.join(config.MAPROOMS_DIR, 'app_cache')
GLOBAL_CONFIG['users_data'] = os.path.join(config.MAPROOMS_DIR, 'users_data')
GLOBAL_CONFIG['shp_dir'] = os.path.join(config.MAPROOMS_DIR, 'shp')

yaml_dir = os.path.join(app_dir, 'yaml')
met_file = os.path.join(yaml_dir, 'nmhs-info.yaml')
GLOBAL_CONFIG['metInfo'] = load_yaml_file(met_file)

config_data_file = os.path.join(yaml_dir, 'datasets-config.yaml')
GLOBAL_CONFIG.update(load_yaml_file(config_data_file))

GLOBAL_CONFIG['blank_icon'] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

GLOBAL_CONFIG['language'] = {}
langs = {'code': config.LANGUAGES_CODE,
         'name': config.LANGUAGES_NAME,
         'label': config.LANGUAGES_LABEL,
         'locale': config.LANGUAGES_LOCALE}
GLOBAL_CONFIG['language']['code'] = langs['code'][0]

maproom_lang = []
for j in range(len(langs['code'])):
    tmp = {'code': langs['code'][j],
           'name': langs['name'][j],
           'label': langs['label'][j],
           'locale': langs['locale'][j]}
    maproom_lang = maproom_lang + [tmp]

GLOBAL_CONFIG['language']['list'] = maproom_lang

selected_lang = {'code': langs['code'][0],
                 'name': langs['name'][0],
                 'label': langs['label'][0]}
GLOBAL_CONFIG['language']['selected'] = selected_lang

def get_navigation_items():
    app_dir = GLOBAL_CONFIG['app_dir']
    file = 'maproom_items.yaml'
    yaml_paths = list_yaml_maproom_items(app_dir, file)
    nav_title = []
    page_title = []
    nav_path = []

    for path in yaml_paths:
        p_s = os.path.join(*path)
        p_y = os.path.join(app_dir, p_s)
        yaml_file = os.path.join(p_y, file)
        tmp = load_yaml_file(yaml_file)
        nav_title += [tmp['title']]
        if tmp['type'] == 'navigation-page':
            tmp_page = []
            for cm in tmp['maprooms']:
                page = list(cm.keys())[0]
                title = cm[page]['title']
                tmp_page += [[page, title]]
            page_title += [tmp_page]
        else:
            page_title += [None]

        pth = path[:-1]
        if len(pth) == 0:
            pth = None
        nav_path += [pth]

    nav_title_out = []
    nav_path_out = []
    for i in range(len(nav_path)):
        # if nav_path[i] is None:
        if i == 0:
            nav_title_out += [[nav_title[i]]]
            nav_path_out += [nav_path[i]]
        else:
            if len(nav_path[i]) == 1:
                tmp_title = [nav_title[0], nav_title[i]]
                tmp_path = nav_path[i]
            else:
                for j in range(len(nav_path)):
                    if nav_path[j] == [nav_path[i][0]]:
                        prev_title = nav_title[j]
                tmp_title = [nav_title[0], prev_title, nav_title[i]]
                tmp_path = nav_path[i]

            nav_title_out += [tmp_title]
            nav_path_out += [tmp_path]
            if not page_title[i] is None:
                for j in range(len(page_title[i])):
                    z = page_title[i][j]
                    nav_path_out += [tmp_path + [z[0]]]
                    nav_title_out += [tmp_title + [z[1]]]
    out = []
    for i in range(len(nav_title_out)):
        out += [{'path': nav_path_out[i], 'title': nav_title_out[i]}]

    return out

def get_navigation_users(yaml_dir):
    global_file = os.path.join(yaml_dir, 'global.yaml')
    global_yaml = load_yaml_file(global_file)
    maproom_nav = GLOBAL_CONFIG['navigation'][0]['title']
    users_nav = [{'path': ['user-account'],
                 'title': maproom_nav + [global_yaml['user_accout']]},
                 {'path': ['users-management'],
                 'title': maproom_nav + [global_yaml['user_management']]}]
    return users_nav

GLOBAL_CONFIG['navigation'] = get_navigation_items()
# add user account and management to navigation
GLOBAL_CONFIG['navigation'] += get_navigation_users(yaml_dir)

GLOBAL_CONFIG['current_path'] = None

def set_navbar_path(cm, item_type):
    current_path = GLOBAL_CONFIG['current_path']
    if item_type == 'directory':
        if cm == '' or cm == 'maproom':
            nav_path = None
            GLOBAL_CONFIG['current_path'] = None
        else:
            if current_path is None:
                nav_path = [cm]
                dir_path = [p['path'] for p in GLOBAL_CONFIG['navigation']]
                for p in dir_path:
                    if p is None: continue
                    if len(p) == 1: continue
                    if p[-1] == cm:
                        current_path = p[:-1]
                        nav_path = current_path + [cm]
                        break
            else:
                if cm in current_path:
                    ip = current_path.index(cm) + 1
                    nav_path = current_path[:ip]
                else:
                    pth = current_path + [cm]
                    nav_path = remove_duplicates_list(pth)
            GLOBAL_CONFIG['current_path'] = nav_path
    else:
        if current_path is None:
            page_path = [p['path'] for p in GLOBAL_CONFIG['navigation']]
            for p in page_path:
                if p is None: continue
                if p[-1] == cm:
                    current_path = p[:-1]
                    break

        pth = current_path + [cm]
        nav_path = remove_duplicates_list(pth)
        GLOBAL_CONFIG['current_path'] = nav_path

    return nav_path

def selected_language(lang_code):
    GLOBAL_CONFIG['language']['code'] = lang_code
    maproom_lang = GLOBAL_CONFIG['language']['list']
    selected_lang = [l for l in maproom_lang if l['code'] == lang_code]
    GLOBAL_CONFIG['language']['selected'] = selected_lang[0]
