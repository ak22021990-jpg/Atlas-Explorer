# Canva SVG to Animated Game Component

The current Canva download is an SVG wrapper around an embedded PNG. That means it can be animated cleanly as a whole sprite, but SVGR cannot target internal arms, eyes, flames, etc. unless Canva exports those pieces as real SVG layers.

## Generate the Asset

Run this after replacing or re-downloading the Canva file:

```powershell
npm.cmd run asset:canva -- --input "$env:USERPROFILE\Downloads\Untitled design.svg" --name canva-game-asset
```

This creates:

- `assets/generated/canva-game-asset.svg`
- `assets/generated/canva-game-asset.json`
- `js/generated/canva-game-assets.js`

## Use in the Existing Vanilla Game

Import the component once in any ES module:

```js
import { createCanvaGameSprite } from './canva-game-sprite.js';

const sprite = createCanvaGameSprite({
  asset: 'canvaGameAsset',
  motion: 'float',
  state: 'idle',
  size: '180px',
  alt: 'Animated game mascot'
});

document.querySelector('.mission-brief').prepend(sprite);
```

Or use the element in markup after importing `js/canva-game-sprite.js`:

```html
<canva-game-sprite
  asset="canvaGameAsset"
  motion="pop"
  size="160px"
  alt="Animated game reward">
</canva-game-sprite>
```

Useful runtime calls:

```js
sprite.play('drift');
sprite.success();
sprite.hit();
sprite.danger();
sprite.pause();
sprite.setPosition(120, 240);
const box = sprite.getHitbox();
```

Available motions: `float`, `pulse`, `pop`, `drift`, `none`.

Available states: `idle`, `success`, `hit`, `danger`.

## React and SVGR Option

If you later move this game into React, keep the generated SVG and run SVGR there:

```powershell
npm.cmd install -D @svgr/cli svgo
npx svgr assets/generated/canva-game-asset.svg --out-dir src/components --icon false
```

Then animate the wrapper with CSS, Framer Motion, or GSAP:

```jsx
import { motion } from 'framer-motion';
import CanvaGameAsset from './components/CanvaGameAsset';

export function AnimatedCanvaAsset() {
  return (
    <motion.div
      animate={{ y: [0, -12, 0], rotate: [-1, 1, -1] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <CanvaGameAsset role="img" aria-label="Animated game asset" />
    </motion.div>
  );
}
```

For layer-level animation, re-export from Canva as separate transparent assets, for example `body.svg`, `eyes.svg`, `spark.svg`, and `shadow.svg`, then stack them in one component and animate each layer independently.
