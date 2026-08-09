import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput} from "@/components/ui/input-group.tsx";
import {PlusIcon, TrashIcon} from "lucide-react";
import {useState} from "react";

type ListOptionProps = {
    id: string,
    name: string,
    description: string,
    items: string[],
    onEdit: (optionName: string, newValue: string[]) => void,
}

export function ListOption({id, name, description, items = [], onEdit}: ListOptionProps) {
    const [input, setInput] = useState("");

    const handleAdd = () => {
        if (!input.trim()) return;
        onEdit(id, [...items, input]);
        setInput("");
    };

    const handleRemove = (indexToRemove: number) => {
        onEdit(id, items.filter((_, index) => index !== indexToRemove));
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">Edit</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editing List "{name}"</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <InputGroup>
                    <InputGroupInput
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleAdd();
                            }
                        }}
                    />
                    <InputGroupAddon align="inline-end">
                        <InputGroupButton onClick={handleAdd}>
                            <PlusIcon/>
                        </InputGroupButton>
                    </InputGroupAddon>
                </InputGroup>

                {items.length ? (
                    <div className="flex flex-col gap-2">
                        {items.map((item, index) => (
                            <div key={index} className="flex p-1 hover:bg-secondary rounded-sm items-center justify-between">
                                <p className="pl-2">{item}</p>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => handleRemove(index)}
                                >
                                    <TrashIcon/>
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex p-1 items-center justify-between">
                        <p>No entries yet</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}