import os
import re
import shutil
from .util import list_yaml_maproom_items
from ._global import GLOBAL_CONFIG

def copy_yaml_files(prod2dev=True):
    app_dir = GLOBAL_CONFIG['app_dir']
    yamls = list_yaml_maproom_items(app_dir, o_file)
    pattern = re.compile(r'^(dev-.*\.yaml)$')
    for ym in yamls:
        ym_mid = os.path.join(*ym)
        ym_path = os.path.join(app_dir, ym_mid)
        all_files = os.listdir(ym_path)
        for fd in all_files:
            if pattern.match(fd):
                fo = re.sub(r'dev-', '', fd)
                f1 = os.path.join(ym_path, fo)
                f2 = os.path.join(ym_path, fd)
                if prod2dev:
                    shutil.copy(f1, f2)
                else:
                    shutil.copy(f2, f1)
    return 0
