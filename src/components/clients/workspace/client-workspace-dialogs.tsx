"use client";

import React from "react";
import { AddCredentialModal } from "@/components/clients/add-credential-modal";
import { EditCredentialModal } from "@/components/clients/edit-credential-modal";
import { DeleteCredentialModal } from "@/components/clients/delete-credential-modal";
import { LogExpenseModal } from "@/components/clients/log-expense-modal";
import { EditVoiceModal } from "@/components/clients/edit-voice-modal";
import { EditClientModal } from "@/components/clients/edit-client-modal";
import type {
  ClientWithRelations,
  ClientCredential,
  ClientContext,
} from "@/types/domain";

export interface ClientWorkspaceDialogsProps {
  client: ClientWithRelations;
  context: ClientContext | null;
  // Modals state
  showAddCredModal: boolean;
  onCloseAddCredModal: () => void;
  editingCred: ClientCredential | null;
  onCloseEditCredModal: () => void;
  deletingCred: ClientCredential | null;
  onCloseDeleteCredModal: () => void;
  showAddExpenseModal: boolean;
  onCloseAddExpenseModal: () => void;
  showEditVoiceModal: boolean;
  onCloseEditVoiceModal: () => void;
  showEditClientModal: boolean;
  onCloseEditClientModal: () => void;
  onToast: (msg: string) => void;
}

export function ClientWorkspaceDialogs({
  client,
  context,
  showAddCredModal,
  onCloseAddCredModal,
  editingCred,
  onCloseEditCredModal,
  deletingCred,
  onCloseDeleteCredModal,
  showAddExpenseModal,
  onCloseAddExpenseModal,
  showEditVoiceModal,
  onCloseEditVoiceModal,
  showEditClientModal,
  onCloseEditClientModal,
  onToast,
}: ClientWorkspaceDialogsProps) {
  return (
    <>
      {/* FUNCTIONAL MODAL: ADD CREDENTIAL */}
      <AddCredentialModal
        clientId={client.id}
        isOpen={showAddCredModal}
        onClose={onCloseAddCredModal}
      />

      {/* FUNCTIONAL MODAL: EDIT CREDENTIAL */}
      <EditCredentialModal
        credential={editingCred}
        isOpen={!!editingCred}
        onClose={onCloseEditCredModal}
        onSuccess={() => onToast("Login credentials updated successfully.")}
      />

      {/* FUNCTIONAL MODAL: DELETE CREDENTIAL */}
      <DeleteCredentialModal
        credential={deletingCred}
        isOpen={!!deletingCred}
        onClose={onCloseDeleteCredModal}
        onSuccess={() => onToast("Login removed from vault.")}
      />

      {/* FUNCTIONAL MODAL: LOG SOFTWARE EXPENSE */}
      <LogExpenseModal
        clientId={client.id}
        engagements={client.engagements || []}
        isOpen={showAddExpenseModal}
        onClose={onCloseAddExpenseModal}
      />

      {/* FUNCTIONAL MODAL: EDIT VOICE & POSITIONING */}
      <EditVoiceModal
        clientId={client.id}
        isOpen={showEditVoiceModal}
        onClose={onCloseEditVoiceModal}
        initialContext={context}
        onSuccess={() => onToast("Voice & positioning parameters updated successfully.")}
      />

      {/* FUNCTIONAL MODAL: EDIT CLIENT PROFILE & COMMERCIAL TERMS */}
      <EditClientModal
        client={client}
        isOpen={showEditClientModal}
        onClose={onCloseEditClientModal}
        onSuccess={() => onToast("Client profile & commercial terms updated successfully.")}
      />
    </>
  );
}
