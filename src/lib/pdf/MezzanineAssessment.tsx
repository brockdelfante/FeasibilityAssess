import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { marginBottom: 30, borderBottom: 2, borderBottomColor: '#D97706', paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#D97706' },
  subtitle: { fontSize: 12, color: '#92400e', marginTop: 4 },
  section: { marginTop: 25 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', borderBottom: 1, borderBottomColor: '#fde68a', paddingBottom: 6, marginBottom: 12, textTransform: 'uppercase', color: '#92400e' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  item: { width: '50%', marginBottom: 15 },
  label: { fontSize: 9, color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' },
  value: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginTop: 2 },
  fullWidth: { width: '100%', marginTop: 20, backgroundColor: '#fffbeb', padding: 15, borderRadius: 8 },
});

export const MezzanineAssessment = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Second Mortgage Assessment</Text>
        <Text style={styles.subtitle}>{data.projectAddress}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financing Terms</Text>
        <View style={styles.grid}>
          <View style={styles.item}>
            <Text style={styles.label}>Advance Amount</Text>
            <Text style={styles.value}>{data.mezzAmount}</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>Interest Rate (p.a.)</Text>
            <Text style={styles.value}>{(data.mezzInterestRate * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>Total Repayment</Text>
            <Text style={styles.value}>{data.results.mezzTotalRepayment}</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>Loan Term</Text>
            <Text style={styles.value}>{data.loanTermMonths} Months</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Gearing</Text>
        <View style={styles.grid}>
          <View style={styles.item}>
            <Text style={styles.label}>Blended LVR (Gross)</Text>
            <Text style={styles.value}>{(data.results.mezzLVR * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.item}>
            <Text style={styles.label}>Blended LTC</Text>
            <Text style={styles.value}>{(data.results.mezzLTC * 100).toFixed(1)}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.fullWidth}>
        <Text style={styles.label}>Position Summary</Text>
        <Text style={{ marginTop: 8, lineHeight: 1.5 }}>
          The mezzanine layer provides a critical bridge in the capital stack, representing the secondary charge position.
          Total peak debt exposure inclusive of the senior layer is evaluated against completion realisations.
        </Text>
      </View>
    </Page>
  </Document>
);
