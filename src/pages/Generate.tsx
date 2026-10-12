import {Button} from "../components/button.tsx";
import {HugeiconsIcon} from "@hugeicons/react";
import {PlusIcon, Rocket01Icon, Search01Icon} from "@hugeicons/core-free-icons";
import {InputGroup, InputGroupAddon, InputGroupInput} from "../components/input-group.tsx";
import {Separator} from "../components/seperator.tsx";
import {Input} from "../components/input.tsx";
import {useEffect, useMemo, useState} from "react";
import {ScrollArea} from "../components/scroll-area.tsx";
import {useWorlds} from "../hooks/worlds.ts";
import {WorldCard} from "../components/world.tsx";
import {FullWorld, MinimalWorld} from "../types/worlds.ts";
import Fuse from "fuse.js";
import {nanoid} from "nanoid";
import {invoke} from "@tauri-apps/api/core";

type Slot = {
    id: string,
    name: string,
    world?: string,
    options?: Object
}

export default function GeneratePage() {
    const [slots, setSlots] = useState<Slot[]>([{id: nanoid(), name: "New Slot"}])
    const [selected, setSelected] = useState(slots[0].id)

    const { data: worlds } = useWorlds();
    const [ worldSearch, setWorldSearch ] = useState("")
    const [ filteredWorlds, setFilteredWorlds ] = useState<MinimalWorld[]>([])

    const fuse = useMemo(() => {
        return new Fuse(worlds || [], {
            keys: ['name'],
            threshold: 0.4,
        })
    }, [worlds])

    useEffect(() => {
        async function filter() {
            const results = worldSearch.length > 2 ? fuse.search(worldSearch) : []
            setFilteredWorlds(results.length || 0 > 0
                ? results.map(({item}) => item)
                : worlds || [])
        }
        filter()
    }, [fuse, worldSearch, worlds]);

    async function populateOptions(worldID: string, slotId: string) {
        const world = await invoke<FullWorld>("worlds_get_world", {worldid: worldID})
        updateSlot({options: world.options}, slotId)
    }
    function updateSlot(fields: Partial<Slot>, slotId?: string) {
        const search = slotId ? slotId : selected
        setSlots((prev) =>
            prev.map((slot) =>
                slot.id === search ? {...slot, ...fields} : slot
            )
        )
        if (fields.world) {
            populateOptions(fields.world, search)
        }
    }
    function createSlot() {
        const id = nanoid()
        setSlots((prev) =>
            [...prev, {id, name: "New Slot"}]
        );
        setSelected(id)
    }

    const selectedSlot = slots.filter((s) => s.id === selected)[0]
    return (
        <main className="flex gap-3 h-full">
            <div className="flex-1">
                {selectedSlot?.world ?
                    <div className="flex flex-col h-full">
                        <div className="flex shrink-0">
                            <Input
                                value={selectedSlot.name}
                                onChange={(e) => updateSlot({name: e.target.value})}
                            />
                        </div>
                        <div className="flex flex-1">
                            <p>{selectedSlot.options?.toString()}</p>
                        </div>
                    </div>

                    :

                    <div className="w-full h-full flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h1 className="shrink-0 font-bold text-xl">Select a world</h1>
                            <Input
                                className="max-w-60"
                                placeholder="e.g APQuest"
                                value={worldSearch}
                                onChange={(e) => setWorldSearch(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="flex-1 min-h-0">
                            <div className="pr-4 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-8 items-start w-full">
                                {filteredWorlds?.map((world) =>
                                    <div
                                        className="relative flex w-full h-60 rounded-xl shadow-stone-850 shadow-lg"
                                        key={world.id}
                                        onClick={() => updateSlot({world: world.id})}
                                    >
                                        <WorldCard world={world}/>
                                    </div
                                >)}
                            </div>
                        </ScrollArea>
                    </div>
                }
            </div>
            <Separator orientation="vertical"/>
            <aside className="shrink-0 flex flex-col h-full">
                <div className="flex-1">
                    <div className="flex gap-2">
                        <InputGroup>
                            <InputGroupAddon>
                                <HugeiconsIcon icon={Search01Icon}/>
                            </InputGroupAddon>
                            <InputGroupInput
                                placeholder="Search Slot..."
                            />
                        </InputGroup>
                        <Button
                            size="icon"
                            variant="default"
                            onClick={() => createSlot()}
                        >
                            <HugeiconsIcon icon={PlusIcon}/>
                        </Button>
                    </div>
                    <ScrollArea className="flex-1 min-h-0">
                        {slots.map((slot) =>
                            <div
                                className="p-2"
                                onClick={() => setSelected(slot.id)}
                            >
                                <p>{slot.name}</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
                <div className="flex flex-col shrink-0 gap-2">
                    <Separator/>
                    <Button className="w-full bg-accent hover:bg-accent-foreground text-primary">
                        <HugeiconsIcon icon={Rocket01Icon}/>
                        <p>Generate</p>
                    </Button>
                </div>
            </aside>
        </main>
    )
}