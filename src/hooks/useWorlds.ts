import {useQuery} from "@tanstack/react-query";
import {invoke} from "@tauri-apps/api/core";
import {APWorld} from "@/types/worlds.ts";

export const worldKeys = {
    all: ['worlds'] as const,
    detail: (id: string) => ['worlds', id] as const,
};

export function useWorlds() {
    return useQuery<APWorld[]>({
        queryKey: worldKeys.all,
        queryFn: () => invoke<APWorld[]>("get_worlds"),
        staleTime: 1000 * 60 * 5,
    });
}
