import client from "./typesense.js";

const videoCollectionSchema = {
  name: "videos",
  fields: [
    { name: "mongoId",       type: "string" },
    { name: "title",         type: "string" },
    { name: "description",   type: "string" },
    { name: "tags",          type: "string[]", optional: true },
    { name: "ownerUsername", type: "string" },
    { name: "ownerAvatar",   type: "string", optional: true },
    { name: "thumbnail",     type: "string", optional: true },
    { name: "duration",      type: "float" },
    { name: "views",         type: "int32", default: 0 },
    { name: "isPublished",   type: "bool" },
    { name: "createdAt",     type: "int64" }
  ],
  default_sorting_field: "views"
};

const tweetCollectionSchema = {
  name: "tweets",
  fields: [
    { name: "mongoId",       type: "string" },
    { name: "content",       type: "string" },
    { name: "hashtags",      type: "string[]", optional: true },
    { name: "ownerUsername", type: "string" },
    { name: "ownerAvatar",   type: "string", optional: true },
    { name: "views",         type: "int32", default: 0 },
    { name: "createdAt",     type: "int64" }
  ],
  default_sorting_field: "createdAt"
};

export const initTypesenseCollections = async () => {
    const schemas = [videoCollectionSchema, tweetCollectionSchema];

    for (const schema of schemas) {
        try {
            await client.collections(schema.name).retrieve();
        } catch (error) {
            console.log(`Creating Typesense collection: ${schema.name}...`);
            await client.collections().create(schema);
        }
    }
    console.log("Typesense collections ready");
};
