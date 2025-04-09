import { UserDocument } from '@interfaces/user.interface.ts';

interface CacheEntry {
  data: UserDocument;
  exp: number; // Tiempo de expiración en segundos
}

class CacheManager {
  private static instance: CacheManager;
  private user_map: Map<string, CacheEntry> = new Map();

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }
  // Guarda la data del usuario con un tiempo de expiración
  setUser(user_id: string, data: UserDocument, expires_in_seconds: number) {
    const now = Date.now() / 1000; // segundos
    const exp = now + expires_in_seconds;
    this.user_map.set(user_id, { data, exp });
  }
  // Recupera la data si sigue vigente
  getUser(user_id?: string): UserDocument | null {
    if (!user_id) return null;
    const cached = this.user_map.get(user_id);
    if (!cached) return null;
    const now = Date.now() / 1000;
    if (cached.exp < now) {
      // Si ya expiró, lo eliminamos y devolvemos null
      this.user_map.delete(user_id);
      return null;
    }
    return cached.data;
  }
  // Invalida el caché de un user en particular
  deleteUser(user_id: string): void {
    this.user_map.delete(user_id);
  }
}

export const cacheManager = CacheManager.getInstance();
