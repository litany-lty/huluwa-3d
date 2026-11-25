"""Rebuild the 48 refined GLBs from the unmodified film checkout.

Usage: python tools/polish_model_assets.py /path/to/baseline-checkout .
Requires Pillow and NumPy. No renderer or network access required.
"""
import argparse
from copy import deepcopy
from io import BytesIO
import json
from pathlib import Path
import re
import struct

import numpy as np
from PIL import Image, ImageFilter

# Hue center / width in degrees, pigment (sRGB), mix strength, grain, roughness floor/ceiling,
# metallic contribution, specular level, existing normal strength.
TEXTURED = {
    'hero1':          (353, 15, 'ba2028', .30, 2.0, .73, .93, .65, .37, .48),
    'hero2':          (30,  12, 'e5721d', .28, 2.3, .69, .91, .66, .40, .52),
    'hero3':          (49,  16, 'e5ad21', .27, 1.7, .58, .85, .81, .51, .51),
    'hero4':          (127, 31, '18814a', .32, 2.4, .69, .92, .63, .40, .53),
    'hero5':          (179, 24, '158b99', .34, 1.8, .63, .89, .72, .43, .51),
    'hero6':          (219, 26, '2253b6', .27, 2.0, .70, .91, .65, .38, .49),
    'hero6_stealth':  (219, 34, '346aaa', .30, 1.2, .68, .89, .45, .30, .42),
    'hero7':          (281, 33, '722b98', .34, 2.2, .65, .90, .70, .43, .51),
    'hero8_king':     (46,  18, 'deb142', .25, 1.8, .63, .90, .76, .49, .50),
    'grandpa':        (31,  20, '866040', .22, 3.1, .76, .96, .52, .30, .56),
    'pangolin':       (38,  23, 'b97931', .25, 1.6, .64, .89, .72, .46, .70),
    'boss_centipede': (143, 30, '206b53', .38, 2.5, .55, .87, .84, .52, .66),
    'boss_scorpion':  (265, 40, '44324e', .36, 2.6, .57, .90, .90, .52, .72),
    'boss_snake':     (46,  17, 'ba8616', .28, 1.4, .46, .82, .93, .57, .63),
    'enemy_toad':     (106, 45, '586d36', .39, 3.0, .69, .94, .48, .34, .63),
    'enemy_bat':      (343, 33, '694053', .37, 2.1, .70, .96, .49, .32, .66),
    'enemy_wasp':     (49,  20, 'd8a419', .24, 1.5, .58, .90, .73, .46, .55),
    'enemy_boar':     (24,  27, '805234', .36, 3.1, .73, .96, .56, .35, .75),
    'stage_web_grandpa': (225, 36, '373c5d', .33, 2.7, .65, .93, .56, .39, .69),
}

