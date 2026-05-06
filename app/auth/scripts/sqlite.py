import os
import sqlite3
from ._hash import hash_password, _create_key
from .auth_pctrl import (_get_admin_datauser,
                         _create_maproom_datauser)
from app.dst_api.scripts.util import convert2json
from app.scripts._global import GLOBAL_CONFIG

def connection():
    sqlite_db = os.path.join(
        GLOBAL_CONFIG['data_dir'],
        'maprooms-sqlite.db'
    )
    conn = sqlite3.connect(sqlite_db)
    cursor = conn.cursor()
    return cursor, conn

def _executeSQLCmd(sqlCmd, args = None, commit = False):
    cursor, conn = connection()

    if args is None:
        cursor.execute(sqlCmd)
    else:
        cursor.execute(sqlCmd, args)

    if commit:
        conn.commit()
        res = None
    else:
        tmp = sqlCmd.split(' ')
        tmp = tmp[0].strip().lower()
        if tmp == 'select':
            res = convert2json(cursor)
        else:
            res = None

    cursor.close()
    conn.close()
    return res

def _createUsersListTable():
    sqlCmd = """CREATE TABLE IF NOT EXISTS users_table
                (uid integer primary key autoincrement,
                 fullname text, institution text, email text,
                 username text not null unique,
                 password text, api_key text,
                 role text, access text, expiry text,
                 extract text, analysis text)"""
    _executeSQLCmd(sqlCmd)

def _createUserDataTable():
    sqlCmd = """CREATE TABLE IF NOT EXISTS users_data
                (username text primary key,
                 shapefiles text, multipoints text,
                 geojson text)"""
    _executeSQLCmd(sqlCmd)

def _usersTableExist():
    sqlCmd = "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    res = _executeSQLCmd(sqlCmd, ('users_table',))
    return len(res) > 0

def sql_insertUser(user):
    user = _format_datauser(user)

    sqlCmd = """INSERT INTO users_table
                (fullname, institution, email, username,
                 password, api_key, role, access,
                 expiry, extract, analysis)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"""

    pwd = hash_password(user['password'])
    api_key = _create_key()

    sqlVal = (user['fullname'], user['institution'],
              user['email'], user['username'],
              pwd, api_key, user['role'], user['access'],
              user['expiry'], user['extract'], user['analysis'])

    _executeSQLCmd(sqlCmd, sqlVal, True)
    return 0

def sql_getColTableUser(username, column, table):
    sqlCmd = f'SELECT {column} FROM {table} WHERE username=?'
    return _executeSQLCmd(sqlCmd, (username,))

def sql_usernameExist(username, table):
    sqlCmd = f'SELECT username FROM {table} WHERE username=?'
    user = _executeSQLCmd(sqlCmd, (username,))
    return len(user) > 0

def sql_updateUser(user):
    user = _format_datauser(user)

    keys = list(user.keys())
    keys.remove('uid')
    keys_update = [f'{k} = ?' for k in keys]
    keys_update = ', '.join(keys_update)
    sqlCmd = f'UPDATE users_table SET {keys_update} WHERE uid = ?'
    sqlVal = tuple([user[k] for k in keys])
    sqlVal = sqlVal + (user['uid'],)

    _executeSQLCmd(sqlCmd, sqlVal, True)
    return 0

def sql_deleteUser(uid):
    sqlCmd = 'DELETE FROM users_table WHERE uid = ?'
    _executeSQLCmd(sqlCmd, (uid,), True)
    return 0

def _format_datauser(user):
    if 'extract' in user:
        user['extract'] = ';'.join(user['extract'])
    if 'analysis' in user:
        user['analysis'] = ';'.join(user['analysis'])

    return user

def initUsersTable():
    if not _usersTableExist():
        _createUsersListTable()
        _createUserDataTable()

        admin = _get_admin_datauser()
        if admin['status'] == -1:
            return admin

        sql_insertUser(admin['user'])
        maproom = _create_maproom_datauser()
        sql_insertUser(maproom)

    return {'status': 0}

def sql_getUserPassword(username):
    sqlCmd = 'SELECT password FROM users_table WHERE username=?'
    pwd = _executeSQLCmd(sqlCmd, (username,))
    if len(pwd) > 0:
        return pwd[0]['password']
    else:
        return None

def sql_getUserData(key, value):
    sqlCmd = f'SELECT * FROM users_table WHERE {key}=?'
    return _executeSQLCmd(sqlCmd, (value,))

def sql_getUsersList():
    sqlCmd = 'SELECT * FROM users_table'
    return _executeSQLCmd(sqlCmd)

def sql_generateAPIKey(username):
    apik = _create_key()
    sqlCmd = 'UPDATE users_table SET api_key=? WHERE username=?'
    _executeSQLCmd(sqlCmd, (apik, username), True)
    return {'api_key': apik}

def sql_changePassword(user):
    u_pass = hash_password(user['password'])
    sqlCmd = 'UPDATE users_table SET password=? WHERE username=?'
    _executeSQLCmd(sqlCmd, (u_pass, user['username']), True)
    return 0

def sql_addFileToDataTable(username, instert_string, table, col):
    if sql_usernameExist(username, table):
        sqlCmd = f'UPDATE {table} SET {col}=? WHERE username=?'
    else:
        sqlCmd = f'INSERT INTO {table} ({col}, username) VALUES (?, ?)'

    _executeSQLCmd(sqlCmd, (instert_string, username), True)
    return 0
