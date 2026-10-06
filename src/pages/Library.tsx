import {ScrollArea} from "../components/scroll-area.tsx";
import {Button} from "../components/button.tsx";
import {HugeiconsIcon} from "@hugeicons/react";
import {PlusIcon, Search01Icon, TrashIcon} from "@hugeicons/core-free-icons";
import {InputGroup, InputGroupAddon, InputGroupInput} from "../components/input-group.tsx";
import {useMemo, useState} from "react";
import Fuse from "fuse.js";
import {
    AlertDialog, AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
    AlertDialogTrigger
} from "../components/alert-dialog.tsx";


type APWorld = {
    id: string,
    name: string,
    grid: string,
}

const demo: APWorld[] = [
    {
        id: "stardew",
        name: "Stardew Valley",
        grid: "https://shared.steamstatic.com/store_item_assets/steam/apps/413150/library_600x900_2x.jpg?t=1754692839"
    },
    {
        id: "terraria",
        name: "Terraria",
        grid: "https://shared.steamstatic.com/store_item_assets/steam/apps/105600/library_600x900_2x.jpg?t=1666290502"
    },
    {
        id: "noctrune",
        name: "Noctrune",
        grid: "https://shared.steamstatic.com/store_item_assets/steam/apps/1374860/69bd1814626a50a13875421fc7f185c802c8f752/library_600x900_2x.jpg?t=1755140072"
    },
    {
        id: "satisfactory",
        name: "Satisfactory",
        grid: "https://shared.steamstatic.com/store_item_assets/steam/apps/526870/e0012550bfa8f930a06692b2904298e98ce1e2d4/library_600x900_2x.jpg?t=1749717451"
    },
    {
        id: "balatro",
        name: "Balatro",
        grid: "https://shared.steamstatic.com/store_item_assets/steam/apps/2379780/library_600x900_2x.jpg?t=1758034949"
    },
    {
        id: "thewitness",
        name: "The Witness",
        grid: "https://shared.steamstatic.com/store_item_assets/steam/apps/210970/library_600x900_2x.jpg?t=1572305043"
    },
]

export default function LibraryPage() {
    const [elements, setElements] = useState<APWorld[]>([])
    const [search, setSearch] = useState(" ")

    const fuse = useMemo(() => {
        setElements(demo)
        return new Fuse(elements, {
            keys: ['name'],
            threshold: 0.4,
        })
    }, [])

    const results = search ? fuse.search(search) : []

    const displayItems = results.length > 0
        ? results.map(({item}) => item)
        : elements

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
                            <img src={e.grid} alt={e.id + "grid image"} className="rounded-xl"></img>
                            <div
                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                            >
                                <AlertDialog>
                                    <AlertDialogTrigger
                                        render={
                                            <HugeiconsIcon
                                                icon={TrashIcon}
                                                className="hover:text-destructive text-stone-50"
                                            />
                                        }
                                    />
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete {e.name}</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete this World and can not be undone!</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>
                                                Close
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => setElements(elements.filter((world) => !(e.id === world.id)))}
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </main>
    )
}