from datetime import datetime as dt
from .users import _getUserDataAPIKey

def checkUserDataAPIKey(params, request, download_type):
    ret = _checkAPIKey(params, request, download_type)
    if ret['status'] == -1: return ret
    ret = _checkUserExpiry(ret['user'])
    if ret['status'] == -1: return ret
    ret = _checkDataAccess(ret['user'], download_type)
    if ret['status'] == -1: return ret
    ret = _checkExtraction(ret['user'], params)
    if ret['status'] == -1: return ret
    if download_type == 'analysis':
        return _ckeckAnalysis(ret['user'], params)
    else:
        return ret

def _checkAPIKey(params, request, download_type):
    if 'apiKey' in params:
        apikey = params['apiKey']
    else:
        apikey = request.headers.get('x-api-key')
        if apikey is None:
            auth = request.authorization
            if auth is not None:
                try:
                    auth_type, apikey = str(auth).split(maxsplit=1)
                    if auth_type.lower() != 'apikey':
                        return {'status': -1, 'message': 'Authorization Scheme must be Apikey.', 'code': 400}
                except ValueError:
                    return {'status': -1, 'message': 'Invalid authorization header format.', 'code': 400}
            else:
                return {'status': -1, 'message': 'API key is missing.', 'code': 400}

    user_data = _getUserDataAPIKey(apikey)
    if user_data is None:
        return {'status': -1, 'message': 'Invalid API key.', 'code': 403}
    else:
        return {'status': 0, 'user': user_data}

def _checkUserExpiry(user_data):
    today = dt.today()
    expiry = dt.strptime(user_data['expiry'], '%Y-%m-%d')
    if expiry < today:
        msg = 'Your account has been expired.'
        return {'status': -1, 'message': msg, 'code': 401}

    return {'status': 0, 'user': user_data}

def _checkDataAccess(user_data, download_type):
    msg = 'You do not have the necessary permissions to access this dataset'
    out_no = {'status': -1, 'message': msg, 'code': 401}

    if download_type == 'rawdata':
        if user_data['access'] != 'all':
            return out_no
    if download_type == 'climatology':
        if not user_data['access'] in ['all', 'clim-analysis', 'climatology']:
            return out_no
    if download_type == 'analysis':
        if not user_data['access'] in ['all', 'clim-analysis', 'analysis']:
            return out_no

    return {'status': 0, 'user': user_data}

def _checkExtraction(user_data, params):
    msg = 'You do not have the right permissions to extract this dataset'
    out_no = {'status': -1, 'message': msg, 'code': 401}

    if params['geomExtract'] == 'original':
        if not 'originalgrid' in user_data['extract']: return out_no
    elif params['geomExtract'] == 'rectangle':
        if not 'rectangle' in user_data['extract']: return out_no
    elif params['geomExtract'] == 'geojson':
        if not 'usergeojson' in user_data['extract']: return out_no
    elif params['geomExtract'] == 'polygons':
        if params['shpSource'] == 'user':
            if not 'userpolygons' in user_data['extract']: return out_no
        if params['shpSource'] == 'default':
            if not 'defaultpolygons' in user_data['extract']: return out_no
    else:
        if params['pointsSource'] == 'user':
            if not 'usermpoints' in user_data['extract']: return out_no
        if params['pointsSource'] == 'upload':
            if not 'mapmpoints' in user_data['extract']: return out_no

    return {'status': 0, 'user': user_data}

def _ckeckAnalysis(user_data, params):
    # test
    return {'status': 0, 'user': user_data}
