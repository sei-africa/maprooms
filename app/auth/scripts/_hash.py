import hashlib
import string
import random

def hash_password(password):
    hobj = hashlib.sha256()
    hobj.update(password.encode())
    return hobj.hexdigest()

def _create_key(n = 16):
    st = string.ascii_uppercase + string.ascii_lowercase + string.digits
    key = ''.join(random.choices(st, k = n))
    return key
