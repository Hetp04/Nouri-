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
    progressContainer: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
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
    backButtonHeader: {
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
        lineHeight: 22,
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
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-end',
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
    modalContent: {
        backgroundColor: '#FBFBF9',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 8, // Less top padding since drag handle is there
        paddingBottom: 45,
        height: SCREEN_HEIGHT, // Make it tall
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111111',
    },
    closeButton: {
        padding: 4,
    },
    form: {
        gap: 16,
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
        position: 'relative',
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
    signUpButton: {
        backgroundColor: '#2F6B4F',
        borderRadius: 14,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#2F6B4F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    signUpButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
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
    // Verification Styles
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        marginTop: 16,
    },
    codeInput: {
        width: 48,
        height: 56,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#EAE9E4',
        backgroundColor: '#F5F4EF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    codeInputText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#111111',
    },
    hiddenInput: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
    },
    codeInputFocused: {
        borderColor: '#2F6B4F',
        backgroundColor: '#FFFFFF',
        shadowColor: '#2F6B4F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    verificationText: {
        fontSize: 16,
        color: '#6E6E80',
        marginBottom: 24,
        lineHeight: 22,
    },
    emailHighlight: {
        color: '#111111',
        fontWeight: '600',
    },
    verifyButton: {
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
    verifyButtonDisabled: {
        backgroundColor: '#E5E7EB',
        shadowOpacity: 0,
        elevation: 0,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    gmailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7F6F2',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginTop: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#EAE9E4',
    },
    gmailIcon: {
        marginRight: 8,
    },
    gmailIconImage: {
        width: 20,
        height: 20,
        marginRight: 10,
        resizeMode: 'contain',
    },
    gmailButtonText: {
        color: '#111111',
        fontSize: 14,
        fontWeight: '600',
    },
    resendContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    resendText: {
        fontSize: 14,
        color: '#6E6E80',
    },
    resendLink: {
        color: '#2F6B4F',
        fontWeight: '600',
    },
    // Success Styles
    successContainer: {
        paddingVertical: 40,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        width: '100%',
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111111',
        marginTop: 24,
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 16,
        color: '#6E6E80',
        textAlign: 'center',
        lineHeight: 22,
    },
});
