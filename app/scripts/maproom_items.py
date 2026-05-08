import os
from .util import load_yaml_file
from .icons import *
from ._global import GLOBAL_CONFIG
from app.dst_api.scripts import get_datasets_information

def _get_lang_text(obj, lang_code):
    if lang_code in obj:
        ret = obj[lang_code]
    else:
        ret = obj[list(obj.keys())[0]]

    return ret

def _get_lang_info():
    language = GLOBAL_CONFIG['language']
    lang_list = [l['code'] for l in language['list']]
    lang_code = language['code']
    return lang_list, lang_code

def _get_description_text(obj, lang_code):
    descrp = _get_lang_text(obj, lang_code)
    descrp = descrp.strip()
    if descrp[0:3] == '<p>':
        tmp = descrp.split('</p>')
        tmp = tmp[0]
        descrp = tmp[3:]

    return descrp

def load_maproom_items(item_dirs):
    lang_list, lang_code = _get_lang_info()
    app_dir = GLOBAL_CONFIG['app_dir']
    blank_icon = GLOBAL_CONFIG['blank_icon']

    out = {}
    out['left'] = {}
    out['right'] = []

    if item_dirs is None:
        nav_path = ''
        template = 'maproom'
    else:
        nav_path = os.path.join(*item_dirs)
        template = item_dirs[-1]

    item_path = os.path.join(app_dir, nav_path)
    yaml_file = os.path.join(item_path, 'yaml', 'maproom_items.yaml')
    tmp = load_yaml_file(yaml_file)

    out['left']['title'] = _get_lang_text(tmp['title'], lang_code)
    out['left']['description'] = _get_lang_text(tmp['description'], lang_code)

    if tmp['type'] == 'navigation-card':
        for cm in tmp['components']:
            res = {}
            yaml_file = os.path.join(item_path, cm, 'yaml', 'maproom_items.yaml')
            cm_tmp = load_yaml_file(yaml_file)
            res['title'] = _get_lang_text(cm_tmp['title'], lang_code)
            res['description'] = _get_description_text(cm_tmp['description'], lang_code)
            res['endpoint'] = 'maproom_items'
            res['template'] = template
            res['component'] = cm
            if 'icon_image' in cm_tmp:
                icon_dir = os.path.join(app_dir, 'static', 'images', 'card_icons')
                icon_path = os.path.join(icon_dir, cm_tmp['icon_image'])
                if os.path.exists(icon_path):
                    res['icon'] = create_icon_image(icon_path)
                else:
                    res['icon'] = blank_icon
            elif 'icon_function' in cm_tmp:
                res['icon'] = create_icon_function(cm_tmp['icon_function'])
            else:
                res['icon'] = blank_icon
            out['right'] = out['right'] + [res]
    else:
        # 'navigation-page'
        for cm in tmp['maprooms']:
            res = {}
            page = list(cm.keys())[0]
            res['title'] = _get_lang_text(cm[page]['title'], lang_code)
            res['description'] = _get_lang_text(cm[page]['description'], lang_code)
            res['endpoint'] = 'maproom_pages'
            res['template'] = template
            if 'icon_image' in cm[page]:
                icon_path = os.path.join(item_path, 'static', 'images', cm[page]['icon_image'])
                if os.path.exists(icon_path):
                    res['icon'] = create_icon_image(icon_path)
                else:
                    res['icon'] = blank_icon
            elif 'icon_function' in cm[page]:
                res['icon'] = create_icon_function(cm[page]['icon_function'])
            else:
                res['icon'] = blank_icon
            res['component'] = page
            out['right'] = out['right'] + [res]

    GLOBAL_CONFIG['current_path'] = item_dirs

    return out

def load_navigation_items(item_dirs):
    lang_list, lang_code = _get_lang_info()
    nav_info = GLOBAL_CONFIG['navigation']

    tmp = {}
    for nav in nav_info:
        if nav['path'] == item_dirs:
            if item_dirs == None:
                pths = ['maproom']
            else:
                pths = ['maproom'] + nav['path']
            tmp['path'] = pths
            tmp['label'] = [t[lang_code] for t in nav['title']]
            break

    out = []
    for j in range(len(tmp['path'])):
        x = {'path': tmp['path'][j], 'label': tmp['label'][j]}
        out += [x]

    return out

