import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
    wrapper: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
        height: 32,
        borderRadius: 100, // Dynamic Island stadium shape
        backgroundColor: 'rgba(47, 107, 79, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    editButtonText: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 13,
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
        borderWidth: 1,
        borderColor: '#F2F2F2',
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
    // Custom/typed pill — identical shape to optionChip
    customChip: {
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
    customChipText: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
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

    // ── Badge Styles ────────────────────────────────────────
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeRemove: {
        backgroundColor: '#FF3B30',
    },
    badgeAdd: {
        backgroundColor: '#2F6B4F',
    },
    badgeCloseButton: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ── Header Actions ──────────────────────────────────────
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 72,
        justifyContent: 'flex-end',
    },

    // ── ScrollView & Spacers ────────────────────────────────
    scrollViewContent: {
        flexGrow: 1,
    },
    spacer20: {
        height: 20,
    },

    // ── Pill Internals ──────────────────────────────────────
    pillIconContainer: {
        width: 16,
        height: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    pillImage: {
        width: '100%',
        height: '100%',
    },

    // ── Input Chip ──────────────────────────────────────────
    inputChip: {
        borderColor: '#10B981',
        backgroundColor: '#ECFDF5',
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    inputField: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 14,
        color: '#10B981',
        minWidth: 60,
    },

    // ── Save Floater ────────────────────────────────────────
    saveFloaterContainer: {
        position: 'absolute',
        bottom: 34,
        left: 24,
        right: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButton: {
        backgroundColor: '#111111',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonText: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 15,
        color: '#FFFFFF',
    },

    // ── Input Chip Morphed ──────────────────────────────────
    inputChipMorphed: {
        borderColor: '#2F6B4F',
        backgroundColor: '#F0F7F4',
        borderWidth: 1.5,
        minWidth: 130,
        flexShrink: 1,
    },
    inputFieldMorphed: {
        color: '#1A1A1A',
        padding: 0,
        margin: 0,
        minWidth: 80,
        flexShrink: 1,
    },

    // ── Add Custom Chip ─────────────────────────────────────
    addCustomChip: {
        borderStyle: 'dashed',
        borderWidth: 1.5,
        borderColor: '#2F6B4F',
    },
    addCustomText: {
        color: '#2F6B4F',
    },

    // ── Icons ───────────────────────────────────────────────
    iconImage: {
        width: 20,
        height: 20,
    },
    customIconContainer: {
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    customIconImage: {
        width: 18,
        height: 18,
    },

    // ── Custom Input Footer (moved from component) ──────────
    inputFooter: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#2F6B4F',
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Poppins_500Medium',
        color: '#111111',
        padding: 0,
        margin: 0,
    },
    actionBtn: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 10,
    },
    actionText: {
        fontSize: 14,
        fontFamily: 'Poppins_600SemiBold',
    },
    cancelBtn: {
        padding: 4,
    },

    // ── Extracted Helper Styles ─────────────────────────────
    actionButtonBase: {
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 0,
    },
    headerIconBase: {
        position: 'absolute',
    },
    editButtonFixed: {
        width: 32,
    },
    customIconActive: {
        opacity: 1,
    },
    customIconInactive: {
        opacity: 0.4,
    },
});
