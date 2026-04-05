/**
 * Leaderboard - Local high scores using localStorage
 */

export interface HighScore {
  name: string;
  score: number;
  distance: number;
  difficulty: number;
  date: string;
}

export class Leaderboard {
  private storageKey = 'noodle-racers-leaderboard';
  private maxScores = 10;
  private scores: HighScore[] = [];

  constructor() {
    this.loadScores();
    console.log('🏆 Leaderboard initialized');
  }

  /**
   * Load scores from localStorage
   */
  private loadScores(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.scores = JSON.parse(data);
        this.scores.sort((a, b) => b.score - a.score);
      }
    } catch (e) {
      console.warn('Failed to load leaderboard:', e);
      this.scores = [];
    }
  }

  /**
   * Save scores to localStorage
   */
  private saveScores(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
    } catch (e) {
      console.warn('Failed to save leaderboard:', e);
    }
  }

  /**
   * Add a new score
   */
  addScore(name: string, score: number, distance: number, difficulty: number): void {
    const newScore: HighScore = {
      name: name.slice(0, 20), // Max 20 chars
      score: Math.floor(score),
      distance: Math.floor(distance),
      difficulty: Number(difficulty.toFixed(1)),
      date: new Date().toLocaleDateString(),
    };

    this.scores.push(newScore);
    this.scores.sort((a, b) => b.score - a.score);
    this.scores = this.scores.slice(0, this.maxScores);

    this.saveScores();
    console.log(`🏆 New high score added: ${name} - ${score}`);
  }

  /**
   * Check if a score qualifies for leaderboard
   */
  qualifiesForLeaderboard(score: number): boolean {
    if (this.scores.length < this.maxScores) return true;
    return score > this.scores[this.scores.length - 1].score;
  }

  /**
   * Get rank of a score
   */
  getRank(score: number): number {
    return this.scores.findIndex((s) => s.score <= score) + 1;
  }

  /**
   * Get all scores
   */
  getScores(): HighScore[] {
    return [...this.scores];
  }

  /**
   * Get top score
   */
  getTopScore(): HighScore | null {
    return this.scores[0] || null;
  }

  /**
   * Clear all scores
   */
  clear(): void {
    this.scores = [];
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Format score for display
   */
  formatScore(score: number): string {
    return score.toLocaleString();
  }

  /**
   * Format distance for display
   */
  formatDistance(distance: number): string {
    return `${Math.floor(distance)}m`;
  }
}
