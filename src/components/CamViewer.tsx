import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

interface CamViewerProps {
  /** Raw base64 string or full data URI from the ESP32-CAM */
  base64: string | null;
  /** Optional label shown on the button */
  title?: string;
}

export default function CamViewer({ base64, title = 'ESP32-CAM' }: CamViewerProps) {
  const [visible, setVisible] = useState(false);

  const uri = base64
    ? base64.startsWith('data:image')
      ? base64
      : `data:image/jpeg;base64,${base64}`
    : null;

  return (
    <>
      <TouchableOpacity
        style={[styles.button, !uri && styles.buttonDisabled]}
        onPress={() => setVisible(true)}
        disabled={!uri}
      >
        <Text style={styles.buttonText}>View Pic</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.modalBg}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          {uri && (
            <Image
              source={{ uri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    ...typography.label,
    color: colors.white,
  },
  modalBg: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalTitle: {
    ...typography.label,
    color: colors.white,
  },
  closeBtn: {
    fontSize: 20,
    color: colors.white,
  },
  fullImage: {
    width,
    height: height * 0.8,
  },
});
