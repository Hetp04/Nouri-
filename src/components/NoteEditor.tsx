import React, { forwardRef } from 'react';
import { View, TextInput, Text } from 'react-native';
import { styles } from '../styles/noteEditor.styles';

interface Props {
    value: string;
    onChangeText: (text: string) => void;
    readOnly?: boolean;
}

export const NoteEditor = forwardRef<TextInput, Props>(({ value, onChangeText, readOnly }, ref) => {
    if (readOnly) {
        return (
            <View style={styles.container}>
                <TextInput
                    style={[styles.input, { paddingBottom: 120 }]}
                    placeholder="Start writing..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={value}
                    editable={false}
                    showSoftInputOnFocus={false}
                    caretHidden
                    scrollEnabled={false}
                    underlineColorAndroid="transparent"
                />
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            <TextInput
                ref={ref}
                style={[styles.input, { paddingBottom: 120 }]}
                placeholder="Start writing..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={value}
                onChangeText={onChangeText}
                autoCapitalize="sentences"
                autoCorrect={true}
                scrollEnabled={false}
            />
        </View>
    );
});
