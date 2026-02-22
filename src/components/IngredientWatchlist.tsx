import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/ingredientWatchlist.styles';

export function IngredientWatchlist() {
    return (
        <View style={styles.widgetContainer}>
            <View style={styles.leftColumn}>
                <View style={styles.widgetHeader}>
                    <Ionicons name="bookmark" size={14} color="#8E8E93" />
                    <Text style={styles.widgetTitle}>Watchlist</Text>
                </View>
                <View style={styles.mainMetricContainer}>
                    <Text style={styles.mainMetricValue}>20</Text>
                    <Text style={styles.mainMetricLabel}>Active items</Text>
                </View>
            </View>

            <View style={styles.rightColumn}>
                <View style={styles.widgetRow}>
                    <View style={styles.widgetRowLeft}>
                        <Ionicons name="alert-circle" size={16} color="#FF3B30" />
                        <Text style={styles.widgetRowLabel}>High Risk</Text>
                    </View>
                    <Text style={styles.widgetRowValue}>10</Text>
                </View>
                <View style={styles.widgetRow}>
                    <View style={styles.widgetRowLeft}>
                        <Ionicons name="warning" size={16} color="#FF9500" />
                        <Text style={styles.widgetRowLabel}>Moderate</Text>
                    </View>
                    <Text style={styles.widgetRowValue}>7</Text>
                </View>
                <View style={styles.widgetRow}>
                    <View style={styles.widgetRowLeft}>
                        <Ionicons name="shield-checkmark" size={16} color="#34C759" />
                        <Text style={styles.widgetRowLabel}>Safe</Text>
                    </View>
                    <Text style={styles.widgetRowValue}>3</Text>
                </View>
            </View>
        </View>
    );
}

