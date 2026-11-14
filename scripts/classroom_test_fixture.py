"""All IO is hard-coded to the isolated demo Firebase emulators."""
import json
import time
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.parse import quote
from pathlib import Path

PREFIX = '[TEST:classroom:20261113]'
CLASS_ID = PREFIX + '-class'
FIRESTORE = 'http://127.0.0.1:8080/v1/projects/demo-lakeducation/databases/lakeducationdb/documents'
AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:'
PASSWORD = 'LocalClassroomTest@2026'

def request(url, data=None, method='POST', token='owner'):
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    body = json.dumps(data).encode() if data is not None else None
    with urlopen(Request(url, data=body, headers=headers, method=method), timeout=20) as result:
        return json.load(result)

def field(value):
    if value is None: return {'nullValue': None}
    if isinstance(value, bool): return {'booleanValue': value}
    if isinstance(value, int): return {'integerValue': str(value)}
    if isinstance(value, float): return {'doubleValue': value}
    if isinstance(value, str): return {'stringValue': value}
    if isinstance(value, list): return {'arrayValue': {'values': [field(v) for v in value]}}
    return {'mapValue': {'fields': {k: field(v) for k, v in value.items()}}}

def put(collection, identifier, data):
    return request(FIRESTORE + '/' + collection + '/' + quote(identifier, safe=''),
                   {'fields': {k: field(v) for k, v in data.items()}}, 'PATCH')

def seed():
    rules = Path('tests/classroom/firestore.rules').read_text()
    result = request('http://127.0.0.1:8080/emulator/v1/projects/demo-lakeducation:securityRules',
                     {'rules': {'files': [{'name': 'security.rules', 'content': rules}]}}, 'PUT')
    assert not result.get('issues'), result.get('issues')
    users = {}
    suffix = str(int(time.time()))
    for role in ['teacher', 'otherteacher', 'academic', 'director', 'student', 'student2', 'student3', 'accountant']:
        email = f'classroom.{role}.{suffix}@lakeducation.test'
        auth = request(AUTH + 'signUp?key=demo-api-key', {'email': email, 'password': PASSWORD, 'returnSecureToken': True}, token=None)
        real_role = 'teacher' if role == 'otherteacher' else 'student' if role.startswith('student') else role
        user = {'id': auth['localId'], 'uid': auth['localId'], 'role': real_role,
                'name': f'{PREFIX} {role}', 'englishName': f'{PREFIX} {role}',
                'email': email, 'password': PASSWORD, 'status': 'active', 'isDeleted': False,
                'authProviders': ['password'], 'testPrefix': PREFIX}
        put('users', user['id'], user)
        users[role] = {**user, 'token': auth['idToken']}
    now = datetime.now(timezone(timedelta(hours=7)))
    start, end = now - timedelta(minutes=5), now + timedelta(minutes=45)
    cls = {'id': CLASS_ID, 'name': PREFIX + ' Classroom', 'teacherId': users['teacher']['id'],
           'teacherName': users['teacher']['name'], 'status': 'Active', 'isDeleted': False,
           'studentIds': [users[s]['id'] for s in ['student', 'student2', 'student3']],
           'startDate': (now - timedelta(days=1)).strftime('%d/%m/%Y'),
           'endDate': (now + timedelta(days=7)).strftime('%d/%m/%Y'),
           'scheduleData': {'days': [(start.weekday() + 1) % 7], 'startTime': start.strftime('%H:%M'),
                            'endTime': end.strftime('%H:%M'), 'baseTimezoneOffset': 7},
           'schedule': f"{start.strftime('%H:%M')} - {end.strftime('%H:%M')}", 'testPrefix': PREFIX}
    put('classes', CLASS_ID, cls)
    return users, cls

def cleanup(users):
    notifications = request(FIRESTORE + '/notifications', method='GET').get('documents', [])
    for item in notifications:
        if item.get('fields', {}).get('metadata', {}).get('mapValue', {}).get('fields', {}).get('classId', {}).get('stringValue') == CLASS_ID:
            request('http://127.0.0.1:8080/v1/' + quote(item['name'], safe='/'), method='DELETE')
    docs = request(FIRESTORE + '/session_evaluations', method='GET').get('documents', [])
    for doc in docs:
        if doc.get('fields', {}).get('classId', {}).get('stringValue') == CLASS_ID:
            request('http://127.0.0.1:8080/v1/' + quote(doc['name'], safe='/'), method='DELETE')
    request(FIRESTORE + '/classes/' + quote(CLASS_ID, safe=''), method='DELETE')
    request(FIRESTORE + '/classroom_live/' + quote(CLASS_ID, safe=''), method='DELETE')
    for user in users.values():
        request(FIRESTORE + '/users/' + user['id'], method='DELETE')
        request(AUTH + 'delete?key=demo-api-key', {'localId': user['id']})
    for collection in ['classes', 'classroom_live', 'session_evaluations', 'users', 'notifications']:
        remaining = request(FIRESTORE + '/' + collection, method='GET').get('documents', [])
        assert not any(PREFIX in json.dumps(doc) for doc in remaining), f'Residue in {collection}'
    print('PASS cleanup: zero classroom fixture documents remaining', flush=True)

def cleanup_incomplete():
    docs = request(FIRESTORE + '/users', method='GET').get('documents', [])
    partial = {}
    for document in docs:
        if document.get('fields', {}).get('testPrefix', {}).get('stringValue') == PREFIX:
            identifier = document['name'].split('/')[-1]
            partial[identifier] = {'id': identifier}
    if partial: cleanup(partial)
