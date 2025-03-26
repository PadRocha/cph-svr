/**
 * Compara dos versiones en formato semántico y retorna true si la nueva es mayor que la actual.
 * Se asume que los números de versión tienen el formato "vX.Y.Z" o "X.Y.Z".
 */
export function isNewerVersion(
  newVersion: string,
  currentVersion: string,
): boolean {
  const cleanNew = newVersion.startsWith("v")
    ? newVersion.slice(1)
    : newVersion;
  const cleanCurrent = currentVersion.startsWith("v")
    ? currentVersion.slice(1)
    : currentVersion;
  const newParts = cleanNew.split(".").map(Number);
  const currentParts = cleanCurrent.split(".").map(Number);

  for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
    const newPart = newParts[i] || 0;
    const currentPart = currentParts[i] || 0;
    if (newPart > currentPart) return true;
    if (newPart < currentPart) return false;
  }
  return false;
}
