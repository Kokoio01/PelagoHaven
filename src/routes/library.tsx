import {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api/core";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/input-group.tsx";
import {BadgeCheckIcon, SearchIcon} from "lucide-react";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {InstallAPWorld} from "@/components/installAPWorld.tsx";
import {APWorld} from "@/types/worlds.ts";

export default function Library() {
    const [worlds, setWorlds] = useState<APWorld[]>([])
    const [search, setSearch] = useState("")
    const [filtered, setFiltered] = useState<APWorld[]>([])

    function loadWorlds() {
        invoke<APWorld[]>("get_worlds").then((message) => setWorlds(message))
    }

    useEffect(() => loadWorlds, [])

    useEffect(() => {
        setFiltered(
            worlds.filter((world) => world.game?.toLowerCase().startsWith(search.toLowerCase()))
        )
    }, [search, worlds]);

    return (
        <main className="flex flex-col flex-1 h-full min-h-0 gap-4">
            <div className="flex gap-4 ">
                <InputGroup>
                    <InputGroupAddon>
                        <SearchIcon/>
                    </InputGroupAddon>
                    <InputGroupInput
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <InputGroupAddon align="inline-end">
                        <p>{filtered.length} Results</p>
                    </InputGroupAddon>
                </InputGroup>
                <InstallAPWorld/>
            </div>
            <ScrollArea className="flex-1 min-h-0">
                <div className="grid grid-cols-2 gap-5">
                    {filtered.map((world) => <div className="bg-sidebar p-4 rounded-md">
                        <div className="flex justify-between">
                            <p className="flex gap-1 items-center">
                                {world.game}
                                {world.official ? <BadgeCheckIcon size={18} className="text-accent"/> : <p/>
                            }</p>
                            <p>{world.world_version}</p>
                        </div>
                        <p>{world.authors?.join(", ")}</p>
                    </div>)}
                </div>
            </ScrollArea>
        </main>
    )
}