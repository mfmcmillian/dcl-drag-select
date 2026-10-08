# Decentraland drag-select demo

A minimal Decentraland SDK7 example of click-and-drag marquee selection.

## Run locally

```bash
npm install
npm start
```

Desktop: press `Esc` to free the mouse cursor, then drag across the numbered blocks.

Mobile: tap **AREA SELECT**, tap the first block, then tap the opposite block. A normal block tap selects just that block.

## Core pattern

1. `onMouseDown` records the starting pointer position.
2. `dragSystem` reads `PrimaryPointerInfo.screenCoordinates` each frame.
3. The start and current positions define the selection rectangle.
4. Rectangle intersection determines which blocks are selected.
5. `onMouseUp` ends the drag.

On mobile, block taps provide the two rectangle corners because React-ECS does not currently expose a reliable touch-move event.

The complete example is intentionally contained in `src/ui.tsx`.
