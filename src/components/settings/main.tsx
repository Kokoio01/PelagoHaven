import {Card, CardContent, CardHeader, CardTitle} from "../ui/card";
import {InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput} from "@/components/ui/input-group.tsx";
import {FolderIcon} from "lucide-react";
import {useConfig} from "@/hooks/useConfig.ts";
import {open} from "@tauri-apps/plugin-dialog";

export default function MainSettings() {
    const [path, setPath] = useConfig("archipelago:windows:path", "")

    async function handleSelectFolder() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Archipelago Installation Folder'
            });

            if (selected && typeof selected === 'string') {
                setPath(selected);
            }
        } catch (err) {
            console.error('Error opening directory picker:', err);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>
                    <h1>Archipelago Install Folder</h1>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <InputGroup>
                    <InputGroupInput
                        type="text"
                        readOnly
                        value={path}
                        placeholder="No folder selected"
                    />
                    <InputGroupAddon align="inline-end">
                        <InputGroupButton onClick={handleSelectFolder}>
                            <FolderIcon/>
                        </InputGroupButton>
                    </InputGroupAddon>
                </InputGroup>
            </CardContent>
        </Card>
    )
}