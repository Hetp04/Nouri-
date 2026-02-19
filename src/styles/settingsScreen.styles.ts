import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
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
        paddingTop: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        color: '#6B7280',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    settingsGroup: {
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 8,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    settingsItemText: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'OpenSans_600SemiBold',
        color: '#111111',
    },
    settingsItemValue: {
        fontSize: 14,
        fontFamily: 'OpenSans_400Regular',
        color: '#6B7280',
        marginRight: 8,
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
