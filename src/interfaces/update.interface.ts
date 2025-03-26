/** Representa la información de versión para una única actualización. */
interface Version {
  /** Número de versión semántica (p.ej., "v0.3.0" o "0.3.0"). */
  version: string;
  /** URL para descargar el paquete de actualización. */
  url: string;
  /** Firma criptográfica para verificar la actualización. */
  signature: string;
  /** Fecha de publicación de la actualización. */
  pub_date: Date;
  /** Notas de lanzamiento o descripción de la actualización. */
  notes: string;
}

/** Define la información de actualización para cada plataforma soportada. */
interface PlatformVersions {
  /** Plataformas con arquitecturas específicas y sus datos de versión asociados. */
  platforms: {
    /** Plataforma y arquitectura de destino (p.ej., "windows-x86_64") con sus datos de actualización. */
    [target_arch: string]: {
      /** Versión actual disponible para esta plataforma. */
      current_version: string;
      /** URL para descargar la versión actual. */
      url: string;
      /** Firma digital de la versión actual. */
      signature: string;
      /** Fecha de publicación de la versión actual. */
      pub_date: Date;
      /** Notas de lanzamiento de la versión actual. */
      notes: string;
      /** Historial de versiones anteriores para esta plataforma. */
      version_history: Version[];
    };
  };
}

export type { PlatformVersions, Version };
