"use server";

import * as reviewActions from "./content/review";
import * as feedbackActions from "./content/feedback";
import * as authoringActions from "./content/authoring";
import * as publishingActions from "./content/publishing";
import * as revisionActions from "./content/revisions";

export async function approvePostByClientAction(postId: string, token: string) {
  return reviewActions.approvePostByClientAction(postId, token);
}

export async function requestContentChangesByClientAction(
  postId: string,
  token: string,
  feedbackText: string,
  chips: string[] = []
) {
  return reviewActions.requestContentChangesByClientAction(postId, token, feedbackText, chips);
}

export async function sendForClientReviewAction(postIdOrClientId: string, origin?: string) {
  return reviewActions.sendForClientReviewAction(postIdOrClientId, origin);
}

export async function requestInternalRevisionAction(postId: string, note: string) {
  return feedbackActions.requestInternalRevisionAction(postId, note);
}

export async function resolveContentFeedbackAction(feedbackId: string) {
  return feedbackActions.resolveContentFeedbackAction(feedbackId);
}

export async function requestContentChangesAction(
  contentId: string,
  feedbackText: string,
  chips: string[] = []
) {
  return feedbackActions.requestContentChangesAction(contentId, feedbackText, chips);
}

export async function createContentAction(formData: FormData) {
  return authoringActions.createContentAction(formData);
}

export async function updateContentPostAction(postId: string, formData: FormData) {
  return authoringActions.updateContentPostAction(postId, formData);
}

export async function approveContentAction(contentId: string) {
  return publishingActions.approveContentAction(contentId);
}

export async function updateContentStatusAction(contentId: string, newStatus: string) {
  return publishingActions.updateContentStatusAction(contentId, newStatus);
}

export async function publishContentPostAction(
  postIdOrData: string | { postId: string; linkedin_post_url?: string; published_at?: string },
  linkedinUrlArg?: string
) {
  return publishingActions.publishContentPostAction(postIdOrData, linkedinUrlArg);
}

export async function markExpenseBilledAction(expenseId: string) {
  return publishingActions.markExpenseBilledAction(expenseId);
}

export async function saveContentVersionCheckpointAction(
  postId: string,
  payload: {
    bodyMarkdown: string;
    title?: string;
    targetPillar?: string | null;
    note?: string | null;
  }
) {
  return revisionActions.saveContentVersionCheckpointAction(postId, payload);
}

export async function restoreContentVersionAction(
  postId: string,
  targetVersionNumber: number,
  currentUnsavedBody?: string
) {
  return revisionActions.restoreContentVersionAction(postId, targetVersionNumber, currentUnsavedBody);
}
