import {create} from "zustand/react";
import {immer} from "zustand/middleware/immer";
import {nanoid} from "nanoid";
import {FullWorld} from "../types/worlds.ts";
import {invoke} from "@tauri-apps/api/core";
import {Option} from "../types/options.ts";

type Slot = {
    id: string,
    name: string,
    worldId?: string,
    overrides: Record<string, unknown>
}

interface CreatorStore {
    slots: Record<string, Slot>,
    activeSlotId: string,

    worldOptionsCache: Record<string, Record<string, Record<string, Option>>>,

    createSlot: () => void,
    deleteSlot: (id: string) => void,
    setActiveSlotId: (id: string) => void,
    updateSlotName: (id: string, name: string) => void,
    updateSlotWorld: (id: string, worldId: string) => Promise<void>,
    updateSlotOverride: (id: string, category: string, name: string, value: unknown) => void,
}

const initialId = nanoid()

export const useCreatorStore = create<CreatorStore>()(
    immer((set, get) => ({
        slots: {
            [initialId]: { id: initialId, name: "New Slot", overrides: {}}
        },
        activeSlotId: initialId,

        worldOptionsCache: {},

        createSlot: () => {
            const id = nanoid()
            set((state) => {
                state.slots[id] = { id, name: "New Slot", overrides: {} }
                state.activeSlotId = id
            })
        },

        deleteSlot: (id: string) => {
            set((state) => {
                if (state.slots[id]) {
                    delete state.slots[id]
                }
            })
        },

        setActiveSlotId: (id: string) => {
            set((state) => {
                state.activeSlotId = id
            })
        },

        updateSlotName: (id: string, name: string) => {
            set((state) => {
                if (state.slots[id]) state.slots[id].name = name
            })
        },

        updateSlotWorld: async (id: string, worldId: string) => {
            if (!get().worldOptionsCache[worldId]) {
                const world = await invoke<FullWorld>("worlds_get_world", { worldid: worldId });
                const options = JSON.parse(world.options) as Record<string, Record<string, Option>>
                set((state) => {
                    state.worldOptionsCache[worldId] = options
                })
            }
            set((state) => {
                const slot = state.slots[id]
                if (slot) {
                    slot.worldId = worldId
                    slot.overrides = {}
                }
            })
        },

        updateSlotOverride: (id: string, category: string, name: string, value: unknown) => {
            set((state) => {
                const slot = state.slots[id]
                if (!slot) return;
                const key = `${category}.${name}`

                const world = state.worldOptionsCache[slot.worldId];
                const defaultValue = world?.options?.[category]?.[name]?.default;

                if (value === defaultValue) {
                    delete slot.overrides[key];
                } else {
                    slot.overrides[key] = value;
                }
            })
        }
    }))
)