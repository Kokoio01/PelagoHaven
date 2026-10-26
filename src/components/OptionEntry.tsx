import {Option} from "../types/options.ts";
import {HugeiconsIcon} from "@hugeicons/react";
import {Alert02Icon, CornerDownRightIcon, HelpCircleIcon} from "@hugeicons/core-free-icons";
import {Tooltip, TooltipContent, TooltipTrigger} from "./tooltip.tsx";
import {Switch} from "./switch.tsx";
import {Input} from "./input.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "./select.tsx";
import {Slider} from "./slider.tsx";
import {useCreatorStore} from "../stores/useCreatorStore.ts";

interface OptionEntryProps {
    slotId: string,
    category: string,
    name: string,
    option: Option
}

interface OptionTitleProps {
    option: Option
}

function convertDisplay(str: string): string {
    return str.replaceAll("_", " ").toLocaleLowerCase().replace(/\b\w/g, function (char) {
        return char.toUpperCase();
    });
}

export function OptionEntry({slotId, category, name, option}: OptionEntryProps) {
    const key = `${category}.${name}`;

    const overrideValue = useCreatorStore((state) => state.slots[slotId]?.overrides[key])

    const updateSlotOverride = useCreatorStore((state) => state.updateSlotOverride)
    const setValue = (val: unknown) => updateSlotOverride(slotId, category, name, val)

    const value = overrideValue !== undefined ? overrideValue : option.default
    switch (option.type) {
        case "Toggle":
        case "DefaultOnToggle": {
            return (
                <div className="flex w-full items-center justify-between">
                    <OptionTitle option={option}/>
                    <Switch
                        checked={value as boolean}
                        onCheckedChange={(c) => setValue(c)}
                    />
                </div>
            )
        }
        case "FreeText": {
            return (
                <div className="flex w-full items-center justify-between gap-10">
                    <OptionTitle option={option}/>
                    <Input
                        value={value as string}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </div>
            )
        }
        case "Choice": {
            const items = Object.entries(option.options).map(([label, value]) =>{ return  {label: convertDisplay(label), value: value}})
            return (
                <div className="flex w-full items-center justify-between">
                    <OptionTitle option={option}/>
                    <Select
                        items={items}
                        value={value as number}
                        onValueChange={(v) => setValue(v)}
                    >
                        <SelectTrigger className="w-full max-w-48">
                            <SelectValue placeholder="Select..."/>
                        </SelectTrigger>
                        <SelectContent>
                            {items.map((i) => (
                                <SelectItem key={i.label} value={i.value}>
                                    <p>{i.label}</p>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )
        }
        case "Range": {
            return (
                <div className="flex w-full items-center justify-between gap-10">
                    <OptionTitle option={option}/>
                    <Slider
                        min={option.range_start}
                        max={option.range_end}
                        className="max-w-70"
                        value={value as number}
                        onValueChange={(v) => setValue(v)}
                    />
                </div>
            )
        }
        case "NamedRange": {
            const items = Object.entries(option.special_range_names).map(([label, value]) =>{ return  {label: convertDisplay(label), value: value}})
            return (
                <div className="flex w-full min-h-17 justify-between gap-10 items-start">
                    <div className="pt-1">
                        <OptionTitle option={option}/>
                    </div>
                    <div className="flex flex-1 flex-col gap-5 max-w-70">
                        <Select
                            items={items}
                            value={value as number}
                            onValueChange={(v) => setValue(v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue className="w-full" placeholder="Custom"/>
                            </SelectTrigger>
                            <SelectContent>
                                {items.map((i) => (
                                    <SelectItem key={i.label} value={i.value}>
                                        <p>{i.label}</p>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Slider
                            min={option.range_start}
                            max={option.range_end}
                            value={value as number}
                            onValueChange={(v) => setValue(v)}
                            className="max-w-70"
                        />
                    </div>
                </div>
            )
        }
        default: {
            return (
                <div className="flex w-full items-center justify-between gap-10">
                    <OptionTitle option={option}/>
                    <Tooltip>
                        <TooltipTrigger>
                            <HugeiconsIcon icon={Alert02Icon} className="scale-80"/>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Unsupported Option Type: {option.type}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            )
        }
    }
}
export function OptionTitle({option}: OptionTitleProps) {
    let displayName
    if (option.display_name) displayName = option.display_name;
    else displayName = ((option.auto_display_name || true) ? convertDisplay(option.name) : option.name) || "Unkown"

    return (
        <div key={option.name} className="flex gap-2 items-center pl-1 shrink-0">
            <HugeiconsIcon icon={CornerDownRightIcon} className="scale-80"/>
            <p className="">{displayName}</p>
            <Tooltip>
                <TooltipTrigger className="flex scale-80 text-blue-400 items-center">
                    <HugeiconsIcon icon={HelpCircleIcon}/>
                </TooltipTrigger>
                <TooltipContent>
                    {option.rich_text_doc ? <div dangerouslySetInnerHTML={{ __html: option.description}}/> : <p>{option.description}</p>}
                </TooltipContent>
            </Tooltip>
        </div>
    )
}