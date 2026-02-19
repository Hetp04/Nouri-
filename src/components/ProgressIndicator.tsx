import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
    return (
        <View style={styles.container}>
            {Array.from({ length: totalSteps }).map((_, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber <= currentStep;
                const isLast = index === totalSteps - 1;
                const isLineActive = stepNumber < currentStep; // Line only active if step is completed

                return (
                    <React.Fragment key={index}>
                        {/* Node */}
                        <View
                            style={[
                                styles.node,
                                isActive && styles.nodeActive,
                            ]}
                        />
                        {/* Line connector */}
                        {!isLast && (
                            <View
                                style={[
                                    styles.line,
                                    isLineActive && styles.lineActive,
                                ]}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
    },
    node: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    nodeActive: {
        backgroundColor: '#2F6B4F',
        borderColor: '#2F6B4F',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    line: {
        flex: 1,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 6,
    },
    lineActive: {
        backgroundColor: '#2F6B4F',
    },
});
