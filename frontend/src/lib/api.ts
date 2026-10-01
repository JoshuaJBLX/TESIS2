const DEFAULT_API_BASE = 'http://localhost:3000/api';

/**
 * Resuelve la URL base de la API a partir de la configuracion del entorno.
 * - VITE_API_URL      : URL explicita (Vercel, produccion, otros entornos)
 * - PUBLIC_API_ORIGIN : origen sin sufijo /api, anadido por SvelteKit
 * - fallback          : desarrollo local contra el backend en el puerto 3000
 *
 * Nota: en desarrollo local el cliente SvelteKit corre en el puerto 5173 y el
 * backend en el 3000, por lo que NO se usa window.location como origen: no hay
 * proxy configurado en vite.config.ts y `http://localhost:5173/api` no resuelve.
 */
export function resolveApiBase(): string {
  const explicit = import.meta.env?.VITE_API_URL;
  if (typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim().replace(/\/+$/, '');
  }

  const publicOrigin = import.meta.env?.PUBLIC_API_ORIGIN;
  if (typeof publicOrigin === 'string' && publicOrigin.trim()) {
    return `${publicOrigin.trim().replace(/\/+$/, '')}/api`;
  }

  return DEFAULT_API_BASE;
}

const API_BASE = resolveApiBase();

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: { limit: number; offset: number; total: number };
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

interface RegisterResponse {
  userId: string;
  username: string;
  role: string;
  publicKeyFingerprint: string;
}

interface User {
  id: string;
  username: string;
  role: string;
}

interface Document {
  id: string;
  title: string;
  description: string | null;
  owner_id: string;
  owner_username: string;
  current_version: number;
  created_at: string;
  updated_at: string;
}

interface DocumentDetail extends Document {
  latestVersion: {
    id: string;
    version_number: number;
    content_hash: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    signature_value: string;
    signature_algorithm: string;
    signer_username: string;
  };
}

interface DocumentVersion {
  id: string;
  version_number: number;
  file_name: string;
  file_size: number;
  content_hash: string;
  upload_date: string;
  change_description: string | null;
  uploader_username: string;
  signer_username: string;
  signature_algorithm: string;
}

interface UploadResult {
  documentId: string;
  versionId: string;
  versionNumber: number;
  contentHash: string;
  signature: {
    algorithm: string;
    signedAt: string;
  };
  verificationUrl: string;
  qrCode: string;
}

interface VerificationResult {
  status: 'VALID' | 'MANIPULATED' | 'NOT_FOUND' | 'INVALID_SIGNATURE' | 'FOUND';
  document?: {
    id: string;
    title: string;
    currentVersion: number;
  };
  verification?: {
    hashMatch: boolean;
    signatureValid: boolean;
    signedBy: string;
    signedAt: string;
  };
  message: string;
  matches?: any[];
}

interface AuditEntry {
  id: number; event_type: string; entity_type: string; entity_id: string;
  user_id: string | null; event_data: string; previous_hash: string | null;
  current_hash: string; created_at: string;
}

interface AuditListResponse {
  items: AuditEntry[];
  pagination: { limit: number; offset: number; total: number };
  filters?: Record<string, string | undefined>;
}

interface PublicDocument {
  id: string;
  title: string;
  description: string | null;
  is_public: number;
  created_at: string;
  updated_at: string;
  current_version: number;
  latest_version_id: string;
  latest_version_number: number;
  latest_file_name: string;
  latest_file_size: number;
  latest_mime_type: string;
  latest_content_hash: string;
  latest_upload_date: string;
  latest_change_description: string | null;
  signer_username: string;
  coauthor_username: string | null;
}

interface PublicProfile {
  user: { id: string; username: string; full_name: string; role: string; created_at: string };
  documents: PublicDocument[];
}

interface Proposal {
  id: string;
  document_id: string;
  base_version_id: string;
  file_name: string;
  file_size: number;
  content_hash: string;
  proposed_by: string;
  proposed_by_username: string;
  status: 'pending' | 'accepted' | 'rejected';
  change_description: string;
  created_at: string;
  reviewed_by_username: string | null;
  reviewed_at: string | null;
  accepted_version_id: string | null;
  base_version_number: number;
  base_file_name: string;
}

