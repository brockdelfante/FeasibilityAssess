import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 8, fontFamily: 'Helvetica' },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#1A4F8A' },
  table: { display: 'flex', width: 'auto', borderStyle: 'solid', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableColHeader: { width: '12%', borderStyle: 'solid', borderBottomWidth: 1, backgroundColor: '#f1f5f9', padding: 4 },
  tableCol: { width: '12%', borderStyle: 'solid', borderBottomWidth: 1, padding: 4 },
  tableCellHeader: { fontWeight: 'bold' },
  tableCell: {},
});

export const CashflowReport = ({ cashflow }: { cashflow: any[] }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Text style={styles.title}>Monthly Cashflow Schedule</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Month</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Date</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Draws</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Interest</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Repayment</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Opening</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Closing</Text></View>
        </View>
        {cashflow.map((row, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.tableCol}><Text>{row.month}</Text></View>
            <View style={styles.tableCol}><Text>{new Date(row.date).toLocaleDateString()}</Text></View>
            <View style={styles.tableCol}><Text>{row.draws.toFixed(0)}</Text></View>
            <View style={styles.tableCol}><Text>{row.interestCharge.toFixed(0)}</Text></View>
            <View style={styles.tableCol}><Text>{row.repayment.toFixed(0)}</Text></View>
            <View style={styles.tableCol}><Text>{row.openingBalance.toFixed(0)}</Text></View>
            <View style={styles.tableCol}><Text>{row.closingBalance.toFixed(0)}</Text></View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);
