export interface UploadUrlResult {
  /** SAS URL the client must PUT the file bytes to (expires in ~15 min). */
  uploadUrl: string;

  /** Clean blob URL to persist in the database (no SAS params). */
  blobUrl: string;

  /** Relative blob name inside the container, e.g. "jobs/uuid.jpg". */
  blobName: string;

  /**
   * Whether this blob lives in the public container.
   * Public blobs can be read directly via `blobUrl`.
   * Private blobs require a SAS read URL from GET /storage/read-url.
   */
  isPublic: boolean;
}
