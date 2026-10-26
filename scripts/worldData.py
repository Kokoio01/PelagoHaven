import inspect
import json

from Options import Toggle, NamedRange, Range, TextChoice, Choice, FreeText, OptionSet, OptionList, OptionCounter, \
    OptionDict, ItemDict, ItemSet, Removed, PlandoBosses, LocationSet, ItemLinks, PlandoConnections, PlandoItems, \
    PlandoTexts, DefaultOnToggle, Option
from docutils.core import publish_parts
from schema import Schema, Optional, And, Or
from worlds.AutoWorld import AutoWorldRegister

worlds_to_skip = ["Archipelago"]
worlds = []

def json_safe(obj):
    if isinstance(obj, dict):
        new_dict = {}
        for k, v in obj.items():
            if isinstance(k, tuple):
                key_str = "/".join(str(sub) for sub in k)
            elif not isinstance(k, (str, int, float, bool)) and k is not None:
                key_str = str(k)
            else:
                key_str = str(k)
            new_dict[key_str] = json_safe(v)
        return new_dict
    if isinstance(obj, (list, tuple, set, frozenset)):
        return [json_safe(v) for v in obj]
    return obj

def to_json(value):
    if isinstance(value, (set, frozenset)):
        return sorted(list(value), key=lambda x: str(x))
    if isinstance(value, tuple):
        return [to_json(item) for item in value]
    if isinstance(value, dict):
        return {str(k): to_json(v) for k, v in value.items()}
    return value

def json_schema(s):
    if isinstance(s, Schema):
        return json_schema(s._schema)
    if isinstance(s, list):
        return [json_schema(item) for item in s]
    if isinstance(s, dict):
        result = {}
        for k, v in s.items():
            key_name = k._schema if isinstance(k, Optional) else k
            result[key_name] = {
                "optional": isinstance(k, Optional),
                "type": json_schema(v)
            }
        return result
    if isinstance(s, Or):
        return {"or": [json_schema(arg) for arg in s._args]}
    if isinstance(s, And):
        return {"and": [json_schema(arg) for arg in s._args]}
    if isinstance(s, type):
        return s.__name__
    if callable(s):
        return s.__name__
    return str(s)

