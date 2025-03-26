import { cors, Hono } from 'deps';
import { factory } from 'factory';
// import { methodNotAllowedMiddleware, notFoundMiddleware } from 'middlewares';
import {
    brandRoutes, imageRoutes, itemRoutes, keyRoutes, lineRoutes, updateRoutes, userRoutes
} from 'routers';

const api = new Hono();

// { origin: "http://localhost:4200", credentials: true }
api.use(cors({ origin: "http://localhost:1420", credentials: true }));

const app = factory.createApp();

app.route("/user", userRoutes);
app.route("/brand", brandRoutes);
app.route("/line", lineRoutes);
app.route("/key", keyRoutes);
app.route("/item", itemRoutes);
app.route("/image", imageRoutes);
app.route("/update", updateRoutes);

api.route("/api", app);
// api.use("*", methodNotAllowedMiddleware);
// api.use("*", notFoundMiddleware);

export { api };
