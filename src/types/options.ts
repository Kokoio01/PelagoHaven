export enum Visibility {
    none = 0,
    template = 1,
    simple_ui = 2,
    complex_ui = 4,
    spoiler = 8,
    all = 15,
}

export interface BasicOption {
    name: string,
    display_name: string,
    description: string,

    default: unknown,
    visibility: Visibility,
    auto_display_name: boolean,
    supports_weighting: boolean,
    rich_text_doc: boolean | null,
    name_lookup: Map<unknown, string>,
    options: Map<string, number>,
    aliases: Map<string, number>,

    valid_key: Map<number, string>,
    verify_item_name: boolean,
    verify_location_name: boolean,
    convert_name_groups: boolean,
    valid_keys_casefold: boolean,

    value: unknown,
    initialized: boolean,
}

export interface Removed extends BasicOption {
    type: "Removed",
}

export interface FreeText extends BasicOption {
    type: "FreeText",
}

export interface Toggle extends BasicOption {
    type: "Toggle" | "DefaultOnToggle",
    default: number | boolean
}

export interface PlandoBosses extends BasicOption {
    type: "PlandoBosses",
    bosses: string[],
    location: string[]
    duplicate_bosses: boolean
}

export interface TextChoice extends BasicOption {
    type: "TextChoice",
}

export interface Choice extends BasicOption {
    type: "Choice",
}

export interface NamedRange extends BasicOption {
    type: "NamedRange",
    range_start: number,
    range_end: number,
    special_range_names: Map<string, number>
}

export interface Range extends BasicOption {
    type: "Range",
    range_start: number,
    range_end: number,
}

export interface ItemDict extends BasicOption {
    type: "ItemDict",
    min: number,
    max: number | null,
}

export interface OptionCounter extends BasicOption {
    type: "OptinCounter",
    min: number | null,
    max: number | null,
}

export interface OptionDict extends BasicOption {
    type: "OptionDict",
}

export interface ItemLinks extends BasicOption {
    type: "ItemLinks",
    schema: Object // TODO: implement schema stuff
}

export interface OptionList extends BasicOption {
    type: "OptionList",
}

export interface LocationSet extends BasicOption {
    type: "LocationSet",
    random_str: string | null,
}

export interface ItemSet extends BasicOption {
    type: "ItemSet",
    random_str: string | null,
}

export interface OptionSet extends BasicOption {
    type: "OptionSet",
    random_str: string | null,
}

export interface PlandoConnections extends BasicOption {
    type: "PlandoConnections",
    entrances: string[],
    exits: string[],
    duplicate_exits: boolean,
}

export interface PlandoItems extends BasicOption {
    type: "PlandoItems",
}

export interface PlandoTexts extends BasicOption {
    type: "PlandoTexts",
}

export interface Unkown extends BasicOption {
    type: "Unkown",
}

export type Option =
    Removed |
    FreeText |
    Toggle |
    PlandoBosses |
    TextChoice |
    Choice |
    NamedRange |
    Range |
    ItemDict |
    OptionCounter |
    OptionDict |
    ItemLinks |
    OptionList |
    LocationSet |
    ItemSet |
    OptionSet |
    PlandoConnections |
    PlandoItems |
    PlandoTexts |
    Unkown