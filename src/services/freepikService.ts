
const FREEPIK_API_URL = 'https://api.freepik.com/v1';
const API_KEY = process.env.EXPO_PUBLIC_FREEPIK_API_KEY;

export interface FreepikTaskResponse {
    task_id: string;
    status: string;
    generated?: string[]; // Array of URLs
}

/**
 * Service to interact with Freepik AI Icon Generation API
 */
export const freepikService = {
    /**
     * Start the icon generation process
     * Note: We use a dummy webhook_url because the documentation requires it, 
     * but we will poll for the status instead.
     */
    async generateIcon(prompt: string, style: 'solid' | 'outline' | 'color' | 'flat' | 'sticker' = 'solid'): Promise<string | null> {
        if (!API_KEY) {
            console.error('Freepik API Key is missing in .env');
            return null;
        }

        try {
            console.log(`[Freepik] Starting generation for: "${prompt}"`);
            const response = await fetch(`${FREEPIK_API_URL}/ai/text-to-icon`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-freepik-api-key': API_KEY,
                },
                body: JSON.stringify({
                    prompt: `A direct, literal, and highly recognizable minimalist solid icon of "${prompt}". Professional clean glyph, single isolated object, no text, no borders, no backgrounds.`,
                    webhook_url: 'https://example.com/webhook',
                    style,
                    format: 'png',
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Freepik] API Error (${response.status}):`, errorText);
                return null;
            }

            const data = await response.json();
            console.log('[Freepik] Creation Response:', data);

            if (data.data?.task_id) {
                return data.data.task_id;
            }
            console.error('[Freepik] Unexpected response format:', data);
            return null;
        } catch (error) {
            console.error('[Freepik] Service Exception:', error);
            return null;
        }
    },

    /**
     * Poll for the status of a task
     */
    async checkTaskStatus(taskId: string): Promise<{ status: string; url?: string } | null> {
        if (!API_KEY) {
            console.error('[Freepik] API Key missing during poll');
            return null;
        }

        try {
            // Try the specific text-to-icon status endpoint first
            let response = await fetch(`${FREEPIK_API_URL}/ai/text-to-icon/${taskId}`, {
                method: 'GET',
                headers: { 'x-freepik-api-key': API_KEY },
            });

            // If it returns 404 or generic error, try the tasks endpoint
            if (response.status === 404 || response.status === 400) {
                console.log(`[Freepik] Status 404/400, trying generic tasks endpoint for ${taskId}`);
                response = await fetch(`${FREEPIK_API_URL}/ai/tasks/${taskId}`, {
                    method: 'GET',
                    headers: { 'x-freepik-api-key': API_KEY },
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[Freepik] Poll API Error (${response.status}):`, errorText);
                return null;
            }

            const data = await response.json();
            console.log(`[Freepik] Status for ${taskId}:`, data?.data?.status || 'Unknown');

            if (data.data) {
                const status = data.data.status;
                const url = data.data.generated?.[0] || data.data.output?.[0]; // Check both common response fields
                return { status, url };
            }
            return null;
        } catch (error) {
            console.error('[Freepik] Poll Exception:', error);
            return null;
        }
    },

    /**
     * Helper to wait for task completion via polling (max 60 seconds)
     */
    async waitForIcon(taskId: string, maxAttempts = 20, interval = 3000): Promise<string | null> {
        console.log(`[Freepik] Starting poll for task ${taskId}...`);
        for (let i = 0; i < maxAttempts; i++) {
            const result = await this.checkTaskStatus(taskId);
            if (result?.status === 'COMPLETED' && result.url) {
                console.log(`[Freepik] Task ${taskId} Success! URL:`, result.url);
                return result.url;
            }
            if (result?.status === 'FAILED') {
                console.error(`[Freepik] Task ${taskId} failed.`);
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        console.warn(`[Freepik] Task ${taskId} timed out after ${maxAttempts} attempts.`);
        return null;
    }
};
