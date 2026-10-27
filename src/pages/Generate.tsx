import {Button} from "../components/button.tsx";
import {HugeiconsIcon} from "@hugeicons/react";
import {ChevronDownIcon, PlusIcon, Rocket01Icon, Search01Icon} from "@hugeicons/core-free-icons";
import {InputGroup, InputGroupAddon, InputGroupInput} from "../components/input-group.tsx";
import {Separator} from "../components/seperator.tsx";
import {Input} from "../components/input.tsx";
import {memo, useEffect, useMemo, useState} from "react";
import {ScrollArea} from "../components/scroll-area.tsx";
import {useWorlds} from "../hooks/worlds.ts";
import {WorldCard} from "../components/world.tsx";
import {MinimalWorld} from "../types/worlds.ts";
import Fuse from "fuse.js";
import {OptionEntry} from "../components/OptionEntry.tsx";
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from "../components/collapsibale.tsx";
import {Select, SelectTrigger, SelectValue} from "../components/select.tsx";
import {useCreatorStore} from "../stores/useCreatorStore.ts";
import {useShallow} from "zustand/react/shallow";

export default function GeneratePage() {
    const slotIds = useCreatorStore(
        useShallow((state) => Object.keys(state.slots))
    );
    const activeSlotId = useCreatorStore((state) => state.activeSlotId);
    const activeWorldId = useCreatorStore(
        (state) => state.slots[state.activeSlotId]?.worldId
    );

    const createSlot = useCreatorStore((state) => state.createSlot)
    const updateSlotWorld = useCreatorStore((state) => state.updateSlotWorld)

    const [ slotSearch, setSlotSearch ] = useState("")

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

    const worldOptions = useCreatorStore((state) =>
        activeWorldId ? state.worldOptionsCache[activeWorldId] : undefined
    );

    return (
        <main className="flex gap-3 h-full">
            <div className="flex flex-1">
                {worldOptions ?
                    <div className="flex flex-col h-full w-full gap-4">
                        <div className="flex shrink-0 gap-2">
                            <SlotTitleInput slotId={activeSlotId}/>
                            <Select>
                                <SelectTrigger className="min-w-48">
                                    <SelectValue
                                        placeholder="Preset..."
                                    />
                                </SelectTrigger>
                            </Select>
                        </div>
                        {worldOptions ?
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="flex flex-col pr-4 gap-2">
                                    {Object.entries(worldOptions).map(([group, options]) => (
                                        <Collapsible key={group}>
                                            <CollapsibleTrigger
                                                className="group flex w-full justify-between p-2 bg-stone-800 rounded-sm"
                                            >
                                                <p>{group}</p>
                                                <HugeiconsIcon icon={ChevronDownIcon} className="transform duration-100 ease-out group-data-panel-open:rotate-180"/>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="flex flex-col gap-1 pt-1">
                                                {Object.entries(options).map(([name, option]) => (
                                                    <div className="flex max-w-180 min-h-10 items-center">
                                                        <OptionEntry
                                                            key={name}
                                                            slotId={activeSlotId}
                                                            category={group}
                                                            name={name}
                                                            option={option}
                                                        />
                                                    </div>
                                                ))}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))}
                                </div>
                            </ScrollArea>
                            :
                            <div>
                            </div>
                        }
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
                                        onClick={() => updateSlotWorld(activeSlotId, world.id)}
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
                <div className="flex gap-2 shrink-0">
                    <InputGroup>
                        <InputGroupAddon>
                            <HugeiconsIcon icon={Search01Icon}/>
                        </InputGroupAddon>
                        <InputGroupInput
                            placeholder="Search Slot..."
                            value={slotSearch}
                            onChange={(e) => setSlotSearch(e.target.value)}
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
                <ScrollArea className="flex flex-col flex-1 min-h-0 pt-2">
                    <div className="flex flex-col gap-2">
                        {slotIds.map((id) => (
                            <SlotListItem
                                key={id}
                                slotId={id}
                                isActive={id === activeSlotId}
                                search={slotSearch}
                            />
                        ))}
                    </div>
                </ScrollArea>
                <div className="flex flex-col shrink-0 gap-2 pt-2">
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

const SlotListItem = memo(function SlotListItem({slotId, isActive, search}: { slotId: string; isActive: boolean; search: string; }) {
    const name = useCreatorStore((state) => state.slots[slotId]?.name);
    const worldId = useCreatorStore((state) => state.slots[slotId]?.worldId);
    const setActiveSlotId = useCreatorStore((state) => state.setActiveSlotId);
    const fuse = new Fuse([name, worldId]).search(search)

    if (fuse.length >= 1) {
        return (
            <div
                className={`p-2 rounded-sm cursor-pointer transition-colors ${
                    isActive ? "bg-accent/50" : "bg-stone-700/50 hover:bg-stone-700/80"
                }`}
                onClick={() => setActiveSlotId(slotId)}
            >
                <p className="text-sm">{name}</p>
                <p className="text-xs text-muted-foreground">{worldId || "No game selected..."}</p>
            </div>
        );
    }
    return null
});

function SlotTitleInput({ slotId }: { slotId: string }) {
    const name = useCreatorStore((state) => state.slots[slotId]?.name ?? "");
    const updateSlotName = useCreatorStore((state) => state.updateSlotName);

    return (
        <Input
            value={name}
            onChange={(e) => updateSlotName(slotId, e.target.value)}
        />
    );
}