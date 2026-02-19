import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    input: {
        flex: 1,
        fontSize: 17, // ~16-18px
        lineHeight: 25.5, // 1.5x
        color: '#111111',
        fontFamily: 'System', // Clean sans-serif
        textAlignVertical: 'top', // For multiline on Android
        paddingTop: 0,
    },
});
