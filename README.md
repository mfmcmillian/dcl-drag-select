# Decentraland drag-select demo

A minimal Decentraland SDK7 example of click-and-drag marquee selection.

## Run locally

```bash
npm install
npm start
```

Press `Esc` to free the mouse cursor, then drag across the numbered blocks.

## Core pattern

1. `onMouseDown` records the starting pointer position.
2. `dragSystem` reads `PrimaryPointerInfo.screenCoordinates` each frame.
3. The start and current positions define the selection rectangle.
4. Rectangle intersection determines which blocks are selected.
5. `onMouseUp` ends the drag.

The complete example is intentionally contained in `src/ui.tsx`.