def get_option(name, cls, rich_text):
    visibility = getattr(cls, "visibility", None)
    if visibility is not None:
        visibility = int(visibility)
    raw_default = getattr(cls, "default", None)
    raw_valid_keys = list(getattr(cls, "_valid_keys", getattr(cls, "valid_keys", [])))

    description = inspect.getdoc(cls)
    if getattr(cls, "rich_text_doc", False):
        description = publish_parts(str(description), writer_name="html5")["html_body"]

    option = {
        "name": name,
        "display_name": getattr(cls, "display_name", name),
        "description": (description or "").strip(),

        "default": to_json(raw_default),
        "visibility": visibility,
        "auto_display_name": getattr(cls, "auto_display_name", False),
        "supports_weighting": getattr(cls, "supports_weighting", True),
        "rich_text_doc": getattr(cls, "rich_text_doc", rich_text),
        "name_lookup": getattr(cls, "name_lookup", {}),
        "options": getattr(cls, "options", {}),
        "aliases": getattr(cls, "aliases", {}),

        "valid_keys": to_json(raw_valid_keys),
        "verify_item_name": getattr(cls, "verify_item_name", False),
        "verify_location_name": getattr(cls, "verify_location_name", False),
        "convert_name_groups": getattr(cls, "convert_name_groups", False),
        "valid_keys_casefold": getattr(cls, "valid_keys_casefold", False),
    }

    if issubclass(cls, Removed):
        option["type"] = "Removed"

    elif issubclass(cls, FreeText):
        option["type"] = "FreeText"

    elif issubclass(cls, DefaultOnToggle):
        option["type"] = "DefaultOnToggle"

    elif issubclass(cls, Toggle):
        option["type"] = "Toggle"

    elif issubclass(cls, PlandoBosses):
        option["type"] = "PlandoBosses"
        option["bosses"] = list(getattr(cls, "bosses", []))
        option["locations"] = list(getattr(cls, "locations", []))
        option["duplicate_bosses"] = getattr(cls, "duplicate_bosses", False)

    elif issubclass(cls, TextChoice):
        option["type"] = "TextChoice"

    elif issubclass(cls, Choice):
        option["type"] = "Choice"

    elif issubclass(cls, NamedRange):
        option["type"] = "NamedRange"
        option["range_start"] = getattr(cls, "range_start", 0)
        option["range_end"] = getattr(cls, "range_end", 1)
        option["special_range_names"] = getattr(cls, "special_range_names", {})

    elif issubclass(cls, Range):
        option["type"] = "Range"
        option["range_start"] = getattr(cls, "range_start", 0)
        option["range_end"] = getattr(cls, "range_end", 1)

    elif issubclass(cls, ItemDict):
        option["type"] = "ItemDict"
        option["min"] = getattr(cls, "min", 0)
        option["max"] = getattr(cls, "max", None)

    elif issubclass(cls, OptionCounter):
        option["type"] = "OptionCounter"
        option["min"] = getattr(cls, "min", None)
        option["max"] = getattr(cls, "max", None)

    elif issubclass(cls, OptionDict):
        option["type"] = "OptionDict"

    elif issubclass(cls, ItemLinks):
        option["type"] = "ItemLinks"
        raw_schema = getattr(cls, "schema", None)
        option["schema"] = json_schema(raw_schema) if raw_schema else None

    elif issubclass(cls, OptionList):
        option["type"] = "OptionList"

    elif issubclass(cls, LocationSet):
        option["type"] = "LocationSet"
        option["random_str"] = getattr(cls, "random_str", None)

    elif issubclass(cls, ItemSet):
        option["type"] = "ItemSet"
        option["random_str"] = getattr(cls, "random_str", None)

    elif issubclass(cls, OptionSet):
        option["type"] = "OptionSet"
        option["random_str"] = getattr(cls, "random_str", None)

    elif issubclass(cls, PlandoConnections):
        option["type"] = "PlandoConnections"
        option["entrances"] = list(getattr(cls, "entrances", []))
        option["exits"] = list(getattr(cls, "exits", []))
        option["duplicate_exits"] = getattr(cls, "duplicate_exits", False)

    elif issubclass(cls, PlandoItems):
        option["type"] = "PlandoItems"

    elif issubclass(cls, PlandoTexts):
        option["type"] = "PlandoTexts"

    elif issubclass(cls, Option):
        option["type"] = cls.__name__

    else:
        option["type"] = "Unknown"

    return option

for id in AutoWorldRegister.world_types:
    if id in worlds_to_skip:
        continue
    world_cls = AutoWorldRegister.world_types.get(id)
    source_file = inspect.getfile(world_cls)
    rich_text = False

    if hasattr(world_cls, "web") and hasattr(world_cls.web, "rich_text_options_doc"):
        rich_text = world_cls.web.rich_text_options_doc

    options = {}
    for option_name, cls in world_cls.options_dataclass.type_hints.items():
        options[option_name] = get_option(option_name, cls, rich_text)

    groups = []
    option_names = {
        cls: name
        for name, cls in world_cls.options_dataclass.type_hints.items()
    }
    grouped_options = {}
    options_in_group = []
    if hasattr(world_cls, "web") and hasattr(world_cls.web, "option_groups"):
        groups = world_cls.web.option_groups
    if (groups is not None) and (len(groups) > 0):
        for group in groups:
            group_options = {}
            for option_cls in group.options:
                option_name = option_names.get(option_cls)

                if option_name is not None:
                    group_options[option_name] = options[option_name]
                    options_in_group.append(option_name)
            grouped_options[group.name] = group_options

    ungrouped_options = {}
    for option in options.keys():
        if option not in options_in_group:
            ungrouped_options[option] = options[option]

    if ungrouped_options:
        grouped_options["General Options"] = ungrouped_options

    world = {
        "id": id,
        "name": world_cls.game,
        "description": inspect.getdoc(world_cls),
        "path": source_file,
        "custom": "custom_worlds" in source_file,
        "options": grouped_options,
    }

    worlds.append(world)


print(json.dumps(json_safe(worlds)))