import {ScrollArea} from "../components/scroll-area.tsx";
import {Button} from "../components/button.tsx";
import {HugeiconsIcon} from "@hugeicons/react";
import {PlusIcon, Search01Icon, TrashIcon} from "@hugeicons/core-free-icons";
import {InputGroup, InputGroupAddon, InputGroupInput} from "../components/input-group.tsx";
import {useEffect, useMemo, useState} from "react";
import Fuse from "fuse.js";
import {
    AlertDialog, AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "../components/alert-dialog.tsx";
import {invoke} from "@tauri-apps/api/core";


type APWorld = {
    id: string,
    custom: boolean,
    name: string,
    description?: string,
    grid?: string,
}

export default function LibraryPage() {
    const [elements, setElements] = useState<APWorld[]>([])
    const [displayItems, setDisplayItems] = useState<APWorld[]>([])
    const [search, setSearch] = useState("")
    const [worldToDelete, setWorldToDelete] = useState<string | null>("")

    useEffect(() => {
        async function loadWorlds() {
            setElements(await invoke<APWorld[]>("worlds_get_worlds") || []);
        }
        loadWorlds();
    }, []);

    const fuse = useMemo(() => {
        return new Fuse(elements, {
            keys: ['name'],
            threshold: 0.4,
        })
    }, [elements])

    useEffect(() => {
        async function filter() {
            const results = search.length > 2 ? fuse.search(search) : []
            setDisplayItems(results.length > 0
                ? results.map(({item}) => item)
                : elements)
        }
        filter()
    }, [fuse, elements, search]);


    return (
        <main className="flex flex-col w-full h-full">
            <div className="flex gap-2 shrink-0 pb-4 shadow-stone-900 shadow-2xl">
                <InputGroup>
                    <InputGroupAddon>
                        <HugeiconsIcon icon={Search01Icon}/>
                    </InputGroupAddon>
                    <InputGroupInput
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <InputGroupAddon align="inline-end">
                        {elements.length} found
                    </InputGroupAddon>
                </InputGroup>
                <Button
                    className="bg-accent hover:bg-accent-foreground transition-colors text-stone-300"
                >
                    <HugeiconsIcon icon={PlusIcon}/>
                    Add APWorld
                </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0">
                <div className="pr-4 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-8 items-start w-full">
                    {displayItems.map((e) =>
                        <div key={e.id} className="group relative flex w-full h-60 rounded-xl shadow-stone-850 shadow-lg">
                            {e.grid ?
                                <img src={e.grid} alt={e.id + "grid image"} className="rounded-xl"></img> :
                                <div className="bg-linear-to-t from-black to-stone-950 text-stone-300 w-full h-full rounded-xl content-center text-center p-2">
                                    <p>{e.name}</p>
                                </div>
                            }
                            <div
                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                            >
                                <Button size="icon-lg" variant="ghost" onClick={() => setWorldToDelete(e.id)}>
                                    <HugeiconsIcon
                                        icon={TrashIcon}
                                        className="hover:text-destructive text-stone-50"
                                    />
                                </Button>
                            </div>
                        </div>
                    )}
                    <AlertDialog open={!!worldToDelete} onOpenChange={(open) => !open && setWorldToDelete(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete {elements.filter((world) => worldToDelete === world.id)[0]?.name || "ERROR"}</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete this World and can not be undone!</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>
                                    Close
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => {
                                        setElements(elements.filter((world) => !(worldToDelete === world.id)))
                                        setWorldToDelete(null)
                                    }}
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </ScrollArea>
        </main>
    )
}