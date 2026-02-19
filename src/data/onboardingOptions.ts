export const CONCERN_OPTIONS = [
    { id: 'clean-eating', label: 'Clean Eating', icon: 'leaf-outline' as const },
    { id: 'acne-safe', label: 'Acne Safe', icon: 'sparkles-outline' as const },
    { id: 'weight-loss', label: 'Weight Loss', icon: 'fitness-outline' as const },
    { id: 'kids-safe', label: 'Kids Safe', icon: 'happy-outline' as const },
    { id: 'vegan', label: 'Vegan', icon: 'nutrition-outline' as const },
    { id: 'high-protein', label: 'High Protein', icon: 'barbell-outline' as const },
    { id: 'low-sugar', label: 'Low Sugar', icon: 'cube-outline' as const },
    { id: 'heart-healthy', label: 'Heart Healthy', icon: 'heart-outline' as const },
    { id: 'organic', label: 'Organic', icon: 'flower-outline' as const },
    { id: 'non-gmo', label: 'Non-GMO', icon: 'shield-checkmark-outline' as const },
];

export const ALLERGY_OPTIONS = [
    { id: 'shellfish', label: 'Shellfish', icon: 'fish-outline' as const },
    { id: 'eggs', label: 'Eggs', icon: 'egg-outline' as const },
    { id: 'milk', label: 'Milk', icon: 'cafe-outline' as const },
    {
        id: 'soy',
        label: 'Soy',
        icon: 'water-outline' as const,
        image: require('../../images/soy.png'),
        selectedImage: require('../../images/soyFlip.png')
    },
    { id: 'gluten', label: 'Gluten', icon: 'nutrition-outline' as const },
    {
        id: 'nuts',
        label: 'Nuts',
        icon: 'leaf-outline' as const,
        image: require('../../images/peanut.png'),
        selectedImage: require('../../images/hazelnutFlipped.png')
    },
];
