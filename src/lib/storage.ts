import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_DATA_STORAGE_KEY = 'nouri_onboarding_data';

export interface OnboardingData {
    concerns: string[];
    allergies: string[];
    shopping: string[];
    ultraProcessedIntake: number;
}

export const loadOnboardingData = async (): Promise<OnboardingData> => {
    try {
        const jsonValue = await AsyncStorage.getItem(USER_DATA_STORAGE_KEY);
        if (jsonValue != null) {
            const data = JSON.parse(jsonValue);
            return {
                concerns: data.concerns || [],
                allergies: data.allergies || [],
                shopping: data.shopping || [],
                ultraProcessedIntake: data.ultraProcessedIntake ?? 0
            };
        }
        return { concerns: [], allergies: [], shopping: [], ultraProcessedIntake: 0 };
    } catch (e) {
        console.warn('Failed to load onboarding data:', e);
        return { concerns: [], allergies: [], shopping: [], ultraProcessedIntake: 0 };
    }
};

export const saveOnboardingData = async (data: Partial<OnboardingData>) => {
    try {
        // Load existing data first to merge
        const currentData = await loadOnboardingData();
        const newData = { ...currentData, ...data };
        const jsonValue = JSON.stringify(newData);
        await AsyncStorage.setItem(USER_DATA_STORAGE_KEY, jsonValue);
    } catch (e) {
        console.warn('Failed to save onboarding data:', e);
    }
};

export const clearOnboardingData = async () => {
    try {
        await AsyncStorage.removeItem(USER_DATA_STORAGE_KEY);
    } catch (e) {
        console.warn('Failed to clear onboarding data:', e);
    }
};
