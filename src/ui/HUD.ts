/**
 * HUD - Heads-up display for game metrics
 */

import type { GameState } from '@/core/GameState';
import type { SoundManager } from '@/audio/SoundManager';
import type { Leaderboard } from './Leaderboard';

export class HUD {
  private gameState: GameState;
  private soundManager: SoundManager | null = null;
  private leaderboard: Leaderboard | null = null;

  private scoreEl: HTMLElement | null;
  private distanceEl: HTMLElement | null;
  private speedEl: HTMLElement | null;
  private difficultyEl: HTMLElement | null;
  private menuEl: HTMLElement | null;
  private startBtn: HTMLButtonElement | null;
  private pauseBtn: HTMLElement | null;
  private gameOverMenuEl: HTMLElement | null;

  constructor(gameState: GameState) {
    this.gameState = gameState;

    // Get HUD elements
    this.scoreEl = document.getElementById('score');
    this.distanceEl = document.getElementById('distance');
    this.speedEl = document.getElementById('speed');
    this.difficultyEl = document.getElementById('difficulty');
    this.menuEl = document.getElementById('menu');
    this.startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    this.pauseBtn = document.getElementById('pauseBtn');
    this.gameOverMenuEl = null;

    // Setup menu button
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        this.hideMenu();
        this.gameState.start();
      });
    }

    // Setup pause button
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => {
        const state = this.gameState.getState();
        if (state.isRunning) {
          if (state.isPaused) {
            this.gameState.resume();
            this.pauseBtn!.textContent = '⏸️  Pause';
          } else {
            this.gameState.pause();
            this.pauseBtn!.textContent = '▶️  Resume';
          }
        }
      });
    }

    // Listen to game state events
    gameState.on('gameStart', () => this.onGameStart());
    gameState.on('gameStop', () => this.onGameStop());
    gameState.on('gameUpdate', () => this.onGameUpdate());
    gameState.on('powerUpCollected', (data: any) => this.onPowerUpCollected(data));

    console.log('🎯 HUD initialized');
  }

  /**
   * Set sound manager for audio feedback
   */
  setSoundManager(soundManager: SoundManager): void {
    this.soundManager = soundManager;
  }

  /**
   * Set leaderboard for score tracking
   */
  setLeaderboard(leaderboard: Leaderboard): void {
    this.leaderboard = leaderboard;
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
    const state = this.gameState.getState();
    const finalScore = Math.floor(state.score);
    const finalDistance = Math.floor(state.distance);
    const finalDifficulty = state.difficulty.toFixed(1);

    // Check if high score
    let isHighScore = false;
    let rank = '-';
    if (this.leaderboard) {
      isHighScore = this.leaderboard.qualifiesForLeaderboard(finalScore);
      rank = this.leaderboard.getRank(finalScore).toString();
    }

    const highScoreHtml = isHighScore
      ? `<p style="font-size: 20px; margin: 10px 0; color: #ffd54f;">🏆 HIGH SCORE! Rank #${rank}</p>`
      : '';

    const gameOverHtml = `
      <div id="gameOverMenu" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.98); padding: 40px; border-radius: 15px; text-align: center;
        color: #fff; border: 3px solid #ff3333; pointer-events: auto; min-width: 350px; z-index: 1000;">
        <h1 style="font-size: 48px; color: #ff3333; margin: 0 0 20px 0;">💀 Game Over</h1>
        <p style="font-size: 22px; margin: 10px 0;">Distance: <span style="color: #ffd54f;">${finalDistance}m</span></p>
        <p style="font-size: 22px; margin: 10px 0;">Difficulty: <span style="color: #66bb6a;">${finalDifficulty}</span></p>
        <p style="font-size: 24px; margin: 15px 0; color: #ff6b6b; font-weight: bold;">Score: ${finalScore}</p>
        ${highScoreHtml}
        <input id="playerName" type="text" placeholder="Enter your name (optional)" maxlength="20"
          style="width: 90%; padding: 10px; margin: 15px 0; border: none; border-radius: 5px; text-align: center;">
        <div>
          <button id="saveBtn" style="background: #66bb6a; color: #fff; border: none; padding: 12px 25px;
            font-size: 16px; font-weight: bold; border-radius: 5px; cursor: pointer; margin: 10px; pointer-events: auto;">
            Save Score
          </button>
          <button id="restartBtn" style="background: #ff3333; color: #fff; border: none; padding: 12px 25px;
            font-size: 16px; font-weight: bold; border-radius: 5px; cursor: pointer; margin: 10px; pointer-events: auto;">
            Try Again
          </button>
        </div>
      </div>
    `;

    const uiDiv = document.getElementById('ui');
    if (uiDiv) {
      uiDiv.innerHTML += gameOverHtml;

      const nameInput = document.getElementById('playerName') as HTMLInputElement;
      const saveBtn = document.getElementById('saveBtn');
      const restartBtn = document.getElementById('restartBtn');

      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          const name = nameInput?.value || 'Anonymous';
          if (this.leaderboard) {
            this.leaderboard.addScore(name, finalScore, finalDistance, finalDifficulty as any);
          }
          location.reload();
        });
      }

      if (restartBtn) {
        restartBtn.addEventListener('click', () => {
          location.reload();
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
    if (this.difficultyEl) {
      this.difficultyEl.textContent = state.difficulty.toFixed(1);
    }
  }

  /**
   * On power-up collected
   */
  private onPowerUpCollected(data: any): void {
    if (this.soundManager) {
      this.soundManager.playPowerUpSFX();
    }

    // Show notification (optional)
    const message = `+${data.score} ${data.type}`;
    console.log(`✨ ${message}`);
  }

  /**
   * On game start
   */
  private onGameStart(): void {
    this.hideMenu();
    if (this.soundManager) {
      this.soundManager.playBGM();
    }
  }

  /**
   * On game stop (game over)
   */
  private onGameStop(): void {
    if (this.soundManager) {
      this.soundManager.stopBGM();
      this.soundManager.playGameOverSFX();
    }
    this.showGameOver();
  }
}
