import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {PlusIcon, SearchIcon, TrashIcon} from "lucide-react";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {Separator} from "@/components/ui/separator.tsx";
import {Input} from "@/components/ui/input.tsx";
import {invoke} from "@tauri-apps/api/core";
import {Response, SuccessResponse} from "@/types/options.ts";
import {Field, FieldGroup, FieldLabel, FieldLegend, FieldSet} from "@/components/ui/field";
import {Switch} from "@/components/ui/switch.tsx";
import {Slider} from "@/components/ui/slider.tsx";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select.tsx";
import {useWorlds} from "@/hooks/useWorlds.ts";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/input-group.tsx";
import {APWorld} from "@/types/worlds.ts";
import { v4 as uuidv4 } from 'uuid';
import {ListOption} from "@/components/listOption.tsx";
import {Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList} from "@/components/ui/combobox.tsx";

type OptionValue = boolean | number | string | string[] | Record<string, number>;

type Slot = {
    id: string,
    status: "gameSelect" | "gameOptions",
    name: string,
    world?: APWorld
    options?: SuccessResponse,
    values?: Record<string, OptionValue>
}

function formatChoiceLabel(name: string): string {
    return name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Generate() {
    const { data: worlds } = useWorlds();
    const [slotList, setSlotList] = useState<Slot[]>([{id: uuidv4(), name: "New Slot", status: "gameSelect"}]);
    const [selected, setSelected] = useState<String>(slotList[0].id);
    const [searchQuery, setSearchQuery] = useState("");
    const currentSlot = slotList.find((slot) => slot.id === selected)

    function updateSlot(id: string, updatedFields: Partial<Slot>) {
        setSlotList((prevSlots) =>
            prevSlots.map((slot) =>
                slot.id === id ? { ...slot, ...updatedFields } : slot
            )
        );
    }

    function addSlot(newSlot: Slot, index?: number) {
        setSlotList((prevSlots) => {
            if (index === undefined || index >= prevSlots.length) {
                return [...prevSlots, newSlot];
            }
            return [
                ...prevSlots.slice(0, index),
                newSlot,
                ...prevSlots.slice(index)
            ];
        });
        setSelected(newSlot.id);
    }

    function removeSlot(id: string) {
        if (slotList.length === 1) {
            addSlot({id: uuidv4(), name: "New Slot", status: "gameSelect"})
        }
        setSlotList((prevSlots) => prevSlots.filter((slot) => slot.id !== id));
    }

    function updateOptionValue(optionName: string, newValue: OptionValue) {
        if (!currentSlot) return;
        updateSlot(currentSlot.id, {
            values: {
                ...(currentSlot.values || {}),
                [optionName]: newValue,
            },
        });
    }

    useEffect(() => {
        if (!currentSlot?.world) return;
        if (currentSlot.options) return;

        invoke<Response>("get_game_options", { gameName: currentSlot.world.path })
            .then((message) => {
                console.log(JSON.stringify(message));
                if (message.success) {
                    const options = message as SuccessResponse;
                    const values: Record<string, OptionValue> = {};
                    for (const groups of Object.values(options.options)) {
                        for (const option of groups) {
                            switch (option.type) {
                                case "toggle":
                                    values[option.name] = Boolean(option.default);
                                    break;
                                case "range":
                                    values[option.name] = Number(option.default);
                                    break
                                case "named_range":
                                    values[option.name] = Number(option.default);
                                    break;
                                case "choice":
                                    values[option.name] = String(option.default);
                                    break;
                                case "text_choice":
                                    values[option.name] = String(option.default);
                                    break;
                                case "text":
                                    values[option.name] = String(option.default);
                                    break;
                                case "list":
                                    values[option.name] = option.default;
                                    break;
                            }
                        }
                    }
                    console.log(values);
                    updateSlot(currentSlot.id, {options: options, values: values})
                }
            })
            .catch((err) => console.error("Tauri Error:", err));
    }, [currentSlot?.world]);


    return (
        <main className="flex flex-1 h-full min-h-0 gap-4">
            <div className="min-w-1/4 p-0.5 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <p>Slots</p>
                    <Button
                        size="icon"
                        variant="outline"
                        onClick={() => addSlot({id: uuidv4(), name: "New Slot", status: "gameSelect"})}
                    >
                        <PlusIcon/>
                    </Button>
                </div>
                <ScrollArea className="flex-1 min-h-0">
                    {slotList.map((slot) =>
                        <div
                            className={"flex items-center gap-2 p-2 rounded-sm" + (slot.id === selected ? " bg-accent/20" : "")}
                            onClick={() => setSelected(slot.id)}
                            key={slot.id}
                        >
                            <p className={"flex items-center justify-center w-6 h-6 rounded-sm text-sm"  + (slot.id === selected ? " bg-accent/60" : " bg-muted")}>
                                {slotList.indexOf(slot) + 1}
                            </p>
                            <div className="text-xs">
                                <p>{slot.name}</p>
                                <p className="text-muted-foreground">{slot.world?.game ? slot.world?.game : "Choosing Game"}</p>
                            </div>
                        </div>
                    )}
                </ScrollArea>

            </div>
            <Separator orientation="vertical"/>
            <div className="flex-1 h-full min-h-0 flex flex-col justify-between">
                <div className="flex-1 min-h-0 flex flex-col">
                    {currentSlot ?
                        <>
                        {currentSlot.status === "gameOptions" ?
                            <div className="flex-1 min-h-0 flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <Input
                                        className="h-10"
                                        value={currentSlot.name}
                                    ></Input>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="w-10 h-10"
                                        onClick={() => {
                                            removeSlot(currentSlot.id)
                                            setSelected(slotList[0].id)
                                        }}
                                    >
                                        <TrashIcon/>
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1 min-h-0">
                                    <FieldSet>
                                        {currentSlot.options?.success && Object.entries(currentSlot.options.options).map(([groupName, groupOptions]) => (
                                            <FieldGroup key={groupName}>
                                                <FieldLegend>{groupName}</FieldLegend>
                                                {groupOptions.map((option) => {
                                                    if (option.type === "toggle") {
                                                        return <Field>
                                                            <FieldLabel>{option.display_name}</FieldLabel>
                                                            <Switch
                                                                checked={(currentSlot.values?.[option.name].valueOf()) == true}
                                                                onCheckedChange={(e) => updateOptionValue(option.name, e)}
                                                            />
                                                        </Field>
                                                    }
                                                    if (option.type === "range") {
                                                        return <Field>
                                                            <FieldLabel>{option.display_name}</FieldLabel>
                                                            <Slider
                                                                min={option.min}
                                                                max={option.max}
                                                                value={
                                                                    currentSlot.values?.[option.name] !== undefined
                                                                        ? [Number(currentSlot.values[option.name])]
                                                                        : undefined
                                                                }
                                                                onValueChange={(values) => updateOptionValue(option.name, values[0])}
                                                            ></Slider>
                                                        </Field>
                                                    }
                                                    if (option.type === "named_range") {
                                                        return <Field>
                                                            <FieldLabel>{option.display_name}</FieldLabel>
                                                            <Slider
                                                                min={option.min}
                                                                max={option.max}
                                                                value={
                                                                    currentSlot.values?.[option.name] !== undefined
                                                                        ? [Number(currentSlot.values[option.name])]
                                                                        : undefined
                                                                }
                                                                onValueChange={(values) => updateOptionValue(option.name, values[0])}
                                                            ></Slider>
                                                        </Field>
                                                    }
                                                    if (option.type === "choice") {
                                                        const rawVal = currentSlot.values?.[option.name] ?? option.default;
                                                        const strRawVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : "";

                                                        const entries = Array.isArray(option.options)
                                                            ? option.options.map((v, i) => [String(i), v])
                                                            : Object.entries(option.options || {});

                                                        const items = entries.map(([k, v], idx) => {
                                                            let label = String(v);
                                                            if (typeof v === "number" || (!isNaN(Number(v)) && isNaN(Number(k)))) {
                                                                label = String(k);
                                                            }
                                                            return {
                                                                selectValue: String(k),
                                                                keyStr: String(k),
                                                                valStr: String(v),
                                                                indexStr: String(idx),
                                                                label: formatChoiceLabel(label),
                                                            };
                                                        });

                                                        const selectedItem =
                                                            items.find((item) => item.keyStr === strRawVal) ||
                                                            items.find((item) => item.valStr === strRawVal) ||
                                                            items.find((item) => item.indexStr === strRawVal) ||
                                                            items[0];

                                                        return <Field>
                                                            <FieldLabel>{option.display_name}</FieldLabel>
                                                            <Select
                                                                value={selectedItem?.selectValue ?? ""}
                                                                onValueChange={(val) => updateOptionValue(option.name, val)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue/>
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectGroup>
                                                                        <SelectLabel>{option.display_name}</SelectLabel>
                                                                        {items.map((item) => (
                                                                            <SelectItem key={item.selectValue} value={item.selectValue}>
                                                                                {item.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                        </Field>
                                                    }
                                                    if (option.type === "text_choice") {
                                                        const rawVal = currentSlot.values?.[option.name] ?? option.default ?? "";
                                                        const strRawVal = String(rawVal);

                                                        const suggestions = Array.isArray(option.options)
                                                            ? option.options.map((v) => String(v))
                                                            : Object.values(option.options || {}).map((v) => String(v));

                                                        return <Field>
                                                            <FieldLabel>{option.display_name}</FieldLabel>
                                                            <Combobox items={suggestions} value={strRawVal} onValueChange={(v) => updateOptionValue(option.name, v)}>
                                                                <ComboboxInput/>
                                                                <ComboboxContent>
                                                                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                                                                    <ComboboxList>
                                                                        {(item) => (
                                                                            <ComboboxItem key={item} value={item}>
                                                                                {formatChoiceLabel(item)}
                                                                            </ComboboxItem>
                                                                        )}
                                                                    </ComboboxList>
                                                                </ComboboxContent>
                                                            </Combobox>
                                                        </Field>
                                                    }
                                                    if (option.type === "text") {
                                                        return <Field>
                                                            <FieldLabel>{option.display_name}</FieldLabel>
                                                            <Input
                                                                value={String(currentSlot.values?.[option.name].valueOf())}
                                                                onChange={(e) => updateOptionValue(option.name, e.target.value)}
                                                            />
                                                        </Field>
                                                    }
                                                    if (option.type === "list") {
                                                        const entries = Array.isArray(currentSlot.values?.[option.name])
                                                            ? currentSlot.values?.[option.name] as string[]
                                                            : []
                                                        return <Field>
                                                            <FieldLabel>{option.display_name}</FieldLabel>
                                                            <ListOption id={option.name} name={option.display_name} items={entries} onEdit={updateOptionValue} />
                                                        </Field>
                                                    }
                                                })}
                                            </FieldGroup>
                                        ))}
                                    </FieldSet>
                                </ScrollArea>
                            </div> :
                            <ScrollArea className="flex-1 min-h-0">
                                <div className="flex flex-col gap-4">
                                    <h1 className="text-xl">Choose a game</h1>

                                    <InputGroup>
                                        <InputGroupAddon>
                                            <SearchIcon/>
                                        </InputGroupAddon>
                                        <InputGroupInput
                                            placeholder="Search..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </InputGroup>
                                    <div className="grid grid-cols-2 gap-2">
                                        {worlds?.filter((w) => w.game?.toLowerCase().startsWith(searchQuery.toLowerCase())).map((world) => (
                                            <div
                                                key={world.path}
                                                className="bg-card p-2 rounded-sm border"
                                                onClick={() => {
                                                    updateSlot(currentSlot?.id, {world: world, status: "gameOptions", options: undefined});
                                                    setSearchQuery("");
                                                }}
                                            >
                                                {world.game}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </ScrollArea>
                        }
                        </> : <div></div>
                    }
                </div>
                <div className="min-h-0">
                    <Separator/>
                    <div className="flex justify-between items-center p-2 pt-6">
                        <p className="text-muted-foreground">{slotList.length} Slots configured</p>
                        <Button className="bg-accent">Continue</Button>
                    </div>
                </div>
            </div>
        </main>
    )
}