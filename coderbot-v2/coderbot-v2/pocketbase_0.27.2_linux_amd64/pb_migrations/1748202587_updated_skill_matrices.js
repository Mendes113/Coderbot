/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2478702904")

  // update collection data
  unmarshal({
    "createRule": "",
    "deleteRule": "",
    "listRule": "",
    "updateRule": "",
    "viewRule": ""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2478702904")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = user_id",
    "deleteRule": "@request.auth.id = user_id",
    "listRule": "@request.auth.id = user_id",
    "updateRule": "@request.auth.id = user_id",
    "viewRule": "@request.auth.id = user_id"
  }, collection)

  return app.save(collection)
})
