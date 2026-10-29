import React from "react";
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getReadableControlProps, getReadableTextProps, getTestProps } from "../utils/qa";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  busy?: boolean;
  /** Ids are `modal-<prefix>`, `btn-<prefix>-cancel`, `btn-<prefix>-confirm`, `text-<prefix>-title|body`. */
  testIdPrefix: string;
  onCancel: () => void;
  onConfirm: () => void;
}

// Same look as the Checkout order confirmation modal.
export function ConfirmDialog({
  open,
  title,
  body,
  cancelLabel,
  confirmLabel,
  busy = false,
  testIdPrefix,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      {...getTestProps(`modal-${testIdPrefix}`)}
    >
      <Pressable
        style={styles.scrim}
        onPress={onCancel}
        accessibilityLabel={`btn-${testIdPrefix}-scrim`}
      >
        <Pressable
          style={styles.card}
          accessibilityViewIsModal
          accessibilityLabel={`view-${testIdPrefix}-card`}
        >
          <Text style={styles.title} {...getReadableTextProps(`text-${testIdPrefix}-title`, title)}>
            {title}
          </Text>
          <Text style={styles.body} {...getReadableTextProps(`text-${testIdPrefix}-body`, body)}>
            {body}
          </Text>

          <View style={styles.actions} accessibilityLabel={`view-${testIdPrefix}-actions`}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel]}
              onPress={onCancel}
              {...getReadableControlProps(`btn-${testIdPrefix}-cancel`, cancelLabel)}
            >
              <Text style={styles.btnCancelText} {...getReadableTextProps(`text-${testIdPrefix}-cancel`, cancelLabel)}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnConfirm, busy && styles.btnDisabled]}
              onPress={onConfirm}
              disabled={busy}
              {...getReadableControlProps(`btn-${testIdPrefix}-confirm`, confirmLabel)}
            >
              <Text style={styles.btnConfirmText} {...getReadableTextProps(`text-${testIdPrefix}-confirm`, confirmLabel)}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1E1E1E",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    padding: 24,
    alignItems: "center",
  },
  title: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    color: "#9CA3AF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    backgroundColor: "#2A2A2A",
  },
  btnCancelText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  btnConfirm: {
    backgroundColor: "#FF5722",
  },
  btnConfirmText: {
    color: "#1E1E1E",
    fontSize: 15,
    fontWeight: "800",
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
