import os
import csv
from .sqlite import *
from ._hash import hash_password
from datetime import datetime as dt
from app.scripts._global import GLOBAL_CONFIG

def _splitUserDataList(str_value):
        tmp = str_value.split(';')
        return [u for u in tmp if u != '']

def _formatUserDataReq(user_data):
    user_data[0].pop('password', None)
    extract = user_data[0]['extract']
    user_data[0]['extract'] = _splitUserDataList(extract)
    analysis = user_data[0]['analysis']
    user_data[0]['analysis'] = _splitUserDataList(analysis)
    return user_data

def _getUserData(username):
    user_data = sql_getUserData('username', username)
    if len(user_data) > 0:
        user_data = _formatUserDataReq(user_data)
    else:
        user_data = [{'fullname': 'null'}]
    return user_data

def _getUserDataAPIKey(apikey):
    user_data = sql_getUserData('api_key', apikey)
    if len(user_data) > 0:
        user_data = _formatUserDataReq(user_data)
        user_data = user_data[0]
    else:
        user_data = None
    return user_data

def _getUserDataUID(uid):
    user_data = sql_getUserData('uid', uid)
    if len(user_data) > 0:
        user_data = _formatUserDataReq(user_data)
        user_data = user_data[0]
    else:
        user_data = None
    return user_data

def getUserData(username):
    return _getUserData(username)

def getAllUsersList():
    user_data = sql_getUsersList()
    exclude = ['uid', 'password', 'api_key']
    user_out = []
    for d in user_data:
        tmp = {}
        for k, v in d.items():
            if not k in exclude:
                if k in ['extract', 'analysis']:
                    val = _splitUserDataList(v)
                else:
                    val = v
                tmp[k] = val
        user_out += [tmp]

    return user_out

def addUser(dataUser):
    if sql_usernameExist(dataUser['username'], 'users_table'):
        msg = f"Username: {dataUser['username']} already exists"
        return {'status': -1, 'message': msg, 'code': 'error'}

    ret = sql_insertUser(dataUser)
    msg = f"Username: {dataUser['username']} added successfully!"
    del dataUser['password']

    dataUser['extract'] = _splitUserDataList(dataUser['extract'])
    dataUser['analysis'] = _splitUserDataList(dataUser['analysis'])

    return {'status': 0, 'message': msg, 'user': dataUser, 'code': 'success'}

def editUser(dataUser):
    dataUser0 = _getUserDataUID(dataUser['uid'])
    if dataUser['username'] != dataUser0['username']:
        if sql_usernameExist(dataUser['username'], 'users_table'):
            msg = f"Username: {dataUser['username']} already exists"
            return {'status': -1, 'message': msg, 'code': 'error'}
    tmp_keys = ['fullname', 'institution', 'email', 'username',
                'role', 'access', 'expiry']
    tmp_dict = {k:dataUser[k] for k in tmp_keys if dataUser[k] != dataUser0[k]}
    tmp_dict['uid'] = dataUser['uid']

    if set(dataUser['extract']) != set(dataUser0['extract']):
        tmp_dict['extract'] = dataUser['extract']
    if set(dataUser['analysis']) != set(dataUser0['analysis']):
        tmp_dict['analysis'] = dataUser['analysis']

    if dataUser['newpassword']:
        tmp_dict['password'] = hash_password(dataUser['password'])
    if len(tmp_dict.keys()) > 1:
        ret = sql_updateUser(tmp_dict)

    msg = f"Username: {dataUser['username']} updated successfully!"
    if dataUser['newpassword']:
        del dataUser['newpassword']
        del dataUser['password']

    return {'status': 0, 'message': msg, 'user': dataUser, 'code': 'success'}

def removeUser(uid):
    dataUser = _getUserDataUID(uid)
    sql_deleteUser(uid)
    msg = f'User: {dataUser["username"]}, deleted permanently from database'
    return {'message': msg, 'code': 'success'}

def loginProc(username, password):
    hash_pass = sql_getUserPassword(username)
    if hash_pass is None:
        msg = 'Please check your login details and try again.'
        return {'status': -1, 'message': msg}
    else:
        u_pass = hash_password(password)
        if u_pass == hash_pass:
            dataUser = _getUserData(username)[0]
            today = dt.today()
            expiry = dt.strptime(dataUser['expiry'], '%Y-%m-%d')
            if expiry < today:
                msg = 'Your account has been expired'
                return {'status': -1, 'message': msg}
            else:
                return {'status': 0, 'data': dataUser}
        else:
            msg = 'Incorrect password.'
            return {'status': -1, 'message': msg}

