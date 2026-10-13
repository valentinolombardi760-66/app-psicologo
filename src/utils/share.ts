import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

function webDownload(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareTextFile(name: string, content: string, mimeType: string) {
  if (Platform.OS === 'web') return webDownload(name, content, mimeType);
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}

export async function sharePDF(html: string, name: string) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  const target = new File(Paths.cache, `${name}.pdf`);
  if (target.exists) target.delete();
  new File(uri).move(target);
  await Sharing.shareAsync(target.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: name });
}

export async function readTextFile(uri: string, webFile?: globalThis.File | null): Promise<string> {
  if (Platform.OS === 'web' && webFile) return webFile.text();
  return new File(uri).text();
}
