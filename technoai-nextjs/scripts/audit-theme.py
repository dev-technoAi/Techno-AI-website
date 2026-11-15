"""Static CSS cascade/contrast audit for archived content. Requires tinycss2/cssselect2."""
import sys, re, json, urllib.request, urllib.parse
from pathlib import Path
from html.parser import HTMLParser
from xml.etree.ElementTree import Element
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.theme-audit-tools'))
import tinycss2, cssselect2
from tinycss2.color3 import parse_color
BASE='http://localhost:3100'
VOID=set('area base br col embed hr img input link meta param source track wbr'.split())
class DOM(HTMLParser):
 def __init__(self): super().__init__(convert_charrefs=True); self.root=Element('html'); self.stack=[self.root]
 def handle_starttag(self,tag,attrs):
  a={k:v or '' for k,v in attrs}; e=Element(tag,a);self.stack[-1].append(e)
  if tag not in VOID:self.stack.append(e)
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==tag:self.stack=self.stack[:i];break
 def handle_data(self,d):
  el=self.stack[-1];el.text=(el.text or '')+d
CACHE={}
def get(url):
 url=urllib.parse.urljoin(BASE,url)
 if url not in CACHE:
  try:CACHE[url]=urllib.request.urlopen(url,timeout=30).read().decode('utf-8')
  except Exception:CACHE[url]=''
 return CACHE[url]
RULES={}
def declarations(body):
 return [(d.name,tinycss2.serialize(d.value).strip(),d.important) for d in tinycss2.parse_declaration_list(body,skip_comments=True,skip_whitespace=True) if d.type=='declaration' and (d.name.startswith('--') or d.name in ['color','background','background-color','display','visibility'])]
def rules(css):
 if css in RULES:return RULES[css]
 out=[]
 def visit(items):
  for r in items:
   if r.type=='qualified-rule':
    try:
     sels=cssselect2.compile_selector_list(tinycss2.serialize(r.prelude)); decl=declarations(r.content)
     for s in sels:
      if not s.pseudo_element:out.append((s,decl))
    except Exception:pass
   elif r.type=='at-rule' and r.content and r.lower_at_keyword in ['layer','supports']:
    visit(tinycss2.parse_rule_list(r.content,skip_comments=True,skip_whitespace=True))
 visit(tinycss2.parse_stylesheet(css,skip_comments=True,skip_whitespace=True));RULES[css]=out;return out

def resolve(s,vars):
 for _ in range(12):
  if 'var(' not in s:break
  s=re.sub(r'var\((--[\w-]+)(?:\s*,\s*([^()]+))?\)',lambda m:vars.get(m[1],m[2] or ''),s)
 return s.strip()
def rgba(s):
 try:
  c=parse_color(s)
  if c and c!='currentColor':return tuple(c)
 except Exception:pass
 return None

def lum(c):
 a=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c[:3]];return .2126*a[0]+.7152*a[1]+.0722*a[2]
def composite(f,b):return tuple(f[i]*f[3]+b[i]*(1-f[3]) for i in range(3))+(1,)
def audit(route):
 dom=DOM();dom.feed(get(route)); matcher=cssselect2.Matcher();order=0
 for e in dom.root.iter():
  css=''
  if e.tag=='style':css=e.text or ''
  if e.tag=='link' and e.get('rel')=='stylesheet' and not e.get('href','').startswith('https://fonts.'):css=get(e.get('href',''))
  if css:
   for selector,decl in rules(css):matcher.add_selector(selector,(order,decl));order+=1
 states={};fails=[];count=0
 for w in cssselect2.ElementWrapper.from_html_root(dom.root).iter_subtree():
  el=w.etree_element;parent=states.get(w.parent,({},(0,0,0,1),(1,1,1,1),False,False))
  variables=dict(parent[0]); props={}; win={}
  entries=[]
  for spec,seq,pseudo,(order,decl) in matcher.match(w):
   for name,val,important in decl:entries.append(((int(important),spec,order),name,val))
  for name,val,important in declarations(el.get('style','')):entries.append(((int(important),(1000,0,0),10**9),name,val))
  for priority,name,val in sorted(entries):
   if name.startswith('--'):variables[name]=val
   else:props['background-color' if name=='background' else name]=val
  fg=rgba(resolve(props.get('color',''),variables)) or parent[1]
  bgs=resolve(props.get('background-color',''),variables)
  bg=rgba(bgs)
  if not bg:
   # Extract explicit fallback colour from a background shorthand.
   bg=next((rgba(x) for x in re.findall(r'#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\b(?:white|black|transparent)\b',bgs) if rgba(x)),None)
  bg=composite(bg,parent[2]) if bg else parent[2]
  incontent=parent[3] or 'brand-content' in el.get('class','').split()
  hidden=parent[4] or props.get('display')=='none' or props.get('visibility')=='hidden' or (el.tag=='input' and el.get('type')=='hidden') or bool({'elementor-screen-only','screen-reader-text'} & set(el.get('class','').split()))
  states[w]=(variables,fg,bg,incontent,hidden)
  text=' '.join((el.text or '').split())
  if not incontent or hidden or not text or el.tag in ['script','style','noscript','svg','path','title','option']:continue
  count+=1; actual=composite(fg,bg); l1,l2=sorted([lum(actual),lum(bg)]);ratio=(l2+.05)/(l1+.05)
  # Conservative thresholds: 3:1 for headings, 4.5:1 for body text.
  if ratio < (3 if el.tag in ['h1','h2','h3'] else 4.5): fails.append({'route':route,'text':text[:85],'ratio':round(ratio,2),'class':el.get('class','')[:160],'tag':el.tag})
 return count,fails
if __name__=='__main__':
 routes=[arg for arg in sys.argv[1:] if not arg.startswith('--')] or list(json.loads(Path('content/routes.json').read_text()))
 total=0; failures=[]
 for route in routes:
  if route=='/':continue
  n,f=audit(route);total+=n;failures+=f
 print(json.dumps({'routes':len(routes),'text_elements':total,'low_contrast':len(failures),'examples':failures[:35]},indent=2))
 Path('.theme-contrast-report.json').write_text(json.dumps(failures,indent=2))

 sys.exit(1 if failures else 0)