def load_maproom_page_text(item_dirs, page_type):
    app_dir = GLOBAL_CONFIG['app_dir']
    yaml_file = os.path.join(app_dir, 'yaml', 'global.yaml')
    tmp = load_yaml_file(yaml_file)
    # out = pasre_lang_yaml_nested4(tmp)
    out = parse_lang_yaml_nested(tmp)

    yaml_file = os.path.join(app_dir, 'yaml', 'layers.yaml')
    tmp = load_yaml_file(yaml_file)
    # layers = pasre_lang_yaml_nested4(tmp)
    layers = parse_lang_yaml_nested(tmp)
    out['layers'] = layers

    yaml_file = os.path.join(app_dir, 'yaml', 'base-period.yaml')
    tmp = load_yaml_file(yaml_file)
    # base_period = pasre_lang_yaml_nested4(tmp)
    base_period = parse_lang_yaml_nested(tmp)
    out = out | base_period

    if page_type in ['page', 'user']:
        nav_path = item_dirs[:-1]
        nav_path = os.path.join(*nav_path)
        nav_path = os.path.join(app_dir, nav_path)
        yaml_file = f'{item_dirs[-1]}.yaml'
        yaml_file = os.path.join(nav_path, 'yaml', yaml_file)
        if os.path.exists(yaml_file):
            tmp = load_yaml_file(yaml_file)
            # page = pasre_lang_yaml_nested4(tmp)
            page = parse_lang_yaml_nested(tmp)
            out = out | page

    if page_type == 'page':
        yaml_file = os.path.join(app_dir, 'yaml', 'instruction.yaml')
        tmp = load_yaml_file(yaml_file)
        # out.update(pasre_lang_yaml_nested4(tmp))
        out.update(parse_lang_yaml_nested(tmp))

        yaml_file = os.path.join(app_dir, 'yaml', 'js-text.yaml')
        tmp = load_yaml_file(yaml_file)
        # out['js_text'] = pasre_lang_yaml_nested4(tmp)
        out['js_text'] = parse_lang_yaml_nested(tmp)

    return out

def data_info_coverage():
    dataInfo = get_datasets_information()
    tmp_cov = {}
    for k1, v1 in dataInfo.items():
        tmp_cov[k1] = {}
        for k2, v2 in v1.items():
            tmp_cov[k1][k2] = {}
            for k3, v3 in v2.items():
                tmp_cov[k1][k2][k3] = {}
                tmp_cov[k1][k2][k3]['temporal_coverage'] = v3['temporal_coverage']
                tmp_cov[k1][k2][k3]['spatial_resolution'] = v3['spatial_resolution']
                tmp_cov[k1][k2][k3]['spatial_coverage'] = v3['spatial_coverage']

    return tmp_cov

def pasre_lang_yaml_nested4(nested_dict):
    lang_list, lang_code = _get_lang_info()
    page = {}
    for k1, v1 in nested_dict.items():
        if isinstance(v1, dict):
            keys1 = list(v1.keys())
            if any(l in lang_list for l in keys1):
                lg = lang_code if lang_code in keys1 else keys1[0]
                # page[k1] = v1[lang_code]
                page[k1] = v1[lg]
            else:
                page[k1] = {}
                for k2, v2 in v1.items():
                    if isinstance(v2, dict):
                        keys2 = list(v2.keys())
                        if any(l in lang_list for l in keys2):
                            lg = lang_code if lang_code in keys2 else keys2[0]
                            page[k1][k2] = v2[lg]
                        else:
                            page[k1][k2] = {}
                            for k3, v3 in v2.items():
                                if isinstance(v3, dict):
                                    keys3 = list(v3.keys())
                                    if any(l in lang_list for l in keys3):
                                        lg = lang_code if lang_code in keys3 else keys3[0]
                                        page[k1][k2][k3] = v3[lg]
                                    else:
                                        page[k1][k2][k3] = {}
                                        for k4, v4 in v3.items():
                                            if isinstance(v4, dict):
                                                keys4 = list(v4.keys())
                                                lg = lang_code if lang_code in keys4 else keys4[0]
                                                page[k1][k2][k3][k4] = v4[lg]
                                            else:
                                                page[k1][k2][k3][k4] = v4
                                else:
                                    page[k1][k2][k3] = v3
                    else:
                        page[k1][k2] = v2
        else:
            page[k1] = v1
    return page

## generalization of pasre_lang_yaml_nested4
def parse_lang_yaml_nested(nested_dict):
    lang_list, lang_code = _get_lang_info()

    def parse_value(value):
        if not isinstance(value, dict):
            return value

        keys = list(value.keys())

        # Case: dictionary is a language dictionary: {"en": "...", "fr": "..."}
        if any(k in lang_list for k in keys):
            lg = lang_code if lang_code in value else keys[0]
            return value[lg]

        # Case: normal nested dictionary
        return {
            k: parse_value(v)
            for k, v in value.items()
        }

    return parse_value(nested_dict)
