/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Add editor_preferences field
  collection.fields.addAt(collection.fields.length, new Field({
    "hidden": false,
    "id": "json_editor_pref",
    "maxSize": 2000000,
    "name": "editor_preferences",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // Remove editor_preferences field
  collection.fields.removeById("json_editor_pref")

  return app.save(collection)
})

