import {
    Dialog,
    DialogContent, DialogDescription, DialogHeader, DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog.tsx";
import {Button} from "@/components/ui/button.tsx";
import {AlertTriangleIcon, FileArchiveIcon, FileIcon, InfoIcon, PlusIcon, UploadIcon, XIcon} from "lucide-react";
import {Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle} from "@/components/ui/empty.tsx";
import {useEffect, useState} from "react";
import {UnlistenFn} from "@tauri-apps/api/event";
import {getCurrentWindow} from "@tauri-apps/api/window";
import {WorldAnalysis} from "@/types/worlds.ts";
import {invoke} from "@tauri-apps/api/core";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert.tsx";
import {open} from "@tauri-apps/plugin-dialog";
import {Spinner} from "@/components/ui/spinner.tsx";

function extractPaths(payload: unknown): string[] {
    if (Array.isArray(payload) && payload.every((p) => typeof p === "string")) {
        return payload as string[];
    }
    if (
        payload &&
        typeof payload === "object" &&
        "paths" in (payload as Record<string, unknown>) &&
        Array.isArray((payload as { paths: unknown }).paths)
    ) {
        const paths = (payload as { paths: unknown[] }).paths;
        return paths.filter((p): p is string => typeof p === "string");
    }
    return [];
}

type InstallAPWorldProps = {
    onInstall: () => void;
};

export function InstallAPWorld({onInstall}: InstallAPWorldProps) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<string | null>(null)
    const [analysis, setAnalysis] = useState<WorldAnalysis | null>(null)
    const [installing, setInstalling] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        let unlistenDrop: UnlistenFn;
        let unlistenEnter: UnlistenFn;
        let unlistenLeave: UnlistenFn;
        let unlistenOver: UnlistenFn;

        async function setupListeners() {
            const win = getCurrentWindow();

            unlistenDrop = await win.listen('tauri://drag-drop', (event) => {
                setIsDragging(false);

                const paths = extractPaths(event.payload);
                const droppedFile = paths.find((path) => path.endsWith(".apworld"));

                if (droppedFile) {
                    setFile(droppedFile);
                }
            });

            unlistenEnter = await win.listen("tauri://drag-enter", () => {
                setIsDragging(true);
            });

            unlistenLeave = await win.listen("tauri://drag-leave", () => {
                setIsDragging(false);
            });

            unlistenOver = await win.listen("tauri://drag-over", () => {
                setIsDragging(true);
            });
        }

        setupListeners();

        return () => {
            if (unlistenDrop) unlistenDrop();
            if (unlistenEnter) unlistenEnter();
            if (unlistenLeave) unlistenLeave();
            if (unlistenOver) unlistenOver();
        }
    }, []);

    useEffect(() => {
        if (!file) return;
        invoke<WorldAnalysis>("analyze_world", {path: file})
            .then((value) => setAnalysis(value))
            .catch(() => setAnalysis({errors: ["Unable to analyse World!"]}))
    }, [file]);

    function onOpenChange(open: boolean) {
        setDialogOpen(open)
        if (!open) {
            setAnalysis(null)
            setFile(null)
            setInstalling(false)
            setError("")
            setIsDragging(false)
        }
    }

    async function handleSelectFolder() {
        try {
            const selected = await open({
                directory: false,
                multiple: false,
                filters: [{
                    extensions: ["apworld"],
                    name: "Archipelago World"
                }],
                title: 'Select APWorld'
            });

            if (selected && typeof selected === 'string') {
                setFile(selected);
            }
        } catch (err) {
            console.error('Error opening directory picker:', err);
        }
    }

    function installWorld() {
        if (installing) return;
        if ((analysis?.errors?.length || 0) >= 1 || !file || !analysis) return;

        setInstalling(true)

        invoke<Boolean>("install_world", {path: file})
            .then(() => {
                onInstall()
                setDialogOpen(false)
            })
            .catch((err) => {
                setInstalling(false)
                setError(err)

                setTimeout(() => setError(""), 3000)
            })
    }

    return (
        <Dialog onOpenChange={onOpenChange} open={dialogOpen}>
            <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent-muted">
                    <PlusIcon/>
                    <p>Add APWorld</p>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Install APWorld</DialogTitle>
                    <DialogDescription>Select any .apworld File to install it</DialogDescription>
                </DialogHeader>
                <div className="flex h-125 w-full gap-6 mt-4">
                    <Empty
                        className={`flex-1 border-2 border-dashed rounded-lg transition-colors pointer-events-none ${
                            isDragging ? 'border-primary bg-primary/10' : 'bg-muted/10'
                        }`}
                    >
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                {!file ?
                                    <UploadIcon className={isDragging ? "text-primary" : ""} /> :
                                    <FileIcon className={isDragging ? "text-primary" : ""} />
                                }
                            </EmptyMedia>
                            <EmptyTitle>{!file ? "Drop .apworld file here" : file.split("\\").at(-1)}</EmptyTitle>
                            {!file ?
                                <EmptyDescription>
                                    Drag and drop a valid APWorld package, or click to browse your files.
                                </EmptyDescription> : undefined
                            }
                        </EmptyHeader>
                        <EmptyContent>
                            <Button
                                variant="outline"
                                size="sm"
                                className="pointer-events-auto"
                                onClick={handleSelectFolder}
                            >
                                Select File
                            </Button>
                        </EmptyContent>
                    </Empty>
                    <div className="hidden md:block w-px bg-border shrink-0" />
                    <div className="w-80 flex flex-col shrink-0">
                        { analysis ?
                            <div className="flex flex-col justify-between h-full pb-4">
                                {analysis.manifest ?
                                    <div className="gap-2 flex flex-col">
                                        { analysis.manifest?.game ?
                                            <div>
                                                <p className="font-extrabold text-primary/50">Name</p>
                                                <p>{analysis.manifest?.game}</p>
                                            </div> : <p/>
                                        }
                                        { analysis.manifest?.world_version ?
                                            <div>
                                                <p className="font-extrabold text-primary/50">Version</p>
                                                <p>{analysis.manifest?.world_version}</p>
                                            </div> : <p/>
                                        }
                                        { analysis.manifest?.authors ?
                                            <div>
                                                <p className="font-extrabold text-primary/50">Authors</p>
                                                <p>{analysis.manifest?.authors?.join(", ")}</p>
                                            </div> : <p/>
                                        }
                                    </div> : undefined
                                }
                                <div className="flex flex-col gap-2">
                                    {analysis.errors?.map((err) =>
                                        <Alert className="dark:bg-amber-950">
                                            <AlertTriangleIcon/>
                                            <AlertTitle>
                                                {err}
                                            </AlertTitle>
                                        </Alert>
                                    )}
                                    {!analysis.errors ?
                                        <Alert>
                                            <InfoIcon/>
                                            <AlertTitle>
                                                Execution Warning
                                            </AlertTitle>
                                            <AlertDescription>
                                                Archipelago Worlds can execute arbitrary code on your Machine!
                                                Before installing a World make sure you trust the source and the author of this world!
                                            </AlertDescription>
                                        </Alert> : undefined
                                    }
                                </div>
                            </div> :
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3 p-4">
                                <FileArchiveIcon className={`h-10 w-10 ${file ? 'opacity-100 text-primary' : 'opacity-20'}`} />
                                <p className="text-sm break-all">No APWorld selected</p>
                            </div>
                        }

                        <div className="mt-auto pt-4 border-t">
                            <Button
                                className="w-full"
                                disabled={(analysis?.errors?.length || 0) >= 1 || !file || !analysis}
                                variant={error ? "destructive" : "default"}
                                onClick={installWorld}
                            >
                                {error ?
                                    <>
                                        <XIcon/>
                                        {error}
                                    </> :
                                    <>
                                        {installing ? <Spinner/> : undefined}
                                        Install World
                                    </>
                                }
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}