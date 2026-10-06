import { cn } from "cn"
import {HugeiconsIcon} from "@hugeicons/react";
import {LoaderCircleIcon} from "@hugeicons/core-free-icons";

function Spinner({ className }: React.ComponentProps<"svg">) {
    return (
        <HugeiconsIcon
            icon={LoaderCircleIcon}
            data-slot="spinner"
            role="status"
            aria-label="Loading"
            className={cn("size-4 animate-spin", className)}
        />
    )
}

export { Spinner }
