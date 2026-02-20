import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', // Light gray background
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 30, // Adjusted down from 20
        paddingBottom: 20,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 22, // Adjusted to match 30px padding
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F7F7F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontFamily: 'Poppins_600SemiBold',
        color: '#111111',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 10, // Reduced from 20 to move contents up
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Poppins_500Medium', // Slightly lighter weight for non-caps
        color: '#111111', // Match icons and row labels
        marginBottom: 12, // Slightly less margin
        // textTransform: 'uppercase', // Removed as requested
        // letterSpacing: 1, // Removed
    },
    settingsGroup: {
        backgroundColor: '#FFFFFF', // White cards
        borderRadius: 20,
        padding: 0,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        // Add subtle shadow for white cards on grey background
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF', // White background for items
    },
    settingsItemText: {
        fontSize: 16,
        fontFamily: 'OpenSans_400Regular',
        color: '#111111',
    },
    settingsItemValue: {
        fontSize: 16,
        fontFamily: 'OpenSans_400Regular',
        color: '#6B7280',
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 16,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    signOutButton: {
        backgroundColor: '#FFF1F1',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    signOutText: {
        fontSize: 16,
        fontFamily: 'Poppins_600SemiBold',
        color: '#FF3B30',
        marginLeft: 8,
    },
});
