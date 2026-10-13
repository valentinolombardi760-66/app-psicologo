import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStack = {
  Tabs: undefined;
  PatientDetail: { id: string };
  PatientForm: { id?: string };
  AppointmentForm: { id?: string; patientId?: string; date?: string };
  NoteForm: { id?: string; patientId: string; appointmentId?: string };
  ReceiptForm: { patientId?: string; appointmentIds?: string[] };
  ReceiptDetail: { id: string };
  Breathing: undefined;
};

export type ScreenProps<K extends keyof RootStack> = NativeStackScreenProps<RootStack, K>;

export const useNav = () => useNavigation<NativeStackNavigationProp<RootStack>>();
