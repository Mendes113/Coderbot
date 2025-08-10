/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3419561403")

  // update collection data
  unmarshal({
    "name": "sessao"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3419561403")

  // update collection data
  unmarshal({
    "name": "chat_session"
  }, collection)

  return app.save(collection)
})
