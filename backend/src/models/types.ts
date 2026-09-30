export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  full_name: string;
  created_at: string;
  is_active: boolean;
}

export interface UserKeys {
  id: string;
  user_id: string;
  public_key: string;
  encrypted_private_key: string;
  key_algorithm: string;
  key_fingerprint: string;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  is_public: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  content_hash: string;
  uploaded_by: string;
  coauthor_id: string | null;
  source_proposal_id: string | null;
  upload_date: string;
  change_description: string | null;
}

export interface DocumentProposal {
  id: string;
  document_id: string;
  base_version_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  content_hash: string;
  proposed_by: string;
  signature_value: string;
  signature_algorithm: string;
  signed_at: string;
  change_description: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  accepted_version_id: string | null;
  created_at: string;
}

export interface DocumentSignature {
  id: string;
  version_id: string;
  signer_id: string;
  signature_value: string;
  signature_algorithm: string;
  signed_at: string;
}

export interface AuditLog {
  id: number;
  event_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  event_data: string;
  previous_hash: string | null;
  current_hash: string;
  created_at: string;
}

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}
