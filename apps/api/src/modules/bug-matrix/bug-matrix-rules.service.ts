import { Injectable } from '@nestjs/common';
import { randomInt, randomUUID } from 'crypto';
import { BugMatrixQuestion, BugMatrixRule, BugMatrixTheme } from '@wiki-race/shared';
import { QUESTIONS, RULES, THEMES } from './bug-matrix-data';

@Injectable()
export class BugMatrixRulesService {
  pickTheme(): BugMatrixTheme {
    return THEMES[randomInt(0, THEMES.length)];
  }

  /** Pick `count` distinct rules. Falls back gracefully if pool is small. */
  pickRules(count: number): BugMatrixRule[] {
    const pool = [...RULES];
    const out: BugMatrixRule[] = [];
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i += 1) {
      const idx = randomInt(0, pool.length);
      out.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return out;
  }

  /** Pick `count` distinct questions wrapped with fresh ids for tracking. */
  pickQuestions(count: number): BugMatrixQuestion[] {
    const pool = [...QUESTIONS];
    const out: BugMatrixQuestion[] = [];
    const n = Math.min(count, pool.length);
    for (let i = 0; i < n; i += 1) {
      const idx = randomInt(0, pool.length);
      out.push({ id: randomUUID(), text: pool[idx] });
      pool.splice(idx, 1);
    }
    return out;
  }
}
