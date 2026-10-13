# Re-bake supplied first-party tile art; no gameplay occupancy edits. Run from project root.
import json, pathlib, uuid
from PIL import Image
source=Image.open('assets/art/environment/tileset.png').convert('RGBA'); folder=pathlib.Path('assets/art/environment/terrain'); folder.mkdir(exist_ok=True)
solid={22,23,24,26,27,28,30,31,32,39,40,41,43,44,45,47,48,49,56,57,58,60,61,62,64,65,66}
def save(im,path):
 im.save(path); meta=pathlib.Path(str(path)+'.gmeta')
 if meta.exists(): return
 meta.write_text('guid = "'+str(uuid.uuid4())+'"\nimporter = "texture"\n\n[settings]\natlas = "environment"\ncompression = "none"\ntrim = false\nart_check = false\n')
for name in ['first-sewer-room','complete-sewer']:
 d=json.load(open('assets/rooms/'+name+'.tilemap.json')); w=d['columns']; h=d['rows']; tiles=d['tiles']
 def occupied(x,y): return 0<=x<w and 0<=y<h and tiles[(h-1-y)*w+x] in solid
 # Strips cap at 64 cells (1024px), leaving room for mobile atlas gutters.
 # Tilemap data stores top row first, NavGrid flips to world-positive-up.
 for y in range(h):
  x=0
  while x<w:
   if not occupied(x,y): x+=1; continue
   start=x
   while x<w and x<start+64 and occupied(x,y): x+=1
   strip=Image.new('RGBA',((x-start)*16,16))
   for col in range(start,x):
    exposed=not occupied(col,y+1)
    tile=40 if exposed else 57
    if not occupied(col-1,y): tile-=1
    elif not occupied(col+1,y): tile+=1
    cell=source.crop(((tile%17)*16,(tile//17)*16,(tile%17+1)*16,(tile//17+1)*16))
    strip.paste(cell,((col-start)*16,0))
   save(strip,folder/(name+'-'+str(y)+'-'+str(start)+'.png'))
save(Image.open('assets/art/environment/front.png').crop((0,0,592,52)),pathlib.Path('assets/art/environment/canopy.png'))
