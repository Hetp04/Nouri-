import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    widgetContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24, // Classic soft Apple widget rounding
        padding: 20,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 6,
        marginHorizontal: 16,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.02)',
    },
    leftColumn: {
        flex: 1,
        justifyContent: 'space-between',
        paddingRight: 16,
    },
    widgetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    widgetTitle: {
        color: '#8E8E93', // Apple system gray subtitle text
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginLeft: 6,
    },
    mainMetricContainer: {
        marginTop: 12,
        marginBottom: 2,
    },
    mainMetricValue: {
        fontSize: 46,
        fontWeight: '500', // Slightly bolder typography (Medium)
        color: '#111111',
        letterSpacing: -1.5,
        lineHeight: 50,
    },
    mainMetricLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2F6B4F', // Brand green
    },
    rightColumn: {
        flex: 1.1,
        justifyContent: 'center',
        paddingLeft: 20,
        borderLeftWidth: 1,
        borderColor: '#F2F2F7', // Native ultra-subtle iOS separator
        gap: 16, // Vertical stacking gap
    },
    widgetRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    widgetRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    widgetRowLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#3C3C43',
        marginLeft: 8,
    },
    widgetRowValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111111',
    },
});
