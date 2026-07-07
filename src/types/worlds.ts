interface Manifest {
    game?: string,
    version?: number,
    compatible_version?: number,
    world_version?: string,
    minimum_ap_version?: string,
    maximum_ap_version?: string,
    authors?: string[],
}

export interface APWorld {
    game?: string,
    version?: number,
    compatible_version?: number,
    world_version?: string,
    minimum_ap_version?: string,
    maximum_ap_version?: string,
    authors?: string[],
    official: boolean,
}

export interface WorldAnalysis {
    manifest?: Manifest,
    errors?: string[]
}