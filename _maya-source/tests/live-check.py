import sys,json,urllib.request,urllib.error,termios
term=termios.tcgetattr(0);term[3]&=~termios.ECHO;termios.tcsetattr(0,termios.TCSANOW,term);print('Ready',flush=True)
password=json.loads(sys.stdin.readline())['password'];base='https://maya-haglund-admin.netlify.app';token=''
def call(path,method='GET',data=None,auth=True,origin='https://wrexist.github.io'):
 headers={'Origin':origin}
 if data is not None:headers['Content-Type']='application/json'
 if auth and token:headers['Authorization']='Bearer '+token
 r=urllib.request.Request(base+path,data=json.dumps(data).encode() if data is not None else None,headers=headers,method=method)
 try:
  with urllib.request.urlopen(r,timeout=60) as response:return response.status,json.load(response)
 except urllib.error.HTTPError as e:
  raw=e.read()
  try:body=json.loads(raw)
  except:body={}
  return e.code,body
assert call('/api/admin',auth=False)[0]==401
assert call('/api/content?draft=1',auth=False)[0]==401
assert call('/api/content',origin='https://unrelated.test')[0]==403
assert call('/api/login','POST',{'password':'deliberately-incorrect'},False)[0]==401
status,data=call('/api/login','POST',{'password':password},False);assert status==200,(status,data);token=data['token'];print('Authentication and origin checks passed',flush=True)
status,draft=call('/api/content?draft=1');assert status==200,(status,draft)
status,published=call('/api/content');assert status==200
status,saved=call('/api/content','POST',draft);assert status==200,(status,saved)
assert call('/api/content','POST',draft)[0]==409
assert call('/api/content')[1]==published
print('Draft persistence, conflict protection and publication isolation passed',flush=True)
# Publish the unchanged saved draft only when it equals the original public content.
if draft['content']==published['content']:
 assert call('/api/content','PUT',{'version':saved['version']})[0]==200
 assert call('/api/content')[1]['content']==published['content']
 print('Publication readback passed',flush=True)
created=[]
try:
 body={'title':'QA temporary draft','category':'QA','starts_at':'2026-10-19T18:30','duration':45,'location':'QA','description':'Temporary validation only','price':'','booking_url':'','status':'draft','recurrence':{'weekdays':[1,3],'until':'2026-10-28'}}
 status,data=call('/api/classes','POST',body);assert status==200,(status,data);created=data['ids'];assert len(created)==4
 rows=call('/api/classes?admin=1')[1]['classes'];assert len([c for c in rows if c['id'] in created])==4
 assert not any(c['id'] in created for c in call('/api/classes')[1]['classes'])
 print('Recurring drafts persisted and remain private',flush=True)
finally:
 for row in call('/api/classes?admin=1')[1]['classes']:
  if row['id'] in created:assert call('/api/classes','DELETE',{'id':row['id'],'version':row['version']})[0]==200
print('Temporary drafts removed; all live checks passed',flush=True)
