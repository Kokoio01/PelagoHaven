import {useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api/core";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/input-group.tsx";
import {BadgeCheckIcon, EllipsisVerticalIcon, SearchIcon} from "lucide-react";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {InstallAPWorld} from "@/components/installAPWorld.tsx";
import {APWorld} from "@/types/worlds.ts";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu.tsx";

export default function Library() {
    const [worlds, setWorlds] = useState<APWorld[]>([])
    const [search, setSearch] = useState("")
    const [filtered, setFiltered] = useState<APWorld[]>([])

    function loadWorlds() {
        invoke<APWorld[]>("get_worlds").then((message) => setWorlds(message))
    }

    function deleteWorld(path:string) {
        invoke<Boolean>("uninstall_world", {path: path})
            .then(() => {
                setWorlds(worlds.filter((world) => world.path !== path));
            });
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
                            <div className="flex gap-3">
                                <p>{world.world_version}</p>
                                {!world.official ?
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <EllipsisVerticalIcon/>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() => deleteWorld(world.path)}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu> : undefined
                                }
                            </div>
                        </div>
                        <p>{world.authors?.join(", ")}</p>
                    </div>)}
                </div>
            </ScrollArea>
        </main>
    )
}