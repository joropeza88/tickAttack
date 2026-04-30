import { GAME_CONFIG } from '@/core/config'
import type { PlayerEntity, ViewportBounds } from '@/models/game'

export class PlayerController {
  private getBaseY(viewport: ViewportBounds, playerHeight: number): number {
    return Math.max(0, viewport.height - playerHeight - GAME_CONFIG.player.bottomOffset)
  }

  createPlayer(viewport: ViewportBounds): PlayerEntity {
    const width = Math.max(0, viewport.width)
    const height = GAME_CONFIG.player.height
    const baseY = this.getBaseY(viewport, height)

    return {
      id: 'player',
      size: { width, height },
      position: {
        x: 0,
        y: baseY
      }
    }
  }

  updatePlayer(player: PlayerEntity, viewport: ViewportBounds): void {
    player.size.width = Math.max(0, viewport.width)
    player.size.height = GAME_CONFIG.player.height
    player.position.x = 0
    player.position.y = this.getBaseY(viewport, player.size.height)
  }
}
