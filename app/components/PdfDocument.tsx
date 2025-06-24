'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

type Props = {
  question: string;
  tone: string;
  response: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 12,
  },
  label: {
    fontWeight: 'bold',
  },
});

export default function PdfDocument({ question, tone, response }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>MyCustodyCoach Response</Text>

        <View style={styles.section}>
          <Text>
            <Text style={styles.label}>Date: </Text>
            {new Date().toLocaleDateString()}
          </Text>
          <Text>
            <Text style={styles.label}>Tone: </Text>
            {tone}
          </Text>
          <Text>
            <Text style={styles.label}>Question: </Text>
            {question}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Response:</Text>
          <Text>{response}</Text>
        </View>
      </Page>
    </Document>
  );
}