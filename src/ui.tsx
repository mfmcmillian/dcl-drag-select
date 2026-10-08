import { engine, PrimaryPointerInfo, UiCanvasInformation } from '@dcl/sdk/ecs'
import { Color4 } from '@dcl/sdk/math'
import { isMobile } from '@dcl/sdk/platform'
import ReactEcs, { Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'

type Point = { x: number; y: number }
type Box = Point & { width: number; height: number }
type SelectableItem = Box & { id: number }

const BOARD_WIDTH = 640
const BOARD_HEIGHT = 400
const ITEM_SIZE = 88
const ITEM_POSITIONS: Point[] = [
  { x: 65, y: 85 },
  { x: 205, y: 70 },
  { x: 375, y: 95 },
  { x: 115, y: 235 },
  { x: 285, y: 220 },
  { x: 465, y: 245 }
]
const ITEMS: SelectableItem[] = ITEM_POSITIONS.map((position, index) => ({
  ...position,
  id: index + 1,
  width: ITEM_SIZE,
  height: ITEM_SIZE
}))

let dragging = false
let dragStart: Point = { x: 0, y: 0 }
let dragEnd: Point = { x: 0, y: 0 }
let selected = new Set<number>()
let mobileSelecting = false
let mobileAnchor: SelectableItem | null = null
let showSelectionBox = false

function boardOrigin(): Point {
  const canvas = UiCanvasInformation.getOrNull(engine.RootEntity)
  return {
    x: ((canvas?.width ?? 1920) - BOARD_WIDTH) / 2,
    y: ((canvas?.height ?? 1080) - BOARD_HEIGHT) / 2
  }
}

function pointerOnBoard(): Point | null {
  const pointer = PrimaryPointerInfo.getOrNull(engine.RootEntity)?.screenCoordinates
  if (!pointer) return null

  const origin = boardOrigin()
  return { x: pointer.x - origin.x, y: pointer.y - origin.y }
}

function selectionBox(): Box {
  return {
    x: Math.min(dragStart.x, dragEnd.x),
    y: Math.min(dragStart.y, dragEnd.y),
    width: Math.abs(dragEnd.x - dragStart.x),
    height: Math.abs(dragEnd.y - dragStart.y)
  }
}

function overlaps(a: Box, b: Box) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function isInsideBoard(point: Point) {
  return point.x >= 0 && point.y >= 0 && point.x <= BOARD_WIDTH && point.y <= BOARD_HEIGHT
}

function updateSelection() {
  const box = selectionBox()
  selected = new Set(ITEMS.filter((item) => overlaps(box, item)).map((item) => item.id))
}

function itemCenter(item: SelectableItem): Point {
  return {
    x: item.x + item.width / 2,
    y: item.y + item.height / 2
  }
}

function beginDrag() {
  if (isMobile()) return

  const point = pointerOnBoard()
  if (!point || !isInsideBoard(point)) return

  dragging = true
  showSelectionBox = true
  dragStart = point
  dragEnd = point
  selected.clear()
}

function endDrag() {
  dragging = false
}

function startMobileAreaSelection() {
  mobileSelecting = true
  mobileAnchor = null
  showSelectionBox = false
  selected.clear()
}

function selectMobileItem(item: SelectableItem) {
  if (!isMobile()) return

  if (!mobileSelecting) {
    selected = new Set([item.id])
    showSelectionBox = false
    return
  }

  if (!mobileAnchor) {
    mobileAnchor = item
    dragStart = itemCenter(item)
    dragEnd = dragStart
    selected = new Set([item.id])
    showSelectionBox = true
    return
  }

  if (mobileAnchor.id === item.id) {
    selected = new Set([item.id])
    mobileSelecting = false
    mobileAnchor = null
    showSelectionBox = false
    return
  }

  dragEnd = itemCenter(item)
  updateSelection()
  mobileSelecting = false
  mobileAnchor = null
}

export function dragSystem() {
  if (isMobile() || !dragging) return

  const point = pointerOnBoard()
  if (!point) return

  dragEnd = point
  updateSelection()
}

const SelectionUi = () => {
  const box = selectionBox()
  const mobile = isMobile()
  const instruction = mobile
    ? mobileSelecting
      ? mobileAnchor
        ? 'TAP OPPOSITE BLOCK'
        : 'TAP FIRST BLOCK'
      : 'TAP A BLOCK'
    : 'DRAG TO SELECT'

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        pointerFilter: 'block'
      }}
      onMouseDown={beginDrag}
      onMouseUp={endDrag}
    >
      <UiEntity
        uiTransform={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, positionType: 'relative' }}
        uiBackground={{ color: Color4.create(0.06, 0.07, 0.09, 0.96) }}
      >
        <Label
          value={instruction}
          fontSize={mobile ? 18 : 24}
          color={Color4.White()}
          uiTransform={{ positionType: 'absolute', position: { top: 18, left: 20 }, width: 260, height: 34 }}
        />
        {mobile && (
          <UiEntity
            uiTransform={{
              positionType: 'absolute',
              position: { top: 12, left: 250 },
              width: 150,
              height: 42,
              justifyContent: 'center',
              alignItems: 'center',
              pointerFilter: 'block'
            }}
            uiBackground={{
              color: mobileSelecting ? Color4.create(0.15, 0.75, 1, 1) : Color4.create(0.2, 0.23, 0.28, 1)
            }}
            onMouseDown={startMobileAreaSelection}
          >
            <Label value="AREA SELECT" fontSize={16} color={Color4.White()} />
          </UiEntity>
        )}
        <Label
          value={`${selected.size} selected`}
          fontSize={18}
          color={Color4.create(0.45, 0.85, 1, 1)}
          uiTransform={{ positionType: 'absolute', position: { top: 22, right: 20 }, width: 140, height: 28 }}
        />

        {ITEMS.map((item) => (
          <UiEntity
            key={item.id}
            uiTransform={{
              positionType: 'absolute',
              position: { left: item.x, top: item.y },
              width: item.width,
              height: item.height,
              justifyContent: 'center',
              alignItems: 'center',
              pointerFilter: mobile ? 'block' : 'none'
            }}
            uiBackground={{
              color: selected.has(item.id) ? Color4.create(0.15, 0.75, 1, 1) : Color4.create(0.28, 0.31, 0.36, 1)
            }}
            onMouseDown={() => selectMobileItem(item)}
          >
            <Label value={`${item.id}`} fontSize={24} color={Color4.White()} />
          </UiEntity>
        ))}

        {showSelectionBox && (
          <UiEntity
            uiTransform={{
              positionType: 'absolute',
              position: { left: box.x, top: box.y },
              width: Math.max(1, box.width),
              height: Math.max(1, box.height),
              pointerFilter: 'none',
              borderWidth: 2,
              borderColor: Color4.create(0.25, 0.8, 1, 1)
            }}
            uiBackground={{ color: Color4.create(0.2, 0.7, 1, 0.2) }}
          />
        )}
      </UiEntity>
    </UiEntity>
  )
}

export function setupUi() {
  ReactEcsRenderer.setUiRenderer(SelectionUi)
}
