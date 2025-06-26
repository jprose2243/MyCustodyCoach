import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { FC } from 'react';

export type PdfProps = {
  prompt: string;
  tone: string;
  response: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    fontWeight: 'bold',
  },
});

const PdfDocument: FC<PdfProps> = ({ prompt, tone, response }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>MyCustodyCoach Response</Text>
      </View>

      <View style={styles.section}>
        <Text>
          <Text style={styles.label}>Date:</Text> {new Date().toLocaleDateString()}
        </Text>
        <Text>
          <Text style={styles.label}>Tone:</Text> {tone}
        </Text>
        <Text>
          <Text style={styles.label}>Question:</Text> {prompt}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Response:</Text>
        <Text>{response}</Text>
      </View>
    </Page>
  </Document>
);

export default PdfDocument;