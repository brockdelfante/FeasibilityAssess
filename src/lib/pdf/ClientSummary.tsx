import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 40 },
  brand: { fontSize: 24, fontWeight: 'bold', color: '#1A4F8A', letterSpacing: 2 },
  title: { fontSize: 16, marginTop: 10, color: '#64748b', textTransform: 'uppercase' },
  address: { fontSize: 12, marginTop: 5, color: '#94a3b8' },
  section: { marginTop: 30 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', color: '#1e293b', borderBottom: 1, borderBottomColor: '#e2e8f0', paddingBottom: 5, marginBottom: 15 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  metricBox: { width: '30%', backgroundColor: '#f8fafc', padding: 12, borderRadius: 6 },
  metricLabel: { fontSize: 8, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  metricValue: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  footer: { position: 'absolute', bottom: 40, left: 50, right: 50, borderTop: 1, borderTopColor: '#e2e8f0', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#94a3b8' }
});

export const ClientSummary = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.brand}>SIARE</Text>
        <Text style={styles.title}>Project Feasibility Summary</Text>
        <Text style={styles.address}>{data.projectAddress}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profitability Indicators</Text>
        <View style={styles.metricRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Return on Cost</Text>
            <Text style={styles.metricValue}>{(data.results.roc * 100).toFixed(1)}%</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Total Profit</Text>
            <Text style={styles.metricValue}>{data.results.profitAmount}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Net Realisations</Text>
            <Text style={styles.metricValue}>{data.results.netRealisations}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Project Programme</Text>
        <Text style={{ lineHeight: 1.6 }}>
          Proposed commencement on {new Date(data.startDate).toLocaleDateString()}.
          Estimated build duration of {data.buildTermMonths} months with a total senior funding facility term of {data.loanTermMonths} months.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Strictly Private & Confidential</Text>
        <Text style={styles.footerText}>Generated for {data.customerGroup}</Text>
      </View>
    </Page>
  </Document>
);
