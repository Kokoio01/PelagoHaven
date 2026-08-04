import sys
import importlib
import zipimport
from pathlib import Path
import warnings
import json

warnings.filterwarnings("ignore")

if getattr(sys, 'frozen', False):
    ARCHIPELAGO_PATH = Path(sys._MEIPASS) / "src-archipelago"
else:
    SCRIPT_DIR = Path(__file__).resolve().parent
    PROJECT_ROOT = SCRIPT_DIR.parent
    ARCHIPELAGO_PATH = PROJECT_ROOT / "src-archipelago"

if str(ARCHIPELAGO_PATH) not in sys.path:
    sys.path.insert(0, str(ARCHIPELAGO_PATH))

from worlds.AutoWorld import AutoWorldRegister, World
from Options import Toggle, NamedRange, Range, Choice, TextChoice, FreeText, OptionSet, OptionList, OptionCounter, \
    Visibility

apworld_module_specs = {}

class APWorldModuleFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname: str, path=None, target=None):
        return apworld_module_specs.get(fullname)


sys.meta_path.insert(0, APWorldModuleFinder())


def load_single_apworld(apworld_path: str):
    path = Path(apworld_path).resolve()
    world_name = path.stem.lower()

    if path.is_file() and path.suffix == ".apworld":
        importer = zipimport.zipimporter(str(path))
        spec = importer.find_spec(f"worlds.{world_name}")
        if spec is None:
            raise ImportError(f"Could not find module 'worlds.{world_name}' in {path}")
        apworld_module_specs[f"worlds.{world_name}"] = spec
        module = importlib.import_module(f"worlds.{world_name}")
        for attr_name in dir(module):
            attr = getattr(module, attr_name)
            if isinstance(attr, type) and issubclass(attr, World) and attr is not World:
                return attr.game
        return getattr(module, "game")

    raise ValueError(f"Could not find Subclass: {path}")

def serialize_option(option_name, option_cls):
    doc = option_cls.__doc__ or "No Description"
    display_name = getattr(option_cls, "display_name", option_name)

    data = {
        "name": option_name,
        "display_name": display_name,
        "description": doc.strip(),
        "default": option_cls.default,
    }

    if issubclass(option_cls, Toggle):
        data["type"] = "toggle"

    elif issubclass(option_cls, NamedRange):
        data["type"] = "named_range"
        data["min"] = option_cls.range_start
        data["max"] = option_cls.range_end
        data["special_range_names"] = option_cls.special_range_names

    elif issubclass(option_cls, Range):
        data["type"] = "range"
        data["min"] = option_cls.range_start
        data["max"] = option_cls.range_end

    elif issubclass(option_cls, Choice):
        data["type"] = "choice"
        data["options"] = {
            name: val for name, val in option_cls.name_lookup.items()
        }

    elif issubclass(option_cls, TextChoice):
        data["type"] = "text_choice"
        data["options"] = getattr(option_cls, "name_lookup", {})

    elif issubclass(option_cls, FreeText):
        data["type"] = "text"

    elif any(issubclass(option_cls, cls) for cls in (OptionSet, OptionList, OptionCounter)):
        data["type"] = "list"
        data["valid_keys"] = sorted(list(getattr(option_cls, "valid_keys", [])))

    else:
        data["type"] = "unknown"

    return data


def get_options(game_name):
    loaded_game_identifier = load_single_apworld(game_name)
    world_cls = AutoWorldRegister.world_types.get(loaded_game_identifier)

    if not world_cls:
        for name, cls in AutoWorldRegister.world_types.items():
            if name.lower() == str(loaded_game_identifier).lower():
                world_cls = cls
                break

    if not world_cls:
        return {"success": False, "error": f"Game '{loaded_game_identifier}' not found in AutoWorldRegister"}

    options_dataclass = world_cls.options_dataclass

    class_to_name = {}
    for opt_name, opt_cls in options_dataclass.type_hints.items():
        class_to_name[opt_cls] = opt_name
        class_to_name[opt_name] = opt_name

    serialized_options = {}
    for opt_name, opt_cls in options_dataclass.type_hints.items():
        if getattr(opt_cls, "visibility", Visibility.all) & Visibility.simple_ui:
            serialized_options[opt_name] = serialize_option(opt_name, opt_cls)

    groups = {}
    assigned_options = set()
    if hasattr(world_cls, "web") and hasattr(world_cls.web, "option_groups"):
        for group in world_cls.web.option_groups:
            group_options = []
            for opt in group.options:
                # Convert Option class object or string into the dataclass field name
                opt_name = class_to_name.get(opt, getattr(opt, "internal_name", str(opt)))
                group_options.append(opt_name)

            groups[group.name] = group_options
            assigned_options.update(group_options)

    ungrouped_options = [
        name for name in serialized_options.keys()
        if name not in assigned_options
    ]

    if ungrouped_options:
        groups = {"General": ungrouped_options, **groups}

    grouped_options = {}
    for group_name, group_options in groups.items():
        options = [serialized_options[key] for key in group_options if key in serialized_options]
        if options:
            grouped_options[group_name] = options

    return {
        "success": True,
        "game": game_name,
        "options": grouped_options
    }

def json_serial(obj):
    if isinstance(obj, (set, frozenset)):
        return list(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "get-options" and len(sys.argv) > 2:
        try:
            result = get_options(sys.argv[2])
            print(json.dumps(result, default=json_serial), flush=True)
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}), flush=True)
    else:
        print(json.dumps({"success": False, "error": "Invalid command"}), flush=True)