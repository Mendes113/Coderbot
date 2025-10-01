/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2905323536") // chat_messages collection ID
  
  // add field segments (JSON field for storing message segments)
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "json_segments",
    "maxSize": 0,
    "name": "segments",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2905323536")
  
  // remove field
  collection.fields.removeById("json_segments")
  
  return app.save(collection)
})