def changePassword(user):
    try:
        sql_changePassword(user)
        return {'message': 'Your password has been changed', 'status': 'success'}
    except Exception as e:
        return {'message': str(e), 'status': 'error'}

def _addFileToDataTable(username, instert_string, table, col):
    try:
        sql_addFileToDataTable(username, instert_string, table, col)
        return 'ok'
    except Exception as e:
        return str(e)

def _deleteFileToDataTable(username, delete_string, table, col):
    try:
        colVal = sql_getColTableUser(username, col, table)
        if len(colVal) > 0:
            files = colVal[0][col]
            files = files.split(';')
            files.remove(delete_string)
            files = ';'.join(files)
            return _addFileToDataTable(username, files, table, col)
        else:
            return f'Column {col} from table {table} is empty'
    except Exception as e:
        return str(e)

def getFilesUserData(username, col):
    user_data = []
    if sql_usernameExist(username, 'users_data'):
        userfiles = sql_getColTableUser(username, col, 'users_data')
        userfiles = userfiles[0][col]
        if userfiles is not None:
            user_data = _splitUserDataList(userfiles)

    return user_data

def saveUserUploadedFile(username, updata, tablename, shp=False):
    try:
        user_dir = os.path.join(GLOBAL_CONFIG['users_data'], username, tablename)
        if not os.path.exists(user_dir):
            os.makedirs(user_dir)

        if shp:
            for fs in updata:
                file = os.path.join(user_dir, fs.filename)
                fs.save(file)
            filename = os.path.splitext(updata[0].filename)[0]
            ftype = 'Layer'
        else:
            file = os.path.join(user_dir, updata.filename)
            updata.save(file)
            filename = updata.filename
            ftype = 'File'

        upfiles = getFilesUserData(username, tablename)
        upfiles.append(filename)

        # remove duplicates
        upfiles = list(dict.fromkeys(upfiles))
        upfiles = ';'.join(upfiles)
        ret = _addFileToDataTable(username, upfiles, 'users_data', tablename)
        if ret != 'ok':
            return {'message': ret, 'status': 'error'}
        return {'message': f'{ftype} {filename} has saved to your profile.', 'status': 'success'}

    except Exception as e:
        return {'message': str(e), 'status': 'error'}

def deleteUserSavedFile(username, savedfile, tablename, shp=False):
    try:
        ret = _deleteFileToDataTable(username, savedfile, 'users_data', tablename)
        if ret != 'ok':
            return {'message': ret, 'status': 'error'}

        user_dir = os.path.join(GLOBAL_CONFIG['users_data'], username, tablename)
        if shp:
            for ext in ['shp', 'shx', 'dbf', 'prj']:
                file = os.path.join(user_dir, f'{savedfile}.{ext}')
                if os.path.exists(file):
                    os.remove(file)
            ftype = 'Layer'
        else:
            file = os.path.join(user_dir, savedfile)
            if os.path.exists(file):
                os.remove(file)
            ftype = 'File'

        return {'message': f'{ftype} {savedfile} has deleted from your profile.', 'status': 'success'}

    except Exception as e:
        return {'message': str(e), 'status': 'error'}

def addCSVFilenameToTable(username, csvfile):
    try:
        csvfiles = getFilesUserData(username, 'multipoints')
        csvfiles.append(csvfile)
        # remove duplicates
        csvfiles = list(dict.fromkeys(csvfiles))
        csvfiles = ';'.join(csvfiles)
        ret = _addFileToDataTable(username, csvfiles, 'users_data', 'multipoints')
        if ret != 'ok':
            return {'message': ret, 'status': 'error'}
        return {'message': f'File {csvfile} has been added to your profile.', 'status': 'success'}
    except Exception as e:
        return {'message': str(e), 'status': 'error'}

def saveUserCSVFileMap(username, user_req):
    try:
        data = [['Location', 'Longitude', 'Latitude']] + user_req['points']
        user_dir = os.path.join(GLOBAL_CONFIG['users_data'], username, 'multipoints')
        if not os.path.exists(user_dir):
            os.makedirs(user_dir)
        csvpath = os.path.join(user_dir, user_req['file'])
        with open(csvpath, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerows(data)
        return addCSVFilenameToTable(username, user_req['file'])
    except Exception as e:
        return {'status': 'error', 'message': str(e)}
