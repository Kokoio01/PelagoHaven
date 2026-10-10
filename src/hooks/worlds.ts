import {useQuery} from "@tanstack/react-query";
import {MinimalWorld} from "../types/worlds.ts";
import {invoke} from "@tauri-apps/api/core";

export function useWorlds() {
    return useQuery<MinimalWorld[]>({
        queryKey: ['worlds'] as const,
        queryFn: () => invoke<MinimalWorld[]>("worlds_get_worlds"),
        staleTime: 1000 * 60 * 5
    })
}