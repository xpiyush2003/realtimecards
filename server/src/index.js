import "dotenv/config";
import { createServer } from "node:http";
import app from "./app.js";
import { attachSockets } from "./socket.js";

const port = process.env.PORT || 4000;

// Express and Socket.IO share one server and one port
const server = createServer(app);
attachSockets(server);

server.listen(port, () => {
  console.log(`API running on port ${port}`);
});
