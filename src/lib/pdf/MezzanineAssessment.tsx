import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', backgroundColor: '#FFFFFF' },
  header: { marginBottom: 30, borderBottom: 2, borderBottomColor: '#D97706', paddingBottom: 15 },
  headerMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D97706', letterSpacing: -0.5 },
  subtitle: { fontSize: 10, color: '#92400e', marginTop: 4, fontWeight: 'bold', textTransform: 'uppercase' },

  metaSection: { marginBottom: 30, backgroundColor: '#F9FAFB', padding: 15, borderRadius: 4, borderLeft: 4, borderLeftColor: '#D97706' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  metaItem: { width: '33%', marginBottom: 10 },

  section: { marginTop: 25 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', borderBottom: 1, borderBottomColor: '#E5E7EB', paddingBottom: 6, marginBottom: 15, textTransform: 'uppercase', color: '#1F2937', letterSpacing: 1 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  item: { width: '50%', marginBottom: 20 },
  label: { fontSize: 8, color: '#6B7280', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 4 },
  value: { fontSize: 14, fontWeight: 'bold', color: '#111827' },

  highlightBox: { marginTop: 20, backgroundColor: '#FFFBEB', padding: 20, borderRadius: 8, border: 1, borderColor: '#FEF3C7' },
  highlightTitle: { fontSize: 10, fontWeight: 'bold', color: '#92400E', textTransform: 'uppercase', marginBottom: 8 },
  highlightText: { fontSize: 9, color: '#B45309', lineHeight: 1.5 },

  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTop: 1, borderTopColor: '#E5E7EB', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#9CA3AF' }
});

const formatCurrency = (val: any) => {
  const num = Number(val) || 0;
  return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatPercent = (val: any) => {
  const num = (Number(val) || 0) * 100;
  return num.toFixed(1) + '%';
};

export const MezzanineAssessment = ({ data }: { data: any }) => {
  const results = data.results || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <View>
              <Text style={styles.title}>Mezzanine Assessment</Text>
              <Text style={styles.subtitle}>Second Mortgage Credit Paper</Text>
            </View>
            <View style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>SIARE PRIVATE INVESTMENTS</Text>
              <Text style={{ fontSize: 8, color: '#6B7280' }}>Internal Reference: {data.id?.substring(0,8).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.metaSection}>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Customer Group</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{data.customerGroup}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Project Address</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', maxWidth: 150 }}>{data.projectAddress}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Assessment Date</Text>
              <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{new Date().toLocaleDateString('en-AU')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Mezzanine Layer Terms</Text>
          <View style={styles.grid}>
            <View style={styles.item}>
              <Text style={styles.label}>Advance Amount</Text>
              <Text style={styles.value}>{formatCurrency(data.mezzAmount)}</Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.label}>Interest Rate (p.a.)</Text>
              <Text style={styles.value}>{formatPercent(data.mezzInterestRate)}</Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.label}>Total Repayment (est.)</Text>
              <Text style={styles.value}>{formatCurrency(results.mezzTotalRepayment)}</Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.label}>Loan Term</Text>
              <Text style={styles.value}>{data.loanTermMonths} Months</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Blended Risk Gearing</Text>
          <View style={styles.grid}>
            <View style={styles.item}>
              <Text style={styles.label}>Senior LVR (Gross)</Text>
              <Text style={styles.value}>{formatPercent(results.lvrGross)}</Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.label}>Mezzanine LVR (Total)</Text>
              <Text style={styles.value}>{formatPercent(results.mezzLVR)}</Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.label}>Senior LTC</Text>
              <Text style={styles.value}>{formatPercent(results.ltc)}</Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.label}>Mezzanine LTC (Total)</Text>
              <Text style={styles.value}>{formatPercent(results.mezzLTC)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Capital Stack Breakdown</Text>
          <View style={{ backgroundColor: '#F3F4F6', padding: 15, borderRadius: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Senior Debt Layer</Text>
              <Text style={{ fontSize: 9 }}>{formatCurrency(results.seniorFunding)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Mezzanine Layer</Text>
              <Text style={{ fontSize: 9 }}>{formatCurrency(data.mezzAmount)}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>Sponsor Cash Equity</Text>
              <Text style={{ fontSize: 9 }}>{formatCurrency(data.customerCashEquity)}</Text>
            </View>
            <View style={{ borderTop: 1, borderTopColor: '#D1D5DB', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Total Capital Stack</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{formatCurrency(results.totalDirectCosts)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>Second Mortgage Position Note</Text>
          <Text style={styles.highlightText}>
            This mezzanine facility provides gap funding between the senior debt limit and the sponsor's equity contribution.
            The second mortgage holder's position is subordinated to the senior lender.
            Exit is dependent on unit realisations after full senior debt discharge.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© Siare Private Investments — Proprietary and Confidential</Text>
          <Text style={styles.footerText}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
};