# Named objects keep geometry, transforms, texture UVs, animation hooks and slots.
# Recipe values: roughness, metalness, optional new RGBA, emissive multiplier.
SURFACES = {
    'prop_vine': {'Gourd_*': (.48, .02, None, None), 'VineStem': (.84, .0, (.15,.41,.10,1), None),
                  'VineLeaf': (.78, .0, (.83,.98,.82,1), None)},
    'prop_cauldron': {'BronzePatina': (.48,.46,(.95,.87,.73,1),None), 'BronzeRimGold': (.35,.58,(.65,.44,.20,1),None),
                      'FlameOuter': (.52,0,(.94,.25,.035,1),.58), 'FlameInner': (.35,0,(1,.62,.13,1),.84),
                      'HearthGlow': (.84,0,None,.59)},
    'prop_lotus': {'LotusPad': (.76,0,(.13,.36,.18,1),None), 'PetalMat_*': (.54,0,None,.80),
                   'SeedPod': (.64,0,(.64,.77,.28,1),None), 'SeedHole': (.86,0,(.16,.32,.12,1),None)},
    'prop_mirror': {'MagicCrystal': (.11,.14,(.10,.58,.47,.73),.76), 'MirrorStone': (.72,.18,(.23,.30,.33,1),None),
                    'MirrorCarve': (.79,.11,(.10,.17,.20,1),None), 'CrystalInnerGlow': (.19,0,(.27,.89,.69,1),.87)},
    'prop_sword': {'JadeCloudGuard': (.33,.22,(.17,.55,.37,1),None), 'TaijiMedallion': (.31,.17,None,.70),
                   'CordHilt': (.91,.02,(.28,.13,.35,1),None), 'PurpleLotusGuard': (.46,.29,(.42,.21,.58,1),None),
                   'YinYangBlade': (.24,.54,None,.62)},
    'prop_peach': {'PeachSkin': (.65,0,None,None), 'PeachLeaf': (.78,0,(.78,.91,.68,1),None)},
    'stage_rock': {'MineralShadow': (.94,.0,(.09,.27,.25,1),None), 'MineralHighlight': (.78,.02,(.29,.59,.47,1),None),
                   'MineralJade': (.87,.01,(.16,.45,.37,1),None)},
    'stage_pillar': {'CavernAbyss': (.95,.01,(.083,.071,.15,1),None), 'CavernSlate': (.86,.025,(.16,.13,.27,1),None),
                     'CavernViolet': (.73,.045,(.32,.25,.45,1),None)},
    'stage_mire': {'MireStone': (.91,.01,(.17,.20,.25,1),None), 'ToxicSlime': (.25,.0,(.39,.48,.16,1),.76),
                   'ToxicMud': (.38,.01,(.26,.16,.23,1),None)},
    'stage_door_closed': {'DoorSeam': (.97,0,(.04,.027,.022,1),None), 'DoorBrass': (.39,.66,(.75,.48,.15,1),None),
                          'DoorWalnut': (.86,.01,(.25,.132,.077,1),None),
                          'ArchStone': (.90,.02,(.185,.21,.28,1),None)},
    'stage_door_open': {'AbyssPortal': (.98,0,(.025,.018,.052,1),None), 'PortalStep': (.71,0,(.27,.20,.45,1),.57),
                        'ArchStoneOpen': (.90,.02,(.185,.21,.28,1),None)},
    'vfx1': {'ShockRay': (.35,0,(1,.69,.25,1),.78), 'ShockBurst': (.51,0,(.76,.19,.065,1),.56)},
    'vfx2': {'EyeSclera': (.36,0,(.72,.90,.78,1),.54), 'EyeIris': (.26,0,(.04,.62,.23,1),.55),
             'EyePupilGold': (.19,0,(1,.86,.36,1),.75), 'DivineGold': (.35,.24,(1,.57,.10,1),.58)},
    'vfx3': {'BellGold': (.35,.37,(.94,.65,.13,1),.67), 'BellShieldDome': (.24,0,(.93,.69,.23,.20),.57)},
    'vfx4': {'FireRed': (.50,0,(.93,.12,.034,.68),.62), 'FireOrange': (.39,0,(1,.36,.055,1),.78),
             'FireCore': (.25,0,(1,.82,.30,1),.94)},
    'vfx5': {'WaterFoam': (.25,0,(.66,.95,1,1),.70), 'WaterDeep': (.24,0,(.03,.25,.58,.64),.62),
             'WaterMid': (.20,0,(.07,.51,.78,.74),.72)},
    'vfx6': {'VortexSingularity': (.76,0,(.035,.01,.073,1),None), 'VortexAura': (.35,0,(.64,.28,.88,.22),.55),
             'VortexGold': (.29,0,(1,.71,.16,1),.73), 'VortexPurple': (.34,0,(.66,.19,.91,1),.67)},
    'vfx7': {'IceCore': (.18,.10,(.62,.86,.99,.59),.60), 'IceSpike': (.12,.11,(.23,.68,.91,.70),.72)},
    'vfx8': {'SilkMagenta': (.37,0,(.70,.15,.83,1),.58), 'SilkCyan': (.34,0,(.10,.78,.58,1),.68)},
}
ORB_COLORS = [
    ((.89,.045,.023), (1,.23,.18), .26, .51), ((.94,.28,.034),(1,.52,.16),.21,.54),
    ((.91,.65,.05),(1,.85,.29),.18,.48), ((.078,.65,.20),(.23,.90,.40),.20,.52),
    ((.035,.55,.70),(.15,.78,.95),.21,.50), ((.083,.23,.90),(.23,.42,1),.25,.58),
    ((.60,.10,.80),(.73,.29,.99),.23,.56),
]
TERRAIN = {
    'map_mountain': ((1.03,1.04,.91), (1.03,1.08,.95), 2.8, .91, .01, .64),
    'map_cave':    ((1.02,.98,.94), (.86,.99,1.14), 3.2, .90, .02, .76),
    'map_palace':  ((.95,1.04,1.07), (.94,.86,1.10), 1.9, .54, .13, .68),
}


