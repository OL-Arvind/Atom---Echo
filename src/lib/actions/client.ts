"use server";

import * as managementActions from "./client/management";
import * as contextActions from "./client/context";
import * as requestActions from "./client/requests";

export async function createClientAction(formData: FormData) {
  return managementActions.createClientAction(formData);
}

export async function updateClientAction(formData: FormData) {
  return managementActions.updateClientAction(formData);
}

export async function toggleEmergencyHoldAction(
  clientId: string,
  shouldHold: boolean,
  reason: string = "Founder requested emergency freeze"
) {
  return managementActions.toggleEmergencyHoldAction(clientId, shouldHold, reason);
}

export async function deleteClientAction(clientId: string) {
  return managementActions.deleteClientAction(clientId);
}

export async function addTabooWordAction(clientId: string, word: string) {
  return contextActions.addTabooWordAction(clientId, word);
}

export async function removeTabooWordAction(clientId: string, wordToRemove: string) {
  return contextActions.removeTabooWordAction(clientId, wordToRemove);
}

export async function updateClientContextAction(
  clientId: string,
  contextData: {
    positioning_statement?: string;
    target_audience_icp?: string;
    tone_archetype?: string;
    voice_guidelines?: string;
    core_pillars?: string[];
  }
) {
  return contextActions.updateClientContextAction(clientId, contextData);
}

export async function logToolExpenseAction(formData: FormData) {
  return requestActions.logToolExpenseAction(formData);
}

export async function createClientRequestAction(formData: FormData) {
  return requestActions.createClientRequestAction(formData);
}

export async function updateClientRequestStatusAction(
  requestId: string,
  newStatus: "submitted" | "in_progress" | "resolved" | "closed"
) {
  return requestActions.updateClientRequestStatusAction(requestId, newStatus);
}

export async function generateDraftInvoiceAction(clientId: string) {
  return requestActions.generateDraftInvoiceAction(clientId);
}
