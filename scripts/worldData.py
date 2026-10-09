import inspect
import json

from Options import Toggle, NamedRange, Range, TextChoice, Choice, FreeText, OptionSet, OptionList, OptionCounter
from worlds.AutoWorld import AutoWorldRegister

worlds_to_skip = ["Archipelago"]
worlds = []

def get_option(name, cls):
    desc = inspect.getdoc(cls)
    display_name = getattr(cls, "display_name", name)

    default_value = getattr(cls, "default", None)
    if isinstance(default_value, (set, frozenset)):
        default_value = sorted(list(default_value))
    if isinstance(default_value, tuple):
        default_value = default_value[0] if len(default_value) == 1 else list(default_value)

    option = {
        "name": name,
        "display_name": display_name,
        "description": desc.strip(),
        "default": default_value,
    }

    if issubclass(cls, Toggle):
        option["type"] = "toggle"

    elif issubclass(cls, NamedRange):
        option["type"] = "named_range"
        option["min"] = cls.range_start
        option["max"] = cls.range_end
        option["special_range_names"] = cls.special_range_names

    elif issubclass(cls, Range):
        option["type"] = "range"
        option["min"] = cls.range_start
        option["max"] = cls.range_end

    elif issubclass(cls, TextChoice):
        option["type"] = "text_choice"
        option["choices"] = getattr(cls, "name_lookup", [])

    elif issubclass(cls, Choice):
        option["type"] = "choice"
        raw_options = getattr(cls, "options", getattr(cls, "name_lookup", {}))
        option["options"] = {
            str(k): (v[0] if isinstance(v, tuple) else v)
            for k, v in raw_options.items()
            if isinstance(k, str)
        }

    elif issubclass(cls, FreeText):
        option["type"] = "free_text"

    # TODO: Support OptionSet, OptionList, OptionCounter

    return option

for id in AutoWorldRegister.world_types:
    if id in worlds_to_skip:
        continue
    world_cls = AutoWorldRegister.world_types.get(id)
    source_file = inspect.getfile(world_cls)

    options = {}
    for option_name, cls in world_cls.options_dataclass.type_hints.items():
        options[option_name] = get_option(option_name, cls)

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

    ungrouped_options = []
    for option in options.keys():
        if option not in options_in_group:
            ungrouped_options.append(options[option])

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

print(json.dumps(worlds))