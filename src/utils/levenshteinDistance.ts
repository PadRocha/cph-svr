/**
 * Calculates the Damerau-Levenshtein distance between two strings.
 * The Damerau-Levenshtein distance is a measure of the similarity between two strings,
 * which is the minimum number of operations (insertions, deletions, substitutions, and transpositions)
 * required to transform one string into the other.
 *
 * @param s1 - The first string.
 * @param s2 - The second string.
 * @returns The Damerau-Levenshtein distance between the two strings.
 */
export function damerauLevenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Matriz de (len1 + 1) x (len2 + 1)
  const d = Array.from({ length: len1 + 1 }, () => new Array(len2 + 1).fill(0));

  // Inicializar la primera fila y la primera columna
  for (let i = 0; i <= len1; i++) d[i][0] = i;
  for (let j = 0; j <= len2; j++) d[0][j] = j;

  // Rellenar la matriz
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      // costo = 0 si son iguales, 1 si son diferentes
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;

      // Selección de la operación mínima entre:
      // 1) Eliminación, 2) Inserción, 3) Sustitución
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // eliminación
        d[i][j - 1] + 1, // inserción
        d[i - 1][j - 1] + cost, // sustitución
      );

      // Comprobar si hay transposición (i>1, j>1 y cruce de caracteres)
      if (
        i > 1 &&
        j > 1 &&
        s1[i - 1] === s2[j - 2] &&
        s1[i - 2] === s2[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }

  return d[len1][len2];
}
