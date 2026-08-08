export type OptionType =
    'toggle' |
    'named_range' |
    'range' |
    'choice' |
    'text_choice' |
    'text' |
    'list' |
    'unknown'

export interface BaseOption {
    name: string,
    display_name: string,
    description: string,
    default: unknown,
    type: OptionType
}

export interface ToggleOption extends BaseOption {
    type: 'toggle',
    default: boolean | number
}

export interface RangeOption extends BaseOption {
    type: 'range',
    default: number,
    min: number,
    max: number
}

export interface NamedRangeOption extends BaseOption {
    type: 'named_range',
    default: number | string,
    min: number,
    max: number,
    special_range_names: Record<string, number>
}

export interface ChoiceOption extends BaseOption {
    type: 'choice',
    default: number | string,
    options: Record<string, number>
}

export interface TextChoiceOption extends BaseOption {
    type: 'text_choice',
    options: Record<string, string>,
    default: string | number
}

export interface FreeTextOption extends BaseOption {
    type: 'text',
    default: string
}

export interface ListOption extends BaseOption {
    type: 'list',
    valid_keys: string[],
    default: string[]
}

export interface UnknownOption extends BaseOption {
    type: 'unknown'
}

export type Options =
    ToggleOption |
    RangeOption |
    NamedRangeOption |
    ChoiceOption |
    TextChoiceOption |
    FreeTextOption |
    ListOption |
    UnknownOption

export interface SuccessResponse {
    success: true,
    game: string
    options: Record<string, Options[]>
}

export interface ErrorResponse {
    success: false,
    error: string
}

export type Response = SuccessResponse | ErrorResponse