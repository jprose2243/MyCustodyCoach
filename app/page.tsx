'use client';

import { useState } from 'react';
import UploadClient from './UploadClient';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [tone, setTone] = useState('calm');
  const [response, setResponse] = useState('');

  return <UploadClient />;
}