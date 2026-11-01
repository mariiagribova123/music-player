import { proxyRoomsRequest } from "../../api/_rooms-proxy.mjs";

export default proxyRoomsRequest;

export const config = {
  method: ["GET", "POST"],
  path: ["/api/rooms", "/api/rooms/*"],
};

