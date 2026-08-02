import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {PlusIcon, TrashIcon} from "lucide-react";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Input} from "@/components/ui/input.tsx";
import {invoke} from "@tauri-apps/api/core";

type Slot = {
    id: number,
    name: string,
    game: string,
    path?: string
}

export interface ApiResponse {
    success: boolean;
    game?: string;
    groups?: Record<string, string[]>;
    options?: Record<string, unknown>;
    error?: string;
}

const slots:Slot[] = [
    {id: 1, name: "player1", game: "Hollow Knight", path: "C:/ProgramData/Archipelago/lib/worlds/factorio.apworld"},
    {id: 2, name: "player2", game: "Hollow Knight"},
    {id: 3, name: "player3", game: "Hollow Knight"},
    {id: 4, name: "player1", game: "Hollow Knight"},
    {id: 5, name: "player1", game: "Hollow Knight"},
    {id: 6, name: "player1", game: "Hollow Knight"},
    {id: 7, name: "player1", game: "Hollow Knight"},
    {id: 8, name: "player1", game: "Hollow Knight"},
    {id: 9, name: "player1", game: "Hollow Knight"},
    {id: 10, name: "player1", game: "Hollow Knight"},
    {id: 11, name: "player1", game: "Hollow Knight"},
]

export default function Generate() {
    const [selected, setSelected] = useState(1)
    const [currentSlot, setCurrentSlot] = useState<Slot | undefined>()
    const [options, setOptions] = useState<ApiResponse | undefined>()

    useEffect(() => {
        const newSlot = slots.find((s) => s.id === selected)
        setCurrentSlot(undefined)
        invoke<ApiResponse>("get_game_options", { gameName: currentSlot?.path })
            .then((message) => {
                console.log(message)
                setOptions(message);
            })
            .catch((err) => console.error("Tauri Error:", err));
        setCurrentSlot(newSlot)
    }, [slots, selected])


    return (
        <main className="flex flex-1 h-full min-h-0 gap-4">
            <div className="min-w-1/4 p-0.5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <p>Slots</p>
                    <Button size="icon" variant="outline"><PlusIcon/></Button>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                    {slots.map((slot) =>
                        <div
                            className={"flex items-center gap-2 p-2 rounded-sm" + (selected === slot.id ? " bg-accent/20" : "")}
                            onClick={() => setSelected(slot.id)}
                        >
                            <p className={"flex items-center justify-center w-6 h-6 rounded-sm text-sm"  + (selected === slot.id ? " bg-accent/60" : " bg-muted")}>
                                {slot.id}
                            </p>
                            <div className="text-xs">
                                <p>{slot.name}</p>
                                <p className="text-muted-foreground">{slot.game}</p>
                            </div>
                        </div>
                    )}
                </ScrollArea>

            </div>
            <Separator orientation="vertical"/>
            <div className="flex-1 h-full flex flex-col justify-between">
                <div>
                    {currentSlot ?
                        <div className="">
                            <div className="flex items-center gap-4">
                                <Input
                                    className="h-10"
                                    value={currentSlot.name}
                                ></Input>
                                <Button variant="outline" size="icon" className="w-10 h-10"><TrashIcon/></Button>
                            </div>
                            {options ?
                                <p>{JSON.stringify(options)}</p>:
                                <div></div>
                            }
                        </div> :
                        <div></div>
                    }
                </div>
                <div>
                    <Separator/>
                    <div className="flex justify-between items-center p-2 pt-6">
                        <p className="text-muted-foreground">{slots.length} Slots configured</p>
                        <Button className="bg-accent">Continue</Button>
                    </div>
                </div>
            </div>
        </main>
    )
}