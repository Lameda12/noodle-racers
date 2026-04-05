/**
 * UIManager - UI orchestration and management
 *
 * Manages:
 * - HUD (score, distance, speed)
 * - Menus (start, pause, game over)
 * - Settings
 * - Leaderboard
 */

export class UIManager {
  private score: number = 0;
  private distance: number = 0;
  private speed: number = 0;

  constructor() {
    console.log('🎯 UIManager initialized');
  }

  /**
   * Update HUD displays
   */
  updateHUD(score: number, distance: number, speed: number): void {
    this.score = score;
    this.distance = distance;
    this.speed = speed;

    // TODO: Update DOM elements
    // document.getElementById('score').textContent = score.toString();
    // document.getElementById('distance').textContent = distance.toString();
    // document.getElementById('speed').textContent = speed.toFixed(1);
  }

  /**
   * Show start menu
   */
  showStartMenu(): void {
    console.log('📋 Showing start menu');
    // TODO: Show/hide menu DOM
  }

  /**
   * Show game over screen
   */
  showGameOver(finalScore: number): void {
    console.log(`💀 Game Over - Score: ${finalScore}`);
    // TODO: Display game over screen
  }

  /**
   * Show pause menu
   */
  showPauseMenu(): void {
    console.log('⏸️  Showing pause menu');
    // TODO: Display pause menu
  }
}
