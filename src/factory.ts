import { setup } from "config";
import { BaseError } from "errors";

import { createFactory } from "@hono/hono/factory";
import { extractErrorDetails } from "@utils/extractErrorDetails.ts";

import type { UserDocument } from "@interfaces/user.interface.ts";

/**
 * Represents the environment configuration for the application.
 */
export type Env = {
  Bindings: Record<symbol, null>;
  Variables: {
    readonly image: {
      readonly name: string;
      readonly type: string;
      readonly ext: string;
      readonly buffer: Uint8Array;
    };
    readonly user: UserDocument;
    readonly location: string;
    readonly "version-file": string;
  };
};

/**
 * Creates a factory with the specified environment configuration.
 *
 * @param {Env} env - The environment configuration object.
 * @returns {Factory} The created factory instance.
 *
 * The factory initializes the application and sets up an error handler.
 * The error handler responds with a JSON object containing the error message and details.
 * If the error is an instance of `BaseError`, it returns the error message and details.
 * Otherwise, it returns a generic internal error message.
 *
 * In development mode, the error details are included in the response.
 * In production mode, the error details are omitted.
 */
export const factory = createFactory<Env>({
  initApp: (app) => {
    app.onError((err, { json }) => {
      const is_development = setup.ENV === "development";

      if (err instanceof BaseError) {
        return json(
          { error: err.message, details: err.details || null },
          err.status,
        );
      }

      return json(
        {
          error: "Ha ocurrido un error interno.",
          details: is_development ? extractErrorDetails(err) : null,
        },
        500,
      );
    });
  },
});
