import { ADDFIELDS, AddFields } from './pipeline/addfields.ts';
import { FACET, Facet } from './pipeline/facet.ts';
import { LOOKUP, Lookup } from './pipeline/lookup.ts';
import { PROJECT, Project } from './pipeline/project.ts';

/**
 * Interfaz que define la estructura de un pipeline de agregación,
 * incluyendo diversas etapas (o "stages") propias de MongoDB.
 */
interface Pipeline {
  /**
   * Representa la sección `$addFields` en el pipeline, que permite
   * agregar campos nuevos basados en expresiones.
   */
  readonly ADDFIELDS: AddFields;

  /**
   * Representa la sección `$facet`, que permite procesar múltiples
   * agregaciones en paralelo y devolver resultados separados.
   */
  readonly FACET: Facet;

  /**
   * Representa la sección `$lookup`, para realizar joins (enlazar
   * documentos de otras colecciones).
   */
  readonly LOOKUP: Lookup;

  /**
   * Representa la sección `$project`, que especifica cómo proyectar
   * o transformar los campos de salida.
   */
  readonly PROJECT: Project;
}

/**
 * Objeto que consolida todas las etapas de agregación disponibles.
 * Se exporta como `pipeline` para que cada parte se pueda usar
 * en distintas consultas de MongoDB.
 */
export const pipeline: Pipeline = {
  ADDFIELDS,
  FACET,
  LOOKUP,
  PROJECT,
};
