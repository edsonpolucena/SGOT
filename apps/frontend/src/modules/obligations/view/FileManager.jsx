import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import http from '../../../shared/services/http';

const FileManagerContainer = styled.div`
  padding: 20px;
`;

const FileCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FileItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #f9fafb;
`;

const FileInfo = styled.div`
  flex: 1;
`;

const FileName = styled.div`
  font-weight: 600;
  color: #374151;
  margin-bottom: 5px;
`;

const FileDetails = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const FileActions = styled.div`
  display: flex;
  gap: 10px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  
  &.primary {
    background: #3b82f6;
    color: white;
    
    &:hover {
      background: #2563eb;
    }
  }
  
  &.danger {
    background: #ef4444;
    color: white;
    
    &:hover {
      background: #dc2626;
    }
  }
`;

const UploadArea = styled.div`
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  margin-bottom: 20px;
  background: #f9fafb;
  
  &.dragover {
    border-color: #3b82f6;
    background: #eff6ff;
  }
`;

const UploadInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #2563eb;
  }
`;

export default function FileManager() {
  const { id } = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [id]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await http.get(`/api/obligations/${id}/files`);
      setFiles(response.data);
    } catch (error) {
      console.error('Erro ao carregar arquivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const selectedFiles = event.target.files;
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(selectedFiles).forEach(file => {
        formData.append('files', file);
      });

      await http.post(`/api/obligations/${id}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Recarregar lista de arquivos
      await loadFiles();
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload dos arquivos');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await http.get(`/api/obligations/files/${fileId}/download`);
      const { downloadUrl } = response.data;
      
      // Abrir URL de download em nova aba
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      alert('Erro ao baixar arquivo');
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

    try {
      await http.delete(`/api/obligations/files/${fileId}`);
      await loadFiles(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      alert('Erro ao excluir arquivo');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <FileManagerContainer>
        <div>Carregando arquivos...</div>
      </FileManagerContainer>
    );
  }

  return (
    <FileManagerContainer>
      <h2>Gerenciar Arquivos</h2>
      
      <FileCard>
        <h3>Upload de Novos Arquivos</h3>
        <UploadArea>
          <p>Arraste arquivos aqui ou clique para selecionar</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '20px' }}>
            Formatos aceitos: PDF, XML, Excel (máximo 10MB por arquivo)
          </p>
          <UploadInput
            type="file"
            multiple
            accept=".pdf,.xml,.xlsx,.xls"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <UploadButton
            onClick={() => document.querySelector('input[type="file"]').click()}
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : 'Selecionar Arquivos'}
          </UploadButton>
        </UploadArea>
      </FileCard>

      <FileCard>
        <h3>Arquivos Anexados ({files.length})</h3>
        
        {files.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '20px' }}>
            Nenhum arquivo anexado ainda
          </p>
        ) : (
          files.map(file => (
            <FileItem key={file.id}>
              <FileInfo>
                <FileName>{file.originalName}</FileName>
                <FileDetails>
                  {formatFileSize(file.fileSize)} • 
                  Enviado em {formatDate(file.createdAt)}
                </FileDetails>
              </FileInfo>
              <FileActions>
                <Button 
                  className="primary" 
                  onClick={() => handleDownload(file.id)}
                >
                  📥 Baixar
                </Button>
                <Button 
                  className="danger" 
                  onClick={() => handleDelete(file.id)}
                >
                  🗑️ Excluir
                </Button>
              </FileActions>
            </FileItem>
          ))
        )}
      </FileCard>
    </FileManagerContainer>
  );
}




