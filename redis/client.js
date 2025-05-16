// redis/client.js

import { createClient } from "redis";

const redisClient = createClient();

redisClient.on("error", (err) => console.log("Redis Client Error", err));

redisClient.connect().catch(console.error);

export default redisClient;
