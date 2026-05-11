import { GAME_CONFIG } from '@/core/config'
import type { PlayerEntity, ViewportBounds } from '@/models/game'

export class PlayerController {
  private getPlayerWidth(): number {
    return GAME_CONFIG.player.height * GAME_CONFIG.player.frameAspectRatio
  }

  private getBaseY(viewport: ViewportBounds, playerHeight: number): number {
    return Math.max(0, viewport.height - playerHeight - GAME_CONFIG.player.bottomOffset)
  }

  createPlayer(viewport: ViewportBounds): PlayerEntity {
    const width = Math.min(this.getPlayerWidth(), Math.max(0, viewport.width))
    const height = GAME_CONFIG.player.height
    const baseY = this.getBaseY(viewport, height)

    return {
      id: 'player',
      size: { width, height },
      position: {
        x: Math.max(0, (viewport.width - width) / 2),
        y: baseY
      }
    }
  }

  updatePlayer(player: PlayerEntity, viewport: ViewportBounds): void {
    player.size.width = Math.min(this.getPlayerWidth(), Math.max(0, viewport.width))
    player.size.height = GAME_CONFIG.player.height
    player.position.x = Math.max(0, (viewport.width - player.size.width) / 2)
    player.position.y = this.getBaseY(viewport, player.size.height)
  }
}
