import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire, registerHooks } from 'node:module';

const { createCanvas } = createRequire(import.meta.url)('@napi-rs/canvas');

registerHooks({ resolve(name, context, next) {
  if (name === 'three') return { url: new URL('../vendor/three.module.js', import.meta.url).href, shortCircuit: true };
  if (name.startsWith('three/addons/')) return { url: new URL('../vendor/' + name.slice(6), import.meta.url).href, shortCircuit: true };
  return next(name, context);
}});
const { GLTFLoader } = await import('../vendor/addons/loaders/GLTFLoader.js');
const { AssetRegistry } = await import('../src/core/AssetRegistry.js');
const { MountainSanctuary } = await import('../src/worlds/MountainSanctuary.js');
// Geometry-only check: provide a pixel for embedded textures without a DOM.
globalThis.createImageBitmap = async () => ({ width: 1, height: 1 });
const bytes = await readFile(new URL('../assets/Models_3D/Props/Prop_01_七色葫芦仙藤.glb', import.meta.url));
const model = await new Promise((resolve, reject) => new GLTFLoader().parse(Uint8Array.from(bytes).buffer, '', resolve, reject));
const assets = Object.create(AssetRegistry.prototype);
assets.models = new Map();
assets.getTexture = () => undefined;
assets.models.set('prop_vine', model.scene);

globalThis.document = { createElement: () => createCanvas(1, 1) };
const mountain = new MountainSanctuary(assets);
const backdrop = mountain.group.getObjectByName('Model3D_prop_vine');
const names = [];
backdrop.traverse(object => { if (object.isMesh) names.push(object.name); });
assert(!names.some(name => /^Gourd_/.test(name)), 'Backdrop must contain no baked fruit or fruit stems');
assert.equal(names.filter(name => /^Leaf_/.test(name)).length, 10);
assert.equal(names.filter(name => /^Tendril_/.test(name)).length, 4);
assert.equal(names.filter(name => /^VineBranch_/.test(name)).length, 4);
assert.equal(model.scene.children.filter(child => /^Gourd_/.test(child.name)).length, 14, 'Original model stays intact');
assert.deepEqual(mountain._gourds.map(gourd => gourd.palette.name), ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple']);
for (let i = 0; i < 7; i++) mountain.setGourdState(i, { visible: true });
const count = () => mountain._gourds.filter(gourd => gourd.anchor.visible).length;
assert.equal(count(), 7);
mountain.setGourdState(0, { visible: false, scale: 0 });
assert.equal(count(), 6);
console.log('Only the seven animated fruits; foliage intact; six remain after the first hatching.');
