import {Option} from "./options.ts";

interface Manifest {
    game?: string,
    version?: number,
    compatible_version?: number,
    world_version?: string,
    minimum_ap_version?: string,
    maximum_ap_version?: string,
    authors?: string[],
}

export interface WorldAnalysis {
    manifest?: Manifest,
    errors?: string[]
}

export interface MinimalWorld {
    id: string,
    custom: boolean,
    name: string,
    path: string,
    description?: string,
    grid?: string,
}

export interface FullWorld extends MinimalWorld {
    options: Record<string, Record<string, Option>>
}