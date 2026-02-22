import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 280, // Start below the widget + search bar + filter bar
        bottom: 32,
        right: 16, // Align with widget right margin
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
        elevation: 50,
    },
    container: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)', // Sleek modern glass
        borderRadius: 100,
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    letterButton: {
        paddingHorizontal: 4,
        paddingVertical: 1.8,
    },
    letterText: {
        color: '#2F6B4F', // Brand green for a modern look
        fontSize: 10.5,
        fontWeight: '600',
    },
});
