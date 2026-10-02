import { describe, it, expect } from 'vitest';
import { normalizeText, matchesPartialText } from './text';

describe('text utility functions', () => {
  describe('normalizeText', () => {
    it('lowercases text and removes diacritical marks', () => {
      expect(normalizeText('Café')).toBe('cafe');
      expect(normalizeText('MÚSICA')).toBe('musica');
      expect(normalizeText('Canción')).toBe('cancion');
      expect(normalizeText('  Supermercado  ')).toBe('supermercado');
    });

    it('handles null and undefined gracefully', () => {
      expect(normalizeText(null)).toBe('');
      expect(normalizeText(undefined)).toBe('');
      expect(normalizeText('')).toBe('');
    });
  });

  describe('matchesPartialText', () => {
    it('returns true when query is a partial substring', () => {
      expect(matchesPartialText('Supermercado Coto', 'merc')).toBe(true);
      expect(matchesPartialText('Supermercado Coto', 'COTO')).toBe(true);
      expect(matchesPartialText('Almuerzo en Café Martínez', 'cafe')).toBe(true);
      expect(matchesPartialText('Pago de Tarjeta VISA', 'tarjeta')).toBe(true);
    });

    it('returns false when query does not match', () => {
      expect(matchesPartialText('Supermercado Coto', 'farmacia')).toBe(false);
    });

    it('returns true when query is empty or whitespace', () => {
      expect(matchesPartialText('Supermercado', '')).toBe(true);
      expect(matchesPartialText('Supermercado', '   ')).toBe(true);
      expect(matchesPartialText('Supermercado', null)).toBe(true);
    });

    it('returns false when source is null/undefined and query is non-empty', () => {
      expect(matchesPartialText(null, 'cafe')).toBe(false);
      expect(matchesPartialText(undefined, 'cafe')).toBe(false);
    });
  });
});
