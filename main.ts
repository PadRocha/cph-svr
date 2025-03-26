/**
 * @module server
 * @description Este módulo se encarga de inicializar la conexión a la base de datos MongoDB utilizando Mongoose,
 * sincronizar los índices de los modelos definidos, manejar las señales de terminación para un cierre limpio
 * de la conexión a la base de datos, y servir la aplicación utilizando Deno.
 *
 * ## Descripción General
 *
 * El script realiza las siguientes operaciones principales:
 *
 * 1. **Conexión a la Base de Datos:** Establece una conexión a MongoDB utilizando las configuraciones proporcionadas.
 * 2. **Sincronización de Índices:** Recorre todos los modelos registrados en Mongoose y sincroniza sus índices.
 * 3. **Manejo de Señales de Terminación:** Añade escuchadores para señales como `SIGINT` y `SIGBREAK` para asegurar
 *    que la conexión a la base de datos se cierre correctamente al finalizar la ejecución.
 * 4. **Servidor Web:** Inicia un servidor web utilizando Deno que maneja las solicitudes entrantes a través de `app.fetch`.
 *
 * ## Manejo de Errores
 *
 * Si ocurre algún error durante la conexión a la base de datos o al iniciar el servidor, el script:
 * - Registra el error en la consola.
 * - Intenta cerrar cualquier conexión abierta a la base de datos.
 * - Finaliza la ejecución del proceso con un código de error.
 */
import { setup } from 'config';
import mongoose, { connect, model, modelNames } from 'mongoose';

import { api } from './src/app.ts';

/**
 * Función asíncrona que maneja el cierre limpio de la conexión a la base de datos MongoDB.
 *
 * Este método intenta cerrar la conexión a la base de datos y luego finaliza el proceso de Deno.
 * En caso de error durante el cierre de la conexión, registra el error y finaliza el proceso con un código de error.
 *
 * @example
 * // Registrar la función de cierre en un evento de señal
 * Deno.addSignalListener("SIGINT", shutdown);
 */
async function shutdown(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.info("Database connection closed");
    Deno.exit(0);
  } catch (error) {
    console.error("Error closing the database connection", error);
    Deno.exit(1);
  }
}

try {
  /**
   * Establecer conexión a la base de datos MongoDB con las configuraciones especificadas.
   *
   * - `autoIndex: false`: Deshabilita la creación automática de índices en producción.
   * - `maxPoolSize: 10`: Limita el tamaño máximo del pool de conexiones a 10.
   * - `serverSelectionTimeoutMS: 5000`: Tiempo de espera para seleccionar un servidor en milisegundos.
   * - `socketTimeoutMS: 45000`: Tiempo de espera para operaciones de socket en milisegundos.
   * - `family: 4`: Utiliza IPv4 para la conexión.
   */
  await connect(setup.MONGO, {
    autoIndex: false,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 45_000,
    family: 4,
  });

  /**Obtener el nombre de la base de datos conectada */
  const db_name = mongoose.connection.db!.databaseName;
  console.info(`Successfully connected to the database: ${db_name}`);

  /**
   * Sincronizar los índices para todos los modelos registrados en Mongoose.
   *
   * Recorre cada nombre de modelo y sincroniza sus índices con la base de datos.
   * Esto asegura que los índices definidos en los esquemas de Mongoose estén actualizados en MongoDB.
   */
  for (const model_name of modelNames()) {
    await model(model_name).syncIndexes();
    console.log(`Índices sincronizados para el modelo: ${model_name}`);
  }

  /**
   * Añadir escuchadores de señales para manejar el cierre limpio de la aplicación.
   *
   * - `SIGINT`: Señal enviada cuando se interrumpe el proceso (por ejemplo, Ctrl+C).
   * - `SIGBREAK`: Señal específica de Windows para interrumpir el proceso.
   *
   * Ambos escuchadores llaman a la función `shutdown` para cerrar la conexión a la base de datos antes de finalizar.
   */
  Deno.addSignalListener("SIGINT", shutdown);
  Deno.addSignalListener("SIGBREAK", shutdown);

  /**
   * Iniciar el servidor web utilizando Deno.
   *
   * - `port: setup.PORT`: Puerto en el que el servidor escuchará las solicitudes entrantes.
   * - `app.fetch`: Función que maneja las solicitudes HTTP.
   *
   * El método `Deno.serve` bloquea el hilo principal y mantiene el servidor en ejecución hasta que se reciba una señal de terminación.
   */
  Deno.serve({ port: setup.PORT }, api.fetch);
} catch (error) {
  /**
   * Manejo de errores durante la conexión a la base de datos o al inicio del servidor.
   *
   * En caso de que ocurra un error en cualquier parte del bloque `try`:
   * - Se registra el error en la consola.
   * - Se intenta cerrar cualquier conexión abierta a la base de datos.
   * - Se finaliza el proceso de Deno con un código de error.
   */
  console.error("Failed to connect to the database or start the server", error);
  await mongoose.connection.close();
  Deno.exit(1);
}
