import Typesense from "typesense";

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || "localhost",
      port: Number(process.env.TYPESENSE_PORT) || 8108,
      protocol: process.env.TYPESENSE_PROTOCOL || "http"
    }
  ],
  apiKey: process.env.TYPESENSE_API_KEY || "mediaverse_ts_dev_key",
  connectionTimeoutSeconds: 5
});

export default client;
