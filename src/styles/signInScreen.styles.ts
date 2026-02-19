import { StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FBFBF9',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginTop: 8,
        marginBottom: 8,
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarImage: {
        width: 240,
        height: 240,
    },
    titleSection: {
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 16,
        color: '#6E6E80',
        textAlign: 'center',
    },
    form: {
        gap: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F4EF', // Slightly darker to maintain contrast
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EAE9E4',
        paddingHorizontal: 16,
        height: 56,
    },
    inputWrapperFocused: {
        borderColor: '#2F6B4F',
    },
    iconContainer: {
        width: 20,
        height: 20,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#111111',
    },
    signInButton: {
        backgroundColor: '#2F6B4F',
        borderRadius: 14,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2F6B4F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    signInButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 18,
        marginBottom: 18,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#F3F4F6',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: '#9CA3AF',
    },
    actions: {
        gap: 16,
        marginTop: 20,
    },
    socialButton: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        gap: 12,
    },
    appleButton: {
        backgroundColor: '#000000',
        borderColor: '#000000',
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
    },
    emailButton: {
        backgroundColor: '#F7F6F2',
        borderColor: '#EAE9E4',
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    appleButtonText: {
        color: '#FFFFFF',
    },
    googleButtonText: {
        color: '#111111',
    },
    emailButtonText: {
        color: '#111111',
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FBFBF9',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 8, // Less top padding since drag handle is there
        paddingBottom: 45,
        height: SCREEN_HEIGHT,
        width: '100%',
    },
    dragHandleContainer: {
        width: '100%',
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#EAE9E4',
        borderRadius: 3,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111111',
    },
    closeButton: {
        padding: 4,
    },
    formOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#2F6B4F',
        borderColor: '#2F6B4F',
    },
    rememberMeText: {
        fontSize: 14,
        color: '#6E6E80',
        fontWeight: '500',
    },
    forgotPassword: {
        // Alignment removed as it's now in formOptions
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#2F6B4F',
        fontWeight: '600',
    },
    footerLink: {
        marginTop: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#6E6E80',
    },
    footerLinkText: {
        color: '#2F6B4F',
        fontWeight: '600',
    },
    loadingContainer: {
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111111',
    },
});
