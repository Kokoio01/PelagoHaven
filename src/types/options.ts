export interface BasicOption {
    name: string,
    display_name: string,
    description: string,
}

export interface ToggleOption extends BasicOption {
    default: boolean,
    value?: boolean
}

export interface RangeOption extends BasicOption {
    default: number,
    min: number,
    max: number,
    value?: number
}

export interface NamedRangeOption extends RangeOption {
    special_range_names: Record<string, number>
}

export interface TextChoiceOption extends BasicOption {
    default: string | number,
    choices: Record<number, string> | Record<string, string>,
    value?: string | number
}

export interface ChoiceOption extends BasicOption {
    default: number
    options: Record<number, string> | Record<string, string>,
    value?: string | number
}

export interface FreeTextOption extends BasicOption {
    default: string,
    value?: string
}

export type Option =
    ToggleOption |
    RangeOption |
    NamedRangeOption |
    TextChoiceOption |
    ChoiceOption |
    FreeTextOption