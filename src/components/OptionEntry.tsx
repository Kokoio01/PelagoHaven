import {Option, Visibility} from "../types/options.ts";
import {HugeiconsIcon} from "@hugeicons/react";
import {Alert02Icon, AlertCircleIcon, CornerDownRightIcon, HelpCircleIcon} from "@hugeicons/core-free-icons";
import {Tooltip, TooltipContent, TooltipTrigger} from "./ui/tooltip.tsx";
import {Switch} from "./ui/switch.tsx";
import {Input} from "./ui/input.tsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "./ui/select.tsx";
import {Slider} from "./ui/slider.tsx";
import {useCreatorStore} from "../stores/useCreatorStore.ts";

interface OptionEntryProps {
    slotId: string,
    category: string,
    name: string,
    visibility: Visibility,
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

export function OptionEntry({slotId, category, name, visibility, option}: OptionEntryProps) {
    const key = `${category}.${name}`;

    const overrideValue = useCreatorStore((state) => state.slots[slotId]?.overrides[key])

    const updateSlotOverride = useCreatorStore((state) => state.updateSlotOverride)
    const setValue = (val: unknown) => updateSlotOverride(slotId, category, name, val)

    if ((visibility & option.visibility) == 0) {
        return
    }

    const value = overrideValue !== undefined ? overrideValue : option.default
    switch (option.type) {
        case "Toggle":
        case "DefaultOnToggle": {
            return (
                <div className="flex w-full items-center justify-between min-h-10">
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
                <div className="flex w-full items-center justify-between gap-10 min-h-10">
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
                <div className="flex w-full items-center justify-between min-h-10">
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
        case "TextChoice": {
            const items = Object.entries(option.options).map(([label, value]) =>{ return  {label: convertDisplay(label), value: value}})
            return (
                <div className="flex w-full justify-between gap-10 items-start min-h-20">
                    <div className="pt-1">
                        <OptionTitle option={option}/>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 max-w-70">
                        <Select
                            items={items}
                            value={value as string}
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
                        <Input
                            value={value as string}
                            onChange={(e) => setValue(e.target.value)}
                            className="max-w-70"
                        />
                    </div>
                </div>
            )
        }
        case "Range": {
            return (
                <div className="flex w-full items-center justify-between gap-10 min-h-10">
                    <OptionTitle option={option}/>
                    <div className="flex w-full items-center max-w-60 gap-2">
                        <Slider
                            min={option.range_start}
                            max={option.range_end}
                            className="flex-1"
                            value={value as number}
                            onValueChange={(v) => setValue(v)}
                        />
                        <p className="flex justify-center text-center min-w-5">
                            {value as number}
                        </p>
                    </div>
                </div>
            )
        }
        case "NamedRange": {
            const items = Object.entries(option.special_range_names).map(([label, value]) =>{ return  {label: convertDisplay(label), value: value}})
            return (
                <div className="flex w-full justify-between gap-10 items-start min-h-17">
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
        case "Removed": {
            return (
                <div className="flex w-full items-center justify-between gap-10 min-h-10">
                    <OptionTitle option={option}/>
                    <Tooltip>
                        <TooltipTrigger>
                            <HugeiconsIcon icon={AlertCircleIcon} className="scale-80"/>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>This Option has been removed from the world</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            )
        }
        default: {
            return (
                <div className="flex w-full items-center justify-between gap-10 min-h-10">
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