interface ComparisonResult {
  mode: 'text' | 'pdf' | 'docx' | 'binary' | 'mixed';
  supported: boolean;
  metadata: { field: string; label: string; before: string; after: string }[];
  lineDiffs: { type: 'equal' | 'insert' | 'delete'; text: string }[];
  summary: { additions: number; deletions: number; unchanged: number; textReady: boolean };
  base: { label: string; fileName: string; versionNumber?: number };
  target: { label: string; fileName: string; versionNumber?: number };
  note?: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  private refreshPromise: Promise<boolean> | null = null;

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      if (response.ok && data.success && data.data?.accessToken) {
        this.accessToken = data.data.accessToken;
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', data.data.accessToken);
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {})
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      if (response.status === 401 && this.refreshToken) {
        if (!this.refreshPromise) {
          this.refreshPromise = this.refreshAccessToken().finally(() => {
            this.refreshPromise = null;
          });
        }

        const refreshed = await this.refreshPromise;

        if (refreshed && this.accessToken) {
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
          });
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Error en el servidor' };
      }

      return { success: true, data: data.data, pagination: data.pagination };
    } catch (error) {
      return { success: false, error: 'Error de conexión con el servidor' };
    }
  }

  async login(username: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const result = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (result.success && result.data) {
      this.accessToken = result.data.accessToken;
      this.refreshToken = result.data.refreshToken;

      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', result.data.accessToken);
        localStorage.setItem('refreshToken', result.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }
    }

    return result;
  }

  async register(
    username: string,
    email: string,
    password: string,
    fullName: string
  ): Promise<ApiResponse<RegisterResponse>> {
    return this.request<RegisterResponse>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, fullName })
    });
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  // Documents
  async getDocuments(search?: string): Promise<ApiResponse<Document[]>> {
    const query = search ? `?q=${encodeURIComponent(search)}` : '';
    return this.request<Document[]>(`/docs${query}`);
  }

  async getDocument(id: string): Promise<ApiResponse<DocumentDetail>> {
    return this.request<DocumentDetail>(`/docs/${id}`);
  }

  async getDocumentVersions(id: string): Promise<ApiResponse<DocumentVersion[]>> {
    return this.request<DocumentVersion[]>(`/docs/${id}/versions`);
  }

  async getDocumentShareQr(id: string): Promise<ApiResponse<{ qrCode: string; shareUrl: string; documentId: string }>> {
    return this.request(`/docs/${id}/share-qr`);
  }

  async uploadDocument(
    file: File,
    title: string,
    description: string,
    changeDescription: string,
    password: string
  ): Promise<ApiResponse<UploadResult>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('changeDescription', changeDescription);
    formData.append('password', password);

    return this.request<UploadResult>('/docs', {
      method: 'POST',
      body: formData
    });
  }

  async updateDocument(
    documentId: string,
    file: File,
    changeDescription: string,
    password: string
  ): Promise<ApiResponse<UploadResult>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('changeDescription', changeDescription);
    formData.append('password', password);

    return this.request<UploadResult>(`/docs/${documentId}`, {
      method: 'PUT',
      body: formData
    });
  }

  async getDocumentQR(id: string): Promise<ApiResponse<{ qrCode: string; verificationUrl: string }>> {
    return this.request(`/docs/${id}/qr`);
  }

  // Sharing / downloads
  async setDocumentVisibility(id: string, isPublic: boolean): Promise<ApiResponse<{ documentId: string; isPublic: number }>> {
    return this.request(`/docs/${id}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic })
    });
  }

  downloadDocumentUrl(id: string, versionId?: string): string {
    const query = versionId ? `?versionId=${encodeURIComponent(versionId)}` : '';
    return `${API_BASE}/docs/${id}/file${query}`;
  }

  downloadProposalUrl(id: string, proposalId: string): string {
    return `${API_BASE}/docs/${id}/proposals/${proposalId}/file`;
  }

  // Autenticated download (needed for private documents, which require the JWT)
  private async downloadFileWithAuth(url: string, fallbackName: string): Promise<{ ok: boolean; error?: string }> {
    const attempt = async (token: string | null) => {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      return fetch(url, { headers });
    };
    try {
      let res = await attempt(this.accessToken);
      if (res.status === 401 && this.refreshToken) {
        if (!this.refreshPromise) {
          this.refreshPromise = this.refreshAccessToken().finally(() => {
            this.refreshPromise = null;
          });
        }
        const refreshed = await this.refreshPromise;
        if (refreshed) res = await attempt(this.accessToken);
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return { ok: false, error: (data && data.error) || 'No se pudo descargar el archivo' };
      }
      const cd = res.headers.get('Content-Disposition') || '';
      const match = cd.match(/filename\*=UTF-8''([^;]+)/i);
      const filename = match ? decodeURIComponent(match[1]) : fallbackName;
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Error de conexión con el servidor' };
    }
  }

  downloadDocument(id: string, versionId?: string): Promise<{ ok: boolean; error?: string }> {
    return this.downloadFileWithAuth(
      this.downloadDocumentUrl(id, versionId),
      versionId ? `documento-${versionId}.bin` : `documento-${id}.bin`
    );
  }

  downloadProposal(docId: string, proposalId: string): Promise<{ ok: boolean; error?: string }> {
    return this.downloadFileWithAuth(this.downloadProposalUrl(docId, proposalId), `propuesta-${proposalId}.bin`);
  }

  async getPublicProfile(username: string): Promise<ApiResponse<PublicProfile>> {
    return this.request<PublicProfile>(`/users/${encodeURIComponent(username)}`);
  }

  async getPublicDocument(id: string): Promise<ApiResponse<{ document: DocumentDetail; versions: DocumentVersion[] }>> {
    return this.request<{ document: DocumentDetail; versions: DocumentVersion[] }>(`/docs/${id}/public`);
  }

  // Proposals
  async getDocumentProposals(id: string): Promise<ApiResponse<Proposal[]>> {
    return this.request<Proposal[]>(`/docs/${id}/proposals`);
  }

  async createProposal(
    documentId: string,
    file: File,
    changeDescription: string,
    password: string
  ): Promise<ApiResponse<{ proposalId: string; documentId: string; baseVersionId: string; contentHash: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('changeDescription', changeDescription);
    formData.append('password', password);
    return this.request(`/docs/${documentId}/proposals`, {
      method: 'POST',
      body: formData
    });
  }

  async acceptProposal(documentId: string, proposalId: string, password: string): Promise<ApiResponse<any>> {
    return this.request(`/docs/${documentId}/proposals/${proposalId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
  }

  async rejectProposal(documentId: string, proposalId: string): Promise<ApiResponse<any>> {
    return this.request(`/docs/${documentId}/proposals/${proposalId}/reject`, {
      method: 'POST'
    });
  }

  // Comparison
  async compareArtifacts(
    documentId: string,
    sourceType: 'version' | 'proposal',
    sourceId: string,
    targetType: 'version' | 'proposal',
    targetId: string
  ): Promise<ApiResponse<ComparisonResult>> {
    const params = new URLSearchParams({
      sourceType, sourceId, targetType, targetId
    });
    return this.request<ComparisonResult>(`/docs/${documentId}/compare?${params.toString()}`);
  }

  // Verification (public)
  async verifyDocument(file: File, documentId?: string): Promise<ApiResponse<VerificationResult>> {
    const formData = new FormData();
    formData.append('file', file);
    if (documentId) {
      formData.append('documentId', documentId);
    }

    return this.request<VerificationResult>('/verify', {
      method: 'POST',
      body: formData
    });
  }

  async getVerificationInfo(documentId: string): Promise<ApiResponse<any>> {
    return this.request(`/verify/${documentId}`);
  }

  async getAudit(limit = 100, offset = 0, filters: { eventType?: string; entityType?: string; from?: string; to?: string } = {}): Promise<ApiResponse<AuditListResponse>> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    const result = await this.request<AuditEntry[]>(`/audit?${params.toString()}`);
    if (!result.success) return result as unknown as ApiResponse<AuditListResponse>;
    const raw = result.data as unknown as AuditEntry[];
    return { success: true, data: { items: Array.isArray(raw) ? raw : [], pagination: result.pagination || { limit, offset, total: Array.isArray(raw) ? raw.length : 0 } } };
  }

  async verifyAuditChain(): Promise<ApiResponse<{ valid: boolean; entries: number; brokenAt: number | null; reason?: string }>> {
    return this.request('/audit/verify-chain');
  }

  logout(): void {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getStoredUser(): { id: string; username: string; role: string } | null {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}

export const api = new ApiClient();
