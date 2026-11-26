import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

let modalListener = null;

/**
 * Funzione per mostrare il popup di conferma elegante.
 * Se ConfirmModalContainer è montato (in App.js), apre il modal personalizzato con lo stile B-sportlab.
 * Altrimenti usa il fallback nativo.
 */
export function confirmAction({
  title = 'Conferma operazione',
  message = 'Sei sicuro di voler procedere?',
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  isDestructive = true,
  onConfirm = () => {},
  onCancel = () => {},
}) {
  const safeTitle = title || 'Conferma operazione';
  const safeMessage = message || 'Sei sicuro di voler procedere?';
  const safeConfirmText = confirmText || 'Conferma';
  const safeCancelText = cancelText || 'Annulla';

  if (modalListener) {
    modalListener({
      visible: true,
      title: safeTitle,
      message: safeMessage,
      confirmText: safeConfirmText,
      cancelText: safeCancelText,
      isDestructive,
      onConfirm,
      onCancel,
    });
    return;
  }

  // Fallback se il modal non è ancora montato
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    const promptText = `${safeTitle}\n\n${safeMessage}`;
    if (window.confirm(promptText)) {
      onConfirm();
    } else {
      onCancel();
    }
  }
}

/**
 * Componente Modal grafico con stile personalizzato B-sportlab (tema dark + lime).
 * Da inserire in App.js per gestire tutti i dialoghi di conferma dell'app.
 */
export function ConfirmModalContainer() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    modalListener = setDialog;
    return () => {
      modalListener = null;
    };
  }, []);

  if (!dialog || !dialog.visible) return null;

  const handleConfirm = () => {
    const cb = dialog.onConfirm;
    setDialog(null);
    if (typeof cb === 'function') cb();
  };

  const handleCancel = () => {
    const cb = dialog.onCancel;
    setDialog(null);
    if (typeof cb === 'function') cb();
  };

  return (
    <Modal
      transparent
      visible={dialog.visible}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => { if (e && e.stopPropagation) e.stopPropagation(); }}>
            <View style={styles.card} onStartShouldSetResponder={() => true}>
              {dialog.title ? <Text style={styles.title}>{dialog.title}</Text> : null}
              {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.cancelBtn]}
                  onPress={handleCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>{dialog.cancelText}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btn,
                    dialog.isDestructive ? styles.destructiveBtn : styles.confirmBtn,
                  ]}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                >
                  <Text
                    style={
                      dialog.isDestructive
                        ? styles.destructiveText
                        : styles.confirmText
                    }
                  >
                    {dialog.confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#18181B',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#27272A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  btn: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  cancelText: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtn: {
    backgroundColor: '#A3E635',
  },
  confirmText: {
    color: '#050505',
    fontWeight: 'bold',
    fontSize: 14,
  },
  destructiveBtn: {
    backgroundColor: '#DC2626',
  },
  destructiveText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
