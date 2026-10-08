import { engine } from '@dcl/sdk/ecs'
import { dragSystem, setupUi } from './ui'

export function main() {
  setupUi()
  engine.addSystem(dragSystem)
}
