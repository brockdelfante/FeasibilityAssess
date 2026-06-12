import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, color: '#1A4F8A' },
  grid: { marginTop: 10 },
  row: { flexDirection: 'row' },
  cell: { width: 60, height: 30, border: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  headerCell: { backgroundColor: '#f8fafc', fontWeight: 'bold' },
});

export const SensitivityReport = ({ matrix }: { matrix: any[][] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>ROC Sensitivity Analysis Matrix</Text>
      <View style={styles.grid}>
        {matrix.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((cell, j) => (
              <View key={j} style={[styles.cell, i === 0 || j === 0 ? styles.headerCell : {}]}>
                <Text>{cell.text || (cell.roc * 100).toFixed(1) + '%'}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);
