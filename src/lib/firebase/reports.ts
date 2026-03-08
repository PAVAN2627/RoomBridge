// Report and safety system functions
import { 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { ReportDocument } from './types';
import { applyAutoModeration } from './autoModeration';

/**
 * Submit a safety report
 * @param reporterId - ID of user submitting the report
 * @param reportedUserId - ID of user being reported
 * @param reportType - Type of report
 * @param description - Description of the issue
 * @param evidenceUrls - Array of evidence URLs (screenshots, etc.)
 * @returns Promise resolving to the created report document
 */
export async function submitReport(
  reporterId: string,
  reportedUserId: string,
  reportType: 'fake_identity' | 'broker' | 'scam' | 'harassment',
  description: string,
  evidenceUrls: string[] = []
): Promise<ReportDocument> {
  const reportRef = doc(collection(db, 'reports'));
  const reportId = reportRef.id;
  
  const newReport: ReportDocument = {
    report_id: reportId,
    reporter_id: reporterId,
    reported_user_id: reportedUserId,
    report_type: reportType,
    description,
    evidence_urls: evidenceUrls,
    status: 'pending',
    created_at: Timestamp.now(),
  };
  
  await setDoc(reportRef, newReport);
  
  // Apply automated moderation rules
  try {
    const moderationResult = await applyAutoModeration(reportedUserId);
    console.log(`Auto-moderation applied: ${moderationResult.action} (${moderationResult.reportCount} reports)`);
  } catch (error) {
    console.error('Error applying auto-moderation:', error);
    // Don't fail the report submission if auto-moderation fails
  }
  
  return newReport;
}

/**
 * Review a report (admin only)
 * @param reportId - Report ID
 * @param reviewerId - Admin user ID
 * @param status - New status ('under_review', 'resolved', 'dismissed')
 * @param actionTaken - Description of action taken
 * @returns Promise resolving when review is complete
 */
export async function reviewReport(
  reportId: string,
  reviewerId: string,
  status: 'under_review' | 'resolved' | 'dismissed',
  actionTaken: string
): Promise<void> {
  const reportRef = doc(db, 'reports', reportId);
  const reportSnap = await getDoc(reportRef);
  
  if (!reportSnap.exists()) {
    throw new Error('Report not found');
  }
  
  const report = reportSnap.data() as ReportDocument;
  
  await updateDoc(reportRef, {
    status,
    reviewed_at: serverTimestamp(),
    reviewer_id: reviewerId,
    action_taken: actionTaken,
  });
  
  // Update moderation history
  const historyQuery = query(
    collection(db, 'users', report.reported_user_id, 'moderation_history'),
    where('report_id', '==', reportId)
  );
  
  const historySnapshot = await getDocs(historyQuery);
  historySnapshot.forEach(async (doc) => {
    await updateDoc(doc.ref, {
      status,
      reviewed_at: serverTimestamp(),
      action_taken: actionTaken,
    });
  });
}

/**
 * Ban a user (admin only)
 * @param userId - User ID to ban
 * @param reason - Reason for ban
 * @param durationDays - Duration of ban in days (0 for permanent)
 * @returns Promise resolving when ban is complete
 */
export async function banUser(
  userId: string,
  reason: string,
  durationDays: number = 0
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  
  const updates: any = {
    ban_status: 'active',
    ban_reason: reason,
    updated_at: serverTimestamp(),
  };
  
  // Calculate ban expiration if temporary
  if (durationDays > 0) {
    const expiresAt = Timestamp.fromMillis(
      Date.now() + durationDays * 24 * 60 * 60 * 1000
    );
    updates.ban_expires_at = expiresAt;
  }
  
  await updateDoc(userRef, updates);
}

/**
 * Unban a user (admin only)
 * @param userId - User ID to unban
 * @returns Promise resolving when unban is complete
 */
export async function unbanUser(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  
  await updateDoc(userRef, {
    ban_status: 'none',
    ban_reason: null,
    ban_expires_at: null,
    updated_at: serverTimestamp(),
  });
}

/**
 * Get a report by ID
 * @param reportId - Report ID
 * @returns Promise resolving to report document or null
 */
export async function getReport(reportId: string): Promise<ReportDocument | null> {
  const reportRef = doc(db, 'reports', reportId);
  const reportSnap = await getDoc(reportRef);
  
  if (!reportSnap.exists()) {
    return null;
  }
  
  return reportSnap.data() as ReportDocument;
}

/**
 * Get all pending reports (admin only)
 * @returns Promise resolving to array of pending reports
 */
export async function getPendingReports(): Promise<ReportDocument[]> {
  const reportsRef = collection(db, 'reports');
  const q = query(
    reportsRef,
    where('status', '==', 'pending'),
    orderBy('created_at', 'asc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as ReportDocument);
}

/**
 * Get all reports for a specific user (admin only)
 * @param userId - User ID
 * @returns Promise resolving to array of reports
 */
export async function getReportsByUser(userId: string): Promise<ReportDocument[]> {
  const reportsRef = collection(db, 'reports');
  const q = query(
    reportsRef,
    where('reported_user_id', '==', userId),
    orderBy('created_at', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as ReportDocument);
}

/**
 * Get report statistics for a user (admin only)
 * @param userId - User ID
 * @returns Promise resolving to report statistics
 */
export async function getUserReportStats(userId: string): Promise<{
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
  byType: { [key: string]: number };
}> {
  const reports = await getReportsByUser(userId);
  
  const stats = {
    total: reports.length,
    pending: 0,
    resolved: 0,
    dismissed: 0,
    byType: {} as { [key: string]: number },
  };
  
  reports.forEach(report => {
    // Count by status
    if (report.status === 'pending') stats.pending++;
    else if (report.status === 'resolved') stats.resolved++;
    else if (report.status === 'dismissed') stats.dismissed++;
    
    // Count by type
    stats.byType[report.report_type] = (stats.byType[report.report_type] || 0) + 1;
  });
  
  return stats;
}
