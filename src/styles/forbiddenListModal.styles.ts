import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
    },
    // Outer shell: handles absolute positioning + shadow only.
    // Height is NOT set here — it’s animated on the inner Animated.View.
    modalSlider: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
    },
    // Inner sheet: visual chrome + height (height overridden by Animated.View inline)
    modalContainer: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },

    // ── Header ──────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F2',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 59, 48, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 18,
        color: '#111111',
        letterSpacing: -0.5,
    },
    editButton: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: 'rgba(47, 107, 79, 0.08)',
    },
    editButtonText: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 14,
        color: '#2F6B4F',
    },
    editButtonDone: {
        color: '#2F6B4F',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Tab Toggle ──────────────────────────────────────────
    toggleWrapper: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 14,
        padding: 4,
        position: 'relative',
        height: 44,
    },
    toggleSlider: {
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 4,
        width: (SCREEN_WIDTH - 48 - 8) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    toggleText: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 14,
        color: '#6B7280',
    },
    toggleTextActive: {
        color: '#111111',
        fontFamily: 'Poppins_600SemiBold',
    },

    // ── Pill Grid ───────────────────────────────────────────
    contentScrollView: {
        flex: 1,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        padding: 24,
        paddingTop: 4,
    },

    // Selected pill (matches onboarding)
    optionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 100,
        backgroundColor: 'rgba(47, 107, 79, 0.1)',
        borderWidth: 1.5,
        borderColor: '#2F6B4F',
        gap: 6,
    },
    // Unselected pill (visible only in edit mode)
    optionChipUnselected: {
        backgroundColor: '#FAFAFA',
        borderColor: '#E5E7EB',
        borderWidth: 1,
    },
    optionText: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
        color: '#2F6B4F',
    },
    optionTextUnselected: {
        fontSize: 14,
        fontFamily: 'Poppins_500Medium',
        color: '#9CA3AF',
    },
    // Custom/typed pill
    customChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 100,
        backgroundColor: 'rgba(47, 107, 79, 0.1)',
        borderWidth: 1,
        borderColor: '#2F6B4F',
        gap: 6,
    },
    customChipText: {
        fontSize: 14,
        fontFamily: 'Poppins_500Medium',
        color: '#2F6B4F',
    },

    // ── Empty State ─────────────────────────────────────────
    emptyStateContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        paddingBottom: 48,
    },
    placeholderTitle: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 18,
        color: '#111111',
        marginBottom: 8,
        textAlign: 'center',
    },
    placeholderText: {
        fontFamily: 'OpenSans_400Regular',
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 260,
    },
});
