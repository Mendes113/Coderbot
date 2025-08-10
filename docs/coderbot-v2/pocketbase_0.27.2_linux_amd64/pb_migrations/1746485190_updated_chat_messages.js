/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2905323536")

  // add field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3419561403",
    "hidden": false,
    "id": "relation961590774",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "sessionId",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2905323536")

  // remove field
  collection.fields.removeById("relation961590774")

  return app.save(collection)
})