class Glb:
    def __init__(self, path):
        data = path.read_bytes()
        assert struct.unpack_from('<4sII', data) == (b'glTF', 2, len(data)), path
        size, kind = struct.unpack_from('<I4s', data, 12)
        self.doc = json.loads(data[20:20+size])
        length, bin_kind = struct.unpack_from('<I4s', data, 20+size)
        assert kind == b'JSON' and bin_kind == b'BIN\0' and 28+size+length == len(data), path
        assert len(self.doc['buffers']) == 1 and 'uri' not in self.doc['buffers'][0], path
        raw = data[28+size:]
        self.views = [raw[v.get('byteOffset', 0):v.get('byteOffset', 0)+v['byteLength']]
                      for v in self.doc['bufferViews']]
        assert all(v['buffer'] == 0 and len(b) == v['byteLength']
                   for v, b in zip(self.doc['bufferViews'], self.views)), path

    def data_for(self, info):
        texture = self.doc['textures'][info['index']]
        image = self.doc['images'][texture['source']]
        assert image['mimeType'] == 'image/png'
        return self.views[image['bufferView']]

    def modify_texture(self, info, fn):
        source = self.doc['textures'][info['index']]['source']
        view = self.doc['images'][source]['bufferView']
        self.views[view] = process_png(self.views[view], fn)

    def character_albedo(self, info, fn):
        source = self.doc['textures'][info['index']]['source']
        image = self.doc['images'][source]
        view = image['bufferView']
        with Image.open(BytesIO(self.views[view])) as im:
            assert im.mode == 'RGB'
            rgb = fn(im, np.array(im, dtype=np.float32))
            out = BytesIO()
            Image.fromarray(np.rint(np.clip(rgb,0,255)).astype(np.uint8)).save(
                out,'JPEG',quality=95,subsampling=0,optimize=True)
        self.views[view] = out.getvalue()
        image['mimeType'] = 'image/jpeg'

    def detail_normal(self, name, kind):
        # Repeating tangent-space relief. It changes the shading, never the silhouette.
        y,x = np.mgrid[0:128,0:128] * (2*np.pi/128)
        if kind == 'wood':
            height = np.sin(13*x + .37*np.sin(2*y) + .2*np.sin(5*y))*.68 + np.sin(31*x + y)*.13
            scale = .44
        else:
            height = .46*np.sin(9*y+2*x + .42*np.sin(4*x)) + .32*np.sin(6*x-4*y) + .18*np.cos(17*x+12*y)
            scale = .66
        dx = np.roll(height,-1,axis=1)-np.roll(height,1,axis=1)
        dy = np.roll(height,-1,axis=0)-np.roll(height,1,axis=0)
        xyz = np.stack((-dx*scale,dy*scale,np.ones_like(dx)),axis=-1)
        xyz /= np.linalg.norm(xyz,axis=-1,keepdims=True)
        out = BytesIO()
        Image.fromarray(np.rint((xyz*.5+.5)*255).astype(np.uint8)).save(out,'PNG',optimize=True)
        doc = self.doc
        i = len(self.views)
        self.views.append(out.getvalue())
        doc['bufferViews'].append({'buffer':0})
        images=doc.setdefault('images',[])
        images.append({'bufferView':i,'mimeType':'image/png','name':name})
        textures=doc.setdefault('textures',[])
        textures.append({'source':len(images)-1})
        return len(textures)-1

    def write(self, path):
        raw = bytearray()
        for meta, chunk in zip(self.doc['bufferViews'], self.views):
            meta.update(byteOffset=len(raw), byteLength=len(chunk))
            raw.extend(chunk)
            raw.extend(b'\0' * (-len(raw) % 4))
        self.doc['buffers'][0]['byteLength'] = len(raw)
        meta = json.dumps(self.doc, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
        meta += b' ' * (-len(meta) % 4)
        path.write_bytes(struct.pack('<4sIII4s', b'glTF', 2, 28+len(meta)+len(raw), len(meta), b'JSON')
                         + meta + struct.pack('<I4s', len(raw), b'BIN\0') + raw)


def process_png(data, fn):
    with Image.open(BytesIO(data)) as im:
        channels = np.array(im, dtype=np.float32)
        rgb = fn(im.convert('RGB'), channels[..., :3])
        channels[..., :3] = np.rint(np.clip(rgb, 0, 255))
        out = BytesIO()
        Image.fromarray(channels.astype(np.uint8)).save(out, 'PNG', optimize=True)
        return out.getvalue()


def fiber(shape, seed):
    h,w = shape
    y,x = np.ogrid[:h,:w]
    return (.54*np.sin((x + y*.28)*.45 + .63*np.sin(y*.12)) +
            .28*np.sin((y - x*.19)*.94 + .43*np.sin(x*.21)) +
            .18*np.random.default_rng(seed).uniform(-1,1,(h,w))).astype(np.float32)


def pigment(im, rgb, recipe, seed):
    hue, width, color, mix, grain, *_ = recipe
    hsv = np.asarray(im.convert('HSV'), dtype=np.float32)
    distance = np.abs((hsv[..., 0]*(360/255)-hue+180)%360-180)
    # Saturation gating keeps flesh, eyes, white beard and inked outlines intact.
    satur = np.clip((hsv[..., 1]-116)/112, 0, 1)
    mask = (np.maximum(0, 1-distance/width) * satur *
            np.clip((hsv[..., 2]-45)/91, 0, 1))[:, :, None]
    lum = rgb @ np.array([.2126,.7152,.0722], dtype=np.float32)
    col = np.array(list(bytes.fromhex(color)), dtype=np.float32)
    new = lum[:, :, None] * col / max(float(col @ np.array([.2126,.7152,.0722])), 1)
    blurred = np.asarray(im.filter(ImageFilter.GaussianBlur(1.25)), dtype=np.float32)
    line = np.clip((rgb-blurred), -14, 14) * (.12 + mask*.24)
    paper = fiber(lum.shape, seed)*grain*np.clip((lum-34)/82, 0, 1)
    return rgb + (np.clip(new,0,255)-rgb)*mask*mix + line + paper[:, :, None]


def character(glb, key, seed):
    recipe = TEXTURED[key]
    *_, lo, hi, metallic, spec, normal = recipe
    mat, = glb.doc['materials']
    pbr = mat['pbrMetallicRoughness']
    mat['extensions']['KHR_materials_specular']['specularFactor'] = spec
    mat['normalTexture']['scale'] = normal
    glb.character_albedo(pbr['baseColorTexture'], lambda im, rgb:pigment(im, rgb, recipe, seed))

    def finish(_im, rgb):
        rgb[..., 1] = np.maximum(rgb[..., 1], 255*lo)
        rgb[..., 1] = np.minimum(rgb[..., 1], 255*hi)
        rgb[..., 2] *= metallic
        return rgb
    glb.modify_texture(pbr['metallicRoughnessTexture'], finish)
    if key == 'hero6_stealth':
        pbr['baseColorFactor'] = [.94, .98, 1, .49]
        mat['emissiveFactor'] = [.043,.106,.21]


def surface(mat, recipe):
    rough, metal, rgba, glow = recipe
    pbr = mat['pbrMetallicRoughness']
    pbr.update(roughnessFactor=rough, metallicFactor=metal)
    if rgba is not None:
        pbr['baseColorFactor'] = list(rgba)
    ext = mat.get('extensions', {}).get('KHR_materials_specular')
    if ext:
        ext['specularFactor'] = round(.34+.36*(1-rough),3)
    if glow is not None:
        mat['emissiveFactor'] = [round(x*glow,5) for x in mat['emissiveFactor']]


def terrain(glb, key, source, target, path, seed):
    bright, dark, grain, rough, metal, normal = TERRAIN[key]
    def paper(_im, rgb):
        lum = (rgb @ np.array([.2126,.7152,.0722], dtype=np.float32))
        hue = np.clip((lum/160),0,1)[:, :, None]
        noise = fiber(lum.shape, seed)*grain*np.clip((lum+14)/89, .25, 1)
        return rgb*(np.array(dark) + (np.array(bright)-dark)*hue) + noise[:, :, None]

    mat, = glb.doc['materials']
    surface(mat, (rough, metal, None, None))
    mat['normalTexture']['scale'] = normal
    glb.modify_texture(mat['pbrMetallicRoughness']['baseColorTexture'], paper)
    prefix = path.name[:8]
    albedo = path.with_name(prefix + '_clean.png')
    (target/albedo).write_bytes(process_png((source/albedo).read_bytes(), paper))


def alter(glb, key, seed):
    if key in TEXTURED:
        character(glb,key,seed)
    elif key.startswith('orb'):
        core, shell, alpha, glow = ORB_COLORS[int(key[-1])-1]
        for m in glb.doc['materials']:
            if m['name'] == 'OrbAuraShell':
                surface(m, (.28,0,(*shell,alpha),None))
                m['emissiveFactor'] = [round(c*.23,5) for c in shell]
            else:
                assert m['name'] == 'OrbGourdCore'
                surface(m, (.28,.08,(*core,1),None))
                m['emissiveFactor'] = [round(c*glow,5) for c in core]
    else:
        used = set()
        for m in glb.doc['materials']:
            name = m['name']
            recipe = name if name in SURFACES[key] else name.split('_')[0]+'_*'
            surface(m,SURFACES[key][recipe])
            used.add(recipe)
        assert used == set(SURFACES[key]), (key,used)
        if key in {'stage_rock','stage_pillar','stage_mire','stage_door_closed','stage_door_open','prop_mirror'}:
            detailed = {'MireStone','MirrorStone','MirrorCarve','ArchStone','ArchStoneOpen'}
            detailed.update(n for n in used if n.startswith(('Mineral','Cavern')))
            stone = glb.detail_normal('Mineral pulp relief','stone')
            for m in glb.doc['materials']:
                if m['name'] in detailed:
                    m['normalTexture'] = {'index':stone,'scale':.59}
                if m['name'] == 'DoorWalnut':
                    m['normalTexture'] = {'index':glb.detail_normal('Walnut fiber relief','wood'),'scale':.76}


def check(base, candidate, key):
    old, new = deepcopy(base.doc), deepcopy(candidate.doc)
    images = {i['bufferView'] for i in old.get('images', [])}
    for tag in ('bufferViews','images','textures'):
        if tag in old:
            new[tag] = new[tag][:len(old[tag])]
        else:
            new.pop(tag,None)
    for d in (old,new):
        d.pop('materials')
        d.pop('buffers')
        for view in d['bufferViews']:
            del view['byteOffset']
            del view['byteLength']
        for image in d.get('images',[]):
            del image['mimeType']
    assert old == new, (key,'GLB scene interface changed')
    assert all(x == y for i,(x,y) in enumerate(zip(base.views,candidate.views)) if i not in images), (
        key,'non-image buffer bytes changed')
    for index in images:
        with Image.open(BytesIO(base.views[index])) as left, Image.open(BytesIO(candidate.views[index])) as right:
            assert (left.mode,left.size) == (right.mode,right.size), (key,index,'texture format changed')
            if left.mode == 'RGBA':
                assert left.getchannel('A').tobytes() == right.getchannel('A').tobytes(), (key,index,'alpha changed')
    assert base.doc['materials'] != candidate.doc['materials'], (key,'materials unchanged')


def run(source, target):
    rel = Path('assets/Models_3D')
    source = source.resolve()/rel
    target = target.resolve()/rel
    assert source != target and source.exists() and target.exists(), 'Use separate source and target checkouts'
    manifest = (source/'index.js').read_text()
    rows = [(key,Path(path)) for key,path in re.findall(r"^\s*(\w+):\s*\{ path: '([^']+\.glb)'",manifest,re.M)]
    assert len(rows) == len({key for key,_ in rows}) == len({p for _,p in rows}) == 48
    assert set(p for _,p in rows) == {p.relative_to(source) for p in source.rglob('*.glb')}
    old_bytes = new_bytes = 0
    for seed,(key,path) in enumerate(rows,1986):
        src, dst = source/path,target/path
        baseline = Glb(src)
        result = Glb(src)
        if key in TERRAIN:
            terrain(result,key,source,target,path,seed)
        else:
            alter(result,key,seed)
        result.write(dst)
        check(baseline, Glb(dst), key)
        old_bytes += src.stat().st_size
        new_bytes += dst.stat().st_size
        print(f'{key}: geometry/texture format verified',flush=True)
    print(f'48/48; assets {old_bytes:,} → {new_bytes:,} bytes')

if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('source',type=Path)
    cli.add_argument('target',type=Path)
    args=cli.parse_args()
    run(args.source,args.target)
