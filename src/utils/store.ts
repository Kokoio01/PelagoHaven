import {load, Store} from "@tauri-apps/plugin-store";

type ConfigTypes = {
    "archipelago:path": string;
}

export type ConfigKeys = keyof ConfigTypes;

class AppStore {
    private readonly filename: string;
    private store: Store | undefined;

    constructor(filename: string) {
         this.filename = filename;
    }

    private async loadStore(): Promise<Store> {
        if (!this.store) {
            this.store = await load(this.filename, {
                createNew: false,
                defaults: {},
                deserializeFnName: "",
                overrideDefaults: false,
                serializeFnName: "",
                autoSave: 1
            });
        }
        return this.store;
    }

    public async get<T extends ConfigKeys>(key: T): Promise<ConfigTypes[T] | null> {
        const store = await this.loadStore();
        return await store.get(key) as ConfigTypes[T] | null;
    }

    public async set<T extends ConfigKeys>(key: T, value: ConfigTypes[T]): Promise<void> {
        const store = await this.loadStore();
        await store.set(key, value);
    }
}

export const appStore = new AppStore("config.json");