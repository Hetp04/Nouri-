import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FBFBF9',
    },
    safeArea: {
        flex: 1,
    },
    main: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 8, // Tightened from 16
        paddingBottom: 24, // Tightened from 32
    },
    header: {
        marginBottom: 16, // Tightened from 24
    },
    progressContainer: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 12, // Tightened from 14
    },
    progressStep: {
        flex: 1,
        height: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 2,
    },
    progressStepActive: {
        backgroundColor: '#2F6B4F',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 8, // Tightened from 12
    },
    avatarImage: {
        width: 188, // Tiny tiny bit smaller
        height: 188,
    },
    title: {
        fontSize: 26,
        fontWeight: '700', // Stronger weight
        letterSpacing: -0.8, // More aggressive tracking
        color: '#1A1C1E',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 18, // Tighter leading
        color: '#6E6E80',
    },
    content: {
        flex: 1,
    },
    factsList: {
        gap: 10, // Tighter gap
        paddingVertical: 12,
    },
    factCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F7', // Softer, warmer gray
        borderRadius: 20, // Slightly tighter radius
        padding: 14, // Tighter padding
        borderWidth: 0, // Remove any generic borders
    },
    factIconContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        // Fine micro-shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    factTextContainer: {
        flex: 1,
    },
    factTitle: {
        fontSize: 15,
        fontWeight: '700', // Handcrafted feel
        color: '#111827',
        marginBottom: 1,
        letterSpacing: -0.2,
    },
    factContent: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
        lineHeight: 17,
    },
    footerContainer: {
        paddingTop: 12,
    },
    footerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        width: 52,
        height: 52,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButton: {
        flex: 1,
        height: 52,
        borderRadius: 8,
        backgroundColor: '#2F6B4F',
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
