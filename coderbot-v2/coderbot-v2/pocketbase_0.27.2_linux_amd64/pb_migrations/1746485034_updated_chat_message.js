/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2905323536")

  // update collection data
  unmarshal({
    "name": "chat_messages"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2905323536")

  // update collection data
  unmarshal({
    "name": "chat_message"
  }, collection)

  return app.save(collection)
})
