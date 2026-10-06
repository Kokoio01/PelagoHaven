import inspect
import json

from worlds.AutoWorld import AutoWorldRegister

worlds_to_skip = ["Archipelago"]
worlds = []

for id in AutoWorldRegister.world_types:
    if id in worlds_to_skip:
        continue
    world_cls = AutoWorldRegister.world_types.get(id)
    source_file = inspect.getfile(world_cls)

    world = {
        "id": id,
        "name": world_cls.game,
        "description": inspect.getdoc(world_cls),
        "custom": "custom_worlds" in source_file
    }

    worlds.append(world)

print(json.dumps(worlds))