import {appStore, ConfigKeys, ConfigTypes} from "@/utils/store.ts";
import {useEffect, useRef, useState} from "react";

export function useConfig<K extends ConfigKeys>(key: K, defaultValue: ConfigTypes[K]) {
    const [value, setValue] = useState<ConfigTypes[K]>(defaultValue)
    const [loading, setLoading] = useState(true)
    const isFirstRender = useRef(true)

    async function loadInitialValue() {
        try {
            const savedValue = await appStore.get(key)
            if (savedValue !== null) {
                setValue(savedValue)
            }
        } catch (error) {
            console.error(`Error loading config from key ${key}:`, error)
        } finally {
            setLoading(false)
        }
    }

    async function saveValue() {
        try {
            await appStore.set(key, value)
        } catch (error) {
            console.error(`Error saving config to key ${key}:`, error)
        }
    }

    useEffect(() => {
        loadInitialValue()
    }, [key])

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        if (!loading) {
            saveValue()
        }
    }, [value, loading, key])

    return [value, setValue] as const
}