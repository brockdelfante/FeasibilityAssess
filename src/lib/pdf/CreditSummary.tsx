import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottom: 2, borderBottomColor: '#1A4F8A', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1A4F8A' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', borderBottom: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4, marginBottom: 8, textTransform: 'uppercase', color: '#64748b' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#64748b' },
  value: { fontWeight: 'bold' },
});

export const CreditSummaryReport = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Credit Committee Summary</Text>
        <Text style={styles.label}>{data.projectAddress}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Project Overview</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Customer Group</Text>
          <Text style={styles.value}>{data.customerGroup}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Deal Type</Text>
          <Text style={styles.value}>{data.dealType}</Text>
        </View>
      </View>
    </Page>
  </Document>
);
