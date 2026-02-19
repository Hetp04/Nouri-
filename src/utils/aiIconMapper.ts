import { Ionicons } from '@expo/vector-icons';

type IconName = keyof typeof Ionicons.glyphMap;

interface AIResult {
    icon: IconName;
    category: string;
}

/**
 * AI-like semantic mapper for food and health icons.
 * Matches user-entered text to the best visual representation from Ionicons (outline style).
 */
export const getAISuggestedIcon = (text: string, type: 'concerns' | 'allergies'): AIResult => {
    const input = text.toLowerCase().trim();

    // 1. Exact & Keyward Matches (The "Heart" of the AI)
    const mappings: { keywords: string[]; icon: IconName; category: string }[] = [
        {
            keywords: ['milk', 'dairy', 'cheese', 'yogurt', 'lactose', 'cream'],
            icon: 'cafe-outline',
            category: 'dairy'
        },
        {
            keywords: ['fish', 'salmon', 'tuna', 'shrimp', 'seafood', 'shellfish', 'crab', 'lobster'],
            icon: 'fish-outline',
            category: 'seafood'
        },
        {
            keywords: ['meat', 'beef', 'steak', 'chicken', 'pork', 'turkey', 'protein', 'bacon'],
            icon: 'barbell-outline', // Symbolic for protein/muscle
            category: 'protein'
        },
        {
            keywords: ['fruit', 'apple', 'banana', 'berry', 'strawberry', 'grape', 'lemon', 'orange', 'mango'],
            icon: 'nutrition-outline',
            category: 'fruit'
        },
        {
            keywords: ['veg', 'carrot', 'broccoli', 'spinach', 'kale', 'organic', 'green', 'leaf', 'salad'],
            icon: 'leaf-outline',
            category: 'vegetable'
        },
        {
            keywords: ['seed', 'nut', 'almond', 'peanut', 'walnut', 'cashew', 'pistachio', 'chia'],
            icon: 'leaf-outline',
            category: 'nuts'
        },
        {
            keywords: ['bread', 'wheat', 'gluten', 'grain', 'pasta', 'rice', 'carb', 'oat', 'flour'],
            icon: 'nutrition-outline',
            category: 'grain'
        },
        {
            keywords: ['sugar', 'sweet', 'candy', 'dessert', 'chocolate', 'honey', 'syrup', 'glucose'],
            icon: 'cube-outline',
            category: 'sugar'
        },
        {
            keywords: ['drink', 'water', 'juice', 'soda', 'coke', 'bev', 'liquid', 'tea', 'coffee', 'caffeine'],
            icon: 'cafe-outline',
            category: 'beverage'
        },
        {
            keywords: ['egg', 'omelette', 'yolk'],
            icon: 'egg-outline',
            category: 'egg'
        },
        {
            keywords: ['heart', 'cardio', 'cholesterol', 'blood', 'pressure'],
            icon: 'heart-outline',
            category: 'health'
        },
        {
            keywords: ['skin', 'acne', 'glow', 'beauty', 'face', 'clear'],
            icon: 'sparkles-outline',
            category: 'skincare'
        },
        {
            keywords: ['weight', 'fat', 'loss', 'slim', 'diet', 'burn'],
            icon: 'fitness-outline',
            category: 'weight'
        },
        {
            keywords: ['kid', 'child', 'baby', 'family', 'son', 'daughter'],
            icon: 'happy-outline',
            category: 'family'
        },
        {
            keywords: ['chemical', 'msg', 'dye', 'color', 'additive', 'preservative', 'science', 'flask', 'beaker'],
            icon: 'flask-outline',
            category: 'chemical'
        },
        {
            keywords: ['shield', 'safe', 'protect', 'immune', 'defense'],
            icon: 'shield-checkmark-outline',
            category: 'safety'
        },
        {
            keywords: ['flower', 'plant', 'pollen', 'natural', 'nature'],
            icon: 'flower-outline',
            category: 'nature'
        }
    ];

    // Search logic
    for (const group of mappings) {
        if (group.keywords.some(k => input.includes(k))) {
            return { icon: group.icon, category: group.category };
        }
    }

    // 2. Default Fallbacks if no keywords match
    if (type === 'allergies') {
        return { icon: 'warning-outline', category: 'unknown_allergy' };
    }

    return { icon: 'medical-outline', category: 'unknown_concern' };
};
