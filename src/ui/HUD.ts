/**
 * HUD - Heads-up display for game metrics
 */

import type { GameState } from '@/core/GameState';

export class HUD {
  private gameState: GameState;
  private scoreEl: HTMLElement | null;
  private distanceEl: HTMLElement | null;
  private speedEl: HTMLElement | null;
  private menuEl: HTMLElement | null;
  private startBtn: HTMLButtonElement | null;
  private gameOverMenuEl: HTMLElement | null;

  constructor(gameState: GameState) {
    this.gameState = gameState;

    // Get HUD elements
    this.scoreEl = document.getElementById('score');
    this.distanceEl = document.getElementById('distance');
    this.speedEl = document.getElementById('speed');
    this.menuEl = document.getElementById('menu');
    this.startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    this.gameOverMenuEl = null;

    // Setup menu button
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        this.hideMenu();
        this.gameState.start();
      });
    }

    // Listen to game state events
    gameState.on('gameStart', () => this.onGameStart());
    gameState.on('gameStop', () => this.onGameStop());
    gameState.on('gameUpdate', () => this.onGameUpdate());

    console.log('🎯 HUD initialized');
  }

  /**
   * Hide start menu
   */
  private hideMenu(): void {
    if (this.menuEl) {
      this.menuEl.classList.add('hidden');
    }
  }

  /**
   * Show game over menu
   */
  showGameOver(): void {
    const finalScore = Math.floor(this.gameState.getState().score);
    const finalDistance = Math.floor(this.gameState.getState().distance);

    const gameOverHtml = `
      <div id="gameOverMenu" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95); padding: 40px; border-radius: 10px; text-align: center;
        color: #fff; border: 3px solid #ff3333; pointer-events: auto; min-width: 300px;">
        <h1 style="font-size: 48px; color: #ff3333; margin: 0 0 20px 0;">💀 Game Over</h1>
        <p style="font-size: 24px; margin: 10px 0;">Distance: ${finalDistance}m</p>
        <p style="font-size: 24px; margin: 10px 0; color: #ffd54f;">Score: ${finalScore}</p>
        <button id="restartBtn" style="background: #ff3333; color: #fff; border: none; padding: 12px 30px;
          font-size: 18px; font-weight: bold; border-radius: 5px; cursor: pointer; margin-top: 20px; pointer-events: auto;">
          Try Again
        </button>
      </div>
    `;

    const uiDiv = document.getElementById('ui');
    if (uiDiv) {
      uiDiv.innerHTML += gameOverHtml;
      const restartBtn = document.getElementById('restartBtn');
      if (restartBtn) {
        restartBtn.addEventListener('click', () => {
          location.reload(); // Simple restart
        });
      }
    }
  }

  /**
   * Update HUD displays
   */
  private onGameUpdate(): void {
    const state = this.gameState.getState();

    if (this.scoreEl) {
      this.scoreEl.textContent = Math.floor(state.score).toString();
    }
    if (this.distanceEl) {
      this.distanceEl.textContent = Math.floor(state.distance).toString();
    }
    if (this.speedEl) {
      this.speedEl.textContent = Math.floor(state.speed).toString();
    }
  }

  /**
   * On game start
   */
  private onGameStart(): void {
    this.hideMenu();
  }

  /**
   * On game stop (game over)
   */
  private onGameStop(): void {
    this.showGameOver();
  }
}
